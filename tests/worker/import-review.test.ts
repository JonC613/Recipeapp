import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { createReadyImport, getImport } from '../../worker/repositories/imports.js'
import { handleImportApproval } from '../../worker/routes/imports.js'

test('approves a ready import once without mutating its extraction snapshot', async () => {
  const imported = await createReadyImport(env.DB, 'https://example.com/pasta', { title: 'Extracted Pasta', ingredients: [{ originalText: '1 lemon' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-29T00:00:00.000Z' } })
  const request = new Request(`https://recipeapp.test/api/import/${imported.id}/approve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Reviewed Pasta', ingredients: [{ originalText: '2 lemons' }], favorite: true }) })
  const response = await handleImportApproval(request, env, imported.id)
  expect(response.status).toBe(201)
  await expect(response.json()).resolves.toMatchObject({ title: 'Reviewed Pasta', favorite: true, source: { type: 'url', originalUrl: 'https://example.com/pasta' }, ingredients: [{ originalText: '2 lemons' }] })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ approvedRecipeId: expect.any(String), draft: { title: 'Extracted Pasta', ingredients: [{ originalText: '1 lemon' }] } })
  const repeated = await handleImportApproval(new Request(`https://recipeapp.test/api/import/${imported.id}/approve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Reviewed Pasta' }) }), env, imported.id)
  expect(repeated.status).toBe(409)
})

test('returns contract-safe validation, missing, and non-ready approval outcomes', async () => {
  const missing = await handleImportApproval(new Request('https://recipeapp.test/api/import/missing/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Recipe' }) }), env, 'missing')
  expect(missing.status).toBe(404)
  const invalid = await handleImportApproval(new Request('https://recipeapp.test/api/import/missing/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: ' ' }) }), env, 'missing')
  expect(invalid.status).toBe(400)
  const failed = await createReadyImport(env.DB, 'https://example.com/not-ready', { title: 'Ready first', source: { type: 'url', originalUrl: 'https://example.com/not-ready', importedAt: '2026-08-29T00:00:00.000Z' } })
  await env.DB.prepare("UPDATE recipe_imports SET status = 'failed' WHERE id = ?").bind(failed.id).run()
  const nonReady = await handleImportApproval(new Request(`https://recipeapp.test/api/import/${failed.id}/approve`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Recipe' }) }), env, failed.id)
  expect(nonReady.status).toBe(409)
})
