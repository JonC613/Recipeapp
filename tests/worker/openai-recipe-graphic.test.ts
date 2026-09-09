import { expect, test, vi } from 'vitest'
import { OpenAiRecipeGraphic } from '../../worker/services/ai/openai-recipe-graphic.js'

test('uses the low-cost image model and returns a generated PNG payload', async () => {
  const request = vi.fn(async () => Response.json({ data: [{ b64_json: btoa('png-bytes') }] })) as unknown as typeof fetch
  const graphic = new OpenAiRecipeGraphic('test-key', request)
  await expect(graphic.generate({ title: 'Garlic Shrimp', ingredients: [{ originalText: 'shrimp' }] })).resolves.toEqual(new TextEncoder().encode('png-bytes'))
  const body = JSON.parse(String((request as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body))
  expect(body).toMatchObject({ model: 'gpt-image-1-mini', quality: 'low', size: '1024x1024', output_format: 'png', n: 1 })
  expect(body.prompt).toContain('Garlic Shrimp')
})
