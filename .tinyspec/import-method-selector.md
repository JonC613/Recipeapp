---
feature: import-method-selector
artifact: tiny
status: done
owner: user
version: 0.1
created: 2026-08-31
updated: 2026-08-31
---

# TinySpec: Import Method Selector and Focused Workspace

## Summary

Replace the long, all-at-once Import page with a concise source chooser and a
single focused workspace. A cook should choose how they have a recipe, complete
only the relevant import form, then continue into the unchanged review-and-save
flow.

## Scope

### Included

- A clear source chooser for URL, pasted text, PDF, image/screenshot, TheMealDB,
  and manual entry.
- One visible, focused import form at a time for URL, text, PDF, or image.
- Shared review/safety guidance and clearer image action labels.
- Responsive, keyboard-accessible styling for the Import page only.

### Excluded

- Changes to Worker APIs, imports, AI/OCR behavior, R2/D1 persistence, routes,
  review/save pages, TheMealDB browse page, or any import validation rule.

## Requirements

- **R-01:** The Import page presents a labeled, keyboard-accessible source chooser
  before the active workspace; URL is the initial selected source and selecting a
  source never initiates an API request or saves data.
- **R-02:** Selecting URL, text, PDF, or image shows only that existing form and
  preserves its labels, validation, submission behavior, and destination.
- **R-03:** TheMealDB and manual entry remain available as distinct source choices
  that link to their current routes; choosing them does not create an import.
- **R-04:** Shared copy makes explicit that no recipe is saved until review, and
  image actions distinguish retaining/uploading an image from the later explicit
  AI extraction step.
- **R-05:** At 320px, the chooser and active workspace have no horizontal overflow
  and retain visible focus and accessible names.

## Constraints and assumptions

- Reuse current React, TypeScript, and CSS; add no dependency or backend change.
- Keep all existing import component instances and typed service calls intact;
  presentation state may be local to `RecipeImportPage`.
- Preserve the calm green/cream visual style and the current explicit review and
  AI-credit boundaries.

## Implementation outline

- Refactor `RecipeImportPage` into source chooser, one selected workspace, and
  shared helper copy; use existing form components and existing links unchanged.
- Add focused CSS for compact source choices and the active-workspace hierarchy.
- Update Playwright coverage to prove selection, preserved imports, destinations,
  and narrow-screen layout.

## Verification

- Component or browser tests prove each source choice is reachable by name and
  only its relevant form is visible.
- Existing URL, text, PDF, image, and TheMealDB journeys remain passing.
- Playwright verifies 320px has no horizontal overflow; local visual review checks
  that the first decision and active action are immediately understandable.

## Done when

- [x] All current requirements have passing evidence.
- [x] The Import page is visually reviewed at mobile and desktop widths.
- [x] Existing import, review, and recovery behavior remains unchanged.
- [x] No unresolved issue blocks the stated outcome.

## Amendment history

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Focus the cluttered import workflow |
