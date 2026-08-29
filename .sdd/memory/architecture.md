---
type: Software Architecture
title: Recipeapp Recipe Library Architecture
description: Current single-repository browser, Worker, D1 recipe/import review persistence, and Cloudflare binding architecture.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-29T08:16:46Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"},{"by":"human:owner","at":"2026-08-29T08:16:46Z"}]
sources: [{"id":"recipe-library-plan","resource":"../../specs/002-recipe-library/plan.md","title":"Recipe Library implementation plan"},{"id":"url-import-plan","resource":"../../specs/003-url-import/plan.md","title":"URL Recipe Import implementation plan"},{"id":"import-review-plan","resource":"../../specs/004-import-review/plan.md","title":"Import Review and Save implementation plan"},{"id":"recipe-migration","resource":"../../migrations/0001_recipe_library.sql","title":"Recipe Library D1 migration"},{"id":"url-import-migration","resource":"../../migrations/0002_url_imports.sql","title":"URL import migration"},{"id":"import-approval-migration","resource":"../../migrations/0003_import_approvals.sql","title":"Import approval migration"},{"id":"worker-config","resource":"../../wrangler.jsonc","title":"Worker configuration"},{"id":"package","resource":"../../package.json","title":"Project scripts and dependencies"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Architecture

## Components

- React and Vite provide feature UI under `src/`; the shared app shell includes safe health recovery.
- A Cloudflare Worker under `worker/` provides recipe CRUD, health, and URL-import routes under `/api`.
- D1 binding `DB` holds recipes plus ordered ingredients, instructions, tags, and retained URL import
  attempts. Each approved import records a unique `approved_recipe_id`; the recipe schema reserves an
  ownership column for future multi-user support. R2 binding `RECIPE_SOURCES` remains unused.

## Relationships and flows

- Cloudflare Static Assets serves the SPA, while `/api` and `/api/*` execute Worker-first.
- Manual create/edit flows submit through typed browser services to the Worker, which validates the
  stable recipe domain before replacing or creating ordered D1 child records.
- URL imports submit through typed browser services to an application-owned Worker fetcher that
  validates public URL destinations and redirects, bounds HTML, extracts exactly one Recipe JSON-LD
  item, and stores a distinct D1 import record. A cook can review and edit a ready draft, then
  `POST /api/import/:importId/approve` validates it and creates one URL-sourced recipe; the stored
  source and extraction snapshot remain immutable.
- The public contract includes `GET /api/health` and `GET/POST/PUT/DELETE /api/recipes`, with
  `PATCH /api/recipes/:id/favorite`, `POST /api/import/url`, `GET /api/import/:importId`, and
  `POST /api/import/:importId/approve`; safe error responses are allow-listed.
- Library title filtering uses a trimmed, case-insensitive, bound D1 query.
- Verification spans React component tests, Worker tests, local binding integration tests, and
  Playwright responsive journeys at 320, 768, and 1440 CSS pixels.

## Constraints and invariants

- Manual recipes retain source provenance, timestamps, original ingredient text, and list ordering.
- Future imports must preserve this stable recipe domain and retain import provenance without
  overwriting user-approved recipes. Approval is explicit and an import can produce at most one recipe.
- URL import accepts public HTTP(S) pages only, never uses AI, browser credentials, private-network
  destinations, or automatic recipe saving; supported sites must publish one usable Recipe JSON-LD item.
- Provider boundaries remain inside the Worker; browser code never receives provider credentials.
