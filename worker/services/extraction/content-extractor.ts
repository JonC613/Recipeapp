export type ContentExtractionFailure = 'PDF_UNREADABLE' | 'EXTRACTION_TOO_LARGE'

export class ContentExtractorError extends Error {
  readonly code: ContentExtractionFailure
  constructor(code: ContentExtractionFailure) { super(code); this.code = code }
}

export interface ContentExtractor {
  extract(bytes: Uint8Array): Promise<{ text: string }>
}
