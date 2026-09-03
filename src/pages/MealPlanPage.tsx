import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import type { GrocerySection, MealPlanWeek } from '../domain/meal-plan/schema.js'
import { listRecipes, type RecipeSummary } from '../services/recipes'
import { addCustomGroceryItem, assignDinner, generateGroceryList, getMealPlanWeek, removeDinner, removeGroceryItem, setGroceryItemChecked } from '../services/meal-plans'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const sectionNames: Record<GrocerySection, string> = { produce: 'Produce', meat_seafood: 'Meat & Seafood', dairy: 'Dairy', pantry: 'Pantry', frozen: 'Frozen', other: 'Other' }
const sectionOrder: GrocerySection[] = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'other']

function formatYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function toWeekStart(date: Date): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  local.setDate(local.getDate() - local.getDay())
  return formatYmd(local)
}
function offsetWeek(weekStart: string, offset: number): string {
  const date = new Date(`${weekStart}T12:00:00`); date.setDate(date.getDate() + offset * 7); return formatYmd(date)
}
function dateFor(weekStart: string, dayIndex: number): string {
  const date = new Date(`${weekStart}T12:00:00`); date.setDate(date.getDate() + dayIndex); return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

export function MealPlanPage() {
  const [weekStart, setWeekStart] = useState(() => toWeekStart(new Date()))
  const [plan, setPlan] = useState<MealPlanWeek>(); const [error, setError] = useState<string>(); const [busy, setBusy] = useState(false); const [recipes, setRecipes] = useState<RecipeSummary[]>([]); const [query, setQuery] = useState(''); const [customText, setCustomText] = useState('')
  const refresh = (week = weekStart) => { setError(undefined); void getMealPlanWeek(week).then(setPlan).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load meal plan.')) }
  useEffect(() => { refresh(); void listRecipes({ q: query || undefined }).then(setRecipes).catch(() => setRecipes([])) }, [weekStart, query])
  const mutate = async (action: () => Promise<MealPlanWeek>) => { setBusy(true); setError(undefined); try { setPlan(await action()) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update meal plan.') } finally { setBusy(false) } }
  const currentWeek = toWeekStart(new Date())
  const dinners = new Map(plan?.dinners.map((dinner) => [dinner.dayIndex, dinner]))
  const groceries = plan?.groceryItems ?? []
  return <section className="recipe-page meal-plan-page"><div className="page-heading"><div><p className="eyebrow">Plan your kitchen week</p><h1>Meal Plan</h1><p className="page-heading__description">Choose a dinner for each day, then build one calm grocery list.</p></div></div>
    <div className="meal-plan__week-controls" aria-label="Week navigation"><button type="button" onClick={() => setWeekStart(offsetWeek(weekStart, -1))}>Previous week</button><div><strong>{dateFor(weekStart, 0)} – {dateFor(weekStart, 6)}</strong><span>{weekStart === currentWeek ? 'This week' : 'Sunday-start week'}</span></div><button type="button" onClick={() => setWeekStart(offsetWeek(weekStart, 1))}>Next week</button>{weekStart !== currentWeek && <button type="button" onClick={() => setWeekStart(currentWeek)}>This week</button>}</div>
    {error && <p role="alert">{error}</p>}{!plan ? <p role="status">Loading meal plan…</p> : <><section className="meal-plan__dinners" aria-labelledby="dinner-plan-heading"><div><h2 id="dinner-plan-heading">Dinners</h2><p>Pick one saved recipe for each evening.</p></div><label className="meal-plan__recipe-search">Find a recipe<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your saved recipes" /></label>{recipes.length === 0 && <p className="empty-state">No saved recipes match. <Link to="/recipes/new">Add a recipe</Link> or <Link to="/recipes/import">import one</Link>.</p>}<div className="meal-plan__day-grid">{dayNames.map((name, index) => { const dinner = dinners.get(index); return <article key={name} className="meal-plan__day"><p className="eyebrow">{name} · {dateFor(weekStart, index)}</p>{dinner ? <><h3>{dinner.recipe.title}</h3><div className="meal-plan__day-actions"><Link to={`/recipes/${dinner.recipe.id}`}>View recipe</Link><Link to={`/recipes/${dinner.recipe.id}/cook`}>Cook</Link><button disabled={busy} type="button" onClick={() => void mutate(() => removeDinner(weekStart, index))}>Remove</button></div><RecipeSelector recipes={recipes} busy={busy} label="Replace dinner" onSelect={(id) => mutate(() => assignDinner(weekStart, index, id))} /></> : <RecipeSelector recipes={recipes} busy={busy} label="Choose dinner" onSelect={(id) => mutate(() => assignDinner(weekStart, index, id))} />}</article> })}</div></section>
      <section className="meal-plan__groceries" aria-labelledby="grocery-list-heading"><div><p className="eyebrow">Weekly checklist</p><h2 id="grocery-list-heading">Grocery List</h2>{plan.groceryGeneratedRevision === undefined ? <p>Generate a list when you are ready to shop. Nothing changes automatically.</p> : plan.groceryListStale ? <p className="meal-plan__stale" role="status">Your meals changed. Update the list when you want the recipe items refreshed.</p> : <p>Your list reflects the current meal plan.</p>}</div><button className="button-link" disabled={busy} type="button" onClick={() => void mutate(() => generateGroceryList(weekStart))}>{plan.groceryGeneratedRevision === undefined ? 'Generate grocery list' : 'Update grocery list'}</button>{plan.groceryGeneratedRevision !== undefined && <><form className="meal-plan__custom-form" onSubmit={(event) => { event.preventDefault(); if (customText.trim()) void mutate(() => addCustomGroceryItem(weekStart, customText)).then(() => setCustomText('')) }}><label>Add an item<input value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="Paper towels, coffee…" /></label><button disabled={busy || !customText.trim()} type="submit">Add item</button></form>{groceries.length === 0 ? <p className="empty-state">No grocery items yet. Plan a dinner or add a personal item.</p> : <div className="meal-plan__grocery-sections">{sectionOrder.map((section) => { const items = groceries.filter((item) => item.section === section); return items.length ? <section key={section}><h3>{sectionNames[section]}</h3><ul>{items.map((item) => <li key={item.id}><label><input type="checkbox" checked={item.checked} disabled={busy} onChange={(event) => void mutate(() => setGroceryItemChecked(weekStart, item.id, event.target.checked))} /><span className={item.checked ? 'meal-plan__checked' : undefined}>{item.displayText}{item.occurrenceCount > 1 && ` ×${item.occurrenceCount}`}</span></label><div className="meal-plan__item-meta">{item.custom ? 'Personal item' : item.contributorTitles.join(' · ')}<button disabled={busy} type="button" onClick={() => void mutate(() => removeGroceryItem(weekStart, item.id))}>Remove</button></div></li>)}</ul></section> : null })}</div>}</>}</section></>}</section>
}

function RecipeSelector({ recipes, busy, label, onSelect }: { recipes: RecipeSummary[]; busy: boolean; label: string; onSelect: (id: string) => void }) {
  const [selected, setSelected] = useState('')
  return <div className="meal-plan__selector"><label>{label}<select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Select a saved recipe</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></label><button type="button" disabled={busy || !selected} onClick={() => { onSelect(selected); setSelected('') }}>{label}</button></div>
}
