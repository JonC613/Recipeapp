# Quickstart: Secure Cloudflare Production Release

## Preconditions

1. Confirm local build, Cloudflare typecheck, lint, component, Worker, D1 integration, and end-to-end
   checks are green on the exact commit to release.
2. Confirm `merkavaenterprises.com` is an active zone in the intended Cloudflare account. If the domain is
   still DNS-hosted only at Namecheap, first complete the registrar-to-Cloudflare nameserver change; do not
   create conflicting records for `recipes`.
3. Confirm the existing remote D1 database and private R2 bucket named in `wrangler.jsonc` are the intended
   production resources. Do not recreate either resource.
4. Configure the self-hosted Access application and exact-email Allow policy for
   `recipes.merkavaenterprises.com`; verify the owner's configured identity provider before releasing.
5. Add the Worker-only `OPENAI_API_KEY` using Cloudflare secret management. Do not paste it into a source
   file, terminal transcript, or repository setting. This operation creates the first protected production
   Worker release.

## Local release-candidate evidence

Validated on 2026-08-30 after the custom-domain configuration change:

- `npm run validate-config`, `npm run cf-typecheck`, and `npm run build` passed.
- Component tests: 14 passed; Worker tests: 44 passed; D1 integration tests: 16 passed; responsive
  Playwright tests: 57 passed.
- Lint completed with three existing React effect warnings and no errors.
- No Cloudflare, registrar, D1, R2, Access, secret, or deployment action was performed during this check.

## External readiness evidence

- The `merkavaenterprises.com` zone is active and `recipes.merkavaenterprises.com` had no conflicting DNS
  record or Worker route before release.
- The existing private `recipeapp-sources` R2 bucket and remote `recipeapp-db` D1 resource were confirmed.
- The exact-hostname Access application and one owner-only Allow policy were configured outside the
  repository.
- On 2026-08-30, the approved remote migration run applied `0001_recipe_library.sql` through
  `0006_pdf_ocr_attempts.sql` successfully to `recipeapp-db`.
- The first protected release completed on 2026-08-30. Release identifier:
  `ab28994a-0e79-4993-9abc-5d8e693d1f59`.
- Owner Access sign-in reached the Recipe Library. An independent unauthenticated request was redirected to
  the Cloudflare Access login boundary before application content was served.
- Authorized live smoke passed: existing library loaded; a manual recipe was saved and found by search;
  controlled pasted-text extraction produced a reviewable draft and saved only after explicit review.
- Rendered authorized application pages contained no provider key, R2 object key, or provider-response
  payload. The unauthenticated response redirected to Access before returning application content.

## Release sequence

1. Review the remote D1 migration list; approve only the committed migrations and confirm the generated
   backup/rollback behavior.
2. Securely configure the Worker secret; this creates the production Worker/static-assets release with the
   custom-domain and provider-endpoint protections described in
   [production-access.md](contracts/production-access.md).
3. Record the deployed release identifier and time as the candidate known-good release.
4. In a clean browser session, verify Access blocks unauthenticated access. Then sign in as the owner and
   complete health, manual recipe, search, and controlled text-import/review/save checks.
5. Confirm original PDF/R2 data and provider secrets are not exposed in browser content or network output.
6. Mark the release known-good only after every check succeeds.

## Recovery

If any protected-hostname or smoke check fails, keep Access enabled, select the last known-good Worker
release in Cloudflare, and retest the blocked and authorized paths. The current known-good release is
`ab28994a-0e79-4993-9abc-5d8e693d1f59`.

The owner can locate releases in the Cloudflare Worker deployment history or, from this repository, run
`npx wrangler deployments list --name recipeapp`. To restore a later failed release, obtain fresh owner
approval and run `npx wrangler rollback <known-good-version-id> --name recipeapp --message "rollback"`,
then repeat the unauthenticated Access and authorized health checks. Do not delete or recreate D1/R2 as a
recovery action. Record the failed release identifier and stop for investigation if recovery does not
restore the prior behavior.
