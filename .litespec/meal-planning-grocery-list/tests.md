---
feature: meal-planning-grocery-list
artifact: tests
status: done
owner: user
version: 0.1
created: 2026-09-02
updated: 2026-09-02
spec_version: 0.1
plan_version: 0.1
---

# Test Plan: Meal Planning and Grocery Lists

## Strategy

Use deterministic unit tests for local Sunday-date handling, ingredient-key normalization, and section classification; Worker tests for request validation and safe error contracts; and local D1 integration tests for persistence, revisions, reconciliation, and recipe-deletion cleanup. Component tests prove semantic page states and controls, while Playwright covers the end-to-end owner journey at the repository's 320, 768, and 1440 CSS-pixel widths.

No live Cloudflare, OpenAI, R2, or external recipe-provider calls are needed. Existing Worker test harnesses and local migrations provide the production-equivalent D1 surface, and browser tests route only the new same-origin API contract.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01 | Automated | Planned |
| AC-01.2 | T-02 | Automated | Planned |
| AC-01.3 | T-03 | Automated | Planned |
| AC-01.4 | T-04 | Automated | Planned |
| AC-01.5 | T-05 | Automated | Planned |
| AC-02.1 | T-06 | Automated | Planned |
| AC-02.2 | T-07 | Automated | Planned |
| AC-02.3 | T-08 | Automated | Planned |
| AC-02.4 | T-09 | Automated | Planned |
| AC-02.5 | T-10 | Automated | Planned |
| AC-03.1 | T-11 | Automated | Planned |
| AC-03.2 | T-12 | Automated | Planned |
| AC-03.3 | T-13 | Automated | Planned |
| AC-03.4 | T-14 | Automated | Planned |
| AC-04.1 | T-15 | Automated | Planned |
| AC-04.2 | T-16 | Automated | Planned |
| AC-04.3 | T-17 | Automated | Planned |
| AC-04.4 | T-18 | Automated | Planned |

## Critical user flows

### T-01 — Render a dated dinner week

- Covers: AC-01.1
- Level: component
- Setup: Fixed local date and a typed empty-week API response.
- Action: Open `/meal-plan`.
- Expected: Seven labeled Sunday–Saturday dinner slots render for the displayed week without horizontal page scrolling.

### T-02 — Navigate calendar weeks

- Covers: AC-01.2
- Level: component
- Setup: Fixed local date and routeable responses for adjacent Sunday keys.
- Action: Select previous week, next week, and This week.
- Expected: Each action requests and displays the correct canonical week and visibly identifies its date range.

### T-03 — Select a saved recipe for dinner

- Covers: AC-01.3
- Level: end-to-end
- Setup: A saved-recipe search response containing several titles and an empty selected-day slot.
- Action: Search for a title and assign the selected recipe to dinner.
- Expected: The Worker receives the bounded assignment request and the slot displays the selected saved recipe.

### T-04 — Replace and remove a persisted dinner

- Covers: AC-01.4
- Level: integration
- Setup: Local D1 with a week and two saved recipes.
- Action: Assign the first recipe, replace it with the second, remove it, and reread the week after each mutation.
- Expected: At most one assignment exists for the day and the reread response accurately reflects every persisted state.

### T-05 — Open planned recipe experiences

- Covers: AC-01.5
- Level: component
- Setup: A week response with one planned recipe.
- Action: Inspect the planned-dinner actions.
- Expected: Detail and Cooking Mode links use `/recipes/:id` and `/recipes/:id/cook` for that assigned recipe.

### T-06 — Generate only on explicit owner action

- Covers: AC-02.1
- Level: component
- Setup: A week with planned dinners and no grocery snapshot.
- Action: Load the page, edit the plan, then select Generate grocery list.
- Expected: No generation request occurs before the action; after it, the UI displays the returned snapshot and an empty plan yields an explanatory empty state.

### T-07 — Include every planned recipe ingredient with contributors

- Covers: AC-02.2
- Level: integration
- Setup: Local D1 with two planned recipes containing non-empty and blank ingredient lines.
- Action: Generate the list.
- Expected: Every non-empty `original_text` is represented with its contributor title; blank lines are omitted.

### T-08 — Consolidate exact normalized matches only

- Covers: AC-02.3
- Level: unit
- Setup: Ingredient fixtures with case/spacing variants, different quantities, and different wording.
- Action: Run the grocery grouping function.
- Expected: Only case-insensitive whitespace-normalized equal lines share one display item, occurrence count, and contributor set; other lines stay separate.

### T-09 — Classify deterministic grocery sections

- Covers: AC-02.4
- Level: unit
- Setup: Representative produce, meat/seafood, dairy, pantry, frozen, and unknown ingredient-line fixtures.
- Action: Run the section classifier and render grouped results.
- Expected: Known items use the documented section and unrecognized input is classified as Other, never omitted.

### T-10 — Reload a generated grocery snapshot

- Covers: AC-02.5
- Level: integration
- Setup: Local D1 with a generated list for one week.
- Action: Read the week through the repository/Worker after a fresh test request.
- Expected: The response includes the same generated items, contributor data, sections, and current freshness state.

