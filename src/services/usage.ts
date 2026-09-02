import type { UsageDashboard, UsageRange } from '../domain/usage.js'

export async function getUsageDashboard(range: UsageRange): Promise<UsageDashboard> {
  const response = await fetch(`/api/admin/usage?range=${encodeURIComponent(range)}`, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('Usage reporting is temporarily unavailable. Please try again.')
  return response.json() as Promise<UsageDashboard>
}
