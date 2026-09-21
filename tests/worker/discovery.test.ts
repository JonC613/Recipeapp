import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handleDiscovery } from '../../worker/routes/discovery.js'
import { approveDiscoverySite, listApprovedDiscoverySites, upsertDiscoveryValidation } from '../../worker/repositories/discovery-sites.js'
import { robotsAllows, searchWordPressSite, validateDiscoverySite } from '../../worker/services/discovery/wordpress.js'

const origin = 'https://recipes.example'
const recipeUrl = `${origin}/blog/lemon-pasta/`
const recipeHtml = `<script type="application/ld+json">{"@type":"Recipe","name":"Lemon Pasta","recipeIngredient":["1 lemon"],"recipeInstructions":["Toss."]}</script>`

function siteFetch(options: { robots?: string; results?: unknown; html?: string; pages?: Record<string, string> } = {}): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    if (url.pathname === '/robots.txt') return new Response(options.robots ?? 'User-agent: *\nAllow: /', { headers: { 'content-type': 'text/plain' } })
    if (url.pathname === '/wp-json/wp/v2/search') return Response.json(options.results ?? [{ id: 7, title: 'Lemon &amp; Pasta', url: recipeUrl, subtype: 'post' }])
    if (options.pages?.[url.pathname]) return new Response(options.pages[url.pathname], { headers: { 'content-type': 'text/html' } })
    if (url.pathname === '/blog/lemon-pasta/') return new Response(options.html ?? recipeHtml, { headers: { 'content-type': 'text/html' } })
    return new Response(null, { status: 404 })
  }) as typeof fetch
}

describe('discovery site compatibility', () => {
  it('rejects non-HTTPS and private candidate addresses before fetching', async () => {
    await expect(validateDiscoverySite('http://recipes.example', siteFetch())).rejects.toThrow('public HTTPS')
    await expect(validateDiscoverySite('https://127.0.0.1', siteFetch())).rejects.toThrow('valid public')
  })

  it('validates a same-origin WordPress recipe site', async () => {
    const result = await validateDiscoverySite(origin, siteFetch())
    expect(result).toMatchObject({ origin, hostname: 'recipes.example', report: { compatible: true, adapter: 'wordpress_rest' } })
    expect(result.report.criteria).toHaveLength(5)
    expect(result.report.criteria.every((criterion) => criterion.passed)).toBe(true)
  })

  it('accepts a site when a later bounded search result contains one recipe', async () => {
    const results = [
      { id: 1, title: 'Recipe roundup', url: `${origin}/roundup/` },
      { id: 2, title: 'Lemon Pasta', url: `${origin}/blog/lemon-pasta/` },
    ]
    const result = await validateDiscoverySite(origin, siteFetch({ results, pages: { '/roundup/': '<script type="application/ld+json">{"@type":"CollectionPage"}</script>' } }))
    expect(result.report).toMatchObject({ compatible: true, adapter: 'wordpress_rest' })
    expect(result.report.criteria).toContainEqual(expect.objectContaining({ id: 'recipe', passed: true }))
  })

  it('conservatively applies robots rules and rejects incompatible results', async () => {
    expect(robotsAllows('User-agent: *\nDisallow: /wp-json/\nAllow: /wp-json/public/', '/wp-json/wp/v2/search')).toBe(false)
    const blocked = await validateDiscoverySite(origin, siteFetch({ robots: 'User-agent: *\nDisallow: /wp-json/' }))
    expect(blocked.report).toMatchObject({ compatible: false, criteria: expect.arrayContaining([{ id: 'robots', passed: false, message: expect.any(String) }]) })
    const crossOrigin = await validateDiscoverySite(origin, siteFetch({ results: [{ id: 1, title: 'Elsewhere', url: 'https://elsewhere.example/recipe' }] }))
    expect(crossOrigin.report).toMatchObject({ compatible: false, criteria: expect.arrayContaining([{ id: 'same_origin', passed: false, message: expect.any(String) }]) })
  })

  it('normalizes bounded WordPress results and drops off-site entries', async () => {
    const results = await searchWordPressSite({ id: 'site-1', origin, hostname: 'recipes.example' }, 'lemon', siteFetch({ results: [{ id: 7, title: 'Lemon &amp; Pasta', url: recipeUrl }, { id: 8, title: 'Offsite', url: 'https://elsewhere.example/post' }] }))
    expect(results).toEqual([{ id: 'site-1:7', title: 'Lemon & Pasta', url: recipeUrl, siteId: 'site-1', siteHostname: 'recipes.example' }])
  })
})

