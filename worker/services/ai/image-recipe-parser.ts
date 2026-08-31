import type { RecipeParseResult } from '../../../src/domain/recipe/imports.js'

export interface ImageRecipeParser { parse(bytes: Uint8Array, contentType: string, sourceName?: string): Promise<RecipeParseResult> }

export class ImageRecipeParserError extends Error {
  readonly code: 'UNAVAILABLE' | 'INVALID_OUTPUT'
  constructor(code: 'UNAVAILABLE' | 'INVALID_OUTPUT') { super(code); this.code = code }
}
