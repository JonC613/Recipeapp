# Recipe Library

A mobile-first personal library for recipes worth making again.

## Local development

```powershell
npm ci
npm run cf-typegen
npm run dev
```

The Worker and its D1/R2 bindings run locally by default; Cloudflare credentials are not needed for local work.

At the local address shown by Vite, you can add a recipe manually, enter optional metadata and notes,
edit it, favorite it, search/filter it, and deliberately delete it. You can also choose **Import from URL**
from the manual-recipe page, paste a public recipe URL, and receive an unsaved deterministic draft. URL
imports use only published Recipe JSON-LD; they do not use AI or automatically save a library recipe.
If a page does not publish a usable recipe, blocks imports, or is temporarily unavailable, use the safe
message shown to retry another URL or enter the recipe manually. A retained ready draft can be reopened
from its import result link. Choose **Review and save** to correct the draft and explicitly create one
library recipe; its original URL import stays unchanged, and Cancel leaves it unsaved. Local preview applies the committed
D1 migration automatically; if recipe data looks stale, restart `npm run dev` or `npm run preview`.

You can also paste one recipe as free-form text. Text import makes one explicit server-side extraction
request, produces an unsaved draft, and always requires review before saving. Pasted text and the
original extraction snapshot remain retained separately from the recipe you approve. Local automated
tests use controlled parser doubles and do not make OpenAI requests. Keep `OPENAI_API_KEY` only in an
ignored local `.env` variant; use `OPENAI_MODEL=gpt-5-mini` unless you deliberately evaluate another
model. Do not place either value in browser-prefixed configuration or commit them.

## Validation

```powershell
npm run typecheck
npm run cf-typecheck
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
```

Cloudflare resource provisioning and deployment are separate account-changing steps.

## Remote deployment

Production is configured only for `https://recipes.merkavaenterprises.com`; the provider-assigned Worker
address is disabled. Before deployment, make sure `merkavaenterprises.com` is an active Cloudflare zone
and the `recipes` hostname has no conflicting CNAME record.

Set up a Cloudflare Access self-hosted application for the exact hostname with one Allow policy for the
owner's approved email. Keep the email out of Git and do not use an Everyone, all-valid-email, domain-wide,
or bypass policy. Confirm that the chosen Access sign-in method works for the owner before release.

Keep `OPENAI_API_KEY` in Cloudflare Worker secret management only. Review and explicitly confirm remote
D1 migrations against the existing `recipeapp-db`; do not recreate the database or the private
`recipeapp-sources` R2 bucket. After deployment, verify unauthenticated Access denial, authorized health,
manual save/search, text-import review/save, and the data-preserving rollback procedure described in
`specs/008-secure-deployment/quickstart.md`. Every Cloudflare, DNS, database, secret, and deployment action
requires separate owner approval at the time it runs.

Record deployment evidence and the current recovery version in the feature quickstart only; do not place
owner identities, API keys, session data, or private source material in Git.
