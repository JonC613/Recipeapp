import { Link, useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import { deleteRecipe, getRecipe, setFavorite, type Recipe } from '../services/recipes'

export function RecipeDetailPage() {
  const { recipeId = '' } = useParams(); const navigate = useNavigate(); const [recipe, setRecipe] = useState<Recipe>(); const [error, setError] = useState<string>(); const [confirming, setConfirming] = useState(false)
  useEffect(() => { void getRecipe(recipeId).then(setRecipe).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load recipe.')) }, [recipeId])
  if (error) return <section className="recipe-page"><h1>Recipe unavailable</h1><p role="alert">{error}</p><Link to="/">Return to library</Link></section>
  if (!recipe) return <p role="status">Loading recipe…</p>
  const metadata = [recipe.servings && `${recipe.servings} servings`, recipe.prepMinutes != null && `${recipe.prepMinutes} min prep`, recipe.cookMinutes != null && `${recipe.cookMinutes} min cook`, recipe.totalMinutes != null && `${recipe.totalMinutes} min total`, recipe.cuisine, recipe.category].filter(Boolean)
  return <article className="recipe-page recipe-detail"><p className="eyebrow">{recipe.source.type} recipe</p><h1>{recipe.title}</h1>{recipe.description && <p className="recipe-description">{recipe.description}</p>}{metadata.length > 0 && <p className="recipe-metadata">{metadata.join(' · ')}</p>}{recipe.tags.length > 0 && <p className="recipe-tags">{recipe.tags.join(' · ')}</p>}<div className="recipe-actions"><Link to={`/recipes/${recipe.id}/edit`}>Edit</Link><button type="button" onClick={() => void setFavorite(recipe.id, !recipe.favorite).then(setRecipe).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not update favorite.'))}>{recipe.favorite ? 'Unfavorite' : 'Favorite'}</button><button type="button" onClick={() => setConfirming(true)}>Delete</button></div>
    {confirming && <section className="delete-confirmation" role="alert"><p>Delete this recipe permanently?</p><button type="button" onClick={() => void deleteRecipe(recipe.id).then(() => navigate('/')).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not delete recipe.'))}>Confirm delete</button><button type="button" onClick={() => setConfirming(false)}>Cancel</button></section>}
    <Link to="/">Back to library</Link>
    {recipe.ingredients.length > 0 && <section><h2>Ingredients</h2><ul>{recipe.ingredients.map((ingredient) => <li key={ingredient.id}>{ingredient.originalText}</li>)}</ul></section>}
    {recipe.instructions.length > 0 && <section><h2>Instructions</h2><ol>{recipe.instructions.map((instruction) => <li key={instruction.id}>{instruction.text}</li>)}</ol></section>}
    {recipe.notes && <section><h2>Notes</h2><p>{recipe.notes}</p></section>}
    <section><h2>Source</h2><p>{recipe.source.type === 'url' ? <a href={recipe.source.originalUrl} target="_blank" rel="noreferrer">Imported from {recipe.source.originalUrl}</a> : 'Entered manually'}</p></section>
  </article>
}
