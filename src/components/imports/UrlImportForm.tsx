import { useState } from 'react'
import type { RecipeImport } from '../../domain/recipe/imports.js'

export function ImportDraftSummary({ imported }: { imported: RecipeImport }) {
  const draft = imported.draft
  if (!draft) return null
  return <section className="import-draft" aria-labelledby="import-draft-title">
    <p className="eyebrow">Import draft</p>
    <h2 id="import-draft-title">{draft.title}</h2>
    {draft.description && <p className="recipe-description">{draft.description}</p>}
    <p className="recipe-metadata">Source: {draft.source.type === 'url' ? <a href={draft.source.originalUrl} target="_blank" rel="noreferrer">{draft.source.originalUrl}</a> : 'Pasted recipe text'}</p>
    {(draft.ingredients?.length ?? 0) > 0 && <section><h3>Ingredients</h3><ul>{draft.ingredients?.map((ingredient, index) => <li key={`${ingredient.originalText}-${index}`}>{ingredient.originalText}</li>)}</ul></section>}
    {(draft.instructions?.length ?? 0) > 0 && <section><h3>Instructions</h3><ol>{draft.instructions?.map((instruction, index) => <li key={`${instruction.text}-${index}`}>{instruction.text}</li>)}</ol></section>}
    <p className="hint">This is an unsaved draft. Review and save it when you are ready.</p>
  </section>
}

export function UrlImportForm({ onImport }: { onImport: (url: string) => Promise<RecipeImport> }) {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<RecipeImport>()
  const [error, setError] = useState<string>()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(undefined)
    setResult(undefined)
    try {
      setResult(await onImport(url))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The recipe import could not be completed.')
    }
  }

  const draft = result?.draft
  return <>
    <form className="recipe-form" onSubmit={(event) => void submit(event)}>
      <label>Recipe URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} required /></label>
      <p className="hint">Nothing is saved to your library yet.</p>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Import recipe</button>
    </form>
    {draft && <><ImportDraftSummary imported={result!} /><a href={`/imports/${result!.id}`}>Reopen this import draft</a><a href={`/imports/${result!.id}/review`}>Review and save</a></>}
  </>
}
