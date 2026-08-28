import { Link } from 'react-router'
import type { RecipeSummary } from '../../services/recipes.js'

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return <article className="recipe-card">
    <div><p className="card-kicker">{recipe.favorite ? 'Favorite' : 'Recipe'}</p><h2><Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link></h2></div>
    {(recipe.prepMinutes || recipe.cookMinutes || recipe.category) && <p>{[recipe.prepMinutes && `${recipe.prepMinutes} min prep`, recipe.cookMinutes && `${recipe.cookMinutes} min cook`, recipe.category].filter(Boolean).join(' · ')}</p>}
  </article>
}
