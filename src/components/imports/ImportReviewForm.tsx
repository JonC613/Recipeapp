import { useState } from 'react'
import { RecipeForm } from '../recipes/RecipeForm'
import type { ImportApprovalInput, RecipeImport } from '../../domain/recipe/imports.js'
import type { ManualRecipeInput } from '../../domain/recipe/schema.js'

export function ImportReviewForm({ imported, onSave }: { imported: RecipeImport; onSave: (input: ImportApprovalInput) => Promise<void> }) {
  const [favorite, setFavorite] = useState(false)
  if (!imported.draft) return null
  const source = imported.sourceType === 'text' ? 'Pasted recipe text' : imported.sourceUrl
  return <section className="review-form"><p className="recipe-metadata">Original source: {imported.sourceType === 'url' && imported.sourceUrl ? <a href={imported.sourceUrl} target="_blank" rel="noreferrer">{imported.sourceUrl}</a> : source}</p><p className="hint">Review the extracted fields before saving. The original import will remain unchanged.</p><label className="favorite-field"><input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} /> Favorite recipe</label><RecipeForm initial={imported.draft} submitLabel="Save recipe" onSave={(recipe: ManualRecipeInput) => onSave({ ...recipe, favorite })} /></section>
}
