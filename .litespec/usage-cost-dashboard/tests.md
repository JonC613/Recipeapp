---
feature: usage-cost-dashboard
artifact: tests
status: implementing
owner: user
version: 0.1
created: 2026-08-31
updated: 2026-08-31
spec_version: 0.1
plan_version: 0.1
---

# Test Plan: Usage and Cost Dashboard

## Strategy

Use pure unit tests for fixed range parsing, status/budget calculation, provider adapters, and response redaction. Use local D1 integration tests for read-only activity aggregation. Use Worker route tests for HTTP contract, partial availability, and no-secret output. Use component tests for dashboard rendering and accessible states, plus one mocked Playwright journey at the existing 320/768/1440 viewports. No automated test uses a real Cloudflare analytics token or OpenAI admin key.

This combination proves the security boundary close to the code, validates existing data semantics against local bindings, and demonstrates the owner-facing workflow without incurring provider cost.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01 | Automated | Planned |
| AC-01.2 | T-02 | Automated | Planned |
| AC-01.3 | T-03 | Automated | Planned |
| AC-02.1 | T-04 | Automated | Planned |
| AC-02.2 | T-05 | Automated | Planned |
| AC-02.3 | T-06 | Automated | Planned |
| AC-03.1 | T-07 | Automated | Planned |
| AC-03.2 | T-08 | Automated | Planned |
| AC-03.3 | T-09 | Automated | Planned |
| AC-04.1 | T-10 | Automated | Planned |
| AC-04.2 | T-11 | Automated | Planned |
| AC-04.3 | T-12 | Automated | Planned |
| AC-05.1 | T-13, M-01 | Automated + Manual | Planned |
| AC-05.2 | T-14 | Automated | Planned |
| AC-05.3 | T-15 | Automated | Planned |

## Critical user flows

### T-01 — Select a supported reporting period

- Covers: AC-01.1
- Level: component and Worker
- Setup: Render the dashboard with a typed safe response; construct GET requests for each accepted range.
- Action: Select 7 days, 30 days, and month-to-date; request each range through the route.
- Expected: The selected label and returned range agree. Each valid value returns a safe report; an unsupported value returns a safe client error.

### T-02 — Show application activity and zero categories

- Covers: AC-01.2
- Level: integration and component
- Setup: Local D1 fixture with recipes and imports across source types/statuses, including a range with no records.
- Action: Query the aggregate repository and render the returned summary.
- Expected: Counts are period-bounded and grouped by source/outcome; absent categories are displayed as zero; empty periods remain valid.

### T-03 — Distinguish persisted AI attempts

- Covers: AC-01.3
- Level: integration
- Setup: Local D1 fixture with text imports, a claimed/succeeded PDF OCR import, and a claimed/succeeded image extraction import.
- Action: Aggregate activity for an encompassing range.
- Expected: Text parsing, OCR, and image extraction counts are separate and are based only on persisted observables.

### T-04 — Normalize Cloudflare resource measurements

- Covers: AC-02.1
- Level: unit
- Setup: Cloudflare adapter with a mocked one-request GraphQL response containing Worker, D1, and R2 metrics.
- Action: Request a supported range.
- Expected: The normalized output has distinct Workers/D1/R2 cards with units, source, period, and retrieval time; no raw payload is returned.

### T-05 — Preserve D1 measurement semantics

- Covers: AC-02.2
- Level: unit and component
- Setup: Normalized D1 response containing read rows, written rows, and storage.
- Action: Render the D1 card.
- Expected: Each value is labeled with its own unit/meaning; raw query values are not presented as billable row values.

### T-06 — Isolate Cloudflare category failure

- Covers: AC-02.3
- Level: unit and Worker
- Setup: Mock Cloudflare response with one missing/malformed category and one provider rejection.
- Action: Request the report.
- Expected: Only affected cards show safe unavailable/not-configured states; no guessed money, token, account ID, or upstream error text appears.

### T-07 — Display connected OpenAI usage and cost

- Covers: AC-03.1
- Level: unit and component
- Setup: Mock usage and Costs responses from the OpenAI reporting adapter using a test-only admin-key placeholder.
- Action: Request and render a supported period.
- Expected: Request/token usage, USD cost, provider source, and retrieval time render for the selected period.

### T-08 — Prefer provider cost to estimates

- Covers: AC-03.2
- Level: unit
- Setup: Mock a provider cost amount along with token counts.
- Action: Normalize the report and evaluate budget status.
- Expected: Provider-reported cost is the financial value; no token-derived estimate is presented or combined with it.

### T-09 — Degrade OpenAI reporting safely

