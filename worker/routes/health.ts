import { jsonError, jsonResponse } from '../http.js'

export function handleHealth(request: Request, env: Env): Response {
  if (request.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'This method is not supported for this API route.', false, 405, { Allow: 'GET' })
  }
  if (!env.DB || !env.RECIPE_SOURCES) {
    return jsonError('SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.', true, 503)
  }
  return jsonResponse({ status: 'ok' })
}
