---

description: "Task list for deterministic URL recipe import"
---

# Tasks: URL Recipe Import

**Input**: Design documents from `/specs/003-url-import/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Tests**: Required by the approved specification and constitution. Write each story's tests before
implementation and confirm they fail for the missing behavior.

## Phase 1: Setup

- [X] T001 Add Feature 003 import source, service, Worker, fixture, and test entry files under `src/`, `worker/`, and `tests/`.
- [X] T002 [P] Add controlled JSON-LD and non-recipe HTML fixtures in `tests/fixtures/url-import/`.
- [X] T003 [P] Add the Feature 003 D1 migration test setup in `tests/recipe-migration.ts` and `tests/worker/setup.ts`.

## Phase 2: Foundational

- [X] T004 Write failing URL validation, duration, JSON-LD traversal, instruction flattening, and normalization tests in `tests/worker/url-import.test.ts`.
- [X] T005 Create `recipe_imports` migration with immutable URL source, status, snapshot, safe failure, and timestamp fields in `migrations/0002_url_imports.sql`.
- [X] T006 Define `RecipeDraft`, `RecipeImport`, status, extraction result, and safe import error shapes in `src/domain/recipe/imports.ts`.
- [X] T008 Implement a public URL validator and bounded manual-redirect fetcher in `worker/services/extraction/url-fetcher.ts`.
- [X] T009 Implement JSON-LD traversal and Schema.org Recipe normalization in `worker/services/extraction/json-ld.ts`.
- [X] T010 Verify migration tables and required import-record constraints in `tests/integration/url-import.test.ts`.

**Checkpoint**: Safe URL and deterministic extraction primitives exist, but no import endpoint or UI exists.

## Phase 3: User Story 1 - Extract a Recipe from a URL (Priority: P1) 🎯 MVP

**Goal**: A cook submits a supported URL and receives an unsaved ready draft with preserved source fields.

**Independent Test**: A controlled recipe fixture creates a ready import, returns a normalized draft,
and leaves the recipe library unchanged.

- [X] T011 [P] [US1] Write failing Worker route tests for `POST /api/import/url` and ready draft response in `tests/worker/url-import.test.ts`.
- [X] T012 [P] [US1] Write failing Worker-to-D1 integration coverage for ready import persistence in `tests/integration/url-import.test.ts`.
- [X] T013 [P] [US1] Write failing URL submission component test in `tests/component/url-import-form.test.tsx`.
- [X] T014 [US1] Implement immutable D1 import create/get operations in `worker/repositories/imports.ts`.
- [X] T015 [US1] Implement URL import orchestration and `POST /api/import/url` route in `worker/routes/imports.ts`.
- [X] T016 [US1] Register the URL import route in `worker/index.ts`.
- [X] T017 [US1] Add typed browser URL-import request and draft types in `src/services/imports.ts`.
- [X] T018 [US1] Implement URL import form and ready-draft summary in `src/components/imports/UrlImportForm.tsx`.
- [X] T019 [US1] Implement URL import page and route from the add-recipe flow in `src/pages/RecipeImportPage.tsx` and `src/app/router.tsx`.
- [X] T020 [US1] Add responsive URL-import styles in `src/app/styles.css`.
- [X] T021 [US1] Write and pass the desktop/mobile URL-submit-to-ready-draft journey in `tests/e2e/url-import.spec.ts`.

## Phase 4: User Story 2 - Understand an Unextractable URL (Priority: P2)

**Goal**: A cook receives actionable, non-sensitive outcomes for invalid, non-recipe, and unavailable URLs.

**Independent Test**: Controlled invalid, non-recipe, and failing fetch cases expose safe recovery UI
and do not create a ready import or recipe.

- [X] T022 [P] [US2] Add failing Worker tests for invalid/disallowed, no-recipe, timeout, and redirect failures in `tests/worker/url-import.test.ts`.
- [X] T023 [P] [US2] Add failing integration tests proving unsuccessful imports do not create recipes in `tests/integration/url-import.test.ts`.
- [X] T024 [US2] Implement safe import-failure mapping and persistence behavior in `worker/routes/imports.ts` and `worker/repositories/imports.ts`.
- [X] T025 [US2] Add URL-form recovery messages and manual-entry action in `src/components/imports/UrlImportForm.tsx`.
- [X] T026 [US2] Extend browser recovery journeys at desktop/tablet/mobile widths in `tests/e2e/url-import.spec.ts`.

## Phase 5: User Story 3 - Preserve Import Provenance (Priority: P3)

**Goal**: A ready import can be retrieved independently with original URL, time, status, and draft snapshot.

**Independent Test**: Retrieve an import identifier after a successful controlled import and verify
its provenance is separate from saved recipes.

- [X] T027 [P] [US3] Add failing Worker route tests for `GET /api/import/:importId` and safe missing behavior in `tests/worker/url-import.test.ts`.
- [X] T028 [P] [US3] Add failing D1 integration test for distinct retry attempts in `tests/integration/url-import.test.ts`.
- [X] T029 [US3] Implement import lookup in `worker/repositories/imports.ts` and `worker/routes/imports.ts`.
- [X] T030 [US3] Add typed draft retrieval in `src/services/imports.ts` and a retrievable import-result route in `src/app/router.tsx`.
- [X] T031 [US3] Extend browser coverage for a retained ready draft in `tests/e2e/url-import.spec.ts`.

## Phase 6: Polish and Validation

- [X] T032 [P] Validate all import endpoint outcomes against `specs/003-url-import/contracts/imports.openapi.yaml` in `tests/worker/url-import.test.ts`.
- [X] T033 [P] Record 320, 768, and 1440 responsive results in `specs/003-url-import/quickstart.md`.
- [X] T034 Run the full local validation sequence from `specs/003-url-import/quickstart.md` and correct only Feature 003 regressions.
- [X] T035 Update URL-import local usage and recovery guidance in `README.md`.
- [X] T036 Propose the smallest durable Project Memory update after all acceptance evidence passes; apply only after separate owner approval.

## Dependencies and Order

- Setup and Foundational work blocks all stories.
- US1 delivers the first useful vertical slice.
- US2 builds safe recovery on the US1 import boundary.
- US3 adds retained import lookup after a ready import exists.
- Polish follows all three stories.

## Parallel Opportunities

- T002 and T003 can run in parallel; T004 and T005 can start together.
- T011, T012, and T013 can run in parallel before US1 implementation.
- T022 and T023 can run in parallel before US2 implementation.
- T027 and T028 can run in parallel before US3 implementation.

## Implementation Strategy

1. Build and verify safe deterministic extraction primitives.
2. Deliver one URL form through a ready unsaved draft and D1 import record.
3. Add safe failures, then retrieval/provenance.
4. Complete responsive, contract, regression, documentation, and Project Memory gates.
