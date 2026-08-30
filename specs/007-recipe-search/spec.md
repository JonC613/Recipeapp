# Feature Specification: Recipe Search

**Feature Branch**: `007-recipe-search`

**Created**: 2026-08-29

**Status**: Complete — implemented, owner-approved, and recorded in Project Memory

**Input**: User description: "Implement basic search across title, ingredients, tags, cuisine, and category, with basic filtering. Do not implement semantic/vector search."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Recipes by Words (Priority: P1)

A cook types a word or phrase into the Recipe Library search field and sees saved recipes whose title,
ingredients, tags, cuisine, or category match, so they can quickly find something they want to cook.

**Why this priority**: Finding an already-saved recipe is the core purpose of a personal recipe library.

**Independent Test**: Create saved recipes whose matching words appear in different searchable fields,
search for each word or phrase, and verify only the expected recipe cards are shown.

**Acceptance Scenarios**:

1. **Given** saved recipes include a matching title, **When** the cook searches a title word, **Then** the
   matching recipe is shown.
2. **Given** saved recipes include a matching ingredient, tag, cuisine, or category, **When** the cook
   searches that value, **Then** each corresponding recipe is shown.
3. **Given** capitalization or surrounding spaces differ, **When** the cook searches, **Then** matching
   is case-insensitive and ignores leading and trailing spaces.
4. **Given** no saved recipe matches, **When** the cook searches, **Then** the library clearly states that
   there are no matching recipes and keeps the search phrase available to change.

---

### User Story 2 - Narrow the Recipe Library (Priority: P2)

A cook combines a search phrase with simple filters to narrow a large library to the recipes that fit
their immediate need.

**Why this priority**: A search result is more useful when a cook can focus on favorites or a particular
tag, ingredient, cuisine, or category without manually scanning unrelated cards.

**Independent Test**: Create matching and non-matching recipes, apply each supported filter alone and
with a search phrase, and verify only recipes satisfying every selected criterion remain visible.

**Acceptance Scenarios**:

1. **Given** the library contains favorites and non-favorites, **When** the cook enables the favorites
   filter, **Then** only favorite recipes are shown.
2. **Given** recipes have different tags, ingredients, cuisines, or categories, **When** the cook applies
   one of those filters, **Then** only matching recipes are shown.
3. **Given** a search phrase and filter are both active, **When** the cook views the results, **Then** a
   recipe is shown only when it matches both.
4. **Given** a filter produces no results, **When** the cook clears that filter, **Then** the matching
   recipes from the remaining criteria are restored.

---

### User Story 3 - Search on a Phone While Cooking (Priority: P3)

A cook can search, filter, clear the current search, and open a result at phone, tablet, and desktop
widths without controls overlapping or becoming inaccessible.

**Why this priority**: Recipe lookup commonly happens in a kitchen on a phone, where clear controls and
quick recovery matter.

**Independent Test**: At narrow, medium, and wide browser widths, search for a saved recipe, apply and
clear a filter, and open the resulting recipe.

**Acceptance Scenarios**:

1. **Given** a phone-width library, **When** the cook searches or changes a filter, **Then** the controls
   remain visible, labeled, and usable without horizontal scrolling.
2. **Given** active search criteria, **When** the cook chooses to clear them, **Then** the full saved
   library is restored.

### Edge Cases

- A blank search phrase returns recipes subject only to selected filters.
- Multiple whitespace characters are treated like a single separator for matching.
- A recipe with no optional category, cuisine, or tags can still be found by its title or ingredients.
- Search text is treated only as text, never as an instruction or executable query.
- If saving, favoriting, or deleting changes the library while criteria are active, the refreshed results
  continue to honor those criteria.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a cook to search saved recipes using a keyword or phrase from the
  library screen.
- **FR-002**: Search matching MUST consider recipe title, ingredient wording, tags, cuisine, and category.
- **FR-003**: Search matching MUST be case-insensitive and disregard leading and trailing whitespace.
- **FR-004**: The system MUST allow the cook to filter the library by favorite status, tag, ingredient,
  cuisine, or category.
- **FR-005**: When a search phrase and one or more filters are active, the system MUST show only recipes
  that satisfy all active criteria.
- **FR-006**: The system MUST provide a clear, accessible empty state that distinguishes an empty library
  from a search or filter with no matches.
- **FR-007**: The system MUST allow a cook to clear active search text and filters and restore the full
  library without losing saved recipes or changing recipe data.
- **FR-008**: Search and filter controls MUST be usable at phone, tablet, and desktop widths.
- **FR-009**: Search and filters MUST operate only on saved recipes; they MUST NOT expose import source
  content, failed imports, OCR text, provider data, or private file references.
- **FR-010**: The system MUST preserve a replaceable traditional-search boundary so a future semantic
  search capability can be added without changing saved recipe data or existing user-facing behavior.

### Key Entities *(include if feature involves data)*

- **Search criteria**: The cook-selected keyword and optional filters that define which saved recipes are
  visible; it does not alter recipe data.
- **Search result**: A saved recipe that satisfies all active criteria and remains openable through the
  existing recipe-detail workflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a library containing representative matches across all five searchable fields, 100% of
  the expected matching recipes are returned for each individual field search.
- **SC-002**: In a mixed library, 100% of displayed recipes satisfy every active search and filter
  criterion, as verified by automated acceptance coverage.
- **SC-003**: A cook can enter a search, recognize the result or empty state, and open a matching recipe
  in under 15 seconds at phone, tablet, and desktop widths.
- **SC-004**: Automated coverage verifies searching, filtering, clearing criteria, and no-result recovery
  at 320, 768, and 1440 CSS pixels.
- **SC-005**: Search behavior never returns unsaved import content or private source-file references in
  automated boundary tests.

## Assumptions

- The MVP uses traditional keyword and field filtering over saved recipe records; semantic, conversational,
  and vector-based search are explicitly out of scope.
- A keyword or phrase may match any searchable field; a multi-word phrase is treated as text that must be
  meaningfully present in the matched field rather than as a request for recipe generation or substitution.
- Existing title filtering is replaced or extended by the unified search experience rather than retained as
  a separate, conflicting control.
- The feature does not add authentication, recipe sharing, nutrition, meal planning, or changes to import
  approval behavior.
