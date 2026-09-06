export interface RecipeChatContext {
  id: string
  title: string
  description?: string
  cuisine?: string
  category?: string
  tags: string[]
  notes?: string
  ingredients: string[]
  instructions: string[]
  servings?: number
  prepMinutes?: number
  cookMinutes?: number
  totalMinutes?: number
  favorite?: boolean
}

export interface RecipeChatHistoryItem { question: string; answer: string; citationIds: string[] }
export interface RecipeChatProviderResult {
  outcome?: 'answer' | 'no_match' | 'clarification'
  answer?: string
  message?: string
  citationIds: string[]
}

export interface RecipeChatProvider {
  answer(question: string, recipes: RecipeChatContext[], history?: RecipeChatHistoryItem[]): Promise<RecipeChatProviderResult>
}

export class RecipeChatError extends Error {
  readonly code: 'UNAVAILABLE' | 'INVALID_OUTPUT' | 'TIMEOUT'
  constructor(code: 'UNAVAILABLE' | 'INVALID_OUTPUT' | 'TIMEOUT', reason: string = code) { super(reason); this.code = code }
}
