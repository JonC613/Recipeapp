---
feature: meal-planning-grocery-list
artifact: plan
status: done
owner: user
version: 0.1
created: 2026-09-02
updated: 2026-09-02
spec_version: 0.1
---

# Implementation Plan: Meal Planning and Grocery Lists

## Technical approach

Add one D1 migration and a small meal-planning domain that holds a weekly plan, seven optional dinner assignments, and a persistent grocery-list snapshot. The Worker will expose bounded same-origin routes for one selected week and its mutations. A deterministic, server-side grocery builder will normalize ingredient-line keys, group exact matches, classify sections, and reconcile only generated items when the owner explicitly updates the list.

Add a `/meal-plan` React route that loads one week at a time, reuses the existing recipe-search service for selection, and links planned recipes to their established detail and Cooking Mode routes. The page will keep server state authoritative: it refetches or uses successful mutation responses rather than relying on unverified optimistic changes.

## Key decisions

### KD-01 — Persist one plan record per Sunday week

- **Choice:** Store a `meal_plan_weeks` record keyed by the Sunday `YYYY-MM-DD` date and child `meal_plan_entries` keyed by day index 0–6.
- **Rationale:** It supports previous and next weeks, prevents duplicate dinner slots, and keeps the feature aligned with the single-owner D1 model.
- **Alternatives considered:** A browser-only weekly draft; one wide table with seven nullable recipe columns.
- **Consequences:** Date helpers must consistently calculate local Sunday keys; normalized child rows allow later meal types without changing the core week record.

### KD-02 — Store grocery lists as editable snapshots

- **Choice:** Persist generated and custom list items separately from current recipe ingredients, plus plan and generated revision markers on the week.
- **Rationale:** An explicit update must retain custom items and eligible checked states while reflecting changed recipes; reading recipes live cannot provide that behavior.
- **Alternatives considered:** Compute a list on every page load; overwrite the entire list automatically after a plan mutation.
- **Consequences:** Generated items may intentionally be stale until Update grocery list is selected, and the UI must disclose that state.

### KD-03 — Normalize only exact ingredient-line matches

- **Choice:** Collapse trimmed, whitespace-normalized, case-insensitive `original_text` matches, retaining one display line, occurrence count, and contributor-title snapshot.
- **Rationale:** It is deterministic, preserves recipe wording, and avoids unsafe quantity arithmetic.
- **Alternatives considered:** Merge parsed ingredient fields and quantities; retain all duplicate lines.
- **Consequences:** Equivalent but differently written ingredients remain separate; a future conversion feature can replace this builder behind its domain boundary.

### KD-04 — Mark plan changes through revision comparison

- **Choice:** Increment a plan revision for assignment changes and recipe-deletion cleanup; mark a list stale when its generated revision differs from the current plan revision.
- **Rationale:** It makes explicit refresh state reliable without mutating shopping items during ordinary plan edits.
- **Alternatives considered:** Timestamp comparisons; an untracked boolean set only in browser requests.
- **Consequences:** The migration needs D1 triggers or repository-controlled cleanup to cover recipe deletes, and tests must prove deletion marks affected weeks stale.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `migrations/0011_meal_planning_grocery_lists.sql` | Add weekly plan, meal assignment, and grocery item persistence with indexes, constraints, and revision handling. | R-01–R-09 |
| `src/domain/meal-plan/*` | Add typed week, dinner assignment, grocery item, request validation, date, normalization, and deterministic grouping/classification contracts. | R-01, R-05, R-06 |
| `worker/repositories/meal-plans.ts` | Read and mutate one week; build/reconcile groceries with bound D1 statements. | US-01–US-04 |
| `worker/routes/meal-plans.ts`, `worker/index.ts` | Add narrow, method-specific `/api/meal-plans` routes and safe validation/not-found responses. | R-02–R-09 |
| `src/services/meal-plans.ts` | Add typed same-origin browser requests and consistent safe error mapping. | US-01–US-04 |
| `src/pages/MealPlanPage.tsx`, `src/components/meal-plan/*` | Add responsive weekly planning, recipe selection, grocery generation/update, and checklist UI. | AC-01.1–AC-04.4 |
| `src/app/router.tsx`, `src/app/AppShell.tsx`, optionally `src/pages/RecipeDetailPage.tsx` | Add plan route/navigation and a discoverable entry point from recipe context. | AC-01.5 |
| `tests/{worker,integration,component,e2e}/meal-planning*` | Add focused unit, Worker, D1, component, and responsive browser coverage. | All current ACs |

