CREATE TABLE recipe_cook_logs (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  note TEXT,
  cooked_at TEXT NOT NULL
);

CREATE INDEX recipe_cook_logs_recipe_cooked_at_index ON recipe_cook_logs(recipe_id, cooked_at DESC);
