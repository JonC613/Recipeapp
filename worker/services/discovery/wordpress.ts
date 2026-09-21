import type { DiscoverySearchResult, DiscoverySite, DiscoveryValidationReport } from '../../../src/domain/recipe/discovery.js'
import { ImportError } from '../../../src/domain/recipe/imports.js'
import { extractRecipeDraft } from '../extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../extraction/url-fetcher.js'

const MAX_REDIRECTS = 3
const MAX_TEXT_BYTES = 256_000
const REQUEST_TIMEOUT_MS = 5_000
const MAX_RESULTS = 10
const MAX_SAMPLE_RESULTS = 3
const USER_AGENT = 'Recipeapp Site Discovery/0.1 (+owner-managed beta)'

type WordPressResult = { id?: unknown; title?: unknown; url?: unknown; subtype?: unknown }

export function canonicalDiscoveryOrigin(value: string): URL {
  const url = validatePublicUrl(value)
  if (url.protocol !== 'https:') throw new ImportError('INVALID_URL', 'Enter a public HTTPS site URL.')
  return new URL(url.origin)
}

async function fetchBounded(value: URL, accept: string, fetcher: typeof fetch, expected: 'json' | 'text'): Promise<{ url: URL; text: string }> {
  let url = value
  const origin = value.origin
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetcher(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { accept, 'user-agent': USER_AGENT } })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location || redirects === MAX_REDIRECTS) throw new Error('redirect')
      const next = canonicalDiscoveryOrigin(new URL(location, url).toString())
      const destination = validatePublicUrl(new URL(location, url).toString())
      if (next.origin !== origin || destination.origin !== origin) throw new Error('cross-origin')
      url = destination
      continue
    }
    if (!response.ok) throw new Error('unavailable')
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (expected === 'json' && !contentType.includes('json')) throw new Error('content-type')
    if (expected === 'text' && !(contentType.includes('text') || contentType.includes('plain'))) throw new Error('content-type')
    if (Number(response.headers.get('content-length') ?? 0) > MAX_TEXT_BYTES) throw new Error('oversized')
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > MAX_TEXT_BYTES) throw new Error('oversized')
    return { url, text }
  }
  throw new Error('unavailable')
}

function searchUrl(origin: string, query: string): URL {
  const url = new URL('/wp-json/wp/v2/search', origin)
  url.searchParams.set('search', query)
  url.searchParams.set('subtype', 'post')
  url.searchParams.set('per_page', String(MAX_RESULTS))
  return url
}

function decodeTitle(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#039;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').trim()
}

function parseWordPressResults(text: string, site: Pick<DiscoverySite, 'id' | 'origin' | 'hostname'>): { results: DiscoverySearchResult[]; hadCrossOrigin: boolean } {
  const payload = JSON.parse(text) as unknown
  if (!Array.isArray(payload)) throw new Error('invalid-response')
  let hadCrossOrigin = false
  const results: DiscoverySearchResult[] = []
  for (const item of payload.slice(0, MAX_RESULTS) as WordPressResult[]) {
    if ((typeof item.id !== 'number' && typeof item.id !== 'string') || typeof item.title !== 'string' || typeof item.url !== 'string') continue
    let url: URL
    try { url = validatePublicUrl(item.url) } catch { continue }
    if (url.protocol !== 'https:' || url.origin !== site.origin) { hadCrossOrigin = true; continue }
    const title = decodeTitle(item.title)
    if (!title) continue
    results.push({ id: `${site.id}:${String(item.id)}`, title, url: url.toString(), siteId: site.id, siteHostname: site.hostname })
  }
  return { results, hadCrossOrigin }
}

export async function searchWordPressSite(site: Pick<DiscoverySite, 'id' | 'origin' | 'hostname'>, query: string, fetcher: typeof fetch = fetch): Promise<DiscoverySearchResult[]> {
  const response = await fetchBounded(searchUrl(site.origin, query), 'application/json', fetcher, 'json')
  return parseWordPressResults(response.text, site).results
}

