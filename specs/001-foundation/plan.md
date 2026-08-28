# Implementation Plan: Application Foundation

**Branch**: `master` | **Date**: 2026-08-27 | **Spec**: [spec.md](spec.md)

**Status**: Approved

**Input**: Approved feature specification from `/specs/001-foundation/spec.md`

## Summary

Create the smallest deployable foundation for the Recipe Library App: a responsive React SPA,
a Cloudflare Worker API with a safe health contract, local and remote D1/R2 bindings, predictable
SPA/API routing, accessible recovery experiences, and repeatable validation in browser and Workers
runtimes. Use one root project and the official Cloudflare Vite integration. Local validation is the
Feature 001 release gate; remote deployment is deferred until a custom hostname can be protected by
Cloudflare Access. Defer recipe entities, CRUD, imports, AI, application authentication, and search
to later features.

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js 22 LTS (minimum 22.12) for local tooling;
Cloudflare Workers compatibility date `2026-08-27`

**Primary Dependencies**: React, React DOM, React Router Data Mode, Vite,
`@vitejs/plugin-react`, `@cloudflare/vite-plugin`, and Wrangler; exact compatible releases are
locked by `package-lock.json`, with Wrangler 4.20+ and Cloudflare Vite plugin 1.7+ required for
selective Worker-first asset routing

**Storage**: Cloudflare D1 binding `DB` and R2 binding `RECIPE_SOURCES`, both locally simulated by
default; Feature 001 provisions and verifies bindings but creates no recipe schema or stored data

**Testing**: Vitest 4.1+; Vitest Browser Mode with Playwright for React components;
`@cloudflare/vitest-plugin` for Worker-runtime tests; Wrangler `createTestHarness()` for built
Worker/binding integration; Playwright for local-preview and deployed smoke journeys

**Target Platform**: Modern mobile and desktop browsers backed locally by Cloudflare Workers Static
Assets and a Worker API; the future remote target is an owner-controlled custom hostname protected
by Cloudflare Access

**Project Type**: Single-repository full-stack web application with one deployable unit

**Performance Goals**: 95% of typical broadband or mobile visits display the usable shell within
3 seconds; health and recovery interactions remain immediately perceivable to the user

**Constraints**: Responsive from 320 through 1440 CSS pixels without horizontal page scrolling;
`/api` and `/api/*` always execute Worker-first; browser output exposes no secrets, stack traces,
configuration values, or internal infrastructure details; local tests do not use remote D1/R2

**Scale/Scope**: Personal-development MVP foundation; one application shell, root page, not-found
experience, service availability state, and one local health endpoint; no durable domain entities or
remote deployment until the Access gate is satisfied

## Constitution Check

*GATE: Passed before research and re-checked after design.*

| Principle or constraint | Plan evidence | Result |
|---|---|---|
| Deliver working vertical slices | Shell -> health API -> Worker runtime -> browser and Worker tests forms one deployable slice. | PASS |
| Preserve a stable recipe domain | No recipe model or arbitrary placeholder data is introduced in Foundation. | PASS |
| Preserve import provenance and require review | Import behavior is explicitly outside Feature 001. | PASS |
| Prefer deterministic extraction; constrain AI | No AI or extraction dependency is introduced. | PASS |
| Keep providers and search replaceable | Cloudflare boundaries stay in Worker/config files; no speculative AI/search abstractions are added. | PASS |
| Protect secrets and user data | Health and error contracts are allow-listed and non-sensitive; local secret files are ignored. | PASS |
| Verify behavior at every boundary | Browser component, Worker-runtime, built integration, and local/deployed E2E checks are defined. | PASS |
| Control scope and complexity | One root app, plain CSS, one API route, no workspace, SSR, UI kit, ORM, or domain feature. | PASS |
| Required technology | React, TypeScript, Vite, Workers, D1, and R2 are represented in the deployable unit. | PASS |
| Specification approval gate | `spec.md` is approved; this plan creates no tasks or source implementation. | PASS |

### Post-design re-check

The data model contains only transient foundation state, the contract exposes only health/error
responses, and the quickstart validates the approved scenarios. No constitution exception or
complexity justification is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── health.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md                 # Created later by $speckit-tasks, after plan approval
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── AppShell.tsx
│   ├── router.tsx
│   └── styles.css
├── pages/
│   ├── HomePage.tsx
│   ├── NotFoundPage.tsx
│   └── RouteErrorPage.tsx
├── services/
│   └── health.ts
├── test/
│   └── setup-browser.ts
└── main.tsx

worker/
├── routes/
│   └── health.ts
└── index.ts

tests/
├── component/
│   └── app-shell.test.tsx
├── worker/
│   └── health.test.ts
├── integration/
│   └── bindings.test.ts
└── e2e/
    └── foundation.spec.ts

migrations/                 # Reserved for Feature 002; no migration in Feature 001
scripts/
└── validate-config.mjs

index.html
package.json
package-lock.json
playwright.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.worker.json
vite.config.ts
vitest.config.ts
vitest.worker.config.ts
wrangler.jsonc
worker-configuration.d.ts
```

**Structure Decision**: Use Cloudflare's current single-root React scaffold: browser code under
`src/`, Worker code under `worker/`, and shared root configuration. Do not add `apps/web` or shared
packages until another independently deployed application or observed duplication creates a real
boundary. D1/R2 configuration exists now, while schema and storage behavior remain deferred.

## Complexity Tracking

No constitution violations require justification.
