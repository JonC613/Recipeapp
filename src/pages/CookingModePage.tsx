import { Link, useParams, useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import { ServingsControl } from '../components/recipes/ServingsControl'
import { scaledIngredientText, selectedServings } from '../domain/recipe/servings'
import { getRecipe, type Recipe } from '../services/recipes'

export function CookingModePage() {
  const { recipeId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [recipe, setRecipe] = useState<Recipe>()
  const [error, setError] = useState<string>()
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    void getRecipe(recipeId).then(setRecipe).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load recipe.'))
  }, [recipeId])

  if (error) return <section className="recipe-page"><h1>Cooking Mode unavailable</h1><p role="alert">{error}</p><Link to={`/recipes/${recipeId}`}>Return to recipe</Link></section>
  if (!recipe) return <p role="status">Loading recipe…</p>

  const servings = selectedServings(searchParams.get('servings'), recipe.servings)
  const setServings = (value: number) => setSearchParams((current) => { const next = new URLSearchParams(current); if (value === recipe.servings) next.delete('servings'); else next.set('servings', String(value)); return next }, { replace: true })
  const instructionCount = recipe.instructions.length
  const instruction = recipe.instructions[stepIndex]
  return <article className="cooking-mode">
    <header className="cooking-mode__header"><Link className="text-link" to={`/recipes/${recipe.id}${servings && servings !== recipe.servings ? `?servings=${servings}` : ''}`}>Exit cooking mode</Link><p className="eyebrow">Cooking mode</p><h1>{recipe.title}</h1></header>
    {instruction ? <section className="cooking-mode__step" aria-live="polite" aria-atomic="true">
      <p className="cooking-mode__progress">Step {stepIndex + 1} of {instructionCount}</p>
      <p className="cooking-mode__instruction">{instruction.text}</p>
      <div className="cooking-mode__controls"><button type="button" onClick={() => setStepIndex((index) => index - 1)} disabled={stepIndex === 0}>Previous step</button><button type="button" onClick={() => setStepIndex((index) => index + 1)} disabled={stepIndex === instructionCount - 1}>Next step</button></div>
    </section> : <section className="cooking-mode__empty"><h2>No instructions yet</h2><p>This recipe does not have cooking instructions. Edit the recipe to add them.</p><Link className="text-link" to={`/recipes/${recipe.id}/edit`}>Edit recipe</Link></section>}
    <section className="cooking-mode__ingredients"><h2>Ingredients</h2>{servings ? <ServingsControl original={recipe.servings!} servings={servings} onChange={setServings} /> : <p className="hint">Add the original servings in Edit to adjust ingredient amounts.</p>}{servings !== undefined && servings !== recipe.servings && <p className="hint">Ingredient amounts are adjusted where possible. Check seasoning and cooking times; instructions still show the original wording.</p>}{recipe.ingredients.length > 0 ? <ul>{recipe.ingredients.map((ingredient) => <li key={ingredient.id}>{servings ? scaledIngredientText(ingredient.originalText, recipe.servings, servings) : ingredient.originalText}</li>)}</ul> : <p>No ingredients listed.</p>}</section>
  </article>
}
