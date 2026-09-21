import type { DiscoveryAdapter, DiscoverySite, DiscoveryValidationReport } from '../../src/domain/recipe/discovery.js'

type SiteRow = {
  id: string
  origin: string
  hostname: string
  adapter: DiscoveryAdapter | null
  status: 'pending' | 'approved'
  enabled: number
  validation_json: string
  validated_at: string
  approved_at: string | null
}

function publicSite(row: SiteRow): DiscoverySite {
  return {
    id: row.id,
    origin: row.origin,
    hostname: row.hostname,
    adapter: row.adapter ?? undefined,
    status: row.status,
    enabled: row.enabled === 1,
    validation: JSON.parse(row.validation_json) as DiscoveryValidationReport,
    validatedAt: row.validated_at,
    approvedAt: row.approved_at ?? undefined,
  }
}

export async function listDiscoverySites(db: D1Database): Promise<DiscoverySite[]> {
  const rows = await db.prepare('SELECT id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at FROM recipe_discovery_sites ORDER BY hostname COLLATE NOCASE').all<SiteRow>()
  return rows.results.map(publicSite)
}

export async function listApprovedDiscoverySites(db: D1Database): Promise<DiscoverySite[]> {
  const rows = await db.prepare("SELECT id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at FROM recipe_discovery_sites WHERE status='approved' AND enabled=1 ORDER BY hostname COLLATE NOCASE LIMIT 8").all<SiteRow>()
  return rows.results.map(publicSite)
}

export async function findApprovedDiscoverySiteByOrigin(db: D1Database, origin: string): Promise<DiscoverySite | undefined> {
  const row = await db.prepare("SELECT id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at FROM recipe_discovery_sites WHERE origin=? AND status='approved' AND enabled=1").bind(origin).first<SiteRow>()
  return row ? publicSite(row) : undefined
}

export async function upsertDiscoveryValidation(db: D1Database, origin: string, hostname: string, validation: DiscoveryValidationReport, now = new Date().toISOString()): Promise<DiscoverySite> {
  const existing = await db.prepare('SELECT id, status, enabled, approved_at FROM recipe_discovery_sites WHERE origin=?').bind(origin).first<{ id: string; status: string; enabled: number; approved_at: string | null }>()
  const id = existing?.id ?? crypto.randomUUID()
  await db.prepare(`INSERT INTO recipe_discovery_sites (id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, NULL, ?, ?)
    ON CONFLICT(origin) DO UPDATE SET hostname=excluded.hostname, adapter=excluded.adapter, status='pending', enabled=0, validation_json=excluded.validation_json, validated_at=excluded.validated_at, approved_at=NULL, updated_at=excluded.updated_at`)
    .bind(id, origin, hostname, validation.adapter ?? null, JSON.stringify(validation), now, now, now).run()
  const row = await db.prepare('SELECT id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at FROM recipe_discovery_sites WHERE origin=?').bind(origin).first<SiteRow>()
  return publicSite(row!)
}

export async function approveDiscoverySite(db: D1Database, id: string, now = new Date().toISOString()): Promise<DiscoverySite | undefined> {
  const row = await db.prepare('SELECT validation_json FROM recipe_discovery_sites WHERE id=?').bind(id).first<{ validation_json: string }>()
  if (!row || !(JSON.parse(row.validation_json) as DiscoveryValidationReport).compatible) return undefined
  await db.prepare("UPDATE recipe_discovery_sites SET status='approved', enabled=1, approved_at=COALESCE(approved_at, ?), updated_at=? WHERE id=?").bind(now, now, id).run()
  const approved = await db.prepare('SELECT id, origin, hostname, adapter, status, enabled, validation_json, validated_at, approved_at FROM recipe_discovery_sites WHERE id=?').bind(id).first<SiteRow>()
  return approved ? publicSite(approved) : undefined
}
