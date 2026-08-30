import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { approveImport, createPdfReadyImport, getImport } from '../../worker/repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'

test('PDF import preserves private provenance and original extraction through one approval', async () => {
  const originalText = 'Lemon pasta\n1 lemon\nCook pasta.'
  const imported = await createPdfReadyImport(env.DB, 'imports/example/source.pdf', 'lemon-pasta.pdf', originalText, { title: 'Lemon pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Cook pasta.' }], source: { type: 'pdf', sourceName: 'lemon-pasta.pdf', r2ObjectKey: 'imports/example/source.pdf', importedAt: '2026-08-29T00:00:00.000Z' } })
  const first = await approveImport(env.DB, imported.id, normalizeManualRecipe({ title: 'Edited lemon pasta', ingredients: [{ originalText: '2 lemons' }] }), false)
  const second = await approveImport(env.DB, imported.id, normalizeManualRecipe({ title: 'Again' }), false)
  expect(first.recipe).toMatchObject({ title: 'Edited lemon pasta', source: { type: 'pdf', sourceName: 'lemon-pasta.pdf', r2ObjectKey: 'imports/example/source.pdf' } })
  expect(second.reason).toBe('already_approved')
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceText: originalText, sourceName: 'lemon-pasta.pdf', sourceR2Key: 'imports/example/source.pdf', draft: { title: 'Lemon pasta' } })
})
