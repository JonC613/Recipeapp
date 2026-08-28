---

description: "Task list for Recipe Library CRUD implementation"
---

# Tasks: Recipe Library CRUD

**Input**: Design documents from `/specs/002-recipe-library/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Tests**: Required by the approved specification and project constitution. Write each story's
tests before its implementation tasks and confirm they fail for the expected missing behavior.

**Organization**: Tasks are grouped by user story so every completed phase is a working vertical
slice. All database work uses local simulated D1 state.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes a different file and has no incomplete dependency.
- **[Story]**: The user story this task supports (`US1`, `US2`, or `US3`).
- All paths are repository-relative.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Activate version-controlled D1 migration and recipe test support without product UI.

- [X] T001 Add local D1 migration commands and a `preview_database_id` for `DB` in `package.json` and `wrangler.jsonc`.
- [X] T002 [P] Add a reusable local migration setup helper in `tests/worker/setup.ts` and `tests/integration/setup.ts`.
- [X] T003 [P] Reserve the Feature 002 source, Worker, and test locations from `plan.md` by creating their module entry files under `src/domain/recipe/`, `src/components/recipes/`, `worker/repositories/`, and `tests/`.

**Checkpoint**: The project can apply the future migration only to local simulated D1 state.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the stable domain, schema, and safe persistence primitives required by every
recipe journey.

**⚠️ CRITICAL**: Complete this phase before beginning user-story work.

- [X] T004 Write failing domain validation and normalization tests for manual recipes, ingredient original text/order, instruction order, tag trimming, and safe numeric fields in `tests/worker/recipes.test.ts`.
- [X] T005 Create the initial recipes, ingredients, instructions, and tags schema with ownership-reserved column, ordering constraints, and cascading foreign keys in `migrations/0001_recipe_library.sql`.
- [X] T006 Implement the application-owned Recipe, RecipeIngredient, RecipeInstruction, RecipeSource, and input-validation shapes in `src/domain/recipe/schema.ts` and `src/domain/recipe/validation.ts`.
- [X] T007 Implement reusable safe validation and missing-recipe response helpers in `worker/http.ts` and cover their public JSON shapes in `tests/worker/http.test.ts`.
- [X] T008 Verify the migration applies to isolated local D1 state and its required tables/constraints are present in `tests/integration/recipes.test.ts`.

**Checkpoint**: Recipe data has a committed local schema, validated domain boundary, and safe Worker
error contract; no recipe user interface exists yet.

---

## Phase 3: User Story 1 - Save and Read a Manual Recipe (Priority: P1) 🎯 MVP

**Goal**: A cook can create a titled manual recipe, save it durably, find it in the library, and
read its cooking-friendly detail view with entered list order preserved.

**Independent Test**: From an empty local library, save a recipe with an ingredient, instruction,
metadata, tag, and note; reopen it from the library; and verify all persisted values and order.

### Tests for User Story 1

- [X] T009 [P] [US1] Write failing Worker route tests for recipe list, create, get, validation failure, and missing-record responses in `tests/worker/recipes.test.ts`.
- [X] T010 [P] [US1] Write failing built-Worker D1 integration tests for create/list/get persistence and child ordering in `tests/integration/recipes.test.ts`.
- [X] T011 [P] [US1] Write failing form and card component tests for required title, ingredient original text, and instruction controls in `tests/component/recipe-form.test.tsx`.
- [X] T012 [US1] Write a failing empty-library-to-create-to-detail desktop/mobile journey in `tests/e2e/recipe-library.spec.ts`.

### Implementation for User Story 1

- [X] T013 [US1] Implement D1 recipe create, list, and get operations with bound SQL parameters and ordered child reconstruction in `worker/repositories/recipes.ts`.
- [X] T014 [US1] Implement `GET /api/recipes`, `POST /api/recipes`, and `GET /api/recipes/:recipeId` in `worker/routes/recipes.ts` and register them in `worker/index.ts`.
- [X] T015 [US1] Implement typed browser recipe list/create/get requests and safe error mapping in `src/services/recipes.ts`.
- [X] T016 [P] [US1] Implement reusable recipe-card summary rendering in `src/components/recipes/RecipeCard.tsx`.
- [X] T017 [US1] Implement reusable manual-recipe form controls, ordered ingredient/instruction editing, and field errors in `src/components/recipes/RecipeForm.tsx`.
- [X] T018 [US1] Implement the manual recipe editor page and save-success navigation in `src/pages/RecipeEditorPage.tsx`.
- [X] T019 [US1] Implement the recipe library empty/populated states and create action in `src/pages/RecipeLibraryPage.tsx`.
- [X] T020 [US1] Implement the cooking-friendly recipe detail page with safe missing-record recovery in `src/pages/RecipeDetailPage.tsx`.
- [X] T021 [US1] Register create, library, and detail routes in `src/app/router.tsx` and add responsive recipe page styles in `src/app/styles.css`.

**Checkpoint**: US1 is independently demonstrable with local D1 persistence and its Worker,
integration, component, and E2E tests pass.

---

## Phase 4: User Story 2 - Maintain a Saved Recipe (Priority: P2)

**Goal**: A cook can edit all manual-recipe fields, toggle favorite state, and permanently delete a
recipe only after explicit confirmation.

**Independent Test**: Edit a saved recipe and a child list item, save, favorite/unfavorite it, then
confirm deletion and verify that its former detail address is safely missing.

### Tests for User Story 2

- [X] T022 [P] [US2] Write failing Worker route tests for update, favorite, delete, confirmation-safe missing behavior, and invalid updates in `tests/worker/recipes.test.ts`.
- [X] T023 [P] [US2] Extend local D1 integration coverage for atomic replacement of child records, favorite persistence, and cascaded deletion in `tests/integration/recipes.test.ts`.
- [X] T024 [US2] Extend the end-to-end journey for edit, favorite/unfavorite, cancel-delete, confirm-delete, and missing-detail recovery in `tests/e2e/recipe-library.spec.ts`.

### Implementation for User Story 2

- [X] T025 [US2] Implement transactional recipe replacement, favorite update, and permanent deletion operations in `worker/repositories/recipes.ts`.
- [X] T026 [US2] Implement `PUT /api/recipes/:recipeId`, `PATCH /api/recipes/:recipeId/favorite`, and `DELETE /api/recipes/:recipeId` in `worker/routes/recipes.ts` and `worker/index.ts`.
- [X] T027 [US2] Add typed update, favorite, and deletion requests to `src/services/recipes.ts`.
- [X] T028 [US2] Reuse the editor form for existing recipes and save revisions in `src/pages/RecipeEditorPage.tsx`.
- [X] T029 [US2] Add favorite controls and a cancellation-safe delete confirmation to `src/pages/RecipeDetailPage.tsx`, `src/pages/RecipeLibraryPage.tsx`, and `src/app/styles.css`.
- [X] T030 [US2] Register the recipe edit route and verify post-delete navigation in `src/app/router.tsx`.

**Checkpoint**: US1 and US2 work independently; all edit, favorite, and delete paths preserve or
remove D1 data exactly as specified.

---

## Phase 5: User Story 3 - Find a Recipe by Title (Priority: P3)

**Goal**: A cook can case-insensitively filter the library by a trimmed partial title query and
recover from no-match results.

**Independent Test**: Save distinct titles, query by a differently cased title fragment, verify only
matches; clear the query; then verify all recipes return.

### Tests for User Story 3

- [X] T031 [P] [US3] Add failing Worker and D1 tests for trimmed, case-insensitive partial title filtering and no-match list responses in `tests/worker/recipes.test.ts` and `tests/integration/recipes.test.ts`.
- [X] T032 [US3] Extend the E2E journey for title-filter matching, empty results, clear-filter recovery, and mobile reflow in `tests/e2e/recipe-library.spec.ts`.

### Implementation for User Story 3

- [X] T033 [US3] Extend the recipe list query with a bound, case-insensitive trimmed title filter in `worker/repositories/recipes.ts`.
- [X] T034 [US3] Validate and forward the optional list query in `worker/routes/recipes.ts` and `src/services/recipes.ts`.
- [X] T035 [US3] Add the title filter input, no-match state, and clear action to `src/pages/RecipeLibraryPage.tsx` and responsive styles to `src/app/styles.css`.

**Checkpoint**: All three user stories are independently demonstrable and the library remains usable
at the approved desktop and mobile viewport widths.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify the completed feature, update documentation, and preserve local-only safety.

- [X] T036 [P] Validate every endpoint example and safe error response against `specs/002-recipe-library/contracts/recipes.openapi.yaml` in `tests/worker/recipes.test.ts`.
- [X] T037 [P] Run accessibility and responsive regression checks at 320, 768, and 1440 CSS pixels in `tests/e2e/recipe-library.spec.ts` and record results in `specs/002-recipe-library/quickstart.md`.
- [X] T038 Run the complete local validation sequence from `specs/002-recipe-library/quickstart.md` and correct only Feature 002 regressions in affected source, Worker, test, migration, or configuration files.
- [X] T039 Update manual recipe setup, local migration, and recovery guidance in `README.md`, then verify all paths and acceptance evidence agree with `specs/002-recipe-library/plan.md`.
- [ ] T040 Update the approved Adaptive SDD Project Memory proposal for the durable Recipe Library architecture only after all Feature 002 acceptance evidence passes; apply it only after a separate owner approval.

**Checkpoint**: Feature 002 is done only after every acceptance criterion and relevant local test
passes, the migration is committed, docs are current, and the required Project Memory update has
been separately approved.

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: starts immediately.
- **Phase 2 — Foundational**: starts after Setup and blocks every user story.
- **Phase 3 — US1**: starts after Foundational and is the MVP vertical slice.
- **Phase 4 — US2**: depends on US1's persisted recipe and shared editor/details flow.
- **Phase 5 — US3**: depends on US1's library query and can begin after the list flow is stable.
- **Phase 6 — Polish**: starts after all desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational work; no import, AI, or authentication dependency.
- **US2 (P2)**: Depends on US1 because it edits and deletes a saved recipe.
- **US3 (P3)**: Depends on US1 because it filters the saved recipe library.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004 and T005 can start in parallel; T006 follows their domain/schema decisions.
- T009, T010, and T011 can run in parallel; T012 follows the shared E2E foundation.
- T016 can run alongside the Worker API work once the domain shape is available.
- T022 and T023 can run in parallel before US2 implementation.
- T031 can run in parallel across its two named test files before T032.
- T036 and T037 can run in parallel after all story work.

## Parallel Example: User Story 1

```text
Task: "Write Worker route tests in tests/worker/recipes.test.ts"
Task: "Write D1 integration tests in tests/integration/recipes.test.ts"
Task: "Write recipe form tests in tests/component/recipe-form.test.tsx"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational work.
2. Complete US1 through the manual form, Worker API, local D1, library, and detail flow.
3. Run US1's Worker, integration, component, and E2E evidence before adding maintenance or search.

### Incremental Delivery

1. US1 establishes durable manual recipe creation and reading.
2. US2 adds corrections, favorites, and deliberate deletion.
3. US3 adds the narrow title rediscovery flow without pre-building broader search.
4. Polish verifies the complete local-only feature and proposes the Project Memory update.

## Notes

- All tasks use the required checkbox, ID, optional parallel marker, story label, and exact-path format.
- T040 is intentionally a separate Project Memory approval gate; it does not authorize a memory write.
- This feature must not deploy remotely or add import, AI, authentication, or broad-search behavior.
