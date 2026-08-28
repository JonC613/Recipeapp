export interface ServiceAvailability { state: 'available' | 'checking' | 'idle' | 'unavailable'; message?: string; retryable: boolean }

export async function checkHealth(): Promise<ServiceAvailability> {
  try {
    const response = await fetch('/api/health', { headers: { Accept: 'application/json' } })
    if (!response.ok) return unavailable()
    const body = (await response.json()) as { status?: string }
    return body.status === 'ok' ? { state: 'available', retryable: false } : unavailable()
  } catch { return unavailable() }
}

function unavailable(): ServiceAvailability {
  return { state: 'unavailable', message: 'Service is temporarily unavailable. Please try again.', retryable: true }
}
