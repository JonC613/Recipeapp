import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { classifyGroceryItem, normalizedIngredientKey, normalizeWeekStart } from '../../src/domain/meal-plan/schema.js'

const worker = exports.default as ExportedHandler<Env>

async function createRecipe(title: string, ingredients: string[]) {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, ingredients: ingredients.map((originalText) => ({ originalText })) }) }), env)
  return response.json() as Promise<{ id: string }>
}

describe('meal-plan domain helpers', () => {
  it('uses Sunday keys and conservative grocery classification', () => {
    expect(normalizeWeekStart('2026-09-06')).toBe('2026-09-06')
    expect(() => normalizeWeekStart('2026-09-07')).toThrow('Sunday')
    expect(normalizedIngredientKey('  1   Lemon ')).toBe('1 lemon')
    expect(classifyGroceryItem('2 lemons')).toBe('produce')
    expect(classifyGroceryItem('mystery powder')).toBe('other')
  })
})

describe('meal-plan API', () => {
  it('assigns dinners, generates a grouped list, and preserves checked custom items on update', async () => {
    const first = await createRecipe('Lemon Pasta', [' 1 lemon ', '8 ounces spaghetti'])
    const second = await createRecipe('Lemon Chicken', ['1 LEMON', '1 chicken breast'])
    const week = '2026-09-06'
    for (const [day, recipe] of [[0, first], [1, second]] as const) {
      const response = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/dinners/${day}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipeId: recipe.id }) }), env)
      expect(response.status).toBe(200)
    }
    const generated = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-list`, { method: 'POST' }), env)
    const list = await generated.json() as { groceryItems: Array<{ id: string; displayText: string; occurrenceCount: number }> }
    const lemon = list.groceryItems.find((item) => item.displayText.toLowerCase() === '1 lemon')!
    expect(lemon.occurrenceCount).toBe(2)
    const checked = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-items/${lemon.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ checked: true }) }), env)
    expect(checked.status).toBe(200)
    const custom = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-items`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayText: 'Coffee filters' }) }), env)
    expect(custom.status).toBe(201)
    const updated = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-list`, { method: 'POST' }), env)
    const reconciled = await updated.json() as { groceryListStale: boolean; groceryItems: Array<{ displayText: string; checked: boolean; custom: boolean }> }
    expect(reconciled.groceryListStale).toBe(false)
    expect(reconciled.groceryItems.find((item) => item.displayText === '1 lemon')).toMatchObject({ checked: true, custom: false })
    expect(reconciled.groceryItems.find((item) => item.displayText === 'Coffee filters')).toMatchObject({ checked: false, custom: true })
  })

  it('marks a generated list stale after a plan change and safely rejects malformed requests', async () => {
    const recipe = await createRecipe('Soup', ['1 onion'])
    const week = '2026-09-06'
    await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/dinners/0`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipeId: recipe.id }) }), env)
    await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-list`, { method: 'POST' }), env)
    const remove = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/dinners/0`, { method: 'DELETE' }), env)
    await expect(remove.json()).resolves.toMatchObject({ groceryListStale: true })
    await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/dinners/0`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipeId: recipe.id }) }), env)
    await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/grocery-list`, { method: 'POST' }), env)
    await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`, { method: 'DELETE' }), env)
    const afterRecipeDelete = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans?week=${week}`), env)
    await expect(afterRecipeDelete.json()).resolves.toMatchObject({ dinners: [], groceryListStale: true })
    const badWeek = await worker.fetch(new Request('https://recipeapp.test/api/meal-plans?week=2026-09-07'), env)
    expect(badWeek.status).toBe(400)
    const missingRecipe = await worker.fetch(new Request(`https://recipeapp.test/api/meal-plans/${week}/dinners/1`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipeId: 'missing' }) }), env)
    expect(missingRecipe.status).toBe(404)
  })
})
