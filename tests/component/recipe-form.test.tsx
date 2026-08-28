import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { RecipeForm } from '../../src/components/recipes/RecipeForm'

test('renders required manual recipe entry controls', async () => {
  const screen = await render(<RecipeForm onSave={vi.fn().mockResolvedValue(undefined)} />)
  await expect.element(screen.getByRole('textbox', { name: 'Recipe title' })).toBeVisible()
  await expect.element(screen.getByRole('textbox', { name: /ingredients/i })).toBeVisible()
  await expect.element(screen.getByRole('textbox', { name: /instructions/i })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Save recipe' })).toBeVisible()
})
