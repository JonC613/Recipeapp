import { expect, test } from '@playwright/test'

test('submits a URL and shows an unsaved ready draft without horizontal overflow', async ({ page }) => {
  await page.route('**/api/import/url', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({
      id: 'import-1', sourceType: 'url', sourceUrl: 'https://example.com/pasta', status: 'ready', createdAt: '2026-08-28T00:00:00.000Z',
      draft: { title: 'Fixture Pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Toss and serve.' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-28T00:00:00.000Z' } },
    }) })
  })
  await page.goto('/recipes/import')
  await page.getByRole('textbox', { name: 'Recipe URL' }).fill('https://example.com/pasta')
  await page.getByRole('button', { name: 'Import recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Fixture Pasta' })).toBeVisible()
  await expect(page.getByText('1 lemon')).toBeVisible()
  await expect(page.getByText('Toss and serve.')).toBeVisible()
  await expect(page.getByText('This is an unsaved draft.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Reopen this import draft' })).toHaveAttribute('href', '/imports/import-1')
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('offers manual-entry recovery after an unavailable import', async ({ page }) => {
  await page.route('**/api/import/url', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'That recipe page is temporarily unavailable. Please try again.', retryable: true } }) })
  })
  await page.goto('/recipes/import')
  await page.getByRole('textbox', { name: 'Recipe URL' }).fill('https://example.com/unavailable')
  await page.getByRole('button', { name: 'Import recipe' }).click()
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable')
  await expect(page.getByRole('link', { name: 'Enter a recipe manually' })).toBeVisible()
})

test('reopens a retained ready draft by its import identifier', async ({ page }) => {
  await page.route('**/api/import/import-1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: 'import-1', sourceType: 'url', sourceUrl: 'https://example.com/pasta', status: 'ready', createdAt: '2026-08-28T00:00:00.000Z',
      draft: { title: 'Retained Pasta', ingredients: [{ originalText: '1 lemon' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-28T00:00:00.000Z' } },
    }) })
  })
  await page.goto('/imports/import-1')
  await expect(page.getByRole('heading', { name: 'Retained Pasta' })).toBeVisible()
  await expect(page.getByText('1 lemon')).toBeVisible()
})
