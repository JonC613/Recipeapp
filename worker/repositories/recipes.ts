import type { NormalizedManualRecipe, RecipeSource } from '../../src/domain/recipe/schema.js'
import type { RecipeSearchCriteria } from '../../src/domain/recipe/search.js'

export interface StoredRecipe extends NormalizedManualRecipe {
  id: string
  favorite: boolean
  source: RecipeSource
  createdAt: string
  updatedAt: string
}

type RecipeRow = {
  id: string; title: string; description: string | null; servings: number | null
  prep_minutes: number | null; cook_minutes: number | null; total_minutes: number | null
  cuisine: string | null; category: string | null; notes: string | null; favorite: number
  source_type: 'manual' | 'url' | 'text' | 'pdf'; source_url: string | null; source_name: string | null; source_r2_key: string | null; created_at: string; updated_at: string
}

function mapRecipe(row: RecipeRow): Omit<StoredRecipe, 'ingredients' | 'instructions' | 'tags'> {
  return {
    id: row.id, title: row.title, description: row.description ?? undefined, servings: row.servings ?? undefined,
    prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined,
    totalMinutes: row.total_minutes ?? undefined, cuisine: row.cuisine ?? undefined,
    category: row.category ?? undefined, notes: row.notes ?? undefined, favorite: row.favorite === 1,
    source: row.source_type === 'url' && row.source_url ? { type: 'url', originalUrl: row.source_url } : row.source_type === 'text' ? { type: 'text' } : row.source_type === 'pdf' && row.source_r2_key ? { type: 'pdf', r2ObjectKey: row.source_r2_key, sourceName: row.source_name ?? undefined } : { type: 'manual' }, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

export async function createRecipe(db: D1Database, recipe: NormalizedManualRecipe, options: { source?: RecipeSource; favorite?: boolean; id?: string } = {}): Promise<StoredRecipe> {
  const id = options.id ?? crypto.randomUUID()
  const now = new Date().toISOString()
  const source = options.source ?? { type: 'manual' }
  const statements = [db.prepare(`INSERT INTO recipes (id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite, source_type, source_url, source_name, source_r2_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, recipe.title, recipe.description ?? null, recipe.servings ?? null, recipe.prepMinutes ?? null, recipe.cookMinutes ?? null, recipe.totalMinutes ?? null, recipe.cuisine ?? null, recipe.category ?? null, recipe.notes ?? null, options.favorite ? 1 : 0, source.type, source.type === 'url' ? source.originalUrl : null, source.type === 'pdf' ? source.sourceName ?? null : null, source.type === 'pdf' ? source.r2ObjectKey : null, now, now)]
  for (const ingredient of recipe.ingredients) statements.push(db.prepare(`INSERT INTO recipe_ingredients (id, recipe_id, position, original_text, quantity, quantity_text, unit, ingredient, preparation, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, ingredient.position, ingredient.originalText, ingredient.quantity ?? null, ingredient.quantityText ?? null, ingredient.unit ?? null, ingredient.ingredient ?? null, ingredient.preparation ?? null, ingredient.optional ? 1 : 0))
  for (const instruction of recipe.instructions) statements.push(db.prepare(`INSERT INTO recipe_instructions (id, recipe_id, step_number, text) VALUES (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, instruction.stepNumber, instruction.text))
  for (const tag of recipe.tags) statements.push(db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').bind(id, tag))
  await db.batch(statements)
  return (await getRecipe(db, id))!
}

export async function listRecipes(db: D1Database, criteria: RecipeSearchCriteria = {}): Promise<Array<Pick<StoredRecipe, 'id' | 'title' | 'favorite' | 'prepMinutes' | 'cookMinutes' | 'category' | 'updatedAt'>>> {
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
  const { results } = await db.prepare(`SELECT r.id, r.title, r.favorite, r.prep_minutes, r.cook_minutes, r.category, r.updated_at FROM recipes r${where} ORDER BY r.updated_at DESC`).bind(...values).all<{ id: string; title: string; favorite: number; prep_minutes: number | null; cook_minutes: number | null; category: string | null; updated_at: string }>()
  return results.map((row) => ({ id: row.id, title: row.title, favorite: row.favorite === 1, prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined, category: row.category ?? undefined, updatedAt: row.updated_at }))
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
