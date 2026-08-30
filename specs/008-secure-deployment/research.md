# Research: Secure Cloudflare Deployment

## Decision: Use a Worker Custom Domain, not a Worker route

**Rationale**: Recipeapp itself is the hostname's origin. Cloudflare documents Custom Domains as the
appropriate choice in that situation and can create the DNS record and certificate for an active zone.
The hostname is exactly `recipes.merkavaenterprises.com`; it cannot coexist with an existing CNAME record.

**Alternatives considered**:

- Worker route: rejected because routes are for traffic in front of an existing origin and require a
  proxied DNS record.
- Provider-assigned Worker address: rejected by the approved specification because the private application
  must not be exposed through a public provider address.

## Decision: Use hostname-based Cloudflare Access with one exact-email Allow policy

**Rationale**: Cloudflare Access self-hosted applications can protect a specific hostname. An Allow policy
using the exact owner email restricts access more tightly than a domain-wide rule. The email itself remains
external account configuration and is not committed.

**Alternatives considered**:

- Allow every valid email or every user: rejected because Cloudflare identifies both as public-access
  misconfigurations.
- Application-owned authentication: rejected because the approved scope is Cloudflare Access protection,
  not a new user-account system.

## Decision: Use Cloudflare's available email sign-in method and verify it before release

**Rationale**: Cloudflare's current Access setup supports its Cloudflare identity provider and optional
email one-time PIN login. The plan will use the configured account method that permits the owner-supplied
email, and will stop if the owner cannot complete a test sign-in.

**Alternatives considered**:

- Assume email OTP is enabled: rejected because new organizations can have a different default provider.
- Add a third-party identity provider: rejected because it adds unneeded account integration for one owner.

## Decision: Apply committed D1 migrations remotely only after local validation and release review

**Rationale**: Wrangler's remote D1 migration command prompts for confirmation, takes a backup, and rolls
back a failing migration. Reviewing its plan before confirmation preserves the existing recipe and import
data.

**Alternatives considered**:

- Recreate the production database: rejected because it destroys retained recipes and source associations.
- Manually execute untracked SQL: rejected because the constitution requires committed migrations.

## Decision: Keep provider credentials and original PDFs out of deployment artifacts

**Rationale**: Required secret names are already declared in Wrangler configuration, while values belong in
Cloudflare's secret store. Existing R2 sources remain private and are accessed only through Worker bindings.

**Alternatives considered**:

- Commit a production environment file: rejected because it exposes credentials.
- Make R2 public for troubleshooting: rejected because original PDFs are private user source material.
