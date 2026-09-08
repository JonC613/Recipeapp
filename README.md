# Recipe Library

A mobile-first personal library for recipes worth making again: capture recipes, plan dinners, shop from a
generated list, cook step by step, and ask grounded questions about saved recipes.

## Local development

```powershell
npm ci
npm run cf-typegen
npm run dev
```

The Worker and its D1/R2 bindings run locally by default; Cloudflare credentials are not needed for local work.

At the local address shown by Vite, you can create, edit, favorite, search, filter, and deliberately
delete recipes. Recipes may start as a manual entry or an unsaved draft imported from a public URL,
pasted recipe text, a PDF (with an explicit one-time OCR fallback for scans), an image or screenshot,
or TheMealDB. Every import preserves its provenance, requires review, and only creates a library recipe
after **Review and save**.

Saved recipes can be opened in read-only Cooking Mode, assigned to a Sunday-based weekly dinner plan,
and used to generate an editable persistent grocery checklist. **Recipe Chat** answers bounded,
read-only questions against saved recipes and links its citations to their recipe detail pages. The
owner-facing **Usage & Costs** page shows application activity and, only when separately configured,
safe Cloudflare and OpenAI reporting summaries.

Text, OCR, image extraction, and Recipe Chat use Worker-only OpenAI credentials. Local automated tests
use controlled doubles and make no OpenAI requests. Keep `OPENAI_API_KEY` only in an ignored local `.env`
variant; use `OPENAI_MODEL=gpt-5-mini` unless deliberately evaluating another model. Never use a
browser-prefixed variable or commit a credential.

## Validation

```powershell
npm run typecheck
npm run cf-typecheck
npm run build
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
npm run eval:recipe-chat:dry
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
manual save/search, text-import review/save, meal-plan and grocery-list behavior, Recipe Chat, and the
data-preserving rollback procedure described in
`specs/008-secure-deployment/quickstart.md`. Every Cloudflare, DNS, database, secret, and deployment action
requires separate owner approval at the time it runs.

Record deployment evidence and the current recovery version in the feature quickstart only; do not place
owner identities, API keys, session data, or private source material in Git.
