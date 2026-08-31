# Quickstart: TheMealDB Browse and Import

1. Open **Add Recipe** and choose **Browse TheMealDB**.
2. Select a category or area, or search by recipe name.
3. Open a result and confirm it displays TheMealDB attribution.
4. Leave the preview and confirm no recipe has been added to the library.
5. After the explicit-import slice is complete, choose Import, review/edit every field, then save.
6. Confirm the saved recipe identifies TheMealDB as its source.

Automated tests use controlled fixtures. Manual tests must never depend on a live provider response for
feature correctness.

## Local-development note

On this Windows development machine, the local Cloudflare `workerd` runtime cannot currently establish
an outbound TLS connection to TheMealDB, even though a direct Node request succeeds. The app therefore
shows its normal safe provider-unavailable state during a live local browse. This is a local-runtime
networking limitation, not a Recipeapp or provider-data failure; controlled Worker and Playwright tests
cover the complete browse-to-save workflow. Verify a live provider request after an approved deployment
to the protected production hostname.
