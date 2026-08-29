# Research: Text Recipe Import

## Model and endpoint

**Decision**: OpenAI Responses API with configurable default `gpt-5-mini`.

**Rationale**: Extraction is a precise structured task. The model supports Responses and Structured
Outputs and is cost-sensitive ($0.25/M input and $2/M output tokens when researched).

**Alternatives considered**: Larger models cost more; nano needs fixture-based quality proof; a dated
snapshot improves reproducibility but complicates intentional upgrades.

Source: [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini)

## Structured extraction

**Decision**: Strict JSON Schema with outcome `recipe`, `not_recipe`, or `multiple_recipes` and a nullable
recipe object. Map nulls to absent fields, then apply application-owned draft validation.

**Rationale**: Structured Outputs provides schema conformance and detectable refusals. Application
validation protects the provider-neutral domain; the outcome prevents silent recipe merging.

**Alternatives considered**: Free-form JSON is unreliable; function calling is unnecessary; direct
persistence of provider output violates the constitution.

Source: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

## Provider boundary

**Decision**: `RecipeParser.parse(ExtractedContent): Promise<RecipeParseResult>` with a native Worker
`fetch` adapter and deterministic test doubles.

**Rationale**: One operation does not justify an SDK or provider framework. OpenAI shapes remain isolated.

**Alternatives considered**: The JS SDK adds a dependency; generic provider frameworks are speculative;
browser calls expose credentials.

## Prompt, errors, and spend

**Decision**: One explicit call, no automatic retry. Instructions prohibit invention, preserve ingredient
wording/order, distinguish notes, treat source as untrusted data, and classify non/multiple recipes.
Refusal, invalid output, timeout, rate limit, and provider errors map to safe allow-listed outcomes.

**Rationale**: This bounds spend and keeps retry user-controlled without leaking provider/source details.

## Secrets

**Decision**: Required Worker secret `OPENAI_API_KEY`; optional non-secret `OPENAI_MODEL` defaults to
`gpt-5-mini`. Local ignored dotenv files are used; no remote secret or deployment occurs.

**Rationale**: Cloudflare loads local secrets from `.dev.vars` or `.env` variants and requires deployed
credentials to use secrets rather than plaintext configuration.

Source: [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Persistence

**Decision**: Migration `0004_text_imports.sql` rebuilds `recipe_imports` to allow `url|text`, nullable
`source_url`, and retained `raw_text`, copying rows and recreating both indexes.

**Rationale**: SQLite cannot widen the current source-type CHECK in place. Rebuild preserves URL history
and approval links while keeping one import model.

**Alternatives considered**: A second table duplicates workflows; arbitrary source JSON weakens
constraints; dropping old rows violates provenance.
