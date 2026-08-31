import { imageContentType, type ImageFormat } from '../extraction/image-signature.js'

const extension: Record<ImageFormat, string> = { jpeg: 'jpg', png: 'png', webp: 'webp', heic: 'heic' }

export function createImageObjectKey(importId: string, format: ImageFormat): string { return `imports/${importId}/source.${extension[format]}` }

export async function storeImageSource(bucket: R2Bucket, importId: string, bytes: Uint8Array, format: ImageFormat, sourceName?: string): Promise<string> {
  const key = createImageObjectKey(importId, format)
  await bucket.put(key, bytes, { httpMetadata: { contentType: imageContentType(format) }, customMetadata: sourceName ? { sourceName, format } : { format } })
  return key
}

export async function readImageSource(bucket: R2Bucket, key: string): Promise<Uint8Array | undefined> {
  const source = await bucket.get(key)
  return source ? new Uint8Array(await source.arrayBuffer()) : undefined
}
