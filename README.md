# Recipe Library

A mobile-first personal library for recipes worth making again.

## Local development

```powershell
npm ci
npm run cf-typegen
npm run dev
```

The Worker and its D1/R2 bindings run locally by default; Cloudflare credentials are not needed for local work.

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
