---
feature: recipe-chat-agent
artifact: spec
status: implementing
owner: user
version: 0.3
created: 2026-09-03
updated: 2026-09-05
---

# Specification: Recipe Chat Agent

## Summary

Recipe Chat Agent adds an owner-facing conversational way to ask questions about saved recipes. It uses the existing Worker-owned OpenAI key and bounded, read-only recipe retrieval to give useful answers with direct links back to the referenced recipes.

## Problem

The library supports search, filters, recipe detail, Cooking Mode, and meal planning, but the owner must decide which search terms and filters will locate an answer. A conversational prompt such as “Which of my recipes use shrimp?” should be able to use the saved library without exposing recipes or provider credentials outside the existing protected application boundary.

## Desired outcome

The owner can open a Recipe Chat page, submit a recipe question, and receive a concise answer grounded only in the saved recipe library. Each referenced recipe is presented as a link to its normal detail page. The first release does not persist conversations or modify application data.

<!-- Include the next section when boundaries are ambiguous or scope drift is plausible. -->
## Boundaries

### Goals

- Answer questions using saved recipes only.
- Link each cited recipe to its existing detail page.
- Keep model access and recipe retrieval inside the Cloudflare Worker.
- Make unavailable-provider, invalid, empty, and no-match states recoverable without revealing implementation details.

### Non-goals

- Creating, editing, deleting, favoriting, planning, or otherwise mutating recipes through chat.
- Reading meal-plan or grocery-list data.
- Persistent chat history, conversation sharing, memory, or multi-user behavior.
- Semantic/vector search, embeddings, external web search, recipe generation, or general cooking advice when no saved recipe matches.
- Exposing raw D1 records, OpenAI payloads, model credentials, or provider diagnostics to the browser.

### Constraints

- Reuse the existing Worker-only `OPENAI_API_KEY` and configured `OPENAI_MODEL` (`gpt-5-mini` at specification time); never send either to the browser.
- Fit the existing React/Vite SPA, Worker route dispatch, typed browser service, D1 repository, Cloudflare Access, and Vitest/Playwright conventions.
- Keep retrieval deterministic and bounded through existing saved-recipe data; do not add vector infrastructure or a migration for chat history.
- Treat recipe content and user prompts as data, not instructions. The model may answer only from the retrieved recipe context.

## Requirements

### Current release

- **R-01:** Provide a protected Recipe Chat entry point and page for one submitted question at a time.
- **R-02:** Retrieve a bounded set of saved-recipe context server-side and make one bounded OpenAI response request per submitted question.
- **R-03:** Return a structured, safe answer that identifies the saved recipes it relied on and lets the browser render detail-page links from recipe IDs.
- **R-04:** Keep messages in browser memory for the current page session only; refreshing or reopening the page starts a new conversation.
- **R-05:** Return clear recoverable states for blank/oversized questions, no matching saved recipes, and unavailable/invalid provider output.
- **R-06:** Rank deterministic matches by relevance, enforce supported ingredient exclusions and time filters before selecting up to 12 candidates, and provide saved times, servings, and favorite status in the safe context.
- **R-07:** Permit structured no-match and clarification outcomes even when lexical candidates exist. Never require an irrelevant citation to produce a valid response.
- **R-08:** Support bounded follow-ups using at most the three most recent successful exchanges held in page memory; revalidate all referenced recipe IDs server-side and fetch current recipe data.
- **R-09:** Bound request duration and aggregate context, reduce D1 statement count, and record allow-listed operational diagnostics without prompts, answers, recipe content, or credentials.
- **R-10:** Prepare a repeatable 20-question model comparison using the same fixture library and retrieval implementation. Measure correctness, unusable-answer rate, latency, and token-based cost; retain `gpt-5-mini` as baseline and require separate authorization for paid execution or a production model change.

### Deferred

- **D-01:** Read meal-plan and grocery-list data.
- **D-02:** Persisted conversations, owner feedback, new analytics dashboards, or per-chat cost reporting. Safe operational failure and usage metadata is included in R-09.
- **D-03:** AI-driven actions, recipe updates, plan/grocery changes, and general cooking advice outside saved recipe data.
- **D-04:** Semantic/vector retrieval, embeddings, learned ranking, multi-turn server memory, and external web retrieval. Deterministic relevance ranking and transient client-carried follow-up context are included in this amendment.

