import { describe, expect, it, vi } from 'vitest'
import { mapOpenAiRecipeResult, OpenAiRecipeParser, openAiRecipeResponseSchema } from '../../worker/services/ai/openai-recipe-parser.js'

describe('OpenAI recipe parser mapping', () => {
  it('uses a strict schema and maps nullable fields to absent stable draft fields', () => {
    expect(openAiRecipeResponseSchema).toMatchObject({ type: 'object', additionalProperties: false })
    const mapped = mapOpenAiRecipeResult({ outcome: 'recipe', recipe: { title: null, description: null, servings: null, prepMinutes: null, cookMinutes: null, totalMinutes: null, cuisine: null, category: null, tags: [], notes: null, ingredients: [{ originalText: '1 heaping tablespoon rosemary', quantity: null, quantityText: null, unit: null, ingredient: null, preparation: null, optional: null }], instructions: [{ text: 'Stir.' }] } })
    expect(mapped).toMatchObject({ outcome: 'recipe', draft: { title: 'Untitled recipe', ingredients: [{ originalText: '1 heaping tablespoon rosemary' }], instructions: [{ text: 'Stir.' }] } })
  })
  it('does not coerce multiple recipes into one draft', () => expect(mapOpenAiRecipeResult({ outcome: 'multiple_recipes', recipe: null })).toEqual({ outcome: 'multiple_recipes' }))

  it('reads structured text from the raw Responses API message envelope', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ outcome: 'recipe', recipe: { title: 'Toast', description: null, servings: null, prepMinutes: null, cookMinutes: null, totalMinutes: null, cuisine: null, category: null, tags: [], notes: null, ingredients: [{ originalText: '2 slices bread', quantity: 2, quantityText: null, unit: 'slices', ingredient: 'bread', preparation: null, optional: false }], instructions: [{ text: 'Toast the bread.' }] } }) }] }] }), { status: 200 }))
    const parser = new OpenAiRecipeParser('test-key', 'gpt-5-mini', request as unknown as typeof fetch)

    await expect(parser.parse({ sourceType: 'text', text: 'Toast' })).resolves.toMatchObject({ outcome: 'recipe', draft: { title: 'Toast' } })
  })

  it('invokes an injected fetcher with the Worker global receiver', async () => {
    const request = vi.fn(function () {
      return Promise.resolve(new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ outcome: 'not_recipe', recipe: null }) }] }] }), { status: 200 }))
    })
    const parser = new OpenAiRecipeParser('test-key', 'gpt-5-mini', request as unknown as typeof fetch)

    await expect(parser.parse({ sourceType: 'text', text: 'not a recipe' })).resolves.toEqual({ outcome: 'not_recipe' })
    expect(request.mock.contexts[0]).toBe(globalThis)
  })
})
