# Tasks: Browse and Save TheMealDB Recipes

**Input**: [spec.md](spec.md) and [plan.md](plan.md)

**Tests**: Component, Worker, D1 integration, and Playwright coverage are required by the approved
specification and the Recipeapp constitution. Automated tests use controlled provider responses and make no
live TheMealDB request.

**Organization**: Tasks are grouped by user story. Each implementation phase is a complete vertical slice
through browser UI, Worker API, and its relevant persistence boundary.

## Phase 1: Feature Foundation

**Purpose**: Establish the narrow provider boundary, reusable controlled fixtures, safe contract, and
backward-compatible import provenance before visible provider behavior is added.

- [X] T001 Document the confirmed official API endpoints, response bounds, attribution, error behavior, and
  personal-MVP access assumption in `specs/009-mealdb-browse-import/research.md`,
  `specs/009-mealdb-browse-import/contracts/mealdb-import.md`, and
  `specs/009-mealdb-browse-import/quickstart.md`
- [X] T002 [P] Add controlled complete, sparse, empty, malformed, and unavailable TheMealDB response
  fixtures in `tests/fixtures/mealdb/`
- [X] T003 [P] Define application-owned transient browse/detail DTOs and extend only the import contracts
  needed for `mealdb` provenance in `src/domain/recipe/imports.ts` and
  `src/domain/recipe/mealdb.ts`
- [X] T004 Create the Worker-only TheMealDB client boundary with URL construction, response-size limits,
  safe provider error mapping, and deterministic ingredient/measure normalization in
  `worker/services/mealdb/mealdb-client.ts`
- [X] T005 [P] Add client normalization and failure-mapping tests using the controlled fixtures in
  `tests/worker/mealdb-client.test.ts`
- [X] T006 Register typed, allow-listed Worker routes for provider browse, search, and detail projections in
  `worker/routes/mealdb.ts` and `worker/index.ts`
- [X] T007 [P] Add Worker validation tests for blank/invalid criteria, bounded safe projections, and
  unavailable provider responses in `tests/worker/mealdb-import.test.ts`

**Checkpoint**: The provider boundary is deterministic, testable, does not call AI, and exposes no raw
provider payload or credentials.

---

## Phase 2: User Story 1 - Browse a Recipe Collection (Priority: P1) 🎯 MVP

**Goal**: The owner can open TheMealDB browse from Add Recipe, select a category or area, and see a
mobile-friendly bounded list with clear empty and recovery states.

**Independent Test**: From Add Recipe, select one controlled category or area and confirm result cards are
shown without creating a Recipeapp import or recipe at 320, 768, and 1440 CSS pixels.

### Tests for User Story 1

- [X] T008 [P] [US1] Add component coverage for browse entry, category/area selection, list, empty, and
  provider-unavailable states in `tests/component/mealdb-browse.test.tsx`
- [X] T009 [P] [US1] Add a responsive browse journey that asserts no import or recipe is created in
  `tests/e2e/mealdb-import.spec.ts`

### Implementation for User Story 1

- [X] T010 [US1] Add the Browse TheMealDB entry point and route from
  `src/pages/RecipeImportPage.tsx` in `src/App.tsx`
- [X] T011 [US1] Add typed browser calls for provider facets and bounded browse summaries in
  `src/services/mealdb.ts`
- [X] T012 [US1] Implement accessible category/area controls, result cards, and recovery states in
  `src/pages/MealDbBrowsePage.tsx`, `src/components/imports/MealDbBrowse.tsx`, and
  `src/app/styles.css`

**Checkpoint**: The owner can browse TheMealDB without persistent side effects.

---

## Phase 3: User Story 2 - Search and Preview One Recipe (Priority: P1)

**Goal**: The owner can search by name, open one safe provider preview, and leave it without creating an
import or recipe.

**Independent Test**: Search a controlled recipe name, open its preview, return to results, and verify D1
has no new import or recipe record.

### Tests for User Story 2

- [X] T013 [P] [US2] Add name-search, preview, no-result, and leave-without-import component coverage in
  `tests/component/mealdb-browse.test.tsx`
- [X] T014 [P] [US2] Add Worker tests proving safe detail DTOs and no D1 write on search/detail in
  `tests/worker/mealdb-import.test.ts`
- [X] T015 [P] [US2] Add responsive name-search and preview-without-import journeys in
  `tests/e2e/mealdb-import.spec.ts`

### Implementation for User Story 2

- [X] T016 [US2] Extend the Worker routes and client for validated name search and one provider-recipe
  detail projection in `worker/routes/mealdb.ts` and `worker/services/mealdb/mealdb-client.ts`
- [X] T017 [US2] Add typed search/detail calls and preview state handling in `src/services/mealdb.ts` and
  `src/pages/MealDbBrowsePage.tsx`
