# Phase 1 Data Model: Application Foundation

## Scope

Feature 001 creates no persistent recipe-domain entities and no database schema. D1 and R2 are
configured and validated as platform bindings only. Recipe, ingredient, instruction, source, and
import entities begin in later approved features.

## Transient Model: Service Availability

Represents the browser's current knowledge of the Worker service.

| Field | Type | Rules |
|---|---|---|
| `state` | `idle | checking | available | unavailable` | Required; starts as `idle`. |
| `message` | string or absent | User-facing, non-sensitive, and present when `unavailable`. |
| `retryable` | boolean | `true` for recoverable network or service failures. |

### State transitions

```text
idle -> checking
checking -> available
checking -> unavailable
unavailable -> checking
available -> checking
```

Unexpected response shapes and timeouts transition to `unavailable`; raw response bodies, stack
traces, and configuration details are never copied into `message`.

## Contract Model: Health Response

| Field | Type | Rules |
|---|---|---|
| `status` | literal `ok` | Required for a successful health response. |

The health response intentionally omits timestamps, deployment identifiers, binding names, account
details, and dependency diagnostics. Its full external representation is defined in
[contracts/health.openapi.yaml](contracts/health.openapi.yaml).

## Contract Model: Safe Error

| Field | Type | Rules |
|---|---|---|
| `error.code` | stable string enum | Public allow-listed code; Foundation uses `NOT_FOUND`, `METHOD_NOT_ALLOWED`, and `SERVICE_UNAVAILABLE`. |
| `error.message` | string | Human-readable, non-sensitive summary. |
| `error.retryable` | boolean | Indicates whether retry is an appropriate recovery action. |

Internal exception messages are logged only through an explicit sanitized path and are never used as
the public message.

## Persistence and Migration Decision

- No D1 tables are created in Feature 001.
- No R2 objects are retained by Feature 001.
- Binding integration tests may create isolated local test data and MUST remove or reset it within
  the test harness.
- `migrations/` remains empty until Feature 002 defines the recipe domain.
