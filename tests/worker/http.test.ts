import { expect, test } from 'vitest'
import { jsonError, jsonResponse } from '../../worker/http'

test('returns a non-sensitive JSON error shape', async () => {
  const response = jsonError('NOT_FOUND', 'The requested API route was not found.', false, 404)

  expect(response.status).toBe(404)
  await expect(response.json()).resolves.toEqual({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route was not found.',
      retryable: false,
    },
  })
})

test('serializes JSON with the expected content type', async () => {
  const response = jsonResponse({ status: 'ok' })

  expect(response.headers.get('content-type')).toContain('application/json')
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})
