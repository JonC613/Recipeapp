import { Link, useNavigate } from 'react-router'
import { MealDbBrowse } from '../components/imports/MealDbBrowse.js'
import { browseMealDbByArea, browseMealDbByCategory, getMealDbRecipe, importMealDbRecipe, listMealDbAreas, listMealDbCategories, searchMealDbRecipes } from '../services/mealdb.js'

export function MealDbBrowsePage() {
  const navigate = useNavigate()
  return <section className="recipe-page"><Link to="/recipes/import">Back to recipe import</Link><MealDbBrowse loadCategories={listMealDbCategories} loadAreas={listMealDbAreas} browseByCategory={browseMealDbByCategory} browseByArea={browseMealDbByArea} searchRecipes={searchMealDbRecipes} loadRecipe={getMealDbRecipe} importRecipe={async (id) => { const imported = await importMealDbRecipe(id); await navigate(`/imports/${imported.id}/review`) }} /></section>
}
