import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { approveImport, createTextReadyImport, getImport } from '../../worker/repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'

test('text import preserves raw source and extraction snapshot separately from recipes', async () => {
  const source = 'Family chili\n\n2 cans beans\n\nSimmer.'
  const imported = await createTextReadyImport(env.DB, source, { title: 'Family chili', ingredients: [{ originalText: '2 cans beans' }], instructions: [{ text: 'Simmer.' }], source: { type: 'text', importedAt: '2026-08-29T00:00:00.000Z' } })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceType: 'text', sourceText: source, draft: { title: 'Family chili' } })
  const recipes = await env.DB.prepare('SELECT id FROM recipes').all(); expect(recipes.results).toHaveLength(0)
})

test('text approval creates exactly one text-sourced recipe without mutating the import', async () => {
  const imported = await createTextReadyImport(env.DB, 'Original soup', { title: 'Draft soup', source: { type: 'text', importedAt: '2026-08-29T00:00:00.000Z' } })
  const recipe = normalizeManualRecipe({ title: 'Edited soup' })
  const first = await approveImport(env.DB, imported.id, recipe, false); const second = await approveImport(env.DB, imported.id, recipe, false)
  expect(first.recipe).toMatchObject({ title: 'Edited soup', source: { type: 'text' } }); expect(second.reason).toBe('already_approved')
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceText: 'Original soup', draft: { title: 'Draft soup' } })
})
