import { isUsageRange, type UsageDashboard } from '../../src/domain/usage.js'
import { jsonError, jsonResponse } from '../http.js'
import { getActivitySummary } from '../repositories/usage.js'
import { evaluateBudget } from '../services/usage/budget.js'
import { CloudflareUsageClient, OpenAiUsageClient } from '../services/usage/providers.js'

type UsageEnv = Env & { USAGE_MONTHLY_BUDGET_USD?: string; CLOUDFLARE_ACCOUNT_ID?: string; CLOUDFLARE_ANALYTICS_API_TOKEN?: string; CLOUDFLARE_WORKER_NAME?: string; CLOUDFLARE_D1_DATABASE_ID?: string; CLOUDFLARE_R2_BUCKET_NAME?: string; OPENAI_ADMIN_API_KEY?: string }

export async function handleUsage(request: Request, env: UsageEnv): Promise<Response> {
  if (request.method !== 'GET') return jsonError('METHOD_NOT_ALLOWED', 'This method is not supported for this API route.', false, 405, { Allow: 'GET' })
  const range = new URL(request.url).searchParams.get('range') ?? '30d'
  if (!isUsageRange(range)) return jsonError('VALIDATION_ERROR', 'range must be 7d, 30d, or month.', false, 400)
  try {
    const now = new Date(); const [activity, cloudflare, openai] = await Promise.all([getActivitySummary(env.DB, range, now), new CloudflareUsageClient(env, fetch, () => now).report(range), new OpenAiUsageClient(env, fetch, () => now).report(range)])
    const dashboard: UsageDashboard = { range, activity: { state: 'available', source: 'recipeapp', retrievedAt: now.toISOString(), data: activity }, cloudflare, openai, budget: evaluateBudget(env.USAGE_MONTHLY_BUDGET_USD, openai.state === 'available' ? openai.data.costUsd : undefined) }
    return jsonResponse(dashboard)
  } catch { return jsonError('SERVICE_UNAVAILABLE', 'Usage reporting is temporarily unavailable. Please try again.', true, 503) }
}
