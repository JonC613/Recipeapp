import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createMemoryRouter, RouterProvider } from 'react-router'

const services = vi.hoisted(() => ({
  getRecipeImport: vi.fn(),
  runPdfOcr: vi.fn(),
}))

vi.mock('../../src/services/imports', () => services)

import { RecipeImportResultPage } from '../../src/pages/RecipeImportResultPage'

const available = { id: 'scan-1', sourceType: 'pdf' as const, sourceName: 'scan.pdf', sourceR2Key: 'imports/scan/source.pdf', status: 'failed' as const, failureCode: 'PDF_UNREADABLE' as const, ocrStatus: 'available' as const, createdAt: '2026-08-29T00:00:00.000Z' }
const ready = { ...available, status: 'ready' as const, failureCode: undefined, ocrStatus: 'succeeded' as const, extractionMethod: 'ocr' as const, sourceText: 'Scanned soup', draft: { title: 'Scanned soup', ingredients: [{ originalText: '1 cup stock' }], instructions: [{ text: 'Simmer.' }], source: { type: 'pdf' as const, sourceName: 'scan.pdf', r2ObjectKey: 'imports/scan/source.pdf', importedAt: '2026-08-29T00:00:00.000Z' } } }

beforeEach(() => {
  services.getRecipeImport.mockReset()
  services.runPdfOcr.mockReset()
})

test('discloses OCR cost, shows progress, disables repeat clicks, and navigates to review', async () => {
  let complete!: (value: typeof ready) => void
  services.getRecipeImport.mockResolvedValue(available)
  services.runPdfOcr.mockImplementation(() => new Promise((resolve) => { complete = resolve }))
  const router = createMemoryRouter([
    { path: '/imports/:importId', element: <RecipeImportResultPage /> },
    { path: '/imports/:importId/review', element: <h1>Review scanned recipe</h1> },
  ], { initialEntries: ['/imports/scan-1'] })
  const screen = await render(<RouterProvider router={router} />)

  await expect.element(screen.getByText(/OCR uses AI credits/)).toBeVisible()
  await screen.getByRole('button', { name: 'Try OCR' }).click()
  await expect.element(screen.getByRole('button', { name: 'Reading PDF…' })).toBeDisabled()
  await expect.element(screen.getByRole('progressbar', { name: 'OCR in progress' })).toBeVisible()
  expect(services.runPdfOcr).toHaveBeenCalledTimes(1)

  complete(ready)
  await expect.element(screen.getByRole('heading', { name: 'Review scanned recipe' })).toBeVisible()
})

test('shows terminal recovery without offering another OCR attempt', async () => {
  services.getRecipeImport.mockResolvedValue({ ...available, ocrStatus: 'failed', ocrFailureCode: 'UNAVAILABLE' })
  const router = createMemoryRouter([{ path: '/imports/:importId', element: <RecipeImportResultPage /> }], { initialEntries: ['/imports/scan-1'] })
  const screen = await render(<RouterProvider router={router} />)

  await expect.element(screen.getByRole('alert')).toHaveTextContent('OCR could not read this PDF')
  await expect.element(screen.getByRole('link', { name: 'Enter a recipe manually' })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Try OCR' })).not.toBeInTheDocument()
})
