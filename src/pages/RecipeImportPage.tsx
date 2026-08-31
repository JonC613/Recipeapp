import { Link } from 'react-router'
import { useState } from 'react'
import { UrlImportForm } from '../components/imports/UrlImportForm'
import { TextImportForm } from '../components/imports/TextImportForm'
import { PdfImportForm } from '../components/imports/PdfImportForm'
import { ImageRecipeImport } from '../components/imports/ImageRecipeImport'
import { importRecipeImage, importRecipePdf, importRecipeText, importRecipeUrl } from '../services/imports'

type ImportMethod = 'url' | 'text' | 'pdf' | 'image'

const importMethods: Array<{ id: ImportMethod; label: string; description: string }> = [
  { id: 'url', label: 'Paste a link', description: 'From a recipe website' },
  { id: 'text', label: 'Paste recipe text', description: 'From a note or message' },
  { id: 'pdf', label: 'Upload a PDF', description: 'From a recipe document' },
  { id: 'image', label: 'Use an image', description: 'Upload or paste a screenshot' },
]

export function RecipeImportPage() {
  const [method, setMethod] = useState<ImportMethod>('url')
  const workspace = method === 'url'
    ? { title: 'Paste a recipe URL', description: 'Paste a public recipe link and we will prepare it for review.', form: <UrlImportForm onImport={importRecipeUrl} /> }
    : method === 'text'
      ? { title: 'Paste recipe text', description: 'Paste one complete recipe from a note, message, or webpage.', form: <TextImportForm onImport={importRecipeText} /> }
      : method === 'pdf'
        ? { title: 'Upload a recipe PDF', description: 'Choose one recipe document to prepare for review.', form: <PdfImportForm onImport={importRecipePdf} /> }
        : { title: 'Upload an image or screenshot', description: 'Choose a recipe image or paste a copied screenshot.', form: <ImageRecipeImport onImport={importRecipeImage} /> }

  return <section className="recipe-page import-page">
    <div className="import-page__heading"><p className="eyebrow">Recipe import</p><h1>Import a recipe</h1><p>Choose how you have the recipe. You will review every extracted field before anything is added to your library.</p></div>
    <fieldset className="import-source-chooser"><legend>Choose a source</legend><div className="import-source-chooser__grid">
      {importMethods.map((option) => <button key={option.id} type="button" className="import-source-option" aria-pressed={method === option.id} aria-controls="import-workspace" onClick={() => setMethod(option.id)}><strong>{option.label}</strong><span>{option.description}</span></button>)}
      <Link className="import-source-option" to="/recipes/mealdb"><strong>Browse TheMealDB recipes</strong><span>Find a recipe to save</span></Link>
      <Link className="import-source-option" to="/recipes/new"><strong>Enter a recipe manually</strong><span>Start from a blank recipe</span></Link>
    </div></fieldset>
    <div className="import-workspace" id="import-workspace"><div><h2>{workspace.title}</h2><p>{workspace.description}</p></div>{workspace.form}</div>
    <p className="import-page__review-note">Nothing is added to your library until you review and save it.</p>
  </section>
}
