import type { RecipeChatHistoryItem, RecipeChatResponse } from '../domain/recipe-chat.js'

export async function askRecipeChat(question: string, history: RecipeChatHistoryItem[] = [], signal?: AbortSignal): Promise<RecipeChatResponse> {
  const response = await fetch('/api/chat/recipes', { method: 'POST', signal, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ question, history }) })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'Recipe Chat is temporarily unavailable. Please try again.')
  }
  return response.json() as Promise<RecipeChatResponse>
}
