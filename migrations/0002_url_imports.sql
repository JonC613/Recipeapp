CREATE TABLE recipe_imports (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type = 'url'),
  source_url TEXT NOT NULL,
  raw_text TEXT,
  parsed_recipe_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'failed', 'no_recipe')),
  failure_code TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX recipe_imports_created_at_index ON recipe_imports(created_at DESC);
