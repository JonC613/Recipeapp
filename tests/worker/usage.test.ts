import { env, exports } from 'cloudflare:workers'
import { expect, test } from 'vitest'

const worker = exports.default as ExportedHandler<Env>
const reportingKeys = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_ANALYTICS_API_TOKEN', 'CLOUDFLARE_WORKER_NAME', 'CLOUDFLARE_D1_DATABASE_ID', 'CLOUDFLARE_R2_BUCKET_NAME', 'OPENAI_ADMIN_API_KEY'] as const

async function withoutReportingCredentials<T>(run: () => Promise<T>): Promise<T> {
  const target = env as unknown as Record<string, string | undefined>
  const saved = Object.fromEntries(reportingKeys.map((key) => [key, target[key]])) as Record<(typeof reportingKeys)[number], string | undefined>
  for (const key of reportingKeys) Reflect.deleteProperty(target, key)
  try { return await run() } finally {
    for (const key of reportingKeys) {
      if (saved[key] === undefined) Reflect.deleteProperty(target, key)
      else target[key] = saved[key]
    }
  }
}

test('returns a bounded usage dashboard without configured provider credentials', async () => {
  await env.DB.prepare("INSERT INTO recipe_imports (id, source_type, raw_text, status, created_at) VALUES (?, 'text', ?, 'ready', ?)").bind('usage-text', 'secret recipe text', '2026-08-31T12:00:00.000Z').run()
  const response = await withoutReportingCredentials(() => worker.fetch(new Request('https://recipeapp.test/api/admin/usage?range=30d')))
  expect(response.status).toBe(200)
  const body = await response.json() as { range: string; activity: { state: string; data: { aiAttempts: { text: number } } }; cloudflare: { d1: { state: string } }; openai: { state: string }; budget: { state: string } }
  expect(body.range).toBe('30d')
  expect(body.activity.state).toBe('available')
  expect(body.activity.data.aiAttempts.text).toBeGreaterThanOrEqual(1)
  expect(body.cloudflare.d1.state).toBe('not_configured')
  expect(body.openai.state).toBe('not_configured')
  expect(body.budget.state).toBe('not_configured')
  expect(JSON.stringify(body)).not.toContain('secret recipe text')
})

test('rejects unsupported usage methods and ranges safely', async () => {
  const method = await worker.fetch(new Request('https://recipeapp.test/api/admin/usage', { method: 'POST' }))
  expect(method.status).toBe(405)
  expect(method.headers.get('allow')).toBe('GET')
  const range = await worker.fetch(new Request('https://recipeapp.test/api/admin/usage?range=forever'))
  expect(range.status).toBe(400)
  await expect(range.json()).resolves.toEqual({ error: { code: 'VALIDATION_ERROR', message: 'range must be 7d, 30d, or month.', retryable: false } })
})
