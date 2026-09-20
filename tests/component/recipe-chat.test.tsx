import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { MemoryRouter } from 'react-router'
import type { RecipeChatConversation } from '../../src/domain/recipe-chat'

const service = vi.hoisted(() => ({
  listRecipeChatConversations: vi.fn(), createRecipeChatConversation: vi.fn(), getRecipeChatConversation: vi.fn(), deleteRecipeChatConversation: vi.fn(), resolveRecipeChatProposal: vi.fn(), streamRecipeChatMessage: vi.fn(),
}))
vi.mock('../../src/services/recipe-chat', () => service)
import { RecipeChatPage } from '../../src/pages/RecipeChatPage'

const empty: RecipeChatConversation = { id: 'chat-1', title: 'New recipe chat', createdAt: '2026-09-19T00:00:00Z', updatedAt: '2026-09-19T00:00:00Z', messages: [] }

beforeEach(() => {
  Object.values(service).forEach((mock) => mock.mockReset())
  service.listRecipeChatConversations.mockResolvedValue([])
  service.createRecipeChatConversation.mockResolvedValue(empty)
})

test('streams and persists a labeled answer with recipe citations', async () => {
  const completed: RecipeChatConversation = { ...empty, title: 'Find shrimp', messages: [
    { id: 'u1', role: 'user', text: 'Find shrimp', citations: [], status: 'complete', createdAt: empty.createdAt },
    { id: 'a1', role: 'assistant', text: 'Garlic Shrimp uses shrimp.', sourceKind: 'library', citations: [{ recipeId: 'shrimp-1', title: 'Garlic Shrimp' }], status: 'complete', createdAt: empty.createdAt },
  ] }
  service.streamRecipeChatMessage.mockImplementation(async (_id: string, _message: string, onEvent: (event: unknown) => void) => { onEvent({ type: 'progress', message: 'Searching your recipes…' }); onEvent({ type: 'text_delta', delta: 'Garlic Shrimp uses shrimp.' }); onEvent({ type: 'completed', conversation: completed }) })
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  await expect.element(screen.getByText('Your everyday recipe assistant')).toBeVisible()
  const question = screen.getByRole('textbox', { name: 'Message Recipe Chat' })
  await question.fill('Find shrimp')
  await screen.getByRole('button', { name: 'Send' }).click()
  await expect.element(screen.getByText('Garlic Shrimp uses shrimp.')).toBeVisible()
  await expect.element(screen.getByText('From your saved recipes')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Garlic Shrimp' })).toHaveAttribute('href', '/recipes/shrimp-1')
})

test('renders an explicit proposal preview and applies it', async () => {
  const proposal = { id: 'p1', kind: 'meal_plan' as const, summary: 'Plan Garlic Shrimp for Friday', status: 'pending' as const, preview: { weekStart: '2026-09-20', dayIndex: 5 } }
  const withProposal: RecipeChatConversation = { ...empty, messages: [{ id: 'a1', role: 'assistant', text: 'Preview ready.', sourceKind: 'library', citations: [], status: 'complete', proposal, createdAt: empty.createdAt }] }
  service.listRecipeChatConversations.mockResolvedValue([{ id: empty.id, title: empty.title, createdAt: empty.createdAt, updatedAt: empty.updatedAt }])
  service.getRecipeChatConversation.mockResolvedValue(withProposal)
  service.resolveRecipeChatProposal.mockResolvedValue({ ...withProposal, messages: [{ ...withProposal.messages[0], proposal: { ...proposal, status: 'applied' } }] })
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  await expect.element(screen.getByText('Preview — no changes saved yet')).toBeVisible()
  await screen.getByRole('button', { name: 'Apply' }).click()
  await expect.element(screen.getByText('Applied')).toBeVisible()
})

test('stops an in-flight streamed turn', async () => {
  service.streamRecipeChatMessage.mockImplementation((_id: string, _message: string, onEvent: (event: unknown) => void, signal: AbortSignal) => new Promise((_resolve, reject) => { onEvent({ type: 'progress', message: 'Searching your recipes…' }); signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))) }))
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  const question = screen.getByRole('textbox', { name: 'Message Recipe Chat' })
  await question.fill('Find shrimp')
  await screen.getByRole('button', { name: 'Send' }).click()
  await screen.getByRole('button', { name: 'Stop' }).click()
  await expect.element(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
})

test('deletes the active conversation without creating a replacement', async () => {
  service.listRecipeChatConversations
    .mockResolvedValueOnce([{ id: empty.id, title: empty.title, createdAt: empty.createdAt, updatedAt: empty.updatedAt }])
    .mockResolvedValueOnce([])
  service.getRecipeChatConversation.mockResolvedValue(empty)
  service.deleteRecipeChatConversation.mockResolvedValue(undefined)
  const screen = await render(<MemoryRouter><RecipeChatPage /></MemoryRouter>)
  await expect.element(screen.getByRole('button', { name: 'Delete this chat' })).toBeVisible()
  await screen.getByRole('button', { name: 'Delete this chat' }).click()
  await expect.element(screen.getByRole('heading', { name: 'Start a new conversation' })).toBeVisible()
  expect(service.deleteRecipeChatConversation).toHaveBeenCalledWith(empty.id)
  expect(service.createRecipeChatConversation).not.toHaveBeenCalled()
})
