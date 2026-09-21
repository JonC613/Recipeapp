---
feature: beta-recipe-discovery
artifact: plan
status: done
owner: user
version: 1.1
created: 2026-09-21
updated: 2026-09-21
spec_version: 1.1
---

# Implementation Plan: Beta Recipe Discovery

## Technical approach

Add a D1 `recipe_discovery_sites` table and Worker-owned discovery boundary. Validation normalizes an HTTPS origin, retrieves robots rules, probes WordPress REST search, rejects cross-origin results, and proves one result parses through the existing Recipe JSON-LD extractor. It upserts a pending technical profile; a separate mutation promotes only compatible profiles to approved.

The Beta page searches approved sites concurrently, previews one approved URL deterministically, and invokes the existing URL-import service for review. Provider-specific payloads never cross the Worker boundary.

## Key decisions

### KD-01 — Persist capability profiles

- **Choice:** Detect and persist one supported search adapter during validation.
- **Rationale:** Ordinary search stays fast and does not repeatedly fetch robots or sample pages.
- **Alternatives considered:** Crawl sitemaps per search; hard-code sites; use a general search API.
- **Consequences:** New site architectures require future adapters.

### KD-02 — Pending validation plus explicit approval

- **Choice:** Persist validation as pending, then approve by server-owned record ID.
- **Rationale:** The browser cannot forge the report and approval need not repeat slow probes.
- **Alternatives considered:** Trust the browser; auto-approve; rerun validation on approval.
- **Consequences:** Pending records remain as useful diagnostics.

### KD-03 — Existing URL import is the persistence bridge

- **Choice:** Previews remain transient; selected URLs use `POST /api/import/url`.
- **Rationale:** Existing validation, provenance, review, and approval behavior remain authoritative.
- **Alternatives considered:** Add a discovery import source type.
- **Consequences:** No recipe/import schema change is needed.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `migrations/`, test schema | Persist and seed discovery sites | R-03, R-07 |
| Worker repository/services/routes | Validate, approve, search, and preview | US-01, US-02 |
| React domain/services/page/components | Typed Beta UI and import navigation | US-01, US-02 |
| Tests and Project Memory | Acceptance evidence and durable state | All |

## Technical detail

### Data model and API

`pending -> approved`; revalidation updates the report without duplicating the canonical HTTPS origin. Search reads `status='approved' AND enabled=1`. APIs: `GET /api/beta/discovery/sites`, `POST /api/beta/discovery/sites/validate`, `POST /api/beta/discovery/sites/:id/approve`, `GET /api/beta/discovery/search?q=`, and `GET /api/beta/discovery/preview?url=`.

## Risks and mitigations

| Risk | Impact | Mitigation | Evidence or trigger |
|---|---|---|---|
| SSRF or unsafe redirect | Internal access | Reuse public URL validation and require HTTPS | Worker hostile URL tests |
| Cross-origin result | Open proxy | Require exact origin for search and preview | Worker route tests |
| Slow site | Search hangs | Size/time limits, concurrent fan-out, partial results | Failure tests |
| Live-site drift | Brittle CI | Controlled fixtures only | Offline suites |

## External-input implementation notes

- **Boundary controls:** Public HTTPS; no credentials; validated redirects; bounded text/JSON; same-origin endpoints/results; safe errors.
- **Persistence lifecycle:** D1 retains small profiles/reports. Recipe content is stored only by explicit existing import.
- **Operational safeguards:** Beta routes can be hidden/disabled without affecting recipes.

## Implementation phases

### Phase 1 — Safe profiles and discovery API

- [x] **P1-T1 — Add persistent discovery-site profiles**
  - Covers: R-03, R-07, AC-02.2, AC-02.4
  - Depends on: None
  - Work: Add migration, repository, test schema, and approved initial site.
  - Verify: D1 tests cover seed, pending upsert, approval, and idempotency.

- [x] **P1-T2 — Add bounded validator and WordPress adapter**
  - Covers: R-02, R-04, AC-02.1, AC-02.3, NFR-01, NFR-02
  - Depends on: P1-T1
  - Work: Implement robots, bounded JSON, same-origin normalization, sample extraction, and routes.
  - Verify: Worker tests cover compatible and hostile fixtures.

- [x] **P1-T3 — Add approved preview and import bridge**
  - Covers: R-05, R-06, AC-01.2, AC-01.3
  - Depends on: P1-T2
  - Work: Verify approved origin, extract a transient draft, and invoke existing URL import from UI.
  - Verify: Worker and component tests prove preview is transient and import navigates to review.

### Phase 2 — Owner-facing Beta experience

- [x] **P2-T1 — Build accessible Beta page**
  - Covers: R-01, AC-01.1, AC-02.1, AC-02.2, NFR-03
  - Depends on: P1-T2
  - Work: Add navigation, route, search/results/preview, report, approval, and site status.
  - Verify: Component tests exercise search/import and site approval.

- [x] **P2-T2 — Complete regression and documentation**
  - Covers: All current-release IDs
  - Depends on: P1-T3, P2-T1
  - Work: Run checks, update README and Project Memory, and mark artifacts done.
  - Verify: Affected checks pass and LiteSpec validates.

### Phase 3 — Compatibility sampling recovery

- [x] **P3-T1 — Sample bounded search results for usable Recipe JSON-LD**
  - Covers: AC-02.1, AC-02.3, NFR-01, NFR-02
  - Depends on: P1-T2
  - Work: Inspect at most the first three same-origin search results and accept the site when any result produces one usable recipe draft.
  - Verify: Worker coverage proves a non-recipe first result followed by a valid recipe passes; all unusable samples still fail safely.

## Release and rollback considerations

- **Release:** Apply D1 migration before Worker/assets. The seed does not alter recipe data.
- **Rollback:** Hide Beta routes or disable sites; recipes/imports remain unaffected.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 1.0 | 2026-09-21 | Approved implementation plan | Derived from approved specification | All |
| 1.1 | 2026-09-21 | Added bounded multi-result compatibility sampling | Production validation exposed a first-result false negative | P3-T1 |
