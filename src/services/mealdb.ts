import type { MealDbFacet, MealDbRecipeDetail, MealDbRecipeSummary } from '../domain/recipe/mealdb.js'
import type { RecipeImport } from '../domain/recipe/imports.js'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } }
    throw new Error(body?.error?.message ?? 'TheMealDB is temporarily unavailable. Please try again.')
  }
  return response.json() as Promise<T>
}

export function listMealDbCategories(): Promise<MealDbFacet[]> { return request('/api/mealdb/categories') }
export function listMealDbAreas(): Promise<MealDbFacet[]> { return request('/api/mealdb/areas') }
export function browseMealDbByCategory(category: string): Promise<MealDbRecipeSummary[]> { return request(`/api/mealdb/recipes?category=${encodeURIComponent(category)}`) }
export function browseMealDbByArea(area: string): Promise<MealDbRecipeSummary[]> { return request(`/api/mealdb/recipes?area=${encodeURIComponent(area)}`) }
export function searchMealDbRecipes(query: string): Promise<MealDbRecipeSummary[]> { return request(`/api/mealdb/search?q=${encodeURIComponent(query)}`) }
export function getMealDbRecipe(id: string): Promise<MealDbRecipeDetail> { return request(`/api/mealdb/recipes/${encodeURIComponent(id)}`) }
export function importMealDbRecipe(id: string): Promise<RecipeImport> { return request('/api/import/mealdb', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }) }
