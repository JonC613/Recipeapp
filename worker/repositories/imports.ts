import type { RecipeDraft, RecipeImport, RecipeImportFailureCode } from '../../src/domain/recipe/imports.js'
import type { NormalizedManualRecipe } from '../../src/domain/recipe/schema.js'
import { createRecipe, type StoredRecipe } from './recipes.js'

type ImportRow = { id: string; source_type: 'url' | 'text'; source_url: string | null; raw_text: string | null; parsed_recipe_json: string | null; status: 'ready' | 'failed' | 'no_recipe'; failure_code: RecipeImportFailureCode | null; approved_recipe_id: string | null; created_at: string }

export async function createReadyImport(db: D1Database, sourceUrl: string, draft: RecipeDraft): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_url, parsed_recipe_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'url', sourceUrl, JSON.stringify(draft), 'ready', createdAt).run()
  return (await getImport(db, id))!
}
export async function createTextReadyImport(db: D1Database, sourceText: string, draft: RecipeDraft): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, raw_text, parsed_recipe_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'text', sourceText, JSON.stringify(draft), 'ready', createdAt).run()
  return (await getImport(db, id))!
}

export async function createFailedImport(
  db: D1Database,
  sourceUrl: string,
  status: Extract<RecipeImport['status'], 'failed' | 'no_recipe'>,
  failureCode: NonNullable<RecipeImport['failureCode']>,
): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_url, status, failure_code, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, 'url', sourceUrl, status, failureCode, createdAt).run()
  return (await getImport(db, id))!
}
export async function createTextFailedImport(db: D1Database, sourceText: string, status: Extract<RecipeImport['status'], 'failed' | 'no_recipe'>, failureCode: Exclude<RecipeImportFailureCode, 'INVALID_URL'>): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, raw_text, status, failure_code, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'text', sourceText, status, failureCode, createdAt).run()
  return (await getImport(db, id))!
}

export async function getImport(db: D1Database, id: string): Promise<RecipeImport | undefined> {
  const row = await db.prepare('SELECT id, source_type, source_url, raw_text, parsed_recipe_json, status, failure_code, approved_recipe_id, created_at FROM recipe_imports WHERE id = ?').bind(id).first<ImportRow>()
  if (!row) return undefined
  return { id: row.id, sourceType: row.source_type, sourceUrl: row.source_url ?? undefined, sourceText: row.raw_text ?? undefined, status: row.status, draft: row.parsed_recipe_json ? JSON.parse(row.parsed_recipe_json) as RecipeDraft : undefined, failureCode: row.failure_code ?? undefined, approvedRecipeId: row.approved_recipe_id ?? undefined, createdAt: row.created_at }
}

export async function approveImport(db: D1Database, importId: string, recipe: NormalizedManualRecipe, favorite: boolean): Promise<{ recipe?: StoredRecipe; reason: 'missing' | 'not_ready' | 'already_approved' | 'approved' }> {
  const imported = await getImport(db, importId)
  if (!imported) return { reason: 'missing' }
  if (imported.status !== 'ready' || !imported.draft) return { reason: 'not_ready' }
  if (imported.approvedRecipeId) return { reason: 'already_approved' }
  const recipeId = crypto.randomUUID()
  const claimed = await db.prepare("UPDATE recipe_imports SET approved_recipe_id = ? WHERE id = ? AND status = 'ready' AND approved_recipe_id IS NULL").bind(recipeId, importId).run()
  if (!claimed.meta.changes) return { reason: 'already_approved' }
  const source = imported.sourceType === 'url' && imported.sourceUrl ? { type: 'url' as const, originalUrl: imported.sourceUrl } : { type: 'text' as const }
  try { return { recipe: await createRecipe(db, recipe, { id: recipeId, favorite, source }), reason: 'approved' } }
  catch (error) { await db.prepare('UPDATE recipe_imports SET approved_recipe_id = NULL WHERE id = ? AND approved_recipe_id = ?').bind(importId, recipeId).run(); throw error }
}
