import { normalizeManualRecipe } from '../../src/domain/recipe/validation.js'
import { normalizeWeekStart, validDayIndex } from '../../src/domain/meal-plan/schema.js'
import { assignDinner, generateGroceryList, getMealPlanWeek } from '../repositories/meal-plans.js'
import { createRecipe, getRecipe } from '../repositories/recipes.js'
import { getProposalPayload, setProposalStatus } from '../repositories/recipe-chat-conversations.js'

export async function cancelRecipeChatProposal(db: D1Database, conversationId: string, proposalId: string): Promise<'cancelled' | 'missing'> {
  return await setProposalStatus(db, conversationId, proposalId, 'cancelled') ? 'cancelled' : 'missing'
}

export async function applyRecipeChatProposal(db: D1Database, conversationId: string, proposalId: string): Promise<'missing' | 'stale' | Record<string, unknown>> {
  const proposal = await getProposalPayload(db, conversationId, proposalId)
  if (!proposal) return 'missing'
  try {
    if (proposal.kind === 'recipe_variation') {
      const sourceId = typeof proposal.payload.sourceRecipeId === 'string' ? proposal.payload.sourceRecipeId : ''
      const sourceUpdatedAt = typeof proposal.payload.sourceUpdatedAt === 'string' ? proposal.payload.sourceUpdatedAt : ''
      const source = await getRecipe(db, sourceId)
      if (!source || source.updatedAt !== sourceUpdatedAt) { await setProposalStatus(db, conversationId, proposalId, 'stale'); return 'stale' }
      const recipe = normalizeManualRecipe(proposal.payload.recipe as never)
      const created = await createRecipe(db, recipe)
      await db.prepare('INSERT INTO recipe_variations (recipe_id, source_recipe_id, conversation_id, created_at) VALUES (?, ?, ?, ?)').bind(created.id, source.id, conversationId, new Date().toISOString()).run()
      const result = { recipeId: created.id, title: created.title }
      await setProposalStatus(db, conversationId, proposalId, 'applied', result)
      return result
    }
    const weekStart = normalizeWeekStart(String(proposal.payload.weekStart ?? ''))
    const expectedRevision = Number(proposal.payload.expectedRevision)
    const current = await getMealPlanWeek(db, weekStart)
    if (!Number.isInteger(expectedRevision) || current.planRevision !== expectedRevision) { await setProposalStatus(db, conversationId, proposalId, 'stale'); return 'stale' }
    if (proposal.kind === 'meal_plan') {
      const dayIndex = validDayIndex(String(proposal.payload.dayIndex))
      const recipeId = String(proposal.payload.recipeId ?? '')
      const week = await assignDinner(db, weekStart, dayIndex, recipeId)
      if (week === 'missing_recipe') { await setProposalStatus(db, conversationId, proposalId, 'stale'); return 'stale' }
      const result = { weekStart, dayIndex, recipeId }
      await setProposalStatus(db, conversationId, proposalId, 'applied', result)
      return result
    }
    const generated = await generateGroceryList(db, weekStart)
    const excluded = Array.isArray(proposal.payload.excludedItems) ? proposal.payload.excludedItems.filter((item): item is string => typeof item === 'string').map((item) => item.toLowerCase()) : []
    for (const item of generated.groceryItems) if (excluded.some((value) => item.displayText.toLowerCase().includes(value))) await db.prepare('DELETE FROM grocery_list_items WHERE id = ? AND week_start = ?').bind(item.id, weekStart).run()
    const result = { weekStart, excludedItems: excluded }
    await setProposalStatus(db, conversationId, proposalId, 'applied', result)
    return result
  } catch {
    await setProposalStatus(db, conversationId, proposalId, 'failed')
    throw new Error('PROPOSAL_FAILED')
  }
}
