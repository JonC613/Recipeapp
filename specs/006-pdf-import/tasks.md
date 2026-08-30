---
description: "Dependency-ordered implementation tasks for PDF recipe import"
---

# Tasks: PDF Recipe Import

**Input**: Design documents from `/specs/006-pdf-import/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contract](contracts/pdf-import.openapi.yaml), and
[quickstart.md](quickstart.md)

**Tests**: Required by the specification and constitution. Tests use controlled PDF/extractor/parser
doubles only; they must not make paid provider calls.

**Organization**: Tasks are grouped by user story. A completed story is a separately testable vertical
slice; all user-story tasks depend on the foundational migration/domain boundary.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can proceed in parallel after its stated prerequisite is complete.
- **[Story]**: The user story served by the task.

## Phase 1: Setup

**Purpose**: Add the PDF extraction dependency and controlled test fixtures.

- [X] T001 Add the Worker-compatible `unpdf` dependency and lockfile entry in `package.json` and `package-lock.json`
- [X] T002 [P] Add a text-based single-recipe PDF fixture and invalid/image-only fixture metadata in `tests/fixtures/pdf-import/`
- [X] T003 [P] Add the PDF import API contract reference and manual test notes to `specs/006-pdf-import/quickstart.md`

---

## Phase 2: Foundational Boundaries

**Purpose**: Establish PDF provenance, private-source storage, extraction, and persistence contracts.

**Critical**: Complete this phase before user-story work.

- [X] T004 Add PDF source, extracted-content, and safe failure-code discriminators in `src/domain/recipe/imports.ts`
- [X] T005 Add `source_r2_key` and `source_name` columns plus `pdf` source-type migration support in `migrations/0005_pdf_imports.sql`
- [X] T006 Extend import row mapping and repository create/read helpers for immutable PDF source metadata in `worker/repositories/imports.ts`
- [X] T007 Define the application-owned `ContentExtractor` contract and bounded extraction result in `worker/services/extraction/content-extractor.ts`
- [X] T008 Implement private, controlled-key R2 source persistence in `worker/services/storage/pdf-sources.ts`
- [X] T009 Implement `unpdf`-backed text-only PDF extraction, password/unreadable detection, and the 50,000-character refusal in `worker/services/extraction/pdf-content-extractor.ts`
- [X] T010 [P] Add migration and repository provenance tests in `tests/integration/pdf-import.test.ts`
- [X] T011 [P] Add R2 storage and content-extractor boundary tests with doubles in `tests/worker/pdf-import.test.ts`

**Checkpoint**: A valid PDF can be represented, stored privately, and yield bounded text without any UI
or paid AI call.

---

## Phase 3: User Story 1 - Import a Text-Based Recipe PDF (Priority: P1) 🎯 MVP

**Goal**: Upload one valid text-based recipe PDF, retain its original source, parse it, and reach the
existing editable review draft.

**Independent Test**: Submit the controlled text recipe PDF to `POST /api/import/pdf`; assert a 201
ready import with recognizable draft data, preserved ingredient wording, ordered instructions, and a
private R2 source reference.

### Tests for User Story 1

- [X] T012 [P] [US1] Add successful multipart PDF-route and parser-double tests in `tests/worker/pdf-import.test.ts`
- [X] T013 [P] [US1] Add Worker-to-D1/R2 ready-import integration coverage in `tests/integration/pdf-import.test.ts`
- [X] T014 [P] [US1] Add PDF-form rendering, selection, and successful submission coverage in `tests/component/pdf-import-form.test.tsx`
- [X] T015 [P] [US1] Add desktop and mobile upload-to-review browser coverage in `tests/e2e/pdf-import.spec.ts`

### Implementation for User Story 1

- [X] T016 [US1] Add multipart PDF validation (one file, MIME, `%PDF-` signature, and 20 MB limit) and the `POST /api/import/pdf` pipeline in `worker/routes/imports.ts`
- [X] T017 [US1] Register `POST /api/import/pdf` in `worker/index.ts`
- [X] T018 [US1] Add the PDF import client request/result types in `src/services/imports.ts`
- [X] T019 [US1] Create accessible selected-file and submit UI in `src/components/imports/PdfImportForm.tsx`
- [X] T020 [US1] Add the PDF import option and form wiring to `src/pages/RecipeImportPage.tsx`
- [X] T021 [US1] Render PDF provenance safely in the imported draft result and review pages in `src/pages/RecipeImportResultPage.tsx` and `src/pages/RecipeImportReviewPage.tsx`

**Checkpoint**: A cook can upload one supported text-based recipe PDF and edit its unsaved draft at
320, 768, and 1440 CSS pixels.

---

## Phase 4: User Story 2 - Review and Save a PDF Import (Priority: P2)

**Goal**: Reuse explicit review/save approval while preserving the PDF source and original extraction
snapshot separately from the reviewed recipe.

**Independent Test**: Edit a ready PDF draft, approve it once, retrieve the import, and verify one
PDF-sourced recipe was created while the original R2 key, source name, and snapshot did not change.

### Tests for User Story 2

- [X] T022 [P] [US2] Add one-time PDF approval and immutable import-history tests in `tests/worker/pdf-import.test.ts`
- [X] T023 [P] [US2] Add PDF-source recipe persistence and snapshot integration tests in `tests/integration/pdf-import.test.ts`
- [X] T024 [P] [US2] Add review/edit/save and PDF-provenance detail-page browser coverage in `tests/e2e/pdf-import.spec.ts`

### Implementation for User Story 2

- [X] T025 [US2] Preserve PDF source metadata when converting an approved import into a recipe in `worker/repositories/imports.ts`
- [X] T026 [US2] Extend recipe-source presentation for PDF imports without exposing storage keys in `src/pages/RecipeDetailPage.tsx`
- [X] T027 [US2] Confirm PDF draft editing uses the existing `ImportReviewForm` and only returns safe source labels in `src/components/imports/ImportReviewForm.tsx`

**Checkpoint**: A reviewed PDF import creates exactly one recipe, while the original document reference
and extraction snapshot remain unchanged.

---

## Phase 5: User Story 3 - Recover Safely from an Unusable PDF (Priority: P3)

**Goal**: Explain invalid, oversized, unreadable, multiple-recipe, and temporary failures without
creating a draft or library recipe, while offering explicit recovery.

**Independent Test**: Exercise each controlled failure and assert its appropriate safe response,
retention state where applicable, zero saved recipes, and an explicit retry/choose-file/manual-entry path.

### Tests for User Story 3

- [X] T028 [P] [US3] Add invalid file, signature, MIME, and oversized response tests in `tests/worker/pdf-import.test.ts`
- [X] T029 [P] [US3] Add unreadable, extraction-limit, non-recipe, multiple-recipe, parser-invalid-output, and unavailable tests in `tests/worker/pdf-import.test.ts`
- [X] T030 [P] [US3] Add R2/D1 failure-record and no-library-recipe integration coverage in `tests/integration/pdf-import.test.ts`
- [X] T031 [P] [US3] Add accessible browser recovery-path coverage at mobile and desktop widths in `tests/e2e/pdf-import.spec.ts`

### Implementation for User Story 3

- [X] T032 [US3] Map PDF validation, extraction, parser, R2, and D1 failures to stable public codes and safe messages in `worker/routes/imports.ts`
- [X] T033 [US3] Persist retained-source failure records without parser/provider internals in `worker/repositories/imports.ts`
- [X] T034 [US3] Display contextual PDF errors plus retry, choose-another-file, and manual-entry actions in `src/components/imports/PdfImportForm.tsx`
- [X] T035 [US3] Preserve existing import navigation and prevent failed PDF imports from entering review in `src/pages/RecipeImportResultPage.tsx`

**Checkpoint**: Unusable PDFs are recoverable and never auto-retry, enter review, or create a library
recipe.

---

## Phase 6: User Story 4 - Read a Scanned Recipe PDF (Priority: P1) 🎯 OCR Amendment MVP

**Goal**: Let a cook explicitly spend one controlled OCR attempt on a retained image-only recipe PDF,
then use the existing review-and-save boundary.

**Independent Test**: A retained image-only PDF exposes **Try OCR** without making a provider request;
one click uses a controlled OCR result, creates a ready draft, and a second click is rejected without a
second OCR request or saved recipe.

### Tests for User Story 4

- [X] T041 [P] [US4] Add OCR migration, atomic one-attempt-claim, and immutable OCR-text repository tests in `tests/integration/pdf-ocr.test.ts`
- [X] T042 [P] [US4] Add OCR processor, page-limit, provider-safe-failure, no-repeat, and parse-handoff Worker tests in `tests/worker/pdf-ocr.test.ts`
- [X] T043 [P] [US4] Add OCR disclosure, disabled-repeat, and recovery-control component coverage in `tests/component/pdf-ocr.test.tsx`
- [X] T044 [P] [US4] Add 320/768/1440 image-only-PDF → explicit OCR → review/save and no-repeat browser coverage in `tests/e2e/pdf-ocr.spec.ts`

### Implementation for User Story 4

- [X] T045 [US4] Add OCR state, extraction method, attempt timestamp, and safe OCR failure columns without altering existing import rows in `migrations/0006_pdf_ocr_attempts.sql`
- [X] T046 [US4] Extend import domain types and atomically claim/read/write one OCR attempt in `src/domain/recipe/imports.ts` and `worker/repositories/imports.ts`
- [X] T047 [US4] Add the application-owned `OcrProcessor` contract, bounded OCR result, and safe error types in `worker/services/ai/ocr-processor.ts`
- [X] T048 [US4] Implement the temporary OpenAI `user_data` upload → Responses `file_id` OCR adapter with immediate cleanup, response storage disabled, bounded output, and no provider-detail leakage in `worker/services/ai/openai-pdf-ocr.ts`
- [X] T049 [US4] Add private R2 source retrieval and non-destructive deterministic PDF page counting before OCR in `worker/services/storage/pdf-sources.ts` and `worker/services/extraction/pdf-content-extractor.ts`
- [X] T050 [US4] Implement `POST /api/import/:id/ocr`, including eligibility, 10-page limit, one-time claim, OCR-to-parser handoff, and safe outcomes in `worker/routes/imports.ts`
- [X] T051 [US4] Register the OCR route and separate configurable OCR model binding in `worker/index.ts` and `wrangler.jsonc`
- [X] T052 [US4] Add typed OCR request support in `src/services/imports.ts`
- [X] T053 [US4] Add the clearly labeled credit disclosure, explicit **Try OCR** action, progress, and terminal recovery states in `src/pages/RecipeImportResultPage.tsx`
- [X] T054 [US4] Surface OCR availability, successful scan provenance, and one-attempt completion in `src/pages/RecipeImportResultPage.tsx` and `src/components/imports/ImportReviewForm.tsx`

**Checkpoint**: A supported scan has zero OCR calls until the cook chooses **Try OCR**, then reaches the
existing editable review flow at most once per import.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Validate the complete feature, documentation, responsive behavior, and security boundary.

- [X] T036 [P] Update PDF import behavior, R2 provenance, and implemented limitations in `specs/006-pdf-import/spec.md` and `specs/006-pdf-import/plan.md`
- [X] T037 [P] Add or update the Feature 006 entry in `.sdd/memory/log.md` after implementation discoveries are approved
- [X] T038 Run type, Cloudflare binding, component, worker, integration, and end-to-end suites from `specs/006-pdf-import/quickstart.md`
- [X] T039 Complete the owner-verified live PDF/OCR upload → review/save and failure-recovery flow, with automated 320/768/1440 upload, cancel, recovery, and OCR coverage from `specs/006-pdf-import/quickstart.md`
- [X] T040 Review changed browser/API/log output for secret, source-content, R2-key, and provider-detail exposure in `worker/routes/imports.ts` and `src/components/imports/PdfImportForm.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately.
- **Foundational (Phase 2)**: Depends on T001; blocks all user stories.
- **US1 (Phase 3)**: Depends on T004–T011 and supplies the usable upload path.
- **US2 (Phase 4)**: Depends on a ready PDF import from US1.
- **US3 (Phase 5)**: Depends on the foundational boundaries and route/form from US1; it can follow US1
  independently of US2.
