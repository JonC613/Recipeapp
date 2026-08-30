# Tasks: Recipe Search

**Input**: Design documents from `/specs/007-recipe-search/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contract](contracts/recipe-search.openapi.yaml), and
[quickstart.md](quickstart.md)

**Tests**: Automated component, Worker, D1 integration, and Playwright coverage is required by the
approved specification and constitution. Write focused tests before the corresponding implementation.

**Organization**: Tasks are grouped by user story so each increment can be independently verified.

## Phase 1: Setup (Shared Context)

**Purpose**: Establish the feature’s test seams and make the existing title-only behavior explicit before
expanding it.

- [X] T001 Review the existing title-filter browser and Worker coverage in `tests/e2e/recipe-library.spec.ts`, `src/pages/RecipeLibraryPage.tsx`, and `worker/repositories/recipes.ts` against `specs/007-recipe-search/contracts/recipe-search.openapi.yaml`
- [X] T002 [P] Add reusable saved-recipe search fixtures covering title, ingredient, tag, cuisine, category, and favorite values in `tests/fixtures/recipe-search/recipes.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define one typed, normalized criteria boundary shared by the browser service, Worker route,
and repository before user-story behavior is added.

**⚠️ CRITICAL**: No user story implementation begins until criteria have one safe representation.

- [X] T003 Add transient `RecipeSearchCriteria` types and browser query-string serialization in `src/services/recipes.ts`
- [X] T004 Add Worker-only query parsing that trims/collapses text criteria and rejects invalid `favorite` values in `worker/routes/recipes.ts`
- [X] T005 [P] Add request parsing and malformed-filter Worker tests in `tests/worker/recipe-search.test.ts`

**Checkpoint**: The list route has a typed, validated criteria boundary and remains backward compatible with
the current no-criteria and title-query requests.

---

## Phase 3: User Story 1 - Find Recipes by Words (Priority: P1) 🎯 MVP

**Goal**: A cook searches saved recipes by one keyword or phrase across title, ingredients, tags, cuisine,
and category, gets a safe recipe-summary result list, and can recover from no matches.

**Independent Test**: Seed recipes where the desired term appears in each searchable field, search each
term, and verify only the expected saved recipe card is visible at 320, 768, and 1440 CSS pixels.

### Tests for User Story 1

- [X] T006 [P] [US1] Add D1 matching, case/whitespace normalization, distinct-result, and safe-summary tests in `tests/integration/recipe-search.test.ts`
- [X] T007 [P] [US1] Add unified search input, empty-state, clear-action, and stale-request UI coverage in `tests/component/recipe-search.test.tsx`
- [X] T008 [P] [US1] Add title/ingredient/tag/cuisine/category keyword journeys and no-result recovery at 320/768/1440 in `tests/e2e/recipe-search.spec.ts`

### Implementation for User Story 1

- [X] T009 [US1] Replace title-only D1 listing with bound, case-insensitive unified saved-recipe keyword matching in `worker/repositories/recipes.ts`
- [X] T010 [US1] Connect parsed keyword criteria to `GET /api/recipes` while retaining allow-listed validation errors in `worker/routes/recipes.ts`
- [X] T011 [US1] Replace the title-only library control with an accessible unified recipe-search field, clear action, and distinct empty states in `src/pages/RecipeLibraryPage.tsx`
- [X] T012 [US1] Update the typed `listRecipes` call site and result-refresh handling for unified criteria in `src/services/recipes.ts` and `src/pages/RecipeLibraryPage.tsx`

**Checkpoint**: The primary search works independently and never returns import records, source text, or
private source-file data.

---

## Phase 4: User Story 2 - Narrow the Recipe Library (Priority: P2)

**Goal**: A cook combines a keyword with favorite, tag, ingredient, cuisine, or category filters and sees
only saved recipes satisfying all active criteria.

**Independent Test**: Seed matching and non-matching recipes, apply each filter alone and in combination
with a keyword, then clear it and verify the expected saved cards return.

### Tests for User Story 2

- [X] T013 [P] [US2] Add D1 conjunctive-filter and favorite-only integration coverage in `tests/integration/recipe-search.test.ts`
- [X] T014 [P] [US2] Add component coverage for filter controls, active-criteria clearing, and filtered empty states in `tests/component/recipe-search.test.tsx`
- [X] T015 [P] [US2] Add browser journeys for favorite, tag, ingredient, cuisine, category, and combined criteria in `tests/e2e/recipe-search.spec.ts`

### Implementation for User Story 2

