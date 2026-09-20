import type { RecipeChatStreamEvent } from '../../src/domain/recipe-chat.js'
import { jsonError, validationError } from '../http.js'
import { addMessage, addProposal, createConversation, deleteConversation, getConversation, listConversations } from '../repositories/recipe-chat-conversations.js'
import { OpenAiRecipeAgent, validateRecipeAgentProposal, type RecipeAgentRunner } from '../services/ai/recipe-agent.js'
import { applyRecipeChatProposal, cancelRecipeChatProposal } from '../services/recipe-chat-actions.js'

type Dependencies = { runner?: RecipeAgentRunner }
const encoder = new TextEncoder()
const line = (event: RecipeChatStreamEvent) => encoder.encode(`${JSON.stringify(event)}\n`)

async function messageText(request: Request): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > 16_384) throw new Error('Recipe Chat request is too large.')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > 16_384) throw new Error('Recipe Chat request is too large.')
  const body = JSON.parse(raw) as { message?: unknown }
  const message = typeof body.message === 'string' ? body.message.trim().replace(/\s+/g, ' ') : ''
  if (!message) throw new Error('Enter a recipe question.')
  if (message.length > 600) throw new Error('Keep your question to 600 characters or fewer.')
  return message
}

function streamTurn(request: Request, env: Env, conversationId: string, runner: RecipeAgentRunner): Response {
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const abort = new AbortController()
      const timeout = setTimeout(() => abort.abort(), 45_000)
      const forwardAbort = () => abort.abort()
      request.signal.addEventListener('abort', forwardAbort, { once: true })
      let conversationExists = false
      try {
        const question = await messageText(request)
        const conversation = await getConversation(env.DB, conversationId)
        if (!conversation) { controller.enqueue(line({ type: 'error', message: 'Conversation not found.', retryable: false })); return }
        conversationExists = true
        await addMessage(env.DB, { conversationId, role: 'user', text: question })
        controller.enqueue(line({ type: 'progress', message: 'Searching your recipes…' }))
        const history = conversation.messages.filter((message) => message.status === 'complete').slice(-12).map(({ role, text }) => ({ role, text }))
        const result = await runner.run(question, history, env.DB, abort.signal)
        const known = new Map<string, string>()
        if (result.recipeIds.length) {
          const placeholders = result.recipeIds.map(() => '?').join(',')
          const { results } = await env.DB.prepare(`SELECT id, title FROM recipes WHERE id IN (${placeholders})`).bind(...result.recipeIds).all<{ id: string; title: string }>()
          for (const row of results) known.set(row.id, row.title)
        }
        if (known.size !== result.recipeIds.length) throw new Error('UNKNOWN_CITATION')
        const answer = result.answer || 'Could you clarify what you would like to do?'
        const messageId = await addMessage(env.DB, { conversationId, role: 'assistant', text: answer, sourceKind: result.sourceKind, recipeIds: result.recipeIds })
        const validatedProposal = await validateRecipeAgentProposal(env.DB, result.proposal)
        if (validatedProposal) await addProposal(env.DB, { conversationId, messageId, kind: validatedProposal.kind, summary: validatedProposal.summary, payload: validatedProposal.payload })
        for (let offset = 0; offset < answer.length; offset += 80) controller.enqueue(line({ type: 'text_delta', delta: answer.slice(offset, offset + 80) }))
        for (const recipeId of result.recipeIds) controller.enqueue(line({ type: 'recipe_reference', citation: { recipeId, title: known.get(recipeId)! } }))
        const completed = await getConversation(env.DB, conversationId)
        if (!completed) throw new Error('CONVERSATION_MISSING')
        const storedProposal = completed.messages.at(-1)?.proposal
        if (storedProposal) controller.enqueue(line({ type: 'proposal', proposal: storedProposal }))
        controller.enqueue(line({ type: 'completed', conversation: completed }))
      } catch (error) {
        const interrupted = abort.signal.aborted
        if (conversationExists) {
          await addMessage(env.DB, {
            conversationId,
            role: 'assistant',
            text: interrupted ? 'Response stopped.' : 'Recipe Chat could not complete this response.',
            status: interrupted ? 'interrupted' : 'failed',
          })
        }
        const invalid = error instanceof SyntaxError || String(error).includes('Enter a recipe') || String(error).includes('600 characters') || String(error).includes('too large')
        controller.enqueue(line({ type: 'error', message: interrupted ? 'Response stopped.' : invalid && error instanceof Error ? error.message : 'Recipe Chat is temporarily unavailable. Please try again.', retryable: !interrupted && !invalid }))
      } finally {
        clearTimeout(timeout)
        request.signal.removeEventListener('abort', forwardAbort)
        controller.close()
      }
    },
  })
  return new Response(body, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } })
}

export async function handleRecipeAssistant(request: Request, env: Env, path: string, dependencies: Dependencies = {}): Promise<Response> {
  try {
    if (path === '/api/chat/recipes') {
      if (request.method === 'GET') return Response.json(await listConversations(env.DB))
      if (request.method === 'POST') return Response.json(await createConversation(env.DB), { status: 201 })
      return new Response(null, { status: 405 })
    }
    const conversationMatch = path.match(/^\/api\/chat\/recipes\/([^/]+)$/)
    if (conversationMatch) {
      if (request.method === 'GET') {
        const conversation = await getConversation(env.DB, conversationMatch[1])
        return conversation ? Response.json(conversation) : jsonError('NOT_FOUND', 'Conversation not found.', false, 404)
      }
      if (request.method === 'DELETE') return await deleteConversation(env.DB, conversationMatch[1]) ? new Response(null, { status: 204 }) : jsonError('NOT_FOUND', 'Conversation not found.', false, 404)
      return new Response(null, { status: 405 })
    }
    const messageMatch = path.match(/^\/api\/chat\/recipes\/([^/]+)\/messages$/)
    if (messageMatch && request.method === 'POST') return streamTurn(request, env, messageMatch[1], dependencies.runner ?? new OpenAiRecipeAgent(env.OPENAI_API_KEY, env.RECIPE_CHAT_MODEL ?? env.OPENAI_MODEL))
    const proposalMatch = path.match(/^\/api\/chat\/recipes\/([^/]+)\/proposals\/([^/]+)\/(apply|cancel)$/)
    if (proposalMatch && request.method === 'POST') {
      const [, conversationId, proposalId, action] = proposalMatch
      const result = action === 'apply' ? await applyRecipeChatProposal(env.DB, conversationId, proposalId) : await cancelRecipeChatProposal(env.DB, conversationId, proposalId)
      if (result === 'missing') return jsonError('NOT_FOUND', 'Proposal not found or already resolved.', false, 404)
      if (result === 'stale') return jsonError('CONFLICT', 'This preview is out of date. Ask Recipe Chat to regenerate it.', false, 409)
      return Response.json(await getConversation(env.DB, conversationId))
    }
    return jsonError('NOT_FOUND', 'The requested chat resource was not found.', false, 404)
  } catch (error) {
    return validationError(error instanceof Error ? error.message : 'Invalid Recipe Chat request')
  }
}
