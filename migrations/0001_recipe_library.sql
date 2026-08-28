CREATE TABLE recipes (
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
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'url', 'pdf', 'text')),
  source_url TEXT,
  source_name TEXT,
  source_r2_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  original_text TEXT NOT NULL,
  quantity REAL,
  quantity_text TEXT,
  unit TEXT,
  ingredient TEXT,
  preparation TEXT,
  optional INTEGER NOT NULL DEFAULT 0 CHECK (optional IN (0, 1)),
  UNIQUE (recipe_id, position)
);
CREATE TABLE recipe_instructions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  text TEXT NOT NULL,
  UNIQUE (recipe_id, step_number)
);
CREATE TABLE recipe_tags (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag COLLATE NOCASE)
);
CREATE INDEX recipes_title_index ON recipes(title COLLATE NOCASE);
