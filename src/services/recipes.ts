import type { ManualRecipeInput, RecipeIngredientInput, RecipeInstructionInput } from '../domain/recipe/schema.js'

export interface RecipeSummary { id: string; title: string; favorite: boolean; prepMinutes?: number; cookMinutes?: number; category?: string }
export interface Recipe extends RecipeSummary, ManualRecipeInput {
  ingredients: Array<RecipeIngredientInput & { id: string; position: number }>
  instructions: Array<RecipeInstructionInput & { id: string; stepNumber: number }>
  tags: string[]
  source: { type: 'manual' }
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'The recipe request could not be completed.')
  }
  return response.json() as Promise<T>
}

export function listRecipes(query?: string): Promise<RecipeSummary[]> {
  const trimmed = query?.trim()
  return request(trimmed ? `/api/recipes?q=${encodeURIComponent(trimmed)}` : '/api/recipes')
}
export function getRecipe(id: string): Promise<Recipe> { return request(`/api/recipes/${encodeURIComponent(id)}`) }
export function createRecipe(recipe: ManualRecipeInput): Promise<Recipe> {
  return request('/api/recipes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(recipe) })
}
export function updateRecipe(id: string, recipe: ManualRecipeInput): Promise<Recipe> { return request(`/api/recipes/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(recipe) }) }
export function setFavorite(id: string, favorite: boolean): Promise<Recipe> { return request(`/api/recipes/${encodeURIComponent(id)}/favorite`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favorite }) }) }
export async function deleteRecipe(id: string): Promise<void> {
  const response = await fetch(`/api/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('The recipe could not be deleted.')
}