- [X] T018 [US2] Render an attributed, readable recipe preview with a Back action and an explicit Import
  action in `src/components/imports/MealDbBrowse.tsx` and `src/app/styles.css`

**Checkpoint**: Search and preview are useful independently and remain transient.

---

## Phase 4: User Story 3 - Review and Save a TheMealDB Recipe (Priority: P1)

**Goal**: The owner explicitly imports one selected provider recipe into the existing review form, edits it,
and saves one approved Recipeapp recipe with retained provenance.

**Independent Test**: Select a controlled preview, import it, edit one field during review, save it, and
verify the library/detail shows the edit while D1 retains the immutable provider import snapshot.

### Tests for User Story 3

- [X] T019 [P] [US3] Add migration compatibility and TheMealDB import/approval retention tests in
  `tests/integration/mealdb-import.test.ts` and `tests/recipe-migration.ts`
- [X] T020 [P] [US3] Add Worker tests for explicit provider import, safe provider failure, and exactly-one
  approval behavior in `tests/worker/mealdb-import.test.ts`
- [X] T021 [P] [US3] Add the complete browse → preview → import → review/edit → save journey at 320, 768,
  and 1440 CSS pixels in `tests/e2e/mealdb-import.spec.ts`

### Implementation for User Story 3

- [X] T022 [US3] Add backward-compatible `mealdb` source support and immutable provider-recipe reference
  to `recipe_imports` in `migrations/0007_mealdb_imports.sql`, and record its design in
  `specs/009-mealdb-browse-import/data-model.md`
- [X] T023 [US3] Extend D1 import creation, retrieval, and approval-to-recipe source mapping for `mealdb`
  imports in `worker/repositories/imports.ts` and `src/domain/recipe/imports.ts`
- [X] T024 [US3] Add `POST /api/import/mealdb`, which validates one provider identifier, fetches detail
  through the Worker client, creates a ready import only after explicit action, and returns the existing
  review projection in `worker/routes/imports.ts` and `worker/index.ts`
- [X] T025 [US3] Connect the preview’s Import action to the typed endpoint and existing review route in
  `src/services/mealdb.ts`, `src/pages/MealDbBrowsePage.tsx`, and `src/App.tsx`
- [X] T026 [US3] Display TheMealDB attribution and retained source information consistently in
  `src/components/imports/ImportReviewForm.tsx`, `src/pages/RecipeDetailPage.tsx`, and associated styles

**Checkpoint**: A provider recipe is never saved automatically and a reviewed saved recipe preserves its
TheMealDB provenance.

---

## Phase 5: Cross-Cutting Verification and Documentation

**Purpose**: Prove the full feature, preserve security and attribution boundaries, and complete the
approved documentation lifecycle.

- [X] T027 Run focused component, Worker, migration/integration, and Playwright suites; then run existing
  import/review/search regression suites, `npm run cf-typecheck`, `npm run build`, and
  `npm run validate-config`
- [X] T028 Review browser and API outputs to verify provider data is attributed, source snapshots are not
  exposed by search, no raw provider payload/credentials are visible, and browse/preview create no D1
  records before explicit import
- [X] T029 Update implementation discoveries, verified endpoint contract, data model, and manual test steps
  in `specs/009-mealdb-browse-import/`
- [X] T030 Propose and, after separate owner approval, apply the smallest durable Feature 009 Project Memory
  update in `.sdd/memory/`, then run the Project Memory verifier

---

## Dependencies and Execution Order

- Phase 1 blocks all user stories because the typed provider boundary and controlled fixtures are required
  for safe implementation and testing.
- US1 (Phase 2) establishes the independently valuable browse vertical slice.
- US2 (Phase 3) builds on the provider UI/client but has no D1 persistence.
- US3 (Phase 4) depends on the preview from US2 and is the only phase that changes D1/import history.
- Phase 5 follows all three stories. T030 always needs a separate owner approval before any memory write.

## Parallel Opportunities

- T002, T003, T005, and T007 can proceed in parallel once the provider-client interface is agreed.
- T008–T009, T013–T015, and T019–T021 are independent test tasks within their respective stories.
- T022 must precede T023–T025; T026 can begin after source data is available.

## Implementation Strategy

1. Finish the narrow provider boundary and prove it with controlled fixtures.
2. Deliver browse-only behavior and validate it before adding search/preview.
3. Add search/preview and validate its no-write guarantee.
4. Add the one migration and explicit import/review/save vertical slice.
5. Run the full regression, perform manual checks, then propose Project Memory updates.

## Notes

- The tasks deliberately exclude TheMealDB website scraping, AI extraction, provider image storage,
  nutrition, grocery lists, additional providers, automatic deployments, and automatic database migrations.
- A future public or multi-user launch requires a separately approved provider-access and terms review.
