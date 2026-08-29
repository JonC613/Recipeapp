---

description: "Dependency-ordered task list for Feature 005 text recipe import"
---

# Tasks: Text Recipe Import

**Input**: Design documents from `/specs/005-text-import/`

**Prerequisites**: Approved `spec.md` and `plan.md`; `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md` are complete.

**Tests**: Test-first tasks are required by the specification and constitution. They use controlled
parser doubles and MUST NOT make paid OpenAI requests.

**Organization**: Tasks are grouped by user story so each slice can be validated at its checkpoint.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish configuration and test fixtures without invoking the provider.

- [X] T001 Add `OPENAI_API_KEY` required-secret and configurable `OPENAI_MODEL` declarations in `wrangler.jsonc` without committing values.
- [X] T002 [P] Add safe local secret/model setup guidance and no-paid-test policy in `README.md` and `.dev.vars.example`.
- [X] T003 [P] Add representative single-recipe, non-recipe, multiple-recipe, and unusual-measurement text fixtures in `tests/fixtures/text-import.ts`.
- [X] T004 Regenerate and validate Worker binding types in `worker-configuration.d.ts` with `npm run cf-typegen` and `npm run cf-typecheck`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create provider-neutral contracts and source-aware persistence used by every story.

**⚠️ CRITICAL**: No user story work begins until this phase passes.

- [X] T005 Add text source, extracted-content, parser-result, text failure-code, and discriminated import/draft types in `src/domain/recipe/schema.ts` and `src/domain/recipe/imports.ts`.
- [X] T006 [P] Add failing migration preservation tests for URL rows, approval links, indexes, and new text rows in `tests/integration/text-import-migration.test.ts`.
- [X] T007 Implement the `recipe_imports` table rebuild and index recreation in `migrations/0004_text_imports.sql`.
- [X] T008 Update the simulated schema and migration harness for text imports in `tests/recipe-migration.ts`.
- [X] T009 [P] Define the provider-neutral `RecipeParser` interface and parser error taxonomy in `worker/services/ai/recipe-parser.ts`.
- [X] T010 [P] Define the strict provider response JSON Schema and null-to-absent mapping tests in `tests/worker/openai-recipe-parser.test.ts`.
- [X] T011 Implement the OpenAI Responses adapter, one-call policy, safe envelope/refusal handling, and stable-domain mapping in `worker/services/ai/openai-recipe-parser.ts`.
- [X] T012 Run `npm run typecheck`, `npm run cf-typecheck`, and the focused foundational tests before starting User Story 1.

**Checkpoint**: Provider-neutral parsing and D1 storage support text imports without changing URL behavior.

---

## Phase 3: User Story 1 - Extract a Recipe from Pasted Text (Priority: P1) 🎯 MVP

**Goal**: Explicitly submit one free-form recipe and receive one retained, unsaved, reviewable draft.

**Independent Test**: Submit the controlled recipe fixture through a parser double and verify one ready
text import with recognizable fields, original ingredient wording/order, and unchanged raw source.

### Tests for User Story 1

- [X] T013 [P] [US1] Add failing Worker contract tests for `POST /api/import/text`, 50,000-character validation, one parser call, and ready response in `tests/worker/text-import.test.ts`.
- [X] T014 [P] [US1] Add failing D1 integration tests for immutable raw text, extraction snapshot, distinct retries, and no recipe creation in `tests/integration/text-import.test.ts`.
- [X] T015 [P] [US1] Add failing component tests for paste, character feedback, validation, progress, and ready navigation in `tests/component/text-import-form.test.tsx`.

### Implementation for User Story 1

- [X] T016 [US1] Generalize import persistence to URL and text ready/failure records in `worker/repositories/imports.ts`.
- [X] T017 [US1] Implement bounded input validation, parser orchestration, one-call behavior, and ready persistence in `worker/routes/imports.ts`.
- [X] T018 [US1] Register `POST /api/import/text` without changing URL routes in `worker/index.ts`.
- [X] T019 [US1] Add typed text-import submission and source-aware import retrieval in `src/services/imports.ts`.
- [X] T020 [US1] Build the accessible pasted-text form and ready-state UI in `src/components/imports/TextImportForm.tsx`.
- [X] T021 [US1] Add the text option and submission mode to `src/pages/RecipeImportPage.tsx` and route behavior in `src/app/router.tsx`.
- [X] T022 [US1] Run focused Worker, integration, and component tests and confirm User Story 1 creates no library recipe.

**Checkpoint**: Text → extraction → retained ready draft works independently and incurs no test charges.

---

## Phase 4: User Story 2 - Review and Save a Text Import (Priority: P2)

**Goal**: Reuse review to correct a text draft and explicitly create one text-sourced recipe while
preserving source and extraction layers.

**Independent Test**: Review a controlled text draft, change its recipe fields, save it once, and verify
the recipe reflects edits while raw text and extraction snapshot remain unchanged.

### Tests for User Story 2

- [X] T023 [P] [US2] Add failing approval integration tests for text provenance, immutable snapshots, cancel, and duplicate save in `tests/integration/text-import-review.test.ts`.
- [X] T024 [P] [US2] Add failing component tests for pasted-text source labeling in review and detail in `tests/component/import-review-form.test.tsx`.
- [X] T025 [P] [US2] Add a responsive review/edit/save/cancel browser journey using mocked extraction in `tests/e2e/text-import.spec.ts`.

### Implementation for User Story 2

