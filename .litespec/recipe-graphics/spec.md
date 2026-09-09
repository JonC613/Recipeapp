---
feature: recipe-graphics
artifact: spec
status: implementing
owner: user
version: 0.1
created: 2026-09-09
updated: 2026-09-09
---

# Specification: Recipe Graphics

## Summary

Recipe Graphics gives each saved recipe one optional, playful AI-generated menu image. It should make the meal recognizable while deliberately exaggerating the presentation.

## Problem

Recipes currently have no visual identity after import or manual entry. Typical AI-menu art is often over-serious; this feature makes that convention part of the joke without misrepresenting the recipe.

## Desired outcome

The owner can explicitly generate and view one private graphic from a recipe detail page, with predictable low per-image cost and no browser exposure of the provider key.

## Boundaries

### Goals

- Generate one recognizable, outrageous, text-free square PNG for a saved recipe on explicit owner action.
- Store and serve the image privately through the existing Worker/R2 boundary.

### Non-goals

- Automatic generation, bulk generation, editing, user uploads, public image URLs, or image-to-recipe extraction changes.
- Claiming that generated art is an accurate photograph or ingredient-level guarantee.

### Constraints

- Use `gpt-image-1-mini`, `low` quality, and 1024×1024 output: the current low-cost supported choice.
- One successful graphic per recipe; reruns require a later deliberate feature change.

## Requirements

### Current release

- **R-01:** A saved recipe without a graphic offers an explicit, cost-disclosed generate action; a saved graphic is shown on its detail page with a playful AI-art disclosure.
- **R-02:** The Worker builds the prompt from bounded title, description, and ingredient text, requests one low-quality image, and requires no browser provider credential.
- **R-03:** Generated PNG bytes and their private R2 key persist against the recipe; the browser receives an authenticated Worker image response, never the key or raw provider payload.
- **R-04:** Missing recipes, provider failures, invalid image output, and repeat-generation attempts return safe, recoverable responses without recording a broken graphic.

### Deferred

- **D-01:** Regeneration, art styles, bulk backfill, deletion, and billing dashboards.

## User stories

### US-01 — Give a recipe menu art

**Story:** As the owner, I want to generate amusing menu art for a saved recipe, so that the library feels visual without paying for images I did not request.

**Rationale:** Explicit generation and single-image persistence make cost and behavior predictable.

**Acceptance criteria:**

- **AC-01.1:** A recipe detail page shows a cost-disclosed generation action only when no graphic exists.
- **AC-01.2:** Given a successful generation, when the detail page reloads, then it shows the stored graphic and an AI-art disclosure.
- **AC-01.3:** A second generation attempt for the same recipe is rejected without another provider request.

**Edge cases:** Missing recipes return 404; a provider or storage failure keeps the recipe usable and shows safe recovery text.

### US-02 — Keep imagery private and bounded

**Story:** As the owner, I want AI imagery to remain inside the protected app, so that recipe data and provider access stay private.

**Rationale:** The app already uses Cloudflare Access and private R2 for sensitive recipe sources.

**Acceptance criteria:**

- **AC-02.1:** Browser code receives only a same-origin image route and never an API key, R2 key, or raw provider output.
- **AC-02.2:** The image request is one 1024×1024 low-quality generation using bounded recipe fields.

**Edge cases:** Malformed provider output is rejected and no R2 key is saved.

## Non-functional requirements

- **NFR-01 — Cost:** Generation is manual and limited to one stored image per recipe; the UI shows an approximate $0.005 image cost based on current official pricing.
- **NFR-02 — Privacy:** R2 objects stay private and are served only through the protected Worker route.
- **NFR-03 — Compatibility:** Existing recipe CRUD, imports, chat, cooking mode, and meal planning remain unchanged.

## External input and data handling

- **Sources and validation:** The Worker sends bounded saved recipe title, description, and at most 12 bounded ingredient lines to the image provider.
- **Files:** PNG output is stored at a recipe-scoped private R2 key. No automatic cleanup or deletion is in the current release.
- **Data and access:** Cloudflare Access remains the owner boundary; the Worker holds the provider key and D1 stores only the R2 key and generation timestamp.

## Codebase context

The React detail page uses typed same-origin recipe services. The Cloudflare Worker owns OpenAI calls, D1 recipes, and private `RECIPE_SOURCES` R2 storage. Migration `0012_recipe_graphics.sql` adds graphic metadata without changing recipe source data.

## Assumptions and open questions

### Assumptions

- **A-01:** The existing OpenAI project can access `gpt-image-1-mini`; unavailable access is a safe retryable failure.

### Open questions

- None.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | Initial implementation record | Feature was already authorized and implemented | All |
