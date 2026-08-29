ALTER TABLE recipe_imports ADD COLUMN approved_recipe_id TEXT;
CREATE UNIQUE INDEX recipe_imports_approved_recipe_index ON recipe_imports(approved_recipe_id) WHERE approved_recipe_id IS NOT NULL;
