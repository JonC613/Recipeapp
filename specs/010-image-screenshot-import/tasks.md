# Tasks: Image and Screenshot Recipe Import

**Input**: [spec.md](spec.md), [research.md](research.md), and [plan.md](plan.md)

**Version**: 1.1

**Status**: Done — clipboard-paste amendment deployed, 2026-08-31

**Tests**: Worker/unit, component, D1/R2 integration, and Playwright coverage are required by the
approved specification. Tests use controlled image bytes and provider/binding doubles; no automated test
makes a live OpenAI request or alters production R2/D1/Cloudflare configuration.

**Organization**: Each phase is a complete, verifiable vertical slice. A source image is never extracted
or saved as a recipe until the owner explicitly chooses the corresponding action.

## Phase 1: Foundation and Safe Contracts

**Purpose**: Establish explicit image/vision contracts, validated source fixtures, and the minimum
backward-compatible persistence shape before exposing a UI action.

- [X] T001 Record the exact upload/extraction DTOs, safe error responses, one-attempt state transitions,
  and privacy rules in `specs/010-image-screenshot-import/contracts/image-import.md` and add concise local
  manual checks in `specs/010-image-screenshot-import/quickstart.md`.
- [ ] T002 [P] Add controlled JPEG, PNG, WebP, valid HEIC/HEIF-container, truncated, spoofed, empty,
  oversize-descriptor, no-recipe, multiple-recipe, invalid-output, and provider-unavailable fixtures in
  `tests/fixtures/image-import/`.
- [X] T003 [P] Extend application import and saved-recipe source contracts with `image`, explicit vision
  state, and safe failure codes in `src/domain/recipe/imports.ts` and `src/domain/recipe/schema.ts`.
- [X] T004 Implement bounded image MIME/signature inspection, including JPEG, PNG, WebP, and ISO BMFF
  HEIC/HEIF brands, in `worker/services/extraction/image-signature.ts`.
- [X] T005 [P] Add signature/format unit tests for accepted and rejected byte sequences in
  `tests/worker/image-signature.test.ts`.
- [X] T006 Add `migrations/0008_image_imports.sql` to preserve all existing import rows while adding the
  `image` source type and dedicated vision-attempt fields; document the compatibility design in
  `specs/010-image-screenshot-import/data-model.md`.
- [ ] T007 [P] Extend migration compatibility coverage for existing URL, text, PDF/OCR, and MealDB rows
  plus the new image source in `tests/recipe-migration.ts` and `tests/integration/image-import.test.ts`.

**Checkpoint**: The type and database contracts can represent an image import without altering existing
import behavior, and unsupported/spoofed content can be rejected deterministically.

---

## Phase 2: User Story 1 — Retain One Recipe Image (Priority: P1) 🎯 MVP

**Goal**: The owner can select one valid image, see a safe preview or filename fallback, and retain it
privately without any OpenAI call or recipe creation.

**Independent Test**: Upload a controlled valid JPEG at 320, 768, and 1440 CSS pixels; verify the source
is retained, the UI exposes **Extract recipe**, the browser receives no R2 key/public URL, and no AI or
recipe write occurs.

### Tests for User Story 1

- [X] T008 [P] [US1] Add Worker route tests for missing/multiple file parts, size/type/signature rejection,
  R2 write failure, accepted image retention, and the no-AI/no-recipe guarantee in
  `tests/worker/image-import.test.ts`.
- [ ] T009 [P] [US1] Add component tests for one-file selection, AI-credit disclosure, decodable preview,
  non-previewable HEIC filename fallback, replacement, cancel, and accessible errors in
  `tests/component/image-recipe-import.test.tsx`.
- [ ] T010 [P] [US1] Add Playwright coverage for responsive capture/preview with no extraction side effect
  in `tests/e2e/image-import.spec.ts`.

### Implementation for User Story 1

- [X] T011 [US1] Add private image R2 store/read helpers with sanitized source names and application-owned
  content metadata in `worker/services/storage/image-sources.ts`.
- [X] T012 [US1] Add image-import repository creation/retrieval and a safe public import projection that
  excludes R2 keys and bytes in `worker/repositories/imports.ts`.
- [X] T013 [US1] Add `POST /api/import/image` multipart validation, private retention, and route
  registration in `worker/routes/imports.ts` and `worker/index.ts`; it must never invoke OpenAI.
- [X] T014 [US1] Add typed browser upload support in `src/services/imports.ts`.
- [X] T015 [US1] Add the image/screenshot choice to `src/pages/RecipeImportPage.tsx` and implement one-file
  picker, safe preview/fallback, AI-credit notice, and responsive source-retained state in
  `src/components/imports/ImageRecipeImport.tsx` and `src/app/styles.css`.

