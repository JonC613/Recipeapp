# Feature Specification: URL Recipe Import

**Feature Branch**: `003-url-import`

**Created**: 2026-08-28

**Status**: Done

**Input**: User description: "Import recipes from public URLs using deterministic Recipe structured data, preserve the source, and produce an unsaved draft for later review."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extract a Recipe from a URL (Priority: P1)

A cook pastes a public recipe-page address and receives an editable, unsaved draft populated from the recipe information published by that page.

**Why this priority**: Pasting a link is the lowest-effort way to capture an existing recipe and the first MVP import path.

**Independent Test**: Submit a controlled recipe-page fixture containing Recipe structured data and verify the draft has its title, ingredient text, instructions, source address, and ready status without creating a library recipe.

**Acceptance Scenarios**:

1. **Given** a cook has a supported public recipe URL, **When** they submit it, **Then** they receive a ready import draft populated from published recipe information.
2. **Given** a page publishes several structured items, **When** one represents a recipe, **Then** the recipe item is selected rather than unrelated metadata.
3. **Given** structured ingredients or instructions are present, **When** the draft is made, **Then** their original text and published ordering are retained.
4. **Given** a URL import completes, **When** the cook opens their library, **Then** no saved recipe appears until a later explicit review-and-save action.

---

### User Story 2 - Understand an Unextractable URL (Priority: P2)

A cook receives a clear, safe outcome when a submitted link is malformed, disallowed, unreachable, or lacks usable recipe information.

**Why this priority**: Links will often be copied incorrectly or come from pages that do not publish recipe data.

**Independent Test**: Submit an invalid address, a non-recipe page, and a controlled retrieval failure; verify each returns an understandable recovery outcome and creates neither a saved recipe nor a ready draft.

**Acceptance Scenarios**:

1. **Given** a cook submits an invalid or unsupported URL, **When** validation occurs, **Then** the application explains how to provide a public web address without internal details.
2. **Given** a reachable page has no usable recipe information, **When** extraction completes, **Then** the application reports that no recipe was found and offers another URL or manual entry.
3. **Given** a remote page cannot be reached within the import attempt, **When** it ends, **Then** the cook receives a safe retryable failure message.

---

### User Story 3 - Preserve Import Provenance (Priority: P3)

A URL import remains attributable to its original address and retains its deterministic extraction result so later review can distinguish source information from user edits.

**Why this priority**: Provenance is required before future edits and AI enrichment can be trusted.

**Independent Test**: Import a controlled recipe URL, retrieve its draft by identifier, and verify original URL, imported time, extraction snapshot, and ready status are retained independently of the library.

**Acceptance Scenarios**:

1. **Given** a ready URL import, **When** its draft is retrieved, **Then** its original URL and extracted draft are available together.
2. **Given** a URL import is retried after failure, **When** the retry succeeds, **Then** it creates a distinct import attempt rather than overwriting history.

### Edge Cases

- A URL uses an unsupported scheme, points to a local/private address, includes credentials, or redirects to an unsupported destination.
- Structured data is a graph, array, nested recipe item, incomplete list, or blank entry.
- A page contains several recipes or no unambiguous recipe item.
- A remote page is too large, redirects repeatedly, returns non-HTML content, or has a temporary failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept a public HTTP or HTTPS recipe-page address and reject malformed, credential-bearing, local, private, or unsupported destinations.
- **FR-002**: The system MUST retrieve only a bounded, safe representation of an accepted page and safely handle redirects, unsupported content, unavailable pages, and timeouts.
- **FR-003**: The system MUST detect published Recipe structured data before any non-deterministic extraction is considered.
- **FR-004**: The system MUST select an unambiguous Recipe item from supported structured-data shapes and normalize recognizable title, description, ingredient text, instructions, times, servings, category, cuisine, tags, and source information into the stable recipe draft.
- **FR-005**: The system MUST preserve source ingredient text and instruction ordering; unavailable information MUST remain absent rather than invented.
- **FR-006**: The system MUST create a distinct import record containing original URL, imported time, extraction status, and deterministic extraction snapshot.
- **FR-007**: A successful URL import MUST produce a retrievable draft but MUST NOT create or modify a saved recipe before explicit user review and save.
- **FR-008**: The system MUST return non-sensitive, actionable outcomes for invalid URLs, no recipe information, and temporary retrieval failures.
- **FR-009**: The system MUST expose no remote-page credentials, private network content, provider secrets, or internal diagnostic details to the browser, logs, or stored import record.
- **FR-010**: This feature MUST NOT add AI parsing, text/PDF/image import, automatic saving, semantic search, authentication, or remote deployment.

### Key Entities

- **URL Import**: One import attempt with original URL, creation time, status, and extraction result or safe failure outcome.
- **Recipe Draft**: An unsaved normalized potential recipe, distinct from a user-approved library recipe.
- **Structured Recipe Source**: Published recipe information used to populate a draft while preserving its source address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For controlled supported pages, a cook receives a recognizable unsaved draft within 10 seconds in 95% of local acceptance runs.
- **SC-002**: Automated coverage confirms title, ingredient text, instruction ordering, and original source URL for every supported structured-data fixture.
- **SC-003**: 100% of tested invalid, disallowed, unavailable, and non-recipe URLs return a safe recovery outcome and create no saved recipe.
- **SC-004**: Browser journeys show URL submission and import-result experiences at 320, 768, and 1440 CSS pixels without horizontal page scrolling.

## Assumptions

- The app remains a personal local-development application with no sign-in experience.
- This first slice supports only public pages that publish one usable Recipe structured-data item; ambiguous multiple-recipe pages fail safely rather than guessing.
- Deterministic structured-data extraction is sufficient here. AI fallback or enrichment and review-and-save are specified separately.
- A ready draft is retained as import history but cannot become a library recipe until the review feature is implemented.
- Remote deployment remains deferred until Cloudflare Access is configured on an owner-controlled custom hostname and separately authorized.
