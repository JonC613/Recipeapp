import { ImportError } from '../../src/domain/recipe/imports.js'
import { importError, jsonError } from '../http.js'
import { createFailedImport, createReadyImport, getImport } from '../repositories/imports.js'
import { approveImport } from '../repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import type { ManualRecipeInput } from '../../src/domain/recipe/schema.js'
import { extractRecipeDraft } from '../services/extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../services/extraction/url-fetcher.js'

type UrlImportDependencies = { fetcher?: typeof fetch; now?: () => string }

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
      await createFailedImport(env.DB, sourceUrl, error.code === 'NO_RECIPE' ? 'no_recipe' : 'failed', error.code)
    }
    if (error instanceof ImportError) return importError(error.code, error.message)
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
