# Feature Specification: Import Review and Save

**Feature Branch**: `004-import-review`

**Created**: 2026-08-29

**Status**: Done

**Input**: User description: "Review imported recipe drafts, correct fields, and explicitly save an approved recipe without losing import provenance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review and Save an Imported Recipe (Priority: P1)

A cook opens a ready import draft, reviews its recipe information, and explicitly saves an approved
version into the recipe library.

**Why this priority**: URL import is not useful as a long-term capture method until a cook can approve
the result and find it later in the library.

**Independent Test**: Create a controlled ready import, open its review experience, save it unchanged,
and verify one library recipe appears with the draft's recipe information while the original import
record remains available.

**Acceptance Scenarios**:

1. **Given** a cook has a ready imported draft, **When** they open review, **Then** they can see the
   extracted recipe fields and original source before saving.
2. **Given** a cook reviews a valid draft, **When** they choose Save Recipe, **Then** a new recipe
   appears in the library and the cook is taken to it.
3. **Given** a cook saves an import, **When** they later retrieve that import, **Then** its original
   source address and extracted snapshot remain unchanged.

---

### User Story 2 - Correct an Imported Draft (Priority: P2)

A cook corrects incomplete or inaccurate imported information before approving it.

**Why this priority**: Review protects the library from extraction mistakes and is the core trust
boundary for imported recipes.

**Independent Test**: Open a controlled ready draft, change its title, ingredients, instructions, and
metadata, save it, and verify the library recipe reflects the edits while the import snapshot does not.

**Acceptance Scenarios**:

1. **Given** a ready draft, **When** a cook edits any supported recipe field, **Then** the edited
   values are available for review before saving.
2. **Given** a cook adds, removes, or changes ingredients and instructions, **When** they save, **Then**
   their edited ordering and original ingredient text are retained in the approved recipe.
3. **Given** a cook has corrected an imported draft, **When** they save it, **Then** only the new
   approved recipe contains those corrections.

---

### User Story 3 - Leave an Import Unsaved (Priority: P3)

A cook can leave review without adding an unapproved draft to the library.

**Why this priority**: A cook must remain in control when an import needs more work or should not be
kept.

**Independent Test**: Open a ready draft, choose Cancel or return to the library, and verify that no
new library recipe exists while the ready import remains retrievable.

**Acceptance Scenarios**:

1. **Given** a cook is reviewing a draft, **When** they cancel, **Then** no recipe is created and they
   can return to the library or import another recipe.
2. **Given** a cook opens a missing, failed, or non-recipe import, **When** they attempt review,
   **Then** they receive a safe recovery message and cannot save it.

### Edge Cases

- A ready import's stored snapshot is incomplete but the cook supplies the required recipe title
  before saving.
- A cook removes every ingredient or instruction; the approved recipe may retain empty lists but must
  still have a valid title.
- A cook submits review twice or returns to review after a successful save; duplicate approval must
  not be created accidentally.
- The import record is missing, malformed, failed, or has no ready draft.
- A save request fails; the cook receives a safe retryable message and the import remains unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow review only for a retrievable ready import draft.
- **FR-002**: The review experience MUST display the imported recipe fields and the original source
  address, clearly indicating that the import remains unsaved until approval.
- **FR-003**: A cook MUST be able to edit title, description, servings, times, ingredients,
  instructions, cuisine, category, tags, notes, and favorite state before saving.
- **FR-004**: The system MUST validate the approved recipe using the same stable recipe rules as manual
  recipe creation and show actionable validation errors without losing the cook's edits.
- **FR-005**: Saving a reviewed draft MUST create exactly one new approved library recipe and MUST NOT
  overwrite or mutate the source import record or its extraction snapshot.
- **FR-006**: The system MUST prevent accidental duplicate saves from one review submission and give a
  clear result after an approved recipe is created.
- **FR-007**: Canceling or leaving review MUST NOT create or modify a library recipe, and the ready
  import MUST remain retrievable.
- **FR-008**: Missing, failed, malformed, or non-ready imports MUST not expose a save action and MUST
  provide safe recovery to the library or another import.
- **FR-009**: The review flow MUST NOT add AI parsing, new import types, automatic recipe saving,
  authentication, semantic search, or remote deployment.

### Key Entities

- **Ready Import Draft**: A retained, unapproved extraction snapshot associated with an original
  source address and import status.
- **Review Form**: A cook-owned editable working copy of a ready draft; it is not persisted as a
  library recipe until explicit save.
- **Approved Recipe**: A new library recipe created from the review form and independent of the
  immutable import snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In controlled local acceptance runs, a cook can open, review, and save a ready import
  into the library in under two minutes.
- **SC-002**: Automated coverage confirms that 100% of tested saved imports preserve the original
  import snapshot while creating one separate approved recipe.
- **SC-003**: Automated coverage confirms that 100% of tested cancel, missing, failed, and invalid
  review paths create no library recipe.
- **SC-004**: Browser journeys show review, validation recovery, save, and cancel experiences at 320,
  768, and 1440 CSS pixels without horizontal page scrolling.

## Assumptions

- Existing ready URL imports are the only reviewable input in this feature; future text and PDF imports
  will reuse the same review boundary.
- Source address and extraction snapshot are shown as provenance and are not editable from review.
- A successful save creates a normal library recipe that can later be edited through the existing
  recipe editor.
- Cancel keeps the ready import history for future reopening rather than deleting it.
- The app remains a personal local-development application with no sign-in or remote deployment.
