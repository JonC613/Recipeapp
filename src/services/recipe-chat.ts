import type { RecipeChatConversation, RecipeChatConversationSummary, RecipeChatHistoryItem, RecipeChatResponse, RecipeChatStreamEvent } from '../domain/recipe-chat.js'

export async function askRecipeChat(question: string, history: RecipeChatHistoryItem[] = [], signal?: AbortSignal): Promise<RecipeChatResponse> {
  const response = await fetch('/api/chat/recipes', { method: 'POST', signal, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ question, history }) })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'Recipe Chat is temporarily unavailable. Please try again.')
  }
  return response.json() as Promise<RecipeChatResponse>
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'Recipe Chat is temporarily unavailable. Please try again.')
  }
  return response.json() as Promise<T>
}

export const listRecipeChatConversations = () => jsonRequest<RecipeChatConversationSummary[]>('/api/chat/recipes')
export const createRecipeChatConversation = () => jsonRequest<RecipeChatConversation>('/api/chat/recipes', { method: 'POST' })
export const getRecipeChatConversation = (id: string) => jsonRequest<RecipeChatConversation>(`/api/chat/recipes/${encodeURIComponent(id)}`)
export async function deleteRecipeChatConversation(id: string): Promise<void> {
  const response = await fetch(`/api/chat/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) throw new Error('The conversation could not be deleted.')
}
export const resolveRecipeChatProposal = (conversationId: string, proposalId: string, action: 'apply' | 'cancel') => jsonRequest<RecipeChatConversation>(`/api/chat/recipes/${encodeURIComponent(conversationId)}/proposals/${encodeURIComponent(proposalId)}/${action}`, { method: 'POST' })

export async function streamRecipeChatMessage(conversationId: string, message: string, onEvent: (event: RecipeChatStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`/api/chat/recipes/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', signal, headers: { accept: 'application/x-ndjson', 'content-type': 'application/json' }, body: JSON.stringify({ message }) })
  if (!response.ok || !response.body) throw new Error('Recipe Chat is temporarily unavailable. Please try again.')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let buffered = ''
  for (;;) {
    const chunk = await reader.read()
    buffered += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done })
    const lines = buffered.split('\n'); buffered = lines.pop() ?? ''
    for (const value of lines) if (value.trim()) onEvent(JSON.parse(value) as RecipeChatStreamEvent)
    if (chunk.done) break
  }
  if (buffered.trim()) onEvent(JSON.parse(buffered) as RecipeChatStreamEvent)
}
