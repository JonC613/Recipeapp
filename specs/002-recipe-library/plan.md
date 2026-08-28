# Implementation Plan: Recipe Library CRUD

**Branch**: `002-recipe-library` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Status**: Approved

**Input**: Approved feature specification from `/specs/002-recipe-library/spec.md`

## Summary

Deliver the first durable Recipe Library vertical slice: manual recipe entry flows through a
validated Worker API into D1, returns to a responsive library and cooking-friendly detail view, and
supports editing, favorite state, confirmed deletion, and title filtering. D1 owns recipe data;
R2 remains unused until PDF import. No authentication, import, AI, or remote deployment is added.

## Technical Context

**Language/Version**: TypeScript 6.x; Node.js 22.12+; Cloudflare Workers compatibility date `2026-08-27`

**Primary Dependencies**: Existing React, React Router, Vite, Cloudflare Vite plugin, Wrangler,
Vitest, and Playwright; no new UI, ORM, or database library

**Storage**: Cloudflare D1 binding `DB`; one committed SQL migration creates normalized recipe,
ingredient, instruction, and tag records. R2 binding remains configured but unused.

**Testing**: Existing Vitest Browser Mode, Workers Vitest integration, built Worker integration
harness, and Playwright. Local D1 bindings are simulated and migrations run locally for tests.

**Target Platform**: Modern mobile and desktop browsers using the existing single Worker and SPA;
local-only release gate

**Project Type**: Single-repository full-stack web application

**Performance Goals**: Typical library and recipe-detail views show usable content within 3 seconds;
a title-filter result is perceptibly updated within 1 second for a personal library of up to 1,000 recipes.

**Constraints**: UI is usable from 320 through 1440 CSS pixels; Worker error responses remain
allow-listed and non-sensitive; all SQL values use bound parameters; tests never use remote D1;
remote deployment remains gated by custom hostname, Cloudflare Access, and separate approval.

**Scale/Scope**: One personal recipe library, at least 1,000 manual recipes, one migration, five
manual-recipe screens/states (library, create, detail, edit, deletion confirmation); no images,
imports, AI, authentication, or broad search.

## Constitution Check

*GATE: Passed before research and re-checked after design.*

| Principle or constraint | Plan evidence | Result |
|---|---|---|
| Deliver working vertical slices | Manual form → API → D1 → library/detail → E2E is implemented in priority order. | PASS |
| Preserve a stable recipe domain | Recipe, ingredients, instructions, tags, and manual source are application-owned normalized records. | PASS |
| Preserve import provenance and require review | Only manual sources are created; import records and drafts remain outside this feature. | PASS |
| Prefer deterministic extraction; constrain AI | No extraction or AI call is added. | PASS |
| Keep providers and search replaceable | D1 access stays in a recipe persistence boundary; title filtering is isolated from later broader search. | PASS |
| Protect secrets and user data | Bound SQL parameters, input validation, and safe public errors are required; no credentials reach the browser. | PASS |
| Verify behavior at every boundary | Domain, Worker, D1 integration, and desktop/mobile E2E tests cover the CRUD flow. | PASS |
| Control scope and complexity | Reuses existing stack; no ORM, UI kit, image upload, auth, or import infrastructure. | PASS |
| Required technology | The current React, Vite, Workers, D1, and R2 bindings remain the repository architecture. | PASS |

### Post-design re-check

The normalized D1 design preserves original ingredient text and child ordering. Child data writes,
updates, and deletes occur as one recipe-level operation, so a partially updated recipe cannot be
presented to the user. The plan introduces no constitution exception.

## Project Structure

### Documentation (this feature)

```text
specs/002-recipe-library/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── recipes.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md                 # Created after plan approval
```

### Source Code (repository root)

```text
migrations/
└── 0001_recipe_library.sql

src/
├── app/
│   ├── router.tsx
│   └── styles.css
├── components/recipes/
│   ├── RecipeCard.tsx
│   └── RecipeForm.tsx
├── domain/recipe/
│   ├── schema.ts
│   └── validation.ts
├── pages/
│   ├── RecipeLibraryPage.tsx
│   ├── RecipeDetailPage.tsx
│   └── RecipeEditorPage.tsx
└── services/
    └── recipes.ts

worker/
├── repositories/
│   └── recipes.ts
└── routes/
    └── recipes.ts

tests/
├── component/
│   └── recipe-form.test.tsx
├── e2e/
│   └── recipe-library.spec.ts
├── integration/
│   └── recipes.test.ts
└── worker/
    └── recipes.test.ts
```

**Structure Decision**: Extend the Foundation's single root application. The domain module holds
the application recipe shape and validation; the Worker repository is the only D1-facing recipe
persistence module; the browser service owns HTTP serialization. Components are introduced only
where create and edit share form behavior.

## Complexity Tracking

No constitution violations require justification.
