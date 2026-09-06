import type { RecipeChatHistoryItem, RecipeChatResponse } from '../../src/domain/recipe-chat.js'
import { jsonError, jsonResponse, validationError } from '../http.js'
import { listRecipeChatContext, listRecipeChatContextByIds, parseRecipeChatQuery } from '../repositories/recipes.js'
import { OpenAiRecipeChat } from '../services/ai/openai-recipe-chat.js'
import { RecipeChatError, type RecipeChatProvider } from '../services/ai/recipe-chat.js'

const MAX_QUESTION_LENGTH = 600, MAX_BODY_BYTES = 16 * 1024, MAX_HISTORY = 3, MAX_HISTORY_CHARS = 8_000
const noMatchMessage = 'No matching saved recipes were found. Try a different ingredient, dish, or cooking term, or add a recipe first.'
type Dependencies = { provider?: RecipeChatProvider; listContext?: typeof listRecipeChatContext; listContextByIds?: typeof listRecipeChatContextByIds }

function questionFrom(value: unknown): string {
  const question = typeof (value as { question?: unknown })?.question === 'string' ? (value as { question: string }).question.trim().replace(/\s+/g, ' ') : ''
  if (!question) throw new Error('Enter a recipe question.')
  if (question.length > MAX_QUESTION_LENGTH) throw new Error(`Keep your question to ${MAX_QUESTION_LENGTH} characters or fewer.`)
  return question
}
async function requestBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader(); if (!reader) throw new Error('Enter a valid recipe question.')
  let bytes = 0, text = ''; const decoder = new TextDecoder()
  for (;;) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.byteLength; if (bytes > MAX_BODY_BYTES) throw new Error('Keep the chat request smaller.'); text += decoder.decode(chunk.value, { stream: true }) }
  try { return JSON.parse(text) } catch { throw new Error('Enter a valid recipe question.') }
}
function historyFrom(value: unknown): RecipeChatHistoryItem[] {
  const raw = (value as { history?: unknown })?.history; if (raw === undefined) return []
  if (!Array.isArray(raw) || raw.length > MAX_HISTORY) throw new Error('Conversation context is not valid. Start a new conversation.')
  const history = raw.map((entry) => { const item = entry as Partial<RecipeChatHistoryItem>; if (typeof item.question !== 'string' || typeof item.answer !== 'string' || !Array.isArray(item.citationIds) || !item.citationIds.every((id) => typeof id === 'string')) throw new Error('Conversation context is not valid. Start a new conversation.'); return { question: item.question.slice(0, 600), answer: item.answer.slice(0, 2400), citationIds: item.citationIds.slice(0, 12) } })
  if (history.reduce((sum, item) => sum + item.question.length + item.answer.length + item.citationIds.join('').length, 0) > MAX_HISTORY_CHARS) throw new Error('Conversation context is too long. Start a new conversation.')
  return history
}

export async function handleRecipeChat(request: Request, env: Env, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== 'POST') return jsonError('METHOD_NOT_ALLOWED', 'Method not allowed.', false, 405)
  let question: string, input: unknown, history: RecipeChatHistoryItem[]
  try { input = await requestBody(request); question = questionFrom(input); history = historyFrom(input) }
  catch (error) { return validationError(error instanceof Error ? error.message : 'Enter a valid recipe question.') }
  const parsed = parseRecipeChatQuery(question)
  if (parsed.clarification) return jsonResponse({ outcome: 'clarification', message: parsed.clarification } satisfies RecipeChatResponse)
  const asksFollowUp = /\b(?:those|them)\b/i.test(question)
  const citedIds = history.at(-1)?.citationIds ?? []
  if (asksFollowUp && !citedIds.length) return jsonResponse({ outcome: 'clarification', message: 'Tell me which recipes you would like to compare first.' } satisfies RecipeChatResponse)
  let candidates
  try { candidates = asksFollowUp ? await (dependencies.listContextByIds ?? listRecipeChatContextByIds)(env.DB, citedIds) : await (dependencies.listContext ?? listRecipeChatContext)(env.DB, question) }
  catch { return jsonError('SERVICE_UNAVAILABLE', 'Recipe Chat is temporarily unavailable. Please try again.', true, 503) }
  if (candidates.length === 0) return jsonResponse({ outcome: 'no_match', message: noMatchMessage } satisfies RecipeChatResponse)
  try {
    const result = await (dependencies.provider ?? new OpenAiRecipeChat(env.OPENAI_API_KEY, env.OPENAI_MODEL)).answer(question, candidates, history)
    if (result.outcome && result.outcome !== 'answer') return jsonResponse({ outcome: result.outcome, message: result.message ?? noMatchMessage } satisfies RecipeChatResponse)
    const candidateTitles = new Map(candidates.map((recipe) => [recipe.id, recipe.title]))
    const seen = new Set<string>()
    const citations = result.citationIds.map((recipeId) => {
      const title = candidateTitles.get(recipeId)
      if (!title) throw new RecipeChatError('INVALID_OUTPUT', 'UNKNOWN_CITATION')
      if (seen.has(recipeId)) return undefined
      seen.add(recipeId)
      return { recipeId, title }
    }).filter((citation): citation is { recipeId: string; title: string } => Boolean(citation))
    if (citations.length === 0) throw new RecipeChatError('INVALID_OUTPUT', 'NO_CITATIONS')
    return jsonResponse({ outcome: 'answer', answer: result.answer!, citations, ...(candidates.length >= 12 ? { contextLimited: true } : {}) } satisfies RecipeChatResponse)
  } catch (error) {
    if (error instanceof RecipeChatError && error.code === 'INVALID_OUTPUT') { console.warn('Recipe Chat response rejected.', { reason: error.message }); return jsonError('INVALID_OUTPUT', 'Recipe Chat returned an unusable answer. Please try again.', true, 503) }
    return jsonError('SERVICE_UNAVAILABLE', 'Recipe Chat is temporarily unavailable. Please try again.', true, 503)
  }
}