### T-11 — Mark a generated list stale after plan change

- Covers: AC-03.1
- Level: integration
- Setup: Local D1 with a generated current list.
- Action: Replace/remove a dinner and separately delete a planned recipe through the existing recipe repository.
- Expected: Existing grocery items remain unchanged, while the reread week is marked stale in both mutation paths.

### T-12 — Explicitly update a stale list

- Covers: AC-03.2
- Level: worker
- Setup: A stale week with changed meal assignments.
- Action: POST the grocery-list update endpoint.
- Expected: The Worker returns the rebuilt snapshot with stale state cleared and no external-provider call.

### T-13 — Preserve custom items and eligible checked state

- Covers: AC-03.3
- Level: integration
- Setup: A generated checked item that still matches after a plan change plus a checked custom item.
- Action: Update the grocery list.
- Expected: Both items remain checked; the generated item receives current contributor data and the custom row remains unchanged.

### T-14 — Reconcile newly required and obsolete generated items

- Covers: AC-03.4
- Level: integration
- Setup: A generated list, then a plan whose recipes remove one ingredient and add another.
- Action: Update the grocery list twice.
- Expected: Obsolete generated rows are removed, new rows appear once, and the second update is idempotent.

### T-15 — Persist shopping checklist state

- Covers: AC-04.1
- Level: integration
- Setup: A generated or custom grocery row in local D1.
- Action: Toggle checked state and reread the week.
- Expected: The updated boolean persists and the API returns a safe not-found result for an unknown item.

### T-16 — Add classified custom grocery items

- Covers: AC-04.2
- Level: component
- Setup: A week with a grocery list and mocked custom-item mutation response.
- Action: Add a non-empty custom item.
- Expected: The item appears in its deterministic section, is marked as custom, and a blank submission leaves the list unchanged with an accessible validation message.

### T-17 — Remove a grocery item without changing the plan

- Covers: AC-04.3
- Level: integration
- Setup: A week with a grocery row and an assigned recipe.
- Action: Delete the grocery row and reread the week and plan assignments.
- Expected: Only that grocery row is gone; the assigned recipe remains planned, and a later update can restore a still-required generated item.

### T-18 — Present useful empty grocery states

- Covers: AC-04.4
- Level: component
- Setup: Responses with populated sections and with no remaining grocery rows.
- Action: Render the grocery-list panel.
- Expected: Empty sections are absent; a fully empty list presents a clear generate/update or planning recovery action.

## Failure and recovery cases

### T-19 — Reject malformed plan requests safely

- Covers: NFR-03, NFR-05
- Level: worker
- Setup: Invalid week keys, non-Sunday dates, invalid day indexes, malformed mutation bodies, and missing recipe/item IDs.
- Action: Call each affected route.
- Expected: The Worker returns allow-listed 400/404 responses, performs no unintended writes, and exposes no SQL, credential, or provider detail.

### T-20 — Keep responsive controls usable after an API failure

- Covers: NFR-01, NFR-02, NFR-03
- Level: end-to-end
- Setup: Intercept one plan or grocery mutation with a safe server error at 320, 768, and 1440 CSS pixels.
- Action: Attempt the mutation, then retry using the visible control.
- Expected: An announced error and usable retry path appear; the view does not claim the failed change succeeded and no horizontal overflow is introduced.

### T-21 — Enforce bounded, local-only feature work

- Covers: NFR-04, NFR-06
- Level: worker
- Setup: A week with all seven assigned recipes and a stubbed fetch that fails if called.
- Action: Generate and update the grocery list.
- Expected: The operation reads only the selected week's assignments/ingredients, succeeds without `fetch`, and has no AI/provider dependency.

## Manual exceptions

None. All current-release acceptance criteria and relevant quality expectations have automated evidence in the planned suite.

## Test data and setup

- Add fixture recipes covering ingredient duplicates, different quantities/wording, blank ingredient text, each grocery section, and an Other fallback.
- Extend `tests/recipe-migration.ts` or its successor to apply migration `0011_meal_planning_grocery_lists.sql` in local D1 before Worker/integration cases.
- Use a fixed local date/timezone helper in domain and component tests so Sunday and year-boundary navigation are stable.
- Browser tests mock only same-origin meal-plan endpoints and existing recipe-list/detail endpoints; they make no live Cloudflare or provider request.
- Run focused test files first, then `npm run test`, `npm run test:worker`, `npm run test:integration`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, and `npm run build` before release.

## Completion criteria

- [ ] T-01 through T-18 pass and cover every current-release acceptance criterion.
- [ ] T-19 through T-21 pass for validation, recovery, responsiveness, and local-only behavior.
- [ ] The local D1 migration applies cleanly to a fresh database and existing recipe/integration suites remain passing.
- [ ] Playwright verifies plan, generate, update, checklist, and Cooking Mode-link flows at 320, 768, and 1440 CSS pixels.
- [ ] Typecheck, lint, build, LiteSpec validation, and all relevant automated suites pass with no unresolved blocker.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-02 | Initial draft | Derived from approved specification and plan | All |
