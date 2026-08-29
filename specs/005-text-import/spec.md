# Feature Specification: Text Recipe Import

**Feature Branch**: `005-text-import`

**Created**: 2026-08-29

**Status**: Done

**Amendment (2026-08-29)**: The OpenAI Responses adapter MUST read the structured result from the
documented `output` message-content envelope, rather than relying on an SDK-only convenience field.
This compatibility correction does not alter the product workflow, cost controls, or review boundary.
The adapter MUST also invoke Worker `fetch` with its global receiver so local and deployed Worker
runtimes can make the request.

**Input**: User description: "Paste free-form recipe text, extract it into a structured recipe draft using AI, review and correct the draft, then explicitly save it without losing the original text."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extract a Recipe from Pasted Text (Priority: P1)

A cook pastes recipe text in any reasonable layout and asks the application to turn it into a
structured, unsaved recipe draft.

**Why this priority**: Pasted text enables recipes from messages, notes, documents, and sites that
cannot be imported through structured URL data.

**Independent Test**: Submit controlled free-form recipe text containing a title, ingredients, and
ordered instructions, then verify that a reviewable draft contains recognizable recipe information
while the original pasted text remains retained separately.

**Acceptance Scenarios**:

1. **Given** a cook has valid recipe text, **When** they submit it for import, **Then** they receive an
   unsaved structured draft containing the recipe information that could be determined.
2. **Given** the source contains unusual measurements or descriptive ingredient wording, **When** it
   is extracted, **Then** each ingredient retains its complete original wording alongside any
   structured interpretation.
3. **Given** the source omits optional metadata, **When** extraction completes, **Then** unknown values
   remain absent rather than being invented.

---

### User Story 2 - Review and Save a Text Import (Priority: P2)

A cook reviews the extracted draft, corrects any field, and explicitly saves the accepted version to
the recipe library.

**Why this priority**: AI extraction is inherently fallible, so review is required before imported
content becomes trusted library data.

**Independent Test**: Extract a controlled text recipe, edit its title, ingredients, and instructions
during review, save it, and verify the saved recipe reflects those edits while the retained source and
extraction snapshot remain unchanged.

**Acceptance Scenarios**:

1. **Given** a ready text-import draft, **When** the cook opens review, **Then** all supported recipe
   fields are editable and the experience identifies the source as pasted text.
2. **Given** a cook corrects an extracted draft, **When** they explicitly save it, **Then** exactly one
   text-sourced recipe is created from the reviewed values.
3. **Given** a text import has been saved, **When** its import history is retrieved, **Then** the
   original pasted text and original extraction snapshot remain unchanged.

---

### User Story 3 - Recover Safely from Invalid Text or Extraction Failure (Priority: P3)

A cook receives a clear, safe recovery path when pasted content cannot produce a usable recipe draft.

**Why this priority**: Provider errors, invalid output, and non-recipe text must not create misleading
recipes or strand the cook.

**Independent Test**: Submit empty text, non-recipe text, invalid extracted output, and a simulated
temporary extraction outage; verify that none creates a library recipe and each gives an appropriate
retry or manual-entry path.

**Acceptance Scenarios**:

1. **Given** pasted content is empty, whitespace-only, or exceeds the accepted size, **When** the cook
   submits it, **Then** extraction does not begin and an actionable validation message is shown.
2. **Given** extraction cannot identify a usable recipe or returns invalid structured content, **When**
   processing ends, **Then** no ready draft or library recipe is created and the cook can revise the
   text or enter the recipe manually.
3. **Given** the extraction provider is temporarily unavailable, **When** import fails, **Then** the
   cook sees a safe retryable message and no automatic paid retry occurs.

### Edge Cases

- The pasted source contains no title but has recognizable ingredients and instructions; the draft may
  use an editable neutral placeholder that must pass normal recipe validation before saving.
- The source contains multiple recipes; the import must not silently merge them and must return a safe
  outcome asking the cook to paste one recipe at a time.
- Ingredients use fractions, ranges, approximate quantities, uncommon units, or preparation phrases.
- Instructions are paragraphs, numbered lines, bullet points, or mixed with notes.
- The source includes prompt-like directions asking the extractor to ignore its recipe-extraction
  rules; those directions are treated only as source content.
