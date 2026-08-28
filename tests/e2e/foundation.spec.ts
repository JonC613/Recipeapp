import { expect, test } from '@playwright/test'

test('shows the Recipe Library shell without horizontal overflow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Recipe Library' })).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('returns a safe health response', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toEqual({ status: 'ok' })
})

test('returns JSON rather than the SPA document for unknown API routes', async ({ request }) => {
  const response = await request.get('/api/missing')

  expect(response.status()).toBe(404)
  expect(response.headers()['content-type']).toContain('application/json')
})

test('offers recovery for unknown browser routes', async ({ page }) => {
  await page.goto('/missing')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to Recipe Library' })).toBeVisible()
})

test('offers Retry when the health request fails', async ({ page }) => {
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service is temporarily unavailable.', retryable: true },
    }) })
  })

  await page.goto('/')

  await expect(page.getByRole('alert')).toContainText('Service is temporarily unavailable')
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
})
