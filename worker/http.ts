export type PublicErrorCode = 'METHOD_NOT_ALLOWED' | 'NOT_FOUND' | 'SERVICE_UNAVAILABLE'

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
