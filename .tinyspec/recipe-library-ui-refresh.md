---
feature: recipe-library-ui-refresh
artifact: tiny
status: done
owner: user
version: 0.1
created: 2026-08-31
updated: 2026-08-31
---

# TinySpec: Recipe Library UI Refresh

## Summary

Refresh the saved-recipe Library so a cook can orient quickly, start an import
without hunting, scan recipe summaries more easily, and use search and filters
comfortably on a phone. This is a presentation-only improvement to the existing
library workflow; no recipe data or API behavior changes.

## Scope

### Included

- A clearer Library heading with one visually dominant "Add recipe" action.
- Search and filter controls that remain readable, touch-friendly, and compact at
  320px wide.
- Recipe cards that expose favorite state plus available category and prep/cook
  time in a consistent summary hierarchy.
- Responsive visual polish limited to the shared shell, Library page, and recipe
  card component.

### Excluded

- Changes to import, TheMealDB, recipe detail, editing, routing, Worker APIs,
  database schema, search semantics, or deployment configuration.
- A new design system, a paid UI service, new images, or new product features.

## Requirements

- **R-01:** The Library presents one prominent, keyboard-accessible Add recipe
  action and retains existing navigation and skip-link behavior.
- **R-02:** At 320px, search, filter controls, and active-filter recovery fit
  without horizontal scrolling and retain their existing accessible labels.
- **R-03:** Every populated recipe card renders a clear title, recipe/favorite
  state, and any available category, prep time, and cook time without changing
  its detail destination.
- **R-04:** Existing empty, filtered-empty, and loading/error behavior remains
  intact; the visual refresh must not change query parameters or fetch behavior.

## Constraints and assumptions

- Reuse React, TypeScript, and the current CSS-only styling approach; do not add
  a component library or design-tool dependency.
- Preserve the current calm green/cream visual character while improving contrast,
  hierarchy, and mobile density.
- The existing component and Playwright test suites are the primary regression
  evidence; no backend or migration tests are needed for this UI-only change.

## Implementation outline

- Update `src/app/AppShell.tsx`, `src/pages/RecipeLibraryPage.tsx`,
  `src/components/recipes/RecipeCard.tsx`, and `src/app/styles.css` as needed.
- Add or update focused browser-component and end-to-end assertions for card
  metadata, accessible controls, and the 320px layout.
- Run the relevant UI tests and inspect the local app at mobile and desktop widths
  before proposing any deployment.

## Verification

- Component tests prove the accessible Library controls and recipe-card metadata.
- Playwright proves the saved-recipe Library remains operable at 320px, 768px,
  and 1440px, including search/filter recovery and recipe navigation.
- Local visual review confirms clear hierarchy and no horizontal overflow at the
  narrow viewport.

## Done when

- [x] All current requirements have passing evidence.
- [x] The updated Library is visually reviewed at mobile and desktop widths.
- [x] Existing recipe CRUD, search, and import navigation behavior remain unchanged.
- [x] No unresolved issue blocks the stated outcome.

## Amendment history

| Version | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Initial discovery |
