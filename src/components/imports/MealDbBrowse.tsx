import { useEffect, useState } from 'react'
import type { MealDbFacet, MealDbRecipeDetail, MealDbRecipeSummary } from '../../domain/recipe/mealdb.js'

type Props = {
  loadCategories: () => Promise<MealDbFacet[]>
  loadAreas: () => Promise<MealDbFacet[]>
  browseByCategory: (category: string) => Promise<MealDbRecipeSummary[]>
  browseByArea: (area: string) => Promise<MealDbRecipeSummary[]>
  searchRecipes: (query: string) => Promise<MealDbRecipeSummary[]>
  loadRecipe: (id: string) => Promise<MealDbRecipeDetail>
  importRecipe: (id: string) => Promise<void>
}

export function MealDbBrowse({ loadCategories, loadAreas, browseByCategory, browseByArea, searchRecipes, loadRecipe, importRecipe }: Props) {
  const [categories, setCategories] = useState<MealDbFacet[]>([])
  const [areas, setAreas] = useState<MealDbFacet[]>([])
  const [mode, setMode] = useState<'category' | 'area'>('category')
  const [selection, setSelection] = useState('')
  const [results, setResults] = useState<MealDbRecipeSummary[]>([])
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<MealDbRecipeDetail>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([loadCategories(), loadAreas()]).then(([nextCategories, nextAreas]) => {
      if (!active) return
      setCategories(nextCategories); setAreas(nextAreas); setSelection(nextCategories[0]?.id ?? nextAreas[0]?.id ?? '')
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'TheMealDB is temporarily unavailable. Please try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadAreas, loadCategories])

  const facets = mode === 'category' ? categories : areas
  function changeMode(nextMode: 'category' | 'area') { setMode(nextMode); setSelection((nextMode === 'category' ? categories : areas)[0]?.id ?? ''); setResults([]); setPreview(undefined); setError(undefined) }
  async function browse() {
    if (!selection) return
    setLoading(true); setError(undefined)
    try { setResults(mode === 'category' ? await browseByCategory(selection) : await browseByArea(selection)); setPreview(undefined) }
    catch (reason) { setResults([]); setError(reason instanceof Error ? reason.message : 'TheMealDB is temporarily unavailable. Please try again.') }
    finally { setLoading(false) }
  }
  async function searchByName(event: React.FormEvent) {
    event.preventDefault()
    if (!search.trim()) return
    setLoading(true); setError(undefined)
    try { setResults(await searchRecipes(search.trim())); setPreview(undefined) }
    catch (reason) { setResults([]); setError(reason instanceof Error ? reason.message : 'TheMealDB is temporarily unavailable. Please try again.') }
    finally { setLoading(false) }
  }
  async function openPreview(id: string) {
    setLoading(true); setError(undefined)
    try { setPreview(await loadRecipe(id)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'TheMealDB is temporarily unavailable. Please try again.') }
    finally { setLoading(false) }
  }
  async function importForReview() {
    if (!preview) return
    setLoading(true); setError(undefined)
    try { await importRecipe(preview.id) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'TheMealDB is temporarily unavailable. Please try again.') }
    finally { setLoading(false) }
  }

  return <section className="mealdb-browse" aria-labelledby="mealdb-heading">
    <p className="eyebrow">Recipe discovery</p><h1 id="mealdb-heading">Browse TheMealDB</h1>
    <p className="lede">Explore recipes from TheMealDB, then preview one before you decide whether to import it.</p>
    <div className="recipe-form">
      <form className="mealdb-browse__search" onSubmit={searchByName}><label>Search TheMealDB by recipe name<input value={search} onChange={(event) => setSearch(event.target.value)} /></label><button type="submit" disabled={loading || !search.trim()}>Search recipes</button></form>
      <fieldset disabled={loading}><legend>Browse recipes by</legend>
        <label><input type="radio" name="mealdb-mode" checked={mode === 'category'} onChange={() => changeMode('category')} /> Category</label>
        <label><input type="radio" name="mealdb-mode" checked={mode === 'area'} onChange={() => changeMode('area')} /> Area</label>
        <label>{mode === 'category' ? 'Category' : 'Area'}
          <select value={selection} onChange={(event) => setSelection(event.target.value)}>{facets.map((facet) => <option key={facet.id} value={facet.id}>{facet.label}</option>)}</select>
        </label>
      </fieldset>
      <button type="button" onClick={browse} disabled={loading || !selection}>{loading ? 'Loading recipes…' : 'Browse recipes'}</button>
    </div>
    {error ? <p className="service-status service-status--unavailable" role="alert">{error}</p> : null}
    {preview ? <section className="import-draft" aria-label="TheMealDB recipe preview"><p className="card-kicker">TheMealDB preview</p><h2>{preview.title}</h2><p className="hint">Review the recipe before import. Nothing is saved yet.</p>{preview.ingredients.length ? <section><h3>Ingredients</h3><ul>{preview.ingredients.map((ingredient, index) => <li key={`${ingredient.originalText}-${index}`}>{ingredient.originalText}</li>)}</ul></section> : null}{preview.instructions?.length ? <section><h3>Instructions</h3><ol>{preview.instructions.map((instruction, index) => <li key={`${instruction}-${index}`}>{instruction}</li>)}</ol></section> : null}<div className="recipe-actions"><button type="button" onClick={() => void importForReview()} disabled={loading}>Import for review</button><button type="button" onClick={() => setPreview(undefined)}>Back to results</button></div></section> : null}
    {!loading && !error && results.length === 0 ? <p className="empty-state">Choose a category or area, then browse recipes. Nothing is saved until you explicitly import a recipe.</p> : null}
    {results.length && !preview ? <section aria-label="TheMealDB recipes" className="recipe-grid">{results.map((recipe) => <article className="recipe-card" key={recipe.id}><p className="card-kicker">TheMealDB</p><h2>{recipe.title}</h2>{recipe.category || recipe.area ? <p className="recipe-metadata">{[recipe.category, recipe.area].filter(Boolean).join(' · ')}</p> : null}<div className="recipe-actions"><button type="button" onClick={() => openPreview(recipe.id)}>Preview recipe</button></div><p className="hint">Nothing is saved until you explicitly import a recipe.</p></article>)}</section> : null}
  </section>
}