## User stories

### US-01 — Ask about saved recipes

**Story:** As the owner, I want to ask a plain-language question about my saved recipes, so that I can find useful information without manually composing filters.

**Rationale:** Conversational retrieval complements the existing traditional search without replacing it.

**Acceptance criteria:**

- **AC-01.1:** The application exposes a Recipe Chat entry point and a page with a question field, submit action, and a visible statement that answers use saved recipes only.
- **AC-01.2:** Given a non-empty valid question, when the owner submits it, then the page shows an in-progress state and subsequently renders the question and the returned answer.
- **AC-01.3:** Given an answer supported by one or more saved recipes, when it is rendered, then every cited recipe has a detail-page link and the answer does not require raw import/source data.
- **AC-01.4:** Given a refresh or a new visit to Recipe Chat, when the page loads, then previous chat messages are absent.

**Edge cases:**

- Blank or whitespace-only questions cannot be submitted.
- The page bounds a question to an implementation-defined maximum and explains a rejected oversized question without making a provider call.
- Submitting while a request is active does not create a second simultaneous request.

### US-02 — Receive a grounded no-match or recovery response

**Story:** As the owner, I want clear responses when my library cannot answer a question or the AI service is unavailable, so that I can recover without guessing whether my recipes changed.

**Rationale:** The assistant must be trustworthy and must not fill library gaps with invented recipes or ungrounded advice.

**Acceptance criteria:**

- **AC-02.1:** Given no relevant saved recipe context, when the owner submits a valid question, then the application says that no matching saved recipes were found and suggests refining the question or adding a recipe; it does not provide general advice as though it came from the library.
- **AC-02.2:** Given a temporary provider or transport failure, when the owner submits a valid question, then the application preserves the question, shows a safe retryable error, and does not expose provider details or credentials.
- **AC-02.3:** Given malformed or ungrounded provider output, when the Worker handles it, then the browser receives the same safe recoverable response rather than raw output.

**Edge cases:**

- An empty library is a no-match state and makes no model request.
- Retrieval and prompt bounds prevent one request from including an unbounded library or unbounded recipe text.
- Any response that cites an unknown or duplicate recipe identifier is rejected or safely normalized before it reaches the browser.

### US-03 — Preserve read-only data and security boundaries

**Story:** As the owner, I want chat to be unable to change my recipe library, so that asking a question cannot alter saved cooking data.

**Rationale:** This MVP establishes a safe foundation before any future assistant actions are considered.

**Acceptance criteria:**

- **AC-03.1:** Given any submitted question or recipe content, when Recipe Chat handles it, then it performs only read operations against saved-recipe data and exposes no write action.
- **AC-03.2:** Given the browser request and response, when inspected, then neither contains the OpenAI API key, raw provider response, or private R2/import data.
- **AC-03.3:** Given model instructions embedded in a recipe title, notes, ingredients, instructions, or question, when answering, then they are treated as untrusted data and cannot expand the feature’s read-only recipe-only scope.

**Edge cases:**

- Answer outcomes require citations; no-match and clarification outcomes require none.
- A question requesting a modification, web lookup, meal-plan information, or a new recipe receives a scope-limited response instead of triggering a new capability.

### US-04 — Find relevant recipes with explicit constraints

**Story:** As the owner, I want ingredient and time constraints respected, so that suggested recipes fit my request.
**Rationale:** Recency-only OR matching can omit older relevant recipes and include excluded ingredients.

**Acceptance criteria:**

- **AC-04.1:** A fixture query for chicken and mushrooms ranks recipes containing both ahead of single-term matches, independent of update date; exact title matches rank above incidental prose matches, with deterministic tie-breaking.
- **AC-04.2:** Explicit single-ingredient exclusions using “without X” or “no X” exclude saved ingredient matches before the candidate limit. This is a text-based filter, not an allergy-safety guarantee.
- **AC-04.3:** “Under N minutes” and “N minutes or less” use saved total time, or prep plus cook time when both are known, with strict and inclusive comparison respectively. Unknown duration never qualifies and duration is not invented from prose.
- **AC-04.4:** Unsupported or ambiguous constraints receive clarification rather than a claim that they were enforced. Supported syntax and its limits are visible in help/examples.
- **AC-04.5:** Answers based on capped or truncated context disclose that they cover selected matches rather than the entire library. Saved times and servings are available for supported comparisons; missing values remain unknown.

