import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { createPdfFailedImport, getImport } from '../../worker/repositories/imports.js'
import { handlePdfOcr } from '../../worker/routes/imports.js'
import { OcrProcessorError, type OcrProcessor } from '../../worker/services/ai/ocr-processor.js'
import type { RecipeParser } from '../../worker/services/ai/recipe-parser.js'

const request = () => new Request('https://recipeapp.test/api/import/id/ocr', { method: 'POST' })
const bytes = new TextEncoder().encode('%PDF-1.7 scan')

describe('PDF OCR route', () => {
  it('hands bounded OCR text to the parser and permits no second attempt', async () => {
    const imported = await createPdfFailedImport(env.DB, 'imports/scan/source.pdf', 'scan.pdf', undefined, 'failed', 'PDF_UNREADABLE')
    const ocr: OcrProcessor = { extractPdfText: vi.fn(async () => ({ text: 'Scanned soup\n1 cup stock\nSimmer.' })) }
    const parser: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'recipe', draft: { title: 'Scanned soup', ingredients: [{ originalText: '1 cup stock' }], instructions: [{ text: 'Simmer.' }] } })) }
    const dependencies = { read: vi.fn(async () => bytes), pageCount: vi.fn(async () => 2), ocr, parser }

    const first = await handlePdfOcr(request(), env, imported.id, dependencies)
    const second = await handlePdfOcr(request(), env, imported.id, dependencies)

    expect(first.status).toBe(201)
    await expect(first.json()).resolves.toMatchObject({ status: 'ready', ocrStatus: 'succeeded', extractionMethod: 'ocr', draft: { title: 'Scanned soup' } })
    expect(second.status).toBe(409)
    expect(ocr.extractPdfText).toHaveBeenCalledTimes(1)
    expect(parser.parse).toHaveBeenCalledWith({ sourceType: 'pdf', text: 'Scanned soup\n1 cup stock\nSimmer.', sourceName: 'scan.pdf' })
  })

  it('enforces the page limit before OCR', async () => {
    const imported = await createPdfFailedImport(env.DB, 'imports/long/source.pdf', 'long.pdf', undefined, 'failed', 'PDF_UNREADABLE')
    const ocr: OcrProcessor = { extractPdfText: vi.fn() }
    const response = await handlePdfOcr(request(), env, imported.id, { read: async () => bytes, pageCount: async () => 11, ocr })

    expect(response.status).toBe(413)
    expect(ocr.extractPdfText).not.toHaveBeenCalled()
    await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ ocrStatus: 'page_limit', ocrFailureCode: 'OCR_PAGE_LIMIT' })
  })

  it('returns a safe terminal failure when the OCR provider is unavailable', async () => {
    const imported = await createPdfFailedImport(env.DB, 'imports/down/source.pdf', 'down.pdf', undefined, 'failed', 'PDF_UNREADABLE')
    const ocr: OcrProcessor = { extractPdfText: vi.fn(async () => { throw new OcrProcessorError('UNAVAILABLE') }) }
    const response = await handlePdfOcr(request(), env, imported.id, { read: async () => bytes, pageCount: async () => 1, ocr })

    expect(response.status).toBe(503)
    await expect(response.text()).resolves.not.toContain('OpenAI')
    await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ ocrStatus: 'failed', ocrFailureCode: 'UNAVAILABLE' })
  })
})
