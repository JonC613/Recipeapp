import { OcrProcessorError, type OcrProcessor } from './ocr-processor.js'

const MAX_OCR_TEXT_LENGTH = 50_000
const ocrSchema = { type: 'object', additionalProperties: false, required: ['text'], properties: { text: { type: 'string' } } }

function extractResponseText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { output?: unknown }).output)) return undefined
  for (const item of (payload as { output: Array<{ content?: unknown }> }).output) for (const content of Array.isArray(item.content) ? item.content : []) {
    if (content && typeof content === 'object' && (content as { type?: unknown }).type === 'output_text' && typeof (content as { text?: unknown }).text === 'string') return (content as { text: string }).text
  }
  return undefined
}
async function logRejectedResponse(label: string, response: Response): Promise<void> {
  console.warn(label, { status: response.status })
}

export class OpenAiPdfOcr implements OcrProcessor {
  private readonly request: typeof fetch
  private readonly apiKey: string
  private readonly model: string
  constructor(apiKey: string, model: string, request: typeof fetch = fetch) { this.apiKey = apiKey; this.model = model; this.request = request.bind(globalThis) }
  async extractPdfText(bytes: Uint8Array, sourceName = 'recipe.pdf'): Promise<{ text: string }> {
    let fileId: string | undefined
    let phase = 'prepare_upload'
    let response: Response
    try {
      const upload = new FormData()
      upload.append('purpose', 'user_data')
      upload.append('expires_after[anchor]', 'created_at')
      upload.append('expires_after[seconds]', '3600')
      upload.append('file', new File([Uint8Array.from(bytes)], sourceName, { type: 'application/pdf' }))
      phase = 'upload_file'
      const uploadResponse = await this.request('https://api.openai.com/v1/files', { method: 'POST', headers: { authorization: `Bearer ${this.apiKey}` }, body: upload })
      if (!uploadResponse.ok) {
        await logRejectedResponse('OpenAI PDF upload was rejected.', uploadResponse)
        throw new OcrProcessorError('UNAVAILABLE')
      }
      const uploaded = await uploadResponse.json().catch(() => undefined) as { id?: unknown } | undefined
      if (typeof uploaded?.id !== 'string') throw new OcrProcessorError('INVALID_OUTPUT')
      fileId = uploaded.id
      phase = 'create_response'
      response = await this.request('https://api.openai.com/v1/responses', { method: 'POST', headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model: this.model, store: false, input: [{ role: 'system', content: 'Transcribe the recipe document faithfully. Preserve headings, ingredient wording, measurement symbols, and instruction order. Do not infer or add information. Return only the requested JSON.' }, { role: 'user', content: [{ type: 'input_text', text: 'Read this scanned recipe PDF and return its visible text.' }, { type: 'input_file', file_id: fileId }] }], text: { format: { type: 'json_schema', name: 'recipe_ocr', strict: true, schema: ocrSchema } } }) })
    } catch (error) {
      if (error instanceof OcrProcessorError) throw error
      console.warn('OpenAI PDF OCR transport failed.', {
        phase,
        errorName: error instanceof Error ? error.name : 'unknown',
      })
      throw new OcrProcessorError('UNAVAILABLE')
    } finally {
      if (fileId) {
        try {
          const cleanup = await this.request(`https://api.openai.com/v1/files/${encodeURIComponent(fileId)}`, { method: 'DELETE', headers: { authorization: `Bearer ${this.apiKey}` } })
          if (!cleanup.ok) console.warn('OpenAI temporary PDF cleanup was rejected.', { status: cleanup.status })
        } catch (error) { console.warn('OpenAI temporary PDF cleanup failed.', { errorName: error instanceof Error ? error.name : 'unknown' }) }
      }
    }
    if (!response.ok) { await logRejectedResponse('OpenAI PDF OCR request was rejected.', response); throw new OcrProcessorError('UNAVAILABLE') }
    const output = extractResponseText(await response.json().catch(() => undefined))
    if (!output) throw new OcrProcessorError('INVALID_OUTPUT')
    try {
      const parsed = JSON.parse(output) as { text?: unknown }
      if (typeof parsed.text !== 'string' || !parsed.text.trim() || parsed.text.length > MAX_OCR_TEXT_LENGTH) throw new Error()
      return { text: parsed.text.trim() }
    } catch { throw new OcrProcessorError('INVALID_OUTPUT') }
  }
}
