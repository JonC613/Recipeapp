import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { generateMissingRecipeGraphics, listRecipes, type RecipeSearchCriteria, type RecipeSummary } from '../services/recipes'

const textFilters: Array<{ key: Exclude<keyof RecipeSearchCriteria, 'favorite'>; label: string }> = [
  { key: 'tag', label: 'Tag' }, { key: 'ingredient', label: 'Ingredient' }, { key: 'cuisine', label: 'Cuisine' }, { key: 'category', label: 'Category' },
]

export function RecipeLibraryPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]); const [error, setError] = useState<string>(); const [criteria, setCriteria] = useState<RecipeSearchCriteria>({}); const [batch, setBatch] = useState<{ completed: number; total: number; generated: number; failed: number }>(); const [confirmingBatch, setConfirmingBatch] = useState(false)
  useEffect(() => {
    let current = true
    setError(undefined)
    void listRecipes(criteria).then((result) => { if (current) setRecipes(result) }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Could not load recipes.') })
    return () => { current = false }
  }, [criteria])
  const hasCriteria = Object.values(criteria).some((value) => value !== undefined && value !== '')
  const missingGraphics = recipes.filter((recipe) => !recipe.graphicAvailable)
  const updateText = (key: Exclude<keyof RecipeSearchCriteria, 'favorite'>, value: string) => setCriteria((current) => ({ ...current, [key]: value || undefined }))
  const clearCriteria = () => setCriteria({})
  const generateAllMissing = () => {
    if (batch || missingGraphics.length === 0) return
    setConfirmingBatch(false)
    setError(undefined)
    void generateMissingRecipeGraphics(recipes, setBatch).then(({ failed }) => listRecipes({}).then((result) => { setRecipes(result); setBatch((current) => current ? { ...current, failed } : current) })).catch(() => setError('Could not refresh the Library after generating menu art.'))
  }
  return <section className="recipe-page"><div className="page-heading"><div><p className="eyebrow">Your personal kitchen archive</p><h1>Recipe Library</h1><p className="page-heading__description">Keep everyday favorites, saved imports, and cooking notes together.</p></div><div className="page-heading__actions"><Link className="button-link" to="/recipes/new">Add recipe</Link><Link className="text-link" to="/recipes/import">Import a recipe</Link></div></div>
    {!hasCriteria && missingGraphics.length > 0 && <section className="recipe-graphics-batch" aria-labelledby="batch-art-heading"><div><h2 id="batch-art-heading">Complete Library art</h2><p>Generate playful AI menu art for the {missingGraphics.length} recipes still missing it. Existing art is skipped. Estimated maximum: ${(missingGraphics.length * 0.005).toFixed(2)}.</p></div>{confirmingBatch ? <div className="recipe-graphics-batch__confirmation"><p>Start {missingGraphics.length} paid image requests for up to ${(missingGraphics.length * 0.005).toFixed(2)}? Existing art will be skipped.</p><button type="button" onClick={generateAllMissing}>Confirm generation</button><button type="button" onClick={() => setConfirmingBatch(false)}>Cancel</button></div> : <button type="button" disabled={Boolean(batch)} onClick={() => setConfirmingBatch(true)}>{batch ? `Generating ${batch.completed}/${batch.total}…` : `Generate ${missingGraphics.length} missing images`}</button>}{batch && <p role="status">{batch.generated} generated{batch.failed > 0 ? `; ${batch.failed} could not be generated.` : ''} Keep this page open until the batch finishes.</p>}</section>}
    <div className="recipe-search"><label>Search recipes<input type="search" value={criteria.q ?? ''} onChange={(event) => updateText('q', event.target.value)} placeholder="Title, ingredient, tag, cuisine, or category" /></label>
      <details className="recipe-search__filters"><summary>Filter recipes</summary><div className="recipe-search__filter-grid"><label className="favorite-field"><input type="checkbox" checked={criteria.favorite === true} onChange={(event) => setCriteria((current) => ({ ...current, favorite: event.target.checked ? true : undefined }))} />Favorites only</label>{textFilters.map(({ key, label }) => <label key={key}>{label}<input value={criteria[key] as string | undefined ?? ''} onChange={(event) => updateText(key, event.target.value)} /></label>)}</div></details>
      {hasCriteria && <button type="button" onClick={clearCriteria}>Clear search and filters</button>}</div>
    {error && <p role="alert">{error}</p>}
    {!error && recipes.length === 0 && <p className="empty-state" aria-live="polite">{hasCriteria ? 'No recipes match your search or filters.' : 'No recipes yet. Add one manually to start your library.'}</p>}
    <div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
  </section>
}
