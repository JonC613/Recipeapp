import type { RecipeDraft, RecipeImport } from '../../src/domain/recipe/imports.js'

type ImportRow = { id: string; source_type: 'url'; source_url: string; parsed_recipe_json: string | null; status: 'ready' | 'failed' | 'no_recipe'; failure_code: RecipeImport['failureCode'] | null; created_at: string }

export async function createReadyImport(db: D1Database, sourceUrl: string, draft: RecipeDraft): Promise<RecipeImport> {
  const id = crypto.randomUUID(); const createdAt = new Date().toISOString()
  await db.prepare('INSERT INTO recipe_imports (id, source_type, source_url, parsed_recipe_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, 'url', sourceUrl, JSON.stringify(draft), 'ready', createdAt).run()
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

export async function getImport(db: D1Database, id: string): Promise<RecipeImport | undefined> {
  const row = await db.prepare('SELECT id, source_type, source_url, parsed_recipe_json, status, failure_code, created_at FROM recipe_imports WHERE id = ?').bind(id).first<ImportRow>()
  if (!row) return undefined
  return { id: row.id, sourceType: row.source_type, sourceUrl: row.source_url, status: row.status, draft: row.parsed_recipe_json ? JSON.parse(row.parsed_recipe_json) as RecipeDraft : undefined, failureCode: row.failure_code ?? undefined, createdAt: row.created_at }
}
