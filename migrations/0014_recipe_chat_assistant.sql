CREATE TABLE recipe_chat_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recipe_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES recipe_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  source_kind TEXT CHECK (source_kind IN ('library', 'general', 'mixed')),
  recipe_ids_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('running', 'complete', 'interrupted', 'failed')),
  created_at TEXT NOT NULL
);

CREATE INDEX recipe_chat_messages_conversation_index ON recipe_chat_messages(conversation_id, created_at);

CREATE TABLE recipe_chat_proposals (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES recipe_chat_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES recipe_chat_messages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('recipe_variation', 'meal_plan', 'grocery_update')),
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled', 'stale', 'failed')),
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX recipe_chat_proposals_conversation_index ON recipe_chat_proposals(conversation_id, created_at);

CREATE TABLE recipe_variations (
  recipe_id TEXT PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  source_recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES recipe_chat_conversations(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);
