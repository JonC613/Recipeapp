---
type: Software Architecture
title: Recipeapp Foundation Architecture
description: Current single-repository browser, Worker, and Cloudflare binding architecture.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-28T03:16:22Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"}]
sources: [{"id":"foundation-plan","resource":"../../specs/001-foundation/plan.md","title":"Foundation implementation plan"},{"id":"worker-config","resource":"../../wrangler.jsonc","title":"Worker configuration"},{"id":"package","resource":"../../package.json","title":"Project scripts and dependencies"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Architecture

## Components

- React and Vite provide the browser UI under `src/`.
- A Cloudflare Worker under `worker/` provides `/api` routes.
- The Worker has D1 binding `DB` and R2 binding `RECIPE_SOURCES`; both are simulated for local
  development and tests.

## Relationships and flows

- Cloudflare Static Assets serves the SPA, while `/api` and `/api/*` execute Worker-first.
- The current public contract is `GET /api/health`; safe error responses are allow-listed.
- Verification spans React component tests, Worker tests, local binding integration tests, and
  Playwright responsive journeys at 320, 768, and 1440 CSS pixels.

## Constraints and invariants

- No recipe schema, recipe records, or uploaded source files exist yet.
- Future recipe persistence must preserve the stable recipe domain and import provenance.
- Provider boundaries remain inside the Worker; browser code never receives provider credentials.
