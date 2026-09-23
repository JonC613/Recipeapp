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

test('offers a save action for a generated recipe', async ({ page }) => {
  const proposed = { ...empty, title: 'Egg salad', messages: [
    { id: 'u1', role: 'user', text: 'Give me egg salad', citations: [], status: 'complete', createdAt: timestamp },
    { id: 'a1', role: 'assistant', text: 'No saved recipe matched, so here is one.', sourceKind: 'general', citations: [], status: 'complete', proposal: { id: 'proposal-1', kind: 'generated_recipe', summary: 'Save Classic Egg Salad', status: 'pending', preview: { recipe: { title: 'Classic Egg Salad', servings: 4, ingredients: [{ originalText: '8 large eggs' }], instructions: [{ text: 'Cook and peel the eggs.' }] } } }, createdAt: timestamp },
  ] }
  const saved = { ...proposed, messages: proposed.messages.map((message) => 'proposal' in message ? { ...message, proposal: { ...message.proposal, status: 'applied' } } : message) }
  await page.route('**/api/chat/recipes', async (route) => route.fulfill({ contentType: 'application/json', body: route.request().method() === 'GET' ? JSON.stringify([{ id: empty.id, title: empty.title, createdAt: timestamp, updatedAt: timestamp }]) : JSON.stringify(empty) }))
  await page.route('**/api/chat/recipes/chat-1', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(proposed) }))
  await page.route('**/api/chat/recipes/chat-1/proposals/proposal-1/apply', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(saved) }))
  await page.goto('/recipes/chat')
  await expect(page.getByRole('heading', { name: 'Classic Egg Salad' })).toBeVisible()
  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page.getByText('Saved to your recipe library')).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
