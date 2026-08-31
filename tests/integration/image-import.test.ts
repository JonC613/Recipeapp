import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { approveImport, claimImageVisionAttempt, createImagePendingImport, finishImageVision, getImport, publicImport } from '../../worker/repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'

test('keeps an image source and vision snapshot immutable through one approval', async () => {
  const imported = await createImagePendingImport(env.DB, 'image-import-1', 'imports/image-import-1/source.jpg', 'recipe-card.jpg', '2026-08-31T00:00:00.000Z')
  await claimImageVisionAttempt(env.DB, imported.id)
  await finishImageVision(env.DB, imported.id, { draft: { title: 'Image draft', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Mix.' }], source: { type: 'image', sourceName: 'recipe-card.jpg', r2ObjectKey: 'imports/image-import-1/source.jpg', importedAt: imported.createdAt } } })
  const approved = await approveImport(env.DB, imported.id, normalizeManualRecipe({ title: 'Edited image recipe', ingredients: [{ originalText: '2 lemons' }], instructions: [{ text: 'Serve.' }] }), false)
  expect(approved.recipe).toMatchObject({ title: 'Edited image recipe', source: { type: 'image', sourceName: 'recipe-card.jpg', r2ObjectKey: 'imports/image-import-1/source.jpg' } })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ draft: { title: 'Image draft', ingredients: [{ originalText: '1 lemon' }] }, visionStatus: 'succeeded', approvedRecipeId: approved.recipe?.id })
  const publicView = publicImport((await getImport(env.DB, imported.id))!)
  expect(JSON.stringify(publicView)).not.toContain('source.jpg')
})
