import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handleRecipeAssistant } from '../../worker/routes/recipe-chat-assistant.js'
import type { RecipeAgentRunner } from '../../worker/services/ai/recipe-agent.js'

const worker = exports.default as ExportedHandler<Env>
const api = (path: string, method = 'GET', body?: unknown) => new Request(`https://recipeapp.test${path}`, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })

async function createRecipe() {
  const response = await worker.fetch(api('/api/recipes', 'POST', { title: 'Garlic Shrimp', servings: 2, ingredients: [{ originalText: '1 lb shrimp', quantity: 1, unit: 'lb', ingredient: 'shrimp' }], instructions: [{ text: 'Cook gently.' }] }), env)
  return response.json() as Promise<{ id: string; title: string; updatedAt: string }>
}

async function events(response: Response) {
  return (await response.text()).trim().split('\n').filter(Boolean).map((value) => JSON.parse(value) as { type: string; [key: string]: unknown })
}

describe('Recipe Chat assistant API', () => {
  it('persists a streamed conversation with validated recipe references', async () => {
    const recipe = await createRecipe()
    const runner: RecipeAgentRunner = { run: vi.fn(async () => ({ outcome: 'answer', answer: 'Garlic Shrimp is in your library.', sourceKind: 'library', recipeIds: [recipe.id] })) }
    const created = await handleRecipeAssistant(api('/api/chat/recipes', 'POST'), env, '/api/chat/recipes').then((response) => response.json()) as { id: string }
    const response = await handleRecipeAssistant(api(`/api/chat/recipes/${created.id}/messages`, 'POST', { message: 'Find shrimp recipes' }), env, `/api/chat/recipes/${created.id}/messages`, { runner })
    const streamed = await events(response)
    expect(streamed.map((event) => event.type)).toEqual(['progress', 'text_delta', 'recipe_reference', 'completed'])
    const saved = await handleRecipeAssistant(api(`/api/chat/recipes/${created.id}`), env, `/api/chat/recipes/${created.id}`).then((result) => result.json()) as { title: string; messages: unknown[] }
    expect(saved.title).toBe('Find shrimp recipes')
    expect(saved.messages).toHaveLength(2)
  })

  it('creates a variation only after Apply and makes Apply idempotent', async () => {
    const recipe = await createRecipe()
    const runner: RecipeAgentRunner = { run: vi.fn(async () => ({ outcome: 'answer', answer: 'Here is a four-serving variation.', sourceKind: 'mixed', recipeIds: [recipe.id], proposal: { kind: 'recipe_variation', summary: 'Save Garlic Shrimp for four', payload: { sourceRecipeId: recipe.id, sourceUpdatedAt: recipe.updatedAt, recipe: { title: 'Garlic Shrimp for Four', servings: 4, tags: [], ingredients: [{ originalText: '2 lb shrimp', quantity: 2, unit: 'lb', ingredient: 'shrimp' }], instructions: [{ text: 'Cook gently.' }] } } } })) }
    const conversation = await handleRecipeAssistant(api('/api/chat/recipes', 'POST'), env, '/api/chat/recipes').then((response) => response.json()) as { id: string }
    const turn = await handleRecipeAssistant(api(`/api/chat/recipes/${conversation.id}/messages`, 'POST', { message: 'Scale it for four' }), env, `/api/chat/recipes/${conversation.id}/messages`, { runner })
    const completed = (await events(turn)).find((event) => event.type === 'completed')!.conversation as { messages: Array<{ proposal?: { id: string } }> }
    const proposalId = completed.messages.at(-1)!.proposal!.id
    const before = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipe_variations').first<{ count: number }>()
    expect(before?.count).toBe(0)
    const path = `/api/chat/recipes/${conversation.id}/proposals/${proposalId}/apply`
    expect((await handleRecipeAssistant(api(path, 'POST'), env, path)).status).toBe(200)
    expect((await handleRecipeAssistant(api(path, 'POST'), env, path)).status).toBe(404)
    const after = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipe_variations').first<{ count: number }>()
    expect(after?.count).toBe(1)
  })

  it('cancels a proposal without changing recipe data', async () => {
    const recipe = await createRecipe()
    const runner: RecipeAgentRunner = { run: vi.fn(async () => ({ outcome: 'answer', answer: 'Preview ready.', sourceKind: 'library', recipeIds: [recipe.id], proposal: { kind: 'recipe_variation', summary: 'Preview', payload: { sourceRecipeId: recipe.id, sourceUpdatedAt: recipe.updatedAt, recipe: { title: 'Unused' } } } })) }
    const conversation = await handleRecipeAssistant(api('/api/chat/recipes', 'POST'), env, '/api/chat/recipes').then((response) => response.json()) as { id: string }
    const turn = await handleRecipeAssistant(api(`/api/chat/recipes/${conversation.id}/messages`, 'POST', { message: 'Change it' }), env, `/api/chat/recipes/${conversation.id}/messages`, { runner })
    const completed = (await events(turn)).find((event) => event.type === 'completed')!.conversation as { messages: Array<{ proposal?: { id: string } }> }
    const path = `/api/chat/recipes/${conversation.id}/proposals/${completed.messages.at(-1)!.proposal!.id}/cancel`
    expect((await handleRecipeAssistant(api(path, 'POST'), env, path)).status).toBe(200)
    expect((await env.DB.prepare('SELECT COUNT(*) AS count FROM recipe_variations').first<{ count: number }>())?.count).toBe(0)
  })

  it('rejects a stale meal-plan preview', async () => {
    const recipe = await createRecipe()
    const runner: RecipeAgentRunner = { run: vi.fn(async () => ({ outcome: 'answer', answer: 'Plan preview ready.', sourceKind: 'library', recipeIds: [recipe.id], proposal: { kind: 'meal_plan', summary: 'Plan Garlic Shrimp', payload: { weekStart: '2026-09-20', dayIndex: 5, recipeId: recipe.id, expectedRevision: 0 } } })) }
    const conversation = await handleRecipeAssistant(api('/api/chat/recipes', 'POST'), env, '/api/chat/recipes').then((response) => response.json()) as { id: string }
    const turn = await handleRecipeAssistant(api(`/api/chat/recipes/${conversation.id}/messages`, 'POST', { message: 'Plan shrimp Friday' }), env, `/api/chat/recipes/${conversation.id}/messages`, { runner })
    const completed = (await events(turn)).find((event) => event.type === 'completed')!.conversation as { messages: Array<{ proposal?: { id: string } }> }
    await worker.fetch(api('/api/meal-plans/2026-09-20/dinners/0', 'PUT', { recipeId: recipe.id }), env)
    const path = `/api/chat/recipes/${conversation.id}/proposals/${completed.messages.at(-1)!.proposal!.id}/apply`
    const response = await handleRecipeAssistant(api(path, 'POST'), env, path)
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'CONFLICT' } })
  })

  it('drops a proposal that invents a saved recipe ID', async () => {
    const runner: RecipeAgentRunner = { run: vi.fn(async () => ({ outcome: 'answer', answer: 'Here is a complete general recipe.', sourceKind: 'general', recipeIds: [], proposal: { kind: 'recipe_variation', summary: 'Invalid preview', payload: { sourceRecipeId: 'suggested:not-real', sourceUpdatedAt: '2026-09-20T00:00:00Z', recipe: { title: 'Invented recipe' } } } })) }
    const conversation = await handleRecipeAssistant(api('/api/chat/recipes', 'POST'), env, '/api/chat/recipes').then((response) => response.json()) as { id: string }
    const turn = await handleRecipeAssistant(api(`/api/chat/recipes/${conversation.id}/messages`, 'POST', { message: 'Give me a recipe now' }), env, `/api/chat/recipes/${conversation.id}/messages`, { runner })
    const completed = (await events(turn)).find((event) => event.type === 'completed')!.conversation as { messages: Array<{ proposal?: unknown }> }
    expect(completed.messages.at(-1)?.proposal).toBeUndefined()
  })
})
