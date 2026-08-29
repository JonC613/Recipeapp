import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ImportReviewForm } from '../../src/components/imports/ImportReviewForm'

test('renders editable ready-draft fields and submits an explicit favorite choice', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const screen = await render(<ImportReviewForm imported={{ id: 'import-1', sourceType: 'url', sourceUrl: 'https://example.com/pasta', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'Draft Pasta', ingredients: [{ originalText: '1 lemon' }], source: { type: 'url', originalUrl: 'https://example.com/pasta', importedAt: '2026-08-29T00:00:00.000Z' } } }} onSave={onSave} />)
  await screen.getByRole('textbox', { name: 'Recipe title' }).fill('Edited Pasta')
  await screen.getByRole('checkbox', { name: 'Favorite recipe' }).click()
  await screen.getByRole('button', { name: 'Save recipe' }).click()
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Edited Pasta', favorite: true, ingredients: [{ originalText: '1 lemon' }] }))
})

test('labels pasted-text provenance without a source URL', async () => {
  const screen = await render(<ImportReviewForm imported={{ id: 'import-text', sourceType: 'text', sourceText: 'Pasta\n1 lemon', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'Draft Pasta', source: { type: 'text', importedAt: '2026-08-29T00:00:00.000Z' } } }} onSave={vi.fn().mockResolvedValue(undefined)} />)
  await expect.element(screen.getByText('Pasted recipe text')).toBeVisible()
})
