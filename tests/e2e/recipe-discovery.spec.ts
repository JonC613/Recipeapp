import { expect, test } from '@playwright/test'

const approvedSite = { id: 'site-1', origin: 'https://recipes.example', hostname: 'recipes.example', adapter: 'wordpress_rest', status: 'approved', enabled: true, validation: { compatible: true, adapter: 'wordpress_rest', criteria: [] }, validatedAt: '2026-09-21T00:00:00.000Z', approvedAt: '2026-09-21T00:00:00.000Z' }
const sourceUrl = 'https://recipes.example/lemon-pasta'
const imported = { id: 'discovery-import-1', sourceType: 'url', sourceUrl, status: 'ready', createdAt: '2026-09-21T00:00:00.000Z', draft: { title: 'Lemon Pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Toss.' }], source: { type: 'url', originalUrl: sourceUrl, importedAt: '2026-09-21T00:00:00.000Z' } } }

test('searches an approved site and sends a preview through URL review without overflow', async ({ page }) => {
  await page.route('**/api/beta/discovery/sites', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([approvedSite]) }))
  await page.route('**/api/beta/discovery/search?*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ id: 'site-1:7', title: 'Lemon Pasta', url: sourceUrl, siteId: 'site-1', siteHostname: 'recipes.example' }], sitesSearched: 1, sitesUnavailable: 0 }) }))
  await page.route('**/api/beta/discovery/preview?*', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sourceUrl, siteHostname: 'recipes.example', draft: imported.draft }) }))
  await page.route('**/api/import/url', async (route) => route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(imported) }))
  await page.route('**/api/import/discovery-import-1', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(imported) }))

  await page.goto('/beta/discover')
  await expect(page.getByRole('heading', { name: 'Discover recipes' })).toBeVisible()
  await page.getByRole('textbox', { name: 'What would you like to cook?' }).fill('lemon')
  await page.getByRole('button', { name: 'Search recipes' }).click()
  await page.getByRole('button', { name: 'Preview recipe' }).click()
  await expect(page.getByText('Nothing has been imported yet.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Import for review' }).click()
  await expect(page).toHaveURL(/\/imports\/discovery-import-1\/review$/)
  await expect(page.getByRole('heading', { name: 'Review and save' })).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true)
})
