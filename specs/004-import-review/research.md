# Research: Import Review and Save

## Decisions

### Review starts from an immutable import snapshot

- **Decision**: Load only ready retained imports into an in-memory editable review form; do not write
  draft edits back to the import record.
- **Rationale**: The constitution requires three distinct layers—source, extraction, and user-approved
  recipe—so edits must become a separate approved recipe only after explicit save.
- **Alternatives considered**: Updating the draft in place (rejected: destroys the extraction snapshot);
  creating a second draft history mechanism (rejected: speculative scope before version history exists).

### Approval is an explicit, one-time import-to-recipe transition

- **Decision**: Add a nullable unique approved-recipe reference to each import and create the recipe and
  reference as one atomic persistence operation.
- **Rationale**: It prevents duplicate saves while preserving one immutable import record and one normal
  approved recipe.
- **Alternatives considered**: Client-only disabling (rejected: retries and concurrent requests can still
  duplicate); allowing repeated approvals (rejected: violates explicit one-time approval behavior).

### The existing recipe editor supplies review fields

- **Decision**: Extend the existing recipe-form boundary for imported initial values and optional favorite
  selection rather than create a second recipe editor.
- **Rationale**: Manual creation and review must share validation, ordered list handling, and visual
  behavior.
- **Alternatives considered**: A separate import editor (rejected: duplicated validation and divergent
  controls); saving then editing (rejected: would put unreviewed data in the library).

### Saved recipes retain URL source provenance

- **Decision**: Create the approved recipe with the import's source type and URL while retaining the
  original import snapshot separately.
- **Rationale**: The saved recipe remains attributable to its source without turning the import record
  into mutable recipe data.
- **Alternatives considered**: Marking every approved import as manual (rejected: loses useful source
  provenance); copying the whole snapshot into recipe metadata (rejected: duplicates audit data).