export function robotsAllows(robots: string, path: string): boolean {
  const lines = robots.split(/\r?\n/).map((line) => line.replace(/#.*$/, '').trim()).filter(Boolean)
  let applies = false
  const rules: Array<{ allow: boolean; value: string }> = []
  for (const line of lines) {
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (key === 'user-agent') { applies = value === '*'; continue }
    if (applies && (key === 'allow' || key === 'disallow') && value) rules.push({ allow: key === 'allow', value })
  }
  const matches = rules.filter((rule) => path.startsWith(rule.value)).sort((a, b) => b.value.length - a.value.length)
  return matches[0]?.allow ?? true
}

function reportCriterion(id: DiscoveryValidationReport['criteria'][number]['id'], passed: boolean, message: string) { return { id, passed, message } }

export async function validateDiscoverySite(value: string, fetcher: typeof fetch = fetch): Promise<{ origin: string; hostname: string; report: DiscoveryValidationReport }> {
  const base = canonicalDiscoveryOrigin(value)
  const criteria: DiscoveryValidationReport['criteria'] = [reportCriterion('https', true, 'Uses public HTTPS.')]
  let robots = ''
  try {
    robots = (await fetchBounded(new URL('/robots.txt', base), 'text/plain', fetcher, 'text')).text
    const allowed = robotsAllows(robots, '/wp-json/wp/v2/search')
    criteria.push(reportCriterion('robots', allowed, allowed ? 'Public discovery paths are allowed.' : 'Robots rules disallow the search path.'))
    if (!allowed) return { origin: base.origin, hostname: base.hostname, report: { compatible: false, criteria } }
  } catch {
    criteria.push(reportCriterion('robots', false, 'Robots rules could not be verified.'))
    return { origin: base.origin, hostname: base.hostname, report: { compatible: false, criteria } }
  }

  let parsed: ReturnType<typeof parseWordPressResults>
  try {
    const response = await fetchBounded(searchUrl(base.origin, 'recipe'), 'application/json', fetcher, 'json')
    parsed = parseWordPressResults(response.text, { id: 'candidate', origin: base.origin, hostname: base.hostname })
    const available = parsed.results.length > 0
    criteria.push(reportCriterion('search', available, available ? 'A supported site search is available.' : 'The supported search returned no usable results.'))
    criteria.push(reportCriterion('same_origin', !parsed.hadCrossOrigin, parsed.hadCrossOrigin ? 'Search returned an off-site result.' : 'Search results stay on this site.'))
    if (!available || parsed.hadCrossOrigin) return { origin: base.origin, hostname: base.hostname, report: { compatible: false, criteria } }
  } catch {
    criteria.push(reportCriterion('search', false, 'A supported WordPress search was not available.'))
    return { origin: base.origin, hostname: base.hostname, report: { compatible: false, criteria } }
  }

  try {
    let hasRecipe = false
    for (const result of parsed.results.slice(0, MAX_SAMPLE_RESULTS)) {
      try {
        const sampleUrl = new URL(result.url)
        if (!robotsAllows(robots, sampleUrl.pathname)) continue
        const page = await fetchRecipePage(sampleUrl.toString(), fetcher)
        if (new URL(page.url).origin !== base.origin) continue
        extractRecipeDraft(page.html, page.url, new Date().toISOString())
        hasRecipe = true
        break
      } catch { /* Try the next bounded same-origin result. */ }
    }
    if (!hasRecipe) throw new Error('no-usable-recipe')
    criteria.push(reportCriterion('recipe', true, 'A sample result contains one structured recipe.'))
  } catch {
    criteria.push(reportCriterion('recipe', false, 'A sample result did not provide one usable structured recipe.'))
  }
  const compatible = criteria.every((criterion) => criterion.passed)
  return { origin: base.origin, hostname: base.hostname, report: { compatible, adapter: compatible ? 'wordpress_rest' : undefined, criteria } }
}
