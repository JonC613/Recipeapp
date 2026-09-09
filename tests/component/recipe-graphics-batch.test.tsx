import { expect, test, vi } from 'vitest'
import { generateMissingRecipeGraphics, type RecipeSummary } from '../../src/services/recipes'

const recipes: RecipeSummary[] = [
  { id: 'one', title: 'One', favorite: false, graphicAvailable: false },
  { id: 'two', title: 'Two', favorite: false, graphicAvailable: true },
  { id: 'three', title: 'Three', favorite: false, graphicAvailable: false },
  { id: 'four', title: 'Four', favorite: false, graphicAvailable: false },
]

test('generates only initially missing graphics sequentially and continues after a failure', async () => {
  const calls: string[] = []
  const progress: Array<{ completed: number; total: number; generated: number; failed: number }> = []
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = String(input)
    calls.push(path)
    if (path.includes('/three/')) return new Response(JSON.stringify({ error: { message: 'temporarily unavailable' } }), { status: 503, headers: { 'content-type': 'application/json' } })
    return new Response(JSON.stringify({ graphicUrl: path }), { status: 201, headers: { 'content-type': 'application/json' } })
  })

  const result = await generateMissingRecipeGraphics(recipes, (item) => progress.push(item))

  expect(calls).toEqual(['/api/recipes/one/graphic', '/api/recipes/three/graphic', '/api/recipes/four/graphic'])
  expect(result).toEqual({ generated: 2, failed: 1 })
  expect(progress).toEqual([
    { completed: 0, total: 3, generated: 0, failed: 0 },
    { completed: 1, total: 3, generated: 1, failed: 0 },
    { completed: 2, total: 3, generated: 1, failed: 1 },
    { completed: 3, total: 3, generated: 2, failed: 1 },
  ])
  fetchMock.mockRestore()
})
