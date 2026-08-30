import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handlePdfImport } from '../../worker/routes/imports.js'
import type { RecipeParser } from '../../worker/services/ai/recipe-parser.js'
import { RecipeParserError } from '../../worker/services/ai/recipe-parser.js'
import { ContentExtractorError, type ContentExtractor } from '../../worker/services/extraction/content-extractor.js'

const bytes = new TextEncoder().encode('%PDF-1.7 controlled recipe')
const parser: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'recipe', draft: { title: 'PDF pasta', ingredients: [{ originalText: '1 heaping tablespoon rosemary' }], instructions: [{ text: 'Cook gently.' }] } })) }
const extractor: ContentExtractor = { extract: vi.fn(async () => ({ text: 'PDF pasta\n1 heaping tablespoon rosemary\nCook gently.' })) }
function request(file: File): Request { const body = new FormData(); body.set('file', file); return new Request('https://recipeapp.test/api/import/pdf', { method: 'POST', body }) }
const sourceStore = vi.fn(async () => 'imports/test/source.pdf')

describe('PDF recipe import', () => {
  it('retains a valid PDF and creates an unsaved ready draft', async () => {
    const response = await handlePdfImport(request(new File([bytes], 'pasta.pdf', { type: 'application/pdf' })), env, { parser, extractor, store: sourceStore, now: () => '2026-08-29T00:00:00.000Z' })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ sourceType: 'pdf', sourceName: 'pasta.pdf', sourceR2Key: 'imports/test/source.pdf', draft: { title: 'PDF pasta', source: { type: 'pdf', r2ObjectKey: 'imports/test/source.pdf' }, ingredients: [{ originalText: '1 heaping tablespoon rosemary' }] } })
    expect(extractor.extract).toHaveBeenCalledWith(bytes); expect(parser.parse).toHaveBeenCalledTimes(1)
  })

  it('writes the accepted source privately through the R2 binding', async () => {
    const response = await handlePdfImport(request(new File([bytes], 'private.pdf', { type: 'application/pdf' })), env, { parser, extractor })
    const imported = await response.json() as { sourceR2Key: string }
    const stored = await env.RECIPE_SOURCES.get(imported.sourceR2Key)
    expect(response.status).toBe(201); expect(stored).not.toBeNull(); await expect(stored!.text()).resolves.toContain('%PDF-1.7')
  })

  it('rejects wrong type, bad signature, and oversized files before retention', async () => {
    const wrong = await handlePdfImport(request(new File([bytes], 'pasta.txt', { type: 'text/plain' })), env, { store: sourceStore })
    const bad = await handlePdfImport(request(new File([new TextEncoder().encode('not a PDF')], 'pasta.pdf', { type: 'application/pdf' })), env, { store: sourceStore })
    const large = await handlePdfImport(request(new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' })), env, { store: sourceStore })
    expect(wrong.status).toBe(400); expect(bad.status).toBe(400); expect(large.status).toBe(413); expect(sourceStore).toHaveBeenCalledTimes(1)
  })

  it('records a retained unreadable source and returns a safe recovery response', async () => {
    const unreadable: ContentExtractor = { extract: vi.fn(async () => { throw new ContentExtractorError('PDF_UNREADABLE') }) }
    const response = await handlePdfImport(request(new File([bytes], 'scan.pdf', { type: 'application/pdf' })), env, { extractor: unreadable, store: async () => 'imports/scan/source.pdf' })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ status: 'failed', failureCode: 'PDF_UNREADABLE', ocrStatus: 'available' })
    const records = await env.DB.prepare("SELECT source_type, status, failure_code FROM recipe_imports WHERE source_name = 'scan.pdf'").all()
    expect(records.results).toContainEqual(expect.objectContaining({ source_type: 'pdf', status: 'failed', failure_code: 'PDF_UNREADABLE' }))
  })

  it('safely refuses extraction that exceeds the review limit', async () => {
    const tooLarge: ContentExtractor = { extract: vi.fn(async () => { throw new ContentExtractorError('EXTRACTION_TOO_LARGE') }) }
    const response = await handlePdfImport(request(new File([bytes], 'long.pdf', { type: 'application/pdf' })), env, { extractor: tooLarge, store: async () => 'imports/long/source.pdf' })
    expect(response.status).toBe(422); await expect(response.text()).resolves.toContain('too much text')
  })

  it('keeps parser failures and multiple recipes out of review and the library', async () => {
    const multiple: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'multiple_recipes' })) }
    const unavailable: RecipeParser = { parse: vi.fn(async () => { throw new RecipeParserError('UNAVAILABLE', 'provider internals') }) }
    const invalid: RecipeParser = { parse: vi.fn(async () => { throw new RecipeParserError('INVALID_OUTPUT', 'provider internals') }) }
    const first = await handlePdfImport(request(new File([bytes], 'many.pdf', { type: 'application/pdf' })), env, { parser: multiple, extractor, store: async () => 'imports/many/source.pdf' })
    const second = await handlePdfImport(request(new File([bytes], 'down.pdf', { type: 'application/pdf' })), env, { parser: unavailable, extractor, store: async () => 'imports/down/source.pdf' })
    const third = await handlePdfImport(request(new File([bytes], 'invalid.pdf', { type: 'application/pdf' })), env, { parser: invalid, extractor, store: async () => 'imports/invalid/source.pdf' })
    expect(first.status).toBe(422); expect(second.status).toBe(503); expect(third.status).toBe(503); await expect(second.text()).resolves.not.toContain('provider internals'); await expect(third.text()).resolves.not.toContain('provider internals')
    const recipes = await env.DB.prepare('SELECT id FROM recipes').all(); expect(recipes.results).toHaveLength(0)
  })
})
