# Implementation Plan: URL Recipe Import

**Branch**: `003-url-import` | **Date**: 2026-08-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a safe URL submission path that fetches a bounded public HTML page with explicit redirect
validation, extracts an unambiguous Schema.org Recipe JSON-LD item, normalizes it to an unsaved
RecipeDraft, and persists each attempt as import history. No AI or recipe saving is included.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 6 / Node 22

**Primary Dependencies**: React 19, React Router 7, Cloudflare Workers, native Fetch API

**Storage**: Cloudflare D1; R2 unchanged and unused

**Testing**: Vitest component/Worker/integration suites and Playwright

**Target Platform**: Browser UI plus Cloudflare Worker; local simulated bindings

**Project Type**: Single-repository web application

**Performance Goals**: Ready deterministic draft in under 10 seconds for controlled fixtures

**Constraints**: HTTPS/HTTP public URLs only; manual redirect validation; bounded response bytes;
transparent importer identity; no access-control bypass; no AI, automatic recipe saving, or remote deployment

**Scale/Scope**: One URL form, two import endpoints, one import record table, one draft-result view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Vertical slice includes add-recipe UI, Worker route, D1 import history, and automated checks.
- PASS: Draft uses the existing stable recipe shape and preserves original ingredient/instruction text.
- PASS: Source and extraction snapshot remain separate; no imported recipe can be saved automatically.
- PASS: Deterministic JSON-LD precedes AI; AI is explicitly absent.
- PASS: URL fetch is isolated behind an application-owned extractor and uses no browser secrets.
- PASS: Worker, D1, UI, and responsive browser verification are planned.

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/domain/recipe/                 # shared draft/source shapes
src/services/imports.ts            # typed browser calls
src/components/imports/            # URL form and draft summary
src/pages/RecipeImportPage.tsx     # add-recipe URL path
worker/routes/imports.ts           # import HTTP handlers
worker/repositories/imports.ts     # D1 import records
worker/services/extraction/        # URL validator, fetcher, JSON-LD parser, normalizer
migrations/                        # recipe_imports migration
tests/worker/ tests/integration/ tests/component/ tests/e2e/
```

**Structure Decision**: Extend the existing single repository with narrow URL-extraction and import
repository boundaries; do not introduce packages or an AI provider adapter.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
