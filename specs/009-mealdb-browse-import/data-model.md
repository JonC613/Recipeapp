# Data Model: TheMealDB Import Provenance

## Retained import record

Migration `0007_mealdb_imports.sql` expands the `recipe_imports.source_type` check constraint with
`mealdb`. A TheMealDB import stores:

- `source_type = 'mealdb'`
- `source_url` as the canonical provider recipe URL
- `source_name = 'TheMealDB'`
- `parsed_recipe_json` as the normalized, immutable Recipe Draft snapshot
- the provider recipe identifier in the draft source object

The application never stores the raw upstream response. Browse, search, and preview calls are transient
and do not create a D1 row.

## Approval mapping

`recipe_imports` remains the audit/provenance layer. When the owner explicitly approves a ready import,
the existing recipe persistence model maps its source to `url` and saves the canonical TheMealDB recipe
URL. The review form and recipe detail view display the provider attribution from the retained import
draft. This keeps the `recipes` table and existing source constraints unchanged while preserving the
specific provider identity for the accepted import.

## Compatibility

The migration rebuilds only `recipe_imports` and copies every existing row before recreating its indexes.
Existing URL, text, and PDF imports retain their source types and snapshots unchanged.
