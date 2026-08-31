import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { ImageRecipeImport } from '../../src/components/imports/ImageRecipeImport'

function pasteImage(target: HTMLElement, files: File[]) {
  const clipboard = new DataTransfer()
  files.forEach((file) => clipboard.items.add(file))
  target.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }))
}

test('requires an image before private retention', async () => {
  const onImport = vi.fn()
  const screen = await render(<ImageRecipeImport onImport={onImport} />)
  await screen.getByRole('button', { name: 'Retain image' }).click()
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose one JPEG')
  expect(onImport).not.toHaveBeenCalled()
})

test('discloses the explicit AI extraction boundary before upload', async () => {
  const screen = await render(<ImageRecipeImport onImport={vi.fn()} />)
  await expect.element(screen.getByText('AI is not used until you choose Extract recipe.')).toBeVisible()
})

test('keeps a pasted screenshot local until Use pasted image is selected', async () => {
  const onImport = vi.fn().mockResolvedValue({ id: 'pasted-1' })
  const screen = await render(<ImageRecipeImport onImport={onImport} />)
  const screenshot = new File(['screenshot'], 'recipe-screenshot.png', { type: 'image/png' })

  pasteImage(screen.getByRole('group', { name: 'Paste a copied screenshot' }).element(), [screenshot])

  await expect.element(screen.getByRole('region', { name: 'Pasted image candidate' })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Use pasted image' })).toBeVisible()
  expect(onImport).not.toHaveBeenCalled()

  await screen.getByRole('button', { name: 'Use pasted image' }).click()
  expect(onImport).toHaveBeenCalledWith(screenshot)
})

test('rejects non-image clipboard data without creating an import', async () => {
  const onImport = vi.fn()
  const screen = await render(<ImageRecipeImport onImport={onImport} />)
  pasteImage(screen.getByRole('group', { name: 'Paste a copied screenshot' }).element(), [new File(['text'], 'notes.txt', { type: 'text/plain' })])

  await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG, WebP, or HEIC image.')
  expect(onImport).not.toHaveBeenCalled()
})
