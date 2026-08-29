import type { ManualRecipeInput, ReviewRecipeInput } from './schema.js'

export type RecipeImportStatus = 'ready' | 'failed' | 'no_recipe'
export type RecipeImportSourceType = 'url' | 'text'
export type TextImportFailureCode = 'NO_RECIPE' | 'MULTIPLE_RECIPES' | 'INVALID_OUTPUT' | 'UNAVAILABLE'
export type RecipeImportFailureCode = 'INVALID_URL' | TextImportFailureCode
export interface ExtractedContent { sourceType: 'text'; text: string }
export type RecipeParseResult = { outcome: 'recipe'; draft: Omit<RecipeDraft, 'source'> } | { outcome: 'not_recipe' | 'multiple_recipes' }
export interface RecipeDraft extends ManualRecipeInput {
  source: { type: 'url'; originalUrl: string; importedAt: string } | { type: 'text'; importedAt: string }
}
export interface RecipeImport {
  id: string; sourceType: RecipeImportSourceType; sourceUrl?: string; sourceText?: string; status: RecipeImportStatus
  draft?: RecipeDraft; failureCode?: RecipeImportFailureCode; approvedRecipeId?: string; createdAt: string
}
export type ImportApprovalInput = ReviewRecipeInput
export class ImportError extends Error {
  readonly code: RecipeImportFailureCode
  constructor(code: RecipeImportFailureCode, message: string) { super(message); this.code = code }
}