- [X] T016 [US2] Extend `RecipeSearchCriteria` serialization and list-service query construction for favorite, tag, ingredient, cuisine, and category in `src/services/recipes.ts`
- [X] T017 [US2] Implement bound D1 filters that combine with unified keyword matching and return each recipe once in `worker/repositories/recipes.ts`
- [X] T018 [US2] Connect every supported filter and validation outcome to the recipe-list route in `worker/routes/recipes.ts`
- [X] T019 [US2] Add labeled filter controls, visible active criteria, clear-all recovery, and responsive layout in `src/pages/RecipeLibraryPage.tsx` and `src/app/styles.css`

**Checkpoint**: Every filter works independently and combined criteria are conjunctive without changing any
saved recipe.

---

## Phase 5: User Story 3 - Search on a Phone While Cooking (Priority: P3)

**Goal**: Search/filter controls and result cards remain clear and operable at phone, tablet, and desktop
widths, including opening a result after clearing criteria.

**Independent Test**: At 320, 768, and 1440 CSS pixels, search, filter, clear, and open a matching saved
recipe with no horizontal page scrolling or inaccessible control.

### Tests for User Story 3

- [X] T020 [P] [US3] Extend responsive browser assertions for usable labels, control visibility, clearing, and opening a result in `tests/e2e/recipe-search.spec.ts`
- [X] T021 [P] [US3] Add accessible-name and keyboard-clear coverage for search/filter controls in `tests/component/recipe-search.test.tsx`

### Implementation for User Story 3

- [X] T022 [US3] Refine responsive search/filter layout, focus behavior, and result-state spacing for 320/768/1440 widths in `src/app/styles.css` and `src/pages/RecipeLibraryPage.tsx`

**Checkpoint**: Search and filtering are usable from a phone kitchen workflow as well as tablet and desktop.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Validate the complete feature, contract, security boundary, and documentation.

- [X] T023 [P] Update behavior and implementation discoveries in `specs/007-recipe-search/spec.md`, `specs/007-recipe-search/plan.md`, and `specs/007-recipe-search/quickstart.md`
- [X] T024 Run the focused and full build, lint, type, component, Worker, integration, and end-to-end suites from `specs/007-recipe-search/quickstart.md`
- [X] T025 Review browser/API outputs to confirm search never exposes imports, source text, R2 object keys, provider details, or credentials in `worker/routes/recipes.ts` and `src/pages/RecipeLibraryPage.tsx`
- [X] T026 [P] Propose and, after owner approval, apply the durable Feature 007 Project Memory update in `.sdd/memory/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can begin immediately.
- **Foundational (Phase 2)**: Depends on T001–T002 and blocks implementation of every user story.
- **US1 (Phase 3)**: Depends on the foundational criteria boundary; it is the MVP.
- **US2 (Phase 4)**: Builds on the unified listing in US1.
- **US3 (Phase 5)**: Builds on the visible controls from US1 and US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Requires only Phase 2 and delivers independently useful saved-recipe keyword search.
- **US2 (P2)**: Requires US1’s unified list query and adds optional narrowing without changing search data.
- **US3 (P3)**: Requires the completed controls and focuses on responsive usability and recovery.

### Parallel Opportunities

- T002 and T005 can proceed alongside independent context review once their prerequisite interfaces are
  known.
- Within US1, T006–T008 can be authored in parallel before T009–T012.
- Within US2, T013–T015 can be authored in parallel before T016–T019.
- Within US3, T020 and T021 can be authored in parallel before T022.
- T023 and T026 can begin after implementation outcomes are known; T026 still requires owner approval
  before any Project Memory write.

---

## Parallel Example: User Story 1

```text
Task: "Add D1 matching, normalization, distinct-result, and safe-summary tests in tests/integration/recipe-search.test.ts"
Task: "Add unified-search field and empty-state coverage in tests/component/recipe-search.test.tsx"
Task: "Add responsive keyword-search journeys in tests/e2e/recipe-search.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Establish typed and validated criteria in Phase 2.
2. Write the three US1 test layers and confirm they fail for the title-only baseline.
3. Implement the repository, Worker, service, and library UI as one vertical slice.
4. Validate the keyword search at all required widths before adding filters.

### Incremental Delivery

1. Deliver saved-recipe keyword search across all five required fields.
2. Add conjunctive favorite and field filters with explicit clear/recovery behavior.
3. Finish responsive and keyboard usability verification.
4. Run the complete regression suite and update Project Memory only after owner approval.

## Notes

- All tasks use the required checklist format and exact repository paths.
- No task adds embeddings, semantic search, AI generation, a migration, or import/source-content search.
- A feature is not complete until T024 and the approved Project Memory update in T026 are complete.
