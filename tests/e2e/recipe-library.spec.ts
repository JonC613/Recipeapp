import { expect, test } from '@playwright/test'

test('creates a manual recipe and reads it from the library', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Add recipe' }).click()
  await page.getByRole('textbox', { name: 'Recipe title' }).fill('Weeknight Lemon Pasta')
  await page.getByRole('textbox', { name: /ingredients/i }).fill('1 lemon\n2 tbsp olive oil')
  await page.getByRole('textbox', { name: /instructions/i }).fill('Toss and serve.')
  await page.getByRole('button', { name: 'Save recipe' }).click()

  await expect(page.getByRole('heading', { name: 'Weeknight Lemon Pasta' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible()
  await expect(page.getByText('1 lemon')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible()
  await expect(page.getByText('Toss and serve.')).toBeVisible()
})

test('edits, favorites, and deliberately deletes a recipe', async ({ page }, testInfo) => {
  const createdTitle = `Maintenance Soup ${testInfo.project.name} ${Date.now()}`
  const updatedTitle = `Edited Soup ${testInfo.project.name} ${Date.now()}`
  await page.goto('/recipes/new')
  await page.getByRole('textbox', { name: 'Recipe title' }).fill(createdTitle)
  await page.getByRole('textbox', { name: 'Description' }).fill('A weeknight soup.')
  await page.getByRole('spinbutton', { name: 'Servings' }).fill('4')
  await page.getByRole('spinbutton', { name: 'Prep minutes' }).fill('10')
  await page.getByRole('textbox', { name: /tags/i }).fill('Quick, Dinner')
  await page.getByRole('textbox', { name: 'Notes' }).fill('Keep this note.')
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await page.getByRole('link', { name: 'Edit' }).click()
  const title = page.getByRole('textbox', { name: 'Recipe title' })
  await title.fill(updatedTitle)
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()
  await expect(page.getByText('A weeknight soup.')).toBeVisible()
  await expect(page.getByText('4 servings · 10 min prep')).toBeVisible()
  await expect(page.getByText('Dinner · Quick')).toBeVisible()
  await expect(page.getByText('Keep this note.')).toBeVisible()
  const deletedDetailPath = new URL(page.url()).pathname
  await page.getByRole('button', { name: 'Favorite' }).click()
  await expect(page.getByRole('button', { name: 'Unfavorite' })).toBeVisible()
  await page.getByRole('button', { name: 'Unfavorite' }).click()
  await expect(page.getByRole('button', { name: 'Favorite' })).toBeVisible()
  await page.getByRole('button', { name: 'Favorite' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(page.getByRole('heading', { name: 'Recipe Library' })).toBeVisible()
  await expect(page.getByRole('link', { name: updatedTitle })).toHaveCount(0)
  await page.goto(deletedDetailPath)
  await expect(page.getByRole('heading', { name: 'Recipe unavailable' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to library' })).toBeVisible()
})

test('filters recipe titles and clears a no-match result', async ({ page }, testInfo) => {
  const chickenTitle = `Skillet Chicken ${testInfo.project.name} ${Date.now()}`
  const saladTitle = `Garden Salad ${testInfo.project.name} ${Date.now()}`
  for (const title of [chickenTitle, saladTitle]) {
    await page.goto('/recipes/new')
    await page.getByRole('textbox', { name: 'Recipe title' }).fill(title)
    await page.getByRole('button', { name: 'Save recipe' }).click()
  }

  await page.goto('/')
  const filter = page.getByRole('searchbox', { name: 'Filter by title' })
  await filter.fill('  cHiCkEn  ')
  await expect(page.getByRole('link', { name: chickenTitle })).toBeVisible()
  await expect(page.getByRole('link', { name: saladTitle })).toHaveCount(0)
  await filter.fill('lasagna')
  await expect(page.getByText('No recipes match that title.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.getByRole('link', { name: chickenTitle })).toBeVisible()
  await expect(page.getByRole('link', { name: saladTitle })).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
