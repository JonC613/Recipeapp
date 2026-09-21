import { useEffect, useState } from 'react'
import type { DiscoveryPreview, DiscoverySearchResponse, DiscoverySite } from '../../domain/recipe/discovery.js'

type Props = {
  loadSites: () => Promise<DiscoverySite[]>
  validateSite: (url: string) => Promise<DiscoverySite>
  approveSite: (id: string) => Promise<DiscoverySite>
  searchSites: (query: string) => Promise<DiscoverySearchResponse>
  previewRecipe: (url: string) => Promise<DiscoveryPreview>
  importRecipe: (url: string) => Promise<void>
}

function message(reason: unknown): string { return reason instanceof Error ? reason.message : 'Recipe discovery is temporarily unavailable. Please try again.' }

export function RecipeDiscoveryBeta({ loadSites, validateSite, approveSite, searchSites, previewRecipe, importRecipe }: Props) {
  const [sites, setSites] = useState<DiscoverySite[]>([])
  const [query, setQuery] = useState('')
  const [candidateUrl, setCandidateUrl] = useState('')
  const [searchResponse, setSearchResponse] = useState<DiscoverySearchResponse>()
  const [preview, setPreview] = useState<DiscoveryPreview>()
  const [candidate, setCandidate] = useState<DiscoverySite>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<'idle' | 'sites' | 'search' | 'preview' | 'validate' | 'approve' | 'import'>('sites')

  useEffect(() => {
    let active = true
    loadSites().then((value) => { if (active) setSites(value) }).catch((reason) => { if (active) setError(message(reason)) }).finally(() => { if (active) setBusy('idle') })
    return () => { active = false }
  }, [loadSites])

  async function search(event: React.FormEvent) {
    event.preventDefault(); if (!query.trim()) return
    setBusy('search'); setError(undefined); setPreview(undefined)
    try { setSearchResponse(await searchSites(query.trim())) } catch (reason) { setError(message(reason)); setSearchResponse(undefined) } finally { setBusy('idle') }
  }

  async function openPreview(url: string) {
    setBusy('preview'); setError(undefined)
    try { setPreview(await previewRecipe(url)) } catch (reason) { setError(message(reason)) } finally { setBusy('idle') }
  }

  async function runValidation(event: React.FormEvent) {
    event.preventDefault(); if (!candidateUrl.trim()) return
    setBusy('validate'); setError(undefined); setCandidate(undefined)
    try { const checked = await validateSite(candidateUrl.trim()); setCandidate(checked); setSites((current) => [...current.filter((site) => site.id !== checked.id), checked].sort((a, b) => a.hostname.localeCompare(b.hostname))) } catch (reason) { setError(message(reason)) } finally { setBusy('idle') }
  }

  async function approve() {
    if (!candidate) return
    setBusy('approve'); setError(undefined)
    try {
      const approved = await approveSite(candidate.id)
      setCandidate(approved)
      setSites((current) => [...current.filter((site) => site.id !== approved.id), approved].sort((a, b) => a.hostname.localeCompare(b.hostname)))
    } catch (reason) { setError(message(reason)) } finally { setBusy('idle') }
  }

  async function importForReview() {
    if (!preview) return
    setBusy('import'); setError(undefined)
    try { await importRecipe(preview.sourceUrl) } catch (reason) { setError(message(reason)); setBusy('idle') }
  }

  const loading = busy !== 'idle'
  const approvedCount = sites.filter((site) => site.status === 'approved' && site.enabled).length

  return <section className="recipe-discovery" aria-labelledby="discovery-heading">
    <div className="page-heading"><div><p className="eyebrow">Beta</p><h1 id="discovery-heading">Discover recipes</h1><p className="page-heading__description">Search compatible sites you have approved, preview a recipe, then send it through the usual review process.</p></div></div>
    {error ? <p className="service-status service-status--unavailable" role="alert">{error}</p> : null}

    <section className="discovery-panel" aria-labelledby="approved-search-heading">
      <div><p className="card-kicker">{approvedCount} approved {approvedCount === 1 ? 'site' : 'sites'}</p><h2 id="approved-search-heading">Search approved sites</h2></div>
      <form className="discovery-search" onSubmit={search}><label>What would you like to cook?<input value={query} maxLength={100} onChange={(event) => setQuery(event.target.value)} placeholder="Chicken, pasta, soup…" /></label><button type="submit" disabled={loading || !query.trim()}>{busy === 'search' ? 'Searching…' : 'Search recipes'}</button></form>
      {searchResponse?.sitesUnavailable ? <p className="hint">{searchResponse.sitesUnavailable} approved site could not be searched this time.</p> : null}
      {searchResponse && searchResponse.results.length === 0 ? <p className="empty-state">No matching recipes were found.</p> : null}
      {searchResponse?.results.length && !preview ? <div className="recipe-grid" aria-label="Discovered recipes">{searchResponse.results.map((result) => <article className="recipe-card" key={result.id}><p className="card-kicker">Approved source</p><h2>{result.title}</h2><p className="recipe-metadata">{result.siteHostname}</p><div className="recipe-actions"><button type="button" disabled={loading} onClick={() => void openPreview(result.url)}>Preview recipe</button></div></article>)}</div> : null}
      {preview ? <section className="import-draft" aria-label="Discovered recipe preview"><p className="card-kicker">Recipe preview</p><h2>{preview.draft.title}</h2><p className="hint">Source: {preview.siteHostname}. Nothing has been imported yet.</p>{preview.draft.ingredients?.length ? <section><h3>Ingredients</h3><ul>{preview.draft.ingredients.map((item, index) => <li key={`${item.originalText}-${index}`}>{item.originalText}</li>)}</ul></section> : null}{preview.draft.instructions?.length ? <section><h3>Instructions</h3><ol>{preview.draft.instructions.map((item, index) => <li key={`${item.text}-${index}`}>{item.text}</li>)}</ol></section> : null}<div className="recipe-actions"><button type="button" disabled={loading} onClick={() => void importForReview()}>{busy === 'import' ? 'Preparing…' : 'Import for review'}</button><button type="button" disabled={loading} onClick={() => setPreview(undefined)}>Back to results</button></div></section> : null}
    </section>

    <section className="discovery-panel" aria-labelledby="site-check-heading">
      <div><p className="card-kicker">Owner tools</p><h2 id="site-check-heading">Check another site</h2><p className="hint">This checks technical compatibility only. Review the site’s terms before approving it.</p></div>
      <form className="discovery-search" onSubmit={runValidation}><label>Recipe site URL<input type="url" value={candidateUrl} onChange={(event) => setCandidateUrl(event.target.value)} placeholder="https://example.com" /></label><button type="submit" disabled={loading || !candidateUrl.trim()}>{busy === 'validate' ? 'Checking site…' : 'Check compatibility'}</button></form>
      {candidate ? <section className="compatibility-report" aria-live="polite"><div><p className="card-kicker">Compatibility report</p><h3>{candidate.hostname}</h3></div><ul>{candidate.validation.criteria.map((criterion) => <li key={criterion.id} className={criterion.passed ? 'compatibility-report__pass' : 'compatibility-report__fail'}><span aria-hidden="true">{criterion.passed ? '✓' : '×'}</span><span>{criterion.message}</span></li>)}</ul>{candidate.status === 'approved' ? <p className="service-status service-status--available">Added to approved sites.</p> : candidate.validation.compatible ? <button type="button" disabled={loading} onClick={() => void approve()}>{busy === 'approve' ? 'Adding…' : 'Add to approved sites'}</button> : <p role="status">This site cannot be approved yet.</p>}</section> : null}
    </section>
  </section>
}
