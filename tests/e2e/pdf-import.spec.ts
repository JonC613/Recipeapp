import { expect, test } from '@playwright/test'

const imported = { id: 'pdf-import-1', sourceType: 'pdf', sourceName: 'pasta.pdf', sourceR2Key: 'imports/test/source.pdf', sourceText: 'Pasta\n1 lemon\nCook.', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'PDF pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Cook.' }], source: { type: 'pdf', sourceName: 'pasta.pdf', r2ObjectKey: 'imports/test/source.pdf', importedAt: '2026-08-29T00:00:00.000Z' } } }

test('uploads a PDF, reviews it, and saves one PDF-sourced recipe without overflow', async ({ page }) => {
  await page.route('**/api/import/pdf', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(imported) }))
  await page.route('**/api/import/pdf-import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(imported) }))
  await page.route('**/api/import/pdf-import-1/approve', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'recipe-pdf-1', title: 'PDF pasta', favorite: false, source: { type: 'pdf', sourceName: 'pasta.pdf', r2ObjectKey: 'imports/test/source.pdf' } }) }))
  await page.route('**/api/recipes/recipe-pdf-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'recipe-pdf-1', title: 'PDF pasta', favorite: false, tags: [], ingredients: [], instructions: [], source: { type: 'pdf', sourceName: 'pasta.pdf', r2ObjectKey: 'imports/test/source.pdf' } }) }))
  await page.goto('/recipes/import')
  await page.getByRole('button', { name: 'Upload a PDF' }).click()
  await page.getByLabel('Recipe PDF').setInputFiles({ name: 'pasta.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 recipe') })
  await page.getByRole('button', { name: 'Extract PDF recipe' }).click()
  await expect(page.getByRole('heading', { name: 'PDF pasta' })).toBeVisible()
  await page.getByRole('link', { name: 'Review and save' }).last().click()
  await expect(page.getByText('PDF: pasta.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/recipe-pdf-1$/)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('rejects an invalid PDF selection locally and offers manual recovery', async ({ page }) => {
  await page.goto('/recipes/import')
  await page.getByRole('button', { name: 'Upload a PDF' }).click()
  await page.getByLabel('Recipe PDF').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a PDF') })
  await page.getByRole('button', { name: 'Extract PDF recipe' }).click()
  await expect(page.getByRole('alert')).toContainText('Choose a PDF file')
  await expect(page.getByRole('link', { name: 'Enter a recipe manually' })).toBeVisible()
})