- **Polish (Phase 6)**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: Foundational only; this is the MVP slice.
- **US2 (P2)**: US1, because it approves its ready import.
- **US3 (P3)**: Foundational + US1 route/form, but does not require a completed US2.
- **US4 (P1 OCR amendment)**: Depends on the completed retained PDF source path and its failure import
  record; it reuses US1 parsing and US2 review/approval after a successful OCR result.

### Parallel Opportunities

- T002 and T003 can run alongside each other after T001 begins.
- T010 and T011 can be developed in parallel after the corresponding contracts exist.
- Tests T012–T015 are separate test layers and can run in parallel; the same applies to T022–T024 and
  T028–T031.
- Documentation T036–T037 may proceed in parallel once implementation outcomes are known.
- OCR tests T041–T044 can be written in parallel before their implementation tasks T045–T054.

## Parallel Example: User Story 1

```text
Task: "Add successful multipart PDF-route and parser-double tests in tests/worker/pdf-import.test.ts"
Task: "Add Worker-to-D1/R2 ready-import integration coverage in tests/integration/pdf-import.test.ts"
Task: "Add PDF-form rendering and submission coverage in tests/component/pdf-import-form.test.tsx"
Task: "Add desktop and mobile upload-to-review browser coverage in tests/e2e/pdf-import.spec.ts"
```

## Parallel Example: User Story 4

```text
Task: "Add OCR migration and one-attempt repository tests in tests/integration/pdf-ocr.test.ts"
Task: "Add OCR processor and safe-failure Worker tests in tests/worker/pdf-ocr.test.ts"
Task: "Add OCR disclosure component coverage in tests/component/pdf-ocr.test.tsx"
Task: "Add responsive OCR browser coverage in tests/e2e/pdf-ocr.spec.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phases 1 and 2.
2. Complete US1, then validate its controlled upload-to-review path before continuing.
3. Add US2 to prove one-time reviewed persistence and immutable provenance.
4. Add US3 to harden failure recovery.
5. Add US4 to provide a separate, explicitly chosen OCR recovery path.
6. Complete cross-cutting verification only after all desired stories pass.

### Incremental Delivery

- **US1** delivers retained PDF source → extracted editable draft.
- **US2** delivers explicit approval → one separate saved recipe with preserved provenance.
- **US3** delivers safe, understandable recovery for every defined failure outcome.
- **US4** delivers one cost-controlled OCR attempt for retained image-only PDFs.
