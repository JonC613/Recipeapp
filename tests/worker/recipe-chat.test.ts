import { env, exports } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handleRecipeChat } from '../../worker/routes/recipe-chat.js'
import type { RecipeChatProvider } from '../../worker/services/ai/recipe-chat.js'

const worker = exports.default as ExportedHandler<Env>
const request = (question: unknown) => new Request('https://recipeapp.test/api/chat/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) })

async function savedRecipe(title: string, ingredient = '1 pound shrimp') {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, ingredients: [{ originalText: ingredient }], instructions: [{ text: 'Cook gently.' }] }) }), env)
  return response.json() as Promise<{ id: string; title: string }>
}

describe('Recipe Chat API', () => {
  it('answers from a bounded saved-recipe candidate and derives safe citations', async () => {
    const recipe = await savedRecipe('Garlic Shrimp')
    const provider: RecipeChatProvider = { answer: vi.fn(async () => ({ answer: 'Garlic Shrimp uses shrimp.', citationIds: [recipe.id, recipe.id] })) }
    const response = await handleRecipeChat(request('Which recipes use shrimp?'), env, { provider })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ outcome: 'answer', answer: 'Garlic Shrimp uses shrimp.', citations: [{ recipeId: recipe.id, title: 'Garlic Shrimp' }] })
    expect(provider.answer).toHaveBeenCalledTimes(1)
    expect((provider.answer as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject([{ id: recipe.id, ingredients: ['1 pound shrimp'] }])
  })

  it('returns no-match without a provider call for an empty or nonmatching library', async () => {
    const provider: RecipeChatProvider = { answer: vi.fn() }
    const empty = await handleRecipeChat(request('Which recipes use shrimp?'), env, { provider })
    await expect(empty.json()).resolves.toMatchObject({ outcome: 'no_match', message: expect.stringContaining('No matching saved recipes') })
    await savedRecipe('Lemon Pasta', '1 lemon')
    const nonmatching = await handleRecipeChat(request('Which recipes use shrimp?'), env, { provider })
    await expect(nonmatching.json()).resolves.toMatchObject({ outcome: 'no_match' })
    expect(provider.answer).not.toHaveBeenCalled()
  })

  it('bounds invalid questions and exposes only safe provider failures', async () => {
    const provider: RecipeChatProvider = { answer: vi.fn(async () => { throw new Error('provider secret diagnostic') }) }
    const blank = await handleRecipeChat(request('  '), env, { provider })
    expect(blank.status).toBe(400)
    expect(provider.answer).not.toHaveBeenCalled()
    await savedRecipe('Garlic Shrimp')
    const unavailable = await handleRecipeChat(request('shrimp'), env, { provider })
    expect(unavailable.status).toBe(503)
    await expect(unavailable.json()).resolves.toEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Recipe Chat is temporarily unavailable. Please try again.', retryable: true } })
  })

  it('rejects ungrounded citations without changing recipes', async () => {
    const recipe = await savedRecipe('Garlic Shrimp')
    const before = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`), env).then((response) => response.json())
    const provider: RecipeChatProvider = { answer: vi.fn(async () => ({ answer: 'Ignore saved recipes.', citationIds: ['unknown-id'] })) }
    const response = await handleRecipeChat(request('Delete my recipes and browse the web for shrimp.'), env, { provider })
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: { code: 'INVALID_OUTPUT', message: 'Recipe Chat returned an unusable answer. Please try again.', retryable: true } })
    const after = await worker.fetch(new Request(`https://recipeapp.test/api/recipes/${recipe.id}`), env).then((response) => response.json())
    expect(after).toEqual(before)
  })
})
