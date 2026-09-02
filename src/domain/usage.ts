export const usageRanges = ['7d', '30d', 'month'] as const
export type UsageRange = (typeof usageRanges)[number]
export type UsageCapabilityState = 'available' | 'not_configured' | 'unavailable'

export type UsageCapability<T> =
  | { state: 'available'; source: 'recipeapp' | 'cloudflare' | 'openai'; retrievedAt: string; data: T }
  | { state: 'not_configured' | 'unavailable'; hint: string }

export type ImportSourceType = 'url' | 'text' | 'pdf' | 'image' | 'mealdb'
export type ImportStatus = 'pending' | 'ready' | 'failed' | 'no_recipe'

export interface ActivitySummary {
  recipeCount: number
  imports: Record<ImportSourceType, Record<ImportStatus, number>>
  aiAttempts: { text: number; ocr: number; image: number }
}

export interface WorkerUsage { requests: number; errors: number }
export interface D1Usage { rowsRead: number; rowsWritten: number; storageBytes: number }
export interface R2Usage { requests: number; objectCount: number; storageBytes: number }
export interface OpenAiUsageAndCost { requests: number; inputTokens: number; outputTokens: number; costUsd: number }
export type BudgetStatus =
  | { state: 'not_configured' }
  | { state: 'unavailable'; hint: string }
  | { state: 'on_track' | 'warning' | 'exceeded'; budgetUsd: number; spentUsd: number; percent: number; warningThresholdPercent: number }

export interface UsageDashboard {
  range: UsageRange
  activity: UsageCapability<ActivitySummary>
  cloudflare: { workers: UsageCapability<WorkerUsage>; d1: UsageCapability<D1Usage>; r2: UsageCapability<R2Usage> }
  openai: UsageCapability<OpenAiUsageAndCost>
  budget: BudgetStatus
}

export function isUsageRange(value: string | null): value is UsageRange { return value !== null && usageRanges.includes(value as UsageRange) }
