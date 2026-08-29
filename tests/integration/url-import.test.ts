import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { createFailedImport, createReadyImport, getImport } from '../../worker/repositories/imports.js'

test('persists a ready import without creating a recipe', async () => {
  const imported = await createReadyImport(env.DB, 'https://example.com/pasta', { title: 'Pasta', ingredients: [{ originalText: '1 lemon' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-28T00:00:00.000Z' } })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceUrl: 'https://example.com/pasta', status: 'ready', draft: { title: 'Pasta' } })
  const recipes = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipes').first<{ count: number }>()
  expect(recipes?.count).toBe(0)
})

test('keeps retry attempts as distinct import-history records', async () => {
  const sourceUrl = 'https://example.com/retry'
  const failed = await createFailedImport(env.DB, sourceUrl, 'failed', 'UNAVAILABLE')
  const ready = await createReadyImport(env.DB, sourceUrl, { title: 'Recovered recipe', source: { type: 'url', originalUrl: sourceUrl, importedAt: '2026-08-28T00:00:00.000Z' } })
  expect(failed.id).not.toBe(ready.id)
  const attempts = await env.DB.prepare('SELECT status FROM recipe_imports WHERE source_url = ? ORDER BY created_at').bind(sourceUrl).all<{ status: string }>()
  expect(attempts.results.map((attempt) => attempt.status).sort()).toEqual(['failed', 'ready'])
  const recipes = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipes').first<{ count: number }>()
  expect(recipes?.count).toBe(0)
})
