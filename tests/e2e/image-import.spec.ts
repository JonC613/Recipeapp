import { expect, test } from '@playwright/test'

const available = { id: 'image-import-1', sourceType: 'image', sourceName: 'recipe-card.jpg', status: 'pending', visionStatus: 'available', createdAt: '2026-08-31T00:00:00.000Z' }
const ready = { ...available, status: 'ready', visionStatus: 'succeeded', extractionMethod: 'vision', draft: { title: 'Image pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Cook gently.' }], source: { type: 'image', sourceName: 'recipe-card.jpg', importedAt: '2026-08-31T00:00:00.000Z' } } }

test('pastes an image locally before explicitly retaining it', async ({ page }) => {
  let uploads = 0
  await page.route('**/api/import/image', async (route) => {
    uploads += 1
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(available) })
  })
  await page.goto('/recipes/import')
  await page.getByRole('group', { name: 'Paste a copied screenshot' }).evaluate((target) => {
    const clipboard = new DataTransfer()
    clipboard.items.add(new File(['screenshot'], 'copied-recipe.png', { type: 'image/png' }))
    target.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }))
  })

  await expect(page.getByRole('region', { name: 'Pasted image candidate' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use pasted image' })).toBeVisible()
  expect(uploads).toBe(0)

  await page.getByRole('button', { name: 'Use pasted image' }).click()
  await expect(page.getByText('Image retained privately.')).toBeVisible()
  expect(uploads).toBe(1)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('image extraction is explicit, progresses once, then reaches review and save', async ({ page }) => {
  let extractionCalls = 0; let readyState = false; let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/import/image-import-1/extract-image', async (route) => { extractionCalls += 1; await gate; readyState = true; await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(ready) }) })
  await page.route('**/api/import/image-import-1/approve', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'image-recipe-1', title: 'Image pasta', favorite: false, tags: [], ingredients: [], instructions: [], source: { type: 'image', sourceName: 'recipe-card.jpg', r2ObjectKey: 'private-key' }, createdAt: '2026-08-31T00:00:00.000Z', updatedAt: '2026-08-31T00:00:00.000Z' }) }))
  await page.route('**/api/import/image-import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(readyState ? ready : available) }))
  await page.route('**/api/recipes/image-recipe-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'image-recipe-1', title: 'Image pasta', favorite: false, tags: [], ingredients: [{ id: 'i1', originalText: '1 lemon' }], instructions: [{ id: 's1', stepNumber: 1, text: 'Cook gently.' }], source: { type: 'image', sourceName: 'recipe-card.jpg', r2ObjectKey: 'private-key' }, createdAt: '2026-08-31T00:00:00.000Z', updatedAt: '2026-08-31T00:00:00.000Z' }) }))
  await page.goto('/imports/image-import-1')
  await expect(page.getByText(/Extract recipe uses AI credits/)).toBeVisible(); expect(extractionCalls).toBe(0)
  await page.getByRole('button', { name: 'Extract recipe' }).click()
  await expect(page.getByRole('button', { name: 'Extracting recipe…' })).toBeDisabled()
  await expect(page.getByRole('progressbar', { name: 'Image extraction in progress' })).toBeVisible()
  release()
  await expect(page).toHaveURL(/\/imports\/image-import-1\/review$/)
  await expect(page.getByText('This recipe was extracted from an image with AI.')).toBeVisible()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/image-recipe-1$/)
  await expect(page.getByText('Imported from image: recipe-card.jpg')).toBeVisible()
  expect(extractionCalls).toBe(1)
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
