import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { handleMealDb } from '../../worker/routes/mealdb.js'
import { handleImportApproval, handleMealDbImport } from '../../worker/routes/imports.js'
import { MealDbClientError } from '../../worker/services/mealdb/mealdb-client.js'

const client = {
  categories: async () => [{ id: 'Chicken', label: 'Chicken' }],
  areas: async () => [{ id: 'Japanese', label: 'Japanese' }],
  byCategory: async (category: string) => [{ id: '1', title: category }],
  byArea: async (area: string) => [{ id: '2', title: area }],
  search: async (query: string) => [{ id: '3', title: query }],
  recipe: async (id: string) => ({ id, title: 'Preview', ingredients: [{ originalText: '1 lemon' }], tags: [], attribution: 'TheMealDB' as const }),
}

describe('TheMealDB routes', () => {
  it('returns safe browse, search, and detail projections', async () => {
    await expect((await handleMealDb(new Request('https://recipeapp.test/api/mealdb/categories'), { client })).json()).resolves.toEqual([{ id: 'Chicken', label: 'Chicken' }])
    await expect((await handleMealDb(new Request('https://recipeapp.test/api/mealdb/search?q=teriyaki'), { client })).json()).resolves.toEqual([{ id: '3', title: 'teriyaki' }])
    await expect((await handleMealDb(new Request('https://recipeapp.test/api/mealdb/recipes/52772'), { client })).json()).resolves.toMatchObject({ id: '52772', attribution: 'TheMealDB' })
  })

  it('validates criteria and never calls the provider for invalid input', async () => {
    const blank = await handleMealDb(new Request('https://recipeapp.test/api/mealdb/search?q=%20'), { client })
    expect(blank.status).toBe(400)
    await expect(blank.json()).resolves.toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
    const both = await handleMealDb(new Request('https://recipeapp.test/api/mealdb/recipes?category=Chicken&area=Japanese'), { client })
    expect(both.status).toBe(400)
    const invalidId = await handleMealDb(new Request('https://recipeapp.test/api/mealdb/recipes/not-a-number'), { client })
    expect(invalidId.status).toBe(400)
  })

  it('maps provider failures to safe application errors', async () => {
    const unavailable = await handleMealDb(new Request('https://recipeapp.test/api/mealdb/search?q=chicken'), { client: { ...client, search: async () => { throw new MealDbClientError('UNAVAILABLE', 'private provider detail') } } })
    expect(unavailable.status).toBe(503)
    await expect(unavailable.json()).resolves.toEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: 'TheMealDB is temporarily unavailable. Please try again.', retryable: true } })
    const missing = await handleMealDb(new Request('https://recipeapp.test/api/mealdb/recipes/999'), { client: { ...client, recipe: async () => { throw new MealDbClientError('NOT_FOUND', 'private provider detail') } } })
    expect(missing.status).toBe(404)
  })

  it('creates a review-only TheMealDB import and saves only after approval', async () => {
    const detail = { id: '52772', title: 'Teriyaki Chicken Casserole', category: 'Chicken', area: 'Japanese', ingredients: [{ originalText: '1 chicken breast' }], instructions: ['Bake it.'], tags: ['Casserole'], attribution: 'TheMealDB' as const }
    const response = await handleMealDbImport(new Request('https://recipeapp.test/api/import/mealdb', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: '52772' }) }), env, { client: { recipe: async () => detail }, now: () => '2026-08-30T00:00:00.000Z' })
    expect(response.status).toBe(201)
    const imported = await response.json() as { id: string; sourceType: string; sourceUrl: string; draft: { source: { type: string } } }
    expect(imported).toMatchObject({ sourceType: 'mealdb', sourceUrl: 'https://www.themealdb.com/meal/52772', draft: { source: { type: 'mealdb' } } })
    expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM recipes').first<{ count: number }>())?.count).toBe(0)
    const approved = await handleImportApproval(new Request(`https://recipeapp.test/api/import/${imported.id}/approve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Edited chicken casserole', ingredients: [{ originalText: '1 chicken breast' }], instructions: [{ text: 'Bake it.' }] }) }), env, imported.id)
    expect(approved.status).toBe(201)
    const saved = await approved.json() as { source: { type: string; originalUrl?: string } }
    expect(saved.source).toEqual({ type: 'url', originalUrl: 'https://www.themealdb.com/meal/52772' })
  })
})
