import { Link, useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import type { RecipeImport } from '../domain/recipe/imports.js'
import { ImportDraftSummary } from '../components/imports/UrlImportForm'
import { extractRecipeImage, getRecipeImport, runPdfOcr } from '../services/imports'

export function RecipeImportResultPage() {
  const { importId } = useParams()
  const navigate = useNavigate()
  const [imported, setImported] = useState<RecipeImport>()
  const [error, setError] = useState<string>()
  const [ocrRunning, setOcrRunning] = useState(false)
  const [visionRunning, setVisionRunning] = useState(false)
  useEffect(() => { if (importId) void getRecipeImport(importId).then(setImported).catch((cause) => setError(cause instanceof Error ? cause.message : 'The import could not be retrieved.')) }, [importId])
  async function handleOcr() {
    if (!imported || ocrRunning) return
    setError(undefined)
    setOcrRunning(true)
    try {
      const result = await runPdfOcr(imported.id)
      setImported(result)
      if (result.status === 'ready') navigate(`/imports/${result.id}/review`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'OCR could not be completed.')
    } finally {
      setOcrRunning(false)
    }
  }
  async function handleImageVision() {
    if (!imported || visionRunning) return
    setError(undefined); setVisionRunning(true)
    try {
      const result = await extractRecipeImage(imported.id)
      setImported(result)
      if (result.status === 'ready') navigate(`/imports/${result.id}/review`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Image extraction could not be completed.') } finally { setVisionRunning(false) }
  }
  const sourceLabel = imported?.sourceType === 'text' ? 'Pasted recipe text' : imported?.sourceType === 'pdf' ? 'Recipe PDF' : imported?.sourceType === 'image' ? 'Recipe image' : 'Recipe URL'
  return <section className="recipe-page"><p className="eyebrow">{sourceLabel}</p><h1>Import draft</h1>{error ? <><p role="alert">{error}</p><Link to="/recipes/import">Import another recipe</Link><Link to="/recipes/new">Enter a recipe manually</Link></> : !imported ? <p role="status">Loading import draft…</p> : <><ImportDraftSummary imported={imported} />{imported.sourceType === 'image' && imported.visionStatus === 'available' && <section><p>This image is retained privately. Extract recipe uses AI credits and can be selected once.</p><button type="button" disabled={visionRunning} onClick={() => void handleImageVision()}>{visionRunning ? 'Extracting recipe…' : 'Extract recipe'}</button>{visionRunning && <div role="status" aria-live="polite"><p>Reading your image and preparing a recipe draft…</p><progress aria-label="Image extraction in progress" /></div>}</section>}{imported.ocrStatus === 'available' && <section><p>This PDF appears to be a scan. OCR uses AI credits and can be tried once.</p><button type="button" disabled={ocrRunning} onClick={() => void handleOcr()}>{ocrRunning ? 'Reading PDF…' : 'Try OCR'}</button>{ocrRunning && <div role="status" aria-live="polite"><p>Reading the scanned PDF and preparing your recipe…</p><progress aria-label="OCR in progress" /></div>}</section>}{imported.ocrStatus === 'succeeded' && <p className="hint">This scanned PDF was read with OCR. Review every field before saving.</p>}{imported.ocrStatus === 'failed' && <p role="alert">OCR could not read this PDF. Import another recipe or enter it manually.</p>}{imported.ocrStatus === 'page_limit' && <p role="alert">This PDF has too many pages for OCR. Use a PDF with 10 pages or fewer, or enter it manually.</p>}{imported.status === 'ready' && !imported.approvedRecipeId && <Link className="button-link" to={`/imports/${imported.id}/review`}>Review and save</Link>}<Link to="/recipes/import">Import another recipe</Link>{(imported.ocrStatus === 'failed' || imported.ocrStatus === 'page_limit') && <Link to="/recipes/new">Enter a recipe manually</Link>}</>}</section>
}
