import { Link } from 'react-router'
import type { RecipeSummary } from '../../services/recipes.js'

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const details = [
    recipe.category,
    recipe.prepMinutes != null && `${recipe.prepMinutes} min prep`,
    recipe.cookMinutes != null && `${recipe.cookMinutes} min cook`,
  ].filter(Boolean)

  return <article className="recipe-card">
    <div className="recipe-card__heading"><p className={`card-kicker${recipe.favorite ? ' card-kicker--favorite' : ''}`}>{recipe.favorite ? '★ Favorite' : 'Saved recipe'}</p><h2><Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link></h2></div>
    {details.length > 0 && <p className="recipe-card__metadata">{details.join(' · ')}</p>}
    <Link className="recipe-card__open" to={`/recipes/${recipe.id}`}>Open recipe <span aria-hidden="true">→</span></Link>
  </article>
}
