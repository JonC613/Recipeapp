import { describe, expect, it } from 'vitest'
import { MealDbClient, MealDbClientError } from '../../worker/services/mealdb/mealdb-client.js'
import { areaResponse, browseResponse, categoryResponse, completeMeal, emptyResponse, malformedResponse } from '../fixtures/mealdb/responses.js'

function fetchJson(body: unknown, init: ResponseInit = {}): typeof fetch {
  return async () => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init })
}

describe('TheMealDB client', () => {
  it('normalizes official browse, search, and detail responses without inventing ingredient data', async () => {
    const client = new MealDbClient(fetchJson({ meals: [completeMeal] }))
    await expect(client.search('teriyaki')).resolves.toEqual([{ id: '52772', title: 'Teriyaki Chicken Casserole', thumbnailUrl: completeMeal.strMealThumb, category: 'Chicken', area: 'Japanese' }])
    await expect(client.recipe('52772')).resolves.toMatchObject({ id: '52772', title: 'Teriyaki Chicken Casserole', ingredients: [{ originalText: '3/4 cup soy sauce' }, { originalText: '1 lb chicken' }], instructions: ['Preheat oven.', 'Bake until cooked through.'], tags: ['Meat', 'Casserole'], attribution: 'TheMealDB' })
  })

  it('returns bounded facets and summaries and accepts no-match responses', async () => {
    await expect(new MealDbClient(fetchJson(categoryResponse)).categories()).resolves.toEqual([{ id: 'Chicken', label: 'Chicken' }, { id: 'Seafood', label: 'Seafood' }])
    await expect(new MealDbClient(fetchJson(areaResponse)).areas()).resolves.toEqual([{ id: 'Japanese', label: 'Japanese' }, { id: 'Canadian', label: 'Canadian' }])
    await expect(new MealDbClient(fetchJson(browseResponse)).byCategory('Chicken')).resolves.toEqual([{ id: '52772', title: 'Teriyaki Chicken Casserole', thumbnailUrl: 'https://example.test/chicken.jpg' }])
    await expect(new MealDbClient(fetchJson(emptyResponse)).search('missing')).resolves.toEqual([])
  })

  it('maps provider and malformed responses to safe client errors', async () => {
    await expect(new MealDbClient(fetchJson(malformedResponse)).search('bad')).resolves.toEqual([])
    await expect(new MealDbClient(fetchJson({ meals: [malformedResponse.meals[0]] })).recipe('42')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' } satisfies Partial<MealDbClientError>)
    await expect(new MealDbClient(fetchJson({}, { status: 503 })).search('chicken')).rejects.toMatchObject({ code: 'UNAVAILABLE' } satisfies Partial<MealDbClientError>)
    await expect(new MealDbClient(fetchJson({ meals: null })).recipe('missing')).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<MealDbClientError>)
  })
})
