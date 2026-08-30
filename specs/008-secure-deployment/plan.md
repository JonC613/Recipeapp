# Implementation Plan: Secure Cloudflare Deployment

**Branch**: `008-secure-deployment` | **Date**: 2026-08-30 | **Version**: 1.1 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-secure-deployment/spec.md`

## Summary

Deploy the existing Recipeapp Worker and static assets solely at `recipes.merkavaenterprises.com` with
private, hostname-based Cloudflare Access. The plan keeps the source repository free of the owner's email
and provider key, reuses the existing D1/R2 bindings, applies committed D1 migrations remotely with a
backup-aware confirmation step, and verifies the live application only after the exact hostname is
protected. No application feature, database schema, or import workflow changes are needed.

**Release outcome (2026-08-30)**: The protected Worker release, remote migrations, owner sign-in,
unauthenticated Access redirect, manual save/search, and controlled text-import review/save all passed.
The recovery procedure identifies the deployed version without recording an owner identity or secret.

## Technical Context

**Language/Version**: TypeScript 5.9; React/Vite browser application; Cloudflare Worker runtime

**Primary Dependencies**: Wrangler 4.127, Cloudflare Workers/Static Assets, D1, R2, Cloudflare Access

**Storage**: Existing remote D1 database `recipeapp-db` and private R2 bucket `recipeapp-sources`; no
schema or object-key migration is introduced

**Testing**: Existing build/type/lint/component/Worker/D1/Playwright suites; manual Cloudflare dashboard,
DNS, Access, production smoke, unauthorized-access, and recovery checks

**Target Platform**: `https://recipes.merkavaenterprises.com` on a Cloudflare-managed
`merkavaenterprises.com` zone

**Project Type**: Single-repository web application and external cloud deployment configuration

**Performance Goals**: The authorized owner reaches the library after Access sign-in and completes the
smoke journey in under 10 minutes; unauthorized requests are stopped before application content is served

**Constraints**: Custom hostname only; disable provider-assigned public Worker endpoint; one owner-only
Access Allow policy; server-only provider secret; R2 remains private; remote D1 migration requires review
and confirmation; no external account/resource mutation until explicit implementation approval

**Scale/Scope**: One Worker, one hostname, one owner identity, existing D1/R2 resources, one production
release and rollback rehearsal; staging, collaboration, CI/CD, and public sharing are out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Deployment response | Gate |
|-----------|---------------------|------|
| I. Deliver Working Vertical Slices | The release is validated through the existing UI → Worker → D1/R2 path under actual Access protection. | Pass |
| II. Preserve a Stable Recipe Domain | Use only committed migrations; do not change recipe/import models. | Pass |
| III. Preserve Import Provenance and Require Review | Existing review approval and private R2 source retention remain unchanged. | Pass |
| IV. Prefer Deterministic Extraction; Constrain AI | Deploy existing Worker-only AI boundaries; do not add automatic AI behavior. | Pass |
| V. Keep Providers and Search Replaceable | No provider/search implementation changes. | Pass |
| VI. Protect Secrets and User Data | Disable provider-assigned endpoint, use hostname Access, server-side secret configuration, and private R2 only. | Pass |
| VII. Verify Behavior at Every Boundary | Local regression, remote migration confirmation, Access denial, authorized smoke, and recovery checks are required. | Pass |
| VIII. Control Scope and Complexity | One production hostname and owner policy; no staging, multi-user auth, CI/CD, or unrelated feature work. | Pass |

**Post-design re-check**: Pass. No constitutional exception is needed; external account changes remain
separately approval-gated.

## Approved Implementation Amendment — 2026-08-30

Current Wrangler behavior means `wrangler secret put` creates and deploys a Worker version; it is not a
secret-only operation. The owner approved this adjustment: apply the reviewed remote D1 migrations first,
then use secure secret configuration as the first protected production deployment, followed by live Access
and product verification. No secret value, owner identity, or unrelated DNS record is recorded here.

## Project Structure

### Documentation (this feature)

```text
specs/008-secure-deployment/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
```text
src/
└── app/                                # Existing browser application; no source behavior change

worker/
└── index.ts                             # Existing Worker entry point; no route behavior change

wrangler.jsonc                           # Custom-domain and public-endpoint deployment controls
migrations/                              # Existing ordered D1 migrations applied remotely
specs/008-secure-deployment/             # Deployment/runbook artifacts
```

**Structure Decision**: Keep the single Worker and static-assets deployment. Add only the production
routing controls necessary for a custom domain and no public provider-assigned endpoint; Cloudflare Access
and the owner email are account configuration, not committed application data.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
