---
feature: recipe-graphics
artifact: tests
status: implementing
owner: user
version: 0.1
created: 2026-09-09
updated: 2026-09-09
spec_version: 0.1
plan_version: 0.1
---

# Test Plan: Recipe Graphics

## Strategy

Use Worker doubles for the paid provider contract and local D1/R2 integration for persistence/serving. Use a component test for the detail-page action and disclosure. No automated check sends an image request to OpenAI.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01 | Component | Planned |
| AC-01.2 | T-02 | Worker integration | Planned |
| AC-01.3 | T-03 | Worker integration | Planned |
| AC-02.1 | T-02 | Worker integration | Planned |
| AC-02.2 | T-04 | Worker unit | Passed |

## Critical user flows

### T-01 — Explicit menu-art action

- Covers: AC-01.1.
- Level: component.
- Setup: Recipe without a graphic.
- Action: Render the detail page.
- Expected: A cost-disclosed generate action is visible and no image request occurs until activation.

### T-02 — Store and display a graphic privately

- Covers: AC-01.2, AC-02.1.
- Level: Worker integration.
- Setup: Recipe, fake provider PNG, and local R2.
- Action: Generate then fetch the same-origin graphic route.
- Expected: The recipe exposes availability, the route returns PNG bytes, and the browser DTO has no R2/provider detail.

## Failure and recovery cases

### T-03 — Do not charge twice

- Covers: AC-01.3.
- Level: Worker integration.
- Setup: Recipe with a saved graphic.
- Action: Post graphic generation again.
- Expected: Conflict response and zero provider calls.

### T-04 — Bound low-cost provider call

- Covers: AC-02.2.
- Level: Worker unit.
- Setup: Provider double with a base64 PNG response.
- Action: Generate from a recipe.
- Expected: Exactly one `gpt-image-1-mini`, low-quality, 1024×1024 call uses bounded recipe content.

## External-input coverage

- Reject missing/oversized/invalid base64 provider output without an R2 or D1 write.
- Provider transport and HTTP failures map to safe retryable application errors.

## Manual exceptions

### M-01 — Owner visual and production check

- Covers: NFR-01–NFR-03.
- Automation limitation: Protected deployment and subjective “recognizable but ridiculous” visual quality need owner review.
- Method: Generate one graphic for a non-sensitive saved recipe after deployment.
- Expected evidence: Cost disclosure, private rendered PNG, no unexpected second generation, and a usable playful result.

## Test data and setup

- Use a fixture recipe with title, description, and ingredients; provider doubles return harmless base64 bytes.
- Tests use local bindings and never a real API key or R2 production object.

## Completion criteria

- [ ] T-01–T-03 pass.
- [x] T-04 passes with no external OpenAI call.
- [ ] Remote migration, deployment, and M-01 owner smoke complete.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | Initial implementation record | Feature was already authorized and implemented | All |