### US-05 — Recover reliably and decline irrelevant answers

**Story:** As the owner, I want chat to explain when it cannot answer and let me recover without repeated generic failures.
**Rationale:** Candidate presence does not imply relevance; incomplete output needs a distinct operational diagnosis.

**Acceptance criteria:**

- **AC-05.1:** A provider may return answer, no-match, or clarification. Only answer requires at least one valid candidate citation; other outcomes cannot carry fabricated links.
- **AC-05.2:** Incomplete output, refusal, invalid JSON/schema, transport failure, upstream rejection, and retrieval failure produce safe handled outcomes and distinct allow-listed diagnostic categories. No raw provider message reaches the browser.
- **AC-05.3:** A provider request is aborted after 45 seconds; the browser stops waiting within 50 seconds and offers retry. There are no automatic paid retries.
- **AC-05.4:** Busy status is accessible, cancellation returns the UI to an editable state and ignores late results, and retry reuses the failed question without duplicating its transcript entry. Client cancellation is not presented as a billing guarantee.
- **AC-05.5:** Diagnostics contain only correlation ID, category, HTTP status when available, duration, candidate count, and provider token counts when available; absent usage remains unknown. Prompt, answer, recipe content, keys, and raw payloads are not logged.

### US-06 — Ask bounded follow-up questions

**Story:** As the owner, I want to ask “which of those is quickest?” without repeating my previous question.
**Rationale:** A visible conversation should support limited conversational context without persistent storage.

**Acceptance criteria:**

- **AC-06.1:** Following a successful recipe answer, “which of those is quickest?” compares known saved durations among the referenced recipes using freshly read records; it identifies unknown times instead of guessing.
- **AC-06.2:** Only the last three successful exchanges are sent as bounded untrusted context. Deleted or invalid references are never cited; unavailable antecedents receive clarification.
- **AC-06.3:** Clear conversation, unmount, and refresh discard history. Clear during a request prevents late results from repopulating the conversation. No localStorage, server conversation storage, or provider-stored response is introduced.
- **AC-06.4:** A new standalone question is not restricted to prior cited recipes. The UI explains temporary context and offers a clear-conversation action.

### US-07 — Choose the model from measured results

**Story:** As the owner, I want evidence of chat quality and cost before paying for a different model.
**Rationale:** Current failures do not establish that the baseline model is the cause; retrieval and response handling must be held constant for a meaningful comparison.

**Acceptance criteria:**

- **AC-07.1:** A versioned set of 20 realistic questions includes direct ingredient/title searches, exclusions, time comparisons, no-match, ambiguous requests, and follow-ups, with expected outcomes and allowed recipe references against synthetic fixtures.
- **AC-07.2:** An offline dry run makes no network call and verifies dataset completeness and report calculations. An explicitly authorized live run compares the baseline with one approved challenger using identical fixtures, retrieval, and question order; model IDs, settings, and run date are recorded.
- **AC-07.3:** The comparison report separates retrieval failures, invalid/failed responses, and factual-quality judgments; reports correct answers out of 20, unusable-answer rate, median/p95 elapsed request time, and recorded token usage. Per-model cost is calculated from dated verified rates and actual available usage, including billed reasoning/cached tokens as applicable; missing usage is unknown, never zero.
- **AC-07.4:** Human review checks the expected-answer rubric and unsupported claims, not just valid IDs. The report recommends the least expensive candidate meeting the approved quality threshold, or reports insufficient evidence. It never changes production configuration automatically; one small run is not presented as proof of general superiority.

## Non-functional requirements

<!-- Include measurable expectations only. Use "None identified" when genuinely absent. -->

