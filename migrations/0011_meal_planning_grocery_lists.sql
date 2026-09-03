CREATE TABLE meal_plan_weeks (
  week_start TEXT PRIMARY KEY,
  plan_revision INTEGER NOT NULL DEFAULT 0 CHECK (plan_revision >= 0),
  grocery_generated_revision INTEGER CHECK (grocery_generated_revision >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE meal_plan_entries (
  week_start TEXT NOT NULL REFERENCES meal_plan_weeks(week_start) ON DELETE CASCADE,
  day_index INTEGER NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (week_start, day_index)
);

CREATE INDEX meal_plan_entries_recipe_id_index ON meal_plan_entries(recipe_id);

CREATE TABLE grocery_list_items (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL REFERENCES meal_plan_weeks(week_start) ON DELETE CASCADE,
  display_text TEXT NOT NULL,
  normalized_key TEXT,
  section TEXT NOT NULL CHECK (section IN ('produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'other')),
  checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  occurrence_count INTEGER NOT NULL DEFAULT 1 CHECK (occurrence_count > 0),
  contributor_titles_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((is_custom = 1 AND normalized_key IS NULL) OR (is_custom = 0 AND normalized_key IS NOT NULL))
);

CREATE INDEX grocery_list_items_week_section_index ON grocery_list_items(week_start, section, is_custom, display_text COLLATE NOCASE);

CREATE TRIGGER meal_plan_entry_insert_revision
AFTER INSERT ON meal_plan_entries
BEGIN
  UPDATE meal_plan_weeks SET plan_revision = plan_revision + 1, updated_at = NEW.updated_at WHERE week_start = NEW.week_start;
END;

CREATE TRIGGER meal_plan_entry_update_revision
AFTER UPDATE OF recipe_id ON meal_plan_entries
BEGIN
  UPDATE meal_plan_weeks SET plan_revision = plan_revision + 1, updated_at = NEW.updated_at WHERE week_start = NEW.week_start;
END;

CREATE TRIGGER meal_plan_entry_delete_revision
AFTER DELETE ON meal_plan_entries
BEGIN
  UPDATE meal_plan_weeks SET plan_revision = plan_revision + 1, updated_at = OLD.updated_at WHERE week_start = OLD.week_start;
END;
