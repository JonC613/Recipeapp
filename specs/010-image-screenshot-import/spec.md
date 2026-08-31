# Feature Specification: Image and Screenshot Recipe Import

**Feature Branch**: `010-image-screenshot-import`

**Created**: 2026-08-31

**Version**: 1.1

**Status**: Done — clipboard-paste amendment deployed, 2026-08-31

**Input**: Owner request: "Upload common image formats and screenshots for AI recipe extraction."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retain One Recipe Image (Priority: P1)

As the owner, I can select one clear recipe screenshot or photo, see what I selected, and retain it as a
private import source, so I can decide whether to spend an AI extraction attempt.

**Why this priority**: Safe source capture and clear cost control are required before AI processing can
be trusted.

**Independent Test**: Select a valid fixture at desktop, tablet, and mobile widths; verify its filename
and preview appear, no AI request occurs, no recipe is created, and the retained source has no public URL.

**Acceptance Scenarios**:

1. **Given** the owner selects one valid JPEG, PNG, WebP, or HEIC image at most 10 MB, **When** the
   upload completes, **Then** Recipeapp retains the source privately, displays a safe preview and source
   label, and offers an explicit **Extract recipe** action.
2. **Given** the owner leaves or cancels before extraction, **When** the import view closes, **Then** no
   AI call or library recipe is created and the retained source remains available as an import record.
3. **Given** the owner pastes one image from the browser clipboard into the image-import area, **When**
   the browser supplies a supported image file, **Then** Recipeapp shows a local preview and
   **Use pasted image** action without uploading, retaining, or extracting it yet.
4. **Given** a pasted image preview is shown, **When** the owner selects **Use pasted image**, **Then**
   the existing private one-image retention flow runs with the same validation and AI boundary as a file
   selected from the device.

---

### User Story 2 - Explicitly Extract a Recipe from an Image (Priority: P1)

As the owner, I can explicitly ask Recipeapp to read my selected recipe image with AI, so I receive an
editable recipe draft without automatic or repeated AI charges.

**Why this priority**: Images and screenshots need vision extraction, but extraction must remain
intentional, bounded, and recoverable.

**Independent Test**: From a retained controlled image fixture, select **Extract recipe** once and verify
one vision request produces a validated, unsaved Recipe Draft or a safe failure state.

**Acceptance Scenarios**:

1. **Given** a retained valid image, **When** the owner selects **Extract recipe**, **Then** Recipeapp
   makes at most one Worker-owned vision request and shows clear in-progress feedback.
2. **Given** vision identifies exactly one usable recipe, **When** extraction finishes, **Then** the owner
   is sent to the existing editable review screen with preserved ingredient wording and instruction order.
3. **Given** the image is unreadable, contains no recipe, contains multiple recipes, produces invalid
   output, or the AI provider is unavailable, **When** extraction ends, **Then** no recipe is created and
   the owner receives a safe recovery path.

---

### User Story 3 - Review and Save an Image-Sourced Recipe (Priority: P1)

As the owner, I can correct an image-extracted draft and explicitly save it, so the Recipe Library keeps my
approved recipe while retaining the original image and AI snapshot separately.

**Why this priority**: Image extraction is imperfect; explicit review preserves the central Recipeapp
trust boundary.

**Independent Test**: Extract a controlled image recipe, edit one field in review, save it, and verify
one image-sourced Recipeapp recipe contains the edit while the original image and extraction snapshot are
unchanged.

**Acceptance Scenarios**:

1. **Given** an image import is ready, **When** the owner opens review, **Then** all existing Recipe Draft
   fields remain editable and the source is identified as an image import.
2. **Given** the owner explicitly saves reviewed values, **When** approval succeeds, **Then** exactly one
   recipe is created and the retained image/import snapshot remains unchanged.
3. **Given** an image import was already approved or already used its vision attempt, **When** the owner
   revisits it, **Then** it cannot create a duplicate recipe or make another vision request.

### Edge Cases

- The selected file is not JPEG, PNG, WebP, or HEIC.
- The selected image exceeds 10 MB, is empty, corrupted, or has spoofed content/type metadata.
- A supported image format cannot be previewed by a particular browser.
- A photo contains handwriting, glare, very small text, several recipe cards, unrelated content, or no
  recipe. Handwriting accuracy is not guaranteed.
- The browser disconnects or the AI provider fails after the private source is retained.
- The owner submits the same image more than once; each submission is a distinct retained import attempt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Recipeapp MUST offer an image/screenshot import option alongside the existing import choices.
- **FR-002**: The option MUST accept exactly one JPEG, PNG, WebP, or HEIC file no larger than 10 MB.
- **FR-003**: The Worker MUST validate the claimed file type and a safe image signature before retaining
  an accepted source; unsupported, empty, oversized, or invalid files MUST be rejected before AI use.
- **FR-004**: Every accepted source image MUST be stored privately in the existing R2 source bucket and
  associated with an independent import record; the browser MUST NOT receive a public R2 URL or object key.
- **FR-005**: Before extraction, the UI MUST show the selected source and clearly state that choosing
  **Extract recipe** uses AI credits.
