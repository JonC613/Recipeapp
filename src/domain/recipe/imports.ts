import type { ManualRecipeInput, ReviewRecipeInput } from './schema.js'

export type RecipeImportStatus = 'pending' | 'ready' | 'failed' | 'no_recipe'
export type RecipeImportSourceType = 'url' | 'text' | 'pdf' | 'image' | 'mealdb'
export type TextImportFailureCode = 'NO_RECIPE' | 'MULTIPLE_RECIPES' | 'INVALID_OUTPUT' | 'UNAVAILABLE'
export type PdfImportFailureCode = 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'PDF_UNREADABLE' | 'EXTRACTION_TOO_LARGE' | 'OCR_PAGE_LIMIT'
export type ImageImportFailureCode = 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_IMAGE'
export type RecipeImportFailureCode = 'INVALID_URL' | TextImportFailureCode | PdfImportFailureCode | ImageImportFailureCode
export interface ExtractedContent { sourceType: 'text' | 'pdf'; text: string; sourceName?: string }
export type RecipeParseResult = { outcome: 'recipe'; draft: Omit<RecipeDraft, 'source'> } | { outcome: 'not_recipe' | 'multiple_recipes' }
export interface RecipeDraft extends ManualRecipeInput {
  source: { type: 'url'; originalUrl: string; importedAt: string } | { type: 'text'; importedAt: string } | { type: 'pdf'; sourceName?: string; r2ObjectKey: string; importedAt: string } | { type: 'image'; sourceName?: string; r2ObjectKey?: string; importedAt: string } | { type: 'mealdb'; originalUrl: string; providerId: string; sourceName: 'TheMealDB'; importedAt: string }
}
export interface RecipeImport {
  id: string; sourceType: RecipeImportSourceType; sourceUrl?: string; sourceText?: string; sourceName?: string; sourceR2Key?: string; status: RecipeImportStatus
  draft?: RecipeDraft; failureCode?: RecipeImportFailureCode; approvedRecipeId?: string; createdAt: string
  ocrStatus?: 'available' | 'attempted' | 'succeeded' | 'failed' | 'page_limit'; ocrAttemptedAt?: string; ocrFailureCode?: RecipeImportFailureCode; visionStatus?: 'available' | 'attempted' | 'succeeded' | 'failed'; visionAttemptedAt?: string; visionFailureCode?: RecipeImportFailureCode; extractionMethod?: 'embedded_text' | 'ocr' | 'vision'
}
export type ImportApprovalInput = ReviewRecipeInput
export class ImportError extends Error {
  readonly code: RecipeImportFailureCode
  constructor(code: RecipeImportFailureCode, message: string) { super(message); this.code = code }
}
