import { useState } from 'react'
import type { ManualRecipeInput } from '../../domain/recipe/schema.js'

export function RecipeForm({ onSave, initial }: { onSave: (recipe: ManualRecipeInput) => Promise<void>; initial?: ManualRecipeInput }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [servings, setServings] = useState(initial?.servings?.toString() ?? '')
  const [prepMinutes, setPrepMinutes] = useState(initial?.prepMinutes?.toString() ?? '')
  const [cookMinutes, setCookMinutes] = useState(initial?.cookMinutes?.toString() ?? '')
  const [totalMinutes, setTotalMinutes] = useState(initial?.totalMinutes?.toString() ?? '')
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [ingredients, setIngredients] = useState(initial?.ingredients?.map((item) => item.originalText).join('\n') ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions?.map((item) => item.text).join('\n') ?? '')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(undefined)
    if (!title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    try { await onSave({
      title, description, servings: numberOrUndefined(servings), prepMinutes: numberOrUndefined(prepMinutes),
      cookMinutes: numberOrUndefined(cookMinutes), totalMinutes: numberOrUndefined(totalMinutes), cuisine, category,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), notes,
      ingredients: ingredients.split('\n').filter(Boolean).map((originalText) => ({ originalText })),
      instructions: instructions.split('\n').filter(Boolean).map((text) => ({ text })),
    }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The recipe could not be saved.') }
    finally { setSaving(false) }
  }
  return <form className="recipe-form" onSubmit={(event) => void submit(event)}>
    <label>Recipe title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
    <label>Description<textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>
    <div className="recipe-form__numbers">
      <label>Servings<input name="servings" type="number" min="0" step="any" value={servings} onChange={(event) => setServings(event.target.value)} /></label>
      <label>Prep minutes<input name="prepMinutes" type="number" min="0" step="1" value={prepMinutes} onChange={(event) => setPrepMinutes(event.target.value)} /></label>
      <label>Cook minutes<input name="cookMinutes" type="number" min="0" step="1" value={cookMinutes} onChange={(event) => setCookMinutes(event.target.value)} /></label>
      <label>Total minutes<input name="totalMinutes" type="number" min="0" step="1" value={totalMinutes} onChange={(event) => setTotalMinutes(event.target.value)} /></label>
    </div>
    <div className="recipe-form__numbers">
      <label>Cuisine<input name="cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} /></label>
      <label>Category<input name="category" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
    </div>
    <label>Tags <span className="hint">Separate with commas</span><input name="tags" value={tags} onChange={(event) => setTags(event.target.value)} /></label>
    <label>Ingredients <span className="hint">One per line</span><textarea name="ingredients" value={ingredients} onChange={(event) => setIngredients(event.target.value)} rows={6} /></label>
    <label>Instructions <span className="hint">One step per line</span><textarea name="instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={6} /></label>
    <label>Notes<textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} /></label>
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save recipe'}</button>
  </form>
}

function numberOrUndefined(value: string): number | undefined {
  return value.trim() ? Number(value) : undefined
}
