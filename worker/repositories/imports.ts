import type { RecipeDraft, RecipeImport, RecipeImportFailureCode } from '../../src/domain/recipe/imports.js'
import type { NormalizedManualRecipe } from '../../src/domain/recipe/schema.js'
import { createRecipe, type StoredRecipe } from './recipes.js'

type ImportRow = { id: string; source_type: 'url' | 'text' | 'pdf' | 'image' | 'mealdb'; source_url: string | null; source_r2_key: string | null; source_name: string | null; raw_text: string | null; parsed_recipe_json: string | null; status: RecipeImport['status']; failure_code: RecipeImportFailureCode | null; ocr_status: RecipeImport['ocrStatus'] | null; ocr_attempted_at: string | null; ocr_failure_code: RecipeImportFailureCode | null; vision_status: RecipeImport['visionStatus'] | null; vision_attempted_at: string | null; vision_failure_code: RecipeImportFailureCode | null; extraction_method: RecipeImport['extractionMethod'] | null; approved_recipe_id: string | null; created_at: string }

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
export async function createPdfReadyImport(db: D1Database, sourceR2Key: string, sourceName: string | undefined, sourceText: string, draft: RecipeDraft): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_r2_key, source_name, raw_text, parsed_recipe_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, 'pdf', sourceR2Key, sourceName ?? null, sourceText, JSON.stringify(draft), 'ready', createdAt).run()
  return (await getImport(db, id))!
}
export async function createMealDbReadyImport(db: D1Database, sourceUrl: string, draft: RecipeDraft): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_url, source_name, parsed_recipe_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, 'mealdb', sourceUrl, 'TheMealDB', JSON.stringify(draft), 'ready', createdAt).run()
  return (await getImport(db, id))!
}
export async function createImagePendingImport(db: D1Database, id: string, sourceR2Key: string, sourceName: string | undefined, createdAt = new Date().toISOString()): Promise<RecipeImport> {
  await db.prepare("INSERT INTO recipe_imports (id, source_type, source_r2_key, source_name, status, vision_status, created_at) VALUES (?, 'image', ?, ?, 'pending', 'available', ?)").bind(id, sourceR2Key, sourceName ?? null, createdAt).run()
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
export async function createPdfFailedImport(db: D1Database, sourceR2Key: string, sourceName: string | undefined, sourceText: string | undefined, status: Extract<RecipeImport['status'], 'failed' | 'no_recipe'>, failureCode: Exclude<RecipeImportFailureCode, 'INVALID_URL'>): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_r2_key, source_name, raw_text, status, failure_code, ocr_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, 'pdf', sourceR2Key, sourceName ?? null, sourceText ?? null, status, failureCode, failureCode === 'PDF_UNREADABLE' ? 'available' : null, createdAt).run()
  return (await getImport(db, id))!
}

export async function getImport(db: D1Database, id: string): Promise<RecipeImport | undefined> {
  const row = await db.prepare('SELECT id, source_type, source_url, source_r2_key, source_name, raw_text, parsed_recipe_json, status, failure_code, ocr_status, ocr_attempted_at, ocr_failure_code, vision_status, vision_attempted_at, vision_failure_code, extraction_method, approved_recipe_id, created_at FROM recipe_imports WHERE id = ?').bind(id).first<ImportRow>()
  if (!row) return undefined
  return { id: row.id, sourceType: row.source_type, sourceUrl: row.source_url ?? undefined, sourceR2Key: row.source_r2_key ?? undefined, sourceName: row.source_name ?? undefined, sourceText: row.raw_text ?? undefined, status: row.status, draft: row.parsed_recipe_json ? JSON.parse(row.parsed_recipe_json) as RecipeDraft : undefined, failureCode: row.failure_code ?? undefined, ocrStatus: row.ocr_status ?? undefined, ocrAttemptedAt: row.ocr_attempted_at ?? undefined, ocrFailureCode: row.ocr_failure_code ?? undefined, visionStatus: row.vision_status ?? undefined, visionAttemptedAt: row.vision_attempted_at ?? undefined, visionFailureCode: row.vision_failure_code ?? undefined, extractionMethod: row.extraction_method ?? undefined, approvedRecipeId: row.approved_recipe_id ?? undefined, createdAt: row.created_at }
}

