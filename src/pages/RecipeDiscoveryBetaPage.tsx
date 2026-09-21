import { useNavigate } from 'react-router'
import { RecipeDiscoveryBeta } from '../components/discovery/RecipeDiscoveryBeta.js'
import { approveDiscoverySite, listDiscoverySites, previewDiscoveredRecipe, searchDiscoverySites, validateDiscoverySite } from '../services/discovery.js'
import { importRecipeUrl } from '../services/imports.js'

export function RecipeDiscoveryBetaPage() {
  const navigate = useNavigate()
  return <RecipeDiscoveryBeta loadSites={listDiscoverySites} validateSite={validateDiscoverySite} approveSite={approveDiscoverySite} searchSites={searchDiscoverySites} previewRecipe={previewDiscoveredRecipe} importRecipe={async (url) => { const imported = await importRecipeUrl(url); await navigate(`/imports/${imported.id}/review`) }} />
}
