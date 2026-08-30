import { env } from 'cloudflare:workers'
import { expect, test } from 'vitest'
import { claimPdfOcrAttempt, createPdfFailedImport, finishPdfOcr, getImport } from '../../worker/repositories/imports.js'

test('OCR is claimed once and its successful source text and draft cannot be overwritten', async () => {
  const imported = await createPdfFailedImport(env.DB, 'imports/scan/source.pdf', 'scan.pdf', undefined, 'failed', 'PDF_UNREADABLE')
  await expect(claimPdfOcrAttempt(env.DB, imported.id)).resolves.toMatchObject({ ocrStatus: 'attempted' })
  await expect(claimPdfOcrAttempt(env.DB, imported.id)).resolves.toBeUndefined()

  const draft = { title: 'Scanned soup', ingredients: [{ originalText: '1 cup stock' }], instructions: [{ text: 'Simmer.' }], source: { type: 'pdf' as const, sourceName: 'scan.pdf', r2ObjectKey: 'imports/scan/source.pdf', importedAt: imported.createdAt } }
  await finishPdfOcr(env.DB, imported.id, { text: 'Scanned soup\n1 cup stock\nSimmer.', draft })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ status: 'ready', sourceR2Key: 'imports/scan/source.pdf', sourceText: 'Scanned soup\n1 cup stock\nSimmer.', draft: { title: 'Scanned soup' }, ocrStatus: 'succeeded', extractionMethod: 'ocr' })

  await finishPdfOcr(env.DB, imported.id, { text: 'overwrite', draft: { ...draft, title: 'Overwritten' } })
  await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceText: 'Scanned soup\n1 cup stock\nSimmer.', draft: { title: 'Scanned soup' } })
})
