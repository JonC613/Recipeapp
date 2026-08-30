# Implementation Plan: Recipe Search

**Branch**: `007-recipe-search` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-recipe-search/spec.md`

## Summary

Extend the existing Recipe Library title filter into a unified saved-recipe search. A cook can search
title, ingredients, tags, cuisine, and category, then optionally narrow results by favorite status or a
specific field. The browser sends normalized criteria to the existing recipe-list route; the Worker uses
bound, case-insensitive D1 queries and returns only existing recipe-summary fields. No recipe data model,
import history, private source content, AI workflow, semantic search, or vector infrastructure changes.

## Technical Context

**Language/Version**: TypeScript 5.9; React 19 browser app; Cloudflare Worker runtime

**Primary Dependencies**: React Router, Vite, Cloudflare Workers, D1; no new production dependency

**Storage**: Existing Cloudflare D1 `recipes`, `recipe_ingredients`, and `recipe_tags` tables; no migration

**Testing**: Vitest component/Worker tests, local Worker-to-D1 integration tests, Playwright end-to-end tests

**Target Platform**: Modern mobile and desktop browsers served through Cloudflare Static Assets and Worker API

**Project Type**: Single-repository web application with browser SPA and Worker API

**Performance Goals**: Representative personal-library searches update visible results in under one second;
browser input remains responsive at 320, 768, and 1440 CSS pixels

**Constraints**: Case-insensitive saved-recipe matching; bound query parameters; no source/import content in
results; no AI or semantic/vector search; no user-approved recipe mutation from search; no new migration

**Scale/Scope**: Personal MVP library, one library screen, one existing list endpoint, five searchable fields,
five optional filters, and existing recipe summary cards

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Plan response | Gate |
|-----------|---------------|------|
| I. Deliver Working Vertical Slices | Each story includes library UI, typed service, Worker query, D1 result, and automated verification. | Pass |
| II. Preserve a Stable Recipe Domain | Search is read-only and returns existing recipe summaries; no schema change is needed. | Pass |
| III. Preserve Import Provenance and Require Review | Queries are restricted to saved recipe tables and cannot expose imports or source snapshots. | Pass |
| IV. Prefer Deterministic Extraction; Constrain AI | This feature does not call AI or alter extraction. | Pass |
| V. Keep Providers and Search Replaceable | A typed search-criteria boundary separates UI controls from D1 query construction and permits a later semantic provider. | Pass |
| VI. Protect Secrets and User Data | Worker validates criteria and uses bound statements; browser receives recipe summaries only. | Pass |
| VII. Verify Behavior at Every Boundary | Add repository/route, component, integration, and responsive Playwright coverage. | Pass |
| VIII. Control Scope and Complexity | No embeddings, vector database, import-search, ranking engine, or unrelated feature is introduced. | Pass |

**Post-design re-check**: Pass. The contract and data model preserve every gate above without an exception.

## Project Structure

### Documentation (this feature)

```text
specs/007-recipe-search/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
```text
src/
├── pages/RecipeLibraryPage.tsx             # Search and filter controls, result/empty states
├── domain/recipe/search.ts                 # Shared transient search-criteria contract
├── services/recipes.ts                     # Typed list-search client boundary
└── components/recipes/RecipeCard.tsx       # Existing result presentation

tests/
├── component/recipe-search.test.tsx       # UI criteria, empty/recovery states
├── worker/recipe-search.test.ts            # Route input validation and safe summaries
├── integration/recipe-search.test.ts       # D1 matching and conjunctive filtering
└── e2e/recipe-search.spec.ts               # 320/768/1440 saved-recipe journeys

worker/
├── routes/recipes.ts                       # Parse and validate list-search query parameters
└── repositories/recipes.ts                 # Bound D1 search query construction

src/app/styles.css                           # Responsive search and filter layout
```

**Structure Decision**: Retain the established single-repository browser/Worker structure. Search does not
warrant a new package: a shared `src/domain/recipe/search.ts` criteria contract separates browser and
Worker handling while `worker/repositories/recipes.ts`
are the narrow replacement boundaries required for later semantic search.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
