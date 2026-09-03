import { jsonError, validationError } from '../http.js'
import { normalizeWeekStart, validDayIndex } from '../../src/domain/meal-plan/schema.js'
import { addCustomGroceryItem, assignDinner, generateGroceryList, getMealPlanWeek, removeDinner, removeGroceryItem, setGroceryItemChecked } from '../repositories/meal-plans.js'

const missing = () => jsonError('NOT_FOUND', 'The requested meal-plan resource was not found.', false, 404)

export async function handleMealPlans(request: Request, env: Env, path: string): Promise<Response> {
  try {
    const url = new URL(request.url)
    if (path === '/api/meal-plans' && request.method === 'GET') {
      const week = normalizeWeekStart(url.searchParams.get('week') ?? '')
      return Response.json(await getMealPlanWeek(env.DB, week))
    }
    const dinner = path.match(/^\/api\/meal-plans\/(\d{4}-\d{2}-\d{2})\/dinners\/([^/]+)$/)
    if (dinner) {
      const week = normalizeWeekStart(dinner[1]); const dayIndex = validDayIndex(dinner[2])
      if (request.method === 'DELETE') return Response.json(await removeDinner(env.DB, week, dayIndex))
      if (request.method === 'PUT') {
        const body = await request.json() as { recipeId?: unknown }
        if (typeof body.recipeId !== 'string' || !body.recipeId.trim()) return validationError('recipeId is required')
        const result = await assignDinner(env.DB, week, dayIndex, body.recipeId)
        return result === 'missing_recipe' ? missing() : Response.json(result)
      }
    }
    const grocery = path.match(/^\/api\/meal-plans\/(\d{4}-\d{2}-\d{2})\/grocery-list$/)
    if (grocery && request.method === 'POST') return Response.json(await generateGroceryList(env.DB, normalizeWeekStart(grocery[1])))
    const groceryItem = path.match(/^\/api\/meal-plans\/(\d{4}-\d{2}-\d{2})\/grocery-items\/([^/]+)$/)
    if (groceryItem) {
      const week = normalizeWeekStart(groceryItem[1]); const id = groceryItem[2]
      if (request.method === 'DELETE') {
        const result = await removeGroceryItem(env.DB, week, id)
        return result === 'missing_item' ? missing() : Response.json(result)
      }
      if (request.method === 'PATCH') {
        const body = await request.json() as { checked?: unknown }
        if (typeof body.checked !== 'boolean') return validationError('checked must be true or false')
        const result = await setGroceryItemChecked(env.DB, week, id, body.checked)
        return result === 'missing_item' ? missing() : Response.json(result)
      }
    }
    const custom = path.match(/^\/api\/meal-plans\/(\d{4}-\d{2}-\d{2})\/grocery-items$/)
    if (custom && request.method === 'POST') {
      const body = await request.json() as { displayText?: unknown }
      if (typeof body.displayText !== 'string') return validationError('item must not be blank')
      return Response.json(await addCustomGroceryItem(env.DB, normalizeWeekStart(custom[1]), body.displayText), { status: 201 })
    }
    return new Response(null, { status: 405 })
  } catch (error) {
    return validationError(error instanceof Error ? error.message : 'Invalid meal plan request')
  }
}
