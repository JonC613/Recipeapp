---
feature: recipe-graphics
artifact: plan
status: implementing
owner: user
version: 0.2
created: 2026-09-09
updated: 2026-09-09
spec_version: 0.2
---

# Implementation Plan: Recipe Graphics

## Technical approach

Add nullable graphic metadata through migration `0012`. An owner-triggered Worker endpoint reads a saved recipe, calls the low-cost OpenAI Image API once, stores the returned PNG in private R2, then records its key. The detail page renders only the authenticated same-origin image route.

## Key decisions

### KD-01 — One stored low-cost image

- **Choice:** `gpt-image-1-mini`, low quality, 1024×1024; no regeneration endpoint.
- **Rationale:** This makes cost roughly $0.005 per requested recipe and avoids recurring/browse-time calls.
- **Alternatives considered:** Higher-quality models, browser generation, public R2 URLs, and automatic backfill.
- **Consequences:** Art is intentionally lighthearted and may be imperfect; changing it later requires an explicit product choice.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `migrations/0012_recipe_graphics.sql`, recipe repository | Persist private image key and availability projection. | R-03 |
| Worker image service and route | Generate, validate, store, and safely serve one PNG. | R-02–R-04 |
| Recipe detail service/page | Show generate state, stored art, and disclosure. | R-01 |
| Recipe list repository, card, and styles | Project graphic availability and render a private thumbnail or decorative placeholder. | R-05 |

## Risks and mitigations

| Risk | Impact | Mitigation | Evidence |
|---|---|---|---|
| Provider unavailable or malformed output | No graphic | Safe error; write R2/D1 only after valid bytes | Provider double |
| Unexpected spend | Cost | Manual action, single saved result, visible estimate | Route/UI review |
| Private key exposure | Data leak | Same-origin Worker image route; browser gets no R2 key | Contract test |

## Implementation phases

### Phase 1 — Persist and generate one private graphic

- [x] **P1-T1 — Add graphic persistence and projection**
  - Covers: R-03, AC-01.2.
  - Depends on: None
  - Work: Add nullable D1 columns and safe `graphicAvailable` DTO field.
  - Verify: Typecheck and local migration fixture.

- [x] **P1-T2 — Add bounded Worker image generation**
  - Covers: R-02–R-04, AC-01.3, AC-02.2.
  - Depends on: P1-T1.
  - Work: Call Image API once, reject bad output, persist private PNG, serve it through Worker.
  - Verify: No-network provider contract test.

### Phase 2 — Present and release safely

- [x] **P2-T1 — Add recipe-detail affordance**
  - Covers: R-01, AC-01.1–AC-01.2, AC-02.1.
  - Depends on: P1-T2.
  - Work: Cost-disclosed action, busy state, image, and disclosure.
  - Verify: Typecheck and production build.

- [ ] **P2-T2 — Apply migration and deploy**
  - Covers: NFR-01–NFR-03.
  - Depends on: P2-T1.
  - Work: Apply remote migration, deploy, then perform an owner-authorized one-image smoke.
  - Verify: Remote migration status and owner smoke.

- [x] **P2-T3 — Add Library thumbnails for stored art**
  - Covers: R-05, AC-03.1–AC-03.2.
  - Depends on: P1-T1, P1-T2.
  - Work: Extend the safe recipe-summary projection with availability and render a lazy same-origin thumbnail or decorative placeholder in cards.
  - Verify: Component test, Worker recipe-list test, and authenticated production Library check.

## Release and rollback considerations

- **Release:** Apply `0012_recipe_graphics.sql` before deploying the Worker that reads graphic columns.
- **Rollback:** Revert Worker first if needed; leave nullable graphic data and R2 objects intact.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-09 | Initial implementation record | Feature was already authorized and implemented | All |
| 0.2 | 2026-09-09 | Added Library-thumbnail implementation task | In-scope visual browsing extension | P2-T3, R-05 |
