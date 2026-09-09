import type { NormalizedManualRecipe, RecipeSource } from '../../src/domain/recipe/schema.js'
import type { RecipeSearchCriteria } from '../../src/domain/recipe/search.js'
import type { RecipeChatContext } from '../services/ai/recipe-chat.js'

export interface StoredRecipe extends NormalizedManualRecipe {
  id: string
  favorite: boolean
  graphicAvailable: boolean
  source: RecipeSource
  createdAt: string
  updatedAt: string
}

type RecipeRow = {
  id: string; title: string; description: string | null; servings: number | null
  prep_minutes: number | null; cook_minutes: number | null; total_minutes: number | null
  cuisine: string | null; category: string | null; notes: string | null; favorite: number
  source_type: 'manual' | 'url' | 'text' | 'pdf' | 'image'; source_url: string | null; source_name: string | null; source_r2_key: string | null; graphic_r2_key: string | null; graphic_generated_at: string | null; created_at: string; updated_at: string
}

function mapRecipe(row: RecipeRow): Omit<StoredRecipe, 'ingredients' | 'instructions' | 'tags'> {
  return {
    id: row.id, title: row.title, description: row.description ?? undefined, servings: row.servings ?? undefined,
    prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined,
    totalMinutes: row.total_minutes ?? undefined, cuisine: row.cuisine ?? undefined,
    category: row.category ?? undefined, notes: row.notes ?? undefined, favorite: row.favorite === 1,
    source: row.source_type === 'url' && row.source_url ? { type: 'url', originalUrl: row.source_url } : row.source_type === 'text' ? { type: 'text' } : row.source_type === 'pdf' && row.source_r2_key ? { type: 'pdf', r2ObjectKey: row.source_r2_key, sourceName: row.source_name ?? undefined } : row.source_type === 'image' && row.source_r2_key ? { type: 'image', r2ObjectKey: row.source_r2_key, sourceName: row.source_name ?? undefined } : { type: 'manual' }, graphicAvailable: Boolean(row.graphic_r2_key), createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

export async function createRecipe(db: D1Database, recipe: NormalizedManualRecipe, options: { source?: RecipeSource; favorite?: boolean; id?: string } = {}): Promise<StoredRecipe> {
  const id = options.id ?? crypto.randomUUID()
  const now = new Date().toISOString()
  const source = options.source ?? { type: 'manual' }
  const statements = [db.prepare(`INSERT INTO recipes (id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite, source_type, source_url, source_name, source_r2_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, recipe.title, recipe.description ?? null, recipe.servings ?? null, recipe.prepMinutes ?? null, recipe.cookMinutes ?? null, recipe.totalMinutes ?? null, recipe.cuisine ?? null, recipe.category ?? null, recipe.notes ?? null, options.favorite ? 1 : 0, source.type, source.type === 'url' ? source.originalUrl : null, source.type === 'pdf' || source.type === 'image' ? source.sourceName ?? null : null, source.type === 'pdf' || source.type === 'image' ? source.r2ObjectKey : null, now, now)]
  for (const ingredient of recipe.ingredients) statements.push(db.prepare(`INSERT INTO recipe_ingredients (id, recipe_id, position, original_text, quantity, quantity_text, unit, ingredient, preparation, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, ingredient.position, ingredient.originalText, ingredient.quantity ?? null, ingredient.quantityText ?? null, ingredient.unit ?? null, ingredient.ingredient ?? null, ingredient.preparation ?? null, ingredient.optional ? 1 : 0))
  for (const instruction of recipe.instructions) statements.push(db.prepare(`INSERT INTO recipe_instructions (id, recipe_id, step_number, text) VALUES (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, instruction.stepNumber, instruction.text))
  for (const tag of recipe.tags) statements.push(db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').bind(id, tag))
  await db.batch(statements)
  return (await getRecipe(db, id))!
}

export async function listRecipes(db: D1Database, criteria: RecipeSearchCriteria = {}): Promise<Array<Pick<StoredRecipe, 'id' | 'title' | 'favorite' | 'graphicAvailable' | 'prepMinutes' | 'cookMinutes' | 'category' | 'updatedAt'>>> {
  const clauses: string[] = []
  const values: Array<string | number> = []
  const match = (value: string) => `%${value}%`
  if (criteria.q) {
    const value = match(criteria.q)
    clauses.push(`(r.title LIKE ? COLLATE NOCASE OR r.cuisine LIKE ? COLLATE NOCASE OR r.category LIKE ? COLLATE NOCASE OR EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id AND (ri.original_text LIKE ? COLLATE NOCASE OR ri.ingredient LIKE ? COLLATE NOCASE)) OR EXISTS (SELECT 1 FROM recipe_tags rt WHERE rt.recipe_id = r.id AND rt.tag LIKE ? COLLATE NOCASE))`)
    values.push(value, value, value, value, value, value)
  }
  if (criteria.favorite !== undefined) { clauses.push('r.favorite = ?'); values.push(criteria.favorite ? 1 : 0) }
  if (criteria.tag) { clauses.push('EXISTS (SELECT 1 FROM recipe_tags rt WHERE rt.recipe_id = r.id AND rt.tag LIKE ? COLLATE NOCASE)'); values.push(match(criteria.tag)) }
  if (criteria.ingredient) { clauses.push('EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id AND (ri.original_text LIKE ? COLLATE NOCASE OR ri.ingredient LIKE ? COLLATE NOCASE))'); values.push(match(criteria.ingredient), match(criteria.ingredient)) }
  if (criteria.cuisine) { clauses.push('r.cuisine LIKE ? COLLATE NOCASE'); values.push(match(criteria.cuisine)) }
  if (criteria.category) { clauses.push('r.category LIKE ? COLLATE NOCASE'); values.push(match(criteria.category)) }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
  const { results } = await db.prepare(`SELECT r.id, r.title, r.favorite, r.graphic_r2_key, r.prep_minutes, r.cook_minutes, r.category, r.updated_at FROM recipes r${where} ORDER BY r.updated_at DESC`).bind(...values).all<{ id: string; title: string; favorite: number; graphic_r2_key: string | null; prep_minutes: number | null; cook_minutes: number | null; category: string | null; updated_at: string }>()
  return results.map((row) => ({ id: row.id, title: row.title, favorite: row.favorite === 1, graphicAvailable: Boolean(row.graphic_r2_key), prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined, category: row.category ?? undefined, updatedAt: row.updated_at }))
}

const chatStopWords = new Set(['a', 'an', 'and', 'are', 'at', 'be', 'best', 'can', 'do', 'for', 'from', 'get', 'give', 'have', 'i', 'in', 'is', 'it', 'list', 'me', 'my', 'of', 'or', 'recipe', 'recipes', 'show', 'that', 'the', 'to', 'use', 'uses', 'using', 'what', 'which', 'with'])
const MAX_CHAT_TERMS = 8
const MAX_CHAT_CANDIDATES = 12
const cap = (value: string | undefined, length: number): string | undefined => value ? value.slice(0, length) : undefined
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&')
type ChatQuery = { terms: string[]; excluded?: string; maxMinutes?: number; inclusive?: boolean; clarification?: string }
export const parseRecipeChatQuery = (question: string): ChatQuery => {
  const lower = question.toLowerCase()
  if (/\b(?:make|create|generate|write)\b.{0,32}\b(?:new\s+)?recipe\b/.test(lower)) return { terms: [], clarification: 'Recipe Chat can search and compare saved recipes, but it cannot create new recipes.' }
  const time = lower.match(/\b(under|less than|at most|no more than)\s+(\d{1,3})\s*(?:minutes?|mins?)\b|\b(\d{1,3})\s*(?:minutes?|mins?)\s+or\s+less\b/)
  if (!time && /\b(?:fast|quick|easy|healthy)\b/.test(lower)) return { terms: [], clarification: 'Try a supported time limit such as “under 30 minutes” or “30 minutes or less.”' }
  const maxMinutes = time ? Number(time[2] ?? time[3]) : undefined
  const inclusive = Boolean(time && (time[1] === 'at most' || time[1] === 'no more than' || time[3]))
  const exclusion = lower.match(/\b(?:without|no)\s+([a-z][a-z -]{1,48}?)(?=\s+(?:under|less than|at most|no more than)\s+\d|[?.!,]|$)/)
  const excluded = exclusion?.[1]?.trim()
  const stripped = lower.replace(time?.[0] ?? '', ' ').replace(exclusion?.[0] ?? '', ' ')
  const terms = [...new Set((stripped.match(/[a-z0-9][a-z0-9'-]*/g) ?? []).filter((term) => term.length > 1 && !chatStopWords.has(term)))].slice(0, MAX_CHAT_TERMS)
  return { terms, excluded, maxMinutes, inclusive }
}

type ChatRow = Pick<RecipeRow, 'id' | 'title' | 'description' | 'servings' | 'prep_minutes' | 'cook_minutes' | 'total_minutes' | 'cuisine' | 'category' | 'notes' | 'favorite'>

const effectiveMinutes = (row: ChatRow) => row.total_minutes ?? (row.prep_minutes !== null && row.cook_minutes !== null ? row.prep_minutes + row.cook_minutes : undefined)

async function hydrateRecipeChatContext(db: D1Database, rows: ChatRow[]): Promise<RecipeChatContext[]> {
  if (!rows.length) return []
  const placeholders = rows.map(() => '?').join(',')
  const ids = rows.map((row) => row.id)
  const [ingredients, instructions, tags] = await Promise.all([
    db.prepare(`SELECT recipe_id, original_text, position FROM recipe_ingredients WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, position`).bind(...ids).all<{ recipe_id: string; original_text: string }>(),
    db.prepare(`SELECT recipe_id, text, step_number FROM recipe_instructions WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, step_number`).bind(...ids).all<{ recipe_id: string; text: string }>(),
    db.prepare(`SELECT recipe_id, tag FROM recipe_tags WHERE recipe_id IN (${placeholders}) ORDER BY recipe_id, tag COLLATE NOCASE`).bind(...ids).all<{ recipe_id: string; tag: string }>(),
  ])
  const group = <T extends { recipe_id: string }>(items: T[]) => items.reduce((map, item) => { (map.get(item.recipe_id) ?? map.set(item.recipe_id, []).get(item.recipe_id)!).push(item); return map }, new Map<string, T[]>())
  const ingredientMap = group(ingredients.results), instructionMap = group(instructions.results), tagMap = group(tags.results)
  return rows.map((row) => ({ id: row.id, title: cap(row.title, 180) ?? 'Untitled recipe', description: cap(row.description ?? undefined, 500), cuisine: cap(row.cuisine ?? undefined, 100), category: cap(row.category ?? undefined, 100), tags: (tagMap.get(row.id) ?? []).slice(0, 12).map((tag) => tag.tag.slice(0, 80)), notes: cap(row.notes ?? undefined, 700), ingredients: (ingredientMap.get(row.id) ?? []).slice(0, 30).map((item) => item.original_text.slice(0, 240)), instructions: (instructionMap.get(row.id) ?? []).slice(0, 16).map((item) => item.text.slice(0, 360)), servings: row.servings ?? undefined, prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined, totalMinutes: effectiveMinutes(row), favorite: row.favorite === 1 }))
}

export async function listRecipeChatContext(db: D1Database, question: string): Promise<RecipeChatContext[]> {
  const query = parseRecipeChatQuery(question)
  if (query.clarification || (!query.terms.length && query.maxMinutes === undefined && !query.excluded)) return []
  const clauses: string[] = []
  const values: Array<string | number> = []
  const scores: string[] = []
  for (const term of query.terms) {
    const value = `%${escapeLike(term)}%`
    clauses.push(`(r.title LIKE ? ESCAPE '\\' COLLATE NOCASE OR r.description LIKE ? ESCAPE '\\' COLLATE NOCASE OR r.cuisine LIKE ? ESCAPE '\\' COLLATE NOCASE OR r.category LIKE ? ESCAPE '\\' COLLATE NOCASE OR r.notes LIKE ? ESCAPE '\\' COLLATE NOCASE OR EXISTS (SELECT 1 FROM recipe_tags rt WHERE rt.recipe_id = r.id AND rt.tag LIKE ? ESCAPE '\\' COLLATE NOCASE) OR EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id AND (ri.original_text LIKE ? ESCAPE '\\' COLLATE NOCASE OR ri.ingredient LIKE ? ESCAPE '\\' COLLATE NOCASE)) OR EXISTS (SELECT 1 FROM recipe_instructions rs WHERE rs.recipe_id = r.id AND rs.text LIKE ? ESCAPE '\\' COLLATE NOCASE))`)
    values.push(value, value, value, value, value, value, value, value, value)
    scores.push(`CASE WHEN r.title LIKE ? ESCAPE '\\' COLLATE NOCASE THEN 4 WHEN EXISTS (SELECT 1 FROM recipe_ingredients sri WHERE sri.recipe_id=r.id AND (sri.original_text LIKE ? ESCAPE '\\' COLLATE NOCASE OR sri.ingredient LIKE ? ESCAPE '\\' COLLATE NOCASE)) THEN 3 WHEN r.description LIKE ? ESCAPE '\\' COLLATE NOCASE THEN 1 ELSE 0 END`)
  }
  const where = clauses.length ? `(${clauses.join(' OR ')})` : '1=1'
  if (query.excluded) { const value = `%${escapeLike(query.excluded)}%`; values.push(value, value); }
  const excludedClause = query.excluded ? ` AND NOT EXISTS (SELECT 1 FROM recipe_ingredients ex WHERE ex.recipe_id=r.id AND (ex.original_text LIKE ? ESCAPE '\\' COLLATE NOCASE OR ex.ingredient LIKE ? ESCAPE '\\' COLLATE NOCASE))` : ''
  const durationClause = query.maxMinutes === undefined ? '' : ` AND COALESCE(r.total_minutes, CASE WHEN r.prep_minutes IS NOT NULL AND r.cook_minutes IS NOT NULL THEN r.prep_minutes + r.cook_minutes END) ${query.inclusive ? '<=' : '<'} ?`
  if (query.maxMinutes !== undefined) values.push(query.maxMinutes)
  const scoreValues = query.terms.flatMap((term) => { const value = `%${escapeLike(term)}%`; return [value, value, value, value] })
  const relevanceOrder = scores.length ? `(${scores.join(' + ')}) DESC, ` : ''
  const { results } = await db.prepare(`SELECT r.id, r.title, r.description, r.servings, r.prep_minutes, r.cook_minutes, r.total_minutes, r.cuisine, r.category, r.notes, r.favorite FROM recipes r WHERE ${where}${excludedClause}${durationClause} ORDER BY ${relevanceOrder}r.title COLLATE NOCASE, r.id LIMIT ${MAX_CHAT_CANDIDATES + 1}`).bind(...values, ...scoreValues).all<ChatRow>()
  const rows = results.slice(0, MAX_CHAT_CANDIDATES)
  return hydrateRecipeChatContext(db, rows)
}

/** Re-reads cited recipes for a transient follow-up; never trusts client-provided titles or fields. */
export async function listRecipeChatContextByIds(db: D1Database, ids: string[]): Promise<RecipeChatContext[]> {
  const unique = [...new Set(ids)].slice(0, MAX_CHAT_CANDIDATES)
  if (!unique.length) return []
  const placeholders = unique.map(() => '?').join(',')
  const { results } = await db.prepare(`SELECT id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite FROM recipes WHERE id IN (${placeholders})`).bind(...unique).all<ChatRow>()
  const byId = new Map(results.map((row) => [row.id, row]))
  return hydrateRecipeChatContext(db, unique.flatMap((id) => byId.get(id) ?? []))
}

export async function getRecipe(db: D1Database, id: string): Promise<StoredRecipe | undefined> {
  const row = await db.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first<RecipeRow>()
  if (!row) return undefined
  const [ingredients, instructions, tags] = await Promise.all([
    db.prepare('SELECT id, original_text, quantity, quantity_text, unit, ingredient, preparation, optional, position FROM recipe_ingredients WHERE recipe_id = ? ORDER BY position').bind(id).all<Record<string, unknown>>(),
    db.prepare('SELECT id, step_number, text FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number').bind(id).all<Record<string, unknown>>(),
    db.prepare('SELECT tag FROM recipe_tags WHERE recipe_id = ? ORDER BY tag COLLATE NOCASE').bind(id).all<{ tag: string }>(),
  ])
  return {
    ...mapRecipe(row),
    ingredients: ingredients.results.map((item) => ({ id: String(item.id), position: Number(item.position), originalText: String(item.original_text), quantity: item.quantity as number | undefined, quantityText: item.quantity_text as string | undefined, unit: item.unit as string | undefined, ingredient: item.ingredient as string | undefined, preparation: item.preparation as string | undefined, optional: item.optional === 1 })),
    instructions: instructions.results.map((item) => ({ id: String(item.id), stepNumber: Number(item.step_number), text: String(item.text) })),
    tags: tags.results.map((item) => item.tag),
  }
}

export async function getRecipeGraphicKey(db: D1Database, id: string): Promise<string | undefined> {
  const row = await db.prepare('SELECT graphic_r2_key FROM recipes WHERE id = ?').bind(id).first<{ graphic_r2_key: string | null }>()
  return row?.graphic_r2_key ?? undefined
}

export async function setRecipeGraphicKey(db: D1Database, id: string, key: string): Promise<void> {
  await db.prepare('UPDATE recipes SET graphic_r2_key = ?, graphic_generated_at = ?, updated_at = ? WHERE id = ?').bind(key, new Date().toISOString(), new Date().toISOString(), id).run()
}

function childStatements(db: D1Database, id: string, recipe: NormalizedManualRecipe): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').bind(id),
    db.prepare('DELETE FROM recipe_instructions WHERE recipe_id = ?').bind(id),
    db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').bind(id),
  ]
  for (const ingredient of recipe.ingredients) statements.push(db.prepare(`INSERT INTO recipe_ingredients (id, recipe_id, position, original_text, quantity, quantity_text, unit, ingredient, preparation, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, ingredient.position, ingredient.originalText, ingredient.quantity ?? null, ingredient.quantityText ?? null, ingredient.unit ?? null, ingredient.ingredient ?? null, ingredient.preparation ?? null, ingredient.optional ? 1 : 0))
  for (const instruction of recipe.instructions) statements.push(db.prepare('INSERT INTO recipe_instructions (id, recipe_id, step_number, text) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), id, instruction.stepNumber, instruction.text))
  for (const tag of recipe.tags) statements.push(db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').bind(id, tag))
  return statements
}

export async function updateRecipe(db: D1Database, id: string, recipe: NormalizedManualRecipe): Promise<StoredRecipe | undefined> {
  if (!(await getRecipe(db, id))) return undefined
  const now = new Date().toISOString()
  await db.batch([
    db.prepare(`UPDATE recipes SET title=?, description=?, servings=?, prep_minutes=?, cook_minutes=?, total_minutes=?, cuisine=?, category=?, notes=?, updated_at=? WHERE id=?`).bind(recipe.title, recipe.description ?? null, recipe.servings ?? null, recipe.prepMinutes ?? null, recipe.cookMinutes ?? null, recipe.totalMinutes ?? null, recipe.cuisine ?? null, recipe.category ?? null, recipe.notes ?? null, now, id),
    ...childStatements(db, id, recipe),
  ])
  return getRecipe(db, id)
}

export async function setFavorite(db: D1Database, id: string, favorite: boolean): Promise<StoredRecipe | undefined> {
  const result = await db.prepare('UPDATE recipes SET favorite = ?, updated_at = ? WHERE id = ?').bind(favorite ? 1 : 0, new Date().toISOString(), id).run()
  return result.meta.changes ? getRecipe(db, id) : undefined
}

export async function deleteRecipe(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM recipes WHERE id = ?').bind(id).run()
  return Boolean(result.meta.changes)
}
