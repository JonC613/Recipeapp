# Implementation Plan: Image and Screenshot Recipe Import

**Branch**: `010-image-screenshot-import` | **Date**: 2026-08-31 | **Spec**: [spec.md](spec.md)

**Input**: Approved Feature 010 specification and owner-approved reuse of the existing server-side OpenAI
key.

**Version**: 1.1

**Status**: Done — clipboard-paste amendment deployed, 2026-08-31

## Summary

Add one deliberate image import path to Recipeapp. The owner uploads one JPEG, PNG, WebP, or HEIC source
up to 10 MB; Recipeapp validates and stores it privately in the existing R2 bucket without spending AI
credits. The owner then explicitly selects **Extract recipe**, which runs exactly one structured OpenAI
vision request. A validated Recipe Draft continues through the existing review-and-explicit-save workflow.

JPEG, PNG, and WebP go directly to OpenAI as a temporary vision file. HEIC is retained unchanged, then
privately transcoded to JPEG through a Cloudflare Images Worker binding before the same vision request.
No source object is public and no OpenAI key changes are needed.

## Technical Context

**Language/Version**: TypeScript 5.9; React 19; Cloudflare Workers runtime  
**Primary Dependencies**: Existing React Router, Vite, Cloudflare Workers, D1, R2, OpenAI Responses API;
no new npm package  
**Storage**: Existing private `RECIPE_SOURCES` R2 bucket; D1 `recipe_imports` receives one backward-compatible
migration for image provenance and vision-attempt state  
**External Binding**: Add Cloudflare Images Worker binding (`IMAGES`) only for private HEIC-to-JPEG
transcoding; it is not an image gallery or public delivery service  
**Testing**: Vitest unit/component/Worker tests, Worker-to-D1 integration tests, and Playwright flows with
image, OpenAI, R2, and Images-binding doubles; no live AI calls in automated tests  
**Target Platform**: Modern mobile and desktop browsers behind existing Cloudflare Access protection  
**Performance Goals**: Upload acknowledgement and explicit extraction choice within 10 seconds locally;
responsive UI at 320, 768, and 1440 CSS pixels  
**Constraints**: One file; accepted signatures JPEG/PNG/WebP/HEIC; 10 MB; no automatic extraction; one
vision attempt; private R2 only; no raw provider output or credentials in browser/API responses; no
new model/key unless separately approved  
**Scale/Scope**: One owner-only image source and one approved extraction workflow; no multi-image merge,
gallery, crop/editor, background processing, or retry

## Constitution Check

*GATE: Passed before design; re-check after implementation.*

| Principle | Plan response | Gate |
|---|---|---|
| I. Deliver Working Vertical Slices | Implement capture, then explicit extract, then review/save through UI, Worker, R2, D1, and tests. | Pass |
| II. Preserve a Stable Recipe Domain | Reuse existing Recipe Draft, validation, approval, and source model; add only import provenance. | Pass |
| III. Preserve Import Provenance and Require Review | Retain original image and immutable draft separately; saving remains explicit and exactly once. | Pass |
| IV. Prefer Deterministic Extraction; Constrain AI | Signature validation is deterministic; one structured vision response is schema validated and instructed not to invent facts. | Pass |
| V. Keep Providers and Search Replaceable | Add one focused image-vision service beside the existing OpenAI parser, not a generic media/provider framework. | Pass |
| VI. Protect Secrets and User Data | Private R2, Worker-only OpenAI key, temporary OpenAI Files object cleanup, safe response DTOs, and no public image URL. | Pass |
| VII. Verify Behavior at Every Boundary | Test file validation, attempt claiming, R2 state, vision mapping, approval, responsive UX, and failure recovery. | Pass |
| VIII. Control Scope and Complexity | HEIC conversion is isolated to the required unsupported provider format; no image CDN, thumbnails, or multi-page design. | Pass |

## Architecture Decisions

### 0. Clipboard paste creates a local candidate, not an import

The existing `ImageRecipeImport` component listens for a user-initiated `paste` event on an accessible
paste target. It reads `event.clipboardData.files` only; it does not use `navigator.clipboard.read()` and
therefore does not request broad clipboard-read permission. Exactly one image file becomes the current
local candidate, receives the existing object-URL preview/fallback treatment, and is labelled as pasted.

The candidate remains browser-local until the owner selects **Use pasted image**. That action reuses the
same `submit` path as a selected file, including client-side size/type checks and `POST /api/import/image`.
No Worker, R2, D1, or OpenAI change is needed for paste itself. A non-image/multiple-image clipboard or
browser clipboard failure leaves any currently selected source unchanged and shows an accessible recovery
message.

### 1. Capture and extraction are separate routes and states

