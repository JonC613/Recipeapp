import { jsonError, recipeNotFound } from '../http.js'
import { getRecipe, getRecipeGraphicKey, setRecipeGraphicKey } from '../repositories/recipes.js'
import { OpenAiRecipeGraphic, RecipeGraphicError } from '../services/ai/openai-recipe-graphic.js'

export async function handleRecipeGraphic(request: Request, env: Env, recipeId: string, graphic?: string): Promise<Response> {
  const recipe = await getRecipe(env.DB, recipeId)
  if (!recipe) return recipeNotFound()
  if (request.method === 'GET' && graphic === 'graphic') {
    const key = await getRecipeGraphicKey(env.DB, recipeId)
    const object = key ? await env.RECIPE_SOURCES.get(key) : undefined
    return object ? new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType ?? 'image/png', 'cache-control': 'private, max-age=31536000, immutable' } }) : new Response(null, { status: 404 })
  }
  if (request.method !== 'POST' || graphic !== 'graphic') return new Response(null, { status: 405 })
  if (recipe.graphicAvailable) return jsonError('CONFLICT', 'This recipe already has a generated graphic.', false, 409)
  try {
    const bytes = await new OpenAiRecipeGraphic(env.OPENAI_API_KEY).generate(recipe)
    const key = `recipe-graphics/${recipeId}.png`
    await env.RECIPE_SOURCES.put(key, bytes, { httpMetadata: { contentType: 'image/png' } })
    await setRecipeGraphicKey(env.DB, recipeId, key)
    return Response.json({ graphicUrl: `/api/recipes/${encodeURIComponent(recipeId)}/graphic` }, { status: 201 })
  } catch (error) {
    const message = error instanceof RecipeGraphicError && error.code === 'INVALID_OUTPUT' ? 'The generated graphic could not be used. Try again later.' : 'Recipe graphic generation is temporarily unavailable. Please try again.'
    return jsonError('SERVICE_UNAVAILABLE', message, true, 503)
  }
}
