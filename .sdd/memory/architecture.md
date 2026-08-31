---
type: Software Architecture
title: Recipeapp Recipe Library Architecture
description: Current single-repository browser, Worker, D1 import persistence, owner-protected Cloudflare deployment, private R2 source storage, bounded AI text/OCR/vision, and Worker-owned TheMealDB browse/import architecture.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-31T01:42:06Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"},{"by":"human:owner","at":"2026-08-29T08:16:46Z"},{"by":"human:owner","at":"2026-08-30T01:47:45Z"},{"by":"human:owner","at":"2026-08-30T05:51:22Z"}]
sources: [{"id":"recipe-library-plan","resource":"../../specs/002-recipe-library/plan.md","title":"Recipe Library implementation plan"},{"id":"url-import-plan","resource":"../../specs/003-url-import/plan.md","title":"URL Recipe Import implementation plan"},{"id":"import-review-plan","resource":"../../specs/004-import-review/plan.md","title":"Import Review and Save implementation plan"},{"id":"text-import-plan","resource":"../../specs/005-text-import/plan.md","title":"Text Recipe Import implementation plan"},{"id":"pdf-import-plan","resource":"../../specs/006-pdf-import/plan.md","title":"PDF Recipe Import implementation plan"},{"id":"recipe-search-plan","resource":"../../specs/007-recipe-search/plan.md","title":"Recipe Search implementation plan"},{"id":"secure-deployment-plan","resource":"../../specs/008-secure-deployment/plan.md","title":"Secure Cloudflare deployment plan"},{"id":"mealdb-plan","resource":"../../specs/009-mealdb-browse-import/plan.md","title":"TheMealDB browse and import plan"},{"id":"recipe-migration","resource":"../../migrations/0001_recipe_library.sql","title":"Recipe Library D1 migration"},{"id":"url-import-migration","resource":"../../migrations/0002_url_imports.sql","title":"URL import migration"},{"id":"import-approval-migration","resource":"../../migrations/0003_import_approvals.sql","title":"Import approval migration"},{"id":"text-import-migration","resource":"../../migrations/0004_text_imports.sql","title":"Text import migration"},{"id":"pdf-import-migration","resource":"../../migrations/0005_pdf_imports.sql","title":"PDF import migration"},{"id":"pdf-ocr-migration","resource":"../../migrations/0006_pdf_ocr_attempts.sql","title":"PDF OCR attempt migration"},{"id":"mealdb-import-migration","resource":"../../migrations/0007_mealdb_imports.sql","title":"TheMealDB import migration"},{"id":"worker-config","resource":"../../wrangler.jsonc","title":"Worker configuration"},{"id":"package","resource":"../../package.json","title":"Project scripts and dependencies"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Architecture

## Components

- React and Vite provide feature UI under `src/`; the shared app shell includes safe health recovery.
- A Cloudflare Worker under `worker/` provides recipe CRUD, health, and import routes under `/api`.
- D1 binding `DB` holds recipes plus ordered ingredients, instructions, tags, and retained URL/text/PDF/image
  import attempts. Each approved import records a unique `approved_recipe_id`; the recipe schema
  reserves an ownership column for future multi-user support. Private R2 binding `RECIPE_SOURCES`
  retains original PDF and image sources without exposing public object URLs.

## Relationships and flows

- Cloudflare Static Assets serves the SPA, while `/api` and `/api/*` execute Worker-first.
- The public application hostname is protected by Cloudflare Access with an owner-only Allow policy;
  direct provider endpoints are disabled and all browser API calls remain behind the Worker.
- Manual create/edit flows submit through typed browser services to the Worker, which validates the
  stable recipe domain before replacing or creating ordered D1 child records.
- URL imports submit through typed browser services to an application-owned Worker fetcher that
  validates public URL destinations and redirects, bounds HTML, extracts exactly one Recipe JSON-LD
  item, and stores a distinct D1 import record. A cook can review and edit a ready draft, then
  `POST /api/import/:importId/approve` validates it and creates one URL-sourced recipe; the stored
  source and extraction snapshot remain immutable.
- Text imports submit through typed browser services to `POST /api/import/text`; the Worker bounds the
  source to 50,000 characters, makes at most one parser call, and persists a ready or safe failure
  record. The Worker-only `RecipeParser` boundary uses the OpenAI Responses API with strict structured
  output; the browser never receives the API key or provider response payload. A ready text draft uses
  the same review/approval flow as URL imports and creates one text-sourced recipe.
- PDF imports submit one multipart file to `POST /api/import/pdf`. The Worker validates MIME type,
  `%PDF-` signature, and the 20 MB limit, stores the original in private R2, and uses the replaceable
  `ContentExtractor` boundary for bounded deterministic embedded-text extraction. Usable text passes
  through the existing `RecipeParser` and review/approval flow.
- An unreadable retained scan exposes an explicit `POST /api/import/:id/ocr` action. The repository
  atomically claims the import's only OCR attempt, the Worker retrieves the private R2 object, verifies
  the 10-page limit, uploads a temporary one-hour `user_data` file to OpenAI, invokes Responses by
  `file_id`, bounds the result, and attempts immediate provider-file deletion. Usable OCR text then
  enters the same constrained parser and review boundary; safe terminal state is retained otherwise.
- Image and screenshot imports submit one validated image to `POST /api/import/image`, retain its original
  privately in R2, and create a pending import without an AI call. The owner can explicitly call
  `POST /api/import/:id/extract-image` once; bounded Worker-owned vision extraction produces the existing
  editable draft or a retained safe failure, never a recipe automatically.
- The Recipe Library submits a typed transient criteria object to `GET /api/recipes`. The Worker trims and
  normalizes text, accepts only boolean favorite values, and passes criteria to the D1 repository. The
  repository uses bound, case-insensitive clauses over saved recipe, ingredient, and tag records; every
  active criterion is conjunctive and a recipe appears at most once, ordered by its existing update time.
- TheMealDB browse, search, and preview requests use a Worker-owned client that returns validated,
  bounded application DTOs and creates no D1 state. `POST /api/import/mealdb` is the only persistent
  provider action: it stores an immutable normalized `mealdb` import snapshot and opens existing review.
  Approval saves the canonical TheMealDB URL through the pre-existing recipe `url` source shape.
- The public contract includes `GET /api/health` and `GET/POST/PUT/DELETE /api/recipes`, with
  `PATCH /api/recipes/:id/favorite`, `POST /api/import/url`, `POST /api/import/text`,
  `POST /api/import/pdf`, `POST /api/import/image`, `GET /api/import/:importId`,
  `POST /api/import/:importId/ocr`, `POST /api/import/:importId/extract-image`, and
  `POST /api/import/:importId/approve`; safe error responses are allow-listed.
- `GET /api/recipes` accepts optional `q`, `favorite`, `tag`, `ingredient`, `cuisine`, and `category`
  criteria. Its response remains a safe recipe-summary projection and never includes import, source,
  provider, or private R2 data for search.
- The deployed Feature 009 implementation adds `GET /api/mealdb/categories`, `GET /api/mealdb/areas`,
  `GET /api/mealdb/recipes`, `GET /api/mealdb/search`, `GET /api/mealdb/recipes/:providerId`, and
  `POST /api/import/mealdb`.
- Verification spans React component tests, Worker tests, local binding integration tests, and
  Playwright responsive journeys at 320, 768, and 1440 CSS pixels.

## Constraints and invariants

- Manual recipes retain source provenance, timestamps, original ingredient text, and list ordering.
- Future imports must preserve this stable recipe domain and retain import provenance without
  overwriting user-approved recipes. Approval is explicit and an import can produce at most one recipe.
- URL import accepts public HTTP(S) pages only, never uses AI, browser credentials, private-network
  destinations, or automatic recipe saving; supported sites must publish one usable Recipe JSON-LD item.
- Text-import failures expose allow-listed classifications and require an explicit retry; they never
  create a recipe or automatically make a second provider call. Provider boundaries remain inside the
  Worker; browser code never receives provider credentials.
- PDF sources remain private in R2. PDF imports accept at most 20 MB, extracted/OCR text is bounded to
  50,000 characters, and OCR accepts at most 10 pages and one atomically claimed attempt per import.
- OCR is never automatic, never bypasses review, and never exposes provider credentials, raw provider
  details, or public R2 URLs. Temporary provider files have a one-hour expiry fallback and immediate
  cleanup is attempted after processing.
- Search is traditional and read-only: it makes no AI calls, does not alter recipes, and has no semantic,
  vector, ranking, or conversational-search infrastructure. The typed criteria boundary preserves a
  replacement point for a later approved search provider.
- TheMealDB provider client makes server-side official API requests only, does not expose raw upstream
  payloads or provider credentials, makes no AI call, and never auto-saves. Its `recipe_imports` history
  uses `mealdb` while approved recipes retain the existing URL-source persistence shape.
