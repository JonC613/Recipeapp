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
edit it, favorite it, filter by title, and deliberately delete it. You can also choose **Import from URL**
from the manual-recipe page, paste a public recipe URL, and receive an unsaved deterministic draft. URL
imports use only published Recipe JSON-LD; they do not use AI or automatically save a library recipe.
If a page does not publish a usable recipe, blocks imports, or is temporarily unavailable, use the safe
message shown to retry another URL or enter the recipe manually. A retained ready draft can be reopened
from its import result link. Local preview applies the committed
D1 migration automatically; if recipe data looks stale, restart `npm run dev` or `npm run preview`.

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

Recipeapp is intentionally local-only until an owner-controlled custom hostname is available. Do
not deploy it to a public provider-assigned address. Before a future deployment, configure
Cloudflare Access for the custom hostname with an Allow policy restricted to the owner's approved
email identity, then obtain separate deployment approval.
