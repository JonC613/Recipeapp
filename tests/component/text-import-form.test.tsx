import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { TextImportForm } from '../../src/components/imports/TextImportForm'

test('shows character feedback and submits one pasted recipe draft', async () => {
  const onImport = vi.fn().mockResolvedValue({ id: 'text-1', sourceType: 'text', sourceText: 'Pasta\n1 lemon', status: 'ready', createdAt: '2026-08-29T00:00:00.000Z', draft: { title: 'Pasta', source: { type: 'text', importedAt: '2026-08-29T00:00:00.000Z' } } })
  const screen = await render(<TextImportForm onImport={onImport} />)
  await screen.getByRole('textbox', { name: 'Recipe text' }).fill('Pasta\n1 lemon')
  await expect.element(screen.getByText(/13 \/ 50,000 characters/)).toBeVisible()
  await screen.getByRole('button', { name: 'Extract recipe' }).click()
  expect(onImport).toHaveBeenCalledTimes(1)
  await expect.element(screen.getByRole('heading', { name: 'Pasta' })).toBeVisible()
})

test('rejects empty text without submitting', async () => {
  const onImport = vi.fn()
  const screen = await render(<TextImportForm onImport={onImport} />)
  await screen.getByRole('button', { name: 'Extract recipe' }).click()
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Paste recipe text')
  expect(onImport).not.toHaveBeenCalled()
})
