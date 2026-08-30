# Feature Specification: Browse and Save TheMealDB Recipes

**Feature Branch**: `009-mealdb-browse-import`

**Created**: 2026-08-30

**Status**: Approved — 2026-08-30

**Input**: User description: "Create an MVP that lets the owner browse TheMealDB recipes and save an
approved copy to Recipeapp."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse a Recipe Collection (Priority: P1)

As the owner, I can choose a TheMealDB category or area and see a concise list of available recipes, so I
can discover a recipe without needing a third-party recipe URL.

**Why this priority**: This is the minimum "browse" experience requested and has value even before
search refinements.

**Independent Test**: From Add Recipe, open Browse TheMealDB, select one available category or area, and
confirm that matching recipe names are displayed or a clear empty-state is shown.

**Acceptance Scenarios**:

1. **Given** the owner opens Browse TheMealDB, **When** they select an available category or area,
   **Then** the application displays a bounded recipe list supplied by TheMealDB.
2. **Given** the provider is unavailable or returns no matching recipes, **When** the owner browses,
   **Then** the application shows a safe recovery message and does not create an import or recipe.

---

### User Story 2 - Search and Preview One Recipe (Priority: P1)

As the owner, I can search TheMealDB by recipe name and open one result to inspect its title, ingredients,
instructions, and source attribution before choosing to import it.

**Why this priority**: A name search makes the small MVP useful when a cook already knows what they want.

**Independent Test**: Search for a known TheMealDB recipe, select a result, and verify its readable recipe
details and TheMealDB attribution appear without creating anything in the Recipe Library.

**Acceptance Scenarios**:

1. **Given** a non-empty recipe-name search, **When** TheMealDB returns matches, **Then** the owner can
   open a result preview.
2. **Given** the preview is open, **When** the owner leaves it without importing, **Then** no Recipeapp
   import record or saved recipe is created.

---

### User Story 3 - Review and Save a TheMealDB Recipe (Priority: P1)

As the owner, I can import one selected TheMealDB recipe into the existing review screen, correct it, and
explicitly save my approved Recipeapp copy.

**Why this priority**: It preserves Recipeapp's central workflow: source → draft → review → explicit save.

**Independent Test**: Select a TheMealDB recipe, choose Import, edit one field in review, save it, and
confirm that the saved Recipe Library entry contains the edit and identifiable TheMealDB provenance.

**Acceptance Scenarios**:

1. **Given** a selected provider recipe, **When** the owner chooses Import, **Then** Recipeapp creates an
   unsaved draft and opens the existing review/edit experience.
2. **Given** a ready TheMealDB draft, **When** the owner changes fields and saves, **Then** exactly one
   Recipeapp recipe is created from the reviewed fields, while the retained provider-source snapshot remains
   unchanged.
3. **Given** the owner never explicitly saves the draft, **When** they leave review, **Then** no recipe is
   added to the Recipe Library.

### Edge Cases

- TheMealDB returns a recipe without instructions, ingredients, category, area, image, or original-source URL.
- The provider has an ingredient/measure pair that Recipeapp cannot confidently split; original ingredient
  text remains preserved in the draft.
- A category, area, or name search returns no matches.
- The provider request fails, exceeds the supported response bound, or returns malformed data.
- A recipe identifier is not found when the owner opens it from a search or browse result.
- The same TheMealDB recipe is imported more than once; each import remains a separate review attempt and
  none overwrites a previously approved recipe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Recipeapp MUST offer Browse TheMealDB from the existing Add Recipe experience.
- **FR-002**: The MVP MUST let the owner browse a provider-supplied category or area and search by a
  recipe-name query.
- **FR-003**: Recipeapp MUST retrieve TheMealDB data through its server-side application boundary; browser
  code MUST NOT call the provider directly or receive provider credentials.
- **FR-004**: Selecting a provider recipe MUST show a preview before it creates an import attempt.
- **FR-005**: Importing a selected recipe MUST normalize it into the existing stable Recipe Draft model and
  MUST reuse the existing review and explicit-save workflow.
- **FR-006**: A TheMealDB import MUST retain source provenance sufficient to identify TheMealDB and the
  selected provider recipe; it MUST preserve the original provider ingredient/measure text where structured
  conversion is uncertain.
- **FR-007**: The feature MUST NOT use AI or an OpenAI call to browse, preview, or import TheMealDB data.
- **FR-008**: The feature MUST NOT automatically save a recipe, overwrite a user-approved recipe, or fetch
  content by scraping TheMealDB's website.
- **FR-009**: Provider failures MUST expose a safe, understandable recovery message and MUST NOT expose
  provider credentials, raw provider payloads, or internal implementation details.
- **FR-010**: The MVP MUST clearly attribute provider-supplied data to TheMealDB in the preview and saved
  recipe source information, consistent with the provider's applicable terms.

### Key Entities *(include if feature involves data)*

- **TheMealDB browse result**: A transient summary of one provider recipe, including its provider identifier,
  title, and optional image/category metadata. It is not a saved Recipeapp recipe.
- **TheMealDB recipe detail**: The provider's selected recipe representation used to make a normalized,
  unsaved Recipeapp draft.
- **TheMealDB import**: A retained import attempt whose immutable source identifies TheMealDB and the
  selected provider recipe, separate from an owner-approved Recipeapp recipe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can browse a category or area, open a recipe, and reach an import review draft in
  under two minutes on a normal network connection.
- **SC-002**: The owner can search by a recipe name and open a matching preview in one request cycle without
  adding a Recipeapp import or recipe until Import is explicitly selected.
- **SC-003**: Every saved TheMealDB recipe has passed through review and identifies TheMealDB as its source.
- **SC-004**: When the provider is unavailable or returns no match, Recipeapp preserves the owner's current
  Recipe Library and offers a recovery action rather than exposing a technical error.

## Assumptions

- The owner is using Recipeapp as a personal, owner-only application, so TheMealDB's documented
  personal/development API access is suitable for this MVP. A public or multi-user release requires a fresh
  terms, attribution, rate-limit, and credential review before enabling the feature.
- TheMealDB's documented official API endpoints are the only data source; Recipeapp will not scrape the
  provider website.
- This MVP uses provider recipe data as a distinct import source and does not add image storage, nutrition,
  meal planning, grocery lists, or semantic search.
- Existing Cloudflare Access, D1, R2 privacy, import history, review-before-save, and server-only secret
  boundaries remain unchanged.

## Dependencies and Source References

- [TheMealDB API Guide](https://www.themealdb.com/docs_api_guide.php)
- [TheMealDB Terms of Use](https://www.themealdb.com/terms_of_use.php)
- Existing [Import Review specification](../004-import-review/spec.md) and [Recipe Import data model](../003-url-import/data-model.md)
