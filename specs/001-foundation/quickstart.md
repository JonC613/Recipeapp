# Phase 1 Quickstart: Validate Application Foundation

This guide defines the runnable checks that must pass after Feature 001 implementation. It does not
authorize implementation or remote resource creation.

## Prerequisites

- Node.js 22 LTS, version 22.12 or newer
- npm
- Git
- A Cloudflare account with Workers, D1, and R2 access for remote resource provisioning
- A modern Chromium browser for browser and end-to-end tests

## 1. Install and validate configuration

From the repository root:

```powershell
npm ci
npm run cf-typecheck
npm run typecheck
```

Expected result: dependencies install from the lockfile, generated Worker types match
`wrangler.jsonc`, and TypeScript reports no errors. If required configuration is missing, the command
must fail with an actionable message.

## 2. Run locally

```powershell
npm run dev
```

Open the documented local URL and verify:

1. `/` displays the Recipe Library shell.
2. `/api/health` returns JSON matching [health.openapi.yaml](contracts/health.openapi.yaml).
3. An unknown browser route displays the in-app not-found page and offers a Home link.
4. At 320, 768, and 1440 CSS pixels, the page has no horizontal scrolling.
5. Stopping or blocking the service request produces a safe Retry experience.

## 3. Run automated checks

```powershell
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
```

Expected result:

- Browser component tests verify semantic landmarks, skip navigation, responsive shell states, and
  safe retry/not-found experiences.
- Worker tests verify the health and safe-error contracts.
- Integration tests build the deployable output and verify local D1/R2 binding availability and
  `/api/*` Worker-first routing without retaining test data.
- End-to-end tests verify the approved local Foundation journeys in desktop and mobile projects.

## 4. Build and preview production output

```powershell
npm run build
npm run preview
```

Against the preview URL, repeat the root, `/api/health`, direct unknown-route, and mobile checks.
Direct navigation to `/api/unknown` must return a JSON API error, never the SPA HTML document.

## 5. Provision remote resources

Remote provisioning is required once per target account/environment and changes Cloudflare state:

```powershell
npx wrangler login
npx wrangler d1 create recipeapp-db
npx wrangler r2 bucket create recipeapp-sources
npx wrangler types
```

Record the returned D1 identifier and R2 bucket name in `wrangler.jsonc`. These identifiers are not
secrets. Do not place tokens or credentials in the file.

## 6. Future Access-gated deployment and verification

Do not deploy while the app has only a provider-assigned public address. Before this step, the
project owner must connect an owner-controlled custom domain to Cloudflare and configure a
Cloudflare Access self-hosted application for the chosen hostname. Its Allow policy must list only
the owner's approved email identity; an `Everyone` policy or unrestricted One-time PIN policy is
not acceptable.

After that configuration and a separate deployment authorization:

```powershell
npm run deploy
```

After deployment, set the returned address for deployed smoke tests:

```powershell
$env:E2E_BASE_URL = 'https://recipes.<your-domain>'
npm run test:e2e:deployed
```

Expected result: the same read-only Foundation smoke journey passes through Cloudflare Access. The
deployed test must not create D1 rows or R2 objects.

## Acceptance Evidence

Capture these outputs for Feature 001 completion:

- Successful typecheck, unit/component, Worker, integration, and E2E summaries
- Successful production build
- Local preview acceptance at 320, 768, and 1440 CSS pixels
- Access-protected deployed URL and read-only deployed smoke result, when remote deployment is
  later authorized
- Confirmation that no secrets appear in client assets or visitor-facing errors

## Local Validation Record

- 2026-08-27: Typecheck, Worker contracts, local D1/R2 integration, browser component tests, and
  Playwright checks at 320, 768, and 1440 CSS pixels passed. D1 and R2 resources are provisioned.
  Remote deployment verification is deferred until an owner-controlled hostname and Cloudflare
  Access are configured.
