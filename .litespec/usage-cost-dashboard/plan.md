---
feature: usage-cost-dashboard
artifact: plan
status: implementing
owner: user
version: 0.3
created: 2026-08-31
updated: 2026-09-01
spec_version: 0.1
---

# Implementation Plan: Usage and Cost Dashboard

## Technical approach

Add a typed, read-only `GET /api/admin/usage` Worker route plus a `/admin/usage` React page. The route validates a small fixed period selector, aggregates Recipeapp activity from D1, and composes independently bounded Cloudflare and OpenAI reporting adapters. Each external adapter returns a safe `available`, `not_configured`, or `unavailable` result rather than throwing provider details into the browser.

The dashboard will use the existing Cloudflare Access-protected hostname as its production access boundary. Provider credentials remain Worker secrets; fixed account resource identifiers are server-side Worker variables. Local tests use injected adapters and test data; they make no real analytics or billing calls. No migration is planned because reporting is calculated from existing records and configuration.

## Key decisions

### KD-01 — One safe summary contract

- **Choice:** Expose one owner-facing `/api/admin/usage?range=7d|30d|month` response with aggregated values and per-card status.
- **Rationale:** The existing Worker dispatches narrow routes and the frontend uses typed same-origin services. One contract keeps sensitive provider detail server-side and makes partial availability consistent.
- **Alternatives considered:** Browser calls to providers; separate endpoints per provider; persisting a reporting snapshot table.
- **Consequences:** A request may make bounded upstream calls and values can be delayed. Long-term history and separate refresh rates remain deferred.

### KD-02 — Optional provider adapters, never guessed values

- **Choice:** Use `CloudflareUsageClient` and `OpenAiUsageClient` interfaces that return normalized aggregate DTOs or safe availability outcomes. Instantiate real clients only if their dedicated Worker secret sets are present.
- **Rationale:** Cloudflare resource analytics and OpenAI organization costs have different authorization and retention behavior. The app remains useful without either credential and avoids treating unavailable data as zero.
- **Alternatives considered:** Reusing `OPENAI_API_KEY` for organization reporting; scraping dashboards; hardcoding provider prices from tokens.
- **Consequences:** The owner must explicitly create least-privilege reporting credentials. The normal recipe-processing OpenAI key cannot supply exact organization cost.

### KD-03 — Server configuration for budget

- **Choice:** Configure `USAGE_MONTHLY_BUDGET_USD` as a non-secret Worker variable and apply an 80% warning threshold in the reporting domain logic.
- **Rationale:** It meets the personal-MVP need without adding a privileged settings UI or D1 write path.
- **Alternatives considered:** A browser-editable budget page; a D1 settings table; provider-enforced spending limits.
- **Consequences:** Budget updates require a configuration deployment. Unknown cost yields an unavailable budget state; reporting never blocks imports or billing.

### KD-04 — Availability belongs to each card

- **Choice:** Preserve an independent status, retrieval timestamp, and safe hint for application activity, Worker, D1, R2, and OpenAI sections.
- **Rationale:** One provider failure should not hide healthy data from other sources.
- **Alternatives considered:** Fail the entire endpoint whenever one dependency fails; omit failed sections.
- **Consequences:** The API and UI have slightly richer types but are honest about partial data.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `worker/index.ts` | Dispatch the bounded admin usage route. | R-06, AC-05.3 |
| `worker/routes/usage.ts` | Validate method/range, compose safe reports, and map expected failures. | US-01–US-05 |
| `worker/services/usage/*` | Define DTOs, activity aggregation, budget evaluation, and provider-client interfaces/implementations. | R-02–R-05 |
| `worker/repositories/usage.ts` | Perform read-only aggregate queries over recipes and imports. | AC-01.2, AC-01.3 |
| `wrangler.jsonc`, `.dev.vars.example`, generated Worker types | Declare non-secret budget and optional reporting-secret documentation/type surfaces without values. | NFR-01, R-05 |
| `src/services/usage.ts`, `src/domain/usage/*` | Provide a typed browser-safe client and response model. | R-01, R-06 |
| `src/pages/UsageDashboardPage.tsx`, `src/app/router.tsx`, `src/app/AppShell.tsx`, styles | Add owner dashboard route, navigation, controls, accessible status cards, and responsive layout. | US-01–US-05, NFR-05 |
| `tests/worker/*`, `tests/component/*`, `tests/integration/*`, `tests/e2e/*` | Test boundaries, aggregation, safe failures, rendering, and route navigation. | All current ACs |

