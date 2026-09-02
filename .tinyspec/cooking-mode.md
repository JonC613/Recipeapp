---
feature: cooking-mode
artifact: tiny
status: done
owner: user
version: 0.1
created: 2026-09-02
updated: 2026-09-02
---

# TinySpec: Cooking Mode

## Summary

Add a focused cooking view for a saved recipe so the cook can follow instructions comfortably on a phone without losing access to ingredients. It is a read-only presentation of the already approved recipe, not a second recipe editor or a new planning system.

## Scope

### Included

- A `Cook` action on a saved recipe and a `/recipes/:recipeId/cook` route.
- Large, high-contrast, mobile-first presentation of one ordered instruction at a time.
- Previous/next controls, a visible step count, and disabled boundary controls.
- A compact ingredients section that remains available without leaving Cooking Mode.
- Clear navigation back to the normal recipe detail page.

### Excluded

- Timers, alarms, recipe scaling, persistent ingredient check-offs, wake-lock behavior, offline/PWA work, and recipe edits.
- Database, Worker API, schema, migration, AI, authentication, or deployment-configuration changes.

## Requirements

- **R-01:** From a loaded saved recipe, the cook can open Cooking Mode and return to that recipe's normal detail view.
- **R-02:** Cooking Mode presents the recipe title and current numbered instruction in a readable mobile layout, with the current step and total step count announced in text.
- **R-03:** The cook can move one step backward or forward without a network request; the first previous and final next controls are disabled.
- **R-04:** Ingredients are available in Cooking Mode, and recipes with no instructions show an honest empty state instead of unusable controls.
- **R-05:** The view is keyboard-accessible, uses semantic controls, preserves existing source data unchanged, and remains usable at 320 px, 768 px, and desktop widths.

## Constraints and assumptions

- Reuse the existing typed recipe-read service and recipe-detail data; local selected-step state resets when the page is left or reloaded.
- Existing browser support is sufficient for this presentation-only MVP; no browser wake-lock API is requested.
- The existing owner-protected application hostname remains the access boundary.

## Implementation outline

- Add a route and a small page/component that loads one recipe, owns only the current instruction index, and reuses the app's established typography, colors, and responsive layout patterns.
- Add the entry action to `RecipeDetailPage`, plus focused component and Playwright coverage for navigation, boundaries, empty instructions, and responsive presentation.

## Verification

- Component tests prove the entry action, current step, next/previous state, ingredients, and empty-instruction state.
- Playwright verifies the cook journey from a recipe detail page at 320 px, 768 px, and 1440 px with no browser-console failure.
- Typecheck, lint, and existing critical tests remain passing.

## Done when

- [x] All current requirements have passing evidence.
- [x] Cooking Mode does not mutate a recipe or add a provider/API dependency.
- [x] No unresolved issue blocks the stated outcome.

## Amendment history

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-09-02 | Initial draft | Initial discovery |