`POST /api/import/image` accepts and retains one valid source, returning an import record in a pending
extraction state. It cannot invoke OpenAI. `POST /api/import/:id/extract-image` atomically claims the
single available vision attempt before reading R2 and calling the provider. A second submission returns a
safe conflict, even if the first caller disconnects or fails.

### 2. One structured vision call reuses the recipe response contract

Create a focused `OpenAiImageRecipeParser` that uploads a temporary source to OpenAI Files with purpose
`vision`, sends it as `input_image` plus the current `openAiRecipeResponseSchema`, maps it with
`mapOpenAiRecipeResult`, and deletes the temporary file in `finally`. The prompt treats the image as data,
asks for exactly one recipe, preserves visible ingredient text/order, and leaves uncertain fields absent.
This is one logical and provider-owned extraction request—not the two provider calls used by PDF OCR.

### 3. HEIC conversion is a narrow private preprocessor

The Image service accepts HEIC/HEIF container signatures but OpenAI vision currently documents only PNG,
JPEG, WebP, and GIF input. For HEIC only, `env.IMAGES.input(r2Body).output({ format: 'image/jpeg' })`
creates an in-memory JPEG supplied to the vision parser. The original R2 source remains unchanged and no
transcoded derivative is retained. JPEG, PNG, and WebP bypass the transformation.

**Production prerequisite**: add an `images` binding named `IMAGES` in Wrangler and Cloudflare. This has
transformation usage implications; the owner must confirm the current allowance and enable it before the
Feature 010 production deployment. The app will return a clear provider-unavailable message if a required
HEIC conversion binding is absent or fails.

### 4. Extend import records explicitly, not PDF OCR fields

Migration `0008_image_imports.sql` will rebuild `recipe_imports` to add `image` as a source type and
dedicated `vision_status`, `vision_attempted_at`, `vision_failure_code`, and `extraction_method='vision'`
values. Existing URL, text, PDF, OCR, and MealDB rows are copied exactly. The projection shown to the
browser contains a safe `sourceName` and attempt state but never the R2 key or image bytes.

### 5. Bytes are validated before storage

The Worker checks multipart shape, zero length, 10 MB limit, permitted content declaration, and a bounded
signature parser: JPEG SOI, PNG signature, RIFF/WebP header, or ISO BMFF `ftyp` brands for HEIC/HEIF. It
normalizes accepted metadata to an application-owned format label and stores the bytes with non-public R2
HTTP metadata. A mismatched declaration, corrupt/truncated signature, and unsupported type fail before
any R2 or provider operation.

### 6. Reuse existing review and approval semantics

The draft source gains an `image` variant with safe filename and internal R2 reference. Approval maps it
to the existing saved-recipe `image` source persistence variant and claims `approved_recipe_id` as it does
for every other import. Review edits never mutate the retained original or parsed draft snapshot.

## API Contract Direction

All endpoints remain behind Cloudflare Access and return only application-owned, safe DTOs.

- `POST /api/import/image` — multipart one-file upload; validates, retains private source, and returns an
  import with `visionStatus: 'available'`. It does not call OpenAI.
- `POST /api/import/:id/extract-image` — claims one retained image import and returns either a ready
  Recipe Import Draft or a classified safe failure state. It cannot be retried in this MVP.
- `GET /api/import/:id` — extends the existing safe import projection with image/vision status; it never
  exposes source bytes, provider payload, temporary file identifier, or private R2 key.
- Existing `POST /api/import/:id/approve` — accepts the unchanged reviewed recipe payload and creates one
  saved recipe from a ready image import.

Clipboard paste introduces no API endpoint or request-shape change. Only a confirmed existing image-upload
request can leave the browser.

Exact DTO/error cases will be documented in `contracts/image-import.md` during implementation. Expected
failure classifications include `INVALID_FILE`, `FILE_TOO_LARGE`, `UNSUPPORTED_IMAGE`, `NO_RECIPE`,
`MULTIPLE_RECIPES`, `INVALID_OUTPUT`, and `UNAVAILABLE`.

## Data Model Direction

- Extend `RecipeImportSourceType`, `RecipeDraft.source`, `RecipeSource`, `RecipeImportFailureCode`, and
  `RecipeImport` to represent a safe image source and distinct vision state.
- Rebuild `recipe_imports` in migration `0008_image_imports.sql` to extend checks while preserving every
  existing column/value. New vision fields are null for existing rows.
- Store image bytes only in the existing private R2 bucket under an import-scoped key. Public projection
  excludes the key; the internal draft/source uses it solely for approval persistence.
- `parsed_recipe_json` is the immutable schema-valid AI snapshot. The reviewed saved Recipe remains a
  separate record, as it does for other import types.

## Project Structure

