---
feature: recipe-chat-agent
artifact: plan
status: implementing
owner: user
version: 0.3
created: 2026-09-03
updated: 2026-09-05
spec_version: 0.3
---

# Implementation Plan: Recipe Chat Agent

## Version 0.3 amendment — approved plan

This section is the approved plan for the [approved specification](spec.md). The original 0.1 approach and tasks below are retained as historical baseline, not new authorization or proof of passing tests. Where different, this amendment supersedes them. The revised [test plan](tests.md) is the next approval gate. Implementation, live model calls, deployment, commit, and push require separate authorization.

### Technical approach and decisions

1. Keep one protected endpoint, the existing read-only repository/provider boundary, and the configured production model. Amend the DTO to accept optional bounded history and return `answer`, `no_match`, or `clarification`, plus a server-derived context-limited flag. Browser titles and URLs remain server-derived. Legacy question-only requests continue to work.
2. Add a small deterministic query parser for documented English exclusion/time forms. Separate search terms from constraints; escape LIKE wildcards and bind all values. Rank matches in SQL by exact title, matched positive-term count, then weighted field matches; break ties by stable ID. Apply ingredient exclusions and effective-duration comparisons before LIMIT. Pure supported time/exclusion requests can select recipes without positive keywords. Ambiguous/recognized unsupported constraint forms request clarification; do not claim arbitrary natural-language coverage or allergy safety.
3. Select up to 13 lightweight ranked rows to detect overflow, then hydrate only the top 12 with three bounded bulk child queries, rather than calling `getRecipe` per candidate. The route uses at most six D1 statements, including follow-up resolution. SQL child projections and field caps avoid fetching full unbounded records. Preserve ingredient/instruction ordering and explicit truncation metadata while enforcing the 24,000-character serialized recipe budget. Exclusions operate on stored ingredients before projection/truncation. Unknown durations remain null; use prep plus cook only when both exist.
4. Recognize explicit antecedent phrases such as “of those” for follow-ups. Use the latest successful cited set, re-read it from D1, and apply the new constraints. Standalone questions use global retrieval. Missing/ambiguous antecedents request clarification. Accept at most three validated exchanges, each with bounded question/answer text and at most 12 IDs, with a total 8,000-character history limit. Treat history as untrusted data, never evidence overriding current records; IDs are not authority or instructions.
5. Parse provider envelope status, incomplete reason, refusal, output text, and usage before validating application JSON. Keep one request, `store:false`, and current baseline settings initially. Structured output has explicit outcome; answer requires known nonempty citation IDs while no-match/clarification requires an empty list. Validate combinations locally. Schema/ID checks do not establish factual grounding. No retries or extra classifier call are introduced.
6. Enforce 16 KiB by reading the request stream with a byte counter before JSON parsing, including absent or dishonest Content-Length. Put retrieval inside the handled error boundary. Abort provider work at 45 seconds with cleanup in finally; client aborts at 50 seconds. Bound provider response reading as well. Emit only approved metadata using a correlation ID and monotonic durations; never log caught error messages or raw payloads. Existing safe error envelopes remain compatible.
7. Use AbortController plus a request-generation ID in React to prevent stale results after cancel, clear, or unmount. Keep a stable failed-turn record so retry does not append a duplicate or accidentally submit edited text. Send only successfully completed bounded history; trim whole oldest exchanges locally to budget and reject oversized external requests. Clear/history disclosure and live status text remain keyboard-accessible. No Markdown/HTML renderer or new visual redesign is required.
8. Prepare a local offline-first comparison harness with synthetic fixtures and 20 versioned cases. Share retrieval/context/provider code with the application to avoid testing a different prompt path. Dry-run network use must fail tests. Live mode is explicit and requires approved model IDs, spend ceiling, dated rates, and existing credential reuse; no secrets in reports. Calculate cost from available billed usage, with cached-input and reasoning treatment checked against current official documentation before execution. Do not add a public evaluation endpoint or paid CI job.

### Impacted areas and contract

