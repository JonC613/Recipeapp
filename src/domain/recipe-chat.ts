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
