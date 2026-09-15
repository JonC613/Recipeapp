---
feature: cooking-history-feedback
artifact: tests
status: done
owner: user
version: 0.1
created: 2026-09-11
updated: 2026-09-11
spec_version: 0.1
plan_version: 0.1
---

# Test Plan: Cooking History and Feedback

## Strategy

Use Worker and local-D1 integration tests for validation, scoped persistence, ordering, aggregates, and cascade behavior. Component tests cover the detail form/history and summary rendering; Playwright extends the saved-recipe journey. These layers exercise every current acceptance condition without Cloudflare, AI, R2, or third-party calls.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01 | Automated | Passed |
| AC-01.2 | T-02 | Automated | Passed |
| AC-01.3 | T-03 | Automated | Passed |
| AC-02.1 | T-04 | Automated | Passed |
| AC-02.2 | T-05 | Automated | Passed |
| AC-03.1 | T-06 | Automated | Passed |
| AC-03.2 | T-07 | Automated | Passed |

## Critical user flows

### T-01 — Record an optional rating and note

- Covers: AC-01.1
- Level: worker
- Setup: One saved recipe in local D1.
- Action: POST empty, rated-only, note-only, and rated-note cook logs.
- Expected: Each valid request creates one timestamped entry and returns a refreshed recipe projection.

### T-02 — Deliberate logging only

- Covers: AC-01.2
- Level: component
- Setup: Detail response with no logs and mocked create response.
- Action: Render, open Cooking Mode separately, then submit the detail form.
- Expected: Reads/create nothing before submit; after success the entry is rendered with date/time and supplied optional fields.

### T-03 — Reject invalid cook-log requests safely

- Covers: AC-01.3
- Level: worker
- Setup: Existing recipe and baseline log count.
- Action: Send invalid ratings, blank/oversized notes, malformed JSON, and unknown recipe ID.
- Expected: Safe 400/404 errors and unchanged persisted count; component preserves submitted values on failure.

### T-04 — Read ordered private history

- Covers: AC-02.1
- Level: integration
- Setup: A recipe with timestamp-distinct logs containing every optional-field combination.
- Action: Read recipe detail.
- Expected: All entries are newest first; date/time is present and rating/note only when non-null.

### T-05 — Delete one mistake and recompute signals

- Covers: AC-02.2
- Level: integration
- Setup: A recipe with multiple logs plus a second recipe's log.
- Action: Delete one in-scope entry, attempt a cross-recipe/unknown delete, then delete final entry and recipe.
- Expected: Only target is removed, safe not-found protects other data, aggregates refresh, empty state returns, and deletion cascades logs.

### T-06 — Render truthful library summary signals

- Covers: AC-03.1
- Level: component
- Setup: Summary fixtures with no history, cooks without ratings, and multiple ratings.
- Action: Render cards.
- Expected: Cards show count/latest date where present, average only for rated data, and never imply zero rating.

### T-07 — Label Meal Plan selections without changing assignment

- Covers: AC-03.2
- Level: component
- Setup: Saved-recipe results with aggregates and a mocked plan mutation.
- Action: Inspect/select option.
- Expected: Option includes compact signal and assignment request is unchanged.

## Failure and recovery cases

### T-08 — Keep controls usable after mutation failure

- Covers: NFR-03
- Level: end-to-end
- Setup: Intercept a cook-log POST with a safe error at 320, 768, and 1440 CSS pixels.
- Action: Enter a rating/note and submit, then retry.
- Expected: Error is announced, values remain, controls stay usable, and no horizontal overflow appears.

### T-09 — Preserve list privacy and API compatibility

- Covers: NFR-01, NFR-04
- Level: worker
- Setup: A recipe with a private note and existing recipe/list callers.
- Action: Request list and detail before/after a log.
- Expected: List has aggregates but no logs/note; detail has history; existing fields/routes still succeed.

## Manual exceptions

None.

## Test data and setup

- Extend local test migration with additive cook-log table.
- Use deterministic seeded timestamps in repository tests where ordering matters; Worker tests assert ISO timestamp shape.
- Browser/component tests mock only same-origin recipe endpoints.

## Completion criteria

- [x] T-01 through T-07 pass and cover every acceptance criterion.
- [x] T-08 and T-09 pass for recovery, privacy, and compatibility.
- [x] Additive migration applies to fresh/local D1 and recipe-delete cascade is proven.
- [x] Relevant Worker, integration, component, E2E, typecheck, lint, build, LiteSpec, and memory checks pass.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-11 | Initial test plan | User-authorized feature | All |
