import { expect, test } from '@playwright/test'

const plan = { weekStart: '2026-08-30', planRevision: 0, groceryListStale: false, dinners: [], groceryItems: [] }

test('opens a responsive weekly dinner plan without generating a grocery list automatically', async ({ page }) => {
  let groceryCalls = 0
  await page.route(/\/api\/meal-plans\?week=/, async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(plan) }))
  await page.route('**/api/recipes**', async (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'pasta', title: 'Lemon Pasta', favorite: false }]) }))
  await page.route('**/api/meal-plans/**/grocery-list', async (route) => { groceryCalls += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(plan) }) })
  await page.goto('/meal-plan')

  await expect(page.getByRole('heading', { name: 'Meal Plan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate grocery list' })).toBeVisible()
  await expect(page.getByText(/Sunday/).first()).toBeVisible()
  await expect(page.getByText(/Saturday/).first()).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
  expect(groceryCalls).toBe(0)
})
