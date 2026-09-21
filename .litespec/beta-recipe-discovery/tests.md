---
feature: beta-recipe-discovery
artifact: tests
status: done
owner: user
version: 1.1
created: 2026-09-21
updated: 2026-09-21
spec_version: 1.1
plan_version: 1.1
---

# Test Plan: Beta Recipe Discovery

## Strategy

Use deterministic Worker tests for remote boundaries, D1 integration tests for profile transitions, and browser component tests for owner interactions. Fetch doubles replace third-party calls; no acceptance test depends on a live website.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01, T-04 | Automated | Passing |
| AC-01.2 | T-02, T-04 | Automated | Passing |
| AC-01.3 | T-03, T-04 | Automated | Passing |
| AC-02.1 | T-05, T-08, T-09 | Automated | Passing |
| AC-02.2 | T-06, T-08 | Automated | Passing |
| AC-02.3 | T-07 | Automated | Passing |
| AC-02.4 | T-06 | Automated | Passing |

## Critical user flows

### T-01 — Search approved sites without persistence

- Covers: AC-01.1
- Level: Worker integration
- Setup: Approved site and controlled WordPress response.
- Action: Submit a query.
- Expected: Same-origin results return; import and recipe counts do not change.

### T-02 — Preview an approved result

- Covers: AC-01.2
- Level: Worker integration
- Setup: Approved origin and Recipe JSON-LD fixture.
- Action: Request preview.
- Expected: A transient draft returns; no import is created.

### T-03 — Existing URL import bridge

- Covers: AC-01.3
- Level: Component
- Setup: Discovery preview and mocked import service.
- Action: Click Import for review.
- Expected: Existing service receives the URL and review navigation occurs.

### T-04 — Beta search UI

- Covers: AC-01.1, AC-01.2, AC-01.3
- Level: Component
- Setup: Discovery service doubles.
- Action: Search, preview, and import.
- Expected: Results/preview render; import happens only after explicit action.

### T-05 — Compatible candidate report

- Covers: AC-02.1
- Level: Worker
- Setup: Robots, WordPress, and Recipe JSON-LD fixtures.
- Action: Validate a public HTTPS origin.
- Expected: Pending compatible profile and criteria return.

### T-06 — Explicit approval transition

- Covers: AC-02.2, AC-02.4
- Level: D1 integration
- Setup: Compatible pending profile and empty recipe/import tables.
- Action: Approve twice.
- Expected: One approved site exists; no recipe/import is created.

### T-08 — Site management UI

- Covers: AC-02.1, AC-02.2
- Level: Component
- Setup: Compatible validation response.
- Action: Validate then click Add to approved sites.
- Expected: Criteria precede approval; approved status appears afterward.

### T-09 — Bounded later-result recipe validation

- Covers: AC-02.1, AC-02.3
- Level: Worker and production smoke
- Setup: The first WordPress result is a non-recipe roundup and a later result contains one usable Recipe JSON-LD object.
- Action: Validate the site.
- Expected: Validation inspects no more than three results, reports a usable recipe, and returns a compatible pending candidate; all unusable samples remain incompatible.

## Failure and recovery cases

### T-07 — Unsafe or incompatible candidates

- Covers: AC-02.3
- Level: Worker
- Setup: Private/non-HTTPS, robots disallow, cross-origin, malformed/oversized, no-recipe, and rejection fixtures.
- Action: Validate or preview.
- Expected: Safe errors or incompatible report; no approval and no raw details.

## External-input coverage

- Valid robots-to-search-to-sample fixture and existing source-to-review bridge.
- Private/non-HTTPS, malformed, oversized, unsupported, cross-origin, disallowed, and unavailable fixtures.
- Redirects are revalidated; preview requires an approved exact origin.
- Only site profiles persist during validation/approval; recipe/import counts remain unchanged.

## Manual exceptions

None.

## Test data and setup

- Synthetic WordPress and Recipe JSON-LD responses.
- Isolated Cloudflare D1 with consolidated test schema.
- Component service mocks; no live site or credentials.

## Completion criteria

- [x] Every current-release acceptance criterion maps to passing evidence.
- [x] Critical user flows pass.
- [x] Relevant failure and recovery cases pass.
- [x] No unresolved failure blocks an approved story or non-functional requirement.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 1.0 | 2026-09-21 | Approved test plan | Derived from specification and plan | All |
| 1.1 | 2026-09-21 | Added bounded later-result sampling regression | Production validation exposed a first-result false negative | T-09, AC-02.1 |
