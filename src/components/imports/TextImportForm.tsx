import { useState } from 'react'
import type { RecipeImport } from '../../domain/recipe/imports.js'
import { ImportDraftSummary } from './UrlImportForm.js'

const MAX_LENGTH = 50_000
export function TextImportForm({ onImport }: { onImport: (text: string) => Promise<RecipeImport> }) {
  const [text, setText] = useState(''); const [result, setResult] = useState<RecipeImport>(); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(undefined); setResult(undefined)
    if (!text.trim()) { setError('Paste recipe text to import.'); return }
    if (text.length > MAX_LENGTH) { setError('Recipe text must be 50,000 characters or fewer.'); return }
    setLoading(true); try { setResult(await onImport(text)) } catch (cause) { setError(cause instanceof Error ? cause.message : 'The recipe import could not be completed.') } finally { setLoading(false) }
  }
  return <><form className="recipe-form" onSubmit={(event) => void submit(event)}><label>Recipe text<textarea value={text} onChange={(event) => setText(event.target.value)} rows={12} maxLength={MAX_LENGTH} placeholder="Paste one recipe here…" /></label><p className="hint">{text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} characters. Nothing is saved until you review it.</p>{error && <p role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Extracting recipe…' : 'Extract recipe'}</button></form>{result?.draft && <><ImportDraftSummary imported={result} /><a href={`/imports/${result.id}`}>Reopen this import draft</a><a href={`/imports/${result.id}/review`}>Review and save</a></>}</>
}
