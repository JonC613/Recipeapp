import type { MealPlanWeek } from '../domain/meal-plan/schema.js'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'The meal plan could not be updated.')
  }
  return response.json() as Promise<T>
}

export const getMealPlanWeek = (weekStart: string) => request<MealPlanWeek>(`/api/meal-plans?week=${encodeURIComponent(weekStart)}`)
export const assignDinner = (weekStart: string, dayIndex: number, recipeId: string) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/dinners/${dayIndex}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recipeId }) })
export const removeDinner = (weekStart: string, dayIndex: number) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/dinners/${dayIndex}`, { method: 'DELETE' })
export const generateGroceryList = (weekStart: string) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/grocery-list`, { method: 'POST' })
export const addCustomGroceryItem = (weekStart: string, displayText: string) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/grocery-items`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayText }) })
export const setGroceryItemChecked = (weekStart: string, itemId: string, checked: boolean) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/grocery-items/${encodeURIComponent(itemId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ checked }) })
export const removeGroceryItem = (weekStart: string, itemId: string) => request<MealPlanWeek>(`/api/meal-plans/${weekStart}/grocery-items/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
