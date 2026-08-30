# Data Model: Recipe Search

## Persisted entities

Search adds no database tables, columns, migrations, or retained records. It reads the existing saved
recipe domain only.

| Existing entity | Searchable fields | Search role |
|-----------------|-------------------|-------------|
| Recipe | `title`, `cuisine`, `category`, `favorite`, `updated_at` | Keyword matching, direct field filters, favorite filter, and stable result ordering |
| Recipe ingredient | `original_text`, `ingredient` | Keyword matching and ingredient filter |
| Recipe tag | `tag` | Keyword matching and tag filter |

## Transient search criteria

| Field | Type | Rules |
|-------|------|-------|
| `q` | optional text | Trim and collapse whitespace; matches any searchable field case-insensitively. |
| `favorite` | optional boolean | Accept only `true` or `false`; absent means no favorite constraint. |
| `tag` | optional text | Match saved tag text case-insensitively. |
| `ingredient` | optional text | Match saved ingredient wording case-insensitively. |
| `cuisine` | optional text | Match saved recipe cuisine case-insensitively. |
| `category` | optional text | Match saved recipe category case-insensitively. |

Blank criteria are omitted. Multiple nonblank criteria are combined with AND. A recipe appears once even
when more than one saved ingredient or tag matches. Search criteria never become recipe data and are not
included in recipe imports, source records, or analytics.

## Result projection

The list response remains a recipe summary: identifier, title, favorite status, prep/cook minutes,
category, and update timestamp. It must not include ingredients, tags, recipe source, import data,
provider data, or private object keys solely for search.
