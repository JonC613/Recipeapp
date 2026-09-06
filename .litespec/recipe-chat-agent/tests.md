---
feature: recipe-chat-agent
artifact: tests
status: implementing
owner: user
version: 0.3
created: 2026-09-03
updated: 2026-09-05
spec_version: 0.3
plan_version: 0.3
---

# Test Plan: Recipe Chat Agent

Traces the [approved specification](spec.md) through the [approved plan](plan.md). Every entry is planned evidence, not a claim of already-passing coverage. Historical done metadata did not establish full acceptance.

## Strategy

Use Worker tests with deterministic D1 fixtures and provider doubles for retrieval, request bounds, JSON-schema mapping, citation validation, safe failure envelopes, and no-write behavior. Use component tests for accessible session-only chat state, then Playwright for the protected-SPA-shaped navigation, citation, responsive layout, and refresh behavior. No test makes a paid OpenAI request or needs production credentials.

## Acceptance traceability

| Acceptance criterion | Test IDs | Method | Status |
|---|---|---|---|
| AC-01.1 | T-01 | Automated | Planned |
| AC-01.2 | T-02 | Automated | Planned |
| AC-01.3 | T-03 | Automated | Planned |
| AC-01.4 | T-04 | Automated | Planned |
| AC-02.1 | T-05 | Automated | Planned |
| AC-02.2 | T-06 | Automated | Planned |
| AC-02.3 | T-07 | Automated | Planned |
| AC-03.1 | T-08 | Automated | Planned |
| AC-03.2 | T-09 | Automated | Planned |
| AC-03.3 | T-10 | Automated | Planned |
| AC-04.1 | T-11 | Automated | Planned |
| AC-04.2 | T-12 | Automated | Planned |
| AC-04.3 | T-13 | Automated | Planned |
| AC-04.4 | T-14 | Automated | Planned |
| AC-04.5 | T-15 | Automated | Planned |
| AC-05.1 | T-16 | Automated | Planned |
| AC-05.2 | T-17 | Automated | Planned |
| AC-05.3 | T-18 | Automated | Planned |
| AC-05.4 | T-19 | Automated | Planned |
| AC-05.5 | T-20 | Automated | Planned |
| AC-06.1 | T-21 | Automated | Planned |
| AC-06.2 | T-22 | Automated | Planned |
| AC-06.3 | T-23 | Automated | Planned |
| AC-06.4 | T-24 | Automated | Planned |
| AC-07.1 | T-25 | Automated | Planned |
| AC-07.2 | T-26 | Automated | Planned |
| AC-07.3 | T-27 | Automated | Planned |
| AC-07.4 | T-28 | Automated + manual review | Planned |

Every current-release acceptance criterion must appear exactly once in this table and map to at least one test or documented manual exception.

## Critical user flows

### T-01 — Chat is discoverable and scoped

- Covers: AC-01.1
- Level: component and end-to-end
- Setup: Render the application with API routes mocked; load the normal library route in Playwright.
- Action: Open the Recipe Chat navigation entry.
- Expected: The chat page has a labelled question field, submit control, and visible saved-recipes-only scope statement.

### T-02 — Valid question shows progress then answer

- Covers: AC-01.2
- Level: component
- Setup: Render with a deferred successful typed chat client response.
- Action: Enter a valid question and submit it.
- Expected: The submit control prevents a second request while pending; accessible in-progress text is visible; the completed transcript contains the submitted question and returned answer.

### T-03 — Answer citations link to known recipe details

- Covers: AC-01.3
- Level: Worker unit and component
- Setup: Provider double returns an answer citing an allowed candidate recipe; render the response DTO in a memory router.
- Action: Submit the question and inspect rendered citations.
- Expected: The Worker derives citation title/ID from the candidate set, and the browser renders each citation as `/recipes/:id` without source/import details.

### T-04 — Conversation is session-only

- Covers: AC-01.4
- Level: component and end-to-end
- Setup: Complete one successful question/answer flow.
- Action: Unmount/remount the page and reload it in Playwright.
- Expected: No prior messages are present and no browser request stores a chat-history record.