- **FR-006**: Uploading or previewing an image MUST NOT automatically invoke AI or create a library recipe.
- **FR-007**: Each image import MUST permit no more than one explicit vision extraction attempt.
- **FR-008**: AI vision and recipe parsing MUST run only through the Worker using existing server-side
  provider credentials. The browser MUST NOT receive provider credentials or raw provider responses.
- **FR-009**: The vision prompt and constrained parser MUST preserve supported source facts, ingredient
  original wording, and instruction ordering; it MUST leave unknown values absent and MUST NOT invent
  ingredients, quantities, instructions, times, servings, or other recipe facts.
- **FR-010**: A successful extraction MUST produce the existing validated Recipe Draft and use the existing
  review-and-explicit-save workflow.
- **FR-011**: Ready, failed, no-recipe, multiple-recipe, invalid-output, and provider-unavailable outcomes
  MUST be retained with safe classifications and recoverable owner-facing messages.
- **FR-012**: Review cancellation, failed extraction, and abandonment MUST create no library recipe.
- **FR-013**: Approval MUST create at most one image-sourced recipe and MUST preserve the original image
  and extraction snapshot separately from later user edits.
- **FR-014**: Recipe search, list summaries, public errors, and logs MUST NOT expose original image bytes,
  private R2 paths, raw AI payloads, or provider credentials.
- **FR-015**: The UI MUST remain usable without horizontal scrolling at 320, 768, and 1440 CSS pixels and
  provide an accessible upload, progress, error, and recovery experience.
- **FR-016**: This MVP MUST NOT add multi-image imports, PDF changes, image editing, source-image gallery,
  OCR retries, handwriting guarantees, automatic background processing, image generation, semantic search,
  authentication changes, or automatic deployment.
- **FR-017**: The image import control MUST accept a browser `paste` event containing exactly one image
  file and show it only as a local candidate until the owner explicitly selects **Use pasted image**.
  Pasting MUST NOT upload bytes, create an import, call AI, or request broad clipboard-read permission.
- **FR-018**: A pasted candidate MUST use the same client-side size/type feedback and the same
  server-side signature validation as a selected file. Non-image clipboard content, more than one image,
  unsupported types, or unavailable browser clipboard data MUST result in an accessible, recoverable
  message without changing the selected file or retained import state.

### Key Entities

- **Image Import Source**: One original accepted image held privately in R2 and linked to one import.
- **Image Import Record**: One retained attempt with source metadata, attempt state, safe outcome,
  extraction snapshot when available, and optional approved recipe identifier.
- **Vision Extraction Attempt**: One explicitly requested, cost-controlled Worker-to-provider call using
  the retained source image.
- **Reviewed Recipe**: The existing owner-approved library recipe created from an editable image draft.

## Success Criteria *(mandatory)*

- **SC-001**: A controlled valid image upload reaches an explicit extraction choice within 10 seconds in
  local tests, with no AI request before the owner chooses it.
- **SC-002**: Controlled image fixtures that contain one recipe produce a schema-valid, editable draft with
  source ingredient text and instruction ordering preserved.
- **SC-003**: Automated tests confirm that invalid, unsupported, oversized, unreadable, no-recipe,
  multiple-recipe, invalid-output, and provider-failure cases create zero library recipes.
- **SC-004**: Automated tests confirm every image import has zero vision requests before explicit action
  and no more than one after it.
- **SC-005**: Automated tests confirm approved image imports create exactly one recipe while retaining an
  unchanged source record and extraction snapshot.
- **SC-006**: Browser tests demonstrate upload, source preview, extraction progress, review/save, cancel,
  and recovery flows at 320, 768, and 1440 CSS pixels without horizontal scrolling.
- **SC-007**: Browser and API tests verify that no source bytes, private R2 key, raw provider response, or
  provider credential appears in a browser response, search result, or public error.
- **SC-008**: Browser tests verify that pasting a supported screenshot shows a local candidate and that no
  upload, import, recipe creation, or AI request occurs before **Use pasted image** is selected.

## Assumptions

- This feature reuses the existing private R2 bucket, import repository, constrained OpenAI recipe parser,
  and review/approval workflow rather than introducing a new recipe model or provider framework.
- The existing Worker-side OpenAI vision-capable configuration may be reused only after the plan confirms
  the request format, bounds, and cost behavior. No new provider key is assumed.
- HEIC validation and browser preview support will be researched during planning; a non-previewable but
  valid retained HEIC image must still have a safe recovery state.
- The feature is owner-only behind the existing Cloudflare Access boundary. Any future public or multi-user
  release requires a fresh privacy, retention, and AI-cost review.
- Clipboard support uses the user-initiated browser `paste` event only. It does not use the asynchronous
  Clipboard API or ask for a clipboard-read permission.

## Out of Scope

- Multiple-image recipe sets, cookbook albums, and stitching pages together.
- GIF and AVIF uploads.
- Editing, cropping, rotating, or annotating source images.
- Image thumbnails or galleries on recipe cards.
- Guaranteed handwriting interpretation.
- Clipboard history browsing, pasting text as a recipe, and automatic clipboard capture.
- Any automatic retry or automatic extraction after upload.
