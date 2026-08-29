# Data Model: URL Recipe Import

## RecipeImport

| Field | Rules |
|---|---|
| id | Stable generated identifier |
| source_type | Always `url` in this feature |
| source_url | Validated original submitted URL |
| raw_text | Optional bounded extracted page text; absent for JSON-LD-only imports |
| parsed_recipe_json | Normalized RecipeDraft JSON on success |
| status | `ready`, `failed`, or `no_recipe` |
| failure_code | Safe optional reason, never remote content or diagnostics |
| created_at | Import attempt timestamp |

Each attempt is immutable after creation. It has no recipe foreign key because saving is a later
review workflow.

## RecipeDraft

Uses the stable recipe fields already established by Feature 002, but has no id, favorite state, or
library timestamps. Its source is `{ type: "url", originalUrl, importedAt }`; ingredients retain
`originalText`, and instructions retain source order.
