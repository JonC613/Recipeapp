import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { UrlImportForm } from '../../src/components/imports/UrlImportForm'

test('submits a URL and renders an unsaved import draft', async () => {
  const onImport = vi.fn().mockResolvedValue({
    id: 'import-1', sourceType: 'url', sourceUrl: 'https://example.com/pasta', status: 'ready', createdAt: '2026-08-28T00:00:00.000Z',
    draft: { title: 'Fixture Pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Toss and serve.' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-28T00:00:00.000Z' } },
  })
  const screen = await render(<UrlImportForm onImport={onImport} />)
  await screen.getByRole('textbox', { name: 'Recipe URL' }).fill('https://example.com/pasta')
  await screen.getByRole('button', { name: 'Import recipe' }).click()
  await expect.element(screen.getByRole('heading', { name: 'Fixture Pasta' })).toBeVisible()
  await expect.element(screen.getByText('1 lemon')).toBeVisible()
  await expect.element(screen.getByText('Toss and serve.')).toBeVisible()
  expect(onImport).toHaveBeenCalledWith('https://example.com/pasta')
})

test('shows a safe recovery message when import fails', async () => {
  const screen = await render(<UrlImportForm onImport={vi.fn().mockRejectedValue(new Error('No usable recipe was found at that URL. Try another URL or enter it manually.'))} />)
  await screen.getByRole('textbox', { name: 'Recipe URL' }).fill('https://example.com/not-a-recipe')
  await screen.getByRole('button', { name: 'Import recipe' }).click()
  await expect.element(screen.getByText('No usable recipe was found at that URL. Try another URL or enter it manually.')).toBeVisible()
})
