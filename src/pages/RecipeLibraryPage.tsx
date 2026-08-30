import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { listRecipes, type RecipeSearchCriteria, type RecipeSummary } from '../services/recipes'

const textFilters: Array<{ key: Exclude<keyof RecipeSearchCriteria, 'favorite'>; label: string }> = [
  { key: 'tag', label: 'Tag' }, { key: 'ingredient', label: 'Ingredient' }, { key: 'cuisine', label: 'Cuisine' }, { key: 'category', label: 'Category' },
]

export function RecipeLibraryPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]); const [error, setError] = useState<string>(); const [criteria, setCriteria] = useState<RecipeSearchCriteria>({})
  useEffect(() => {
    let current = true
    setError(undefined)
    void listRecipes(criteria).then((result) => { if (current) setRecipes(result) }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Could not load recipes.') })
    return () => { current = false }
  }, [criteria])
  const hasCriteria = Object.values(criteria).some((value) => value !== undefined && value !== '')
  const updateText = (key: Exclude<keyof RecipeSearchCriteria, 'favorite'>, value: string) => setCriteria((current) => ({ ...current, [key]: value || undefined }))
  const clearCriteria = () => setCriteria({})
  return <section className="recipe-page"><div className="page-heading"><div><p className="eyebrow">Your personal kitchen archive</p><h1>Recipe Library</h1></div><Link className="button-link" to="/recipes/new">Add recipe</Link></div>
    <div className="recipe-search"><label>Search recipes<input type="search" value={criteria.q ?? ''} onChange={(event) => updateText('q', event.target.value)} placeholder="Title, ingredient, tag, cuisine, or category" /></label>
      <details className="recipe-search__filters"><summary>Filter recipes</summary><div className="recipe-search__filter-grid"><label className="favorite-field"><input type="checkbox" checked={criteria.favorite === true} onChange={(event) => setCriteria((current) => ({ ...current, favorite: event.target.checked ? true : undefined }))} />Favorites only</label>{textFilters.map(({ key, label }) => <label key={key}>{label}<input value={criteria[key] as string | undefined ?? ''} onChange={(event) => updateText(key, event.target.value)} /></label>)}</div></details>
      {hasCriteria && <button type="button" onClick={clearCriteria}>Clear search and filters</button>}</div>
    {error && <p role="alert">{error}</p>}
    {!error && recipes.length === 0 && <p className="empty-state" aria-live="polite">{hasCriteria ? 'No recipes match your search or filters.' : 'No recipes yet. Add one manually to start your library.'}</p>}
    <div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
  </section>
}
