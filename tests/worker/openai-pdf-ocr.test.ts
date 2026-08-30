import { describe, expect, it, vi } from 'vitest'
import { OpenAiPdfOcr } from '../../worker/services/ai/openai-pdf-ocr.js'

describe('OpenAI PDF OCR', () => {
  it('uploads a temporary private PDF, references its file ID, and deletes it', async () => {
    const request = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/v1/files') && init?.method === 'POST') return new Response(JSON.stringify({ id: 'file_test' }), { status: 200 })
      if (url.endsWith('/v1/responses')) return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ text: 'Garlic Butter Pasta' }) }] }] }), { status: 200 })
      if (url.endsWith('/v1/files/file_test') && init?.method === 'DELETE') return new Response(JSON.stringify({ deleted: true }), { status: 200 })
      return new Response(null, { status: 500 })
    })
    const ocr = new OpenAiPdfOcr('test-key', 'gpt-5-mini', request as unknown as typeof fetch)

    await expect(ocr.extractPdfText(new Uint8Array([37, 80, 68, 70]), 'recipe.pdf')).resolves.toEqual({ text: 'Garlic Butter Pasta' })

    const upload = request.mock.calls[0]?.[1]?.body
    expect(upload).toBeInstanceOf(FormData)
    expect((upload as FormData).get('purpose')).toBe('user_data')
    expect((upload as FormData).get('expires_after[seconds]')).toBe('3600')
    expect((upload as FormData).get('file')).toBeInstanceOf(File)
    const body = JSON.parse(String(request.mock.calls[1]?.[1]?.body))
    expect(body.input[1].content[1]).toEqual({ type: 'input_file', file_id: 'file_test' })
    expect(request).toHaveBeenNthCalledWith(3, 'https://api.openai.com/v1/files/file_test', expect.objectContaining({ method: 'DELETE' }))
  })
})
