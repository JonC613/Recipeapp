---
feature: usage-cost-dashboard
artifact: spec
status: implementing
owner: user
version: 0.1
created: 2026-08-31
updated: 2026-08-31
---

# Specification: Usage and Cost Dashboard

## Summary

Provide the Recipeapp owner with a private, read-only dashboard that explains application activity, Cloudflare resource usage, OpenAI usage and cost when explicitly configured, and progress toward a monthly budget. The dashboard is operational insight, not a billing system.

## Problem

Cloudflare shows broad account statistics, while Recipeapp has no single view of its own imports, AI workload, storage, or spend. The owner cannot easily tell which feature drives usage, whether a provider connection is unavailable, or how close the app is to a self-selected spending limit.

## Desired outcome

The owner can open one protected page and understand the selected period's application activity, provider measurements, cost status, and data freshness without exposing secrets or provider-account data. Missing provider access is explicit and recoverable, never silently represented as zero usage or zero cost.

## Boundaries

### Goals

- Deliver an owner-only dashboard and matching Worker endpoint for a 7-, 30-, or month-to-date period.
- Show Recipeapp-derived activity even when external provider integrations are not configured.
- Add optional, server-only integrations for Cloudflare analytics and OpenAI organization usage/cost reporting.
- Show a manually configured monthly budget and a clear status; this is a warning aid, not an enforcement mechanism.

### Non-goals

- Automatic billing changes, payment controls, provider-account administration, and purchases.
- Browser exposure of OpenAI or Cloudflare credentials, account IDs, raw provider payloads, or unbounded provider data.
- Per-user billing, chargeback, multi-user roles, or email/SMS alerts.
- A promise that the view equals an invoice, particularly for Cloudflare products whose complete cost information is not available through this feature's data sources.

### Constraints

- The production hostname is protected by an owner-only Cloudflare Access policy; the endpoint and page remain inside that protected application surface.
- Existing D1, R2, and OpenAI secrets remain Worker-only. New optional provider credentials are Worker secrets and omitted from local/production responses.
- Provider results may be delayed, partial, or unavailable. Every external metric identifies a source and freshness/availability state.
- The feature is read-only and must not alter recipes, import history, provider billing, or deployment configuration during normal viewing.

## Requirements

### Current release

- **R-01:** The owner can open a Usage & Costs page and select 7 days, 30 days, or the current calendar month.
- **R-02:** The page displays Recipeapp activity: saved recipe count; imports started, completed, and failed by source type; and AI-attempt counts by text, OCR, and image extraction when persisted data supports the distinction.
- **R-03:** The page separately displays Worker, D1, and R2 measurements when the optional Cloudflare analytics connection is configured and returns data.
- **R-04:** The page displays OpenAI request/token usage and actual daily/month-to-date cost when the optional OpenAI organization reporting connection is configured and returns data.
- **R-05:** The owner can set a monthly USD budget in server-side configuration; the page shows known current-month cost against it as on-track, warning, exceeded, or unavailable.
- **R-06:** The Worker exposes one bounded admin usage response for the selected period. It returns summaries and capability states, never credentials, account identifiers, raw query results, or recipe content.
- **R-07:** If a provider integration is not configured, rejected, times out, or returns no usable data, the relevant card displays an honest unavailable/not-configured state and a short recovery hint; the rest of the dashboard works.

### Deferred

- **D-01:** Scheduled alerts by email, SMS, or webhook await a notification-preferences design.
- **D-02:** Provider-specific billing reconciliation, invoices, taxes, credits, and forecasts are deferred; the dashboard will not claim invoice accuracy.
- **D-03:** Historical snapshots and trend charts beyond upstream retention windows are deferred because they require separate retention, cost, and privacy decisions.
- **D-04:** In-app identity/role authorization is deferred. The MVP relies on the existing owner-only Cloudflare Access policy.

## User stories

### US-01 — Inspect Recipeapp activity

**Story:** As the Recipeapp owner, I want to see activity for a selected period, so that I can understand how the application is being used.

**Rationale:** Application-owned information is useful immediately and gives context to provider-reported usage.

**Acceptance criteria:**

- **AC-01.1:** The page offers 7-day, 30-day, and month-to-date choices and visibly identifies the selected range.
- **AC-01.2:** For the selected range, the activity summary includes recipe total plus import outcomes by source type; missing categories render as zero rather than disappearing.
- **AC-01.3:** AI-attempt counts distinguish text parsing, PDF OCR, and image extraction where persisted import data supports that distinction.

**Edge cases:**

- A period with no imports still shows a valid zero-activity summary.
- An invalid range supplied to the endpoint returns a safe client error rather than a provider request.

### US-02 — Understand Cloudflare resource use

**Story:** As the Recipeapp owner, I want Cloudflare use shown by resource, so that I can distinguish database, storage, and Worker activity before it becomes an unexpected charge.

**Rationale:** The existing Cloudflare dashboard is account-wide; resource-specific, app-oriented context is easier to act on.

**Acceptance criteria:**

- **AC-02.1:** When configured Cloudflare analytics return usable measurements, the page separately identifies Worker, D1, and R2 values, units, source, and observed period.
- **AC-02.2:** D1 values clearly distinguish rows read, rows written, and storage; the UI does not label raw query counts as billable row counts.
- **AC-02.3:** When a requested Cloudflare category cannot be retrieved, only that category is marked unavailable and the response does not substitute a guessed monetary cost.

**Edge cases:**

