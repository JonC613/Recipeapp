import { Link } from 'react-router'
import { UrlImportForm } from '../components/imports/UrlImportForm'
import { TextImportForm } from '../components/imports/TextImportForm'
import { PdfImportForm } from '../components/imports/PdfImportForm'
import { importRecipePdf, importRecipeText, importRecipeUrl } from '../services/imports'
export function RecipeImportPage() { return <section className="recipe-page"><p className="eyebrow">Recipe import</p><h1>Import a recipe</h1><h2>Paste a recipe URL</h2><UrlImportForm onImport={importRecipeUrl} /><h2>Paste recipe text</h2><TextImportForm onImport={importRecipeText} /><h2>Upload a recipe PDF</h2><PdfImportForm onImport={importRecipePdf} /><Link to="/recipes/new">Enter a recipe manually</Link></section> }