export function publicImport(imported: RecipeImport): RecipeImport {
  if (imported.sourceType !== 'image') return imported
  const draft = imported.draft?.source.type === 'image' ? { ...imported.draft, source: { type: 'image' as const, sourceName: imported.draft.source.sourceName, importedAt: imported.draft.source.importedAt } } as RecipeDraft : imported.draft
  const { sourceR2Key: _sourceR2Key, ...safe } = imported
  return { ...safe, draft }
}
export async function claimImageVisionAttempt(db: D1Database, id: string): Promise<RecipeImport | undefined> {
  const now = new Date().toISOString()
  const result = await db.prepare("UPDATE recipe_imports SET vision_status='attempted', vision_attempted_at=? WHERE id=? AND source_type='image' AND status='pending' AND vision_status='available' AND vision_attempted_at IS NULL").bind(now, id).run()
  return result.meta.changes ? getImport(db, id) : undefined
}
export async function finishImageVision(db: D1Database, id: string, outcome: { draft?: RecipeDraft; failureCode?: RecipeImportFailureCode; status?: 'failed' | 'no_recipe' }): Promise<void> {
  if (outcome.draft) await db.prepare("UPDATE recipe_imports SET parsed_recipe_json=?, status='ready', failure_code=NULL, vision_status='succeeded', vision_failure_code=NULL, extraction_method='vision' WHERE id=? AND vision_status='attempted'").bind(JSON.stringify(outcome.draft), id).run()
  else await db.prepare("UPDATE recipe_imports SET status=?, failure_code=?, vision_status='failed', vision_failure_code=? WHERE id=? AND vision_status='attempted'").bind(outcome.status ?? 'failed', outcome.failureCode ?? 'UNAVAILABLE', outcome.failureCode ?? 'UNAVAILABLE', id).run()
}
export async function claimPdfOcrAttempt(db: D1Database, id: string): Promise<RecipeImport | undefined> { const now = new Date().toISOString(); const result = await db.prepare("UPDATE recipe_imports SET ocr_status='attempted', ocr_attempted_at=? WHERE id=? AND source_type='pdf' AND status='failed' AND failure_code='PDF_UNREADABLE' AND ocr_status='available' AND ocr_attempted_at IS NULL").bind(now, id).run(); return result.meta.changes ? getImport(db, id) : undefined }
export async function finishPdfOcr(db: D1Database, id: string, outcome: { text?: string; draft?: RecipeDraft; failureCode?: RecipeImportFailureCode; status?: 'failed' | 'no_recipe'; pageLimit?: boolean }): Promise<void> { if (outcome.draft && outcome.text) await db.prepare("UPDATE recipe_imports SET raw_text=?, parsed_recipe_json=?, status='ready', failure_code=NULL, ocr_status='succeeded', ocr_failure_code=NULL, extraction_method='ocr' WHERE id=? AND ocr_status='attempted'").bind(outcome.text, JSON.stringify(outcome.draft), id).run(); else await db.prepare("UPDATE recipe_imports SET ocr_status=?, ocr_failure_code=? WHERE id=? AND ocr_status='attempted'").bind(outcome.pageLimit ? 'page_limit' : 'failed', outcome.failureCode ?? 'UNAVAILABLE', id).run() }

export async function approveImport(db: D1Database, importId: string, recipe: NormalizedManualRecipe, favorite: boolean): Promise<{ recipe?: StoredRecipe; reason: 'missing' | 'not_ready' | 'already_approved' | 'approved' }> {
  const imported = await getImport(db, importId)
  if (!imported) return { reason: 'missing' }
  if (imported.status !== 'ready' || !imported.draft) return { reason: 'not_ready' }
  if (imported.approvedRecipeId) return { reason: 'already_approved' }
  const recipeId = crypto.randomUUID()
  const claimed = await db.prepare("UPDATE recipe_imports SET approved_recipe_id = ? WHERE id = ? AND status = 'ready' AND approved_recipe_id IS NULL").bind(recipeId, importId).run()
  if (!claimed.meta.changes) return { reason: 'already_approved' }
  const source = (imported.sourceType === 'url' || imported.sourceType === 'mealdb') && imported.sourceUrl ? { type: 'url' as const, originalUrl: imported.sourceUrl } : imported.sourceType === 'pdf' && imported.sourceR2Key ? { type: 'pdf' as const, r2ObjectKey: imported.sourceR2Key, sourceName: imported.sourceName } : imported.sourceType === 'image' && imported.sourceR2Key ? { type: 'image' as const, r2ObjectKey: imported.sourceR2Key, sourceName: imported.sourceName } : { type: 'text' as const }
  try { return { recipe: await createRecipe(db, recipe, { id: recipeId, favorite, source }), reason: 'approved' } }
  catch (error) { await db.prepare('UPDATE recipe_imports SET approved_recipe_id = NULL WHERE id = ? AND approved_recipe_id = ?').bind(importId, recipeId).run(); throw error }
}
