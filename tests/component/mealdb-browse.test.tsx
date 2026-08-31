import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MealDbBrowse } from '../../src/components/imports/MealDbBrowse.js'

const categories = async () => [{ id: 'Chicken', label: 'Chicken' }]
const areas = async () => [{ id: 'Japanese', label: 'Japanese' }]
const searchRecipes = async () => []
const loadRecipe = async () => ({ id: '52772', title: 'Teriyaki Chicken Casserole', ingredients: [{ originalText: '1 chicken breast' }], instructions: ['Bake it.'], tags: [], attribution: 'TheMealDB' as const })

test('browses a category without creating an import', async () => {
  const browseByCategory = vi.fn().mockResolvedValue([{ id: '52772', title: 'Teriyaki Chicken Casserole' }])
  const screen = await render(<MealDbBrowse loadCategories={categories} loadAreas={areas} browseByCategory={browseByCategory} browseByArea={vi.fn()} searchRecipes={searchRecipes} loadRecipe={loadRecipe} importRecipe={vi.fn()} />)
  await expect.element(screen.getByRole('button', { name: 'Browse recipes' })).toBeVisible()
  await screen.getByRole('button', { name: 'Browse recipes' }).click()
  await expect.element(screen.getByRole('heading', { name: 'Teriyaki Chicken Casserole' })).toBeVisible()
  expect(browseByCategory).toHaveBeenCalledWith('Chicken')
  await expect.element(screen.getByText('Nothing is saved until you explicitly import a recipe.')).toBeVisible()
})

test('shows a safe recovery message when provider browse fails', async () => {
  const screen = await render(<MealDbBrowse loadCategories={categories} loadAreas={areas} browseByCategory={vi.fn().mockRejectedValue(new Error('TheMealDB is temporarily unavailable. Please try again.'))} browseByArea={vi.fn()} searchRecipes={searchRecipes} loadRecipe={loadRecipe} importRecipe={vi.fn()} />)
  await screen.getByRole('button', { name: 'Browse recipes' }).click()
  await expect.element(screen.getByText('TheMealDB is temporarily unavailable. Please try again.')).toBeVisible()
})

test('searches and previews a recipe without importing it', async () => {
  const search = vi.fn().mockResolvedValue([{ id: '52772', title: 'Teriyaki Chicken Casserole' }])
  const importRecipe = vi.fn().mockResolvedValue(undefined)
  const screen = await render(<MealDbBrowse loadCategories={categories} loadAreas={areas} browseByCategory={vi.fn()} browseByArea={vi.fn()} searchRecipes={search} loadRecipe={loadRecipe} importRecipe={importRecipe} />)
  await screen.getByRole('textbox', { name: 'Search TheMealDB by recipe name' }).fill('teriyaki')
  await screen.getByRole('button', { name: 'Search recipes' }).click()
  await screen.getByRole('button', { name: 'Preview recipe' }).click()
  await expect.element(screen.getByRole('heading', { name: 'Teriyaki Chicken Casserole' })).toBeVisible()
  await expect.element(screen.getByText('Review the recipe before import. Nothing is saved yet.')).toBeVisible()
  expect(search).toHaveBeenCalledWith('teriyaki')
  await screen.getByRole('button', { name: 'Import for review' }).click()
  expect(importRecipe).toHaveBeenCalledWith('52772')
})
