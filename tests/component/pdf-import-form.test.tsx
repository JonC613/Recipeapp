import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { PdfImportForm } from '../../src/components/imports/PdfImportForm'

test('requires a selected PDF before submission', async () => {
  const onImport = vi.fn()
  const screen = await render(<PdfImportForm onImport={onImport} />)
  await screen.getByRole('button', { name: 'Extract PDF recipe' }).click()
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose one PDF')
  expect(onImport).not.toHaveBeenCalled()
})