## Technical detail

### Data model and reconciliation

`meal_plan_weeks` holds `week_start`, `plan_revision`, `grocery_generated_revision` (nullable until generated), and timestamps. `meal_plan_entries` holds `week_start`, a constrained `day_index`, and `recipe_id`, unique by week/day, with a foreign key that cleans up deleted recipes. D1 trigger or repository logic increments the parent revision after any assignment change, including deletion caused by recipe removal.

`grocery_list_items` holds an item ID, week, display text, normalized key when generated, section, checked state, custom/generated flag, occurrence count, contributor title snapshot, and timestamps. Generation loads only current assigned recipes and `recipe_ingredients.original_text`; it builds keyed groups in application code, carries forward checked state for matching generated keys, deletes old generated rows, and inserts the rebuilt groups in one bounded D1 batch. Custom rows are never replaced by generation.

Proposed API contract:

| Method and path | Purpose |
|---|---|
| `GET /api/meal-plans?week=YYYY-MM-DD` | Read one normalized Sunday-based week with dinners, grocery snapshot, and stale state. |
| `PUT /api/meal-plans/:week/dinners/:dayIndex` | Assign or replace one saved recipe after validating its existence. |
| `DELETE /api/meal-plans/:week/dinners/:dayIndex` | Remove one assigned dinner. |
| `POST /api/meal-plans/:week/grocery-list` | Generate a first list or explicitly reconcile a stale/current one. |
| `POST /api/meal-plans/:week/grocery-items` | Add one non-empty custom grocery item. |
| `PATCH /api/meal-plans/:week/grocery-items/:itemId` | Change checked state only. |
| `DELETE /api/meal-plans/:week/grocery-items/:itemId` | Remove one list item. |

The Worker validates the canonical Sunday week key and day indexes before database access, treats unknown recipe/item/week targets as safe 404s, and emits no AI or external-provider request. The browser derives previous, next, and current week keys locally but receives canonical week data from the Worker.

## Risks and mitigations

| Risk | Impact | Mitigation | Evidence or trigger |
|---|---|---|---|
| Recipe deletion silently leaves a current grocery list misleading. | Shopping list can contain removed-recipe ingredients. | Cascade assignment cleanup increments plan revision; list displays stale until explicit update. | D1 integration test deletes a planned recipe and reloads the week. |
| Ingredient wording varies despite equivalent foods. | List contains apparent duplicates. | Restrict MVP consolidation to documented exact normalized matches; display contributors. | Unit tests cover matching and intentionally nonmatching examples. |
| Week boundary differs near timezone changes. | Owner opens an unexpected week. | Use one tested local-date helper and canonical Sunday string everywhere. | Unit/component tests exercise Sunday, Monday, year-end, and navigation. |
| Refresh destroys shopping progress. | Owner loses trust in the list. | Reconcile generated rows by normalized key and preserve custom rows/checked state. | Integration and E2E update tests. |

## Implementation phases

### Phase 1 — Durable weekly-plan and grocery-list API

- [ ] **P1-T1 — Add validated meal-plan domain primitives and the D1 migration**
  - Covers: R-01, R-03, R-05, R-06, R-07, R-08, R-09; AC-01.1, AC-02.3, AC-02.4, AC-03.3, AC-03.4
  - Depends on: None
  - Work: Define typed DTOs, week/day validation, Sunday-date helpers, normalization and section classifier; add versioned D1 tables, foreign keys, checks, indexes, and revision maintenance.
  - Verify: Domain unit tests and migration application against local D1 prove valid constraints, Sunday validation, normalization, and classification behavior.

