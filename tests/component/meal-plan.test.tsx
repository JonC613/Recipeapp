import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createMemoryRouter, RouterProvider } from 'react-router'

const services = vi.hoisted(() => ({ getMealPlanWeek: vi.fn(), assignDinner: vi.fn(), removeDinner: vi.fn(), generateGroceryList: vi.fn(), addCustomGroceryItem: vi.fn(), setGroceryItemChecked: vi.fn(), removeGroceryItem: vi.fn(), listRecipes: vi.fn() }))
vi.mock('../../src/services/meal-plans', () => services)
vi.mock('../../src/services/recipes', () => ({ listRecipes: services.listRecipes }))
import { MealPlanPage } from '../../src/pages/MealPlanPage'

const week = { weekStart: '2026-09-06', planRevision: 0, groceryListStale: false, dinners: [], groceryItems: [] }

beforeEach(() => { Object.values(services).forEach((mock) => mock.mockReset()); services.getMealPlanWeek.mockResolvedValue(week); services.listRecipes.mockResolvedValue([{ id: 'pasta', title: 'Lemon Pasta', favorite: false }]) })

test('renders seven dinner slots and an explicit grocery generation action', async () => {
  const router = createMemoryRouter([{ path: '/meal-plan', element: <MealPlanPage /> }], { initialEntries: ['/meal-plan'] })
  const screen = await render(<RouterProvider router={router} />)
  await expect.element(screen.getByRole('heading', { name: 'Meal Plan' })).toBeVisible()
  await expect.element(screen.getByText(/Sunday/).first()).toBeVisible()
  await expect.element(screen.getByText(/Saturday/).first()).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Generate grocery list' })).toBeVisible()
  expect(services.generateGroceryList).not.toHaveBeenCalled()
})
