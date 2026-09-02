import type { ActivitySummary, ImportSourceType, ImportStatus, UsageRange } from '../../src/domain/usage.js'

const sourceTypes: ImportSourceType[] = ['url', 'text', 'pdf', 'image', 'mealdb']
const statuses: ImportStatus[] = ['pending', 'ready', 'failed', 'no_recipe']

export function rangeStart(range: UsageRange, now = new Date()): string {
  const start = new Date(now)
  if (range === 'month') start.setUTCDate(1)
  else start.setUTCDate(start.getUTCDate() - (range === '7d' ? 7 : 30))
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}

function emptyImports(): ActivitySummary['imports'] {
  return Object.fromEntries(sourceTypes.map((source) => [source, Object.fromEntries(statuses.map((status) => [status, 0]))])) as ActivitySummary['imports']
}

export async function getActivitySummary(db: D1Database, range: UsageRange, now = new Date()): Promise<ActivitySummary> {
  const start = rangeStart(range, now)
  const [recipe, imports, ai] = await db.batch([
    db.prepare('SELECT COUNT(*) AS count FROM recipes'),
    db.prepare('SELECT source_type, status, COUNT(*) AS count FROM recipe_imports WHERE created_at >= ? GROUP BY source_type, status').bind(start),
    db.prepare("SELECT SUM(CASE WHEN source_type = 'text' THEN 1 ELSE 0 END) AS text_attempts, SUM(CASE WHEN ocr_attempted_at IS NOT NULL THEN 1 ELSE 0 END) AS ocr_attempts, SUM(CASE WHEN vision_attempted_at IS NOT NULL THEN 1 ELSE 0 END) AS image_attempts FROM recipe_imports WHERE created_at >= ?").bind(start),
  ])
  const summary: ActivitySummary = { recipeCount: Number((recipe.results[0] as { count?: number } | undefined)?.count ?? 0), imports: emptyImports(), aiAttempts: { text: 0, ocr: 0, image: 0 } }
  for (const row of imports.results as Array<{ source_type: ImportSourceType; status: ImportStatus; count: number }>) if (summary.imports[row.source_type]?.[row.status] !== undefined) summary.imports[row.source_type][row.status] = Number(row.count)
  const attempts = ai.results[0] as { text_attempts?: number; ocr_attempts?: number; image_attempts?: number } | undefined
  summary.aiAttempts = { text: Number(attempts?.text_attempts ?? 0), ocr: Number(attempts?.ocr_attempts ?? 0), image: Number(attempts?.image_attempts ?? 0) }
  return summary
}
