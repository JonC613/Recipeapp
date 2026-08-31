---
feature: url-import-html-entities
artifact: tiny
status: done
owner: user
version: 0.1
created: 2026-08-31
updated: 2026-08-31
---

# TinySpec: URL Import HTML Entity Normalization

## Summary

Decode HTML character references in schema.org Recipe JSON-LD before creating a
future URL-import draft, so entities such as `&#32;` and `&amp;` appear as a
space and `&` in the review and saved recipe.

## Scope

### Included

- Decode standard named and decimal/hexadecimal numeric HTML character references
  in human-readable JSON-LD recipe strings.
- Apply the normalization consistently to title, description, ingredients,
  instructions, cuisine, category, and tags in future URL-import drafts.
- Add regression tests for nested instruction text and ingredient/entity decoding.

### Excluded

- Rewriting existing import snapshots or approved recipes.
- Changes to URL fetching, JSON-LD discovery, AI parsing, review/save behavior,
  database schema, or non-URL import sources.

## Requirements

- **R-01:** Future URL-import drafts decode `&amp;`, standard named entities, and
  decimal or hexadecimal numeric character references before review.
- **R-02:** Decoding applies to flattened/nested `HowToStep` instruction text and
  all displayed string recipe fields without changing their ordering.
- **R-03:** Unknown or malformed character references remain safe literal text;
  decoding never throws or causes an otherwise valid Recipe JSON-LD import to fail.
- **R-04:** Existing imports and approved recipes remain immutable; only newly
  created URL import drafts receive normalized text.

## Constraints and assumptions

- Keep the deterministic URL-import path dependency-free and Worker-compatible.
- Decode only display text after JSON parsing; do not alter raw retained HTML or
  source URL provenance.
- Preserve the existing no-invention and explicit-review boundaries.

## Implementation outline

- Add a small, bounded entity-decoding helper inside the JSON-LD normalization
  boundary and route display strings through it.
- Extend existing URL-import worker tests with representative named/numeric
  entities and nested instruction fixtures.

## Verification

- Worker tests prove decoded output, original ordering, and safe malformed input.
- Existing URL-import regression tests remain passing with no migration required.

## Done when

- [x] All current requirements have passing evidence.
- [x] Existing URL import behavior remains unchanged except decoded display text.
- [x] No unresolved issue blocks the stated outcome.

## Amendment history

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Decode literal HTML entities from recipe JSON-LD |
