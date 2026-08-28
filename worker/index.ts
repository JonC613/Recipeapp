import { jsonError } from './http.js'
import { handleHealth } from './routes/health.js'
import { handleFavorite, handleRecipes } from './routes/recipes.js'

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') return handleHealth(request, env)
    if (pathname === '/api/recipes') return handleRecipes(request, env)
    const recipeMatch = pathname.match(/^\/api\/recipes\/([^/]+)$/)
    if (recipeMatch) return handleRecipes(request, env, recipeMatch[1])
    const favoriteMatch = pathname.match(/^\/api\/recipes\/([^/]+)\/favorite$/)
    if (favoriteMatch && request.method === 'PATCH') return handleFavorite(request, env, favoriteMatch[1])
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return jsonError('NOT_FOUND', 'The requested API route was not found.', false, 404)
    }

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