- `worker/repositories/recipes.ts` and a focused chat-query helper: ranking, filters, bulk hydration, truncation.
- `worker/services/ai/recipe-chat.ts` and `openai-recipe-chat.ts`: outcome union, history/context projection, timeout, metadata, envelope validation.
- `worker/routes/recipe-chat.ts`: bounded request parsing, safe recovery, ID verification, correlation metadata.
- `src/domain/recipe-chat.ts`, `src/services/recipe-chat.ts`, `src/pages/RecipeChatPage.tsx`: validated outcomes, optional history, cancellation, retry, reset, disclosure.
- Focused Worker/component/integration/E2E tests and an offline evaluation script/fixture directory. No D1 migration, secret provisioning, or change to import-model configuration.

Conceptual request: `{question, history?: [{question, answer, citationIds}]}`. History is optional for backward compatibility; the exact runtime DTO is validated on both sides. Public outcomes contain either answer plus known recipe links, or a safe no-match/clarification message. Context truncation is a Worker-generated flag, never trusted from the model. Provider usage stays internal; local evaluation reports use fixture data only.

### Implementation phases and tasks

- [ ] **A1-T1 — Define bounded query and history contracts**
  - Covers: R-06, R-08, AC-04.2, AC-04.3, AC-04.4, AC-06.2, AC-06.4, NFR-05.
  - Depends on: None.
  - Work: Implement pure validators/parser, documented supported syntax, history and body limits, antecedent classification, and explicit unknowns.
  - Verify: Boundary tests for multi-byte bodies, malformed history, exclusions, exact/inclusive times, ambiguous forms, and standalone versus follow-up requests.

- [ ] **A1-T2 — Implement ranked bulk retrieval**
  - Covers: AC-04.1, AC-04.2, AC-04.3, AC-04.5, AC-06.1, AC-06.2, AC-06.4, AC-03.1, NFR-05.
  - Depends on: A1-T1.
  - Work: Apply constraints/ranking before limit; fetch bounded child projections in bulk, expose metadata and current saved times/servings/favorite, and cap serialized context.
  - Verify: D1 fixtures include an older best match, 13+ candidates, unknown times, excluded ingredients, deleted follow-up IDs, and long recipes; assert six-statement ceiling and unchanged data.

- [ ] **A2-T1 — Add explicit provider outcomes and diagnostics**
  - Covers: AC-05.1, AC-05.2, AC-05.3, AC-05.5, AC-02.1, AC-02.3, AC-03.2, AC-03.3.
  - Depends on: A1-T1.
  - Work: Validate envelope and outcome combinations, known IDs, bounded response reading, 45-second timeout, and allow-listed metadata. Preserve one call and current model.
  - Verify: Doubles cover incomplete/refused/malformed/oversized output, invalid citations, transport/rejection, missing usage, timeout cleanup, and no secret/content logging.

- [ ] **A2-T2 — Integrate route recovery and selection**
  - Covers: AC-02.1, AC-02.2, AC-02.3, AC-03.1, AC-03.2, AC-03.3, AC-04.4, AC-05.1, AC-05.2, AC-06.1, AC-06.2.
  - Depends on: A1-T2, A2-T1.
  - Work: Bound input before parsing, handle D1 failures, return local no-match/clarification without AI where possible, and map provider outcomes to safe DTOs.
  - Verify: Route tests assert zero/one call counts, compatibility with question-only requests, privacy, and no write surface, including hostile input.

- [ ] **A3-T1 — Implement resilient session conversation UI**
  - Covers: AC-01.1, AC-01.2, AC-01.3, AC-01.4, AC-02.2, AC-04.4, AC-04.5, AC-05.3, AC-05.4, AC-06.2, AC-06.3, AC-06.4, NFR-03.
  - Depends on: A2-T2.
  - Work: Add clear/cancel, stable retry, timeout, bounded successful history, safe response validation, and accessible limited-context/help messages.
  - Verify: Deferred-response component tests prove stale-result suppression, no duplicate retry turn, editable cancellation, reset on remount, and valid citations. Responsive E2E follows citations at 320/768/1440 widths.

