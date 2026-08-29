import { expect, test } from '@playwright/test'

const textImport = { id: 'text-import-1', sourceType: 'text', sourceText: 'Rosemary potatoes\n1 tablespoon rosemary\nRoast.', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'Rosemary potatoes', ingredients: [{ originalText: '1 tablespoon rosemary' }], instructions: [{ text: 'Roast.' }], source: { type: 'text', importedAt: '2026-08-29T00:00:00.000Z' } } }

test('pastes text, reviews it, and saves one text-sourced recipe without overflow', async ({ page }) => {
  await page.route('**/api/import/text', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(textImport) }))
  await page.route('**/api/import/text-import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(textImport) }))
  await page.route('**/api/import/text-import-1/approve', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'recipe-text-1', title: 'Rosemary potatoes', favorite: false, source: { type: 'text' } }) }))
  await page.goto('/recipes/import')
  await page.getByRole('textbox', { name: 'Recipe text' }).fill(textImport.sourceText)
  await page.getByRole('button', { name: 'Extract recipe' }).click()
  await expect(page.getByRole('heading', { name: 'Rosemary potatoes' })).toBeVisible()
  await page.getByRole('link', { name: 'Review and save' }).last().click()
  await expect(page.getByText('Pasted recipe text')).toBeVisible()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/recipe-text-1$/)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('rejects empty text locally and offers manual recovery', async ({ page }) => {
  await page.goto('/recipes/import')
  await page.getByRole('button', { name: 'Extract recipe' }).click()
  await expect(page.getByRole('alert')).toContainText('Paste recipe text')
  await expect(page.getByRole('link', { name: 'Enter a recipe manually' })).toBeVisible()
})
