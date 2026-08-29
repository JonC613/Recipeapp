import { Link, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import type { RecipeImport } from '../domain/recipe/imports.js'
import { ImportDraftSummary } from '../components/imports/UrlImportForm'
import { getRecipeImport } from '../services/imports'

export function RecipeImportResultPage() {
  const { importId } = useParams()
  const [imported, setImported] = useState<RecipeImport>()
  const [error, setError] = useState<string>()
  useEffect(() => { if (importId) void getRecipeImport(importId).then(setImported).catch((cause) => setError(cause instanceof Error ? cause.message : 'The import could not be retrieved.')) }, [importId])
  return <section className="recipe-page"><p className="eyebrow">{imported?.sourceType === 'text' ? 'Pasted recipe text' : 'Recipe URL'}</p><h1>Import draft</h1>{error ? <><p role="alert">{error}</p><Link to="/recipes/import">Import another recipe</Link></> : !imported ? <p role="status">Loading import draft…</p> : <><ImportDraftSummary imported={imported} />{imported.status === 'ready' && !imported.approvedRecipeId && <Link className="button-link" to={`/imports/${imported.id}/review`}>Review and save</Link>}<Link to="/recipes/import">Import another recipe</Link></>}</section>
}