**Checkpoint**: One source image can be retained privately and intentionally left unprocessed.

---

## Phase 3: User Story 2 — Explicitly Extract a Recipe from an Image (Priority: P1)

**Goal**: The owner can select **Extract recipe** once, see progress, and receive either one validated
unsaved Recipe Draft or a safe, final recovery state.

**Independent Test**: From a controlled retained image, select extraction once and verify one structured
vision request produces a reviewable draft; duplicate action and all failure outcomes create zero recipes.

### Tests for User Story 2

- [ ] T016 [P] [US2] Add tests for temporary OpenAI vision-file upload, strict structured response mapping,
  provider error mapping, and `finally` cleanup in `tests/worker/openai-image-recipe-parser.test.ts`.
- [ ] T017 [P] [US2] Add Worker tests for atomic one-attempt claim, unavailable/no-recipe/multiple-recipe/
  invalid-output outcomes, safe projections, and no private-data leakage in
  `tests/worker/image-import.test.ts`.
- [ ] T018 [P] [US2] Add component and Playwright tests for extraction progress, disabled duplicate action,
  review navigation, and final recovery states in `tests/component/image-recipe-import.test.tsx` and
  `tests/e2e/image-import.spec.ts`.

### Implementation for User Story 2

- [X] T019 [US2] Export and reuse the existing strict recipe response schema/result mapper without changing
  text/PDF behavior in `worker/services/ai/openai-recipe-parser.ts`.
- [X] T020 [US2] Implement the one-request `OpenAiImageRecipeParser` and its focused provider error type in
  `worker/services/ai/openai-image-recipe-parser.ts`; use Files API purpose `vision`, `store: false`, and
  temporary-file deletion in `finally`.
- [X] T021 [US2] Add a narrow R2 image-source adapter that passes JPEG/PNG/WebP directly and HEIC through a
  Cloudflare Images binding JPEG conversion, with a testable binding interface in
  `worker/services/extraction/image-source.ts`.
- [X] T022 [US2] Add atomic image vision claim/finish repository transitions and safe outcome persistence
  in `worker/repositories/imports.ts`; prohibit a second extraction attempt regardless of outcome.
- [X] T023 [US2] Add `POST /api/import/:id/extract-image`, provider orchestration, and safe error handling
  in `worker/routes/imports.ts` and `worker/index.ts`.
- [X] T024 [US2] Connect the explicit action, progress/error state, and ready-import review navigation in
  `src/services/imports.ts`, `src/components/imports/ImageRecipeImport.tsx`, and
  `src/pages/RecipeImportPage.tsx`.

**Checkpoint**: Extraction is explicit, exactly once, schema validated, and never creates a library recipe
by itself.

---

## Phase 4: User Story 3 — Review and Save an Image-Sourced Recipe (Priority: P1)

**Goal**: The owner can edit an image-derived draft and explicitly save exactly one recipe while preserving
the original image and AI snapshot separately.

**Independent Test**: Extract a controlled image, change a field in review, save it, and verify the saved
recipe contains the change while the image import snapshot/source is unchanged.

### Tests for User Story 3

- [X] T025 [P] [US3] Add integration tests for immutable image source/draft retention, safe import GET
  projection, approved-recipe idempotency, and image source mapping in
  `tests/integration/image-import.test.ts`.
- [ ] T026 [P] [US3] Add end-to-end review-edit-save, cancel, and duplicate-approval journeys at 320, 768,
  and 1440 CSS pixels in `tests/e2e/image-import.spec.ts`.

### Implementation for User Story 3

- [X] T027 [US3] Extend existing import approval mapping and saved recipe source display to support
  image-sourced imports in `worker/repositories/imports.ts`, `src/domain/recipe/imports.ts`, and
  `src/domain/recipe/schema.ts`.
  Follow-up migration `0009_image_recipe_sources.sql` corrects the original recipe-table source-type
  constraint so approved image imports can be persisted in production.
- [X] T028 [US3] Display the safe image-source label in the existing review and recipe detail source areas
  without adding an image gallery or source URL in `src/components/imports/ImportReviewForm.tsx`,
  `src/pages/RecipeDetailPage.tsx`, and `src/app/styles.css`.

**Checkpoint**: Image recipe data follows the same review-before-save boundary as every other import type.

---

## Phase 5: Cross-Cutting Verification and Controlled Production Readiness

