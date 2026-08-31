import { useState } from 'react'
import type { RecipeImport } from '../../domain/recipe/imports.js'
import { ImportDraftSummary } from './UrlImportForm.js'

const MAX_PDF_BYTES = 20 * 1024 * 1024

export function PdfImportForm({ onImport }: { onImport: (file: File) => Promise<RecipeImport> }) {
  const [file, setFile] = useState<File>(); const [result, setResult] = useState<RecipeImport>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(undefined); setResult(undefined)
    if (!file) { setError('Choose one PDF file to import.'); return }
    if (file.type !== 'application/pdf') { setError('Choose a PDF file to import.'); return }
    if (file.size > MAX_PDF_BYTES) { setError('PDF files must be 20 MB or smaller.'); return }
    setLoading(true); try { setResult(await onImport(file)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'The PDF import could not be completed.') } finally { setLoading(false) }
  }
  return <><form className="recipe-form" onSubmit={(event) => void submit(event)}><label>Recipe PDF<input aria-describedby="pdf-import-hint" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.currentTarget.files?.[0])} /></label><p id="pdf-import-hint" className="hint">Upload one text-based PDF, up to 20 MB.</p>{file && <p className="hint">Selected: {file.name}</p>}{error && <p role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Extracting PDF recipe…' : 'Extract PDF recipe'}</button></form>{result?.draft ? <><ImportDraftSummary imported={result} /><a href={`/imports/${result.id}`}>Reopen this import draft</a><a href={`/imports/${result.id}/review`}>Review and save</a></> : result && <><p role="alert">This PDF does not contain readable recipe text.</p><a href={`/imports/${result.id}`}>Choose how to continue</a></>}</>
}
