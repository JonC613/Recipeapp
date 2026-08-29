import { Link, useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import { ImportReviewForm } from '../components/imports/ImportReviewForm'
import type { RecipeImport } from '../domain/recipe/imports.js'
import { approveRecipeImport, getRecipeImport } from '../services/imports'

export function RecipeImportReviewPage() {
  const { importId = '' } = useParams(); const navigate = useNavigate(); const [imported, setImported] = useState<RecipeImport>(); const [error, setError] = useState<string>()
  useEffect(() => { void getRecipeImport(importId).then(setImported).catch((cause) => setError(cause instanceof Error ? cause.message : 'The import could not be retrieved.')) }, [importId])
  if (error) return <section className="recipe-page"><h1>Import unavailable</h1><p role="alert">{error}</p><Link to="/recipes/import">Import another recipe</Link><Link to="/">Return to library</Link></section>
  if (!imported) return <p role="status">Loading import draft…</p>
  if (imported.status !== 'ready' || !imported.draft || imported.approvedRecipeId) return <section className="recipe-page"><h1>Import unavailable for review</h1><p role="alert">This import cannot be saved again.</p><Link to="/recipes/import">Import another recipe</Link><Link to="/">Return to library</Link></section>
  return <section className="recipe-page"><p className="eyebrow">Review import</p><h1>Review and save</h1><ImportReviewForm imported={imported} onSave={async (input) => { const saved = await approveRecipeImport(imported.id, input); await navigate(`/recipes/${saved.id}`) }} /><Link to={`/imports/${imported.id}`}>Cancel</Link></section>
}
