export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'heic'

const imageMimeTypes: Record<ImageFormat, readonly string[]> = {
  jpeg: ['image/jpeg'], png: ['image/png'], webp: ['image/webp'], heic: ['image/heic', 'image/heif'],
}
const heicBrands = new Set(['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])

function equals(bytes: Uint8Array, offset: number, value: readonly number[]): boolean { return value.every((entry, index) => bytes[offset + index] === entry) }
function ascii(bytes: Uint8Array, offset: number): string { return String.fromCharCode(...bytes.slice(offset, offset + 4)) }
function isHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 16 || ascii(bytes, 4) !== 'ftyp') return false
  for (let offset = 8; offset + 4 <= Math.min(bytes.length, 64); offset += 4) if (heicBrands.has(ascii(bytes, offset))) return true
  return false
}

export function detectImageFormat(bytes: Uint8Array): ImageFormat | undefined {
  if (equals(bytes, 0, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (equals(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (equals(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8) === 'WEBP') return 'webp'
  if (isHeic(bytes)) return 'heic'
  return undefined
}

export function isAcceptedImageMimeType(contentType: string, format: ImageFormat): boolean { return imageMimeTypes[format].includes(contentType.toLowerCase().trim()) }
export function imageContentType(format: ImageFormat): string { return imageMimeTypes[format][0] }
