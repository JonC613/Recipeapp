import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { RecipeDiscoveryBeta } from '../../src/components/discovery/RecipeDiscoveryBeta.js'
import type { DiscoverySite } from '../../src/domain/recipe/discovery.js'

const approved: DiscoverySite = { id: 'site-1', origin: 'https://recipes.example', hostname: 'recipes.example', adapter: 'wordpress_rest', status: 'approved', enabled: true, validation: { compatible: true, adapter: 'wordpress_rest', criteria: [] }, validatedAt: '2026-09-21T00:00:00.000Z', approvedAt: '2026-09-21T00:00:00.000Z' }
const loadSites = vi.fn(async () => [approved])
const previewRecipe = vi.fn(async () => ({ sourceUrl: 'https://recipes.example/lemon-pasta', siteHostname: 'recipes.example', draft: { title: 'Lemon Pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Toss.' }] } }))

test('searches, previews, and explicitly imports through the supplied URL bridge', async () => {
  const searchSites = vi.fn(async () => ({ results: [{ id: 'site-1:7', title: 'Lemon Pasta', url: 'https://recipes.example/lemon-pasta', siteId: 'site-1', siteHostname: 'recipes.example' }], sitesSearched: 1, sitesUnavailable: 0 }))
  const importRecipe = vi.fn(async () => undefined)
  const screen = await render(<RecipeDiscoveryBeta loadSites={loadSites} validateSite={vi.fn()} approveSite={vi.fn()} searchSites={searchSites} previewRecipe={previewRecipe} importRecipe={importRecipe} />)
  await screen.getByRole('textbox', { name: 'What would you like to cook?' }).fill('lemon')
  await screen.getByRole('button', { name: 'Search recipes' }).click()
  await expect.element(screen.getByRole('heading', { name: 'Lemon Pasta' })).toBeVisible()
  expect(importRecipe).not.toHaveBeenCalled()
  await screen.getByRole('button', { name: 'Preview recipe' }).click()
  await expect.element(screen.getByText('Nothing has been imported yet.', { exact: false })).toBeVisible()
  await screen.getByRole('button', { name: 'Import for review' }).click()
  expect(importRecipe).toHaveBeenCalledWith('https://recipes.example/lemon-pasta')
})

test('shows compatibility criteria before explicit site approval', async () => {
  const candidate: DiscoverySite = { ...approved, id: 'candidate', status: 'pending', enabled: false, approvedAt: undefined, validation: { compatible: true, adapter: 'wordpress_rest', criteria: [{ id: 'https', passed: true, message: 'Uses public HTTPS.' }, { id: 'recipe', passed: true, message: 'A sample result contains one structured recipe.' }] } }
  const validateSite = vi.fn(async () => candidate)
  const approveSite = vi.fn(async () => ({ ...candidate, status: 'approved' as const, enabled: true, approvedAt: '2026-09-21T00:01:00.000Z' }))
  const screen = await render(<RecipeDiscoveryBeta loadSites={loadSites} validateSite={validateSite} approveSite={approveSite} searchSites={vi.fn()} previewRecipe={previewRecipe} importRecipe={vi.fn()} />)
  await screen.getByRole('textbox', { name: 'Recipe site URL' }).fill('https://recipes.example')
  await screen.getByRole('button', { name: 'Check compatibility' }).click()
  await expect.element(screen.getByText('Uses public HTTPS.')).toBeVisible()
  await expect.element(screen.getByText('A sample result contains one structured recipe.')).toBeVisible()
  await screen.getByRole('button', { name: 'Add to approved sites' }).click()
  expect(approveSite).toHaveBeenCalledWith('candidate')
  await expect.element(screen.getByText('Added to approved sites.')).toBeVisible()
})
