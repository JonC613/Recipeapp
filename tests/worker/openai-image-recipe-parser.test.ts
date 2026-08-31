import { describe, expect, it, vi } from 'vitest'
import { OpenAiImageRecipeParser } from '../../worker/services/ai/openai-image-recipe-parser.js'

const recipeResult = { outcome: 'recipe', recipe: { title: 'Garlic pasta', description: null, servings: null, prepMinutes: null, cookMinutes: null, totalMinutes: null, cuisine: null, category: null, tags: [], notes: null, ingredients: [{ originalText: '1 clove garlic', quantity: 1, quantityText: null, unit: 'clove', ingredient: 'garlic', preparation: null, optional: false }], instructions: [{ text: 'Cook the pasta.' }] } }

describe('OpenAI image recipe parser', () => {
  it('uploads a temporary vision file, makes one structured vision response, and deletes the file', async () => {
    const request = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/v1/files') && init?.method === 'POST') return new Response(JSON.stringify({ id: 'file_image' }), { status: 200 })
      if (url.endsWith('/v1/responses')) return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(recipeResult) }] }] }), { status: 200 })
      if (url.endsWith('/v1/files/file_image') && init?.method === 'DELETE') return new Response(JSON.stringify({ deleted: true }), { status: 200 })
      return new Response(null, { status: 500 })
    })
    const parser = new OpenAiImageRecipeParser('test-key', 'gpt-5-mini', request as unknown as typeof fetch)
    await expect(parser.parse(new Uint8Array([0xff, 0xd8, 0xff]), 'image/jpeg', 'pasta.jpg')).resolves.toMatchObject({ outcome: 'recipe', draft: { title: 'Garlic pasta', ingredients: [{ originalText: '1 clove garlic' }] } })
    const upload = request.mock.calls[0]?.[1]?.body as FormData
    expect(upload).toBeInstanceOf(FormData); expect(upload.get('purpose')).toBe('vision'); expect(upload.get('file')).toBeInstanceOf(File)
    const body = JSON.parse(String(request.mock.calls[1]?.[1]?.body))
    expect(body.store).toBe(false); expect(body.input[1].content[1]).toEqual({ type: 'input_image', file_id: 'file_image', detail: 'high' })
    expect(request).toHaveBeenNthCalledWith(3, 'https://api.openai.com/v1/files/file_image', expect.objectContaining({ method: 'DELETE' }))
  })
})
