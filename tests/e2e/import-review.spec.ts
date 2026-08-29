import { expect, test } from '@playwright/test'

const imported = { id: 'import-1', sourceType: 'url', sourceUrl: 'https://example.com/pasta', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'Draft Pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Toss.' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-29T00:00:00.000Z' } } }

test('reviews an import and explicitly saves one edited recipe', async ({ page }) => {
  await page.route('**/api/import/import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(imported) }))
  await page.route('**/api/import/import-1/approve', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'recipe-1', title: 'Edited Pasta', favorite: true }) }))
  await page.goto('/imports/import-1/review')
  await page.getByRole('textbox', { name: 'Recipe title' }).fill('Edited Pasta')
  await page.getByRole('checkbox', { name: 'Favorite recipe' }).check()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/recipe-1$/)
})

test('cancels review without submitting approval', async ({ page }) => {
  let approvals = 0
  await page.route('**/api/import/import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(imported) }))
  await page.route('**/api/import/import-1/approve', async (route) => { approvals += 1; await route.abort() })
  await page.goto('/imports/import-1/review')
  await page.getByRole('link', { name: 'Cancel' }).click()
  await expect(page).toHaveURL(/\/imports\/import-1$/)
  expect(approvals).toBe(0)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