- Covers: AC-03.3
- Level: Worker and component
- Setup: Omit the reporting secret, then simulate timeout and malformed provider data.
- Action: Request and render the dashboard.
- Expected: The OpenAI card identifies not configured or unavailable with a safe hint while application activity continues to render.

### T-10 — Calculate known budget status

- Covers: AC-04.1
- Level: unit and component
- Setup: Valid USD budget plus cost fixtures below, at/above warning threshold, and above budget.
- Action: Evaluate and render budget status.
- Expected: Amount, budget, percentage, and on-track/warning/exceeded status are correct.

### T-11 — Handle budget configuration boundaries

- Covers: AC-04.2
- Level: unit
- Setup: Unset, malformed, zero, negative, and valid `USAGE_MONTHLY_BUDGET_USD` values.
- Action: Parse configuration and evaluate status.
- Expected: Unset yields budget-not-configured; invalid values are safely unavailable; the 80% boundary is applied consistently.

### T-12 — Never treat unknown cost as healthy

- Covers: AC-04.3
- Level: unit and component
- Setup: Valid budget with unavailable, non-USD, and missing-cost outcomes.
- Action: Render the budget card.
- Expected: The card is unavailable/unsupported and never shows on-track or $0 spend.

### T-13 — Navigate and render the protected owner page

- Covers: AC-05.1
- Level: end-to-end
- Setup: Existing authenticated deployed-smoke configuration or local mocked route; dashboard response is intercepted.
- Action: Use primary navigation to open `/admin/usage` at 320, 768, and 1440 CSS pixels.
- Expected: The page loads through the application hostname and has no public provider URL; cards remain usable at every viewport.

### T-14 — Enforce browser response redaction

- Covers: AC-05.2
- Level: Worker and unit
- Setup: Provider/client fixtures containing sentinel credential, account, raw payload, title, URL, filename, and R2-key strings.
- Action: Request the endpoint and serialize its JSON response.
- Expected: None of the sentinel strings appear; only approved aggregate fields and safe hints are returned.

### T-15 — Prove reporting performs no writes

- Covers: AC-05.3
- Level: integration and Worker
- Setup: Instrumented local D1 binding and mocked provider clients.
- Action: Call the usage endpoint for each valid range.
- Expected: Only read aggregate statements execute; no database write, R2 mutation, provider billing mutation, or account-management request occurs.

## Failure and recovery cases

The capability-state tests T-06, T-09, T-11, and T-12 are the required recovery evidence. They prove that missing credentials, provider failures, malformed data, cost ambiguity, and configuration errors preserve the usable application-owned view and give a safe next step.

## Manual exceptions

### M-01 — Verify production Cloudflare Access boundary

- Covers: AC-05.1, NFR-01
- Automation limitation: The deployed-smoke test proves navigation only when an existing authenticated session is available; it cannot reliably exercise the real Cloudflare Access login policy or inspect the owner policy configuration.
- Method: In a signed-out/private browser, visit `https://recipes.merkavaenterprises.com/admin/usage` and confirm Cloudflare Access prompts for authentication. Then sign in as the owner and confirm the dashboard loads. In Cloudflare Zero Trust, verify the deployed application still has the owner-only Allow policy.
- Expected evidence: Dated screenshots of the Access prompt and loaded dashboard, plus an owner policy review note; no credential value is captured.

## Test data and setup

- Reuse isolated local D1/R2 bindings; seed only synthetic recipes/imports and deterministic timestamps.
- Use provider-client doubles that assert request URL/method/headers without real network calls. Sentinel strings simulate secrets and prohibited response fields.
- Use a fixed clock for range and month-to-date tests. Fixture amounts use USD unless testing unsupported currency.
- Do not put `CLOUDFLARE_ANALYTICS_API_TOKEN`, `OPENAI_ADMIN_API_KEY`, or any live account ID in `.dev.vars`, committed fixtures, screenshots, test output, or browser intercept data.
- The deployed manual check occurs only after the existing Cloudflare Access owner policy is confirmed; local/e2e tests use the safe response contract rather than a real provider account.

## Completion criteria

- [ ] Every current-release acceptance criterion maps to passing automated evidence or the documented M-01 exception.
- [ ] Unit, Worker, local binding integration, component, and responsive end-to-end checks pass.
- [ ] Redaction/sentinel tests prove credentials, account IDs, raw provider data, recipe content, filenames, and R2 keys never reach the browser response.
- [ ] All unavailable/not-configured/timeout/malformed-data states are verified to preserve the application activity view.
- [ ] Manual M-01 evidence confirms the production owner-only Cloudflare Access boundary after deployment.
- [ ] No unresolved failure blocks an approved story or non-functional requirement.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-08-31 | Initial draft | Derived from approved specification and plan | All |