- [X] T026 [US2] Derive URL or text recipe provenance from the import discriminator during approval in `worker/repositories/imports.ts`.
- [X] T027 [US2] Extend recipe mapping and public recipe types for `source.type = "text"` in `worker/repositories/recipes.ts`, `src/domain/recipe/schema.ts`, and `src/services/recipes.ts`.
- [X] T028 [US2] Generalize source presentation without exposing provider details in `src/components/imports/ImportReviewForm.tsx` and `src/pages/RecipeDetailPage.tsx`.
- [X] T029 [US2] Generalize import result/review recovery links for text sources in `src/pages/RecipeImportResultPage.tsx` and `src/pages/RecipeImportReviewPage.tsx`.
- [X] T030 [US2] Run focused approval, component, and browser tests and verify exactly-one-save behavior.

**Checkpoint**: Text import review/save is complete and existing URL review remains passing.

---

## Phase 5: User Story 3 - Recover Safely from Invalid Text or Extraction Failure (Priority: P3)

**Goal**: Handle invalid input, non/multiple recipe content, refusal, invalid output, and provider outages
without a library recipe, leaked details, automatic retry, or lost recovery path.

**Independent Test**: Exercise every controlled failure fixture and verify its safe status/message,
retry/manual-entry options, zero recipes, and exactly zero or one provider call as appropriate.

### Tests for User Story 3

- [X] T031 [P] [US3] Extend Worker tests for empty, whitespace, oversized, non-recipe, multiple-recipe, refusal, invalid output, timeout, rate limit, and provider failure in `tests/worker/text-import.test.ts`.
- [X] T032 [P] [US3] Add integration assertions for retained safe failure records and absence of source/provider details from responses in `tests/integration/text-import.test.ts`.
- [X] T033 [P] [US3] Extend responsive browser recovery journeys for revise, explicit retry, and manual entry in `tests/e2e/text-import.spec.ts`.

### Implementation for User Story 3

- [X] T034 [US3] Add allow-listed text-import error codes and retryability mapping in `worker/http.ts` and `worker/routes/imports.ts`.
- [X] T035 [US3] Render source-preserving revise, explicit retry, and manual-entry recovery without automatic resubmission in `src/components/imports/TextImportForm.tsx`.
- [X] T036 [US3] Ensure failed text import retrieval exposes only safe classifications plus owner-visible source in `worker/repositories/imports.ts` and `src/domain/recipe/imports.ts`.
- [X] T037 [US3] Run focused failure tests and verify no failure path creates a recipe or makes a second provider call.

**Checkpoint**: All three user stories are independently testable and safely integrated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate contracts, responsiveness, regressions, documentation, and durable memory impact.

- [X] T038 [P] Validate every endpoint outcome against `specs/005-text-import/contracts/text-import.openapi.yaml` in `tests/worker/text-import.test.ts`.
- [X] T039 [P] Add source-text privacy and no-secret/no-provider-payload logging assertions in `tests/worker/openai-recipe-parser.test.ts`.
- [X] T040 Record 320, 768, and 1440 acceptance evidence in `specs/005-text-import/quickstart.md`.
- [X] T041 Update completed local text-import and explicit-cost guidance in `README.md` without documenting secrets.
- [X] T042 Run the full `specs/005-text-import/quickstart.md` validation sequence and correct only Feature 005 regressions.
- [X] T043 Propose the smallest durable Project Memory update in `.sdd/memory/` after acceptance passes; apply only after separate owner approval.
- [X] T044 [Amendment] Add a controlled raw Responses API envelope regression test in `tests/worker/openai-recipe-parser.test.ts`.
- [X] T045 [Amendment] Read `output_text` from the raw `output` message content in `worker/services/ai/openai-recipe-parser.ts`, then rerun focused and full Worker validation.
- [X] T046 [Amendment] Invoke the injected Worker `fetch` with the global receiver, remove temporary diagnostics, and add a regression test.

---

## Dependencies & Execution Order

- Phase 1 enables Phase 2; Phase 2 blocks all stories.
- US1 is the MVP and establishes text extraction/persistence.
- US2 depends on a ready text draft from US1 but reuses the already-independent approval boundary.
- US3 depends on US1 orchestration and can proceed in parallel with US2 after US1 is stable.
- Polish follows all selected stories; Project Memory remains a separate approval gate.

Within each story: failing tests → domain/repository → provider/service → route → UI → focused validation.

## Parallel Opportunities

- T002 and T003 can proceed in parallel after T001.
- T006, T009, and T010 touch separate migration, interface, and adapter-test files.
- T013–T015, T023–T025, and T031–T033 are parallel test-first groups within their stories.
- After US1, US2 approval work and US3 recovery tests can proceed independently where files do not overlap.
- T038 and T039 are separate contract and security test increments.

## Parallel Example: User Story 1

```text
Task T013: Worker contract tests in tests/worker/text-import.test.ts
Task T014: D1 provenance tests in tests/integration/text-import.test.ts
Task T015: Form tests in tests/component/text-import-form.test.tsx
```

## Implementation Strategy

1. Complete setup and provider-neutral foundation.
2. Deliver US1 as Text → one parse → retained ready draft; stop and validate.
3. Add US2 by reusing review/save and preserving all three provenance layers; stop and validate.
4. Add US3 safe recovery and cost controls; stop and validate.
5. Run full regression and responsive acceptance, then request separate Project Memory approval.

No implementation task may deploy remotely, configure a remote secret, expose the local key, or make a
live paid request unless the owner separately authorizes that exact action.
