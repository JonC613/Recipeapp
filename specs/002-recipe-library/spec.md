# Feature Specification: Recipe Library CRUD

**Feature Branch**: `002-recipe-library`

**Created**: 2026-08-27

**Status**: Approved

**Input**: User description: "Implement manual Recipe Library CRUD: create a recipe manually, save it,
view it in the library and detail page, edit it, favorite or unfavorite it, delete it, and use basic
title search. Preserve the stable Recipe, Ingredient, Instruction, and Source domain model; no
imports, AI, authentication, or deployed release."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save and Read a Manual Recipe (Priority: P1)

A home cook manually enters a recipe, saves it to their library, and opens a clear, cooking-friendly
detail view later.

**Why this priority**: This is the first durable recipe workflow. It establishes the data and user
experience required before recipes can be imported from any outside source.

**Independent Test**: Create a recipe with a title, ingredients, instructions, timings, tags, and a
note; save it; reopen it from the library; and verify the entered information is retained in its
original order.

**Acceptance Scenarios**:

1. **Given** an empty library, **When** a cook enters and saves a valid manual recipe, **Then** it
   appears in the library and can be opened.
2. **Given** a saved recipe with ingredient and instruction lists, **When** the cook opens it,
   **Then** the lists appear in the entered order and the ingredient text remains available exactly
   as entered.
3. **Given** a cook is entering a recipe, **When** required information is missing or invalid,
   **Then** the recipe is not saved and the cook receives a clear, field-level correction message.
4. **Given** a cook views a saved recipe on a narrow screen, **When** they read its ingredients and
   instructions, **Then** the content is readable and operable without horizontal scrolling.

---

### User Story 2 - Maintain a Saved Recipe (Priority: P2)

A cook corrects a saved recipe, marks recipes they want to return to as favorites, and removes a
recipe they no longer want.

**Why this priority**: A personal library remains useful only when its entries can be corrected,
organized, and removed with confidence.

**Independent Test**: Edit the title and a list item of a saved recipe, save the change, toggle its
favorite state, and delete it after confirmation.

**Acceptance Scenarios**:

1. **Given** a saved recipe, **When** a cook edits its details and saves, **Then** the detail view
   and library show the revised values and preserve unedited values.
2. **Given** a saved recipe, **When** a cook marks it as a favorite or removes that mark, **Then**
   the library and detail view immediately reflect the chosen state.
3. **Given** a saved recipe, **When** a cook confirms deletion, **Then** it is removed from the
   library and cannot be opened from its former address.
4. **Given** a cook starts deletion, **When** they cancel the confirmation, **Then** the recipe
   remains unchanged.

---

### User Story 3 - Find a Recipe by Title (Priority: P3)

A cook filters their saved library by title so they can reopen a known recipe without scanning every
card.

**Why this priority**: Simple title search makes the first library immediately practical while
leaving broader ingredient, tag, category, and semantic search to later work.

**Independent Test**: Save recipes with distinct titles, enter a partial title query, and verify
only matching titles remain visible; then clear the query and verify the complete library returns.

**Acceptance Scenarios**:

1. **Given** a library containing several recipes, **When** a cook enters a partial title query,
   **Then** matching recipes are shown regardless of title capitalization.
2. **Given** an active title query with no matches, **When** the filter is applied, **Then** the
   cook sees a clear empty-result message and can clear the query.
3. **Given** an active title query, **When** the cook clears it, **Then** all saved recipes are
   shown again.

### Edge Cases

- A title contains only whitespace or exceeds the supported entry length.
- A cook saves a recipe with no optional metadata, no ingredients, or no instructions.
- A cook removes every ingredient or instruction while editing.
- A requested recipe has been deleted, is malformed, or does not exist.
- A title search includes leading/trailing whitespace, punctuation, or no matching title.
- A save, update, favorite action, or deletion fails temporarily.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let a cook create and save a manual recipe with a non-empty title.
- **FR-002**: A manual recipe MUST support an optional description, servings, preparation time,
  cooking time, total time, cuisine, category, tags, notes, ingredients, and instructions.
- **FR-003**: The system MUST retain each ingredient's original entered text and retain ingredient
  and instruction ordering.
- **FR-004**: Each saved manual recipe MUST identify its source as manual and preserve its creation
  and most-recent-update times.
- **FR-005**: The system MUST show saved recipes in a library view with enough summary information
  to identify a recipe and its favorite state.
- **FR-006**: The system MUST provide a detail view that presents a saved recipe's metadata,
  ingredients, instructions, notes when present, and source information in a cooking-friendly order.
- **FR-007**: The system MUST let a cook update every editable manual-recipe field and persist the
  revised recipe without replacing unedited values.
- **FR-008**: The system MUST let a cook favorite and unfavorite a saved recipe from the library or
  detail view.
- **FR-009**: The system MUST require an explicit confirmation before permanently deleting a saved
  recipe and its associated manual recipe data.
- **FR-010**: The system MUST provide a case-insensitive title filter that ignores leading and
  trailing query whitespace and clearly represents no-match results.
- **FR-011**: The system MUST show understandable recovery actions for unavailable, missing, or
  failed recipe operations without revealing internal details.
- **FR-012**: The library, create/edit flow, and detail view MUST remain readable and operable from
  320 through 1440 CSS pixels without horizontal page scrolling.
- **FR-013**: Recipe persistence and storage paths MUST allow future owner attribution without
  embedding a single-user assumption in recipe identifiers or storage paths.
- **FR-014**: This feature MUST NOT implement recipe URL, text, PDF, image, or screenshot import;
  AI extraction; authentication; sharing; meal planning; grocery lists; nutrition; ratings; or
  advanced ingredient/tag/category/semantic search.

### Key Entities

- **Recipe**: A user-saved cooking record with title, optional descriptive and timing metadata,
  favorite state, source, timestamps, ingredients, instructions, tags, and notes.
- **Ingredient**: An ordered recipe component that always retains the original entered text and may
  also retain structured quantity, unit, ingredient, preparation, and optionality information.
- **Instruction**: An ordered, numbered cooking step belonging to one recipe.
- **Recipe Source**: The provenance of a recipe. This feature creates only manual sources while
  preserving fields needed for future URL, PDF, and text sources.
- **Tag**: A user-provided label associated with one recipe for future discovery capabilities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A cook can create, save, and reopen a basic manual recipe from an empty library in
  under 3 minutes.
- **SC-002**: 100% of entered titles, ingredient original text, instruction order, favorite state,
  and edited fields survive a save-and-reopen journey in automated acceptance coverage.
- **SC-003**: Automated journeys confirm create, view, edit, favorite, delete, and title-filter
  behavior at 320, 768, and 1440 CSS pixel viewport widths without horizontal page scrolling.
- **SC-004**: A title filter returns matching titles regardless of capitalization and returns the
  full saved library after the query is cleared in all automated acceptance cases.
- **SC-005**: All tested missing-record and failed-operation paths offer a recovery action and
  reveal zero credentials, configuration values, stack traces, or internal identifiers.

## Assumptions

- The app remains a local personal-development application; there is no sign-in experience or
  concurrent user workflow in this feature.
- A title is the only required field for a manual recipe; a cook may save a partial recipe and add
  ingredients or instructions later.
- Deletion is permanent for a manual recipe after confirmation; restoring deleted recipes is outside
  this feature.
- Recipe cards have no images in this feature; an image placeholder may be shown without creating
  image-upload behavior.
- Title filtering is the only discovery behavior in this feature. Broader search remains a later
  feature.
