import { exports } from 'cloudflare:workers'
import { expect, test } from 'vitest'

const worker = exports.default as ExportedHandler<Env>

test('returns the contracted health response', async () => {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/health'))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})

test('rejects unsupported health methods without internal details', async () => {
  const response = await worker.fetch(
    new Request('https://recipeapp.test/api/health', { method: 'POST' }),
  )

  expect(response.status).toBe(405)
  expect(response.headers.get('allow')).toBe('GET')
  await expect(response.json()).resolves.toEqual({
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'This method is not supported for this API route.',
      retryable: false,
    },
  })
})

test('returns a JSON not-found response for unknown API routes', async () => {
  const response = await worker.fetch(new Request('https://recipeapp.test/api/missing'))

  expect(response.status).toBe(404)
  await expect(response.json()).resolves.toEqual({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route was not found.',
      retryable: false,
    },
  })
})
