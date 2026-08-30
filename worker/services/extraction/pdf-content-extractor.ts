import { extractText, getDocumentProxy } from 'unpdf'
import { ContentExtractorError, type ContentExtractor } from './content-extractor.js'

export const MAX_EXTRACTED_TEXT_LENGTH = 50_000

export class PdfContentExtractor implements ContentExtractor {
  async extract(bytes: Uint8Array): Promise<{ text: string }> {
    try {
      const pdf = await getDocumentProxy(bytes)
      const extracted = await extractText(pdf, { mergePages: true })
      const text = extracted.text.trim()
      if (text.length > MAX_EXTRACTED_TEXT_LENGTH) throw new ContentExtractorError('EXTRACTION_TOO_LARGE')
      if (!text) throw new ContentExtractorError('PDF_UNREADABLE')
      return { text }
    } catch (error) {
      if (error instanceof ContentExtractorError) throw error
      throw new ContentExtractorError('PDF_UNREADABLE')
    }
  }
}

type PdfDocumentLoader = (bytes: Uint8Array) => Promise<{ numPages: number }>

export async function getPdfPageCount(bytes: Uint8Array, loadDocument: PdfDocumentLoader = getDocumentProxy): Promise<number> {
  // PDF.js may transfer/detach the supplied buffer. Count from a copy because the
  // original bytes are still needed immediately afterward by the OCR provider.
  try { return (await loadDocument(Uint8Array.from(bytes))).numPages }
  catch { throw new ContentExtractorError('PDF_UNREADABLE') }
}