## Technical detail

### Response model and states

The browser-safe response will use a fixed period and a reusable capability wrapper:

```ts
type UsageRange = '7d' | '30d' | 'month'
type Capability<T> =
  | { state: 'available'; data: T; retrievedAt: string; source: 'recipeapp' | 'cloudflare' | 'openai' }
  | { state: 'not_configured'; hint: string }
  | { state: 'unavailable'; hint: string }

type UsageDashboard = {
  range: UsageRange
  activity: Capability<ActivitySummary>
  cloudflare: { workers: Capability<WorkerUsage>; d1: Capability<D1Usage>; r2: Capability<R2Usage> }
  openai: Capability<OpenAiUsageAndCost>
  budget: BudgetStatus
}
```

`ActivitySummary` uses only bounded aggregate counts. The Cloudflare client makes one bounded GraphQL request per dashboard request, normalizes only approved metrics, and omits unavailable categories. The OpenAI client makes bounded Usage/Costs requests for the selected period with an admin reporting key; daily Usage requests use at most 31 buckets, matching the provider maximum. Both client implementations receive a timeout-enabled `fetch` dependency for testing.

### Configuration contract

- `USAGE_MONTHLY_BUDGET_USD`: optional positive USD amount; unset means budget not configured.
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_WORKER_NAME`, `CLOUDFLARE_D1_DATABASE_ID`, and `CLOUDFLARE_R2_BUCKET_NAME`: server-side Worker variables naming the fixed Recipeapp resources.
- `CLOUDFLARE_ANALYTICS_API_TOKEN`: optional secret required to enable Cloudflare reporting. The token is read-only and scoped only to required account analytics resources.
- `OPENAI_ADMIN_API_KEY`: optional, organization-level reporting key used only for Usage/Costs requests; never reuse or replace `OPENAI_API_KEY`.

All values remain absent from the endpoint response, logs, fixtures, and frontend bundle. Real configuration is a post-implementation owner action; the feature launches with safe not-configured states until then.

## Risks and mitigations

| Risk | Impact | Mitigation | Evidence or trigger |
|---|---|---|---|
| Provider APIs are delayed, retain limited history, or change schemas | Misleading dashboard | Identify source/retrieval state; validate normalized payloads; mark only affected cards unavailable. | Adapter contract tests and manual configured-provider check. |
| Reporting credentials are over-scoped or leaked | Account/security exposure | Document least-privilege secret setup; never transmit/store raw values; assert safe response shape. | Type/build scans and secret-leak tests. |
| Existing import data cannot distinguish every AI attempt | Incomplete activity count | Count only persisted, observable outcomes and label metrics accurately; do not infer provider calls. | Repository aggregation tests using representative rows. |
| Upstream reporting slows the page | Poor owner experience | Fixed ranges, one bounded call per provider, timeout, partial response. | Timeout/failure tests and manual load check. |
| Cloudflare Access policy broadens later | Operational information becomes overexposed | Record policy dependency and re-evaluate before enabling broader access. | Production Access policy review before deployment. |

## Implementation phases

### Phase 1 — Safe reporting foundation and application activity

- [ ] **P1-T1 — Define dashboard domain contract and range/budget evaluation**
  - Covers: R-01, R-05, R-06, AC-01.1, AC-04.1, AC-04.2, AC-04.3
  - Depends on: None
  - Work: Add fixed range parsing, safe capability/result types, USD budget validation, and pure status evaluation with no provider dependency.
  - Verify: Unit tests cover valid/invalid ranges, absent/invalid budgets, threshold boundary, exceeded, and unknown cost.

- [ ] **P1-T2 — Aggregate Recipeapp activity read-only from D1**
  - Covers: R-02, AC-01.2, AC-01.3, AC-05.3, NFR-02
  - Depends on: P1-T1
  - Work: Add repository aggregate queries for recipes/import statuses/source types and persisted AI-attempt signals; map results to the safe activity DTO.
  - Verify: Local D1 integration tests prove period filtering, zero categories, source grouping, AI distinction, and no write statements.

- [ ] **P1-T3 — Deliver the admin usage endpoint with partial failure handling**
  - Covers: R-06, R-07, AC-05.2, AC-05.3, NFR-01, NFR-03, NFR-04
  - Depends on: P1-T1, P1-T2
  - Work: Add Worker route/handler; validate GET-only access and range; return safe summaries; wire stubbed optional-client availability states; bound external calls and safe error mapping.
  - Verify: Worker route tests cover method/range errors, response redaction, no-configured-provider result, timeout/error isolation, and unknown API routing.

### Phase 2 — Provider adapters and protected interface

- [ ] **P2-T1 — Implement Cloudflare analytics adapter**
  - Covers: R-03, AC-02.1, AC-02.2, AC-02.3, NFR-01, NFR-04
  - Depends on: P1-T3
  - Work: Add a timeout-bounded GraphQL client; normalize permitted Workers/D1/R2 metrics and configure optional read-only secret bindings without values.
  - Verify: Adapter unit tests validate request shape, metric units, malformed/partial payload behavior, timeout, credential absence, and redaction.

- [ ] **P2-T2 — Implement OpenAI organization usage/cost adapter**
  - Covers: R-04, AC-03.1, AC-03.2, AC-03.3, NFR-01, NFR-04
  - Depends on: P1-T3
  - Work: Add a timeout-bounded client for organization Usage and Costs, normalize date buckets/tokens/USD cost, and document the separate admin reporting secret.
  - Verify: Adapter tests prove cost takes precedence over any estimate, ordinary processing-key absence becomes not-configured, malformed payloads are safe, and no key reaches results/logs.

- [ ] **P2-T3 — Build the responsive Usage & Costs page**
  - Covers: R-01–R-07, AC-01.1–AC-05.2, NFR-05
  - Depends on: P1-T3
  - Work: Add typed browser service, route, owner navigation link, period controls, activity/resource/cost/budget cards, loading and safe partial-error states.
  - Verify: Component tests cover range change, zero state, each capability state, budget labels, semantic status text, and redacted display; Playwright covers 320/768/1440 layouts.

- [ ] **P2-T4 — Validate deployment readiness and owner configuration instructions**
  - Covers: AC-05.1–AC-05.3, NFR-01–NFR-04
  - Depends on: P2-T1, P2-T2, P2-T3
  - Work: Document least-privilege credential setup separately from committed configuration, regenerate Worker types, run full checks, and verify the deployed hostname remains Cloudflare Access-protected before/after rollout.
  - Verify: Config validation, typecheck, lint, build, relevant Worker/component/integration/E2E tests, secret-scan/redaction assertions, and a manual owner-only production check.

## Release and rollback considerations

- **Release:** Deploy first with optional reporting credentials absent; the dashboard must show Recipeapp activity and honest not-configured provider cards. Add Cloudflare/OpenAI reporting secrets only after the deployed redaction and Access checks pass. The budget variable may be added independently.
- **Rollback:** Remove the `/admin/usage` route/page in a follow-up deployment and delete reporting secrets if necessary. No migration, user data rewrite, or provider-side mutation is required.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Derived from approved specification | All |
| 0.2 | 2026-09-01 | Declare reporting-secret bindings and fixed Cloudflare resource identifiers in Worker configuration | Local runtime binds only configuration declared for the Worker; identifiers are not credentials and remain server-only | KD-02, P2-T4 |
| 0.3 | 2026-09-01 | Limit daily OpenAI usage queries to 31 buckets | The provider rejects larger daily-bucket limits; fixed dashboard ranges remain within the supported maximum. | KD-02, P2-T2 |
