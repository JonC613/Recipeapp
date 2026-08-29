# Data Model: Text Recipe Import

## ExtractedContent

| Field | Type | Rules |
|---|---|---|
| `sourceType` | `text` | Fixed discriminator |
| `text` | string | Original retained; trimmed for emptiness; 1–50,000 characters |

## RecipeParseResult

| Field | Type | Rules |
|---|---|---|
| `outcome` | `recipe \| not_recipe \| multiple_recipes` | Required |
| `draft` | RecipeDraft or absent | Only after structured and domain validation |

Provider nullable fields map to absent application fields. Refusals and invalid envelopes never become
recipe outcomes.

## RecipeDraft source

- URL: `{ type: "url", originalUrl, importedAt }`
- Text: `{ type: "text", importedAt }`

All stable recipe fields remain unchanged; ingredient `originalText` and instruction ordering persist.

## RecipeImport

| Field | URL | Text | Rule |
|---|---|---|---|
| `id` | UUID | UUID | One per valid explicit submission |
| `sourceType` | url | text | Required discriminator |
| `sourceUrl` | required | absent | Immutable |
| `sourceText` | absent | required | Original raw text, immutable |
| `status` | existing | ready/failed/no_recipe | Ready only after validation |
| `draft` | optional | optional | Immutable extraction snapshot |
| `failureCode` | existing | safe code | Never raw provider detail |
| `approvedRecipeId` | optional | optional | Unique and set once |
| `createdAt` | timestamp | timestamp | Immutable |

Text failure codes: `NO_RECIPE`, `MULTIPLE_RECIPES`, `INVALID_OUTPUT`, `UNAVAILABLE`. Empty/oversized
requests are rejected before a provider call or import record.

## Migration

`0004_text_imports.sql` rebuilds `recipe_imports` with `source_type IN ('url','text')`, nullable
`source_url`, nullable `raw_text`, and existing snapshot/status/failure/approval/time fields. It copies
existing URL rows and recreates created-at and unique approved-recipe indexes. Repository validation
requires URL for URL imports and raw text for text imports.

## State transitions

```text
valid text -> one parse -> valid recipe -> ready -> review -> approved once
                        -> not recipe -> no_recipe
                        -> multiple -> failed/MULTIPLE_RECIPES
                        -> refusal/error/invalid -> failed
empty or oversized -> validation error, no call, no record
ready -> cancel -> ready, no recipe mutation
```

Approval derives provenance from the import: text imports create `RecipeSource { type: "text" }`.
