ALTER TABLE recipe_imports RENAME TO recipe_imports_previous;

CREATE TABLE recipe_imports (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'text')),
  source_url TEXT,
  raw_text TEXT,
  parsed_recipe_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'failed', 'no_recipe')),
  failure_code TEXT,
  created_at TEXT NOT NULL,
  approved_recipe_id TEXT
);

INSERT INTO recipe_imports (id, source_type, source_url, raw_text, parsed_recipe_json, status, failure_code, created_at, approved_recipe_id)
SELECT id, source_type, source_url, raw_text, parsed_recipe_json, status, failure_code, created_at, approved_recipe_id
FROM recipe_imports_previous;

DROP TABLE recipe_imports_previous;

CREATE INDEX recipe_imports_created_at_index ON recipe_imports(created_at DESC);
CREATE UNIQUE INDEX recipe_imports_approved_recipe_index ON recipe_imports(approved_recipe_id) WHERE approved_recipe_id IS NOT NULL;
