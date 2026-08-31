import { Link } from 'react-router'
import { UrlImportForm } from '../components/imports/UrlImportForm'
import { TextImportForm } from '../components/imports/TextImportForm'
import { PdfImportForm } from '../components/imports/PdfImportForm'
import { ImageRecipeImport } from '../components/imports/ImageRecipeImport'
import { importRecipeImage, importRecipePdf, importRecipeText, importRecipeUrl } from '../services/imports'
export function RecipeImportPage() { return <section className="recipe-page"><p className="eyebrow">Recipe import</p><h1>Import a recipe</h1><Link className="button-link" to="/recipes/mealdb">Browse TheMealDB recipes</Link><h2>Paste a recipe URL</h2><UrlImportForm onImport={importRecipeUrl} /><h2>Paste recipe text</h2><TextImportForm onImport={importRecipeText} /><h2>Upload a recipe PDF</h2><PdfImportForm onImport={importRecipePdf} /><h2>Upload an image or screenshot</h2><ImageRecipeImport onImport={importRecipeImage} /><Link to="/recipes/new">Enter a recipe manually</Link></section> }
