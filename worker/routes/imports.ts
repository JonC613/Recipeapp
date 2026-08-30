import { ImportError } from '../../src/domain/recipe/imports.js'
import { importError, jsonError, textImportError } from '../http.js'
import { claimPdfOcrAttempt, createFailedImport, createPdfFailedImport, createPdfReadyImport, createReadyImport, createTextFailedImport, createTextReadyImport, finishPdfOcr, getImport } from '../repositories/imports.js'
import { approveImport } from '../repositories/imports.js'
import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import type { ManualRecipeInput } from '../../src/domain/recipe/schema.js'
import { extractRecipeDraft } from '../services/extraction/json-ld.js'
import { fetchRecipePage, validatePublicUrl } from '../services/extraction/url-fetcher.js'
import { OpenAiRecipeParser } from '../services/ai/openai-recipe-parser.js'
import { RecipeParserError, type RecipeParser } from '../services/ai/recipe-parser.js'
import { ContentExtractorError, type ContentExtractor } from '../services/extraction/content-extractor.js'
import { getPdfPageCount, PdfContentExtractor } from '../services/extraction/pdf-content-extractor.js'
import { readPdfSource, storePdfSource } from '../services/storage/pdf-sources.js'
import { OpenAiPdfOcr } from '../services/ai/openai-pdf-ocr.js'
import { OcrProcessorError, type OcrProcessor } from '../services/ai/ocr-processor.js'

type UrlImportDependencies = { fetcher?: typeof fetch; now?: () => string }
type TextImportDependencies = { parser?: RecipeParser; now?: () => string }
type PdfImportDependencies = { parser?: RecipeParser; extractor?: ContentExtractor; store?: (bucket: R2Bucket, importId: string, bytes: Uint8Array, sourceName?: string) => Promise<string>; now?: () => string }
type PdfOcrDependencies = { parser?: RecipeParser; ocr?: OcrProcessor; read?: typeof readPdfSource; pageCount?: typeof getPdfPageCount }
const MAX_TEXT_LENGTH = 50_000
const MAX_PDF_BYTES = 20 * 1024 * 1024

function pdfError(message: string, status = 400, retryable = false): Response { return jsonError(status === 422 ? 'NO_RECIPE' : 'VALIDATION_ERROR', message, retryable, status) }
function sanitizeFileName(name: string): string | undefined {
  const printable = [...name].map((character) => character.charCodeAt(0) < 32 ? '_' : character).join('')
  const clean = printable.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 180)
  return clean || undefined
}
function hasPdfSignature(bytes: Uint8Array): boolean { return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-' }

export async function handlePdfOcr(request: Request, env: Env, importId: string, dependencies: PdfOcrDependencies = {}): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  const imported = await claimPdfOcrAttempt(env.DB, importId)
  if (!imported?.sourceR2Key) return jsonError('CONFLICT', 'OCR is not available for this import.', false, 409)
  try {
    const bytes = await (dependencies.read ?? readPdfSource)(env.RECIPE_SOURCES, imported.sourceR2Key)
    if (!bytes) throw new Error()
    if (await (dependencies.pageCount ?? getPdfPageCount)(bytes) > 10) { await finishPdfOcr(env.DB, importId, { failureCode: 'OCR_PAGE_LIMIT', pageLimit: true }); return jsonError('VALIDATION_ERROR', 'OCR supports PDFs up to 10 pages.', false, 413) }
    const text = (await (dependencies.ocr ?? new OpenAiPdfOcr(env.OPENAI_API_KEY, env.OPENAI_OCR_MODEL ?? env.OPENAI_MODEL)).extractPdfText(bytes, imported.sourceName)).text
    const result = await (dependencies.parser ?? new OpenAiRecipeParser(env.OPENAI_API_KEY, env.OPENAI_MODEL)).parse({ sourceType: 'pdf', text, sourceName: imported.sourceName })
    if (result.outcome !== 'recipe') { const code = result.outcome === 'not_recipe' ? 'NO_RECIPE' : 'MULTIPLE_RECIPES'; await finishPdfOcr(env.DB, importId, { failureCode: code, status: result.outcome === 'not_recipe' ? 'no_recipe' : 'failed' }); return pdfError('OCR could not identify exactly one recipe.', 422) }
    await finishPdfOcr(env.DB, importId, { text, draft: { ...result.draft, source: { type: 'pdf', sourceName: imported.sourceName, r2ObjectKey: imported.sourceR2Key, importedAt: imported.createdAt } } })
    return Response.json(await getImport(env.DB, importId), { status: 201 })
  } catch (error) { const code = error instanceof OcrProcessorError || error instanceof RecipeParserError ? error.code : 'UNAVAILABLE'; await finishPdfOcr(env.DB, importId, { failureCode: code }); return jsonError('SERVICE_UNAVAILABLE', 'OCR is temporarily unavailable. Please enter the recipe manually.', true, 503) }
}