- [ ] **P1-T2 — Implement repository reads, dinner mutations, and stale-state calculation**
  - Covers: US-01; AC-01.2, AC-01.3, AC-01.4; AC-03.1
  - Depends on: P1-T1
  - Work: Add bound D1 repository operations for one week, recipe existence checks, assignment replacement/removal, and recipe-delete cleanup/revision behavior.
  - Verify: Local D1 integration tests reload persisted weeks, navigate dates, replace/remove dinners, and verify a changed plan becomes stale after list generation.

- [ ] **P1-T3 — Implement deterministic grocery generation and checklist mutations**
  - Covers: US-02, US-03, US-04; AC-02.1, AC-02.2, AC-02.3, AC-02.4, AC-02.5, AC-03.2, AC-03.3, AC-03.4, AC-04.1, AC-04.2, AC-04.3, AC-04.4
  - Depends on: P1-T1, P1-T2
  - Work: Build grouped generated rows from planned recipes; implement explicit reconciliation, custom-item creation, check mutation, and single-item removal.
  - Verify: Unit and local D1 tests cover empty plans, repeated recipes, contributor snapshots, custom-item retention, checked-state preservation, and idempotent repeated updates.

- [ ] **P1-T4 — Expose safe Worker routes and typed browser service methods**
  - Covers: R-02, R-04, R-07–R-09; NFR-03, NFR-05, NFR-06
  - Depends on: P1-T2, P1-T3
  - Work: Dispatch the proposed routes, validate request bodies/params, map safe errors, and add `src/services/meal-plans.ts` without changing existing recipe contracts.
  - Verify: Worker tests prove methods, malformed dates/day indexes/bodies, missing targets, and successful response shapes; test doubles assert no external provider calls.

### Phase 2 — Weekly planning and grocery-list user experience

- [ ] **P2-T1 — Build the accessible responsive Meal Plan page and recipe assignment flow**
  - Covers: US-01; AC-01.1–AC-01.5; NFR-01, NFR-02, NFR-03
  - Depends on: P1-T4
  - Work: Add `/meal-plan`, primary navigation, weekly controls, seven dinner slots, saved-recipe chooser/search, replace/remove controls, and detail/Cooking Mode links with semantic loading/error/empty states.
  - Verify: Component tests exercise navigation and slot mutations; Playwright verifies primary flow at 320, 768, and 1440 pixels.

- [ ] **P2-T2 — Build the grocery generation, freshness, and checklist interface**
  - Covers: US-02–US-04; AC-02.1–AC-04.4; NFR-01–NFR-04, NFR-06
  - Depends on: P1-T4, P2-T1
  - Work: Render generate/update calls, stale messaging, nonempty sections, contributor context, checkboxes, custom-item form, remove controls, and recovery states.
  - Verify: Component tests prove visible state transitions and mutation errors; Playwright plans recipes, generates, checks/adds/removes items, changes the plan, and updates without horizontal scrolling.

### Phase 3 — Regression evidence and deployment readiness

- [ ] **P3-T1 — Run migration and feature regression verification**
  - Covers: All current-release stories and NFRs
  - Depends on: P2-T1, P2-T2
  - Work: Apply the migration locally, run focused suites plus existing recipe, search, and Cooking Mode regression tests; build/typecheck/lint the production bundle.
  - Verify: Passing commands and a clean responsive local walkthrough; no prior critical test regression.

- [ ] **P3-T2 — Prepare production rollout and rollback record**
  - Covers: NFR-03, NFR-05, NFR-06
  - Depends on: P3-T1
  - Work: Validate migration order against production, deploy the Worker/static-assets bundle, and smoke-test the protected hostname with a non-destructive weekly plan.
  - Verify: Production migration/deploy success and owner confirmation that the protected `/meal-plan` flow works; no new secrets or provider configuration required.

## Release and rollback considerations

- **Release:** Apply `0011_meal_planning_grocery_lists.sql` to production D1 before or as part of the standard Wrangler migration/deploy sequence, then deploy the Worker and SPA together. This feature introduces no new secret, R2, AI, or external-provider binding.
- **Rollback:** Preserve the additive D1 tables and disable the UI/route deployment by returning to the prior Worker/static-assets version if necessary. Do not delete plan or grocery rows during rollback; a compatible redeploy can restore access and retains the owner's data.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-02 | Initial draft | Derived from approved specification | All |
