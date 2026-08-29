# Quickstart: Validate Text Recipe Import

## Prerequisites

- Node.js 22.12+, installed dependencies, and local D1 migrations
- Ignored local `OPENAI_API_KEY` only for an intentional live smoke check
- Automated tests use parser doubles and incur no provider charges

Do not configure remote secrets or deploy from this guide.

## Validation

```powershell
npm run lint
npm run typecheck
npm run cf-typecheck
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
```

Prove with controlled doubles: valid extraction; original wording/order; absent unknowns; no invented
facts; non/multiple recipe; refusal; invalid output; timeout/rate limit; one call per submit; explicit
retry creates a distinct attempt.

Apply migration `0004_text_imports.sql` in isolated tests and verify URL history survives, text source
and snapshot remain immutable, approval creates one text-sourced recipe, cancel creates none, and
duplicate approval is blocked.

At 320, 768, and 1440 CSS pixels verify paste, progress, ready result, review/edit/save, cancel, safe
recovery, and no horizontal scrolling.

## Optional live smoke check

After automated checks pass, explicitly submit one short recipe locally. Confirm one provider request,
a reviewable draft, preserved source, and no automatic save. Never print the key, source, or raw provider
response.

## Recorded local evidence

On 2026-08-29, automated text-import acceptance passed at 320, 768, and 1440 CSS pixels through the
responsive Playwright suite. The suite used mocked extraction only; no live OpenAI request was made.
