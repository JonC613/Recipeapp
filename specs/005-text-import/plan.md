# Implementation Plan: Text Recipe Import

**Branch**: `005-text-import` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-text-import/spec.md`

## Summary

Add a pasted-text import path that validates a bounded source, sends one server-side extraction request
through an application-owned `RecipeParser`, validates strict structured output into the stable recipe
draft, retains source and extraction snapshot in D1, and reuses existing review/save. OpenAI Responses
with configurable default `gpt-5-mini` is the first adapter.

## Amendment: Responses envelope compatibility (2026-08-29)

The native REST Responses API returns structured output in a `message` item within its `output` array;
`output_text` is an SDK convenience and is not assumed to exist in the raw Worker fetch response. The
adapter will locate one `output_text` content item, parse it through the existing stable-domain mapper,
and treat absent or malformed content as the existing safe invalid-output outcome. A controlled Worker
test will use this real response shape and assert that the Worker global receiver is retained for
`fetch`. No live request is part of automated verification.

## Technical Context

**Language/Version**: TypeScript 6.0; Node.js 22.12+ tooling; Cloudflare Workers runtime

**Primary Dependencies**: React 19, React Router 7, Vite 8, Cloudflare Vite/Wrangler 4; native Worker
`fetch` for OpenAI Responses, with no new runtime package

**Storage**: Cloudflare D1 for source, status, extraction snapshot, and approval link; R2 unchanged

**Testing**: Vitest browser/Worker/integration and Playwright; deterministic `RecipeParser` doubles

**Target Platform**: Responsive browser plus Cloudflare Worker; local-first validation

**Project Type**: Single-repository web application

**Performance Goals**: Typical recipe reaches review within 30 seconds; local errors are immediate

**Constraints**: 50,000 characters; one request per explicit submit; no automatic retry; validated
structured output; no secret/source logging; no remote deployment

**Scale/Scope**: Personal MVP; one recipe per import; one D1 migration; reuse existing review route

## Constitution Check

*GATE: Passed before research and after design.*

- The vertical slice is UI → Worker → parser → D1 → review/save → automated verification.
- Provider output maps into the stable domain; every ingredient retains `originalText`.
- Raw source, extraction snapshot, and reviewed recipe remain distinct and immutable across approval.
- Strict Structured Outputs, untrusted-source instructions, null-to-absent mapping, and application
  validation constrain AI; there is no automatic retry.
- Routes depend on `RecipeParser`; OpenAI details remain in one Worker adapter.
- `OPENAI_API_KEY` is Worker-only, source is never logged, and public errors are allow-listed.
- Tests use doubles and incur no provider charges at component, Worker, D1, and responsive E2E layers.
- PDF/image import, generation, authentication, search expansion, R2 use, and deployment stay excluded.

Post-design re-check: **PASS**. No exception or constitution amendment is required.

## Project Structure

### Documentation (this feature)

```text
specs/005-text-import/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/text-import.openapi.yaml
└── tasks.md                 # created only after plan approval
```

### Source Code (repository root)

```text
src/
├── components/imports/
├── domain/recipe/
├── pages/
└── services/imports.ts
worker/
├── routes/imports.ts
├── repositories/imports.ts
└── services/ai/
migrations/0004_text_imports.sql
tests/{component,worker,integration,e2e}/
```

**Structure Decision**: Extend the feature-oriented repository. Provider interfaces remain Worker-side;
provider-neutral recipe/import contracts remain under `src/domain/recipe`.

## Complexity Tracking

No constitution violations require justification.