- [ ] **A4-T1 — Prepare offline model comparison**
  - Covers: AC-07.1, AC-07.2, AC-07.3, AC-07.4, R-10.
  - Depends on: A2-T2.
  - Work: Create 20 synthetic cases with expected references/outcomes and factual rubric; add dry-run runner, metrics/cost calculation tests, and report template. Record failure class separately from semantic quality. Do not execute live mode.
  - Verify: Dataset has exactly 20 identified cases covering all named categories; fake usage verifies cost/unknown handling and percentile calculation; network-disabled dry run passes. Human rubric and pending live-run status are visible.

- [ ] **A4-T2 — Verify compatibility and reconcile evidence**
  - Covers: US-01, US-02, US-03, US-04, US-05, US-06, US-07, NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06.
  - Depends on: A3-T1, A4-T1.
  - Work: Run approved tests and type/build/lint checks; reconcile historical unchecked tasks with actual evidence rather than inheriting done status. Propose durable Project Memory changes separately for approval.
  - Verify: `npm run typecheck`, `npm run lint`, `npm run build`, focused then regression Worker/component/integration/E2E suites, and LiteSpec validator. Record failures honestly; no paid/production runs in automated checks.

### Risks, release, and outstanding execution gates

- Restricted English parsing cannot cover every phrasing. Document examples and test recognized ambiguity; do not describe this as unrestricted semantic search.
- Six SQL statements do not bound rows scanned. Query-plan review and representative fixtures assess scan behavior; do not promise lower billing merely from query count reduction.
- Client abort may not cancel already-running upstream work. Ignore late results locally, attempt cancellation upstream, and make no zero-cost guarantee.
- Follow-up text and IDs may be forged by a client; current owner authorization and fresh data are authoritative. No history grants broader data access.
- Provider settings/schema compatibility and live account access must be verified before an authorized live comparison. Start with `gpt-5-mini`; GPT-5.6 Terra is a proposed challenger, not an approved production change.
- Proposed live quality gate for later approval: at least 18/20 rubric-correct answers, zero invalid links or critical unsupported constraint claims, and no unusable answers in the run. Report median/p95 and total cost without inventing a latency target or treating 20 cases as statistical proof. Confirm challenger, spend ceiling, rates, and this gate before paying for a run.
- No production deployment is part of implementation approval. A later release builds UI/Worker together, preserves Access and secrets, and needs no migration. Rollback restores the prior UI/Worker build without data recovery. Never change shared `OPENAI_MODEL` to switch only chat without separately reviewing its effect on import features.

## Historical version 0.1 baseline

## Technical approach

Add one Worker-owned `POST /api/chat/recipes` contract and one React route, `/recipes/chat`. The Worker validates a bounded question, obtains a bounded read-only recipe-context projection from D1, and returns a safe no-match response without calling OpenAI when the library is empty or deterministic lexical retrieval finds no candidate. For candidates, it makes one Responses API request through a dedicated chat-provider interface and accepts only strict structured output containing concise answer text and cited recipe IDs.

The browser holds the submitted question and returned messages in component state only. It renders citations as ordinary links to existing `/recipes/:recipeId` detail pages, never trusts provider titles or URLs, and offers accessible in-progress and retry states. This adds no D1 migration, embeddings, history table, or write route.

## Key decisions

### KD-01 — Bounded deterministic retrieval before one model call

- **Choice:** Tokenize and normalize the question locally, fetch a bounded recipe-context projection matching title, category, cuisine, tags, ingredient wording, description, notes, or instructions, then provide only a bounded candidate set to the model.
- **Rationale:** It preserves the application’s existing traditional-search direction, makes empty/no-match requests free of model calls, prevents an unbounded D1 or prompt read, and is sufficient for a personal-library MVP.
- **Alternatives considered:** Sending the complete library to the model; embedding/vector retrieval; a two-model-call classifier/retriever flow.
- **Consequences:** Some semantically phrased questions may return no match until vector retrieval is separately approved; answers remain explicitly scoped to retrieved saved recipes.

