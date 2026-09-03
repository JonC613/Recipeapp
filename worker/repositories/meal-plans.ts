import { classifyGroceryItem, normalizedIngredientKey, type GroceryListItem, type GrocerySection, type MealPlanWeek } from '../../src/domain/meal-plan/schema.js'

type WeekRow = { week_start: string; plan_revision: number; grocery_generated_revision: number | null }
type DinnerRow = { day_index: number; recipe_id: string; title: string }
type ItemRow = { id: string; display_text: string; section: GrocerySection; checked: number; is_custom: number; occurrence_count: number; contributor_titles_json: string }
type IngredientRow = { original_text: string; title: string }

const now = () => new Date().toISOString()

async function ensureWeek(db: D1Database, weekStart: string): Promise<void> {
  const timestamp = now()
  await db.prepare('INSERT OR IGNORE INTO meal_plan_weeks (week_start, created_at, updated_at) VALUES (?, ?, ?)').bind(weekStart, timestamp, timestamp).run()
}

function mapItem(row: ItemRow): GroceryListItem {
  let contributorTitles: string[] = []
  try { contributorTitles = JSON.parse(row.contributor_titles_json) as string[] } catch { contributorTitles = [] }
  return { id: row.id, displayText: row.display_text, section: row.section, checked: row.checked === 1, custom: row.is_custom === 1, occurrenceCount: row.occurrence_count, contributorTitles }
}

export async function getMealPlanWeek(db: D1Database, weekStart: string): Promise<MealPlanWeek> {
  const week = await db.prepare('SELECT week_start, plan_revision, grocery_generated_revision FROM meal_plan_weeks WHERE week_start = ?').bind(weekStart).first<WeekRow>()
  if (!week) return { weekStart, planRevision: 0, groceryListStale: false, dinners: [], groceryItems: [] }
  const [dinnerResult, itemResult] = await Promise.all([
    db.prepare('SELECT e.day_index, e.recipe_id, r.title FROM meal_plan_entries e JOIN recipes r ON r.id = e.recipe_id WHERE e.week_start = ? ORDER BY e.day_index').bind(weekStart).all<DinnerRow>(),
    db.prepare('SELECT id, display_text, section, checked, is_custom, occurrence_count, contributor_titles_json FROM grocery_list_items WHERE week_start = ? ORDER BY section, is_custom, display_text COLLATE NOCASE').bind(weekStart).all<ItemRow>(),
  ])
  return {
    weekStart,
    planRevision: week.plan_revision,
    groceryGeneratedRevision: week.grocery_generated_revision ?? undefined,
    groceryListStale: week.grocery_generated_revision !== null && week.grocery_generated_revision !== week.plan_revision,
    dinners: dinnerResult.results.map((row) => ({ dayIndex: row.day_index, recipe: { id: row.recipe_id, title: row.title } })),
    groceryItems: itemResult.results.map(mapItem),
  }
}

export async function assignDinner(db: D1Database, weekStart: string, dayIndex: number, recipeId: string): Promise<'missing_recipe' | MealPlanWeek> {
  const recipe = await db.prepare('SELECT id FROM recipes WHERE id = ?').bind(recipeId).first<{ id: string }>()
  if (!recipe) return 'missing_recipe'
  await ensureWeek(db, weekStart)
  const timestamp = now()
  await db.prepare(`INSERT INTO meal_plan_entries (week_start, day_index, recipe_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(week_start, day_index) DO UPDATE SET recipe_id = excluded.recipe_id, updated_at = excluded.updated_at`).bind(weekStart, dayIndex, recipeId, timestamp, timestamp).run()
  return getMealPlanWeek(db, weekStart)
}

export async function removeDinner(db: D1Database, weekStart: string, dayIndex: number): Promise<MealPlanWeek> {
  await ensureWeek(db, weekStart)
  await db.prepare('DELETE FROM meal_plan_entries WHERE week_start = ? AND day_index = ?').bind(weekStart, dayIndex).run()
  return getMealPlanWeek(db, weekStart)
}

type GroupedIngredient = { displayText: string; section: GrocerySection; occurrenceCount: number; contributorTitles: string[] }

