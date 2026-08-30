# Implementation Plan: Browse and Save TheMealDB Recipes

**Branch**: `009-mealdb-browse-import` | **Date**: 2026-08-30 | **Spec**: [spec.md](spec.md)

**Input**: Approved Feature 009 specification.

## Summary

Add a small provider-backed import source to Recipeapp. The owner can browse TheMealDB by category or
area, search by recipe name, preview a selected recipe, then create a deterministic Recipe Draft for the
existing review-and-explicit-save flow. The browser talks only to Recipeapp; a narrow Worker-owned
TheMealDB client retrieves and normalizes official API data. No AI, website scraping, image storage, or
automatic saving is introduced.

## Technical Context

**Language/Version**: TypeScript 5.9; React 19; Cloudflare Workers runtime

**Primary Dependencies**: React Router, Vite, Cloudflare Workers, D1; no new production package

**Storage**: Existing D1 `recipe_imports` and recipe tables; one migration to allow retained `mealdb`
source imports and preserve safe provider provenance. No R2 use is required for this feature.

**Testing**: Vitest component and Worker tests, Worker-to-D1 integration tests, and Playwright end-to-end
tests with a controlled TheMealDB client double; no live provider calls in automated tests.

**Target Platform**: Modern mobile and desktop browsers behind the existing protected Cloudflare hostname.

**Project Type**: Single-repository React SPA plus Cloudflare Worker API.

**Performance Goals**: A provider browse, search, or detail response should render a usable state in under
two seconds on a normal network. The browse/list UI remains usable at 320, 768, and 1440 CSS pixels.

**Constraints**: Server-side official API requests only; bounded and validated provider responses; no
provider credential in browser code; no AI; no site scraping; preview creates no persistent record;
import uses existing review-before-save workflow; safe errors reveal no raw provider payload.

**Scale/Scope**: One owner-only MVP provider, one Add Recipe entry point, one browse/search page, one
preview state, one Worker client, and the existing import-review flow.

## Constitution Check

*GATE: Passed before design; re-checked after design.*

| Principle | Plan response | Gate |
|-----------|---------------|------|
| I. Deliver Working Vertical Slices | Deliver browse/search, preview, then review/save through UI, Worker, D1, and tests. | Pass |
| II. Preserve a Stable Recipe Domain | Normalize provider data into the existing Recipe Draft; preserve original ingredient text. | Pass |
| III. Preserve Import Provenance and Require Review | Retain provider identity and selected recipe reference as a separate import; saving remains explicit. | Pass |
| IV. Prefer Deterministic Extraction; Constrain AI | Provider fields are deterministically mapped; this feature makes no AI call. | Pass |
| V. Keep Providers and Search Replaceable | Add one narrow application-owned TheMealDB client and types, with no generic provider framework. | Pass |
| VI. Protect Secrets and User Data | Worker performs API requests, bounds responses, and returns safe projections; no external credentials are exposed. | Pass |
| VII. Verify Behavior at Every Boundary | Use client doubles, D1 integration, UI tests, and responsive end-to-end journeys. | Pass |
| VIII. Control Scope and Complexity | Excludes provider image storage, nutrition, shopping, public sharing, and additional providers. | Pass |

## Architecture Decisions

### 1. A narrow Worker-owned TheMealDB client

Create `worker/services/mealdb/mealdb-client.ts` and an adjacent type/normalization module. It owns API
URLs, bounded response parsing, provider error mapping, and deterministic conversion to transient browse
summaries, detail previews, and Recipe Draft fields. Routes and UI cannot depend on raw TheMealDB payloads.
This is the required replacement boundary without introducing a general provider plug-in framework.

### 2. Preview is transient; Import creates retained history

Browse/search/list/detail routes return safe transient application projections and perform no D1 writes.
Only an explicit Import action creates a `recipe_imports` record. The retained record stores provider
identity and provider-recipe reference, plus the normalized draft snapshot; it never stores an unbounded
raw provider response.

### 3. Extend the existing import model, not the approved-recipe model

