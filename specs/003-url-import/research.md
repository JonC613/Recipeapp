# Research: URL Recipe Import

## Decisions

### Fetches use an application-owned URL extractor with explicit redirect handling

- **Decision**: Validate each requested URL and each redirect target; use a manual redirect policy,
  an allow-listed request shape, a fixed redirect limit, timeout, and response-size limit.
- **Rationale**: Cloudflare Workers supports Fetch, and its Request guidance warns that automatic
  redirects can forward headers to another host. Manual policy keeps untrusted URLs constrained.
- **Alternatives considered**: Automatic redirects (rejected: destination cannot be revalidated);
  browser-side fetching (rejected: credentials/CORS and server-side safety boundary).

### Fetch policy is transparent and communicates site refusal clearly

- **Decision**: Send a truthful `Recipeapp URL Import` User-Agent, retain the minimal HTML Accept
  header, and map 401/403/429 responses to a non-retryable message that the site does not allow
  imports. Do not spoof browsers, rotate identities, or bypass access controls.
- **Rationale**: Some recipe publishers decline automated retrieval. Clear disclosure helps the cook
  choose manual entry while preserving publisher controls.
- **Alternatives considered**: Browser impersonation or proxying (rejected: bypasses the intended
  safety and publisher boundary); generic temporary-unavailable message (rejected: misleading).

### Recipe JSON-LD is parsed before any AI fallback

- **Decision**: Inspect `application/ld+json` blocks, recursively flatten arrays and `@graph`, and
  accept exactly one Schema.org Recipe item.
- **Rationale**: Schema.org defines Recipe ingredients and instructions as structured/free-text
  values and supports HowTo list forms; this preserves source data deterministically.
- **Alternatives considered**: Screen scraping (rejected: site-specific and brittle); AI fallback
  (deferred by approved scope).

### Import records retain source and extraction snapshot separately from recipes

- **Decision**: Store URL, status, raw extraction snapshot, created time, and optional safe failure
  reason in `recipe_imports`; never write `recipes` from this feature.
- **Rationale**: Enforces review-before-save and permits later audit/history.
- **Alternatives considered**: Recipe JSON snapshot only (rejected: lacks distinct import lifecycle).
