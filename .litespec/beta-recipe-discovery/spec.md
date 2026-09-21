---
feature: beta-recipe-discovery
artifact: spec
status: done
owner: user
version: 1.1
created: 2026-09-21
updated: 2026-09-21
---

# Specification: Beta Recipe Discovery

## Summary

Add an owner-only Beta area that searches technically compatible, explicitly approved recipe sites and sends a selected recipe through the existing URL import review flow. The same area lets the owner inspect a candidate site, review a technical compatibility report, and deliberately approve it.

## Problem

Recipeapp can import a known recipe URL but cannot discover recipes across selected websites. Adding a site currently requires code changes, while arbitrary crawling would be slow, fragile, and unsafe.

## Desired outcome

The owner can search all enabled approved sites quickly, preview a result, and create an unsaved URL-import draft for review. A candidate domain becomes searchable only after it passes bounded server-side checks and the owner clicks the final approval action.

## Boundaries

### Goals

- Provide a clearly marked Beta navigation destination.
- Persist approved discovery sites and their detected search adapter.
- Validate and approve compatible WordPress recipe sites without site-specific UI.
- Reuse existing URL import, provenance, review, and save behavior.

### Non-goals

- General web search, arbitrary crawling, automatic legal judgments, AI extraction, and automatic recipe saving.
- Non-WordPress adapters, scheduled indexing, or public multi-user administration.

### Constraints

- The deployed application remains owner-protected by Cloudflare Access.
- Technical compatibility does not constitute legal permission; approval remains an explicit owner decision.

## Requirements

### Current release

- **R-01:** A Beta tab MUST expose approved-site search and site compatibility management without branding a provider as a dedicated integration.
- **R-02:** Candidate validation MUST be server-side, bounded, same-origin, HTTPS-only, and protected by existing public-address and redirect rules.
- **R-03:** A compatible candidate MUST remain pending until the owner explicitly approves it; failed candidates MUST NOT become searchable.
- **R-04:** Search MUST query only enabled approved sites through a stored supported adapter and return bounded normalized results without creating imports.
- **R-05:** Preview MUST verify the result belongs to an approved site and extract one usable Recipe JSON-LD draft without persistence.
- **R-06:** Import MUST use the existing URL import endpoint and review/save flow, preserving the final recipe URL as provenance.
- **R-07:** The currently selected compatible site MUST ship as an approved generic discovery site.

### Deferred

- **D-01:** Sitemap-only, custom HTML, and non-WordPress search adapters.
- **D-02:** Disable/delete controls, background revalidation, health history, and ranking controls.
- **D-03:** Automated interpretation of site terms or content licenses.

## User stories

### US-01 — Search approved recipe sites

**Story:** As the owner, I want one search across approved recipe sites, so that I can discover recipes without visiting each site separately.

**Rationale:** Discovery should add value without weakening the deliberate import-review boundary.

**Acceptance criteria:**

- **AC-01.1:** Given an enabled approved site, when the owner submits a non-empty query, then bounded same-origin results appear and no import or recipe is created.
- **AC-01.2:** Given a result, when the owner previews it, then one normalized recipe draft and its source URL appear without persistence.
- **AC-01.3:** Given a preview, when the owner chooses Import for review, then a URL-import draft is created and the existing review page opens; no recipe is saved until review is submitted.

**Edge cases:**

- Empty queries are rejected locally; upstream failures yield safe partial or empty results.
- Result URLs outside their approved origin are discarded.

### US-02 — Validate and approve a site

**Story:** As the owner, I want to test a candidate domain and explicitly approve it, so that discovery can grow without deploying site-specific code.

**Rationale:** Separating compatibility checks from approval makes the trust decision visible and keeps routine search fast.

**Acceptance criteria:**

- **AC-02.1:** Given a public HTTPS site with compatible robots rules, WordPress REST search, same-origin results, and a usable Recipe JSON-LD page among the first three bounded results, when validation finishes, then a criterion report and pending candidate appear.
- **AC-02.2:** Given a compatible pending candidate, when the owner clicks Add to approved sites, then it becomes enabled and available to subsequent searches.
- **AC-02.3:** Given an invalid, private, non-HTTPS, disallowed, unsupported, oversized, cross-origin, or recipe-less candidate, validation returns safe feedback and approval is unavailable.
- **AC-02.4:** Validating or approving a site never creates a recipe import or saved recipe.

**Edge cases:**

- Revalidating an existing origin updates its report without creating a duplicate.
- Approval is idempotent for an already-approved candidate.

## Non-functional requirements

- **NFR-01 — Security:** Every outbound destination and redirect is validated; responses are size bounded; search and preview URLs remain on the approved HTTPS origin.
- **NFR-02 — Performance:** Search fans out concurrently to at most eight approved sites, requests at most ten results per site, and uses a per-provider timeout.
- **NFR-03 — Accessibility:** Forms, reports, results, preview, errors, and progress expose semantic labels and status text.
- **NFR-04 — Privacy:** No browser credentials, cookies, private content, or raw upstream errors are sent to sites or returned to the UI.

## External input and data handling

- **Sources and validation:** One candidate URL and bounded query; public HTTPS origins only. WordPress REST search is the sole current adapter.
- **Remote retrieval:** Redirects are revalidated; validation inspects robots, bounded search JSON, and one bounded sample recipe page. Search accepts only same-origin URLs.
- **Files:** None.
- **Data and access:** D1 stores origin, hostname, adapter, status, compatibility report, and timestamps. The report contains no secrets.

## Codebase context

The React/Vite SPA uses typed services and Worker routes. D1 migrations and repositories own persistence. Existing `fetchRecipePage`, `validatePublicUrl`, and `extractRecipeDraft` enforce URL-import constraints; `/api/import/url` already creates an unsaved draft and the review page performs explicit saving. Tests use controlled fixtures rather than live sites.

## Assumptions and open questions

### Assumptions

- **A-01:** Cloudflare Access continues to enforce owner-only access to the deployed Beta UI and API.
- **A-02:** The owner approved the initial site during discovery; its domain may appear as provenance or administrative status but is not a dedicated branded integration.
- **A-03:** Robots compatibility is a technical signal only; the owner remains responsible for permission and terms review.

### Open questions

- None.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 1.0 | 2026-09-21 | Approved initial scope and manual approval | User authorized build and confirmed explicit approval | All |
| 1.1 | 2026-09-21 | Sample several bounded search results during validation | The first result can be a non-recipe roundup while later results are usable recipes | AC-02.1 |
