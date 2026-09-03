# Project Memory Update Log

## 2026-08-27

- **Initialization:** Created the first reviewed Project Memory bundle from the implemented
  Foundation and approved Foundation amendment.
- No Git reconciliation commit is available because the repository has no initial commit.

## 2026-08-28

- **Feature 002 update (approved):** Recorded the implemented manual Recipe Library capability:
  versioned D1 recipe persistence, Worker CRUD contract, responsive browser workflows, and local-only
  validation boundaries. Source: `specs/002-recipe-library/`.

## 2026-08-29

- **Feature 003 update (approved):** Recorded the implemented deterministic URL-import capability:
  bounded public-page retrieval, Recipe JSON-LD normalization, independent D1 import history,
  safe recovery outcomes, and retained unsaved drafts. Source: `specs/003-url-import/`.
- **Feature 004 update (approved):** Recorded the implemented review-and-save capability: editable
  ready drafts, explicit one-time approval into URL-sourced recipes, preserved immutable import
  provenance, and responsive approval and recovery journeys. Source: `specs/004-import-review/`.
- **Feature 005 update (approved):** Recorded the implemented AI-assisted pasted-text import: bounded
  text submission, one Worker-only structured extraction call, retained source and snapshot, safe
  recovery outcomes, and explicit review/approval into text-sourced recipes. Source:
  `specs/005-text-import/`.
- **Feature 006 update (approved):** Recorded retained PDF imports with private R2 source storage,
  bounded deterministic text extraction, explicit one-attempt OCR for image-only PDFs, temporary
  provider-file cleanup, safe recovery outcomes, and review/approval into PDF-sourced recipes. Build,
  type, lint, unit, Worker, integration, and 54 responsive end-to-end checks passed. Source:
  `specs/006-pdf-import/`.
- **Feature 007 update (approved):** Recorded traditional saved-recipe search across title, ingredients,
  tags, cuisine, and category; conjunctive favorite and field filters; safe summary-only results; and no
  schema migration, AI call, or semantic/vector infrastructure. Build, Cloudflare type, lint, component,
  Worker, integration, and 57 responsive end-to-end checks passed. Source: `specs/007-recipe-search/`.

## 2026-08-31

- **Feature 008 update (approved):** Recorded the deployed owner-protected Cloudflare architecture:
  custom hostname behind Cloudflare Access, Worker-only secrets, production D1, and private R2. Source:
  `specs/008-secure-deployment/`.
- **Feature 009 update (approved):** Recorded the repository implementation of Worker-owned TheMealDB
  browse, search, preview, explicit import, review, and save; immutable `mealdb` import history; and
  canonical URL mapping for approved recipes. The code is fully locally tested but deployment remains a
  separate approval. Source: `specs/009-mealdb-browse-import/`.
- **Memory correction (approved):** Reconciled stale boundaries and deployment claims: standalone image/
  screenshot import and the deployed TheMealDB browse/import capability are current repository behavior.
  Sources: `specs/009-mealdb-browse-import/`, `specs/010-image-screenshot-import/`, and `worker/index.ts`.

## 2026-09-02

- **Usage & Costs dashboard update (approved):** Recorded the deployed owner-facing read-only dashboard:
  bounded application, Cloudflare, and OpenAI reporting adapters; safe independent availability states;
  optional budget state; and Worker-only reporting credentials. Source:
  `.litespec/usage-cost-dashboard/`.
- **Cooking Mode update (approved):** Recorded the deployed presentation-only cooking route: one local
  instruction at a time, bounded next/previous controls, visible ingredients, responsive coverage, and no
  recipe mutation or new API dependency. Source: `.tinyspec/cooking-mode.md`.
- **Meal Planning and Grocery Lists update (approved):** Recorded the deployed Sunday-based dinner-plan
  and persistent grocery-checklist capability: D1 week revisions, explicit deterministic generation/update,
  exact-line grouping, local sections, custom items, and no AI/provider calls. Sources:
  `.litespec/meal-planning-grocery-list/` and `migrations/0011_meal_planning_grocery_lists.sql`.
