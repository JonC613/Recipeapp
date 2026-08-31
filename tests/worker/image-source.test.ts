import { describe, expect, it } from 'vitest'
import { ImageSourceError, prepareImageForVision } from '../../worker/services/extraction/image-source.js'

describe('image source preparation', () => {
  it('passes direct OpenAI-supported image formats through unchanged', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    await expect(prepareImageForVision(bytes, 'webp')).resolves.toEqual({ bytes, contentType: 'image/webp' })
  })
  it('converts HEIC through the injected private Images binding', async () => {
    const response = new Response(new Uint8Array([0xff, 0xd8, 0xff]), { status: 200 })
    const binding = { input: (bytes: Uint8Array) => ({ output: (options: { format: 'image/jpeg' }) => ({ response: async () => { expect(bytes).toEqual(new Uint8Array([9])); expect(options).toEqual({ format: 'image/jpeg' }); return response } }) }) }
    await expect(prepareImageForVision(new Uint8Array([9]), 'heic', binding)).resolves.toEqual({ bytes: new Uint8Array([0xff, 0xd8, 0xff]), contentType: 'image/jpeg' })
  })
  it('fails HEIC safely until a private Images binding is configured', async () => {
    await expect(prepareImageForVision(new Uint8Array([9]), 'heic')).rejects.toBeInstanceOf(ImageSourceError)
  })
})
