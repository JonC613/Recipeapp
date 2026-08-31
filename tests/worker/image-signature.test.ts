import { describe, expect, it } from 'vitest'
import { detectImageFormat, imageContentType, isAcceptedImageMimeType } from '../../worker/services/extraction/image-signature.js'

const utf8 = new TextEncoder()
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
const heic = new Uint8Array([0, 0, 0, 24, ...utf8.encode('ftypheic'), 0, 0, 0, 0])

describe('image signature inspection', () => {
  it.each([[jpeg, 'jpeg'], [png, 'png'], [webp, 'webp'], [heic, 'heic']] as const)('recognizes a %s signature as %s', (bytes, format) => expect(detectImageFormat(bytes)).toBe(format))
  it('rejects truncated, spoofed, and unsupported image bytes', () => {
    expect(detectImageFormat(new Uint8Array())).toBeUndefined()
    expect(detectImageFormat(utf8.encode('not an image'))).toBeUndefined()
    expect(detectImageFormat(new Uint8Array([0, 0, 0, 24, ...utf8.encode('ftypavif')]))).toBeUndefined()
  })
  it('requires a matching allowed MIME declaration', () => {
    expect(isAcceptedImageMimeType('image/jpeg', 'jpeg')).toBe(true)
    expect(isAcceptedImageMimeType('IMAGE/HEIF', 'heic')).toBe(true)
    expect(isAcceptedImageMimeType('image/png', 'jpeg')).toBe(false)
    expect(imageContentType('webp')).toBe('image/webp')
  })
})
