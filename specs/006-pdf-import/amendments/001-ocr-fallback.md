# Amendment 001: OCR Fallback for Scanned Recipe PDFs

**Feature**: [006-pdf-import](../spec.md)  
**Version**: 1.1 approved  
**Date**: 2026-08-29  
**Status**: Complete — implemented, validated, and recorded in Project Memory

## Why this amendment is needed

The owner verified that a common recipe PDF may be an image-only scan. The implemented text-PDF path
correctly rejects that document because it contains no selectable text. This amendment adds an optional,
cost-controlled recovery path so a cook can ask the app to read a scanned recipe without weakening the
review-and-save boundary.

## Changed user journey

```text
Upload PDF → retain original → deterministic text extraction
                                  │
                    text found ──┴──→ existing parse → review
                                  │
                         no readable text
                                  ↓
                 explain scan limitation + “Try OCR” action
                                  ↓ (explicit user choice; one attempt)
                 retained PDF → OCR text → existing parse → review
```

## Added user story

### User Story 4 - Read a Scanned Recipe PDF (Priority: P1)

A cook whose uploaded scan has no usable embedded text can explicitly choose one OCR attempt and receive
an editable recipe draft when the document contains one recognizable recipe.

**Independent Test**: Start from a retained image-only PDF import, select **Try OCR**, use a controlled
OCR result containing a title, ingredients, and steps, and verify the cook reaches the existing review
screen with preserved source wording and no automatically saved recipe.

**Acceptance Scenarios**:

1. **Given** a retained PDF has no usable embedded text, **When** the cook chooses **Try OCR**, **Then**
   the app performs at most one OCR attempt for that import and clearly identifies that a scan was read.
2. **Given** OCR produces usable recipe text, **When** recipe interpretation completes, **Then** the cook
   reaches the unchanged editable review-and-save boundary.
3. **Given** OCR is unavailable, exceeds the supported page limit, fails validation, or cannot identify
   exactly one recipe, **When** processing ends, **Then** no library recipe is created and the cook sees
   a safe message with manual-entry recovery.
4. **Given** OCR has already been attempted for an import, **When** the cook revisits it, **Then** the app
   does not make another paid attempt automatically or offer an unbounded retry loop.

## Added requirements

- **FR-015**: When deterministic PDF text extraction yields no usable text, the app MUST retain the
  original source and offer a clearly labeled, user-initiated OCR action; it MUST NOT start OCR solely
  because a PDF was uploaded.
- **FR-016**: One import MUST permit no more than one OCR attempt. The action MUST state that OCR uses the
  configured AI provider and may consume usage credits.
- **FR-017**: OCR MUST accept only retained PDFs within the existing 20 MB limit and at most 10 pages.
- **FR-018**: OCR document bytes MUST travel only from the Worker to the configured provider. The browser
  MUST NOT receive provider credentials, a public R2 URL, provider responses, or storage keys.
- **FR-019**: OCR text, its source classification, attempt time, and safe outcome MUST remain associated
  with the original import, separately from the reviewed recipe and the original PDF.
- **FR-020**: OCR text MUST be passed through the existing constrained recipe-draft validation and review
  boundary. OCR MUST NOT automatically create or overwrite a library recipe.
- **FR-021**: The app MUST expose safe, non-sensitive outcomes for page-limit, unreadable scan,
  provider-unavailable, invalid-output, non-recipe, and multiple-recipe cases.

## Changed constraints and exclusions

- Add optional scanned/image-only PDF OCR only. This amendment does not add standalone image import,
  handwriting guarantees, receipt import, image editing, background jobs, automatic retries, or remote
  deployment.
- The OCR provider is the existing server-side OpenAI provider, using a separately configurable
  vision-capable model. The current text parser remains a separate, application-owned boundary.
- The app performs no OCR request until the cook uses the explicit action. A successful OCR attempt may
  make one existing recipe-parser request; no retries are automatic.
- The default cap is 10 PDF pages and 20 MB. Larger documents receive manual-entry recovery instead of
  a provider call.

## Data, privacy, and cost consequences

- The original source remains private in R2. The Worker reads it for OCR and never generates a public
  download URL.
- A scanned document’s contents are sent to OpenAI only after the cook selects **Try OCR**. This is the
  same provider trust boundary already used for pasted recipe text, but now includes document imagery.
- Import history will record whether OCR was offered, attempted, succeeded, or failed, plus the bounded
  OCR text when available. It will not store provider request/response payloads or usage details.
- Per-import limits, a one-attempt rule, and no background retries are cost controls. The browser will
  show a short disclosure before the attempt.

## Success criteria added

- **SC-006**: A controlled image-only, single-recipe PDF reaches an editable review draft after the cook
  explicitly selects OCR, with no automatic library recipe creation.
- **SC-007**: Automated coverage proves that each tested scanned import triggers zero OCR requests before
  the explicit action and no more than one after it.
- **SC-008**: Automated coverage proves that page-limit, provider, invalid-output, non-recipe, and
  multiple-recipe OCR outcomes create no library recipe and reveal no document content or provider detail.

## Affected artifacts before implementation

- `specs/006-pdf-import/spec.md` — incorporate this approved scope and restore feature to planning.
- `specs/006-pdf-import/plan.md` — add the OCR provider boundary, migration, endpoint, cost controls,
  and test strategy.
- `specs/006-pdf-import/tasks.md` — add dependency-ordered OCR work after plan approval.
- `.sdd/memory/*` — update only after successful implementation and separate owner approval.

## Approval requested

Approve this amendment to authorize planning. Approval does **not** authorize code changes, provider
configuration, an API key change, remote deployment, or paid OCR requests.