describe('discovery routes and persistence', () => {
  it('keeps compatible validation pending until explicit idempotent approval', async () => {
    const beforeRecipes = await env.DB.prepare('SELECT COUNT(*) count FROM recipes').first<{ count: number }>()
    const beforeImports = await env.DB.prepare('SELECT COUNT(*) count FROM recipe_imports').first<{ count: number }>()
    const report = { compatible: true, adapter: 'wordpress_rest' as const, criteria: [{ id: 'https' as const, passed: true, message: 'Uses public HTTPS.' }] }
    const pending = await upsertDiscoveryValidation(env.DB, origin, 'recipes.example', report, '2026-09-21T01:00:00.000Z')
    expect(pending).toMatchObject({ status: 'pending', enabled: false })
    const first = await approveDiscoverySite(env.DB, pending.id, '2026-09-21T01:01:00.000Z')
    const second = await approveDiscoverySite(env.DB, pending.id, '2026-09-21T01:02:00.000Z')
    expect(first).toMatchObject({ status: 'approved', enabled: true })
    expect(second?.approvedAt).toBe(first?.approvedAt)
    expect((await listApprovedDiscoverySites(env.DB)).filter((site) => site.origin === origin)).toHaveLength(1)
    expect(await env.DB.prepare('SELECT COUNT(*) count FROM recipes').first()).toEqual(beforeRecipes)
    expect(await env.DB.prepare('SELECT COUNT(*) count FROM recipe_imports').first()).toEqual(beforeImports)
  })

  it('searches approved sites without persistence and reports partial failure', async () => {
    const searcher = vi.fn(async (site: { id: string; origin: string; hostname: string }) => site.hostname === 'cookinginthemidwest.com' ? [{ id: `${site.id}:1`, title: 'Chicken Dinner', url: `${site.origin}/blog/chicken/`, siteId: site.id, siteHostname: site.hostname }] : Promise.reject(new Error('offline')))
    await upsertDiscoveryValidation(env.DB, origin, 'recipes.example', { compatible: true, adapter: 'wordpress_rest', criteria: [] }, '2026-09-21T01:00:00.000Z').then((site) => approveDiscoverySite(env.DB, site.id))
    const response = await handleDiscovery(new Request('https://recipeapp.test/api/beta/discovery/search?q=chicken'), env, '/api/beta/discovery/search', { searcher })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ results: [{ title: 'Chicken Dinner' }], sitesSearched: 2, sitesUnavailable: 1 })
    expect(await env.DB.prepare('SELECT COUNT(*) count FROM recipe_imports').first()).toEqual({ count: 0 })
  })

  it('previews only an approved origin without creating an import', async () => {
    const response = await handleDiscovery(new Request(`https://recipeapp.test/api/beta/discovery/preview?url=${encodeURIComponent('https://cookinginthemidwest.com/blog/lemon-pasta/')}`), env, '/api/beta/discovery/preview', { fetcher: vi.fn(async () => new Response(recipeHtml, { headers: { 'content-type': 'text/html' } })) as typeof fetch, now: () => '2026-09-21T00:00:00.000Z' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ sourceUrl: 'https://cookinginthemidwest.com/blog/lemon-pasta/', draft: { title: 'Lemon Pasta' } })
    expect(await env.DB.prepare('SELECT COUNT(*) count FROM recipe_imports').first()).toEqual({ count: 0 })
    const rejected = await handleDiscovery(new Request(`https://recipeapp.test/api/beta/discovery/preview?url=${encodeURIComponent(recipeUrl)}`), env, '/api/beta/discovery/preview', { fetcher: siteFetch() })
    expect(rejected.status).toBe(404)
  })
})
