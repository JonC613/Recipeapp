# Research: Recipe Library CRUD

## Decisions

### Use a committed D1 SQL migration and normalized child records

**Decision**: Create the recipe schema through a numbered SQL migration with separate ordered ingredient and instruction records plus a tag association table.

**Rationale**: D1 migrations are tracked by Wrangler and D1 enforces foreign keys. Normalized child records preserve order and original ingredient text without embedding provider-shaped JSON into the durable recipe model.

**Alternatives considered**: A single JSON recipe record would complicate title filtering and later migrations. An ORM would add an unjustified abstraction for this small query surface.

### Use recipe-level transactional writes and cascaded child cleanup

**Decision**: Create, replace, and delete a recipe together with its child records as one recipe-level database operation, with cascade deletion for ingredients, instructions, and tags.

**Rationale**: A user must not observe a saved recipe whose metadata and child lists disagree. D1 enforces foreign keys by default.

**Alternatives considered**: Independent child mutations risk inconsistent state after a failure. Soft deletion is outside the approved permanent-deletion behavior.

### Keep title filtering as a simple, isolated database query

**Decision**: Implement only case-insensitive, trimmed partial title filtering in the library query.

**Rationale**: It satisfies rediscovery now and leaves broader ingredient, tag, category, cuisine, and semantic search free for Feature 007.

### Test through local D1 simulations

**Decision**: Apply the migration to isolated local D1 state in Worker and integration tests; never point tests at the provisioned remote database.

**Rationale**: Wrangler defaults local bindings to simulated resources, and the Workers Vitest integration offers isolated per-test-file storage.

## Sources

- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
- [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