async function groupedIngredients(db: D1Database, weekStart: string): Promise<Map<string, GroupedIngredient>> {
  const { results } = await db.prepare(`SELECT ri.original_text, r.title FROM meal_plan_entries e
    JOIN recipes r ON r.id = e.recipe_id JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    WHERE e.week_start = ? ORDER BY e.day_index, ri.position`).bind(weekStart).all<IngredientRow>()
  const groups = new Map<string, GroupedIngredient>()
  for (const row of results) {
    const key = normalizedIngredientKey(row.original_text)
    if (!key) continue
    const existing = groups.get(key)
    if (existing) {
      existing.occurrenceCount += 1
      if (!existing.contributorTitles.includes(row.title)) existing.contributorTitles.push(row.title)
    } else groups.set(key, { displayText: row.original_text.trim().replace(/\s+/g, ' '), section: classifyGroceryItem(row.original_text), occurrenceCount: 1, contributorTitles: [row.title] })
  }
  return groups
}

export async function generateGroceryList(db: D1Database, weekStart: string): Promise<MealPlanWeek> {
  await ensureWeek(db, weekStart)
  const week = (await db.prepare('SELECT week_start, plan_revision, grocery_generated_revision FROM meal_plan_weeks WHERE week_start = ?').bind(weekStart).first<WeekRow>())!
  const [groups, existingResult] = await Promise.all([
    groupedIngredients(db, weekStart),
    db.prepare('SELECT normalized_key, checked FROM grocery_list_items WHERE week_start = ? AND is_custom = 0').bind(weekStart).all<{ normalized_key: string; checked: number }>(),
  ])
  const checkedByKey = new Map(existingResult.results.map((row) => [row.normalized_key, row.checked]))
  const timestamp = now()
  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM grocery_list_items WHERE week_start = ? AND is_custom = 0').bind(weekStart),
    db.prepare('UPDATE meal_plan_weeks SET grocery_generated_revision = ?, updated_at = ? WHERE week_start = ?').bind(week.plan_revision, timestamp, weekStart),
  ]
  for (const [key, item] of groups) statements.push(db.prepare(`INSERT INTO grocery_list_items (id, week_start, display_text, normalized_key, section, checked, is_custom, occurrence_count, contributor_titles_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`).bind(crypto.randomUUID(), weekStart, item.displayText, key, item.section, checkedByKey.get(key) ?? 0, item.occurrenceCount, JSON.stringify(item.contributorTitles), timestamp, timestamp))
  await db.batch(statements)
  return getMealPlanWeek(db, weekStart)
}

export async function addCustomGroceryItem(db: D1Database, weekStart: string, displayText: string): Promise<MealPlanWeek> {
  const trimmed = displayText.trim().replace(/\s+/g, ' ')
  if (!trimmed) throw new Error('item must not be blank')
  await ensureWeek(db, weekStart)
  const week = (await db.prepare('SELECT plan_revision FROM meal_plan_weeks WHERE week_start = ?').bind(weekStart).first<{ plan_revision: number }>())!
  const timestamp = now()
  await db.batch([
    db.prepare(`INSERT INTO grocery_list_items (id, week_start, display_text, normalized_key, section, checked, is_custom, occurrence_count, contributor_titles_json, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, 0, 1, 1, '[]', ?, ?)`).bind(crypto.randomUUID(), weekStart, trimmed, classifyGroceryItem(trimmed), timestamp, timestamp),
    db.prepare('UPDATE meal_plan_weeks SET grocery_generated_revision = COALESCE(grocery_generated_revision, ?), updated_at = ? WHERE week_start = ?').bind(week.plan_revision, timestamp, weekStart),
  ])
  return getMealPlanWeek(db, weekStart)
}

export async function setGroceryItemChecked(db: D1Database, weekStart: string, itemId: string, checked: boolean): Promise<'missing_item' | MealPlanWeek> {
  const result = await db.prepare('UPDATE grocery_list_items SET checked = ?, updated_at = ? WHERE id = ? AND week_start = ?').bind(checked ? 1 : 0, now(), itemId, weekStart).run()
  return result.meta.changes ? getMealPlanWeek(db, weekStart) : 'missing_item'
}

export async function removeGroceryItem(db: D1Database, weekStart: string, itemId: string): Promise<'missing_item' | MealPlanWeek> {
  const result = await db.prepare('DELETE FROM grocery_list_items WHERE id = ? AND week_start = ?').bind(itemId, weekStart).run()
  return result.meta.changes ? getMealPlanWeek(db, weekStart) : 'missing_item'
}
