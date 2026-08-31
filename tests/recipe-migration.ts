const recipeMigrationSql = `
CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY, owner_user_id TEXT, title TEXT NOT NULL, description TEXT, servings REAL, prep_minutes INTEGER, cook_minutes INTEGER, total_minutes INTEGER, cuisine TEXT, category TEXT, notes TEXT, favorite INTEGER NOT NULL DEFAULT 0, source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'url', 'pdf', 'text', 'image')), source_url TEXT, source_name TEXT, source_r2_key TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS recipe_ingredients (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, position INTEGER NOT NULL, original_text TEXT NOT NULL, quantity REAL, quantity_text TEXT, unit TEXT, ingredient TEXT, preparation TEXT, optional INTEGER NOT NULL DEFAULT 0, UNIQUE(recipe_id, position));
CREATE TABLE IF NOT EXISTS recipe_instructions (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, step_number INTEGER NOT NULL, text TEXT NOT NULL, UNIQUE(recipe_id, step_number));
CREATE TABLE IF NOT EXISTS recipe_tags (recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE, tag TEXT NOT NULL, PRIMARY KEY(recipe_id, tag));
CREATE INDEX IF NOT EXISTS recipes_title_index ON recipes(title COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS recipe_imports (id TEXT PRIMARY KEY, source_type TEXT NOT NULL CHECK (source_type IN ('url', 'text', 'pdf', 'image', 'mealdb')), source_url TEXT, source_r2_key TEXT, source_name TEXT, raw_text TEXT, parsed_recipe_json TEXT, status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed', 'no_recipe')), failure_code TEXT, ocr_status TEXT CHECK (ocr_status IN ('available', 'attempted', 'succeeded', 'failed', 'page_limit')), ocr_attempted_at TEXT, ocr_failure_code TEXT, vision_status TEXT CHECK (vision_status IN ('available', 'attempted', 'succeeded', 'failed')), vision_attempted_at TEXT, vision_failure_code TEXT, extraction_method TEXT CHECK (extraction_method IN ('embedded_text', 'ocr', 'vision')), created_at TEXT NOT NULL, approved_recipe_id TEXT);
CREATE INDEX IF NOT EXISTS recipe_imports_created_at_index ON recipe_imports(created_at DESC);
`

export function applyRecipeMigration(db: D1Database): Promise<void> {
  return db.exec(recipeMigrationSql)
}