export async function handlePdfImport(request: Request, env: Env, dependencies: PdfImportDependencies = {}): Promise<Response> {
  let file: File
  try {
    const form = await request.formData(); const candidate = form.get('file')
    if (!(candidate instanceof File)) return pdfError('Choose one PDF file to import.')
    file = candidate
  } catch { return pdfError('Choose one PDF file to import.') }
  if (file.type !== 'application/pdf') return pdfError('Choose a PDF file to import.')
  if (file.size > MAX_PDF_BYTES) return pdfError('PDF files must be 20 MB or smaller.', 413)
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!hasPdfSignature(bytes)) return pdfError('Choose a valid PDF file to import.')
  const sourceName = sanitizeFileName(file.name); const sourceId = crypto.randomUUID()
  let sourceR2Key: string
  try { sourceR2Key = await (dependencies.store ?? storePdfSource)(env.RECIPE_SOURCES, sourceId, bytes, sourceName) }
  catch { return jsonError('SERVICE_UNAVAILABLE', 'The PDF source could not be stored. Please try again.', true, 503) }
  let sourceText: string | undefined
  try {
    sourceText = (await (dependencies.extractor ?? new PdfContentExtractor()).extract(bytes)).text
  } catch (error) {
    const code = error instanceof ContentExtractorError ? error.code : 'PDF_UNREADABLE'
    const failed = await createPdfFailedImport(env.DB, sourceR2Key, sourceName, undefined, 'failed', code)
    if (code === 'PDF_UNREADABLE') return Response.json(failed, { status: 201 })
    return pdfError('This PDF contains too much text to review safely.', 422)
  }
  try {
    const parser = dependencies.parser ?? new OpenAiRecipeParser(env.OPENAI_API_KEY, env.OPENAI_MODEL)
    const result = await parser.parse({ sourceType: 'pdf', text: sourceText, sourceName })
    if (result.outcome !== 'recipe') {
      const code = result.outcome === 'not_recipe' ? 'NO_RECIPE' : 'MULTIPLE_RECIPES'
      await createPdfFailedImport(env.DB, sourceR2Key, sourceName, sourceText, result.outcome === 'not_recipe' ? 'no_recipe' : 'failed', code)
      return pdfError(result.outcome === 'not_recipe' ? 'This PDF does not appear to contain one recipe.' : 'This PDF appears to contain more than one recipe. Choose a PDF with one recipe and try again.', 422)
    }
    const importedAt = dependencies.now?.() ?? new Date().toISOString()
    return Response.json(await createPdfReadyImport(env.DB, sourceR2Key, sourceName, sourceText, { ...result.draft, source: { type: 'pdf', sourceName, r2ObjectKey: sourceR2Key, importedAt } }), { status: 201 })
  } catch (error) {
    const code = error instanceof RecipeParserError ? error.code : 'UNAVAILABLE'
    await createPdfFailedImport(env.DB, sourceR2Key, sourceName, sourceText, 'failed', code)
    return jsonError(code === 'INVALID_OUTPUT' ? 'INVALID_OUTPUT' : 'SERVICE_UNAVAILABLE', code === 'INVALID_OUTPUT' ? 'The recipe extraction could not be validated. Try another PDF or enter it manually.' : 'Recipe extraction is temporarily unavailable. Please try again.', code === 'UNAVAILABLE', 503)
  }
}

