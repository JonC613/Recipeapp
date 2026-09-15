---
feature: cooking-history-feedback
artifact: plan
status: done
owner: user
version: 0.1
created: 2026-09-11
updated: 2026-09-11
spec_version: 0.1
---

# Implementation Plan: Cooking History and Feedback

## Technical approach

Create an additive `recipe_cook_logs` D1 table keyed by log ID and recipe ID. Repository reads aggregate it for summaries and load detail logs separately; create/delete use recipe-scoped functions and return a refreshed recipe DTO. Add explicit Worker routes, typed browser methods, and a detail-page form/history panel. Existing summary data feeds cards and Meal Plan option labels, avoiding new page fetches or providers.

## Key decisions

### KD-01 — Immutable, server-timestamped log entries

- **Choice:** Create-only entries use the Worker clock; a mistaken entry is deleted and, if needed, re-entered.
- **Rationale:** Keeps the data model and interaction unambiguous while fulfilling current outcome tracking.
- **Alternatives considered:** Editable or user-dated records.
- **Consequences:** Backdating and correction-in-place remain deferred.

### KD-02 — Aggregates on existing DTOs

- **Choice:** Return `cookCount`, `lastCookedAt`, and nullable `averageRating` with summaries; return full `cookLogs` only in detail.
- **Rationale:** Limits notes to the detail route and lets existing browse/plan data serve the new signals.
- **Alternatives considered:** Separate analytics endpoint or client-computed history.
- **Consequences:** Repository queries must preserve one recipe row per summary and aggregates update after every mutation.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `migrations/0013_recipe_cook_logs.sql`, `tests/recipe-migration.ts` | Add D1 table, FK cascade, checks, and test schema parity. | US-01, US-02, NFR-02, NFR-04 |
| `worker/repositories/recipes.ts`, `worker/routes/recipes.ts`, `worker/index.ts` | Return aggregates/history and safely dispatch cook-log mutations. | US-01–US-03, NFR-01–02 |
| `src/services/recipes.ts` | Model cooking DTOs and API methods. | US-01–US-03 |
| `src/pages/RecipeDetailPage.tsx`, `src/components/recipes/RecipeCard.tsx`, `src/pages/MealPlanPage.tsx` | Record, display, delete, and surface aggregate signals. | US-01–US-03, NFR-03 |

## Technical detail

`recipe_cook_logs` stores `id`, `recipe_id`, `rating` nullable with `CHECK (rating BETWEEN 1 AND 5)`, `note` nullable, and `cooked_at`. An index on `(recipe_id, cooked_at DESC)` supports detail history and summary aggregation; the foreign key cascades on recipe deletion.

| Method and path | Purpose |
|---|---|
| `POST /api/recipes/:recipeId/cook-logs` | Create one timestamped entry after validating nullable rating/note. |
| `DELETE /api/recipes/:recipeId/cook-logs/:logId` | Remove exactly one log belonging to that recipe. |

## Risks and mitigations

| Risk | Impact | Mitigation | Evidence or trigger |
|---|---|---|---|
| Aggregates duplicate recipe rows or expose notes in listings. | Misleading or overbroad data. | Correlated aggregate subqueries and DTO-specific projections. | Worker/integration response assertions. |
| Mistaken cook logs reduce trust. | Inaccurate planning context. | Per-entry deletion and refreshed aggregates. | Component/D1 deletion tests. |

## Implementation phases

### Phase 1 — Durable cooking-history contract

- [x] **P1-T1 — Add cook-log persistence and repository projections**
  - Covers: US-01, US-02, US-03; AC-01.2, AC-02.1, AC-02.2, AC-03.1, NFR-01, NFR-02, NFR-04
  - Depends on: None
  - Work: Add additive migration/test schema, domain DTOs, aggregate/detail hydration, and scoped create/delete repository functions.
  - Verify: Local D1 tests prove ordering, aggregates, rating bounds, and recipe-delete cascade.

- [x] **P1-T2 — Expose validated cook-log API and browser service**
  - Covers: US-01, US-02; AC-01.1–AC-01.3, AC-02.2, NFR-01–02
  - Depends on: P1-T1
  - Work: Add route dispatch, safe errors, request validation, and typed service calls.
  - Verify: Worker tests cover success, malformed input, missing recipe/log, and no unintended writes.

### Phase 2 — Outcome-aware recipe experience

- [x] **P2-T1 — Build accessible history recording and correction UI**
  - Covers: US-01, US-02; AC-01.1–AC-02.2, NFR-03
  - Depends on: P1-T2
  - Work: Add detail-page form, success/error retention, newest-first entries, and delete action.
  - Verify: Component tests cover empty, record, failed submission, and deletion states.

- [x] **P2-T2 — Surface compact cooking signals while browsing and planning**
  - Covers: US-03; AC-03.1–AC-03.2, NFR-03
  - Depends on: P1-T2
  - Work: Render aggregate summary on cards and Meal Plan option labels without changing plan mutations.
  - Verify: Component/E2E tests assert truthful labels and unchanged assignment calls.

### Phase 3 — Regression evidence and memory

- [x] **P3-T1 — Run feature and regression validation; update Project Memory**
  - Covers: All current-release IDs
  - Depends on: P2-T1, P2-T2
  - Work: Run focused checks and record durable architecture/capability changes in `.sdd/memory`.
  - Verify: Passing commands, LiteSpec validation, and memory verification.

## Release and rollback considerations

- **Release:** Apply `0013_recipe_cook_logs.sql` before or with compatible Worker and SPA deployment; no new secret or provider configuration is required.
- **Rollback:** Preserve additive rows and return to the prior compatible Worker/static asset deployment if necessary; do not delete cook history.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-11 | Initial implementation plan | User-authorized feature | All |
