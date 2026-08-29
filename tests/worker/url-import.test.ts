import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { extractRecipeDraft } from '../../worker/services/extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../../worker/services/extraction/url-fetcher.js'
import { handleImport, handleUrlImport } from '../../worker/routes/imports.js'

describe('URL import extraction', () => {
  it('rejects unsupported and private destinations', () => {
    expect(() => validatePublicUrl('ftp://example.com/recipe')).toThrow('valid public')
    expect(() => validatePublicUrl('http://127.0.0.1/recipe')).toThrow('valid public')
    expect(() => validatePublicUrl('https://name:secret@example.com/recipe')).toThrow('valid public')
  })

  it('normalizes a Recipe JSON-LD graph without inventing fields', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebSite","name":"Example"},{"@type":"Recipe","name":"Lemon Pasta","recipeIngredient":["1 lemon","2 tbsp oil"],"recipeInstructions":[{"@type":"HowToStep","text":"Zest lemon."},{"@type":"HowToStep","text":"Toss."}],"prepTime":"PT10M","recipeYield":"4 servings"}]}</script>`
    const draft = extractRecipeDraft(html, 'https://example.com/lemon-pasta', '2026-08-28T00:00:00.000Z')
    expect(draft).toMatchObject({ title: 'Lemon Pasta', servings: 4, prepMinutes: 10, ingredients: [{ originalText: '1 lemon' }, { originalText: '2 tbsp oil' }], instructions: [{ text: 'Zest lemon.' }, { text: 'Toss.' }], source: { originalUrl: 'https://example.com/lemon-pasta' } })
  })

  it('fails safely when no unambiguous recipe exists', () => {
    expect(() => extractRecipeDraft('<html></html>', 'https://example.com', '2026-08-28T00:00:00.000Z')).toThrow('No usable recipe')
  })

  it('uses a transparent importer identity and explains site refusal', async () => {
    const page = await fetchRecipePage('https://example.com/recipe', async (_url, init) => {
      expect(init?.headers).toMatchObject({ 'user-agent': expect.stringContaining('Recipeapp URL Import') })
      return new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
    })
    expect(page.url).toBe('https://example.com/recipe')
    await expect(fetchRecipePage('https://example.com/blocked', async () => new Response(null, { status: 403 }))).rejects.toThrow('does not allow imports')
  })

  it('creates a retrievable ready draft without creating a saved recipe', async () => {
    const html = `<script type="application/ld+json">{"@type":"Recipe","name":"Fixture Pasta","recipeIngredient":["1 lemon"],"recipeInstructions":["Toss."]}</script>`
    const response = await handleUrlImport(new Request('https://recipeapp.test/api/import/url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/pasta' }) }), env, {
      fetcher: async () => new Response(html, { headers: { 'content-type': 'text/html' } }), now: () => '2026-08-28T00:00:00.000Z',
    })
    expect(response.status).toBe(201)
    const imported = await response.json() as { id: string; status: string; draft: { title: string; ingredients: Array<{ originalText: string }> } }
    expect(imported).toMatchObject({ status: 'ready', draft: { title: 'Fixture Pasta', ingredients: [{ originalText: '1 lemon' }] } })
    const retrieved = await handleImport(new Request(`https://recipeapp.test/api/import/${imported.id}`), env, imported.id)
    await expect(retrieved.json()).resolves.toMatchObject({ id: imported.id, sourceUrl: 'https://example.com/pasta', status: 'ready' })
    const recipes = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipes').first<{ count: number }>()
    expect(recipes?.count).toBe(0)
  })

  it('returns safe outcomes and preserves valid failed attempts', async () => {
    const invalid = await handleUrlImport(new Request('https://recipeapp.test/api/import/url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'http://127.0.0.1/recipe' }) }), env)
    expect(invalid.status).toBe(400)
    const noRecipe = await handleUrlImport(new Request('https://recipeapp.test/api/import/url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/not-a-recipe' }) }), env, {
      fetcher: async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } }),
    })
    expect(noRecipe.status).toBe(422)
    await expect(noRecipe.json()).resolves.toMatchObject({ error: { code: 'NO_RECIPE', retryable: false } })
    const failed = await env.DB.prepare('SELECT status, failure_code FROM recipe_imports WHERE source_url = ?').bind('https://example.com/not-a-recipe').first<{ status: string; failure_code: string }>()
    expect(failed).toEqual({ status: 'no_recipe', failure_code: 'NO_RECIPE' })
  })

  it('matches the documented endpoint statuses for unavailable and missing imports', async () => {
    const unavailable = await handleUrlImport(new Request('https://recipeapp.test/api/import/url', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/unavailable' }) }), env, {
      fetcher: async () => { throw new Error('network details must not escape') },
    })
    expect(unavailable.status).toBe(503)
    await expect(unavailable.json()).resolves.toMatchObject({ error: { code: 'SERVICE_UNAVAILABLE', retryable: true } })
    const missing = await handleImport(new Request('https://recipeapp.test/api/import/missing'), env, 'missing')
    expect(missing.status).toBe(404)
    await expect(missing.json()).resolves.toMatchObject({ error: { code: 'NOT_FOUND', retryable: false } })
  })
})
