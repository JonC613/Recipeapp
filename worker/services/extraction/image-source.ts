import { imageContentType, type ImageFormat } from './image-signature.js'

type ImageOutput = { response(): Promise<Response> }
export interface ImageBinding { input(bytes: Uint8Array): { output(options: { format: 'image/jpeg' }): ImageOutput } }
export class ImageSourceError extends Error { readonly code = 'UNAVAILABLE' as const }

export async function prepareImageForVision(bytes: Uint8Array, format: ImageFormat, binding?: ImageBinding): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (format !== 'heic') return { bytes, contentType: imageContentType(format) }
  if (!binding) throw new ImageSourceError()
  try {
    const response = await binding.input(bytes).output({ format: 'image/jpeg' }).response()
    if (!response.ok) throw new Error()
    return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: 'image/jpeg' }
  } catch { throw new ImageSourceError() }
}
