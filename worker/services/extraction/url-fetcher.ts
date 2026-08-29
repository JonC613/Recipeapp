import { ImportError } from '../../../src/domain/recipe/imports.js'

const MAX_REDIRECTS = 3
const MAX_BYTES = 1_000_000

export function validatePublicUrl(value: string): URL {
  let url: URL
  try { url = new URL(value) } catch { throw new ImportError('INVALID_URL', 'Enter a valid public recipe URL.') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateHost(url.hostname)) {
    throw new ImportError('INVALID_URL', 'Enter a valid public recipe URL.')
  }
  return url
}

export async function fetchRecipePage(value: string, fetcher: typeof fetch = fetch): Promise<{ url: string; html: string }> {
  let url = validatePublicUrl(value)
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    let response: Response
    try { response = await fetcher(url, { method: 'GET', redirect: 'manual', headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'Recipeapp URL Import/0.1 (+local development)' } }) }
    catch { throw new ImportError('UNAVAILABLE', 'That recipe page is temporarily unavailable. Please try again.') }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location || redirects === MAX_REDIRECTS) throw new ImportError('UNAVAILABLE', 'That recipe page could not be reached. Please try again.')
      url = validatePublicUrl(new URL(location, url).toString()); continue
    }
    if ([401, 403, 429].includes(response.status)) throw new ImportError('UNAVAILABLE', 'This recipe site does not allow imports. Try another URL or enter it manually.')
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('html')) throw new ImportError('UNAVAILABLE', 'That recipe page is temporarily unavailable. Please try again.')
    const length = Number(response.headers.get('content-length') ?? 0)
    if (length > MAX_BYTES) throw new ImportError('UNAVAILABLE', 'That recipe page is too large to import. Please try another URL.')
    const html = await response.text()
    if (new TextEncoder().encode(html).byteLength > MAX_BYTES) throw new ImportError('UNAVAILABLE', 'That recipe page is too large to import. Please try another URL.')
    return { url: url.toString(), html }
  }
  throw new ImportError('UNAVAILABLE', 'That recipe page could not be reached. Please try again.')
}

function isPrivateHost(host: string): boolean {
  const name = host.toLowerCase().replace(/\.$/, '')
  return name === 'localhost' || name.endsWith('.localhost') || name === '::1' || /^127\./.test(name) || /^10\./.test(name) || /^192\.168\./.test(name) || /^172\.(1[6-9]|2\d|3[01])\./.test(name) || name === '0.0.0.0'
}