- **NFR-01 — Security and privacy:** All OpenAI requests and recipe retrieval execute in the Worker. The browser receives only safe answer text and recipe citation projections; no OpenAI key, raw provider payload, or private import/source data is returned or logged intentionally.
- **NFR-02 — Cost and reliability:** A valid submitted question results in at most one model request, with bounded question, retrieved-recipe, and output sizes. Empty-library, invalid-question, and local validation paths make no model request.
- **NFR-03 — Accessibility and responsive behavior:** The page is keyboard-operable, communicates request/error status through accessible status text, and is usable at the existing 320, 768, and 1440 CSS-pixel validation widths.
- **NFR-04 — Compatibility:** The feature preserves existing recipe CRUD, traditional search, imports, Cooking Mode, meal planning, Usage dashboard, and Cloudflare Access behavior.
- **NFR-05 — Bounded work:** Enforce a 16 KiB request-body limit before JSON parsing, the existing 600-character question bound, at most three prior exchanges, at most 12 candidates, and at most 24,000 serialized characters of recipe context plus 8,000 characters of history. Reject oversized submitted history safely; disclose recipe-context truncation. Candidate retrieval and hydration use at most six D1 statements per request, including follow-up resolution, rather than per-recipe query fan-out.
- **NFR-06 — Verification:** Automated fixture-based tests cover every new acceptance criterion, relevance ordering, exclusions, time boundaries, context caps, response failures, cancellation/retry, follow-ups, and unchanged saved data. Provider doubles verify contracts but are not claimed to prove live-model factual accuracy. Paid model evaluation and production deployment require separate authorization.

## Codebase context

The React/Vite SPA uses React Router routes and typed `src/services` wrappers. The Worker dispatches `/api` routes in `worker/index.ts`, holds the existing `OPENAI_API_KEY` and `OPENAI_MODEL` boundary, and uses the OpenAI Responses API with strict JSON-schema parsing for text/image/PDF imports. D1 already contains saved recipes and the current repository uses Worker repositories for bound, normalized search projections. Cloudflare Access protects the deployed hostname. Existing verification conventions include Worker tests, component tests, D1 integration tests, and Playwright responsive flows. Current saved-recipe search is explicitly traditional and read-only; this feature introduces conversational retrieval without vector infrastructure.

<!-- Add sourced findings beside the affected requirement when external research is necessary. -->
## Assumptions and open questions

### Assumptions

- **A-01:** The existing OpenAI key can use the configured `gpt-5-mini` model for a bounded Responses API request. If it cannot, the Worker returns the defined unavailable state and the provider configuration is revisited without changing browser contracts.
- **A-02:** The personal owner-facing Cloudflare Access boundary remains the authentication boundary for this MVP; no recipe-level user ownership filter is introduced.
- **A-03:** A concise, browser-session-only transcript is sufficient for the first release. Persisted chat history remains deferred to avoid a new private-data retention surface.

### Open questions

- None.

### Amendment assumptions and evidence limits

- Version 0.3 retains the existing production model configuration and one-model-request maximum per chat submission; it introduces no model migration, vector infrastructure, database migration, meal-plan access, or write actions. Offline model-comparison preparation is included; paid execution remains separately gated.
- Initial deterministic constraint support is limited to the explicit English patterns above; unrestricted natural-language constraint interpretation is not promised.
- Current code validates citation IDs, not the factual truth of arbitrary answer prose. Grounding remains a quality target tested with realistic fixtures and optional separately authorized model evaluation, not a guarantee inferred from schema validation.
- Plan and test revisions proceed through their respective approval gates. Historical `done` metadata is not acceptance evidence for this amendment; unchecked completion items and missing failure coverage must be reconciled in the revised test plan.
- Before any paid comparison, confirm the challenger, account availability, maximum spend, verified rates, and quality threshold. These are execution prerequisites, not authorization implied by specification approval.

<!-- High-impact open questions must be resolved before approval. -->
## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-03 | Initial draft | Initial discovery | All |
| 0.2 | 2026-09-05 | Proposed retrieval, reliability, and transient follow-up improvements | Code review found recency-only matching, missing duration context, generic failures, and no follow-up context | R-06–R-09, D-02, D-04, US-04–US-06, NFR-05–NFR-06 |
| 0.3 | 2026-09-05 | Approved scope with offline model-comparison preparation | Owner approved specification with model-evaluation addition; paid runs and model changes remain separate gates | R-10, US-07, AC-07.1–AC-07.4 |
