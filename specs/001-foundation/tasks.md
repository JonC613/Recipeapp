---

description: "Task list for Application Foundation implementation"
---

# Tasks: Application Foundation

**Input**: Design documents from `/specs/001-foundation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Tests**: Required by the approved specification and project constitution. Write each story's tests
before its implementation tasks and confirm they fail for the expected missing behavior.

**Organization**: Tasks are grouped by user story so each increment can be built, tested, and
demonstrated independently after the shared foundation is in place.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes a different file and has no incomplete dependency.
- **[Story]**: The user story this task supports (`US1`, `US2`, or `US3`).
- All paths are repository-relative.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the reproducible single-project toolchain without adding product behavior.

- [X] T001 Scaffold the root React + Cloudflare Vite project in `package.json`, `package-lock.json`, `index.html`, `src/`, `worker/`, `vite.config.ts`, and `wrangler.jsonc`, preserving `.agents/`, `.specify/`, and `specs/`.
- [X] T002 Configure Node 22.12+ support, npm scripts (`dev`, `build`, `preview`, `deploy`, `typecheck`, `cf-typecheck`, test scripts), and reproducible dependency locking in `package.json` and `package-lock.json`.
- [X] T003 [P] Configure browser, Worker, and integration test projects in `vitest.config.ts`, `vitest.worker.config.ts`, `playwright.config.ts`, and `src/test/setup-browser.ts`.
- [X] T004 [P] Configure ignored local state and credentials in `.gitignore` and document prerequisite setup in `README.md`.

**Checkpoint**: The project installs cleanly and has commands for development, build, type checking,
and the three required test layers.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the platform, routing, configuration, and safe-error primitives required by
every user story.

**⚠️ CRITICAL**: Complete this phase before beginning user story work.

- [X] T005 Configure the Cloudflare Vite integration, Worker entry point, SPA fallback, and selective Worker-first `/api` routing in `vite.config.ts`, `worker/index.ts`, and `wrangler.jsonc`.
- [X] T006 Configure the `DB` D1 and `RECIPE_SOURCES` R2 bindings, generate binding types, and add actionable configuration validation in `wrangler.jsonc`, `worker-configuration.d.ts`, and `scripts/validate-config.mjs`.
- [X] T007 [P] Implement reusable safe JSON response and error helpers matching `contracts/health.openapi.yaml` in `worker/http.ts` and cover their public shapes in `tests/worker/http.test.ts`.
- [X] T008 [P] Create the React Router Data Mode root configuration and shared accessibility primitives (root layout, skip link, semantic landmarks, focus baseline) in `src/app/router.tsx`, `src/app/AppShell.tsx`, and `src/app/styles.css`.
- [X] T009 Create the local Worker test environment and built-output integration harness with isolated local D1/R2 state in `tests/worker/setup.ts`, `tests/integration/setup.ts`, and `tests/integration/bindings.test.ts`.
- [X] T010 After explicit user authorization and Cloudflare authentication, provision `recipeapp-db` and `recipeapp-sources`, record non-secret identifiers in `wrangler.jsonc`, regenerate `worker-configuration.d.ts`, and verify local bindings remain simulated by default.

**Checkpoint**: `npm run dev`, `npm run build`, `npm run typecheck`, and `npm run cf-typecheck` can run; browser routes reach the SPA, API routes reach the Worker, and test infrastructure never uses remote D1/R2 by default.

---

## Phase 3: User Story 1 - Open the Recipe Library Application (Priority: P1) 🎯 MVP

**Goal**: A visitor can open a responsive, accessible Recipe Library shell at the root address.

**Independent Test**: Run the local preview, open `/` at 320, 768, and 1440 CSS pixels, and verify a
named Recipe Library shell with semantic landmarks, keyboard skip navigation, readable content, and
no horizontal page scrolling.

### Tests for User Story 1

- [X] T011 [P] [US1] Write failing browser component tests for the named app shell, landmark structure, skip link, and Home heading in `tests/component/app-shell.test.tsx`.
- [X] T012 [P] [US1] Write a failing desktop and mobile root-route journey in `tests/e2e/foundation.spec.ts` that asserts the Recipe Library shell and no horizontal page overflow.

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement the root Recipe Library content and route title in `src/pages/HomePage.tsx`.
- [X] T014 [US1] Implement the shell layout, root route, and accessible navigation wiring in `src/app/AppShell.tsx` and `src/app/router.tsx`.
- [X] T015 [US1] Implement mobile-first shell layout, visible focus, wrapping navigation, and 320–1440 pixel reflow styles in `src/app/styles.css`.
- [X] T016 [US1] Wire the React entry point to the completed router in `src/main.tsx` and make the US1 component and E2E tests pass.

**Checkpoint**: The root shell is independently demonstrable locally and through the built preview;
no recipe CRUD, import, AI, or authentication UI is present.

---

## Phase 4: User Story 2 - Run the Application Locally (Priority: P2)

**Goal**: A contributor can start the full local application and observe a successful, safe
browser-to-Worker health check with locally simulated bindings.

**Independent Test**: From a fresh checkout, run the documented install, typecheck, and development
commands; verify `/api/health` returns the contracted JSON and the Home screen reports availability
without needing remote credentials or storage data.

### Tests for User Story 2

- [X] T017 [P] [US2] Write failing Worker contract tests for `GET /api/health`, unsupported methods, and absent-binding failure behavior in `tests/worker/health.test.ts`.
- [X] T018 [P] [US2] Extend `tests/integration/bindings.test.ts` with failing built-output checks for local D1/R2 binding availability and API Worker-first routing.
- [X] T019 [US2] Extend `tests/e2e/foundation.spec.ts` with a failing local-preview health journey that verifies `/api/health` JSON and the available service state in the shell.

### Implementation for User Story 2

- [X] T020 [US2] Implement the health route and binding-presence guard from `contracts/health.openapi.yaml` in `worker/routes/health.ts` and register it in `worker/index.ts`.
- [X] T021 [US2] Implement the typed browser health client and transient availability state transitions from `data-model.md` in `src/services/health.ts`.
- [X] T022 [US2] Add the available/checking state to the existing root page in `src/pages/HomePage.tsx` without exposing binding or configuration details.
- [X] T023 [US2] Complete local setup and verification instructions in `README.md`, then make the US2 Worker, integration, and E2E tests pass.

**Checkpoint**: A clean local setup can run and verify the browser-to-Worker path using only local D1/R2 simulations; no remote Cloudflare account is needed for this checkpoint.

---

## Phase 5: User Story 3 - Recover from Navigation and Service Errors (Priority: P3)

**Goal**: A visitor gets safe, understandable recovery experiences for unknown locations and
temporary service failures.

**Independent Test**: Directly open an unknown browser route, an unknown API route, and a simulated
health failure; verify the browser offers Home or Retry, while API errors remain JSON and all user
messages exclude internal details.

### Tests for User Story 3

- [X] T024 [P] [US3] Write failing route-boundary and catch-all navigation tests in `tests/component/app-shell.test.tsx` for the in-app not-found page and safe unexpected-error recovery.
- [X] T025 [P] [US3] Write failing Worker tests for JSON `NOT_FOUND` and `METHOD_NOT_ALLOWED` responses in `tests/worker/http.test.ts` and `tests/worker/health.test.ts`.
- [X] T026 [US3] Extend `tests/e2e/foundation.spec.ts` with failing direct unknown-route, unknown-API-route, offline/failed-health, and Retry journeys.

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement the accessible in-app not-found and root route-error experiences in `src/pages/NotFoundPage.tsx` and `src/pages/RouteErrorPage.tsx`.
- [X] T028 [US3] Add the catch-all route and root error boundary with Home recovery in `src/app/router.tsx`.
- [X] T029 [US3] Implement unavailable state messaging and Retry behavior in `src/services/health.ts` and `src/pages/HomePage.tsx` using only allow-listed public error content.
- [X] T030 [US3] Finalize unknown API routing and safe public error responses in `worker/index.ts` and `worker/http.ts`, then make all US3 tests pass.

**Checkpoint**: Browser deep links and API misses recover correctly, and no tested failure case discloses credentials, configuration, stack traces, or internal identifiers.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify the complete Foundation feature against its approved contracts, quickstart, and
deployment acceptance evidence.

- [X] T031 [P] Validate the health contract examples and safe-error schema against `specs/001-foundation/contracts/health.openapi.yaml` in `tests/worker/health.test.ts` and `tests/worker/http.test.ts`.
- [X] T032 [P] Run accessibility and responsive regression checks at 320, 768, and 1440 CSS pixels in `tests/e2e/foundation.spec.ts` and record results in `specs/001-foundation/quickstart.md`.
- [X] T033 Run the complete local validation sequence from `specs/001-foundation/quickstart.md` and correct only Feature 001 regressions in the affected `src/`, `worker/`, `tests/`, and configuration files.
- [ ] T034 Deferred — after an owner-controlled custom hostname is available, Cloudflare Access is configured with an owner-restricted Allow policy, and the user explicitly authorizes deployment: deploy from `package.json`, run the read-only `E2E_BASE_URL` smoke journey in `tests/e2e/foundation.spec.ts`, and record the deployed verification result in `specs/001-foundation/quickstart.md`.
- [X] T035 Update foundation setup, commands, and recovery guidance in `README.md`, then verify all file paths and acceptance evidence agree with `specs/001-foundation/plan.md`.

**Checkpoint**: The feature meets all approved acceptance criteria locally; deployment verification is complete only after separately authorized Cloudflare resource creation and deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: starts immediately.
- **Phase 2 — Foundational**: starts after Setup and blocks every user story.
- **Phase 3 — US1**: starts after Foundational; it is the MVP increment.
- **Phase 4 — US2**: starts after Foundational and extends the US1 shell with service availability.
- **Phase 5 — US3**: starts after Foundational; execute after US1/US2 for the intended incremental delivery order.
- **Phase 6 — Polish**: starts after the desired user stories are complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2; has no dependency on recipe, import, or AI features.
- **US2 (P2)**: Depends on Phase 2 and integrates its status into the US1 shell; its Worker and
  binding tests are independently executable after Phase 2.
- **US3 (P3)**: Depends on Phase 2 and reuses the existing shell only for recovery UI; API and route
  recovery can be tested independently.

### Parallel Opportunities

- T003 and T004 can run in parallel after T001.
- T007 and T008 can run in parallel after T005 and T006.
- T011 and T012 can run in parallel; T013 can begin after T008.
- T017 and T018 can run in parallel; T019 follows the shared E2E file established by T012.
- T024 and T025 can run in parallel; T027 can begin after the shared router from T008.
- T031 and T032 can run in parallel after the corresponding feature work is complete.

## Parallel Example: User Story 1

```text
Task: "Write failing browser component tests in tests/component/app-shell.test.tsx"
Task: "Write failing desktop and mobile root-route journey in tests/e2e/foundation.spec.ts"
Task: "Implement root Recipe Library content in src/pages/HomePage.tsx"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational work, excluding T010 unless remote resource provisioning is
   separately authorized and needed for deployment.
2. Complete US1 and validate it in the local built preview.
3. Stop for a working application-shell demonstration before adding service status or recovery work.

### Incremental Delivery

1. US1 delivers the public, responsive Recipe Library shell.
2. US2 adds local contributor startup and browser-to-Worker health verification.
3. US3 adds safe navigation and service-failure recovery.
4. Polish validates the same read-only journey locally and, only with authorization, after deployment.

## Notes

- All tasks follow the required checkbox, ID, optional parallel marker, story label, and exact-path format.
- T010 and T034 change Cloudflare account state and require separate user authorization at execution time. T034 additionally requires an owner-controlled custom hostname and Cloudflare Access before deployment.
- Feature 001 does not create recipe tables, recipe data, uploads, AI calls, authentication, or search.
