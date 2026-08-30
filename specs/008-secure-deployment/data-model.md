# Deployment Data Model

This feature creates no Recipeapp application tables, recipe fields, import fields, migrations, or public
API records. It uses external configuration inventory only.

| Entity | Required state | Sensitive content handling |
|--------|----------------|----------------------------|
| Protected hostname | `recipes.merkavaenterprises.com` is a custom domain attached to the Worker | Public hostname; no provider address is published |
| Cloudflare zone | `merkavaenterprises.com` is active in the selected Cloudflare account | Account administration only |
| Access application | Self-hosted application covers the exact production hostname | Configuration must have one exact-email Allow policy; email stays out of Git |
| Owner identity | One owner-supplied Gmail identity may sign in | Configure only in Cloudflare Access; never commit or log it |
| Worker secret | `OPENAI_API_KEY` is present as a Worker secret before release | Value never appears in source, command output, or browser assets |
| D1 database | Existing `recipeapp-db` has every committed migration applied | Review/confirm remote migration; do not recreate it |
| R2 bucket | Existing `recipeapp-sources` is bound and private | No public bucket access or object URL is created |
| Release | Deployable Worker/static-assets version with a recorded identifier | Previous known-good release remains available for rollback |

## State transitions

```text
Local validated → zone/Access/secret readiness verified → remote D1 migration reviewed and applied
→ protected custom-domain release → authorized smoke check → known-good release
                                      ↓
                              failed smoke → rollback → recheck Access and health
```

No deployment transition changes the approved Recipe, RecipeImport, or PDF/OCR persistence model.
