import { ImportError } from '../../src/domain/recipe/imports.js'
import type { DiscoveryPreview, DiscoverySearchResponse } from '../../src/domain/recipe/discovery.js'
import { jsonError, jsonResponse, validationError } from '../http.js'
import { approveDiscoverySite, findApprovedDiscoverySiteByOrigin, listApprovedDiscoverySites, listDiscoverySites, upsertDiscoveryValidation } from '../repositories/discovery-sites.js'
import { extractRecipeDraft } from '../services/extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../services/extraction/url-fetcher.js'
import { canonicalDiscoveryOrigin, searchWordPressSite, validateDiscoverySite } from '../services/discovery/wordpress.js'

type Dependencies = {
  fetcher?: typeof fetch
  now?: () => string
  validator?: typeof validateDiscoverySite
  searcher?: typeof searchWordPressSite
}

function safeFailure(message = 'Recipe discovery is temporarily unavailable. Please try again.'): Response {
  return jsonError('SERVICE_UNAVAILABLE', message, true, 503)
}

export async function handleDiscovery(request: Request, env: Env, pathname: string, dependencies: Dependencies = {}): Promise<Response> {
  if (pathname === '/api/beta/discovery/sites' && request.method === 'GET') return jsonResponse(await listDiscoverySites(env.DB))

  if (pathname === '/api/beta/discovery/sites/validate' && request.method === 'POST') {
    let value: string
    try {
      const body = await request.json() as { url?: unknown }
      if (typeof body.url !== 'string' || body.url.length > 2_000) return validationError('Enter a public HTTPS site URL.')
      value = body.url
    } catch { return validationError('Enter a public HTTPS site URL.') }
    try {
      const result = await (dependencies.validator ?? validateDiscoverySite)(value, dependencies.fetcher)
      return jsonResponse(await upsertDiscoveryValidation(env.DB, result.origin, result.hostname, result.report, dependencies.now?.()), { status: 201 })
    } catch (error) {
      if (error instanceof ImportError) return validationError(error.message)
      return safeFailure('That site could not be checked. Please try again.')
    }
  }

  const approvalMatch = pathname.match(/^\/api\/beta\/discovery\/sites\/([^/]+)\/approve$/)
  if (approvalMatch && request.method === 'POST') {
    const site = await approveDiscoverySite(env.DB, approvalMatch[1], dependencies.now?.())
    return site ? jsonResponse(site) : jsonError('CONFLICT', 'This site has not passed compatibility checks.', false, 409)
  }

  if (pathname === '/api/beta/discovery/search' && request.method === 'GET') {
    const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
    if (!query || query.length > 100) return validationError('Enter a search between 1 and 100 characters.')
    const sites = await listApprovedDiscoverySites(env.DB)
    const settled = await Promise.allSettled(sites.map((site) => site.adapter === 'wordpress_rest' ? (dependencies.searcher ?? searchWordPressSite)(site, query, dependencies.fetcher) : Promise.resolve([])))
    const response: DiscoverySearchResponse = {
      results: settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []).slice(0, 50),
      sitesSearched: sites.length,
      sitesUnavailable: settled.filter((result) => result.status === 'rejected').length,
    }
    return jsonResponse(response)
  }

  if (pathname === '/api/beta/discovery/preview' && request.method === 'GET') {
    const value = new URL(request.url).searchParams.get('url') ?? ''
    let source: URL
    try { source = validatePublicUrl(value) } catch { return validationError('Choose a valid approved recipe URL.') }
    if (source.protocol !== 'https:') return validationError('Choose a valid approved recipe URL.')
    const site = await findApprovedDiscoverySiteByOrigin(env.DB, source.origin)
    if (!site) return jsonError('NOT_FOUND', 'That recipe is not from an approved site.', false, 404)
    try {
      const page = await fetchRecipePage(source.toString(), dependencies.fetcher)
      if (canonicalDiscoveryOrigin(page.url).origin !== site.origin) return jsonError('NOT_FOUND', 'That recipe is not from an approved site.', false, 404)
      const preview: DiscoveryPreview = { sourceUrl: page.url, siteHostname: site.hostname, draft: extractRecipeDraft(page.html, page.url, dependencies.now?.() ?? new Date().toISOString()) }
      return jsonResponse(preview)
    } catch (error) {
      if (error instanceof ImportError && error.code === 'NO_RECIPE') return jsonError('NO_RECIPE', error.message, false, 422)
      return safeFailure('That recipe could not be previewed. Please try again.')
    }
  }

  return request.method === 'GET' || request.method === 'POST'
    ? jsonError('NOT_FOUND', 'The requested discovery route was not found.', false, 404)
    : new Response(null, { status: 405 })
}
