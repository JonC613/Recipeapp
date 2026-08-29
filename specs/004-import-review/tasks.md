---

description: "Task list for import review and explicit recipe approval"
---

# Tasks: Import Review and Save

**Input**: Design documents from `/specs/004-import-review/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Tests**: Required by the approved specification and constitution. Write each story's tests before
its implementation and confirm they fail for the missing behavior.

## Phase 1: Setup

**Purpose**: Establish Feature 004 test and source entry points.

- [X] T001 Add Feature 004 review page, review form, import approval service, migration, and test entry files under `src/`, `worker/`, `migrations/`, and `tests/`.

---

## Phase 2: Foundational

**Purpose**: Establish the one-time, provenance-preserving approval boundary that blocks all review stories.

- [X] T002 Add the `approved_recipe_id` migration and migration-test schema coverage in `migrations/0003_import_approvals.sql` and `tests/recipe-migration.ts`.
- [X] T003 Extend stable recipe source/favorite and import approval shapes in `src/domain/recipe/schema.ts` and `src/domain/recipe/imports.ts`.
- [X] T004 Extend recipe persistence to create a reviewed URL-sourced recipe with favorite state in `worker/repositories/recipes.ts`.
- [X] T005 Implement atomic ready-import approval, immutable import retrieval, and duplicate detection in `worker/repositories/imports.ts`.

**Checkpoint**: A ready import can be converted once into a distinct URL-sourced recipe without mutating its snapshot.

---

## Phase 3: User Story 1 - Review and Save an Imported Recipe (Priority: P1) 🎯 MVP

**Goal**: A cook opens a ready import, explicitly saves it, and reaches the newly created library recipe.

**Independent Test**: A controlled ready import is reviewed and saved once; the result is a separate recipe while the original import remains unchanged.

### Tests for User Story 1

- [X] T006 [P] [US1] Add failing approval-contract and ready-import Worker route tests in `tests/worker/import-review.test.ts`.
- [X] T007 [P] [US1] Add failing Worker-to-D1 import-approval persistence tests in `tests/integration/import-review.test.ts`.
- [X] T008 [P] [US1] Add failing review form and save-result component coverage in `tests/component/import-review-form.test.tsx`.
- [X] T009 [P] [US1] Add failing ready-import-to-recipe browser journey in `tests/e2e/import-review.spec.ts`.

### Implementation for User Story 1

- [X] T010 [US1] Implement `POST /api/import/:importId/approve` ready-import handling and contract-safe responses in `worker/routes/imports.ts` and `worker/index.ts`.
- [X] T011 [US1] Add typed import approval requests and result retrieval in `src/services/imports.ts`.
- [X] T012 [US1] Add reusable review form behavior from a ready draft in `src/components/recipes/RecipeForm.tsx` and `src/components/imports/ImportReviewForm.tsx`.
- [X] T013 [US1] Implement ready-import loading, provenance display, explicit Save Recipe action, and success navigation in `src/pages/RecipeImportReviewPage.tsx`.
- [X] T014 [US1] Link a ready import result to review and register the review route in `src/components/imports/UrlImportForm.tsx`, `src/pages/RecipeImportResultPage.tsx`, and `src/app/router.tsx`.

**Checkpoint**: A ready URL draft can be reviewed and deliberately saved once as a source-preserving library recipe.

---

## Phase 4: User Story 2 - Correct an Imported Draft (Priority: P2)

**Goal**: A cook corrects any reviewable recipe field before approval without changing import history.

**Independent Test**: A controlled draft is edited before save; only the created recipe contains the edited title, metadata, ingredient text, instruction ordering, and favorite choice.

### Tests for User Story 2

- [X] T015 [P] [US2] Add failing Worker and integration coverage for reviewed field validation, URL source provenance, and immutable import snapshots in `tests/worker/import-review.test.ts` and `tests/integration/import-review.test.ts`.
- [X] T016 [P] [US2] Add failing component coverage for editable fields, favorite choice, and validation recovery in `tests/component/import-review-form.test.tsx`.
- [X] T017 [P] [US2] Add failing edited-draft browser journey in `tests/e2e/import-review.spec.ts`.

### Implementation for User Story 2

- [X] T018 [US2] Preserve reviewed favorite selection and URL source provenance through approval in `src/domain/recipe/schema.ts`, `worker/repositories/recipes.ts`, and `worker/repositories/imports.ts`.
- [X] T019 [US2] Complete editable review controls and error-preserving submission behavior in `src/components/recipes/RecipeForm.tsx` and `src/components/imports/ImportReviewForm.tsx`.
- [X] T020 [US2] Display approved source provenance correctly in `src/services/recipes.ts` and `src/pages/RecipeDetailPage.tsx`.

**Checkpoint**: Cook corrections are saved only in the approved recipe and never overwrite extraction history.

---

## Phase 5: User Story 3 - Leave an Import Unsaved (Priority: P3)

**Goal**: A cook can cancel safely or recover from a missing/non-ready import without creating a recipe.

**Independent Test**: Cancel, missing, failed, non-ready, validation failure, and duplicate approval paths create no extra library recipe and offer safe recovery.

### Tests for User Story 3

- [X] T021 [P] [US3] Add failing missing, non-ready, duplicate, and invalid approval Worker route tests in `tests/worker/import-review.test.ts`.
- [X] T022 [P] [US3] Add failing no-write cancel and rejected-approval integration tests in `tests/integration/import-review.test.ts`.
- [X] T023 [P] [US3] Add failing cancel and review-recovery component/browser coverage in `tests/component/import-review-form.test.tsx` and `tests/e2e/import-review.spec.ts`.

### Implementation for User Story 3

- [X] T024 [US3] Return safe missing, non-ready, and duplicate approval outcomes from `worker/routes/imports.ts` and `worker/http.ts`.
- [X] T025 [US3] Add cancel, library, and import-another recovery actions without writes in `src/pages/RecipeImportReviewPage.tsx` and `src/components/imports/ImportReviewForm.tsx`.
- [X] T026 [US3] Add responsive review, recovery, and action styles in `src/app/styles.css`.

**Checkpoint**: Every exit or rejected review path leaves both import history and library data safe.

---

## Phase 6: Polish and Validation

**Purpose**: Complete contract, responsive, documentation, and regression gates.

- [X] T027 [P] Validate all approval endpoint outcomes against `specs/004-import-review/contracts/import-approval.openapi.yaml` in `tests/worker/import-review.test.ts`.
- [X] T028 [P] Record 320, 768, and 1440 review results in `specs/004-import-review/quickstart.md`.
- [X] T029 Run the complete local validation sequence from `specs/004-import-review/quickstart.md` and correct only Feature 004 regressions.
- [X] T030 Update import-review local usage guidance in `README.md`.
- [X] T031 Propose the smallest durable Project Memory update in `.sdd/memory/` after all acceptance evidence passes; apply only after separate owner approval.

## Dependencies and Order

- Setup and Foundational work block all user stories.
- US1 delivers the first useful review-and-save vertical slice.
- US2 extends the same approval boundary with editable corrections and source display.
- US3 makes cancellation and rejected paths safe after review exists.
- Polish follows all three stories.

## Parallel Opportunities

- T006–T009 can run in parallel before US1 implementation.
- T015–T017 can run in parallel before US2 implementation.
- T021–T023 can run in parallel before US3 implementation.
- T027 and T028 can run in parallel after all user stories.

## Implementation Strategy

1. Establish a one-time import approval link and preserve the immutable snapshot.
2. Deliver the ready-draft review → save → recipe-detail vertical slice.
3. Add correction support, then cancel and recovery behavior.
4. Complete responsive, contract, regression, documentation, and Project Memory gates.
