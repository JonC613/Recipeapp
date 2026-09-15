import { recipeNotFound, validationError } from '../http.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import type { RecipeSearchCriteria } from '../../src/domain/recipe/search.js'
import { createCookLog, createRecipe, deleteCookLog, deleteRecipe, getRecipe, listRecipes, setFavorite, updateRecipe } from '../repositories/recipes.js'

export async function handleRecipes(request: Request, env: Env, recipeId?: string): Promise<Response> {
  try {
    if (request.method === 'GET' && !recipeId) {
      return Response.json(await listRecipes(env.DB, parseSearchCriteria(new URL(request.url).searchParams)))
    }
    if (request.method === 'GET' && recipeId) {
      const recipe = await getRecipe(env.DB, recipeId)
      return recipe ? Response.json(recipe) : recipeNotFound()
    }
    if (request.method === 'POST' && !recipeId) {
      const input = await request.json()
      return Response.json(await createRecipe(env.DB, normalizeManualRecipe(input as never)), { status: 201 })
    }
    if (request.method === 'PUT' && recipeId) {
      const recipe = await updateRecipe(env.DB, recipeId, normalizeManualRecipe(await request.json() as never))
      return recipe ? Response.json(recipe) : recipeNotFound()
    }
    if (request.method === 'DELETE' && recipeId) return (await deleteRecipe(env.DB, recipeId)) ? new Response(null, { status: 204 }) : recipeNotFound()
    return new Response(null, { status: 405 })
  } catch (error) {
    return validationError(error instanceof Error ? error.message : 'Invalid recipe')
  }
}

function normalizedText(value: string | null): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ')
  return normalized || undefined
}

function parseSearchCriteria(params: URLSearchParams): RecipeSearchCriteria {
  const favorite = params.get('favorite')
  if (favorite !== null && favorite !== 'true' && favorite !== 'false') throw new Error('favorite must be true or false')
  return {
    q: normalizedText(params.get('q')),
    favorite: favorite === null ? undefined : favorite === 'true',
    tag: normalizedText(params.get('tag')),
    ingredient: normalizedText(params.get('ingredient')),
    cuisine: normalizedText(params.get('cuisine')),
    category: normalizedText(params.get('category')),
  }
}

export async function handleFavorite(request: Request, env: Env, recipeId: string): Promise<Response> {
  try {
    const body = await request.json() as { favorite?: unknown }
    if (typeof body.favorite !== 'boolean') return validationError('favorite must be true or false')
    const recipe = await setFavorite(env.DB, recipeId, body.favorite)
    return recipe ? Response.json(recipe) : recipeNotFound()
  } catch { return validationError('Invalid favorite request') }
}

function parseCookLog(input: unknown): { rating?: number; note?: string } {
  if (!input || typeof input !== 'object') throw new Error('Invalid cook log')
  const { rating, note } = input as { rating?: unknown; note?: unknown }
  if (rating !== undefined && (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error('rating must be a whole number from 1 to 5')
  if (note !== undefined && typeof note !== 'string') throw new Error('note must be text')
  const normalizedNote = note?.trim()
  if (note !== undefined && !normalizedNote) throw new Error('note cannot be blank')
  if (normalizedNote && normalizedNote.length > 1000) throw new Error('note must be at most 1000 characters')
  return { rating: rating as number | undefined, note: normalizedNote }
}

export async function handleCookLogs(request: Request, env: Env, recipeId: string, logId?: string): Promise<Response> {
  try {
    if (request.method === 'POST' && !logId) {
      const recipe = await createCookLog(env.DB, recipeId, parseCookLog(await request.json()))
      return recipe ? Response.json(recipe, { status: 201 }) : recipeNotFound()
    }
    if (request.method === 'DELETE' && logId) {
      const recipe = await deleteCookLog(env.DB, recipeId, logId)
      return recipe ? Response.json(recipe) : recipeNotFound()
    }
    return new Response(null, { status: 405 })
  } catch (error) { return validationError(error instanceof Error ? error.message : 'Invalid cook log') }
}
