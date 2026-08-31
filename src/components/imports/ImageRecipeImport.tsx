import { useEffect, useState } from 'react'
import type { RecipeImport } from '../../domain/recipe/imports.js'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export function ImageRecipeImport({ onImport }: { onImport: (file: File) => Promise<RecipeImport> }) {
  const [file, setFile] = useState<File>(); const [source, setSource] = useState<'file' | 'clipboard'>('file'); const [previewUrl, setPreviewUrl] = useState<string>(); const [previewFailed, setPreviewFailed] = useState(false)
  const [result, setResult] = useState<RecipeImport>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!file || file.type === 'image/heic' || file.type === 'image/heif') { setPreviewUrl(undefined); setPreviewFailed(false); return }
    const url = URL.createObjectURL(file); setPreviewUrl(url); setPreviewFailed(false)
    return () => URL.revokeObjectURL(url)
  }, [file])
  function validationError(next: File): string | undefined {
    if (!imageTypes.has(next.type)) return 'Choose a JPEG, PNG, WebP, or HEIC image.'
    if (next.size > MAX_IMAGE_BYTES) return 'Image files must be 10 MB or smaller.'
    return undefined
  }
  function choose(next?: File, nextSource: 'file' | 'clipboard' = 'file') { setFile(next); setSource(nextSource); setResult(undefined); setError(undefined) }
  function paste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const files = Array.from(event.clipboardData.files)
    if (files.length !== 1) { setError(files.length > 1 ? 'Paste one image at a time.' : 'Your clipboard does not contain an image.'); return }
    const next = files[0]; const error = validationError(next)
    if (error) { setError(error); return }
    choose(next, 'clipboard')
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(undefined); setResult(undefined)
    if (!file) { setError('Choose one JPEG, PNG, WebP, or HEIC image.'); return }
    const validation = validationError(file)
    if (validation) { setError(validation); return }
    setLoading(true)
    try { setResult(await onImport(file)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'The image import could not be completed.') } finally { setLoading(false) }
  }
  return <><form className="recipe-form image-import" onSubmit={(event) => void submit(event)}>
    <label>Recipe image or screenshot<input aria-describedby="image-import-hint" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(event) => choose(event.currentTarget.files?.[0])} /></label>
    <div className="image-import__paste-target" tabIndex={0} role="group" aria-label="Paste a copied screenshot" aria-describedby="image-import-hint image-import-paste-hint" onPaste={paste}><strong>Paste a copied screenshot</strong><p id="image-import-paste-hint" className="hint">Click here, then press Ctrl+V (or paste) to preview one copied image before uploading it.</p></div>
    <p id="image-import-hint" className="hint">Choose or paste one image, up to 10 MB. Your original stays private. AI is not used until you choose Extract recipe.</p>
    {file && <section className="image-import__source" aria-label={source === 'clipboard' ? 'Pasted image candidate' : 'Selected image'}><p><strong>{source === 'clipboard' ? 'Pasted image:' : 'Selected:'}</strong> {file.name}</p>{source === 'clipboard' && <p className="hint">This preview is only on this device until you choose Use pasted image.</p>}{previewUrl && !previewFailed ? <img src={previewUrl} alt={`Preview of ${file.name}`} onError={() => setPreviewFailed(true)} /> : <p className="hint">Preview is unavailable in this browser, but the source can still be retained privately.</p>}</section>}
    {error && <p role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Retaining image…' : source === 'clipboard' ? 'Use pasted image' : 'Retain image'}</button>
  </form>{result && <section className="image-import__retained" aria-live="polite"><p><strong>Image retained privately.</strong> No AI credits have been used.</p><a className="button-link" href={`/imports/${result.id}`}>Continue to extraction</a></section>}</>
}
