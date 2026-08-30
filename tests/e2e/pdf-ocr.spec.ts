import { expect, test } from '@playwright/test'

const available = { id: 'ocr-import-1', sourceType: 'pdf', sourceName: 'scan.pdf', sourceR2Key: 'imports/scan/source.pdf', status: 'failed', failureCode: 'PDF_UNREADABLE', ocrStatus: 'available', createdAt: '2026-08-29T00:00:00.000Z' }
const ready = { ...available, status: 'ready', failureCode: undefined, ocrStatus: 'succeeded', extractionMethod: 'ocr', sourceText: 'Scanned soup\n1 cup stock\nSimmer.', draft: { title: 'Scanned soup', ingredients: [{ originalText: '1 cup stock' }], instructions: [{ text: 'Simmer.' }], source: { type: 'pdf', sourceName: 'scan.pdf', r2ObjectKey: 'imports/scan/source.pdf', importedAt: '2026-08-29T00:00:00.000Z' } } }

test('explicit OCR shows progress, reaches review/save, and cannot be repeated', async ({ page }) => {
  let ocrCalls = 0
  let isReady = false
  let approved = false
  let releaseOcr!: () => void
  const ocrGate = new Promise<void>((resolve) => { releaseOcr = resolve })

  await page.route('**/api/import/ocr-import-1/ocr', async (route) => {
    ocrCalls += 1
    await ocrGate
    isReady = true
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(ready) })
  })
  await page.route('**/api/import/ocr-import-1/approve', async (route) => {
    approved = true
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'ocr-recipe-1', title: 'Scanned soup', favorite: false, source: { type: 'pdf', sourceName: 'scan.pdf', r2ObjectKey: 'imports/scan/source.pdf' } }) })
  })
  await page.route('**/api/import/ocr-import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(approved ? { ...ready, approvedRecipeId: 'ocr-recipe-1' } : isReady ? ready : available) }))
  await page.route('**/api/recipes/ocr-recipe-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ocr-recipe-1', title: 'Scanned soup', favorite: false, tags: [], ingredients: [{ id: 'i1', originalText: '1 cup stock', ingredient: 'stock' }], instructions: [{ id: 's1', stepNumber: 1, text: 'Simmer.' }], source: { type: 'pdf', sourceName: 'scan.pdf', r2ObjectKey: 'imports/scan/source.pdf' }, createdAt: '2026-08-29T00:00:00.000Z', updatedAt: '2026-08-29T00:00:00.000Z' }) }))

  await page.goto('/imports/ocr-import-1')
  await expect(page.getByText(/OCR uses AI credits/)).toBeVisible()
  expect(ocrCalls).toBe(0)
  await page.getByRole('button', { name: 'Try OCR' }).click()
  await expect(page.getByRole('button', { name: 'Reading PDF…' })).toBeDisabled()
  await expect(page.getByRole('progressbar', { name: 'OCR in progress' })).toBeVisible()
  releaseOcr()

  await expect(page).toHaveURL(/\/imports\/ocr-import-1\/review$/)
  await expect(page.getByText('This scanned PDF was read with OCR')).toBeVisible()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/ocr-recipe-1$/)
  await expect(page.getByRole('heading', { name: 'Scanned soup' })).toBeVisible()

  await page.goto('/imports/ocr-import-1')
  await expect(page.getByRole('button', { name: 'Try OCR' })).toHaveCount(0)
  expect(ocrCalls).toBe(1)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