Add `mealdb` as a supported import source through a committed D1 migration and domain/repository updates.
The saved approved recipe uses the existing Recipe schema and source display, with TheMealDB attribution
and selected provider reference. No AI parser, R2 object, or new Recipe table is needed.

### 4. Official API access only

The initial personal MVP uses TheMealDB's documented personal/development access through the Worker. A
future public or multi-user release must receive a new approval covering production access, provider key,
rate limits, attribution, storage rights, and provider terms; this plan does not create or commit any
provider secret.

## API Contract Direction

All endpoints are protected by the existing Cloudflare Access boundary and return only application-owned,
validated DTOs.

- `GET /api/mealdb/categories` and `GET /api/mealdb/areas`: provider browse facets.
- `GET /api/mealdb/recipes?category=…` or `?area=…`: bounded recipe summaries for one selected facet.
- `GET /api/mealdb/search?q=…`: bounded name-search summaries; blank queries are rejected locally and by
  the Worker.
- `GET /api/mealdb/recipes/:providerId`: safe normalized preview for one selected provider recipe.
- `POST /api/import/mealdb`: accepts one validated provider recipe identifier, fetches the authoritative
  provider detail through the Worker client, creates one ready import record, and returns the existing
  `RecipeImport` projection for review.

Exact response shapes and error codes will be recorded in `contracts/mealdb-import.md` during the approved
plan phase. The browser does not receive provider API URLs, credentials, or raw payloads.

## Data Model Direction

- Extend `RecipeImportSourceType` and import-row validation to include `mealdb`.
- Use a D1 migration to make `recipe_imports.source_type` accept the new source and to retain the provider
  recipe reference in a queryable, immutable field. Migration design must preserve existing URL, text, and
  PDF records.
- The draft source records `type: "mealdb"`, provider name, provider recipe identifier, canonical
  provider reference, and import timestamp. Ingredient `originalText` is formed deterministically from the
  supplied measure and ingredient; uncertain structured values remain absent rather than invented.
- Approval maps the new import type to existing recipe source persistence without changing saved-recipe
  ownership, list ordering, review, or edit behavior.

## Project Structure

```text
src/
├── pages/RecipeImportPage.tsx                 # Add Recipe entry point and provider route link
├── pages/MealDbBrowsePage.tsx                 # Browse, search, result, and preview states
├── components/imports/MealDbBrowse.tsx         # Mobile-first provider browse/search controls
├── domain/recipe/imports.ts                    # Extended application-owned import contracts
└── services/mealdb.ts                          # Typed browser service for safe Worker DTOs

worker/
├── index.ts                                    # MealDB route registration
├── routes/mealdb.ts                            # Input validation and safe HTTP responses
├── routes/imports.ts                           # Explicit provider import entry point
├── services/mealdb/mealdb-client.ts            # Official API requests and response bounds
└── repositories/imports.ts                     # Retained provider-import snapshots and approval mapping

migrations/
└── 0007_mealdb_imports.sql                     # Backward-compatible import-source migration

tests/
├── component/mealdb-browse.test.tsx            # Browse/search/preview and recovery UI
├── worker/mealdb-import.test.ts                # Route validation and normalization
├── integration/mealdb-import.test.ts           # D1 retention and approval behavior
└── e2e/mealdb-import.spec.ts                   # Responsive browse → preview → review → save journey
```

**Structure Decision**: Reuse the existing import pages, review form, browser service pattern, and
import repository. The provider client is a single focused service because only TheMealDB is in scope;
additional providers require their own approved feature and evidence of a shared abstraction need.

## Verification Strategy

1. Unit-test provider response normalization: complete recipe, missing optional fields, sparse
ingredient/measure pairs, malformed data, bounded result lists, and safe provider-error mapping.
2. Worker-test route validation, empty search rejection, safe response DTOs, no-persistence preview, and
explicit import creation with client doubles.
3. Integration-test migration compatibility, immutable retained provider reference/draft, and exactly-one
approved recipe behavior.
4. Playwright-test category/area browse and name search, preview without persistence, review editing and
save, empty and unavailable states, and 320/768/1440 layouts.
5. Run relevant existing import, review, recipe, search, build, and configuration validation suites to
prove no regression.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
