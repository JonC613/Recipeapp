import { describe, expect, it, vi } from 'vitest'
import { CloudflareUsageClient, OpenAiUsageClient } from '../../worker/services/usage/providers.js'

const cloudflareEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'account-id',
  CLOUDFLARE_ANALYTICS_API_TOKEN: 'reporting-token',
  CLOUDFLARE_WORKER_NAME: 'recipeapp',
  CLOUDFLARE_D1_DATABASE_ID: 'database-id',
  CLOUDFLARE_R2_BUCKET_NAME: 'recipeapp-sources',
}

describe('usage provider clients', () => {
  it('maps Cloudflare account analytics without exposing its token', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ data: { viewer: { accounts: [{
      workersInvocationsAdaptive: [{ sum: { requests: 12, errors: 1 } }],
      d1AnalyticsAdaptiveGroups: [{ sum: { readQueries: 34, writeQueries: 5 } }],
      d1StorageAdaptiveGroups: [{ max: { databaseSizeBytes: 2048 } }],
      r2OperationsAdaptiveGroups: [{ sum: { requests: 8 } }],
      r2StorageAdaptiveGroups: [{ max: { objectCount: 3, payloadSize: 1024 } }],
    }] } } }), { status: 200 }))
    const client = new CloudflareUsageClient(cloudflareEnv, request as unknown as typeof fetch, () => new Date('2026-09-01T12:00:00.000Z'))

    const report = await client.report('7d')
    expect(report).toMatchObject({
      workers: { state: 'available', data: { requests: 12, errors: 1 } },
      d1: { state: 'available', data: { rowsRead: 34, rowsWritten: 5, storageBytes: 2048 } },
      r2: { state: 'available', data: { requests: 8, objectCount: 3, storageBytes: 1024 } },
    })
    expect(JSON.stringify(report)).not.toContain('reporting-token')
    expect(String(request.mock.calls[0]?.[1]?.body)).toContain('readQueries')
    expect(String(request.mock.calls[0]?.[1]?.body)).toContain('date_geq')
  })

  it('returns safe unavailable state when OpenAI organization reporting rejects a non-admin key', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'forbidden' } }), { status: 403 }))
    const client = new OpenAiUsageClient({ OPENAI_ADMIN_API_KEY: 'reporting-key' }, request as unknown as typeof fetch, () => new Date('2026-09-01T12:00:00.000Z'))

    const report = await client.report('7d')
    expect(report).toEqual({ state: 'unavailable', hint: 'OpenAI usage and cost reporting is temporarily unavailable.' })
    expect(JSON.stringify(report)).not.toContain('reporting-key')
  })
})
