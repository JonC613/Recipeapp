import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { listRecipes, type RecipeSummary } from '../services/recipes'

export function RecipeLibraryPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]); const [error, setError] = useState<string>(); const [query, setQuery] = useState('')
  useEffect(() => {
    let current = true
    setError(undefined)
    void listRecipes(query).then((result) => { if (current) setRecipes(result) }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : 'Could not load recipes.') })
    return () => { current = false }
  }, [query])
  return <section className="recipe-page"><div className="page-heading"><div><p className="eyebrow">Your personal kitchen archive</p><h1>Recipe Library</h1></div><Link className="button-link" to="/recipes/new">Add recipe</Link></div>
    <label className="recipe-filter">Filter by title<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipe titles" />{query && <button type="button" onClick={() => setQuery('')}>Clear filter</button>}</label>
    {error && <p role="alert">{error}</p>}
    {!error && recipes.length === 0 && <p className="empty-state">{query.trim() ? 'No recipes match that title.' : 'No recipes yet. Add one manually to start your library.'}</p>}
    <div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
  </section>
}
