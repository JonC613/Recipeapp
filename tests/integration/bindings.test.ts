import { env, exports } from 'cloudflare:workers'
import { afterEach, expect, test } from 'vitest'

const worker = exports.default as ExportedHandler<Env>
const testObjectKey = 'test/foundation-binding-check.txt'

afterEach(async () => {
  await env.RECIPE_SOURCES.delete(testObjectKey)
})

test('provides isolated local D1 and R2 bindings', async () => {
  const d1Result = await env.DB.prepare('SELECT 1 AS value').first<{ value: number }>()
  await env.RECIPE_SOURCES.put(testObjectKey, 'foundation')
  const object = await env.RECIPE_SOURCES.get(testObjectKey)

  expect(d1Result?.value).toBe(1)
  await expect(object?.text()).resolves.toBe('foundation')
})

test('routes API requests through the Worker', async () => {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/health'))

  expect(response.headers.get('content-type')).toContain('application/json')
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
