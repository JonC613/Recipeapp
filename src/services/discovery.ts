import type { DiscoveryPreview, DiscoverySearchResponse, DiscoverySite } from '../domain/recipe/discovery.js'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { accept: 'application/json', ...init?.headers } })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined
    throw new Error(body?.error?.message ?? 'Recipe discovery is temporarily unavailable. Please try again.')
  }
  return response.json() as Promise<T>
}

export const listDiscoverySites = () => request<DiscoverySite[]>('/api/beta/discovery/sites')
export const validateDiscoverySite = (url: string) => request<DiscoverySite>('/api/beta/discovery/sites/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })
export const approveDiscoverySite = (id: string) => request<DiscoverySite>(`/api/beta/discovery/sites/${encodeURIComponent(id)}/approve`, { method: 'POST' })
export const searchDiscoverySites = (query: string) => request<DiscoverySearchResponse>(`/api/beta/discovery/search?q=${encodeURIComponent(query)}`)
export const previewDiscoveredRecipe = (url: string) => request<DiscoveryPreview>(`/api/beta/discovery/preview?url=${encodeURIComponent(url)}`)
