import type { ManualRecipeInput, ReviewRecipeInput } from './schema.js'

export type RecipeImportStatus = 'ready' | 'failed' | 'no_recipe'
export interface RecipeDraft extends ManualRecipeInput {
  source: { type: 'url'; originalUrl: string; importedAt: string }
}
export interface RecipeImport {
  id: string; sourceType: 'url'; sourceUrl: string; status: RecipeImportStatus
  draft?: RecipeDraft; failureCode?: 'INVALID_URL' | 'NO_RECIPE' | 'UNAVAILABLE'; approvedRecipeId?: string; createdAt: string
}
export type ImportApprovalInput = ReviewRecipeInput
export class ImportError extends Error {
  readonly code: 'INVALID_URL' | 'NO_RECIPE' | 'UNAVAILABLE'
  constructor(code: 'INVALID_URL' | 'NO_RECIPE' | 'UNAVAILABLE', message: string) { super(message); this.code = code }
}
