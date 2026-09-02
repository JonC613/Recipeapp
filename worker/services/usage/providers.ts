import type { D1Usage, OpenAiUsageAndCost, R2Usage, UsageCapability, UsageRange, WorkerUsage } from '../../../src/domain/usage.js'
import { rangeStart } from '../../repositories/usage.js'

type UsageFetch = typeof fetch
type ReportingEnv = { CLOUDFLARE_ACCOUNT_ID?: string; CLOUDFLARE_ANALYTICS_API_TOKEN?: string; CLOUDFLARE_WORKER_NAME?: string; CLOUDFLARE_D1_DATABASE_ID?: string; CLOUDFLARE_R2_BUCKET_NAME?: string; OPENAI_ADMIN_API_KEY?: string }
const unavailable = <T>(hint: string): UsageCapability<T> => ({ state: 'unavailable', hint })
const notConfigured = <T>(hint: string): UsageCapability<T> => ({ state: 'not_configured', hint })

async function timedFetch(fetcher: UsageFetch, input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  return fetcher(input, { ...init, signal: AbortSignal.timeout(8000) })
}

export class CloudflareUsageClient {
  private readonly env: ReportingEnv
  private readonly fetcher: UsageFetch
  private readonly now: () => Date
  constructor(env: ReportingEnv, fetcher: UsageFetch = fetch, now = () => new Date()) { this.env = env; this.fetcher = fetcher; this.now = now }
  async report(range: UsageRange): Promise<{ workers: UsageCapability<WorkerUsage>; d1: UsageCapability<D1Usage>; r2: UsageCapability<R2Usage> }> {
    const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_ANALYTICS_API_TOKEN: token, CLOUDFLARE_WORKER_NAME: workerName, CLOUDFLARE_D1_DATABASE_ID: databaseId, CLOUDFLARE_R2_BUCKET_NAME: bucketName } = this.env
    if (!accountId || !token || !workerName || !databaseId || !bucketName) return { workers: notConfigured('Cloudflare analytics is not configured.'), d1: notConfigured('Cloudflare analytics is not configured.'), r2: notConfigured('Cloudflare analytics is not configured.') }
    const start = rangeStart(range, this.now()); const end = this.now().toISOString()
    const query = `query RecipeappUsage($accountTag: String!, $start: Date!, $end: Date!, $datetimeStart: String!, $datetimeEnd: String!, $worker: String!, $database: String!, $bucket: String!) { viewer { accounts(filter: { accountTag: $accountTag }) { workersInvocationsAdaptive(limit: 1, filter: { scriptName: $worker, datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd }) { sum { requests errors } } d1AnalyticsAdaptiveGroups(limit: 10000, filter: { date_geq: $start, date_leq: $end, databaseId: $database }) { sum { readQueries writeQueries } } d1StorageAdaptiveGroups(limit: 1, filter: { date_geq: $start, date_leq: $end, databaseId: $database }) { max { databaseSizeBytes } } r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd, bucketName: $bucket }) { sum { requests } } r2StorageAdaptiveGroups(limit: 1, filter: { datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd, bucketName: $bucket }) { max { objectCount payloadSize } } } } }`
    try {
      const response = await timedFetch(this.fetcher, 'https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, variables: { accountTag: accountId, start: start.slice(0, 10), end: end.slice(0, 10), datetimeStart: start, datetimeEnd: end, worker: workerName, database: databaseId, bucket: bucketName } }) })
      const body = await response.json() as { data?: { viewer?: { accounts?: Array<Record<string, unknown>> } }; errors?: unknown[] }
      if (!response.ok || body.errors?.length) throw new Error('provider error')
      const account = body.data?.viewer?.accounts?.[0]; if (!account) throw new Error('provider error')
      const retrievedAt = this.now().toISOString()
      const workers = (account.workersInvocationsAdaptive as Array<{ sum?: { requests?: number; errors?: number } }> | undefined)?.[0]?.sum
      const d1Totals = (account.d1AnalyticsAdaptiveGroups as Array<{ sum?: { readQueries?: number; writeQueries?: number } }> | undefined) ?? []
      const d1Storage = (account.d1StorageAdaptiveGroups as Array<{ max?: { databaseSizeBytes?: number } }> | undefined)?.[0]?.max
      const r2Operations = (account.r2OperationsAdaptiveGroups as Array<{ sum?: { requests?: number } }> | undefined) ?? []
      const r2Storage = (account.r2StorageAdaptiveGroups as Array<{ max?: { objectCount?: number; payloadSize?: number } }> | undefined)?.[0]?.max
      return {
        workers: workers ? { state: 'available', source: 'cloudflare', retrievedAt, data: { requests: Number(workers.requests ?? 0), errors: Number(workers.errors ?? 0) } } : unavailable('Cloudflare Workers metrics are unavailable.'),
        d1: d1Storage ? { state: 'available', source: 'cloudflare', retrievedAt, data: { rowsRead: d1Totals.reduce((total, item) => total + Number(item.sum?.readQueries ?? 0), 0), rowsWritten: d1Totals.reduce((total, item) => total + Number(item.sum?.writeQueries ?? 0), 0), storageBytes: Number(d1Storage.databaseSizeBytes ?? 0) } } : unavailable('Cloudflare D1 metrics are unavailable.'),
        r2: r2Storage ? { state: 'available', source: 'cloudflare', retrievedAt, data: { requests: r2Operations.reduce((total, item) => total + Number(item.sum?.requests ?? 0), 0), objectCount: Number(r2Storage.objectCount ?? 0), storageBytes: Number(r2Storage.payloadSize ?? 0) } } : unavailable('Cloudflare R2 metrics are unavailable.'),
      }
    } catch { return { workers: unavailable('Cloudflare analytics is temporarily unavailable.'), d1: unavailable('Cloudflare analytics is temporarily unavailable.'), r2: unavailable('Cloudflare analytics is temporarily unavailable.') } }
  }
}

