export type PublicErrorCode = 'METHOD_NOT_ALLOWED' | 'NOT_FOUND' | 'SERVICE_UNAVAILABLE' | 'VALIDATION_ERROR' | 'NO_RECIPE' | 'CONFLICT'

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', 'no-store')
  return new Response(JSON.stringify(body), { ...init, headers })
}

export function jsonError(
  code: PublicErrorCode,
  message: string,
  retryable: boolean,
  status: number,
  headers?: HeadersInit,
): Response {
  return jsonResponse({ error: { code, message, retryable } }, { status, headers })
}

export function validationError(message: string): Response {
  return jsonError('VALIDATION_ERROR', message, false, 400)
}

export function recipeNotFound(): Response {
  return jsonError('NOT_FOUND', 'The requested recipe was not found.', false, 404)
}

export function importError(code: 'INVALID_URL' | 'NO_RECIPE' | 'UNAVAILABLE', message: string): Response {
  return code === 'INVALID_URL' ? jsonError('VALIDATION_ERROR', message, false, 400) : code === 'NO_RECIPE' ? jsonError('NO_RECIPE', message, false, 422) : jsonError('SERVICE_UNAVAILABLE', message, true, 503)
}
