import { Link } from 'react-router'
import { UrlImportForm } from '../components/imports/UrlImportForm'
import { importRecipeUrl } from '../services/imports'
export function RecipeImportPage() { return <section className="recipe-page"><p className="eyebrow">Recipe URL</p><h1>Import a recipe</h1><UrlImportForm onImport={importRecipeUrl} /><Link to="/recipes/new">Enter a recipe manually</Link></section> }
