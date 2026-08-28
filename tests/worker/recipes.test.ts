import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'

const worker = exports.default as ExportedHandler<Env>

describe('manual recipe validation', () => {
  it('requires a non-blank title', () => {
    expect(() => normalizeManualRecipe({ title: '   ' })).toThrow('Title is required')
  })

  it('preserves ingredient text and ordering while normalizing tags', () => {
    const recipe = normalizeManualRecipe({
      title: '  Lemon Pasta  ',
      ingredients: [{ originalText: '1 lemon' }, { originalText: '2 tbsp olive oil' }],
      instructions: [{ text: 'Zest the lemon.' }, { text: 'Toss and serve.' }],
      tags: [' Dinner ', 'dinner', 'Quick'],
      prepMinutes: 10,
    })

    expect(recipe.title).toBe('Lemon Pasta')
    expect(recipe.ingredients.map((ingredient) => ingredient.originalText)).toEqual([
      '1 lemon',
      '2 tbsp olive oil',
    ])
    expect(recipe.instructions.map((instruction) => instruction.stepNumber)).toEqual([1, 2])
    expect(recipe.tags).toEqual(['Dinner', 'Quick'])
  })

  it('rejects unsafe numeric values and blank child entries', () => {
    expect(() => normalizeManualRecipe({ title: 'Soup', cookMinutes: -1 })).toThrow('cookMinutes')
    expect(() => normalizeManualRecipe({ title: 'Soup', ingredients: [{ originalText: ' ' }] })).toThrow(
      'Ingredient text is required',
    )
  })
})

describe('recipe API', () => {
  it('creates, lists, and retrieves a manual recipe', async () => {
    const create = await worker.fetch(
      new Request('https://recipeapp.test/api/recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Lemon Pasta',
          ingredients: [{ originalText: '1 lemon' }],
          instructions: [{ text: 'Toss and serve.' }],
        }),
      }),
      env,
    )
    expect(create.status).toBe(201)
    const recipe = (await create.json()) as { id: string; title: string }
    expect(recipe.title).toBe('Lemon Pasta')

    const list = await worker.fetch(new Request('https://recipeapp.test/api/recipes'), env)
    await expect(list.json()).resolves.toMatchObject([{ id: recipe.id, title: 'Lemon Pasta' }])

    const get = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`), env)
    await expect(get.json()).resolves.toMatchObject({
      id: recipe.id,
      ingredients: [{ originalText: '1 lemon' }],
      instructions: [{ stepNumber: 1, text: 'Toss and serve.' }],
    })
  })

  it('returns safe validation and missing-recipe errors', async () => {
    const invalid = await worker.fetch(
      new Request('https://recipeapp.test/api/recipes', { method: 'POST', body: '{}' }),
      env,
    )
    expect(invalid.status).toBe(400)
    const missing = await worker.fetch(new Request('https://recipeapp.test/api/recipes/missing'), env)
    expect(missing.status).toBe(404)
  })

  it('updates, favorites, and deletes a saved recipe', async () => {
    const create = await worker.fetch(new Request('https://recipeapp.test/api/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Before edit' }) }), env)
    const recipe = (await create.json()) as { id: string }
    const update = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'After edit', instructions: [{ text: 'Updated step.' }] }) }), env)
    await expect(update.json()).resolves.toMatchObject({ title: 'After edit', instructions: [{ text: 'Updated step.' }] })
    const invalidUpdate = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: ' ' }) }), env)
    expect(invalidUpdate.status).toBe(400)
    const favorite = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}/favorite`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite: true }) }), env)
    await expect(favorite.json()).resolves.toMatchObject({ favorite: true })
    const deleted = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`, { method: 'DELETE' }), env)
    expect(deleted.status).toBe(204)
    const missing = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`), env)
    expect(missing.status).toBe(404)
  })

  it('filters recipes by a trimmed, case-insensitive partial title', async () => {
    for (const title of ['Weeknight Chicken Soup', 'Lemon Pasta']) {
      await worker.fetch(new Request('https://recipeapp.test/api/recipes', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }),
      }), env)
    }
    const matching = await worker.fetch(new Request('https://recipeapp.test/api/recipes?q=%20CHICKEN%20'), env)
    await expect(matching.json()).resolves.toMatchObject([{ title: 'Weeknight Chicken Soup' }])
    const noMatch = await worker.fetch(new Request('https://recipeapp.test/api/recipes?q=lasagna'), env)
    await expect(noMatch.json()).resolves.toEqual([])
  })

  it('matches the documented recipe endpoint success and safe-error statuses', async () => {
    const missingId = 'not-a-recipe'
    expect((await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${missingId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Nope' }) }), env)).status).toBe(404)
    expect((await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${missingId}`, { method: 'DELETE' }), env)).status).toBe(404)
    expect((await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${missingId}/favorite`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite: true }) }), env)).status).toBe(404)
    const invalidFavorite = await worker.fetch(new Request('https://recipeapp.test/api/recipes/not-a-recipe/favorite', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite: 'yes' }) }), env)
    expect(invalidFavorite.status).toBe(400)
    await expect(invalidFavorite.json()).resolves.toMatchObject({ error: { code: 'VALIDATION_ERROR', retryable: false } })
  })
})
