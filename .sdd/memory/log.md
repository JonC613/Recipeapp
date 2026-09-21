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

## 2026-09-03

- **Recipe Chat Agent update (approved):** Recorded the implemented owner-facing, read-only recipe-chat
  capability: bounded deterministic saved-recipe retrieval, one Worker-owned structured OpenAI response,
  server-validated recipe citations, session-only browser transcript, safe no-match/retry outcomes, and no
  migration, vector retrieval, persistent chat storage, or write action. Sources:
  `.litespec/recipe-chat-agent/` and `worker/routes/recipe-chat.ts`.

## 2026-09-08

- **Release evidence reconciliation:** Read-only Cloudflare checks found all committed remote D1 migrations
  applied and active Worker release `e686e23d-994d-4043-811d-8f2edec3f5d4` at 100% traffic. An
  unauthenticated health request was redirected by Cloudflare Access. The owner confirmed the authorized
  production smoke test on 2026-09-08; this is the current known-good release.

## 2026-09-09

- **Recipe Graphics implementation:** Added the LiteSpec-backed, on-demand private recipe-art capability:
  one low-cost, low-quality OpenAI image generation per saved recipe, private R2 PNG storage, a
  same-origin display route, and a nullable D1 graphic key. Source: `.litespec/recipe-graphics/`.

- **Recipe Graphics Library amendment:** Added the safe summary availability flag and Library-card
  thumbnails for existing generated art, with a decorative placeholder for recipes without art. No
  image is generated during browsing. Source: `.litespec/recipe-graphics/` and commit `117203a`.

- **Recipe Graphics backfill amendment:** Added an owner-confirmed sequential Library backfill that skips
  existing art and continues after individual failures. The owner-approved production run and retry ended
  with 41 stored graphics and zero missing recipe graphics. Source: `.litespec/recipe-graphics/`.

- **Recipe Chat hardening deployed:** Worker release `35b550b9-67df-4937-a9d6-0563359259e5` is routed
  at 100% traffic. It contains bounded Recipe Chat context, bulk follow-up hydration, safe clarification,
  offline evaluation preparation, and cancellation regression coverage. The owner confirmed the
  authenticated production smoke; this is the current known-good release. The earlier owner-smoked
  release remains the rollback point.

## 2026-09-11

- **Cooking History and Feedback implementation:** Added private D1 cook logs with server timestamps,
  optional bounded ratings/notes, per-entry correction, detail history, and aggregate cook signals for
  Library and Meal Plan. The Worker exposes recipe-scoped create/delete routes; list responses omit
  individual notes. Source: `.litespec/cooking-history-feedback/` and
  `migrations/0013_recipe_cook_logs.sql`.

## 2026-09-19

- **Recipe Chat Agents SDK upgrade implemented:** Replaced the single-turn read-only chat surface with
  persistent D1 conversations, streamed typed events, bounded saved-recipe and meal-plan tools, linked
  citations, and explicit Apply/Cancel proposals for recipe variations, meal-plan assignments, and grocery
  changes. Recipe adaptations preserve ancestry, stale proposals fail safely, and action application is
  idempotent. Source: `.litespec/recipe-chat-agent/` and `migrations/0014_recipe_chat_assistant.sql`.

## 2026-09-20

- **Durable Recipe Chat cancellation deployed:** Worker release
  `bec20151-8ac6-453d-b41a-ff595ae24a0e` adds client-generated turn IDs and an idempotent cancellation
  route. Stop now removes the running D1 turn and prevents late agent results from persisting an answer or
  proposal. Unit, component, Worker, integration, E2E, structural, and authenticated production smoke
  validation passed; reload showed no stopped exchange, while a later normal query persisted once.
- **Recipe Chat partial-citation recovery deployed:** Worker release
  `9eaf32a8-455b-4cf7-a78c-62a8bf13ba2c` preserves an otherwise valid answer when one or more provider
  citation IDs cannot be resolved, emits links only for the D1-verified subset, and still fails safely when
  every citation is unknown. The full 94-test Worker suite, build, typecheck, structural validation, and the
  authenticated production reproduction of the previously failing comparison passed.

## 2026-09-21

- **Beta Recipe Discovery implementation:** Added owner-approved recipe-site profiles, a bounded public-HTTPS
  WordPress REST compatibility validator, explicit pending-to-approved promotion, concurrent approved-site
  search, transient Recipe JSON-LD preview, and reuse of URL import review/save. The selected initial source
  is seeded as an approved generic site. Source: `.litespec/beta-recipe-discovery/` and
  `migrations/0015_beta_recipe_discovery.sql`.
- **Beta Recipe Discovery deployed:** Applied remote migration
  `0015_beta_recipe_discovery.sql` and deployed Worker release
  `a6a4d142-b05c-446a-bd06-a163ec00b1ce` at 100% traffic on
  `recipes.merkavaenterprises.com`. Remote verification found no pending migrations and confirmed the seeded
  discovery source is approved and enabled. Unauthenticated page and health checks correctly redirect to
  Cloudflare Access; the available Edge profile was not authenticated, so the owner-only UI smoke remains
  intentionally unperformed rather than automating account credentials or a login code.
- **Beta Recipe Discovery validation hardening:** The compatibility checker now samples up to three bounded,
  same-origin WordPress results instead of rejecting a site because its first result is a non-recipe roundup.
  It accepts only after one result yields a usable Recipe JSON-LD draft; all-unusable samples still fail safely.
  Worker release `9e23cd73-81e3-421a-8e14-ecdb24df2e96` is deployed at 100% traffic. Typecheck, lint,
  33 client tests, 102 Worker tests, 19 integration tests, and 96 cross-viewport E2E tests passed. Source:
  `.litespec/beta-recipe-discovery/` v1.1 and Worker regression coverage.