- Upstream retention or aggregation limits are disclosed as data freshness/availability, not interpreted as no usage.
- A Cloudflare credential failure never exposes the token, account identifier, provider response, or internal error text.

### US-03 — See OpenAI usage and actual cost when connected

**Story:** As the Recipeapp owner, I want to see OpenAI use and spend for the selected period, so that I can understand the cost of AI recipe extraction.

**Rationale:** OCR and image extraction have an explicit paid-service boundary and should have an accurate owner-visible cost signal.

**Acceptance criteria:**

- **AC-03.1:** With a valid optional OpenAI organization reporting credential, the dashboard shows request/token usage and USD cost for the selected period, marked with the provider and retrieval time.
- **AC-03.2:** Cost values use OpenAI's cost data when available; token-derived estimates, if ever added, are visibly labeled estimates and not combined with actual cost.
- **AC-03.3:** Without the credential or when OpenAI reporting is unavailable, the OpenAI card explains that exact cost reporting is not connected while Recipeapp activity remains available.

**Edge cases:**

- Provider usage and cost may differ slightly; the dashboard treats the cost figure as the financial reference and does not assert they reconcile exactly.
- An ordinary project API key must not be treated as an organization reporting credential.

### US-04 — Use a budget as an early warning

**Story:** As the Recipeapp owner, I want a monthly budget status, so that I can decide when to reduce use or inspect costs.

**Rationale:** A visible threshold helps prevent surprises without granting the app authority over billing.

**Acceptance criteria:**

- **AC-04.1:** When a valid monthly USD budget and known current-month cost exist, the page shows the amount spent, budget, percentage, and one of on-track, warning, or exceeded.
- **AC-04.2:** The warning threshold is explicitly documented and consistently applied; a missing budget yields a neutral “budget not configured” state.
- **AC-04.3:** Unknown or unavailable cost never produces an on-track or zero-spend status.

**Edge cases:**

- Costs in a non-USD currency are marked unsupported rather than converted silently.
- This indicator does not block imports, AI calls, deployments, or external billing.

### US-05 — Keep reporting private and safe

**Story:** As the Recipeapp owner, I want the reporting surface to disclose only safe summaries, so that operational visibility does not create a credential or privacy leak.

**Rationale:** Provider-account information and import content do not belong in a browser-facing reporting contract.

**Acceptance criteria:**

- **AC-05.1:** The page and endpoint are available only through the existing Cloudflare Access-protected hostname in production.
- **AC-05.2:** The browser response contains no secrets, provider tokens, provider account IDs, raw upstream payloads, recipe text, image/PDF data, or private R2 keys.
- **AC-05.3:** The endpoint performs no database writes and no provider billing/account mutation while reporting.

**Edge cases:**

- Local development is testable with injected or unavailable provider clients and does not require real billing credentials.
- A malformed upstream result yields an unavailable card, not an application crash.

## Non-functional requirements

- **NFR-01 — Security:** Reporting credentials are Worker secrets; the client bundle, API body, logs, tests, and error messages contain no credential value.
- **NFR-02 — Privacy:** The bounded response contains aggregate counts and measurements only. It includes no recipe title, source URL, raw input, source filename, or imported media metadata.
- **NFR-03 — Reliability:** A failed external provider query leaves a usable 200 dashboard response with safe per-card availability states; failure of the application-owned D1 summary may fail the overall endpoint.
- **NFR-04 — Performance:** A report request uses a bounded selected period, makes at most one request per configured provider integration, and has explicit timeouts.
- **NFR-05 — Accessibility:** Range controls, cards, loading state, and unavailable explanations are keyboard usable and announced with semantic headings/status text.

## Codebase context

Recipeapp is a single React/Vite application with a Worker-first `/api` surface. `worker/index.ts` dispatches narrow route handlers; typed frontend services use same-origin API calls. D1 (`DB`) holds recipes and retained imports, while private R2 (`RECIPE_SOURCES`) holds source files. The production hostname is protected by a Cloudflare Access owner-only policy, and `wrangler.jsonc` keeps OpenAI credentials Worker-only. The repository uses unit/component Worker tests, local D1/R2 integration tests, and Playwright responsive journeys. No current route, UI, or binding reports provider usage/cost.

Cloudflare documents D1 rows read/written and storage analytics through its GraphQL Analytics API, with metrics subject to upstream retention. OpenAI documents organization Usage and Costs endpoints; the Costs endpoint is the financial reference and uses an OpenAI admin key. [Cloudflare D1 analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/) · [OpenAI Usage and Costs API](https://platform.openai.com/docs/api-reference/usage/audio_transcriptions_object)

## Assumptions and open questions

### Assumptions

- **A-01:** The existing Cloudflare Access policy remains owner-only in production. If it changes, the feature needs separate application-level authorization before exposing provider summaries.
- **A-02:** Cloudflare analytics access can be granted with a read-only, narrowly scoped API token and account identifier stored as Worker secrets. If a resource lacks a suitable API, its card remains unavailable rather than scraping the dashboard.
- **A-03:** The owner may choose to create an OpenAI admin reporting key. Until then, exact OpenAI cost is intentionally unavailable; the normal `OPENAI_API_KEY` remains limited to recipe processing.
- **A-04:** A single USD monthly budget and an 80% warning threshold are sufficient for this personal MVP. Multiple currencies or budgets require an amendment.

### Open questions

- None. Provider integrations are optional by design and have explicit unavailable states; no additional credential is required to approve this scope.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Approved LiteSpec discovery | All |
