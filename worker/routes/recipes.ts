import { recipeNotFound, validationError } from '../http.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import { createRecipe, deleteRecipe, getRecipe, listRecipes, setFavorite, updateRecipe } from '../repositories/recipes.js'

export async function handleRecipes(request: Request, env: Env, recipeId?: string): Promise<Response> {
  try {
    if (request.method === 'GET' && !recipeId) {
      const query = new URL(request.url).searchParams.get('q')?.trim()
      return Response.json(await listRecipes(env.DB, query || undefined))
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

export async function handleFavorite(request: Request, env: Env, recipeId: string): Promise<Response> {
  try {
    const body = await request.json() as { favorite?: unknown }
    if (typeof body.favorite !== 'boolean') return validationError('favorite must be true or false')
    const recipe = await setFavorite(env.DB, recipeId, body.favorite)
    return recipe ? Response.json(recipe) : recipeNotFound()
  } catch { return validationError('Invalid favorite request') }
}
