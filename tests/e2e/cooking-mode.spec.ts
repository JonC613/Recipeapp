import { expect, test } from '@playwright/test'

const recipe = { id: 'cook-1', title: 'Skillet Pasta', favorite: false, tags: [], ingredients: [{ id: 'i1', position: 1, originalText: '1 lemon' }], instructions: [{ id: 's1', stepNumber: 1, text: 'Heat the skillet.' }, { id: 's2', stepNumber: 2, text: 'Serve warm.' }], source: { type: 'manual' }, createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }

test('cooks a saved recipe with bounded instruction controls', async ({ page }) => {
  await page.route('**/api/recipes/cook-1', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(recipe) }))
  await page.goto('/recipes/cook-1/cook')

  await expect(page.getByRole('heading', { name: 'Skillet Pasta' })).toBeVisible()
  await expect(page.getByText('Step 1 of 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous step' })).toBeDisabled()
  await expect(page.getByText('1 lemon')).toBeVisible()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page.getByText('Step 2 of 2')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled()
  await expect(page.getByRole('link', { name: 'Exit cooking mode' })).toHaveAttribute('href', '/recipes/cook-1')
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
