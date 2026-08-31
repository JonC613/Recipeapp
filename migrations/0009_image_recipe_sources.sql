-- Preserve recipe rows and their dependent tables while allowing an approved
-- image import to retain its private source metadata on the saved recipe.
PRAGMA foreign_keys = OFF;

CREATE TABLE recipes_new (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  servings REAL,
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  total_minutes INTEGER,
  cuisine TEXT,
  category TEXT,
  notes TEXT,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'url', 'pdf', 'text', 'image')),
  source_url TEXT,
  source_name TEXT,
  source_r2_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO recipes_new (id, owner_user_id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite, source_type, source_url, source_name, source_r2_key, created_at, updated_at)
SELECT id, owner_user_id, title, description, servings, prep_minutes, cook_minutes, total_minutes, cuisine, category, notes, favorite, source_type, source_url, source_name, source_r2_key, created_at, updated_at FROM recipes;

DROP TABLE recipes;
ALTER TABLE recipes_new RENAME TO recipes;
CREATE INDEX recipes_title_index ON recipes(title COLLATE NOCASE);

PRAGMA foreign_keys = ON;
