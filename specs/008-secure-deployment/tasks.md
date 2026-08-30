# Tasks: Secure Cloudflare Deployment

**Input**: Design documents from `/specs/008-secure-deployment/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [production access contract](contracts/production-access.md), and
[quickstart.md](quickstart.md)

**External-change safety**: Tasks marked **external Cloudflare/registrar change** create, modify, deploy,
or expose account resources. They require a fresh, explicit owner authorization immediately before they run,
even after implementation approval. Do not paste the owner email or provider secret into a repository file,
terminal argument, command output, or task record.

## Phase 1: Setup (Local Release Readiness)

**Purpose**: Confirm the exact local release candidate and deployment configuration before any account
change.

- [X] T001 Review `wrangler.jsonc`, `README.md`, `.gitignore`, and `specs/008-secure-deployment/contracts/production-access.md` against the custom-hostname, secret, and private-storage contract
- [X] T002 Run the full local release candidate suite from `specs/008-secure-deployment/quickstart.md` and record only pass/fail evidence in `specs/008-secure-deployment/quickstart.md`

---

## Phase 2: Foundational (Private Production Configuration)

**Purpose**: Commit and validate the non-secret routing configuration that allows only the exact custom
hostname and prevents a provider-assigned Worker application endpoint.

**⚠️ CRITICAL**: Do not execute any Cloudflare or registrar action until this phase is validated and the
owner grants a fresh external-change authorization.

- [X] T003 Add the exact custom-domain route and disable the provider-assigned Worker endpoint in `wrangler.jsonc`
- [X] T004 [P] Extend deployment-configuration validation for the custom-domain and provider-endpoint rules in `scripts/validate-config.mjs`
- [X] T005 [P] Update production deployment, secret, Access, and recovery guidance in `README.md`
- [X] T006 Run `npm run validate-config`, `npm run cf-typecheck`, and `npm run build` for the changed `wrangler.jsonc`

**Checkpoint**: The repository is a validated release candidate, but no Cloudflare, DNS, Access, D1, R2,
secret, or deployment change has happened.

---

## Phase 3: User Story 1 - Open the Private Recipe Library (Priority: P1) 🎯 MVP

**Goal**: The owner can open only `https://recipes.merkavaenterprises.com` after Cloudflare Access accepts
the one approved external-only email identity; unauthenticated visitors cannot reach the app or API.

**Independent Test**: In a clean browser, the exact hostname first shows the Access sign-in flow; the owner
signs in successfully and a non-approved identity cannot reach the Recipe Library or `/api/health`.

### Tests for User Story 1

- [X] T007 [US1] Verify active-zone ownership, hostname availability, and no conflicting `recipes` CNAME in the Cloudflare dashboard and document pass/fail only in `specs/008-secure-deployment/quickstart.md` **(external Cloudflare/registrar read-only check)**
- [X] T008 [US1] Create and verify the exact-hostname self-hosted Access application with one exact-email Allow policy from `specs/008-secure-deployment/contracts/production-access.md` in Cloudflare Zero Trust; keep the email external-only **(external Cloudflare change; fresh owner authorization required)**

### Implementation for User Story 1

- [X] T009 [US1] Confirm the configured Cloudflare Access sign-in method accepts the owner identity and record no email value in `specs/008-secure-deployment/quickstart.md` **(external Cloudflare change/check; fresh owner authorization required)**
- [X] T010 [US1] Configure the Worker-only `OPENAI_API_KEY` through Cloudflare secret management without echoing its value; because the command deploys a Worker version, treat it as the first protected production deployment and record its release identifier **(external Cloudflare secret and deployment change; fresh owner authorization required)**
- [X] T011 [US1] Apply reviewed committed D1 migrations to the existing remote `recipeapp-db` and confirm the backup/rollback prompt before the first production deployment **(external Cloudflare data change; fresh owner authorization required)**
- [X] T012 [US1] Verify the secret-created production release reaches only `recipes.merkavaenterprises.com`; do not perform a duplicate deploy unless a correction is required **(external Cloudflare deployment verification; fresh owner authorization required)**
- [X] T013 [US1] In clean owner and unauthenticated browser sessions, verify the Access deny/allow contract at the custom hostname in `specs/008-secure-deployment/contracts/production-access.md` **(external live verification)**

**Checkpoint**: The exact hostname is HTTPS-only and Access-protected, with no public provider-assigned
application endpoint.

---