**Purpose**: Prove the complete feature, record implementation discoveries, and prepare—not perform—any
production changes until the owner separately authorizes them.

- [X] T029 Run focused image unit/component/Worker/integration/E2E suites, then existing import/review/
  recipe/search regression suites, `npm run cf-typecheck`, `npm run build`, `npm run validate-config`, and
  `git diff --check`.
- [ ] T030 Review browser and API outputs to prove no source bytes, private R2 key, OpenAI file ID, raw
  provider response, or credential is exposed; manually verify preview fallback and no-horizontal-scroll
  layouts at 320, 768, and 1440.
- [X] T031 Update actual endpoint contracts, data model notes, manual test steps, and any material
  implementation discovery under `specs/010-image-screenshot-import/`.
- [ ] T032 Propose the precise Wrangler/Cloudflare Images binding configuration and current
  transformation-cost check for owner approval. Do not configure the binding, apply the migration remotely,
  deploy, or perform live AI extraction under this task.
- [ ] T033 Propose and, only after separate owner approval, apply the smallest durable Feature 010 Project
  Memory update in `.sdd/memory/`, then run the Project Memory verifier.

---

## Dependencies and Execution Order

- Phase 1 blocks the remainder: accepted formats, import state, and migration compatibility must be known
  before source retention.
- US1 (Phase 2) establishes the no-AI capture vertical slice.
- US2 (Phase 3) requires a retained import from US1 and adds the one-attempt boundary.
- US3 (Phase 4) requires ready image imports from US2 and only extends existing review/approval behavior.
- Phase 5 follows all user stories. T032 and T033 always need separate owner authorization.

## Parallel Opportunities

- T002, T003, T005, and T007 can proceed in parallel once the migration/contract shape is chosen.
- T008–T010 can proceed alongside T011–T015 after source-validation interfaces are stable.
- T016–T018 can proceed in parallel with T019–T021 using controlled doubles.
- T025 and T026 can begin once T022's state transitions and T027's source mapping are available.

## Implementation Strategy

1. Lock down accepted image bytes and persistent state first.
2. Ship image capture without any AI side effect and test it as a complete slice.
3. Add the deliberate one-request vision extraction, including HEIC conversion only where required.
4. Reuse review and approval so the owner maintains final control.
5. Run full regression and request separate authorization for any production binding, migration, deploy, or
   Project Memory update.

## Notes

- The existing `OPENAI_API_KEY` remains server-side and is reused; no credential value is copied into source
  code, browser code, docs, or test output.
- Cloudflare Images is only a private HEIC conversion dependency. Its binding/usage and any production cost
  impact require later owner authorization before deployment.
- This task list excludes multi-image inputs, screenshots stitching, image editing, public source delivery,
  retry controls, source-image gallery work, authentication changes, automatic deployments, and all other
  non-MVP scope from the approved specification.

---

## Clipboard-Paste Amendment

**Purpose**: Let the owner paste a single screenshot or image into the existing image-import control,
inspect it locally, and explicitly confirm retention. This slice introduces no Worker/API/database/R2/AI
change and must preserve the existing selected-file behavior.

- [X] T034 [P] Add component tests in `tests/component/image-recipe-import.test.tsx` for a supported
  pasted image becoming a local candidate, preview/fallback display, no `onImport` call before
  **Use pasted image**, confirmed reuse of the existing upload callback, non-image/multiple-image recovery,
  and preservation of a current candidate after rejected paste data.
- [X] T035 [P] Add a Playwright journey in `tests/e2e/image-import.spec.ts` that dispatches a controlled
  image paste at 320, 768, and 1440 CSS pixels; verify no `/api/import/image` request occurs before the
  confirmation action and no horizontal scroll is introduced.
- [X] T036 Implement an accessible paste target and `paste` handler in
  `src/components/imports/ImageRecipeImport.tsx`. Use only the event clipboard file list; surface a local
  candidate with **Use pasted image** and route confirmation through the existing validation/submit path.
  Do not use the asynchronous Clipboard API or request clipboard-read permission.
- [X] T037 Update the image-import component styles and copy in `src/app/styles.css` for focus-visible,
  keyboard-accessible paste guidance, local candidate state, and narrow-layout readability.
- [X] T038 Run the focused component/E2E checks plus `npm run typecheck`, `npm run build`, and
  `git diff --check`. Confirm no network request is made until the explicit confirmation action.

**Completion Checkpoint**: A pasted screenshot follows the same deliberate privacy and AI boundary as a
selected file: paste → local preview → **Use pasted image** → private retention → optional explicit
extraction.
