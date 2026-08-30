# Production Access and Release Contract

## Hostname

- **Only application hostname**: `https://recipes.merkavaenterprises.com`
- **Public Worker endpoint**: Disabled; a provider-assigned `workers.dev` URL must not be treated as an
  application entry point.
- **Certificate**: Valid HTTPS certificate for the exact hostname.

## Access policy

- **Application type**: Cloudflare Access self-hosted application.
- **Domain**: Exact hostname `recipes.merkavaenterprises.com` covering all application paths and API paths.
- **Policy**: One `Allow` action that includes one exact owner email address supplied directly to Cloudflare.
- **Forbidden settings**: `Everyone`, `All valid emails`, a domain-wide email rule, a bypass policy, or a
  second allowed user without a later approved amendment.
- **Sign-in verification**: The selected Access identity provider must successfully authenticate the owner
  email before release is accepted.

## Resource and secret contract

- D1 binding remains `DB` and resolves to the existing remote `recipeapp-db` after all committed migrations
  are reviewed and applied.
- R2 binding remains `RECIPE_SOURCES` and resolves to the private `recipeapp-sources` bucket.
- `OPENAI_API_KEY` is a required Worker secret. Its value is entered only through Cloudflare's secret
  management flow and never placed in Git, browser assets, or command history.

## Release acceptance

| Check | Expected result |
|-------|-----------------|
| Incognito request without Access session | Access sign-in appears; no Recipeapp page or `/api` data is returned |
| Owner sign-in | Owner reaches the Recipe Library at the exact HTTPS hostname |
| Health | Authorized `GET /api/health` returns the existing safe healthy response |
| MVP smoke | Manual save, search, and one controlled text import → review → save complete successfully |
| Privacy | Browser/network output reveals no provider secret, PDF source text, R2 object key, or provider-assigned public application URL |
| Recovery | A failed release can be replaced by the recorded prior known-good release with D1 and R2 data retained |