## Phase 4: User Story 2 - Use Existing Recipes Safely in Production (Priority: P1)

**Goal**: The authorized owner can use the existing recipe workflows live without private-source or secret
exposure.

**Independent Test**: After owner sign-in, complete manual create → search → open and one controlled text
import → review → save flow at the protected hostname.

### Tests for User Story 2

- [X] T014 [US2] Execute and record the authorized live health, manual recipe, search, and controlled text-import/review/save smoke checks from `specs/008-secure-deployment/quickstart.md` **(external live verification)**
- [X] T015 [US2] Review authorized browser/network output for provider secrets, private source text, R2 keys, and public provider-address leakage using `specs/008-secure-deployment/contracts/production-access.md` **(external live verification)**

**Checkpoint**: The validated MVP works through its actual protected production boundary.

---

## Phase 5: User Story 3 - Recover from a Deployment Problem (Priority: P2)

**Goal**: The owner can recover a failed release while preserving D1 recipe data and private R2 sources.

**Independent Test**: Identify the current known-good release and verify the documented Cloudflare rollback
control and post-rollback Access/health checks without deleting data.

### Tests for User Story 3

- [X] T016 [US3] Record the known-good release identifier and the exact Cloudflare rollback/recheck procedure in `specs/008-secure-deployment/quickstart.md`
- [X] T017 [US3] Verify the rollback control can be located and that its procedure preserves D1/R2 resources before a recovery is needed in `specs/008-secure-deployment/quickstart.md` **(external Cloudflare read-only verification)**

**Checkpoint**: A safe, data-preserving recovery path is documented before the release is accepted.

---

## Phase 6: Polish & Completion

**Purpose**: Document actual deployment outcomes, keep credentials out of the repository, and update
Project Memory only after owner approval.

- [X] T018 [P] Update deployment outcomes and limitations in `specs/008-secure-deployment/spec.md`, `specs/008-secure-deployment/plan.md`, and `README.md` without recording secrets or owner identity
- [X] T019 Confirm `git diff --check`, `git status --short`, `.gitignore`, and built browser assets contain no secret value, owner email, or private source content
- [ ] T020 [P] Propose and, after owner approval, apply the durable deployment Project Memory update in `.sdd/memory/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts locally with no account change.
- **Foundational (Phase 2)**: Depends on Phase 1 and completes the safe committed release configuration.
- **US1 (Phase 3)**: Depends on Phase 2 and a fresh owner authorization for every external-change task.
- **US2 (Phase 4)**: Depends on the Access-protected known release from US1.
- **US3 (Phase 5)**: Depends on a deployed known-good release.
- **Polish (Phase 6)**: Depends on the required live checks and approved memory update.

### User Story Dependencies

- **US1 (P1)**: Delivers the protected hostname and must complete before live product checks.
- **US2 (P1)**: Uses US1's protected release; it does not change the application.
- **US3 (P2)**: Uses the known-good release from US1 and completes the recovery evidence.

### Parallel Opportunities

- T004 and T005 can proceed in parallel after the routing design is agreed.
- T007 is a read-only account check and can precede, but not replace, approval for T008–T012.
- T014 and T015 can proceed together after US1 accepts the protected release.
- T018 and T020 can be prepared in parallel only after live outcomes are known; T020 requires owner
  approval before any memory write.

---

## Implementation Strategy

### Local-First Release Candidate

1. Validate the current local release and commit only the safe custom-domain/public-endpoint configuration.
2. Stop and obtain fresh approval before the first Cloudflare or registrar modification.
3. Configure Access before treating the custom hostname as release-ready.
4. Review and confirm remote D1 migrations, then securely configure the secret as the first protected production deployment; verify Access denial before authorized smoke tests.

### Safety Rules

- Never deploy to a provider-assigned public Worker address.
- Never commit, print, or place the owner email or provider key in a task artifact.
- Never recreate, delete, or bulk-reset D1/R2 resources.
- On a failed smoke check, keep Access enabled and roll back the Worker release; do not use data deletion as
  recovery.

## Notes

- Wrangler `secret put` deploys a Worker version. The owner-approved sequence is migration first, then secure secret configuration as the first protected production deployment.
- All tasks use the required checklist format and exact repository paths.
- Tasks T008–T012 are external account changes and need a fresh owner authorization at execution time.
- Deployment is not complete until Access deny/allow, authorized MVP smoke, recovery documentation, and
  an approved Project Memory update have completed.
