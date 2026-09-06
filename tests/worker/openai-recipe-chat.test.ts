import { expect, test, vi } from 'vitest'
import { OpenAiRecipeChat } from '../../worker/services/ai/openai-recipe-chat.js'

test('constrains chat citations to retrieved recipe IDs in the strict provider schema', async () => {
  const request = vi.fn(async () => Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ outcome: 'answer', answer: 'Garlic Shrimp uses shrimp.', message: '', citationIds: ['shrimp-1'] }) }] }] })) as unknown as typeof fetch
  const chat = new OpenAiRecipeChat('test-key', 'gpt-5-mini', request)
  await expect(chat.answer('Which recipes use shrimp?', [{ id: 'shrimp-1', title: 'Garlic Shrimp', tags: [], ingredients: ['1 pound shrimp'], instructions: ['Cook gently.'] }])).resolves.toEqual({ outcome: 'answer', answer: 'Garlic Shrimp uses shrimp.', citationIds: ['shrimp-1'] })
  const body = JSON.parse((request as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string)
  expect(body.text.format.schema.properties.citationIds.items.enum).toEqual(['shrimp-1'])
  expect(body.reasoning).toEqual({ effort: 'low' })
  expect(body.max_output_tokens).toBe(1600)
})
