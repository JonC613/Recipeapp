export interface RecipeChatCitation {
  recipeId: string
  title: string
}

export interface RecipeChatAnswer {
  outcome: 'answer'
  answer: string
  citations: RecipeChatCitation[]
  contextLimited?: boolean
}

export interface RecipeChatNoMatch {
  outcome: 'no_match'
  message: string
}

export interface RecipeChatClarification { outcome: 'clarification'; message: string }
export interface RecipeChatHistoryItem { question: string; answer: string; citationIds: string[] }
export type RecipeChatResponse = RecipeChatAnswer | RecipeChatNoMatch | RecipeChatClarification

export type RecipeChatSourceKind = 'library' | 'general' | 'mixed'
export type RecipeChatProposalStatus = 'pending' | 'applied' | 'cancelled' | 'stale' | 'failed'
export type RecipeChatProposalKind = 'recipe_variation' | 'generated_recipe' | 'meal_plan' | 'grocery_update'

export interface RecipeChatProposal {
  id: string
  kind: RecipeChatProposalKind
  summary: string
  status: RecipeChatProposalStatus
  preview: Record<string, unknown>
  result?: Record<string, unknown>
}

export interface RecipeChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  sourceKind?: RecipeChatSourceKind
  citations: RecipeChatCitation[]
  status: 'running' | 'complete' | 'interrupted' | 'failed'
  proposal?: RecipeChatProposal
  createdAt: string
}

export interface RecipeChatConversationSummary { id: string; title: string; createdAt: string; updatedAt: string }
export interface RecipeChatConversation extends RecipeChatConversationSummary { messages: RecipeChatMessage[] }

export type RecipeChatStreamEvent =
  | { type: 'progress'; message: string }
  | { type: 'text_delta'; delta: string }
  | { type: 'recipe_reference'; citation: RecipeChatCitation }
  | { type: 'proposal'; proposal: RecipeChatProposal }
  | { type: 'completed'; conversation: RecipeChatConversation }
  | { type: 'error'; message: string; retryable: boolean }
