import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router'
import { RecipeCard } from '../../src/components/recipes/RecipeCard'

test('renders favorite state and available recipe summary metadata', async () => {
  const screen = await render(<MemoryRouter><RecipeCard recipe={{
    id: 'pasta', title: 'Weeknight Lemon Pasta', favorite: true,
    category: 'Dinner', prepMinutes: 10, cookMinutes: 15,
  }} /></MemoryRouter>)

  await expect.element(screen.getByText('★ Favorite')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Weeknight Lemon Pasta' })).toBeVisible()
  await expect.element(screen.getByText('Dinner · 10 min prep · 15 min cook')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: /open recipe/i })).toHaveAttribute('href', '/recipes/pasta')
})