## Failure and recovery cases

### T-05 — Empty and no-match library states avoid model use

- Covers: AC-02.1
- Level: Worker unit and component
- Setup: Use empty-library and lexical-zero-candidate D1 fixtures with a counting provider double.
- Action: Submit valid questions against each fixture.
- Expected: The result gives no-match guidance only, the provider call count stays zero, and no general cooking advice is rendered.

### T-06 — Provider outage preserves a retryable question

- Covers: AC-02.2
- Level: Worker unit and component
- Setup: Provider double rejects with an unavailable error.
- Action: Submit a valid question.
- Expected: The Worker returns the allow-listed retryable service error without provider text; the page retains the question, shows an alert, and permits retry.

### T-07 — Malformed output never reaches the browser

- Covers: AC-02.3
- Level: Worker unit
- Setup: Provider responses include invalid JSON/schema, ungrounded answer data, and unknown/duplicate citation IDs.
- Action: Invoke the route.
- Expected: Invalid results map to the safe error envelope; unknown citations are rejected and duplicates are safely normalized according to the final mapping contract.

### T-08 — Chat has no mutation path

- Covers: AC-03.1
- Level: Worker integration
- Setup: Seed D1 recipes and snapshot relevant recipe rows; use a read-only provider double.
- Action: Submit ordinary and action-requesting questions.
- Expected: Only read queries occur, recipe and related-table snapshots are unchanged, and the API exposes no write action.

### T-09 — Browser/provider privacy boundary holds

- Covers: AC-03.2
- Level: Worker unit and component
- Setup: Provider double returns a payload containing diagnostic/raw fields; browser fetch mock records body.
- Action: Complete a request.
- Expected: Browser request/response contains only the safe question/answer/citation DTO; it contains no credential, raw provider payload, or private source/import data.

### T-10 — Hostile content cannot expand scope

- Covers: AC-03.3
- Level: provider unit and Worker unit
- Setup: Candidate recipes and questions contain instruction-like text requesting web access, data mutation, secret disclosure, or non-recipe context.
- Action: Build the provider request and map the structured response.
- Expected: Prompt construction labels content as untrusted data, the route remains recipe-only/read-only, and scope-breaking output cannot produce a browser action or leak.

## Amendment verification

### T-11 — Relevance

- Covers: AC-04.1
- Level: unit, integration or component at the relevant boundary
- Setup: Older exact-title/two-ingredient and newer partial matches.
- Action: Query title and chicken with mushrooms.
- Expected: Relevant matches outrank recency; stable ties.

### T-12 — Exclusions

- Covers: AC-04.2
- Level: unit, integration or component at the relevant boundary
- Setup: 13+ candidates with excluded ingredients in late child rows.
- Action: Query without mushrooms and no mushrooms.
- Expected: Exclusion occurs before limit against stored ingredients, including case differences.

### T-13 — Time filters

- Covers: AC-04.3
- Level: unit, integration or component at the relevant boundary
- Setup: 29/30/31-minute, prep-plus-cook, and unknown-duration recipes.
- Action: Query under 30 and 30 or less.
- Expected: Strict/inclusive boundaries differ; unknown times never qualify.

### T-14 — Clarification

- Covers: AC-04.4
- Level: unit, integration or component at the relevant boundary
- Setup: Supported examples and ambiguous/unsupported constraint forms.
- Action: Submit each form and inspect help.
- Expected: Ambiguity clarifies without claiming filter enforcement; help states syntax limits.

### T-15 — Context bounds

- Covers: AC-04.5
- Level: unit, integration or component at the relevant boundary
- Setup: 13+ matches with oversized fields, known/missing times and servings.
- Action: Retrieve and render context.
- Expected: 12-candidate and 24,000-character limits hold; truncation is disclosed; unknown values remain unknown.

### T-16 — Outcome mapping

- Covers: AC-05.1
- Level: unit, integration or component at the relevant boundary
- Setup: Answer/no_match/clarification provider doubles with candidates.
- Action: Map valid and invalid combinations.
- Expected: Only answers require known citations; other outcomes carry none and render safely.

