# Feature Specification: Secure Cloudflare Deployment

**Feature Branch**: `008-secure-deployment`

**Created**: 2026-08-30

**Status**: Protected production release deployed and live smoke validated; Project Memory update pending

**Input**: User description: "Deploy the completed Recipeapp MVP to Cloudflare on an owner-controlled
custom hostname, protected by Cloudflare Access."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the Private Recipe Library (Priority: P1)

As the owner, I can open Recipeapp from my chosen custom web address and use the deployed library after
Cloudflare verifies my identity.

**Why this priority**: The app is intended for personal use, so a live deployment is useful only when the
owner can reach it without unintentionally making recipes or AI-backed imports public.

**Independent Test**: Visit the configured address in a clean browser session, complete the owner's sign-in
method, and verify the Recipe Library opens over HTTPS.

**Acceptance Scenarios**:

1. **Given** the owner opens the chosen custom address, **When** they complete the approved identity check,
   **Then** they reach the Recipe Library over HTTPS.
2. **Given** a visitor has not completed the identity check, **When** they open the same address, **Then**
   they cannot reach application pages or API responses.

---

### User Story 2 - Use Existing Recipes Safely in Production (Priority: P1)

As the owner, I can create, import, review, save, search, edit, favorite, and delete recipes in the live
application without exposing provider credentials or private PDF sources.

**Why this priority**: A deployment is only successful when the completed MVP works with its real
production bindings and preserves the existing privacy boundaries.

**Independent Test**: After authorized sign-in, complete a controlled manual recipe and text-import flow,
then verify saved data, search, and approved recipe review work as expected.

**Acceptance Scenarios**:

1. **Given** the owner is authorized, **When** they use an existing MVP workflow, **Then** it behaves like
   the validated local workflow.
2. **Given** an original PDF source or AI-backed import exists, **When** the owner uses the library,
   **Then** private source data and provider credentials are not visible in the browser or public address.

---

### User Story 3 - Recover from a Deployment Problem (Priority: P2)

As the owner, I can identify a failed live health check or deployment and return the site to its last known
working release without exposing the application while investigating.

**Why this priority**: Deployment changes touch data, files, domain routing, and access control; a safe
recovery path protects the personal library.

**Independent Test**: Confirm the deployment records a release identifier and that the owner can use the
documented Cloudflare recovery action to return to the prior known working release.

**Acceptance Scenarios**:

1. **Given** a new deployment fails its smoke check, **When** the owner chooses recovery, **Then** the
   last known working application is restored without deleting recipe data or original source files.

### Edge Cases

- The custom domain does not point to Cloudflare yet.
- The chosen hostname is already used by another service.
- The owner signs in with an identity not present in the Access Allow policy.
- A deployment is attempted before required database, private file storage, or provider-secret settings
  are available.
- The live health check fails after a deployment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST be deployed only to an owner-controlled custom hostname, not a
  provider-assigned public address.
- **FR-002**: The system MUST require Cloudflare Access verification before serving application pages or
  API responses from the custom hostname.
- **FR-003**: The Access policy MUST allow only the owner's approved identity.
- **FR-004**: The deployed application MUST use a production database and private original-source storage
  without making private source objects publicly addressable.
- **FR-005**: The deployed application MUST retain the provider credential only in server-side secret
  configuration and MUST NOT expose it in browser code, source control, logs, or responses.
- **FR-006**: Before the custom hostname is treated as ready, the owner MUST complete a live smoke check
  covering identity protection, health, manual recipe creation, recipe search, and one controlled
  AI-backed import/review path.
- **FR-007**: The owner MUST have a documented release-recovery procedure that preserves deployed recipe
  data and private source files.
- **FR-008**: Production deployment MUST NOT silently change the product scope, recipe schema, import
  approval workflow, search behavior, or owner access policy.

### Key Entities *(include if feature involves data)*

- **Deployment release**: A distinct deployed version that can be identified during smoke checks and
  selected for recovery.
- **Protected hostname**: The owner-controlled address through which the application is available only
  after the approved identity check.
- **Owner identity**: The single email identity permitted by the Access Allow policy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated browser cannot load an application page or receive an application API
  response from the protected hostname.
- **SC-002**: The approved owner can open the Recipe Library over HTTPS and complete the live smoke check
  in under 10 minutes.
- **SC-003**: All live smoke-check workflows preserve review-before-save behavior and do not expose a
  provider credential or private source-file reference.
- **SC-004**: A documented recovery action can restore the previous working release without deleting
  recipe records or private original-source files.

## Assumptions

- The owner controls a domain through Namecheap or another registrar and can add the requested DNS records.
- The existing Cloudflare account will own the production Worker, database, source-file storage, and Access
  configuration.
- The owner will separately approve every external Cloudflare account change and provider-secret entry.
- No authentication accounts, collaborators, public sharing, or new application user roles are introduced.

## Open Decision

- **Production hostname**: `recipes.merkavaenterprises.com`. This is the owner-controlled hostname that
  determines the DNS record and Cloudflare Access application boundary.
- **Owner identity**: One owner-supplied Gmail identity will be the sole Cloudflare Access Allow-policy
  subject. Its exact email address is deployment configuration, not repository content, and must not be
  committed, logged, or exposed by the application.

## Approved Implementation Amendment — 2026-08-30

The first production deployment will be created by secure Worker secret configuration after the reviewed
remote D1 migration. This reflects current Wrangler behavior: the secret operation creates and deploys a
Worker version. The deployment remains limited to the configured protected hostname.
