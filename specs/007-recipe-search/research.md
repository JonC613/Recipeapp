# Research: Recipe Search

## Decision: Use one unified keyword with optional field filters

**Rationale**: The existing library already has a title-only query parameter and page control. Extending it
to a keyword across the five required saved-recipe fields keeps the primary action simple, while separate
optional filters let a cook deliberately narrow results. Each active criterion is conjunctive, which is
predictable and directly satisfies the feature requirements.

**Alternatives considered**:

- Client-side filtering after loading every recipe: rejected because it weakens the established Worker/D1
  boundary and becomes less useful as the personal library grows.
- One search field only with no filters: rejected because it does not fulfill the approved filtering scope.
- Full-text, semantic, or vector search: rejected because it is explicitly outside the MVP and adds
  premature infrastructure.

## Decision: Query saved recipe records and child ingredient/tag rows only

**Rationale**: Title, cuisine, and category belong to saved recipes; ingredients and tags belong to their
saved child rows. Querying these records can return matching recipe summaries without reading import
history, source text, R2 metadata, or provider content.

**Alternatives considered**:

- Search import drafts or source snapshots: rejected because only approved recipes belong in the library
  and import provenance must remain private from discovery results.
- Duplicate search text into a new denormalized table: rejected for the personal-MVP scale because it
  adds migration and synchronization work before a demonstrated need.

## Decision: Normalize and validate criteria at the Worker boundary

**Rationale**: Leading/trailing whitespace and case differences should not change results. The Worker can
trim, collapse repeated whitespace, reject malformed favorite values, and bind every user value rather
than interpolating it into a query.

**Alternatives considered**:

- Trust browser-normalized values: rejected because direct API calls must be equally safe and consistent.
- Interpret query text as query syntax: rejected because ordinary cooks expect literal recipe words and
  executable query language would add injection and usability risk.

## Decision: Keep current updated-at result order

**Rationale**: The library currently shows most recently changed recipes first. Preserving that order avoids
an unrelated ranking decision and makes search results stable until the product needs explicit sorting.

**Alternatives considered**:

- Relevance ranking: rejected because no approved relevance model or user-visible ranking rule exists.
- Alphabetical sorting: rejected because it would silently change existing library behavior.