### KD-02 — Strict answer-and-citation contract

- **Choice:** Add a `RecipeChatProvider` interface backed by the Responses API and strict JSON-schema output: `answer` plus zero or more cited recipe IDs. Validate/safely normalize citations against the Worker’s candidate IDs before responding.
- **Rationale:** This follows the existing recipe parser design, prevents provider-controlled links or raw payloads reaching the browser, and gives the UI stable data for citations.
- **Alternatives considered:** Free-form model text with URLs; browser-side model requests; function/tool-call loops.
- **Consequences:** Chat needs focused Worker tests with provider doubles; it does not use OpenAI agent state or persistent conversation memory.

### KD-03 — Stateless, read-only chat surface

- **Choice:** Add a standalone React page and navigation link. Keep transcript state in the mounted page only; provide no mutation affordances or new database table.
- **Rationale:** It meets the approved privacy/read-only scope and is easy to remove or evolve without data migration.
- **Alternatives considered:** D1-persisted conversations; chat embedded in every recipe detail; action-capable assistant.
- **Consequences:** Refreshing clears messages, and later history/actions require a new approved specification.

## Impacted areas

| Area | Expected change | Related IDs |
|---|---|---|
| `worker/index.ts` | Dispatch the new chat route without changing existing API route behavior. | R-01, AC-01.1 |
| `worker/routes/recipe-chat.ts` | Validate requests, select safe no-match/error outcomes, and coordinate repository/provider calls. | AC-01.2, AC-02.1, AC-02.2, AC-02.3, AC-03.1, AC-03.2 |
| `worker/repositories/recipes.ts` | Add a bounded read-only recipe-context query/projection; no writes or migration. | R-02, AC-03.1 |
| `worker/services/ai/recipe-chat.ts`, `worker/services/ai/openai-recipe-chat.ts` | Define the provider boundary, strict output schema, prompt/data isolation, and safe error classification. | R-02–R-03, AC-02.2–AC-03.3 |
| `src/domain/recipe-chat.ts`, `src/services/recipe-chat.ts` | Define safe browser DTOs and typed same-origin client wrapper. | R-03–R-05 |
| `src/pages/RecipeChatPage.tsx`, `src/app/router.tsx`, `src/app/AppShell.tsx`, existing styles | Provide session-only accessible chat UI and a primary navigation entry. | AC-01.1, AC-01.2, AC-01.3, AC-01.4 |
| `tests/worker`, `tests/component`, `tests/integration`, `tests/e2e` | Add contract, boundary, UI, responsive, and non-mutation evidence. | AC-01.1, AC-01.2, AC-01.3, AC-01.4, AC-02.1, AC-02.2, AC-02.3, AC-03.1, AC-03.2, AC-03.3 |

<!-- Include only when technical detail materially removes ambiguity. -->
## Technical detail

### Contract and state transition

`POST /api/chat/recipes`

```ts
type RecipeChatRequest = { question: string }
type RecipeChatResponse =
  | { outcome: 'answer'; answer: string; citations: Array<{ recipeId: string; title: string }> }
  | { outcome: 'no_match'; message: string }
```

The Worker accepts a normalized bounded question. It returns `no_match` with no provider call for an empty library or no deterministic candidate. Otherwise it supplies context to the provider, validates the returned citation IDs against the candidate set, and returns only the safe DTO. Validation/provider failure maps to the existing safe retryable service-error envelope. The browser state is `idle → submitting → answered | no_match | error`; a new submission appends only after the prior request completes, and page unmount/refresh drops all transcript state.

<!-- Include only when meaningful risks were discovered. -->
## Risks and mitigations

