---
type: Software Architecture
title: Recipeapp Recipe Library Architecture
description: Current single-repository browser, Worker, D1 recipe persistence, and Cloudflare binding architecture.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-28T14:35:00Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"}]
sources: [{"id":"recipe-library-plan","resource":"../../specs/002-recipe-library/plan.md","title":"Recipe Library implementation plan"},{"id":"recipe-migration","resource":"../../migrations/0001_recipe_library.sql","title":"Recipe Library D1 migration"},{"id":"worker-config","resource":"../../wrangler.jsonc","title":"Worker configuration"},{"id":"package","resource":"../../package.json","title":"Project scripts and dependencies"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Architecture

## Components

- React and Vite provide feature UI under `src/`; the shared app shell includes safe health recovery.
- A Cloudflare Worker under `worker/` provides recipe CRUD and health routes under `/api`.
- D1 binding `DB` holds recipes plus ordered ingredients, instructions, and tags; the schema reserves
  an ownership column for future multi-user support. R2 binding `RECIPE_SOURCES` remains unused.

## Relationships and flows

- Cloudflare Static Assets serves the SPA, while `/api` and `/api/*` execute Worker-first.
- Manual create/edit flows submit through typed browser services to the Worker, which validates the
  stable recipe domain before replacing or creating ordered D1 child records.
- The public contract includes `GET /api/health` and `GET/POST/PUT/DELETE /api/recipes`, with
  `PATCH /api/recipes/:id/favorite`; safe error responses are allow-listed.
- Library title filtering uses a trimmed, case-insensitive, bound D1 query.
- Verification spans React component tests, Worker tests, local binding integration tests, and
  Playwright responsive journeys at 320, 768, and 1440 CSS pixels.

## Constraints and invariants

- Manual recipes retain source provenance, timestamps, original ingredient text, and list ordering.
- Future imports must preserve this stable recipe domain and retain import provenance without
  overwriting user-approved recipes.
- Provider boundaries remain inside the Worker; browser code never receives provider credentials.
