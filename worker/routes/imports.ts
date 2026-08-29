import { ImportError } from '../../src/domain/recipe/imports.js'
import { importError, jsonError, textImportError } from '../http.js'
import { createFailedImport, createReadyImport, createTextFailedImport, createTextReadyImport, getImport } from '../repositories/imports.js'
import { approveImport } from '../repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import type { ManualRecipeInput } from '../../src/domain/recipe/schema.js'
import { extractRecipeDraft } from '../services/extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../services/extraction/url-fetcher.js'
import { OpenAiRecipeParser } from '../services/ai/openai-recipe-parser.js'
import { RecipeParserError, type RecipeParser } from '../services/ai/recipe-parser.js'

type UrlImportDependencies = { fetcher?: typeof fetch; now?: () => string }
type TextImportDependencies = { parser?: RecipeParser; now?: () => string }
const MAX_TEXT_LENGTH = 50_000

export async function handleTextImport(request: Request, env: Env, dependencies: TextImportDependencies = {}): Promise<Response> {
  let sourceText: string
  try {
    const body = await request.json() as { text?: unknown }
    if (typeof body.text !== 'string' || !body.text.trim()) return jsonError('VALIDATION_ERROR', 'Paste recipe text to import.', false, 400)
    if (body.text.length > MAX_TEXT_LENGTH) return jsonError('VALIDATION_ERROR', 'Recipe text must be 50,000 characters or fewer.', false, 400)
    sourceText = body.text
  } catch { return jsonError('VALIDATION_ERROR', 'Paste recipe text to import.', false, 400) }
  try {
    const parser = dependencies.parser ?? new OpenAiRecipeParser(env.OPENAI_API_KEY, env.OPENAI_MODEL)
    const result = await parser.parse({ sourceType: 'text', text: sourceText })
    if (result.outcome !== 'recipe') {
      if (result.outcome === 'not_recipe') { await createTextFailedImport(env.DB, sourceText, 'no_recipe', 'NO_RECIPE'); return textImportError('NO_RECIPE', 'That text does not appear to contain one recipe.') }
      await createTextFailedImport(env.DB, sourceText, 'failed', 'MULTIPLE_RECIPES'); return textImportError('MULTIPLE_RECIPES', 'Paste one recipe at a time and try again.')
    }
    const importedAt = dependencies.now?.() ?? new Date().toISOString()
    return Response.json(await createTextReadyImport(env.DB, sourceText, { ...result.draft, source: { type: 'text', importedAt } }), { status: 201 })
  } catch (error) {
    const code = error instanceof RecipeParserError ? error.code : 'UNAVAILABLE'
    await createTextFailedImport(env.DB, sourceText, 'failed', code)
    return textImportError(code, code === 'INVALID_OUTPUT' ? 'The recipe extraction could not be validated. Please revise the text or enter it manually.' : 'Recipe extraction is temporarily unavailable. Please try again.')
  }
}

export async function handleUrlImport(request: Request, env: Env, dependencies: UrlImportDependencies = {}): Promise<Response> {
  let sourceUrl: string | undefined
  try {
    const body = await request.json() as { url?: unknown }
    if (typeof body.url !== 'string') return importError('INVALID_URL', 'Enter a valid public recipe URL.')
    sourceUrl = validatePublicUrl(body.url).toString()
    const page = await fetchRecipePage(sourceUrl, dependencies.fetcher)
    const importedAt = dependencies.now?.() ?? new Date().toISOString()
    const draft = extractRecipeDraft(page.html, page.url, importedAt)
    return Response.json(await createReadyImport(env.DB, page.url, draft), { status: 201 })
  } catch (error) {
    if (error instanceof ImportError && sourceUrl && error.code !== 'INVALID_URL') {
      const failureCode = error.code === 'NO_RECIPE' ? 'NO_RECIPE' : 'UNAVAILABLE'
      await createFailedImport(env.DB, sourceUrl, failureCode === 'NO_RECIPE' ? 'no_recipe' : 'failed', failureCode)
    }
    if (error instanceof ImportError) return importError(error.code === 'NO_RECIPE' ? 'NO_RECIPE' : error.code === 'INVALID_URL' ? 'INVALID_URL' : 'UNAVAILABLE', error.message)
    return importError('UNAVAILABLE', 'That recipe page is temporarily unavailable. Please try again.')
  }
}

export async function handleImport(request: Request, env: Env, importId: string): Promise<Response> {
  if (request.method !== 'GET') return new Response(null, { status: 405 })
  const imported = await getImport(env.DB, importId)
  return imported ? Response.json(imported) : jsonError('NOT_FOUND', 'The requested import was not found.', false, 404)
}

export async function handleImportApproval(request: Request, env: Env, importId: string): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  let body: { favorite?: unknown }
  let recipe: ReturnType<typeof normalizeManualRecipe>
  try {
    body = await request.json() as { favorite?: unknown }
    if (body.favorite != null && typeof body.favorite !== 'boolean') return jsonError('VALIDATION_ERROR', 'favorite must be true or false', false, 400)
    recipe = normalizeManualRecipe(body as ManualRecipeInput)
  } catch (error) { return jsonError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Invalid reviewed recipe.', false, 400) }
  try {
    const result = await approveImport(env.DB, importId, recipe, body.favorite === true)
    if (result.reason === 'missing') return jsonError('NOT_FOUND', 'The requested import was not found.', false, 404)
    if (result.reason !== 'approved') return jsonError('CONFLICT', 'This import is not available for review.', false, 409)
    return Response.json(result.recipe, { status: 201 })
  } catch { return jsonError('SERVICE_UNAVAILABLE', 'The reviewed recipe could not be saved. Please try again.', true, 503) }
}
