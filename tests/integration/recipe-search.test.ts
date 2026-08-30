import { env, exports } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { applyRecipeMigration } from '../recipe-migration.js'
import { recipeSearchFixtures } from '../fixtures/recipe-search/recipes.js'

const worker = exports.default as ExportedHandler<Env>

async function create(recipe: { title: string; ingredients: ReadonlyArray<{ originalText: string }>; tags: ReadonlyArray<string>; cuisine: string; category: string }) {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(recipe) }), env)
  return response.json() as Promise<{ id: string }>
}

test('finds saved recipes by title, ingredient, tag, cuisine, and category without source fields', async () => {
  await applyRecipeMigration(env.DB)
  await Promise.all(Object.values(recipeSearchFixtures).map(create))
  for (const [query, title] of [['chicken', 'Smoky Chicken Tacos'], ['cannellini', 'Garden Pasta'], ['blackstone', 'Skillet Corn'], ['thai', 'Coconut Curry'], ['dessert', 'Berry Crisp']] as const) {
    const response = await worker.fetch(new Request(`https://recipeapp.test/api/recipes?q=${query}`), env)
    const results = await response.json() as Array<{ title: string; source?: unknown; sourceR2Key?: unknown }>
    expect(results.map((result) => result.title)).toContain(title)
    expect(results.every((result) => result.source === undefined && result.sourceR2Key === undefined)).toBe(true)
  }
})

test('combines filters conjunctively and returns every recipe once', async () => {
  await applyRecipeMigration(env.DB)
  const first = await create(recipeSearchFixtures.title)
  await Promise.all(Object.values(recipeSearchFixtures).slice(1).map(create))
  await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${first.id}/favorite`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite: true }) }), env)
  for (const [filter, title] of [['tag=blackstone', 'Skillet Corn'], ['ingredient=cannellini', 'Garden Pasta'], ['cuisine=thai', 'Coconut Curry'], ['category=dessert', 'Berry Crisp'], ['favorite=true', 'Smoky Chicken Tacos']] as const) {
    const response = await worker.fetch(new Request(`https://recipeapp.test/api/recipes?${filter}`), env)
    await expect(response.json()).resolves.toMatchObject([{ title }])
  }
  const response = await worker.fetch(new Request('https://recipeapp.test/api/recipes?q=chicken&favorite=true&category=dinner'), env)
  await expect(response.json()).resolves.toMatchObject([{ title: 'Smoky Chicken Tacos', favorite: true }])
})