export async function handleTextImport(request: Request, env: Env, dependencies: TextImportDependencies = {}): Promise<Response> {
  let sourceText: string
  try {
    const body = await request.json() as { text?: unknown }
    if (typeof body.text !== 'string' || !body.text.trim()) return jsonError('VALIDATION_ERROR', 'Paste recipe text to import.', false, 400)
    if (body.text.length > MAX_TEXT_LENGTH) return jsonError('VALIDATION_ERROR', 'Recipe text must be 50,000 characters or fewer.', false, 400)
    sourceText = body.text
  } catch { return jsonError('VALIDATION_ERROR', 'Paste recipe text to import.', false, 400) }
  try {
    const parser = dependencies.parser ?? new OpenAiRecipeParser(env.OPENAI_API_KEY, env.OPENAI_MODEL)
    const result = await parser.parse({ sourceType: 'text', text: sourceText })
    if (result.outcome !== 'recipe') {
      if (result.outcome === 'not_recipe') { await createTextFailedImport(env.DB, sourceText, 'no_recipe', 'NO_RECIPE'); return textImportError('NO_RECIPE', 'That text does not appear to contain one recipe.') }
      await createTextFailedImport(env.DB, sourceText, 'failed', 'MULTIPLE_RECIPES'); return textImportError('MULTIPLE_RECIPES', 'Paste one recipe at a time and try again.')
    }
    const importedAt = dependencies.now?.() ?? new Date().toISOString()
    return Response.json(await createTextReadyImport(env.DB, sourceText, { ...result.draft, source: { type: 'text', importedAt } }), { status: 201 })
  } catch (error) {
    const code = error instanceof RecipeParserError ? error.code : 'UNAVAILABLE'
    await createTextFailedImport(env.DB, sourceText, 'failed', code)
    return textImportError(code, code === 'INVALID_OUTPUT' ? 'The recipe extraction could not be validated. Please revise the text or enter it manually.' : 'Recipe extraction is temporarily unavailable. Please try again.')
  }
}

export async function handleUrlImport(request: Request, env: Env, dependencies: UrlImportDependencies = {}): Promise<Response> {
  let sourceUrl: string | undefined
  try {
    const body = await request.json() as { url?: unknown }
    if (typeof body.url !== 'string') return importError('INVALID_URL', 'Enter a valid public recipe URL.')
    sourceUrl = validatePublicUrl(body.url).toString()
    const page = await fetchRecipePage(sourceUrl, dependencies.fetcher)
    const importedAt = dependencies.now?.() ?? new Date().toISOString()
    const draft = extractRecipeDraft(page.html, page.url, importedAt)
    return Response.json(await createReadyImport(env.DB, page.url, draft), { status: 201 })
  } catch (error) {
    if (error instanceof ImportError && sourceUrl && error.code !== 'INVALID_URL') {
      const failureCode = error.code === 'NO_RECIPE' ? 'NO_RECIPE' : 'UNAVAILABLE'
      await createFailedImport(env.DB, sourceUrl, failureCode === 'NO_RECIPE' ? 'no_recipe' : 'failed', failureCode)
    }
    if (error instanceof ImportError) return importError(error.code === 'NO_RECIPE' ? 'NO_RECIPE' : error.code === 'INVALID_URL' ? 'INVALID_URL' : 'UNAVAILABLE', error.message)
    return importError('UNAVAILABLE', 'That recipe page is temporarily unavailable. Please try again.')
  }
}

export async function handleImport(request: Request, env: Env, importId: string): Promise<Response> {
  if (request.method !== 'GET') return new Response(null, { status: 405 })
  const imported = await getImport(env.DB, importId)
  return imported ? Response.json(imported) : jsonError('NOT_FOUND', 'The requested import was not found.', false, 404)
}

export async function handleImportApproval(request: Request, env: Env, importId: string): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })
  let body: { favorite?: unknown }
  let recipe: ReturnType<typeof normalizeManualRecipe>
  try {
    body = await request.json() as { favorite?: unknown }
    if (body.favorite != null && typeof body.favorite !== 'boolean') return jsonError('VALIDATION_ERROR', 'favorite must be true or false', false, 400)
    recipe = normalizeManualRecipe(body as ManualRecipeInput)
  } catch (error) { return jsonError('VALIDATION_ERROR', error instanceof Error ? error.message : 'Invalid reviewed recipe.', false, 400) }
  try {
    const result = await approveImport(env.DB, importId, recipe, body.favorite === true)
    if (result.reason === 'missing') return jsonError('NOT_FOUND', 'The requested import was not found.', false, 404)
    if (result.reason !== 'approved') return jsonError('CONFLICT', 'This import is not available for review.', false, 409)
    return Response.json(result.recipe, { status: 201 })
  } catch { return jsonError('SERVICE_UNAVAILABLE', 'The reviewed recipe could not be saved. Please try again.', true, 503) }
}
