# Implementation Plan: Import Review and Save

**Branch**: `004-import-review` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Allow a cook to open a ready retained import as an editable review form and explicitly create one
new approved library recipe. Preserve the import's immutable source and extraction snapshot, make
cancel a no-write action, and reject missing or non-ready imports safely.

## Technical Context

**Language/Version**: TypeScript 6 / Node 22

**Primary Dependencies**: React 19, React Router 7, Cloudflare Workers, native Fetch API

**Storage**: Cloudflare D1; R2 unchanged and unused

**Testing**: Vitest component/Worker/integration suites and Playwright

**Target Platform**: Browser UI plus Cloudflare Worker; local simulated bindings

**Project Type**: Single-repository web application

**Performance Goals**: A controlled review-and-save journey completes in under two minutes

**Constraints**: Ready imports only; source and extraction snapshots remain immutable; explicit one-time
approval; no AI, new import types, automatic save, authentication, or remote deployment

**Scale/Scope**: One review route, one approval endpoint, one import-to-recipe link, and shared recipe
form behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: The feature is a vertical slice from retained import UI through a Worker approval boundary to
  a normal D1 recipe, with component, Worker/D1, and responsive browser validation.
- PASS: Approval reuses the stable recipe validation and preserves original ingredient text, ordered
  instructions, immutable import source, and extraction snapshot.
- PASS: The plan records an explicit import-to-approved-recipe relationship and prevents automatic or
  duplicate saves.
- PASS: No AI, provider credentials, new import type, R2 workflow, semantic search, authentication,
  or remote deployment is introduced.
- PASS: Existing RecipeForm behavior is reused rather than introducing a parallel recipe schema.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
```text
src/components/recipes/             # shared manual/review form behavior
src/pages/RecipeImportReviewPage.tsx # review route and recovery states
src/services/imports.ts              # import retrieval and approval calls
src/domain/recipe/                   # stable review/approval input shapes
worker/routes/imports.ts             # import approval HTTP handling
worker/repositories/imports.ts       # immutable import read and one-time approval linkage
worker/repositories/recipes.ts       # recipe creation with import source provenance
migrations/                          # import approval linkage migration
tests/component/ tests/worker/ tests/integration/ tests/e2e/
```

**Structure Decision**: Extend the existing browser, Worker, D1, and shared recipe-form boundaries.
The import repository owns the one-time approval link; the recipe repository remains the sole writer
of approved recipe data. No new package or provider abstraction is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
