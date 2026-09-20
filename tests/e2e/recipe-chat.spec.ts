import { expect, test } from '@playwright/test'

const timestamp = '2026-09-19T00:00:00Z'
const empty = { id: 'chat-1', title: 'New recipe chat', createdAt: timestamp, updatedAt: timestamp, messages: [] }

test('streams Recipe Chat and opens a cited recipe at responsive widths', async ({ page }) => {
  await page.route('**/api/chat/recipes', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ contentType: 'application/json', body: '[]' })
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(empty) })
  })
  await page.route('**/api/chat/recipes/chat-1/messages', async (route) => {
    const conversation = { ...empty, title: 'Which recipes use shrimp?', messages: [
      { id: 'u1', role: 'user', text: 'Which recipes use shrimp?', citations: [], status: 'complete', createdAt: timestamp },
      { id: 'a1', role: 'assistant', text: 'Garlic Shrimp uses shrimp.', sourceKind: 'library', citations: [{ recipeId: 'shrimp-1', title: 'Garlic Shrimp' }], status: 'complete', createdAt: timestamp },
    ] }
    const lines = [
      { type: 'progress', message: 'Searching your recipes…' },
      { type: 'text_delta', delta: 'Garlic Shrimp uses shrimp.' },
      { type: 'recipe_reference', citation: { recipeId: 'shrimp-1', title: 'Garlic Shrimp' } },
      { type: 'completed', conversation },
    ].map((event) => JSON.stringify(event)).join('\n') + '\n'
    return route.fulfill({ contentType: 'application/x-ndjson', body: lines })
  })
  await page.goto('/recipes/chat')
  await page.getByRole('textbox', { name: 'Message Recipe Chat' }).fill('Which recipes use shrimp?')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Garlic Shrimp uses shrimp.')).toBeVisible()
  await expect(page.getByText('From your saved recipes')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Garlic Shrimp' })).toHaveAttribute('href', '/recipes/shrimp-1')
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
