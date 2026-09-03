---
feature: meal-planning-grocery-list
artifact: spec
status: done
owner: user
version: 0.1
created: 2026-09-02
updated: 2026-09-02
---

# Specification: Meal Planning and Grocery Lists

## Summary

Let the Recipeapp owner plan one dinner for each day of a dated week and turn the planned recipes into a persistent, checkable grocery list. The MVP connects the existing saved-recipe library and Cooking Mode without adding AI calls or attempting unreliable quantity conversion.

## Problem

Recipeapp can save, find, and cook individual recipes, but it does not help the owner decide what to cook across a week or collect the required ingredients into one shopping view. Planning and shopping therefore happen outside the application, which breaks the workflow after recipe capture.

## Desired outcome

The owner can navigate Sunday-based calendar weeks, assign saved recipes to dinner slots, and open any planned meal for normal viewing or Cooking Mode. The owner can explicitly generate or update that week's grocery list, check items while shopping, and add or remove personal items without losing them when the recipe-derived list is refreshed.

## Boundaries

### Goals

- Support one dinner recipe per day across navigable previous and next calendar weeks.
- Reuse saved recipes and the existing detail and Cooking Mode experiences.
- Generate one grocery list per week from planned recipe ingredients while preserving original ingredient wording.
- Keep grocery-list refreshes explicit and preserve relevant shopping progress and custom items.
- Provide a useful mobile-first planning and shopping experience without AI usage.

### Non-goals

- Breakfast, lunch, snacks, multiple meals per day, or free-form meal entries.
- Recipe scaling, unit conversion, semantic ingredient matching, or summing different quantities.
- Pantry inventory, store aisles, pricing, delivery services, meal-plan sharing, or multi-user collaboration.
- Nutrition targets, dietary optimization, AI meal recommendations, or automatic recipe selection.
- Editing generated ingredient wording or manually moving items between grocery sections.

### Constraints

- The production application remains a single-owner experience protected by the existing Cloudflare Access policy.
- Plans and grocery state must persist in D1; no plan or grocery content is stored only in browser memory.
- Grocery generation is deterministic and makes no OpenAI or other paid provider call.
- Existing recipes, imports, search, and Cooking Mode behavior must remain compatible.

## Requirements

### Current release

- **R-01:** Provide a Sunday-based weekly meal plan with one dinner slot per calendar day and navigation to previous, current, and future weeks.
- **R-02:** Allow a dinner slot to select, replace, or remove one saved recipe and expose links to its recipe detail and Cooking Mode.
- **R-03:** Persist each dated week's planned dinners independently so navigating away and returning restores the same plan.
- **R-04:** Generate one persistent grocery list for a week from every ingredient occurrence in its currently planned recipes only after an explicit owner action.
- **R-05:** Combine ingredient lines that match after case-insensitive whitespace normalization, preserve one original display line, show the occurrence count and contributing recipe titles, and leave differently worded or quantified lines separate.
- **R-06:** Classify grocery items deterministically into Produce, Meat & Seafood, Dairy, Pantry, Frozen, or Other, with Other as the safe fallback.
- **R-07:** Allow grocery items to be checked and unchecked, allow custom items to be added, and allow any individual item to be removed.
- **R-08:** When the owner explicitly updates a grocery list, recalculate generated items, remove generated items no longer required, retain custom items, and preserve checked state for retained matching items.
- **R-09:** Clearly indicate when a grocery list does not yet exist or is out of date because its weekly plan changed.

### Deferred

- **D-01:** Additional meal types and more than one meal per day await evidence that dinner-only planning is insufficient.
- **D-02:** Quantity arithmetic, measurement conversion, and semantic deduplication are deferred because ingredient wording and units are inconsistent.
- **D-03:** Custom item renaming, manual section assignment, bulk clearing, and reusable shopping templates are deferred.
- **D-04:** Drag-and-drop scheduling, recipe suggestions, recurring meals, plan copying, and print/export are deferred.
- **D-05:** Shared plans, household assignments, and real-time collaboration await application-level identity and ownership support.

## User stories

### US-01 — Plan dinners for a dated week

**Story:** As the Recipeapp owner, I want to assign saved recipes to each day's dinner, so that I can decide what I will cook during a particular week.

**Rationale:** A dated plan turns the saved library into an actionable weekly schedule.

**Acceptance criteria:**

- **AC-01.1:** The meal-plan page displays seven dated dinner slots from Sunday through Saturday for the selected calendar week.
- **AC-01.2:** The owner can navigate to the previous week, next week, and the week containing today; each selected week is visibly identified.
- **AC-01.3:** The owner can search or browse saved recipes and assign one to an empty dinner slot.
- **AC-01.4:** The owner can replace or remove an assigned recipe, and the persisted week reflects the change after reload.
- **AC-01.5:** An assigned dinner provides working paths to the existing recipe detail and Cooking Mode pages.

**Edge cases:**

- A week with no assignments displays seven useful empty slots rather than an error.
- A library with no saved recipes provides a path to add or import a recipe.
- Deleting a saved recipe removes its meal-plan assignments; any already-generated grocery list remains unchanged until the owner updates it.

### US-02 — Generate a useful weekly grocery list

**Story:** As the Recipeapp owner, I want to generate a grocery list from planned dinners, so that I can shop for the ingredients those recipes require.

**Rationale:** Automatic collection eliminates repetitive transcription while retaining the source recipe's intended wording.

**Acceptance criteria:**

