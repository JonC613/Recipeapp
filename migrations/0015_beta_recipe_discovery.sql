CREATE TABLE recipe_discovery_sites (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  adapter TEXT CHECK (adapter IN ('wordpress_rest')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved')),
  enabled INTEGER NOT NULL DEFAULT 0,
  validation_json TEXT NOT NULL,
  validated_at TEXT NOT NULL,
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX recipe_discovery_sites_status_index
  ON recipe_discovery_sites(status, enabled, hostname COLLATE NOCASE);

INSERT INTO recipe_discovery_sites (
  id, origin, hostname, adapter, status, enabled, validation_json,
  validated_at, approved_at, created_at, updated_at
) VALUES (
  'site-cookinginthemidwest-com',
  'https://cookinginthemidwest.com',
  'cookinginthemidwest.com',
  'wordpress_rest',
  'approved',
  1,
  '{"compatible":true,"adapter":"wordpress_rest","criteria":[{"id":"https","passed":true,"message":"Uses public HTTPS."},{"id":"robots","passed":true,"message":"Public discovery paths are allowed."},{"id":"search","passed":true,"message":"A supported site search is available."},{"id":"same_origin","passed":true,"message":"Search results stay on this site."},{"id":"recipe","passed":true,"message":"A sample result contains one structured recipe."}]}',
  '2026-09-21T00:00:00.000Z',
  '2026-09-21T00:00:00.000Z',
  '2026-09-21T00:00:00.000Z',
  '2026-09-21T00:00:00.000Z'
);
