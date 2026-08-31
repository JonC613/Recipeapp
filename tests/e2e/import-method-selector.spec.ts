import { expect, test } from '@playwright/test'

test('shows one selected import workspace at a time without starting an import', async ({ page }) => {
  let importRequests = 0
  await page.route('**/api/import/**', async (route) => { importRequests += 1; await route.abort() })

  await page.goto('/recipes/import')
  await expect(page.getByRole('group', { name: 'Choose a source' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Paste a link' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('textbox', { name: 'Recipe URL' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Recipe text' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Paste recipe text' }).click()
  await expect(page.getByRole('button', { name: 'Paste recipe text' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('textbox', { name: 'Recipe text' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Recipe URL' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Use an image' }).click()
  await expect(page.getByRole('group', { name: 'Paste a copied screenshot' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Upload image' })).toBeVisible()
  expect(importRequests).toBe(0)
  await expect(page.getByText('Nothing is added to your library until you review and save it.')).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})

test('keeps browse and manual entry as distinct source choices', async ({ page }) => {
  await page.goto('/recipes/import')

  await expect(page.getByRole('link', { name: 'Browse TheMealDB recipes' })).toHaveAttribute('href', '/recipes/mealdb')
  await expect(page.getByRole('link', { name: 'Enter a recipe manually' })).toHaveAttribute('href', '/recipes/new')
})
