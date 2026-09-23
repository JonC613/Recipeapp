CREATE TABLE recipe_chat_proposals_rebuilt (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES recipe_chat_conversations(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES recipe_chat_messages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('recipe_variation', 'generated_recipe', 'meal_plan', 'grocery_update')),
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled', 'stale', 'failed')),
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO recipe_chat_proposals_rebuilt (id, conversation_id, message_id, kind, summary, payload_json, status, result_json, created_at, updated_at)
SELECT id, conversation_id, message_id, kind, summary, payload_json, status, result_json, created_at, updated_at
FROM recipe_chat_proposals;

DROP TABLE recipe_chat_proposals;
ALTER TABLE recipe_chat_proposals_rebuilt RENAME TO recipe_chat_proposals;
CREATE INDEX recipe_chat_proposals_conversation_index ON recipe_chat_proposals(conversation_id, created_at);