export class OpenAiUsageClient {
  private readonly env: ReportingEnv
  private readonly fetcher: UsageFetch
  private readonly now: () => Date
  constructor(env: ReportingEnv, fetcher: UsageFetch = fetch, now = () => new Date()) { this.env = env; this.fetcher = fetcher; this.now = now }
  async report(range: UsageRange): Promise<UsageCapability<OpenAiUsageAndCost>> {
    const key = this.env.OPENAI_ADMIN_API_KEY
    if (!key) return notConfigured('Exact OpenAI cost reporting is not configured.')
    const start = Math.floor(new Date(rangeStart(range, this.now())).getTime() / 1000); const end = Math.floor(this.now().getTime() / 1000)
    try {
      const headers = { authorization: `Bearer ${key}` }
      const [usageResponse, costsResponse] = await Promise.all([
        timedFetch(this.fetcher, `https://api.openai.com/v1/organization/usage/completions?start_time=${start}&end_time=${end}&bucket_width=1d&group_by=model&limit=31`, { headers }),
        timedFetch(this.fetcher, `https://api.openai.com/v1/organization/costs?start_time=${start}&end_time=${end}&bucket_width=1d&limit=180`, { headers }),
      ])
      if (!usageResponse.ok || !costsResponse.ok) throw new Error('provider error')
      const usage = await usageResponse.json() as { data?: Array<{ results?: Array<{ input_tokens?: number; output_tokens?: number; num_model_requests?: number }> }> }
      const costs = await costsResponse.json() as { data?: Array<{ results?: Array<{ amount?: { value?: number; currency?: string } }> }> }
      let requests = 0; let inputTokens = 0; let outputTokens = 0
      for (const bucket of usage.data ?? []) for (const item of bucket.results ?? []) { requests += Number(item.num_model_requests ?? 0); inputTokens += Number(item.input_tokens ?? 0); outputTokens += Number(item.output_tokens ?? 0) }
      let costUsd = 0
      for (const bucket of costs.data ?? []) for (const item of bucket.results ?? []) { if (item.amount?.currency !== 'usd') throw new Error('unsupported currency'); costUsd += Number(item.amount?.value ?? 0) }
      return { state: 'available', source: 'openai', retrievedAt: this.now().toISOString(), data: { requests, inputTokens, outputTokens, costUsd } }
    } catch { return unavailable('OpenAI usage and cost reporting is temporarily unavailable.') }
  }
}