### T-17 — Failure categories

- Covers: AC-05.2
- Level: unit, integration or component at the relevant boundary
- Setup: Incomplete, refusal, malformed/oversized output, transport, HTTP and D1 errors.
- Action: Invoke each failure path.
- Expected: Distinct allow-listed internal reasons and safe public recovery; no raw errors.

### T-18 — Timeouts

- Covers: AC-05.3
- Level: unit, integration or component at the relevant boundary
- Setup: Hung signal-aware fetch and fake clocks.
- Action: Advance to 45 seconds provider and 50 seconds client.
- Expected: Abort and timer cleanup occur; retry is available; no automatic additional call.

### T-19 — Cancel/retry

- Covers: AC-05.4
- Level: unit, integration or component at the relevant boundary
- Setup: Deferred response and failed turn with subsequently edited input.
- Action: Cancel, retry, and resolve old requests.
- Expected: Editable UI; original failed text retried without duplication; late results ignored; accessible status.

### T-20 — Safe diagnostics

- Covers: AC-05.5
- Level: unit, integration or component at the relevant boundary
- Setup: Logger spy, sentinel secrets/content and known/missing usage.
- Action: Exercise success and failures.
- Expected: Only approved metadata logged; missing usage unknown; no sentinels or raw messages.

### T-21 — Fresh follow-up

- Covers: AC-06.1
- Level: unit, integration or component at the relevant boundary
- Setup: Prior cited recipes with changed and unknown durations.
- Action: Ask which of those is quickest.
- Expected: Fresh facts and prior cited scope supplied; unknown times not invented.

### T-22 — History validation

- Covers: AC-06.2
- Level: unit, integration or component at the relevant boundary
- Setup: Four exchanges, excessive size, forged/deleted references.
- Action: Submit follow-ups with counting provider.
- Expected: At most three successful exchanges; excessive external history rejected; invalid references never cited; missing antecedents clarify.

### T-23 — Session reset

- Covers: AC-06.3
- Level: unit, integration or component at the relevant boundary
- Setup: Completed/pending turns and storage spies.
- Action: Clear while pending, resolve old request, remount and reload.
- Expected: No resurrected results or persistence; store:false in provider request.

### T-24 — Standalone questions

- Covers: AC-06.4
- Level: unit, integration or component at the relevant boundary
- Setup: Prior shrimp exchange and unrelated saved pasta.
- Action: Ask standalone pasta question.
- Expected: Global retrieval finds pasta; temporary-context disclosure and clear action visible.

### T-25 — Dataset

- Covers: AC-07.1
- Level: unit (offline harness)
- Setup: Synthetic versioned fixture library and expected-answer rubric.
- Action: Validate comparison dataset.
- Expected: Exactly 20 unique cases span all approved categories and reference valid fixture IDs.

### T-26 — Offline safety

- Covers: AC-07.2
- Level: unit (offline harness)
- Setup: Network-denying dry-run and fake live transport.
- Action: Dry-run, omit prerequisites, and simulate approved model choices.
- Expected: Zero real calls; missing live prerequisites rejected; identical fixtures/retrieval/order and settings/date recorded.

### T-27 — Report math

- Covers: AC-07.3
- Level: unit (offline harness)
- Setup: Known timing/usage/cached tokens, missing usage, dated rates and scores.
- Action: Generate reports.
- Expected: Correct-out-of-20, unusable rate, median/p95 and cost match expectations; retrieval/provider/quality failures separated; unknown never zero; no reasoning double-counting.

### T-28 — Recommendation gating

- Covers: AC-07.4
- Level: unit (offline harness)
- Setup: Synthetic passing/failing reports and valid-ID unsupported claims.
- Action: Apply rubric and generate recommendation.
- Expected: Cheapest qualifying model or insufficient evidence; unreviewed quality pending; no configuration changes; small-sample caveat.

### T-29 — Resource bounds and compatibility

