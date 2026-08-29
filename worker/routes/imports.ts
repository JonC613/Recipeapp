import { ImportError } from '../../src/domain/recipe/imports.js'
import { importError, jsonError } from '../http.js'
import { createFailedImport, createReadyImport, getImport } from '../repositories/imports.js'
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