```text
src/
├── components/imports/ImageRecipeImport.tsx       # picker/paste candidate, safe preview, cost notice, progress
├── domain/recipe/imports.ts                       # image and vision import contracts
├── domain/recipe/schema.ts                        # saved image-source variant
├── pages/RecipeImportPage.tsx                     # image option alongside current import choices
└── services/imports.ts                            # safe upload/extract API functions

worker/
├── index.ts                                       # image upload and extraction route registration
├── routes/imports.ts                              # validation, retain, claim, provider orchestration
├── repositories/imports.ts                         # image import persistence and exactly-once state transitions
├── services/ai/openai-image-recipe-parser.ts      # temporary Files API + structured vision response
├── services/ai/openai-recipe-parser.ts            # export/reuse response schema and result mapping
├── services/extraction/image-signature.ts         # bounded MIME/signature recognition
├── services/extraction/image-source.ts            # HEIC conversion decision and R2 source read
└── services/storage/image-sources.ts              # private R2 write/read helpers

migrations/
└── 0008_image_imports.sql                         # backward-compatible image/vision import migration

tests/
├── component/image-recipe-import.test.tsx         # picker/paste candidate, preview fallback, explicit action, recovery
├── worker/image-import.test.ts                    # signature, route, attempt and safe-error behavior
├── worker/openai-image-recipe-parser.test.ts      # temporary file lifecycle and strict response mapping
├── integration/image-import.test.ts               # D1/R2 retention and approval idempotency
└── e2e/image-import.spec.ts                       # responsive upload → extract → review → save journey
```

**Structure Decision**: Reuse the existing import route/module/repository conventions and review form.
Image-specific code is intentionally narrow because the current scope is one image and one provider.

## Implementation Sequence

1. Extend the domain contracts and write the `0008_image_imports.sql` migration with a compatibility test
   for every existing source type.
2. Add deterministic filename, size, and signature validation plus private R2 image storage/read helpers;
   test malformed/spoofed samples before adding any provider call.
3. Add image-import repository operations: create retained pending import, safely project state, atomically
   claim one vision attempt, finish success/failure, and extend approval source mapping.
4. Implement the structured OpenAI image parser with a fake request boundary, temporary file cleanup, and
   output-schema/result-mapper reuse. Add the HEIC-only Images binding adapter behind an interface.
5. Add Worker endpoints and route registration; test that upload never calls OpenAI, extraction calls it at
   most once, and all errors reveal only safe application messages.
6. Add the Add Recipe image option and one-file responsive component. Implement a browser object-URL
   preview for decodable formats plus a filename/format fallback for HEIC or unsupported previews; revoke
   temporary browser object URLs on replacement/unmount.
7. Add an accessible paste target that turns one pasted image into a local candidate and requires
   **Use pasted image** before delegating to the existing private-retention submit path.
8. Connect explicit extraction progress, returned review navigation, cancellations, and recovery messages.
9. Add end-to-end fixtures and run the import/review regression suite at 320, 768, and 1440 widths.
10. Before a production deploy, configure the Cloudflare Images binding, apply migration after owner
   authorization, set any provider model variable only if needed, and perform one controlled protected
   production test. Do not deploy or alter Cloudflare bindings without that later authorization.

## Verification Strategy

1. Unit-test all accepted and rejected signatures, including type/extension mismatch, truncated bytes,
   empty file, oversize file, and representative HEIC `ftyp` brands.
2. Worker-test upload no-AI behavior, source-retention failure, one-attempt atomic claim, structured vision
   success, no-recipe/multiple-recipe/invalid-output/provider-failure mapping, and temporary file cleanup.
3. Integration-test migration compatibility, private import metadata, immutable draft snapshot, no source
   key in public projection, and exactly-one recipe approval.
4. Component-test explicit AI-credit disclosure, paste candidate confirmation/no-upload behavior,
   progress/disabled controls, safe preview/fallback, error recovery, and no unintended extraction after
   upload.
5. Playwright-test supported image journey, HEIC fallback fixture via binding double, cancellation, failed
   state, duplicate extract prevention, and review-edit-save at 320/768/1440.
6. Run existing `test`, worker/integration/E2E suites, type checks, build, configuration validation, and
   `git diff --check` before requesting implementation completion.

## Complexity Tracking

| Added element | Why needed | Simpler alternative rejected because |
|---|---|---|
| Cloudflare Images binding | OpenAI's documented vision formats exclude HEIC, while the approved MVP accepts HEIC. | Rejecting HEIC would silently change the approved requirement; client conversion is not reliable. |
| Dedicated vision fields | The one-attempt image state is different from PDF OCR and must be auditable. | Reusing OCR fields would mislabel behavior and make future changes risky. |
| OpenAI Files lifecycle | Keeps private R2 objects private and avoids base64 JSON expansion. | Public URL and browser-owned calls violate privacy and secret boundaries. |