- Covers: AC-03.1, AC-03.2, AC-06.2, NFR-05
- Level: unit and integration
- Setup: Streams with absent/false Content-Length, multi-byte UTF-8, 600/601-character questions, 8,000-character history boundaries, and a large fixture library.
- Action: Submit boundary requests; count D1 statements for standalone and follow-up retrieval.
- Expected: 16 KiB enforced before JSON parsing, malformed/oversized input causes zero provider calls, at most six D1 statements including hydration/resolution, no writes, and legacy question-only requests still work.

## Automated checks

- A1-T1 maps to T-12–T-14, T-22, T-24, T-29; A1-T2 to T-08, T-11–T-15, T-21–T-22, T-24, T-29.
- A2-T1 maps to T-07, T-09–T-10, T-16–T-18, T-20; A2-T2 to T-05–T-10, T-14, T-16–T-17, T-21–T-22, T-29.
- A3-T1 maps to T-01–T-04, T-06, T-14–T-15, T-18–T-19, T-22–T-24; A4-T1 to T-25–T-28; A4-T2 to all cases and regressions.
- Run focused tests after meaningful increments, then typecheck, lint, build, component, Worker, integration, and local E2E scripts from package.json. No paid AI calls or production credentials in automated tests.
- Playwright verifies actual citation navigation, no-match/clarification, retry, reset, keyboard operation, and overflow at 320, 768, and 1440 CSS pixels. D1 integration tests independently verify retrieval instead of relying only on browser mocks.
- Run the offline comparison dry-run and LiteSpec validator. Record commands, exit codes, counts, and failures; never inherit historical done status as evidence.

## Manual exceptions

T-28 includes human factual-quality review because schema/ID tests cannot prove arbitrary answer claims. Before a paid run, separately approve challenger, maximum spend, dated verified prices, and quality threshold. The reviewer compares each answer with expected outcomes, allowed references, and fixture facts; records pass/fail and unsupported-claim rationale; and checks the recommendation. The plan proposes at least 18/20 correct, zero unusable answers, and no invalid links or critical unsupported constraint claims. Confirm these prerequisites before spending.

Offline completion requires the rubric, dataset, review-status gates, and report calculations to pass. Live factual-quality results remain explicitly not run until authorized. Provider doubles verify boundaries and no-write behavior, not universal model grounding or prompt-injection resistance. Production validation is a separate release check.

## Test data and setup

- Use fixed saved-recipe fixtures spanning title, ingredient, tag/category/cuisine, descriptions, notes, and instructions; include an empty library fixture and a long-text fixture for retrieval caps.
- Use in-memory/local D1 test bindings and strict provider doubles; never set a real OpenAI key or issue a network request in automated tests.
- Reuse existing Worker error-envelope assertions, React Router memory-router setup, and Playwright local SPA harness. Mock `/api/chat/recipes` in browser-focused flows as needed.
- Run responsive browser coverage at 320, 768, and 1440 CSS pixels. Assert visible labels/statuses rather than visual snapshots alone.

## Completion criteria

- [ ] Every current-release acceptance criterion maps to passing evidence.
- [ ] Critical user flows pass.
- [ ] Relevant failure and recovery cases pass.
- [ ] Manual exceptions, if any, have recorded evidence.
- [ ] No unresolved failure blocks an approved story or non-functional requirement.
- [ ] Worker, component, integration, and E2E tests make no external OpenAI call.
- [ ] Offline evaluation contains exactly 20 cases, validated report calculations, and no paid calls or production model changes.
- [ ] Evidence distinguishes automated contract checks from gated live factual-quality review.
- [ ] Durable Project Memory changes are proposed separately for approval.
- [ ] After separately authorized deployment only, check Cloudflare Access and production chat. Record as not run until authorized, never as already passing.

## Amendment history

| Version | Date | Change | Reason | Affected IDs |
|---|---|---|---|---|
| 0.1 | 2026-09-03 | Initial draft | Derived from approved specification and plan | All |
| 0.3 | 2026-09-05 | Revised traceability and retrieval/reliability/follow-up/evaluation checks | Owner approved plan v0.3; reconciles historical coverage claims | T-11–T-29, AC-04.1–AC-07.4, NFR-05–NFR-06 |
