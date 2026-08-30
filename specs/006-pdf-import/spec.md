# Feature Specification: PDF Recipe Import

**Feature Branch**: `006-pdf-import`

**Created**: 2026-08-29

**Status**: Complete — implemented, owner-validated, and recorded in Project Memory

**Input**: User description: "Upload a recipe PDF, retain its original source, extract usable recipe
text, review the resulting draft, and explicitly save it to the Recipe Library."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import a Text-Based Recipe PDF (Priority: P1)

A cook uploads one recipe PDF and receives an editable, unsaved recipe draft without losing the
original document.

**Why this priority**: PDFs are a common recipe source from printouts, cookbooks, newsletters, and
saved documents that cannot be captured through the existing URL or pasted-text paths.

**Independent Test**: Upload a controlled text-based PDF containing a title, ingredients, and ordered
steps; verify a retained ready draft has recognizable recipe information while the original PDF remains
available as its source.

**Acceptance Scenarios**:

1. **Given** a cook selects a supported PDF within the upload limit, **When** they explicitly import it,
   **Then** the system retains the original document and presents an unsaved recipe draft for review.
2. **Given** the source contains unusual measurements or descriptive ingredient wording, **When** a draft
   is produced, **Then** every ingredient retains its complete source wording alongside any structured
   interpretation.
3. **Given** usable text lacks optional recipe details, **When** extraction completes, **Then** unknown
   values remain absent rather than being invented.

---

### User Story 2 - Review and Save a PDF Import (Priority: P2)

A cook corrects an extracted PDF draft and explicitly saves the approved version to the Recipe Library.

**Why this priority**: Extracted PDF content must remain reviewable before it becomes trusted recipe
data, just like URL and pasted-text imports.

**Independent Test**: Review a controlled ready PDF draft, edit a title and ingredient, save it once,
and verify the recipe reflects the edits while the original document and original extraction snapshot
remain unchanged.

**Acceptance Scenarios**:

1. **Given** a ready PDF draft, **When** the cook opens review, **Then** all supported recipe fields are
   editable and the source is identified as a PDF.
2. **Given** the cook saves reviewed values, **When** approval succeeds, **Then** exactly one
   PDF-sourced recipe is created.
3. **Given** a PDF import has been saved, **When** its import history is retrieved, **Then** the original
   document and extraction snapshot remain unchanged.

---

### User Story 3 - Recover Safely from an Unusable PDF (Priority: P3)

A cook receives a clear recovery path when a file is invalid, too large, unreadable, password-protected,
or does not contain one usable recipe.

**Why this priority**: File uploads can fail in ways that must not silently create misleading recipes or
leave the cook unsure whether their source was stored.

**Independent Test**: Exercise controlled invalid-file, oversized-file, unreadable-PDF, non-recipe, and
multiple-recipe cases; verify safe feedback, no library recipe, no automatic retry, and an option to try
another file or enter a recipe manually.

**Acceptance Scenarios**:

1. **Given** a cook selects a non-PDF or oversized file, **When** they submit it, **Then** the system
   rejects it before extraction and explains how to recover.
2. **Given** a valid PDF cannot yield usable text or represents more than one recipe, **When** processing
   ends, **Then** no ready draft or library recipe is created and the cook can retry explicitly or enter
   a recipe manually.
3. **Given** document processing or recipe extraction is temporarily unavailable, **When** import fails,
   **Then** the cook sees a safe retryable message and no automatic paid retry occurs.

---

### User Story 4 - Read a Scanned Recipe PDF (Priority: P1)

A cook whose retained PDF is an image-only scan can explicitly request one OCR attempt and receive an
editable recipe draft when the scan contains one recognizable recipe.

**Independent Test**: Start from a retained scan with no usable embedded text, choose **Try OCR**, and
verify controlled OCR text reaches the existing review screen without automatically saving a recipe.

**Acceptance Scenarios**:

1. **Given** a retained PDF has no usable embedded text, **When** the cook chooses **Try OCR**, **Then**
   the app performs at most one OCR attempt and explains that it may use AI credits.
2. **Given** OCR produces usable text for one recipe, **When** interpretation completes, **Then** the
   cook reaches the unchanged editable review-and-save boundary.
3. **Given** OCR cannot read the scan, exceeds the page limit, is unavailable, or finds zero or multiple
   recipes, **When** processing ends, **Then** no library recipe is created and manual-entry recovery is
   available.

### Edge Cases

- The upload is labeled as a PDF but its contents are not a valid PDF.
- The PDF contains no extractable text, including image-only or password-protected documents.
- The PDF contains multiple recipes, introductory material, or unrelated pages.
- The upload disconnects or processing fails after the original document is retained.
- A cook uploads the same PDF more than once; each submission is a distinct import attempt.
- A cook leaves review or cancels; no library recipe is created and the retained import stays separate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a PDF-import option that accepts one document selected by the cook.
- **FR-002**: The system MUST accept only valid PDF documents up to 20 MB and reject other or larger files
  before recipe extraction begins.
- **FR-003**: The original accepted PDF MUST be retained as the source layer of its import attempt and
  remain associated with the resulting draft or safe failure record.
- **FR-004**: The system MUST attempt to extract usable text from a retained PDF and convert one
  recognizable recipe into the existing stable recipe-draft fields.
- **FR-005**: Extraction MUST preserve ingredient original wording and instruction ordering, distinguish
  notes from cooking steps, and leave indeterminate values absent.
- **FR-006**: Extraction MUST NOT invent ingredients, preparation steps, quantities, times, servings, or
  other recipe facts that are not supported by the PDF source.
- **FR-007**: A draft MUST be accepted only when it conforms to the application's recipe-draft rules;
  invalid or unconstrained output MUST fail recoverably and MUST NOT enter review or the library.
