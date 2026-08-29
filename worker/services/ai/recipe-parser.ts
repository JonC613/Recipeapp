import type { ExtractedContent, RecipeParseResult } from '../../../src/domain/recipe/imports.js'

export interface RecipeParser { parse(content: ExtractedContent): Promise<RecipeParseResult> }

export class RecipeParserError extends Error {
  readonly code: 'UNAVAILABLE' | 'INVALID_OUTPUT'
  constructor(code: 'UNAVAILABLE' | 'INVALID_OUTPUT', message: string) { super(message); this.code = code }
}
