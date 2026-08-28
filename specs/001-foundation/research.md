# Phase 0 Research: Application Foundation

**Date**: 2026-08-27
**Scope**: Resolve technical choices for a React SPA and Worker API deployed as one Cloudflare unit.

## Decision 1: Root React SPA plus Worker API

**Decision**: Use one root Vite project with React code in `src/`, the Worker entry in `worker/`,
and root `vite.config.ts` and `wrangler.jsonc` files.

**Rationale**: This matches Cloudflare's maintained React scaffold and the product's single
deployable application. It avoids package and workspace overhead while preserving a clear browser
and Worker boundary.

**Alternatives considered**:

- `apps/web` workspace: rejected until a second application or shared package exists.
- Separate frontend and API Workers: rejected because it adds deployment and local integration
  complexity without MVP value.
- Cloudflare Pages plus a Worker: rejected because Workers Static Assets supports the unified
  deployment directly.

**Sources**:

- [Cloudflare React + Vite guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)

## Decision 2: Cloudflare Vite plugin and explicit API routing

**Decision**: Use `@cloudflare/vite-plugin` for development, build, preview, and deployment. Set
`assets.not_found_handling` to `single-page-application` and
`assets.run_worker_first` to `["/api", "/api/*"]`.

**Rationale**: The plugin runs Worker code in `workerd`, locally simulates bindings, and builds the
SPA and Worker together. SPA fallback supports direct client-route navigation, while selective
Worker-first patterns ensure API requests and direct API navigation never return `index.html`.

**Alternatives considered**:

- `run_worker_first: true`: rejected because static asset requests do not need Worker invocations.
- Hash routing: rejected because correct static-asset fallback supports clean URLs.
- Plain Vite proxy plus separate Wrangler dev server: rejected because the official integration
  provides closer local/production parity with less configuration.

**Sources**:

- [React SPA with an API tutorial](https://developers.cloudflare.com/workers/vite-plugin/tutorial/)
- [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Static Assets](https://developers.cloudflare.com/workers/static-assets/)

## Decision 3: Explicit D1/R2 provisioning with local simulation

**Decision**: Define D1 as `DB` and R2 as `RECIPE_SOURCES` in `wrangler.jsonc`. Provision named
remote resources explicitly for deployment, while normal development and automated tests use local
simulations. Generate and commit environment types with `wrangler types`.

**Rationale**: Explicit identifiers make deployments reproducible; local simulation protects remote
data and works through the same binding interfaces. Generated types reflect the actual compatibility
date and configured bindings better than a generic Worker type package.

**Alternatives considered**:

- Automatic resource provisioning: deferred because explicit creation and committed identifiers are
  easier to audit and reproduce.
- Remote resources during normal development: rejected because they introduce data and billing risk.
- Handwritten `Env` binding types: rejected because they can drift from Wrangler configuration.

**Sources**:

- [Workers local development](https://developers.cloudflare.com/workers/local-development/)
- [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [R2 Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)
- [Workers TypeScript guidance](https://developers.cloudflare.com/workers/languages/typescript/)

## Decision 4: React Router Data Mode without SSR

**Decision**: Use React Router Data Mode with `createBrowserRouter`, `RouterProvider`, one root
`AppShell`, route-level error handling, and a catch-all not-found route. Use a root route error
boundary for unexpected failures and explicit component state for recoverable service failures.

**Rationale**: Data Mode preserves SPA/Vite control while providing route loaders, pending states,
and error boundaries needed by later API-backed recipe screens. A dedicated catch-all route handles
in-app unknown locations after Cloudflare serves the SPA entry document.

**Alternatives considered**:

- Declarative Router mode: simpler initially, but likely requires migration once recipe screens load
  and mutate server data.
- Framework Mode or SSR: rejected because Foundation requires a SPA and separate Worker API, not
  server-rendered route modules.
- A separate error-boundary library: rejected because React Router already supplies the required
  route boundary.

**Sources**:

- [React Router modes](https://reactrouter.com/start/modes)
- [React Router route objects](https://reactrouter.com/start/data/route-object)
- [React Router error boundaries](https://reactrouter.com/how-to/error-boundary)

## Decision 5: Accessible, mobile-first shell with plain CSS

**Decision**: Build semantic header, navigation, main content, and route headings; include a skip
link, visible focus, non-color active navigation cues, fluid wrapping, readable line lengths, and
no JavaScript viewport branching. Use plain CSS and custom properties.

**Rationale**: Semantic structure and CSS-first reflow meet the 320-pixel requirement with no UI
framework cost. Plain CSS is sufficient for one shell and allows a design system to emerge from
actual recipe screens later.

**Alternatives considered**:

- Component/UI framework: rejected as premature for the Foundation surface.
- CSS-in-JS runtime: rejected because it adds dependency and runtime cost without current benefit.
- JavaScript breakpoint rendering: rejected because CSS reflow is simpler and more robust.

**Sources**:

- [WAI page structure](https://www.w3.org/WAI/tutorials/page-structure/)
- [WCAG reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)
- [WCAG focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

## Decision 6: Browser, workerd, built integration, and E2E tests

**Decision**: Use Vitest 4.1+ as the common runner, Vitest Browser Mode with Playwright for React
components, `@cloudflare/vitest-plugin` for Worker-runtime tests, Wrangler
`createTestHarness()` for built-output D1/R2 binding checks, and Playwright for local-preview and
deployed smoke journeys. Keep projects/configurations separate because the Worker plugin cannot use
browser environments.

**Rationale**: The two runtimes that matter are real browsers and `workerd`. The chosen layers
verify accessible UI states, Worker contracts, configured local bindings, production build routing,
and the same critical journey against a deployed address.

**Alternatives considered**:

- DOM simulation for all component tests: viable but not selected because Browser Mode exercises
  real focus, layout-adjacent behavior, and browser events.
- Only `exports.default.fetch()` Worker tests: insufficient for built routing and binding validation.
- Remote D1/R2 in tests: rejected to preserve isolation and avoid accidental production mutation.

**Sources**:

- [Cloudflare Workers testing](https://developers.cloudflare.com/workers/testing/)
- [Cloudflare Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Cloudflare test harness](https://developers.cloudflare.com/workers/testing/test-harness/get-started/)
- [Vitest browser component testing](https://vitest.dev/guide/browser/component-testing)
- [Playwright web server](https://playwright.dev/docs/test-webserver)

## Decision 7: Toolchain baseline and dependency locking

**Decision**: Require Node.js 22 LTS at version 22.12 or newer, use npm, commit
`package-lock.json`, and let the lockfile pin the compatible dependency releases selected during
implementation. Require Wrangler 4.20+ and Cloudflare Vite plugin 1.7+ for selective Worker-first
routing; require Vitest 4.1+ for the current Cloudflare testing plugin.

**Rationale**: The baseline satisfies current Vite/Vitest requirements and is already available in
the development environment. Minimum capability versions protect the routing and test design while
the lockfile ensures reproducible installs.

**Alternatives considered**:

- Pin versions in the plan before package resolution: rejected because the implementation lockfile
  is the executable dependency record.
- Add `nodejs_compat`: rejected for the `2026-08-27` compatibility date, where current Cloudflare
  guidance enables modern Node compatibility by default; Worker code still prefers Web APIs.

**Sources**:

- [Vite getting started](https://vite.dev/guide/)
- [Vitest guide](https://vitest.dev/guide/)
- [Workers Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

## Research Resolution

All planning unknowns are resolved. No `NEEDS CLARIFICATION` markers remain.
