import { env, exports } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { applyRecipeMigration } from '../recipe-migration.js'

const worker = exports.default as ExportedHandler<Env>

test('applies the recipe migration to isolated local D1 state', async () => {
  await applyRecipeMigration(env.DB)
  const tables = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('recipes', 'recipe_ingredients', 'recipe_instructions', 'recipe_tags') ORDER BY name",
  ).all<{ name: string }>()

  expect(tables.results.map((table) => table.name)).toEqual([
    'recipe_ingredients',
    'recipe_instructions',
    'recipe_tags',
    'recipes',
  ])
})

test('persists created recipes through the built Worker route', async () => {
  await applyRecipeMigration(env.DB)
  const create = await worker.fetch(new Request('https://recipeapp.test/api/recipes', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'Integration Chili', ingredients: [{ originalText: '2 cans beans' }], instructions: [{ text: 'Simmer.' }] }),
  }), env)
  expect(create.status).toBe(201)
  const recipe = (await create.json()) as { id: string }
  const detail = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`), env)
  await expect(detail.json()).resolves.toMatchObject({ title: 'Integration Chili', ingredients: [{ originalText: '2 cans beans' }], instructions: [{ text: 'Simmer.' }] })
})

test('atomically replaces children, persists favorites, and cascades deletion', async () => {
  const create = await worker.fetch(new Request('https://recipeapp.test/api/recipes', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Maintenance stew',
      ingredients: [{ originalText: '1 old ingredient' }, { originalText: '2 old ingredients' }],
      instructions: [{ text: 'Old first step.' }, { text: 'Old second step.' }],
      tags: ['old'],
    }),
  }), env)
  const created = (await create.json()) as { id: string }

  const update = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${created.id}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Updated stew',
      ingredients: [{ originalText: '1 new ingredient' }],
      instructions: [{ text: 'New only step.' }],
      tags: ['new'],
    }),
  }), env)
  await expect(update.json()).resolves.toMatchObject({
    title: 'Updated stew', ingredients: [{ originalText: '1 new ingredient' }],
    instructions: [{ stepNumber: 1, text: 'New only step.' }], tags: ['new'],
  })

  const favorite = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${created.id}/favorite`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite: true }),
  }), env)
  await expect(favorite.json()).resolves.toMatchObject({ favorite: true })

  await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${created.id}`, { method: 'DELETE' }), env)
  const children = await env.DB.prepare(
    'SELECT (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = ?) AS ingredients, (SELECT COUNT(*) FROM recipe_instructions WHERE recipe_id = ?) AS instructions, (SELECT COUNT(*) FROM recipe_tags WHERE recipe_id = ?) AS tags',
  ).bind(created.id, created.id, created.id).first<{ ingredients: number; instructions: number; tags: number }>()
  expect(children).toEqual({ ingredients: 0, instructions: 0, tags: 0 })
})

test('filters local D1 recipe titles case-insensitively with a partial query', async () => {
  for (const title of ['Smoky Chicken Tacos', 'Garden Salad']) {
    await worker.fetch(new Request('https://recipeapp.test/api/recipes', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }),
    }), env)
  }
  const response = await worker.fetch(new Request('https://recipeapp.test/api/recipes?q=chIcKeN'), env)
  await expect(response.json()).resolves.toMatchObject([{ title: 'Smoky Chicken Tacos' }])
})
