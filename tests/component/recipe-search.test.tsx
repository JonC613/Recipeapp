import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router'
import { RecipeLibraryPage } from '../../src/pages/RecipeLibraryPage'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => Response.json([]))
  vi.stubGlobal('fetch', fetchMock)
})

test('offers unified search, filters, clear recovery, and a distinct no-match state', async () => {
  const screen = await render(<MemoryRouter><RecipeLibraryPage /></MemoryRouter>)
  const search = screen.getByRole('searchbox', { name: 'Search recipes' })
  await search.fill('blackstone')
  await expect.element(screen.getByText('No recipes match your search or filters.')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Clear search and filters' })).toBeVisible()
  await screen.getByText('Filter recipes').click()
  await expect.element(screen.getByRole('checkbox', { name: 'Favorites only' })).toBeVisible()
  await screen.getByRole('checkbox', { name: 'Favorites only' }).click()
  await screen.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect.element(search).toHaveValue('')
  expect(fetchMock).toHaveBeenCalled()
})
