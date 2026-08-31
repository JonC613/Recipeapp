import { jsonError, jsonResponse, validationError } from '../http.js'
import { MealDbClient, MealDbClientError } from '../services/mealdb/mealdb-client.js'

type MealDbApi = Pick<MealDbClient, 'categories' | 'areas' | 'byCategory' | 'byArea' | 'search' | 'recipe'>
type Dependencies = { client?: MealDbApi }

const MAX_QUERY_LENGTH = 120

export async function handleMealDb(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  if (request.method !== 'GET') return jsonError('METHOD_NOT_ALLOWED', 'Method not allowed.', false, 405)
  const url = new URL(request.url)
  const client = dependencies.client ?? new MealDbClient()
  try {
    if (url.pathname === '/api/mealdb/categories') return jsonResponse(await client.categories())
    if (url.pathname === '/api/mealdb/areas') return jsonResponse(await client.areas())
    if (url.pathname === '/api/mealdb/search') return jsonResponse(await client.search(query(url, 'q', 'Enter a recipe name to search.')))
    if (url.pathname === '/api/mealdb/recipes') {
      const category = optionalQuery(url, 'category')
      const area = optionalQuery(url, 'area')
      if (category && area) return validationError('Choose either a category or an area.')
      if (category) return jsonResponse(await client.byCategory(category))
      if (area) return jsonResponse(await client.byArea(area))
      return validationError('Choose a category or an area.')
    }
    const detail = url.pathname.match(/^\/api\/mealdb\/recipes\/([^/]+)$/)
    if (detail) {
      const id = decodeURIComponent(detail[1])
      if (!/^\d{1,20}$/.test(id)) return validationError('Choose a valid TheMealDB recipe.')
      return jsonResponse(await client.recipe(id))
    }
    return jsonError('NOT_FOUND', 'The requested API route was not found.', false, 404)
  } catch (error) {
    if (error instanceof QueryError) return validationError(error.message)
    if (error instanceof MealDbClientError && error.code === 'NOT_FOUND') return jsonError('NOT_FOUND', 'That TheMealDB recipe is no longer available.', false, 404)
    if (error instanceof MealDbClientError && error.code === 'INVALID_RESPONSE') return jsonError('SERVICE_UNAVAILABLE', 'TheMealDB returned an unusable response. Please try again.', true, 503)
    return jsonError('SERVICE_UNAVAILABLE', 'TheMealDB is temporarily unavailable. Please try again.', true, 503)
  }
}

function optionalQuery(url: URL, name: string): string | undefined {
  const value = url.searchParams.get(name)
  if (value == null) return undefined
  return query(url, name, `Enter a valid ${name}.`)
}

function query(url: URL, name: string, message: string): string {
  const value = url.searchParams.get(name)?.trim() ?? ''
  if (!value || value.length > MAX_QUERY_LENGTH) throw new QueryError(message)
  return value
}

class QueryError extends Error {}
