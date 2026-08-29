import { useNavigate, useParams } from 'react-router'
import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { RecipeForm } from '../components/recipes/RecipeForm'
import { createRecipe, getRecipe, type Recipe, updateRecipe } from '../services/recipes'

export function RecipeEditorPage() {
  const navigate = useNavigate(); const { recipeId } = useParams(); const [recipe, setRecipe] = useState<Recipe>()
  useEffect(() => { if (recipeId) void getRecipe(recipeId).then(setRecipe) }, [recipeId])
  if (recipeId && !recipe) return <p role="status">Loading recipe…</p>
  return <section className="recipe-page"><p className="eyebrow">Manual recipe</p><h1>{recipeId ? 'Edit recipe' : 'Add a recipe'}</h1>{!recipeId && <Link className="button-link" to="/recipes/import">Import from URL instead</Link>}<RecipeForm initial={recipe} onSave={async (input) => { const saved = recipeId ? await updateRecipe(recipeId, input) : await createRecipe(input); await navigate(`/recipes/${saved.id}`) }} /></section>
}