- **FR-008**: The source document, extracted text, extraction snapshot, source type, status, and creation
  time MUST be retained separately from any user-approved recipe.
- **FR-009**: Every ready PDF draft MUST use the existing review-and-save boundary; extraction MUST never
  automatically create or overwrite a library recipe.
- **FR-010**: Review MUST allow the cook to correct all supported recipe fields before explicitly saving
  exactly one PDF-sourced recipe.
- **FR-011**: Canceling or leaving review MUST NOT create a library recipe, and a saved PDF import MUST
  retain its original document and extraction snapshot unchanged.
- **FR-012**: Invalid, oversized, unreadable, password-protected, non-recipe, multiple-recipe,
  invalid-output, and temporary-provider outcomes MUST expose safe messages and a path to retry
  explicitly, choose another file, or enter manually.
- **FR-013**: Document contents, provider credentials, provider response details, and storage internals
  MUST NOT be exposed through browser-delivered credentials, public error messages, or application logs.
- **FR-014**: This feature MUST NOT add standalone image/screenshot import, handwriting guarantees,
  recipe generation, automatic substitutions, semantic search, authentication, remote deployment, or
  automatic background retries.
- **FR-015**: When deterministic PDF extraction yields no usable text, the app MUST retain the source and
  offer a clearly labeled, user-initiated OCR action; OCR MUST NOT begin solely because a PDF was uploaded.
- **FR-016**: One import MUST permit no more than one OCR attempt, and the action MUST disclose that it
  uses the configured AI provider and may consume credits.
- **FR-017**: OCR MUST accept only retained PDFs within the existing 20 MB limit and at most 10 pages.
- **FR-018**: OCR document contents MUST travel only from the Worker to the configured provider; the
  browser MUST NOT receive provider credentials, provider responses, public R2 URLs, or storage keys.
- **FR-019**: OCR text, source classification, attempt time, and safe outcome MUST remain associated with
  the original import separately from any reviewed recipe and original PDF.
- **FR-020**: OCR text MUST use the existing constrained recipe-draft validation and review boundary; it
  MUST NOT create or overwrite a recipe automatically.
- **FR-021**: OCR page-limit, unreadable-scan, provider, invalid-output, non-recipe, and multiple-recipe
  outcomes MUST expose safe messages and manual-entry recovery.

### Key Entities

- **PDF Import Source**: One retained original PDF and its source metadata, associated with exactly one
  import attempt.
- **Extracted PDF Content**: Usable text obtained from the source document before recipe interpretation.
- **PDF Import Record**: One retained attempt containing its source reference, extracted text when
  available, status, extraction result or safe failure classification, and creation time.
- **Reviewed Recipe**: The cook-approved library recipe created from an editable PDF draft while
  preserving the PDF Import Source and extraction result.
- **OCR Attempt**: One explicit, cost-controlled attempt associated with a retained PDF import, including
  its timestamp, outcome, source classification, and bounded text when successful.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In controlled acceptance runs, a cook can upload a typical text-based recipe PDF and reach
  an editable review draft within 30 seconds.
- **SC-002**: For the controlled PDF fixture set, 100% of accepted drafts preserve ingredient original
  wording and instruction order from the extracted source.
- **SC-003**: Automated coverage confirms that 100% of tested invalid, oversized, unreadable,
  non-recipe, multiple-recipe, invalid-output, and provider-failure cases create no library recipe.
- **SC-004**: Automated coverage confirms that 100% of tested saved PDF imports retain an unchanged
  original source and extraction snapshot while creating exactly one separate reviewed recipe.
- **SC-005**: Browser journeys demonstrate upload, extraction status, review, save, cancel, and recovery
  at 320, 768, and 1440 CSS pixels without horizontal page scrolling.
- **SC-006**: A controlled image-only, single-recipe PDF reaches an editable review draft after the cook
  explicitly selects OCR, with no automatic library recipe creation.
- **SC-007**: Automated coverage confirms that each tested scan creates zero OCR requests before the
  explicit action and no more than one afterwards.
- **SC-008**: Automated coverage confirms that OCR page-limit, provider, invalid-output, non-recipe, and
  multiple-recipe outcomes create no recipe and reveal no source or provider details.

## Assumptions

- The existing recipe draft, import-history, parser, and review-and-save capabilities are reused rather
  than replaced.
- MVP accepts PDFs up to 20 MB. Text-based PDFs use deterministic extraction; image-only scans can use a
  separately chosen OCR attempt after this approved amendment is implemented. Password-protected PDFs
  remain a safe failure.
- One upload represents one recipe; cooks are asked to isolate a single recipe before retrying.
- Document text extraction stays replaceable so a different extractor or future OCR capability can be
  introduced without changing the review/save workflow.
- Automated tests use controlled PDF extraction and parser doubles and do not make paid provider calls.
- OCR sends document imagery only after a cook chooses the clearly labeled action; it is limited to 10
  pages, one OCR attempt, and at most one subsequent existing parser call.
- The application remains a personal local-development deployment without sign-in; remote deployment
  remains separately gated by a custom hostname, owner-restricted access, and explicit approval.

## Implementation Notes

- The Worker validates multipart file shape, `application/pdf` MIME type, `%PDF-` signature, and a 20 MB
  limit before retaining a source.
- Accepted source documents receive controlled private R2 keys. Their names and keys are stored with the
  immutable import record; browser views show only a safe PDF label and filename.
- `unpdf` is isolated behind `ContentExtractor`; unreadable/password-protected and oversized extracted
  text result in recoverable failure records, without OCR or automatic retries.
- Automated PDF import coverage uses controlled parser/extractor doubles, verifies R2 retention, and
  covers desktop, tablet, and mobile review flows without paid API calls.