- A cook submits the same text more than once; each submission is a distinct import attempt.
- A cook leaves review or cancels; no library recipe is created and the retained import remains
  separate from the library.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a text-import option where a cook can paste free-form recipe
  content without requiring a prescribed layout.
- **FR-002**: The system MUST reject empty or whitespace-only input and MUST enforce a 50,000-character
  maximum before extraction begins.
- **FR-003**: Extraction MUST be initiated only by an explicit cook action and MUST perform at most one
  provider extraction attempt for that submission unless the cook explicitly retries.
- **FR-004**: The system MUST attempt to extract title, description, servings, preparation time,
  cooking time, total time, ingredients, instructions, cuisine, category, tags, and notes into the
  stable recipe draft fields.
- **FR-005**: Extraction MUST preserve every ingredient's original source wording, preserve
  instruction ordering, distinguish notes from cooking steps, and leave indeterminate values absent.
- **FR-006**: Extraction MUST NOT invent ingredients, preparation steps, quantities, times, servings,
  or other recipe facts that are not supported by the pasted source.
- **FR-007**: Extracted output MUST be accepted only when it conforms to the application's recipe draft
  rules; invalid or unconstrained output MUST fail recoverably and MUST NOT enter review or the library.
- **FR-008**: The original pasted text, extraction snapshot, source type, status, and creation time MUST
  be retained as an import record separate from any user-approved recipe.
- **FR-009**: Every ready text draft MUST use the existing review-and-save boundary; extraction MUST
  never automatically create or overwrite a library recipe.
- **FR-010**: Review MUST allow the cook to correct all supported recipe fields before explicitly
  saving exactly one text-sourced recipe.
- **FR-011**: Canceling or leaving review MUST NOT create a library recipe, and a saved text import MUST
  retain its original source and extraction snapshot unchanged.
- **FR-012**: Empty, oversized, non-recipe, multiple-recipe, invalid-output, and temporary provider
  failure outcomes MUST expose safe messages and a path to revise, retry explicitly, or enter manually.
- **FR-013**: Provider credentials, provider output details, and source text MUST NOT be exposed through
  client-delivered credentials, diagnostic messages, or application logs.
- **FR-014**: This feature MUST NOT add PDF or image import, recipe generation, automatic substitutions,
  semantic search, authentication, remote deployment, or automatic background retries.

### Key Entities

- **Text Import Source**: The original free-form text submitted by the cook, retained unchanged as the
  source layer of an import attempt.
- **Extraction Result**: The structured recipe snapshot produced from the source and accepted only
  after recipe-draft validation; it remains separate from later user edits.
- **Text Import Record**: One retained attempt containing its source type, original text, status,
  extraction result or safe failure classification, and creation time.
- **Reviewed Recipe**: The cook-approved library recipe created from the editable review copy while
  preserving the Text Import Source and Extraction Result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In controlled acceptance runs, a cook can paste a typical single-recipe source and reach
  an editable review draft within 30 seconds.
- **SC-002**: For the controlled extraction fixture set, 100% of accepted drafts preserve ingredient
  original wording and instruction order from the source.
- **SC-003**: Automated coverage confirms that 100% of tested empty, oversized, non-recipe,
  multiple-recipe, invalid-output, and provider-failure cases create no library recipe.
- **SC-004**: Automated coverage confirms that 100% of tested saved text imports retain an unchanged
  original source and extraction snapshot while creating exactly one separate reviewed recipe.
- **SC-005**: Browser journeys demonstrate paste, extraction status, review, save, cancel, and recovery
  at 320, 768, and 1440 CSS pixels without horizontal page scrolling.

## Assumptions

- The existing recipe draft, import-history, and review-and-save capabilities are reused rather than
  replaced.
- One submission represents one recipe; cooks are asked to separate multiple recipes before retrying.
- The 50,000-character input limit accommodates normal recipe text while bounding processing time and
  provider cost; changing it later is a product-policy adjustment rather than a schema change.
- Extraction requires a configured server-side AI provider credential and network availability.
- Automated tests use controlled extraction responses and do not incur provider charges.
- The application remains a personal local-development deployment without sign-in; remote deployment
  remains separately gated by a custom hostname, owner-restricted access, and explicit approval.
