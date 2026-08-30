export class OcrProcessorError extends Error {
  readonly code: 'UNAVAILABLE' | 'INVALID_OUTPUT'
  constructor(code: 'UNAVAILABLE' | 'INVALID_OUTPUT') { super(code); this.code = code }
}

export interface OcrProcessor { extractPdfText(bytes: Uint8Array, sourceName?: string): Promise<{ text: string }> }
