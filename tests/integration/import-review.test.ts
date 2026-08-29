import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { createReadyImport, approveImport, getImport } from '../../worker/repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'

test('keeps a reviewed recipe separate from its immutable import snapshot', async () => {
  const imported = await createReadyImport(env.DB, 'https://example.com/source', { title: 'Original draft', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Mix.' }], source: { type: 'url', originalUrl: 'https://example.com/source', importedAt: '2026-08-29T00:00:00.000Z' } })
  const approved = await approveImport(env.DB, imported.id, normalizeManualRecipe({ title: 'Edited recipe', ingredients: [{ originalText: '2 lemons' }], instructions: [{ text: 'Serve.' }] }), true)
  expect(approved.recipe).toMatchObject({ title: 'Edited recipe', favorite: true, source: { type: 'url', originalUrl: 'https://example.com/source' } })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ draft: { title: 'Original draft', ingredients: [{ originalText: '1 lemon' }] }, approvedRecipeId: approved.recipe?.id })
})

test('leaving an import unapproved creates no recipe', async () => {
  await createReadyImport(env.DB, 'https://example.com/cancel', { title: 'Unsaved', source: { type: 'url', originalUrl: 'https://example.com/cancel', importedAt: '2026-08-29T00:00:00.000Z' } })
  const recipes = await env.DB.prepare('SELECT COUNT(*) AS count FROM recipes').first<{ count: number }>()
  expect(recipes?.count).toBe(0)
})
