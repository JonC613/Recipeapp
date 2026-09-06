import { expect, test } from '@playwright/test'

test('asks Recipe Chat and opens a cited recipe at responsive widths', async ({ page }) => {
  await page.route('**/api/chat/recipes', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ outcome: 'answer', answer: 'Garlic Shrimp uses shrimp.', citations: [{ recipeId: 'shrimp-1', title: 'Garlic Shrimp' }] }) }))
  await page.goto('/recipes/chat')
  await page.getByRole('textbox', { name: 'Your recipe question' }).fill('Which recipes use shrimp?')
  await page.getByRole('button', { name: 'Ask Recipe Chat' }).click()
  await expect(page.getByText('Garlic Shrimp uses shrimp.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Garlic Shrimp' })).toHaveAttribute('href', '/recipes/shrimp-1')
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