- **AC-02.1:** A week without a grocery list offers an explicit Generate grocery list action and does not create one merely by viewing or changing the plan.
- **AC-02.2:** Generation includes every non-empty original ingredient line from the recipes currently assigned to that week and records the contributing recipe title.
- **AC-02.3:** Matching lines are combined according to R-05 with an occurrence count and all contributing recipe titles; nonmatching lines remain separate.
- **AC-02.4:** Generated items appear under the deterministic sections in R-06, and an unrecognized item appears under Other rather than being omitted.
- **AC-02.5:** A generated list is persisted for its week and remains available after navigation or reload.

**Edge cases:**

- Generating for a week with no planned recipes produces an explanatory empty state and no phantom ingredients.
- A recipe with no ingredients contributes nothing and does not prevent ingredients from other planned recipes from appearing.
- Repeating the same recipe on multiple days increases the occurrence count for its exact matching ingredient lines.

### US-03 — Control grocery-list updates

**Story:** As the Recipeapp owner, I want to decide when a generated list reflects plan changes, so that shopping progress is not unexpectedly rewritten.

**Rationale:** Explicit updates make destructive reconciliation visible and predictable.

**Acceptance criteria:**

- **AC-03.1:** Changing a plan after list generation marks that week's grocery list as out of date without altering its current items.
- **AC-03.2:** Selecting Update grocery list rebuilds generated items from the current plan and clears the out-of-date state.
- **AC-03.3:** An update preserves checked state for a generated item that still matches under R-05 and preserves every custom item and its checked state.
- **AC-03.4:** An update removes generated items that no longer occur in the current plan and adds newly required generated items.

**Edge cases:**

- If every planned recipe is removed, updating removes all generated items but retains custom items.
- If a contributor changes while the normalized ingredient line remains the same, the item keeps its checked state and displays the current contributors.
- Repeated update requests produce the same list rather than duplicating items.

### US-04 — Shop with a persistent checklist

**Story:** As the Recipeapp owner, I want to check items and add personal extras, so that the generated list can serve as my complete shopping checklist.

**Rationale:** A list that cannot represent non-recipe purchases still requires a second shopping tool.

**Acceptance criteria:**

- **AC-04.1:** The owner can check or uncheck any grocery item, and the state remains after reload.
- **AC-04.2:** The owner can add a non-empty custom item, which is classified using the same deterministic sections and is clearly distinguishable from recipe-derived items.
- **AC-04.3:** The owner can remove a generated or custom item without changing recipes or meal-plan assignments.
- **AC-04.4:** Grocery sections with no current items are omitted, while an entirely empty list provides a clear recovery action.

**Edge cases:**

- Blank or whitespace-only custom items are rejected without changing the list.
- Removing a generated item is local to the current list; a later explicit update may restore it if the current plan still requires it.
- Identical custom items remain independent entries and are not merged with generated items.

## Non-functional requirements

- **NFR-01 — Accessibility:** Week navigation, recipe selection, plan actions, grocery checkboxes, and custom-item controls are keyboard operable, visibly labeled, and expose loading, success, and error states semantically.
- **NFR-02 — Responsive use:** The primary plan and grocery flows remain usable without horizontal page scrolling at 320, 768, and 1440 CSS pixels.
- **NFR-03 — Reliability:** Mutations return safe recoverable errors; failed writes do not optimistically leave the interface showing unpersisted plan or checklist state.
- **NFR-04 — Performance:** Loading a selected week uses bounded queries and responses; grocery generation processes only that week's seven assignments and their saved ingredients.
- **NFR-05 — Security and privacy:** All APIs remain same-origin behind the existing production Access policy, use bound D1 parameters, and return no provider credentials or private import-source content.
- **NFR-06 — Cost control:** Normal planning, list generation, reconciliation, and checklist use make zero AI or external-provider requests.

## Codebase context

Recipeapp is a single React/Vite application with route definitions in `src/app/router.tsx`, typed same-origin browser services, and a Cloudflare Worker that dispatches narrow `/api` handlers from `worker/index.ts`. Saved recipe details already expose ordered ingredients with required `originalText`, and Cooking Mode is a read-only route at `/recipes/:recipeId/cook`. D1 repositories use bound SQL and versioned migrations; the next feature migration follows `0010_restore_recipe_details.sql`. The existing verification portfolio includes component tests, Worker route tests, local D1 integration tests, and Playwright responsive journeys. No current table, API, or page stores meal plans or grocery lists.

The implementation must preserve the existing recipe deletion contract. Planned assignments can reference saved recipes with database-enforced cleanup, while grocery lists remain explicit persisted snapshots until Update grocery list is selected.

## Assumptions and open questions

### Assumptions

- **A-01:** One dinner slot per day is enough to validate weekly planning value; other meal types remain deferred.
- **A-02:** Weeks use the browser's local calendar date, begin on Sunday, and are identified by their Sunday `YYYY-MM-DD` value; cross-time-zone synchronization is not required for this single-owner MVP.
- **A-03:** The current owner-only Cloudflare Access deployment remains the authorization boundary. Multi-user ownership would require an amended data model and authorization rules.
- **A-04:** Deterministic section rules can be intentionally conservative. Incorrectly unrecognized items fall back to Other rather than invoking AI or risking omission.
- **A-05:** Removing a grocery item is immediately confirmed by the visible list change and remains recoverable through a later explicit Update when it was recipe-derived; no additional deletion confirmation is required.

### Open questions

- None. The owner selected navigable weeks, custom add/remove items, explicit list updates, deterministic sections, exact-match consolidation, and Sunday as the first day of the week during discovery.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-02 | Initial draft | Confirmed LiteSpec discovery | All |
