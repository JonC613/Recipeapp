ALTER TABLE recipe_imports RENAME TO recipe_imports_previous;

CREATE TABLE recipe_imports (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('url', 'text', 'pdf')),
  source_url TEXT,
  source_r2_key TEXT,
  source_name TEXT,
  raw_text TEXT,
  parsed_recipe_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('ready', 'failed', 'no_recipe')),
  failure_code TEXT,
  ocr_status TEXT CHECK (ocr_status IN ('available', 'attempted', 'succeeded', 'failed', 'page_limit')),
  ocr_attempted_at TEXT,
  ocr_failure_code TEXT,
  extraction_method TEXT CHECK (extraction_method IN ('embedded_text', 'ocr')),
  created_at TEXT NOT NULL,
  approved_recipe_id TEXT
);

INSERT INTO recipe_imports (id, source_type, source_url, source_r2_key, source_name, raw_text, parsed_recipe_json, status, failure_code, created_at, approved_recipe_id)
SELECT id, source_type, source_url, source_r2_key, source_name, raw_text, parsed_recipe_json, status, failure_code, created_at, approved_recipe_id
FROM recipe_imports_previous;

UPDATE recipe_imports SET extraction_method = 'embedded_text' WHERE source_type = 'pdf' AND raw_text IS NOT NULL;
UPDATE recipe_imports SET ocr_status = 'available' WHERE source_type = 'pdf' AND status = 'failed' AND failure_code = 'PDF_UNREADABLE';

DROP TABLE recipe_imports_previous;

CREATE INDEX recipe_imports_created_at_index ON recipe_imports(created_at DESC);
CREATE UNIQUE INDEX recipe_imports_approved_recipe_index ON recipe_imports(approved_recipe_id) WHERE approved_recipe_id IS NOT NULL;
