import type { RecipeChatConversation, RecipeChatConversationSummary, RecipeChatMessage, RecipeChatProposal, RecipeChatProposalKind, RecipeChatSourceKind } from '../../src/domain/recipe-chat.js'

type ConversationRow = { id: string; title: string; created_at: string; updated_at: string }
type MessageRow = { id: string; role: 'user' | 'assistant'; text: string; source_kind: RecipeChatSourceKind | null; recipe_ids_json: string; status: RecipeChatMessage['status']; created_at: string }
type ProposalRow = { id: string; message_id: string; kind: RecipeChatProposalKind; summary: string; payload_json: string; status: RecipeChatProposal['status']; result_json: string | null }

const parseObject = (value: string | null): Record<string, unknown> | undefined => {
  if (!value) return undefined
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined } catch { return undefined }
}
const parseIds = (value: string): string[] => { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, 12) : [] } catch { return [] } }

export async function createConversation(db: D1Database, title = 'New recipe chat'): Promise<RecipeChatConversation> {
  const id = crypto.randomUUID(), timestamp = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_chat_conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').bind(id, title.slice(0, 120), timestamp, timestamp).run()
  return { id, title: title.slice(0, 120), createdAt: timestamp, updatedAt: timestamp, messages: [] }
}

export async function listConversations(db: D1Database): Promise<RecipeChatConversationSummary[]> {
  const { results } = await db.prepare('SELECT id, title, created_at, updated_at FROM recipe_chat_conversations ORDER BY updated_at DESC LIMIT 50').all<ConversationRow>()
  return results.map((row) => ({ id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at }))
}

export async function getConversation(db: D1Database, id: string): Promise<RecipeChatConversation | undefined> {
  const conversation = await db.prepare('SELECT id, title, created_at, updated_at FROM recipe_chat_conversations WHERE id = ?').bind(id).first<ConversationRow>()
  if (!conversation) return undefined
  const [messagesResult, proposalsResult] = await Promise.all([
    db.prepare('SELECT id, role, text, source_kind, recipe_ids_json, status, created_at FROM recipe_chat_messages WHERE conversation_id = ? ORDER BY created_at, id').bind(id).all<MessageRow>(),
    db.prepare('SELECT id, message_id, kind, summary, payload_json, status, result_json FROM recipe_chat_proposals WHERE conversation_id = ? ORDER BY created_at').bind(id).all<ProposalRow>(),
  ])
  const recipeIds = [...new Set(messagesResult.results.flatMap((row) => parseIds(row.recipe_ids_json)))]
  const titles = new Map<string, string>()
  if (recipeIds.length) {
    const placeholders = recipeIds.map(() => '?').join(',')
    const { results } = await db.prepare(`SELECT id, title FROM recipes WHERE id IN (${placeholders})`).bind(...recipeIds).all<{ id: string; title: string }>()
    for (const row of results) titles.set(row.id, row.title)
  }
  const proposalByMessage = new Map(proposalsResult.results.map((row) => [row.message_id, {
    id: row.id, kind: row.kind, summary: row.summary, status: row.status, preview: parseObject(row.payload_json) ?? {}, result: parseObject(row.result_json),
  } satisfies RecipeChatProposal]))
  return {
    id: conversation.id, title: conversation.title, createdAt: conversation.created_at, updatedAt: conversation.updated_at,
    messages: messagesResult.results.map((row) => ({
      id: row.id, role: row.role, text: row.text, sourceKind: row.source_kind ?? undefined, status: row.status, createdAt: row.created_at,
      citations: parseIds(row.recipe_ids_json).flatMap((recipeId) => titles.has(recipeId) ? [{ recipeId, title: titles.get(recipeId)! }] : []),
      proposal: proposalByMessage.get(row.id),
    })),
  }
}

export async function deleteConversation(db: D1Database, id: string): Promise<boolean> {
  return Boolean((await db.prepare('DELETE FROM recipe_chat_conversations WHERE id = ?').bind(id).run()).meta.changes)
}

export async function addMessage(db: D1Database, input: { conversationId: string; role: 'user' | 'assistant'; text: string; sourceKind?: RecipeChatSourceKind; recipeIds?: string[]; status?: RecipeChatMessage['status'] }): Promise<string> {
  const id = crypto.randomUUID(), timestamp = new Date().toISOString()
  await db.batch([
    db.prepare('INSERT INTO recipe_chat_messages (id, conversation_id, role, text, source_kind, recipe_ids_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, input.conversationId, input.role, input.text, input.sourceKind ?? null, JSON.stringify(input.recipeIds ?? []), input.status ?? 'complete', timestamp),
    db.prepare(`UPDATE recipe_chat_conversations SET title = CASE WHEN title = 'New recipe chat' AND ? = 'user' THEN ? ELSE title END, updated_at = ? WHERE id = ?`).bind(input.role, input.text.slice(0, 72), timestamp, input.conversationId),
  ])
  return id
}

export async function addProposal(db: D1Database, input: { conversationId: string; messageId: string; kind: RecipeChatProposalKind; summary: string; payload: Record<string, unknown> }): Promise<string> {
  const id = crypto.randomUUID(), timestamp = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_chat_proposals (id, conversation_id, message_id, kind, summary, payload_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, input.conversationId, input.messageId, input.kind, input.summary.slice(0, 500), JSON.stringify(input.payload), 'pending', timestamp, timestamp).run()
  return id
}

export async function setProposalStatus(db: D1Database, conversationId: string, proposalId: string, status: RecipeChatProposal['status'], result?: Record<string, unknown>): Promise<boolean> {
  const changed = await db.prepare("UPDATE recipe_chat_proposals SET status = ?, result_json = ?, updated_at = ? WHERE id = ? AND conversation_id = ? AND status = 'pending'").bind(status, result ? JSON.stringify(result) : null, new Date().toISOString(), proposalId, conversationId).run()
  return Boolean(changed.meta.changes)
}

export async function getProposalPayload(db: D1Database, conversationId: string, proposalId: string): Promise<{ kind: RecipeChatProposalKind; payload: Record<string, unknown> } | undefined> {
  const row = await db.prepare("SELECT kind, payload_json FROM recipe_chat_proposals WHERE id = ? AND conversation_id = ? AND status = 'pending'").bind(proposalId, conversationId).first<{ kind: RecipeChatProposalKind; payload_json: string }>()
  const payload = row && parseObject(row.payload_json)
  return row && payload ? { kind: row.kind, payload } : undefined
}