| Risk | Impact | Mitigation | Evidence or trigger |
|---|---|---|---|
| Prompt injection in recipes/questions | Model scope expansion or ungrounded answer | System prompt treats all supplied content as data; schema output, citation allow-list, and scope-limited response contract | Worker unit tests with hostile recipe/question text |
| Large library or long recipes | Cost, latency, or Worker limit pressure | Bounded lexical candidate query and per-field/context/output caps; at most one request per valid submission | Repository/provider tests assert limits and call counts |
| Misleading citations | Links not supported by retrieved recipes | Validate/deduplicate IDs against the exact candidate set and derive titles server-side | Provider mapping tests |
| Provider outage or malformed output | Broken chat experience | Existing safe 503-style error convention; preserve question and expose retry UI | Worker/component tests |

## Implementation phases

### Phase 1 — Safe Worker retrieval and provider contract

- [ ] **P1-T1 — Add bounded read-only recipe chat context retrieval**
  - Covers: R-02, AC-02.1, AC-03.1
  - Depends on: None
  - Work: Define internal context projection and normalized lexical candidate selection in the recipe repository, including empty-library/no-match outcomes and hard limits; add no mutation or migration.
  - Verify: Repository/integration tests demonstrate deterministic matches, zero-candidate behavior, and bounded safe fields.

- [ ] **P1-T2 — Add strict Worker-owned chat provider and response mapping**
  - Covers: R-02, R-03, AC-01.3, AC-02.3, AC-03.2, AC-03.3
  - Depends on: P1-T1
  - Work: Define `RecipeChatProvider`, strict structured answer schema, bounded prompt construction, safe extraction/mapping, and citation validation/deduplication against candidates. Reuse Worker-only configuration and never expose raw payloads.
  - Verify: Provider unit tests cover valid structured output, malformed output, hostile content, unknown/duplicate citations, and one request per valid query.

- [ ] **P1-T3 — Add the chat API route and safe error behavior**
  - Covers: R-01, R-02, R-03, R-04, R-05, AC-02.1, AC-02.2, AC-02.3, AC-03.1, AC-03.2
  - Depends on: P1-T1, P1-T2
  - Work: Add route dispatch and request validation; map blank/oversized input, no-match, unavailable, and invalid-output conditions to safe application responses.
  - Verify: Worker route tests confirm status/body contracts, no model call for local/no-match outcomes, and no write statements.

### Phase 2 — Session-only chat experience

- [ ] **P2-T1 — Add typed browser client, route, navigation, and accessible chat page**
  - Covers: US-01, AC-01.1, AC-01.2, AC-01.3, AC-01.4, NFR-03
  - Depends on: P1-T3
  - Work: Add safe DTOs and client wrapper; render the session-only transcript, submit/disabled state, scope disclosure, citations, no-match guidance, retryable error, and an AppShell navigation link.
  - Verify: Component tests cover form validation, in-progress UI, answer/citations, retry/no-match states, and state reset on remount.

- [ ] **P2-T2 — Verify end-to-end compatibility and non-mutation behavior**
  - Covers: NFR-04, AC-03.1, AC-03.2, AC-03.3
  - Depends on: P2-T1
  - Work: Add Playwright responsive journeys for a grounded answer, citation navigation, no-match, and retry. Run existing focused regression suites and the approved build/type checks.
  - Verify: New E2E runs at 320, 768, and 1440 widths; existing recipe, import, Cooking Mode, and meal-plan regression suites remain passing.

<!-- Include when deployed state or external consumers make release behavior relevant. -->
## Release and rollback considerations

- **Release:** Deploy with the existing Worker secret and model configuration. No migration, new credential, or public endpoint is required; Cloudflare Access continues to protect the application hostname.
- **Rollback:** Revert the Worker/UI commit or remove the chat route/navigation entry. Because no chat data is stored and no mutation is allowed, rollback creates no data-reconciliation work.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-03 | Initial draft | Derived from approved specification | All |
| 0.3 | 2026-09-05 | Proposed ranked retrieval, recovery, session follow-ups, and offline evaluation implementation | Derived from owner-approved spec v0.3; baseline retained for provenance | R-06–R-10, US-04–US-07, A1-T1–A4-T2 |
