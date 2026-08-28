# Quickstart: Validate Recipe Library CRUD

## Prerequisites

- Node.js 22.12 or later and npm
- Dependencies installed with `npm ci`
- No Cloudflare credentials or remote database access required

## Run local validation

```powershell
npm run typecheck
npm run cf-typecheck
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
```

Expected result: Foundation checks and new recipe-domain, Worker, D1 integration, and browser journeys pass using only local simulated bindings. On 2026-08-28, the responsive suite passed at 320, 768, and 1440 CSS pixels (24 checks).

## Run the app locally

```powershell
npm run dev
```

At 320, 768, and 1440 CSS pixels: save a titled manual recipe with lists and optional metadata; open it to confirm ordering and original ingredient text; edit, favorite, unfavorite, title-filter, and delete it; then verify the missing-record recovery state.

Use [recipes.openapi.yaml](contracts/recipes.openapi.yaml) for API expectations and [data-model.md](data-model.md) for persistence and ordering expectations.

## Remote safety

Do not deploy as part of this feature. Deployment remains deferred until an owner-controlled custom hostname, Cloudflare Access with an owner-restricted policy, and separate authorization exist.
