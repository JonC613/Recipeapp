import { jsonError } from './http.js'
import { handleHealth } from './routes/health.js'

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/health') return handleHealth(request, env)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return jsonError('NOT_FOUND', 'The requested API route was not found.', false, 404)
    }

    return new Response(null, { status: 404 })
  },
} satisfies ExportedHandler<Env>
