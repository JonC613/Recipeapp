import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createMemoryRouter, RouterProvider } from 'react-router'

const services = vi.hoisted(() => ({ getRecipe: vi.fn() }))
vi.mock('../../src/services/recipes', () => services)

import { CookingModePage } from '../../src/pages/CookingModePage'

const recipe = { id: 'pasta', title: 'Garlic Pasta', favorite: false, tags: [], ingredients: [{ id: 'i1', position: 1, originalText: '8 ounces spaghetti' }], instructions: [{ id: 's1', stepNumber: 1, text: 'Boil the pasta.' }, { id: 's2', stepNumber: 2, text: 'Toss with garlic butter.' }], source: { type: 'manual' as const }, createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }

beforeEach(() => services.getRecipe.mockReset())

test('moves through instructions without another recipe request and keeps ingredients available', async () => {
  services.getRecipe.mockResolvedValue(recipe)
  const router = createMemoryRouter([{ path: '/recipes/:recipeId/cook', element: <CookingModePage /> }], { initialEntries: ['/recipes/pasta/cook'] })
  const screen = await render(<RouterProvider router={router} />)

  await expect.element(screen.getByText('Step 1 of 2')).toBeVisible()
  await expect.element(screen.getByText('Boil the pasta.')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled()
  await expect.element(screen.getByText('8 ounces spaghetti')).toBeVisible()
  await screen.getByRole('button', { name: 'Next step' }).click()
  await expect.element(screen.getByText('Step 2 of 2')).toBeVisible()
  await expect.element(screen.getByText('Toss with garlic butter.')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Next step' })).toBeDisabled()
  expect(services.getRecipe).toHaveBeenCalledTimes(1)
})

test('shows an honest empty state when a recipe has no instructions', async () => {
  services.getRecipe.mockResolvedValue({ ...recipe, instructions: [] })
  const router = createMemoryRouter([{ path: '/recipes/:recipeId/cook', element: <CookingModePage /> }], { initialEntries: ['/recipes/pasta/cook'] })
  const screen = await render(<RouterProvider router={router} />)

  await expect.element(screen.getByRole('heading', { name: 'No instructions yet' })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Next step' })).not.toBeInTheDocument()
  await expect.element(screen.getByRole('link', { name: 'Edit recipe' })).toHaveAttribute('href', '/recipes/pasta/edit')
})
