---
feature: cooking-history-feedback
artifact: spec
status: done
owner: user
version: 0.1
created: 2026-09-11
updated: 2026-09-11
---

# Specification: Cooking History and Feedback

## Summary

Add a private cooking log to each saved recipe. A cook can record that they made a recipe, optionally rate it and leave a short note, then use the accumulated history to choose recipes worth repeating.

## Problem

The library, plan, shopping list, and Cooking Mode support preparing a meal, but none records the outcome. The owner cannot tell what was recently made, how often a recipe is used, or preserve recipe-specific adjustments without editing the canonical recipe.

## Desired outcome

The owner can log a completed cook, see ordered history on the recipe, correct a mistaken log, and recognize frequency, latest cook date, and average rating in the Library and meal-planning selection.

## Boundaries

### Goals

- Persist one timestamped cook log for an explicit owner action, with optional 1–5 rating and short note.
- Show history and aggregate signals without mutating recipe content or invoking an external provider.
- Allow deletion of an individual log so an accidental entry is recoverable.

### Non-goals

- Editing a prior log, custom backdating, reminders, recommendations, sharing, and multi-user reviews are deferred.
- A Cook action does not automatically create a history entry; completion remains deliberate.

### Constraints

- Follow existing same-origin Worker, D1, typed browser-service, and safe-error conventions.
- The only user data is private to the existing owner-protected application and cascades when its recipe is deleted.

## Requirements

### Current release

- **R-01:** Store immutable cook-log rows for a saved recipe with server-generated timestamp, nullable integer rating from 1 through 5, and nullable trimmed note of at most 1,000 characters.
- **R-02:** Expose a safe recipe-scoped API to create and delete a cook log and include ordered history plus count, most-recent timestamp, and average rating in recipe detail reads.
- **R-03:** Include count, most-recent timestamp, and average rating in Library summary data without leaking individual notes.
- **R-04:** Provide an accessible recipe-detail form and history list, including useful empty, validation, loading, and mutation-error states.
- **R-05:** Show the aggregate cooking signal on recipe cards and clearly enough in the meal-plan recipe chooser to inform selection.

### Deferred

- **D-01:** Edit a recorded cook or choose a historical cook date; this release uses current server time and deletion/re-entry.
- **D-02:** Sort/filter/recommend recipes based on cooking history.

## User stories

### US-01 — Record a completed cook

**Story:** As the owner, I want to log that I cooked a saved recipe with an optional rating and note, so that the library reflects what happened in my kitchen.

**Rationale:** A deliberate outcome record closes the planning-to-cooking loop while preserving the recipe itself.

**Acceptance criteria:**

- **AC-01.1:** From a saved recipe detail page, the owner can submit a Cooked it action with no rating/note or with a whole-number rating from 1 to 5 and a note up to 1,000 characters.
- **AC-01.2:** On successful submission, the page displays the new entry immediately with a server-recorded date/time and only the entered rating/note fields; neither opening Cooking Mode nor viewing a recipe creates an entry.
- **AC-01.3:** Invalid ratings, whitespace-only notes, oversized notes, malformed requests, and unknown recipes receive safe feedback and create no entry.

**Edge cases:** A recipe with no history shows a clear first-log invitation; a request failure retains entered values for retry.

### US-02 — Review and correct cooking history

**Story:** As the owner, I want to review a recipe's recent cooking history and remove a mistaken entry, so that future decisions use trustworthy context.

**Rationale:** A small immutable log needs a recovery path without introducing complex edit semantics.

**Acceptance criteria:**

- **AC-02.1:** Recipe detail displays all retained entries newest first, each with its recorded date/time, and shows rating/note only when present.
- **AC-02.2:** The owner can delete one displayed entry; it disappears after success, recomputed aggregates update, and unknown recipe/log combinations return a safe not-found response.

**Edge cases:** Deleting the final entry restores the empty-history state; deleting a recipe cascades its logs.

### US-03 — Use outcome signals when choosing recipes

**Story:** As the owner, I want recent-cook, count, and rating signals where I browse and assign recipes, so that I avoid accidental repetition and favor recipes that worked.

**Rationale:** History only becomes useful when it informs the next planning decision.

**Acceptance criteria:**

- **AC-03.1:** Library cards display a truthful summary when history exists: cook count, latest cook date, and average rating when one or more ratings exist; absent data is not represented as a zero rating.
- **AC-03.2:** Meal Plan's recipe selection labels include the same compact signals without changing current assignment behavior or requiring external calls.

## Non-functional requirements

- **NFR-01 — Privacy:** List endpoints return aggregates only; individual notes are returned only in the owning recipe-detail response.
- **NFR-02 — Integrity:** Rating bounds, note limit, recipe ownership, and recipe-delete cascade are enforced at the Worker and D1 boundaries.
- **NFR-03 — Accessibility:** New controls use associated labels, keyboard-operable native controls, announced errors/status, and no color-only meaning.
- **NFR-04 — Compatibility:** The additive migration preserves existing recipes and existing API behavior.

## Codebase context

Recipeapp is a React/Vite SPA backed by a Cloudflare Worker and D1. Recipe CRUD is split between `src/services/recipes.ts`, `worker/routes/recipes.ts`, and `worker/repositories/recipes.ts`; local D1 test setup mirrors migrations in `tests/recipe-migration.ts`. Recipe details and cards already consume typed DTOs, while the Meal Plan page loads `RecipeSummary` values for its native select. Existing Worker, integration, component, and Playwright suites cover these surfaces.

## Assumptions and open questions

### Assumptions

- **A-01:** “Date” means a server-generated ISO timestamp displayed in the owner's locale; allowing backdating would be a material scope expansion.
- **A-02:** A five-star whole-number scale is a familiar, bounded personal signal and ratings remain optional.
- **A-03:** Individual notes are useful in recipe detail only; browse and meal-plan surfaces expose aggregates to keep the UI compact and private.

### Open questions

- None.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-11 | Initial implementation specification | User authorized cooking-history feature | All |
