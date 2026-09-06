import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router'

const service = vi.hoisted(() => ({ askRecipeChat: vi.fn() }))
vi.mock('../../src/services/recipe-chat', () => service)
import { RecipeChatPage } from '../../src/pages/RecipeChatPage'

beforeEach(() => service.askRecipeChat.mockReset())

test('renders a scoped answer with linked recipe citations', async () => {
  service.askRecipeChat.mockResolvedValue({ outcome: 'answer', answer: 'Garlic Shrimp uses shrimp.', citations: [{ recipeId: 'shrimp-1', title: 'Garlic Shrimp' }] })
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  await expect.element(screen.getByText('Answers use your saved recipes only.')).toBeVisible()
  const question = screen.getByRole('textbox', { name: 'Your recipe question' })
  await question.fill('Which recipes use shrimp?')
  await screen.getByRole('button', { name: 'Ask Recipe Chat' }).click()
  await expect.element(screen.getByText('Garlic Shrimp uses shrimp.')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Garlic Shrimp' })).toHaveAttribute('href', '/recipes/shrimp-1')
})

test('keeps a failed question available for retry without persisting old messages', async () => {
  service.askRecipeChat.mockRejectedValueOnce(new Error('Recipe Chat is temporarily unavailable. Please try again.')).mockResolvedValueOnce({ outcome: 'no_match', message: 'No matching saved recipes were found.' })
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  const question = screen.getByRole('textbox', { name: 'Your recipe question' })
  await question.fill('Which recipes use shrimp?')
  await screen.getByRole('button', { name: 'Ask Recipe Chat' }).click()
  await expect.element(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable')
  await expect.element(question).toHaveValue('Which recipes use shrimp?')
  await screen.getByRole('button', { name: 'Retry question' }).click()
  await expect.element(screen.getByText('No matching saved recipes were found.')).toBeVisible()
  expect(service.askRecipeChat).toHaveBeenCalledTimes(2)
})
