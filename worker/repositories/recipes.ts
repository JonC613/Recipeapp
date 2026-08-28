import type { NormalizedManualRecipe } from '../../src/domain/recipe/schema.js'

export interface StoredRecipe extends NormalizedManualRecipe {
  id: string
  favorite: boolean
  source: { type: 'manual' }
  createdAt: string
  updatedAt: string
}

type RecipeRow = {
  id: string; title: string; description: string | null; servings: number | null
  prep_minutes: number | null; cook_minutes: number | null; total_minutes: number | null
  cuisine: string | null; category: string | null; notes: string | null; favorite: number
  created_at: string; updated_at: string
}

function mapRecipe(row: RecipeRow): Omit<StoredRecipe, 'ingredients' | 'instructions' | 'tags'> {
  return {
    id: row.id, title: row.title, description: row.description ?? undefined, servings: row.servings ?? undefined,
    prepMinutes: row.prep_minutes ?? undefined, cookMinutes: row.cook_minutes ?? undefined,
    totalMinutes: row.total_minutes ?? undefined, cuisine: row.cuisine ?? undefined,
    category: row.category ?? undefined, notes: row.notes ?? undefined, favorite: row.favorite === 1,
    source: { type: 'manual' }, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

export async function createRecipe(db: D1Database, recipe: NormalizedManualRecipe): Promise<StoredRecipe> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const statements = [db.prepare(`INSERT INTO recipes (id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite, source_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'manual', ?, ?)`)
    .bind(id, recipe.title, recipe.description ?? null, recipe.servings ?? null, recipe.prepMinutes ?? null, recipe.cookMinutes ?? null, recipe.totalMinutes ?? null, recipe.cuisine ?? null, recipe.category ?? null, recipe.notes ?? null, now, now)]
  for (const ingredient of recipe.ingredients) statements.push(db.prepare(`INSERT INTO recipe_ingredients (id, recipe_id, position, original_text, quantity, quantity_text, unit, ingredient, preparation, optional) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, ingredient.position, ingredient.originalText, ingredient.quantity ?? null, ingredient.quantityText ?? null, ingredient.unit ?? null, ingredient.ingredient ?? null, ingredient.preparation ?? null, ingredient.optional ? 1 : 0))
  for (const instruction of recipe.instructions) statements.push(db.prepare(`INSERT INTO recipe_instructions (id, recipe_id, step_number, text) VALUES (?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, instruction.stepNumber, instruction.text))
  for (const tag of recipe.tags) statements.push(db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').bind(id, tag))
  await db.batch(statements)
  return (await getRecipe(db, id))!
}

export async function listRecipes(db: D1Database, titleQuery?: string): Promise<Array<Pick<StoredRecipe, 'id' | 'title' | 'favorite' | 'prepMinutes' | 'cookMinutes' | 'category' | 'updatedAt'>>> {
  const statement = titleQuery
    ? db.prepare('SELECT id, title, favorite, prep_minutes, cook_minutes, category, updated_at FROM recipes WHERE title LIKE ? COLLATE NOCASE ORDER BY updated_at DESC').bind(`%${titleQuery}%`)
    : db.prepare('SELECT id, title, favorite, prep_minutes, cook_minutes, category, updated_at FROM recipes ORDER BY updated_at DESC')
  const { results } = await statement.all<RecipeRow>()
  return results.map((row) => {
    const recipe = mapRecipe(row)
    return { id: recipe.id, title: recipe.title, favorite: recipe.favorite, prepMinutes: recipe.prepMinutes, cookMinutes: recipe.cookMinutes, category: recipe.category, updatedAt: recipe.updatedAt }
  })
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
