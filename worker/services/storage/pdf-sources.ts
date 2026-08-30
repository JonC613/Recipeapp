const PDF_CONTENT_TYPE = 'application/pdf'

export function createPdfObjectKey(importId: string): string { return `imports/${importId}/source.pdf` }

export async function storePdfSource(bucket: R2Bucket, importId: string, bytes: Uint8Array, sourceName?: string): Promise<string> {
  const key = createPdfObjectKey(importId)
  await bucket.put(key, bytes, { httpMetadata: { contentType: PDF_CONTENT_TYPE }, customMetadata: sourceName ? { sourceName } : undefined })
  return key
}

export async function readPdfSource(bucket: R2Bucket, key: string): Promise<Uint8Array | undefined> {
  const source = await bucket.get(key)
  return source ? new Uint8Array(await source.arrayBuffer()) : undefined
}
