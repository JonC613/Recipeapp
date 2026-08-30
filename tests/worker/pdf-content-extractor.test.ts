import { describe, expect, it } from 'vitest'

import { getPdfPageCount } from '../../worker/services/extraction/pdf-content-extractor.js'

describe('PDF page counting', () => {
  it('protects source bytes when the PDF parser transfers its input buffer', async () => {
    const transferInput = async (input: Uint8Array) => {
      structuredClone(input.buffer, { transfer: [input.buffer as ArrayBuffer] })
      return { numPages: 2 }
    }
    const source = new Uint8Array([37, 80, 68, 70])

    await expect(getPdfPageCount(source, transferInput)).resolves.toBe(2)
    expect([...source]).toEqual([37, 80, 68, 70])
    expect(source.byteLength).toBe(4)
  })
})
