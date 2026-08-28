<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles:
  - I. Deliver Working Vertical Slices
  - II. Preserve a Stable Recipe Domain
  - III. Preserve Import Provenance and Require Review
  - IV. Prefer Deterministic Extraction; Constrain AI
  - V. Keep Providers and Search Replaceable
  - VI. Protect Secrets and User Data
  - VII. Verify Behavior at Every Boundary
  - VIII. Control Scope and Complexity
- Added sections:
  - Product and Technology Constraints
  - Specification and Delivery Workflow
- Removed sections: none
- Follow-up TODOs: none
-->

# Recipe Library App Constitution

## Core Principles

### I. Deliver Working Vertical Slices

Each feature MUST be delivered as the smallest useful path through UI, API, domain,
persistence, and automated verification. The project MUST establish manual recipe creation,
storage, library display, and detail viewing before introducing AI import behavior. Teams MUST
integrate continuously and MUST NOT build complete disconnected layers in anticipation of later
integration. This keeps user value observable and exposes architectural problems early.

### II. Preserve a Stable Recipe Domain

Application-owned schemas MUST define recipes, ingredients, instructions, sources, and import
states. Arbitrary provider output MUST NOT become the persisted domain model. Every ingredient
MUST retain its original source text even when structured fields are extracted. Schema changes
MUST use committed database migrations and account for future ownership without embedding
single-user assumptions in identifiers or storage paths. Stable application contracts prevent
AI and extraction details from corrupting durable recipe data.

### III. Preserve Import Provenance and Require Review

Every imported recipe MUST preserve three distinguishable layers: original source, extraction
result, and user-approved recipe. URL, text, and PDF imports MUST converge on an editable
`RecipeDraft`. No extracted recipe may enter the library until the user reviews and explicitly
saves it. Later edits MUST NOT destroy the retained source or extraction snapshot. AI output
MUST NEVER overwrite user-approved recipe content automatically. These rules protect user trust
and permit future audit or version-history capabilities.

### IV. Prefer Deterministic Extraction; Constrain AI

Import pipelines MUST use deterministic parsing before AI whenever reliable structured content
is available, including Schema.org Recipe JSON-LD for URLs. AI responses MUST use structured
output, MUST be validated against the application schema, and MUST fail recoverably. Prompts and
validation MUST prohibit invented ingredients or instructions, preserve unusual measurements
and ordering, and represent unknown values as absent. AI calls MUST occur only on the Worker
backend. This minimizes cost and nondeterminism while making failures safe to review.

### V. Keep Providers and Search Replaceable

AI parsing, content extraction, file storage, persistence, and search MUST be accessed through
narrow application-owned interfaces at their external boundaries. OpenAI-specific structures
MUST remain inside an AI adapter, and PDF extraction technology MUST remain behind a content
extractor contract. MVP search MUST use traditional D1-backed querying, while its service
boundary MUST permit later semantic search. Abstractions MUST respond to a stated replacement
boundary or observed duplication; speculative packages and generic frameworks are prohibited.

### VI. Protect Secrets and User Data

Provider credentials and Cloudflare secrets MUST never be exposed to browser code, client
bundles, logs, persisted recipe records, or committed files. Workers MUST validate all external
input, including URLs, uploaded files, AI output, identifiers, and query parameters. PDF sources
MUST be stored in R2 through controlled keys and associated with import records. Error responses
MUST avoid leaking credentials or sensitive source content. Security checks are release gates,
not deferred hardening.

### VII. Verify Behavior at Every Boundary

Critical normalization, schema validation, JSON-LD parsing, ingredient handling, and import-state
logic MUST have unit tests. Worker-to-D1, Worker-to-R2, and importer-to-AI boundaries MUST have
integration tests using controlled test resources or doubles. User-critical flows MUST have
Playwright coverage at desktop and mobile widths. External AI calls MUST be replaceable with
deterministic test doubles. A feature is incomplete while its acceptance criteria or relevant
regression tests fail.

### VIII. Control Scope and Complexity

MVP work MUST directly support capture, review, storage, discovery, or cooking-friendly reading
of saved recipes. Explicit non-MVP capabilities MUST NOT be implemented without an approved
specification amendment. Future extension points MAY influence boundary choices but MUST NOT
introduce unused infrastructure, including embeddings, vector search, premature packages, or
multi-user workflows. Requirements and architecture decisions MUST change through visible spec
updates rather than silent implementation drift.

## Product and Technology Constraints

- The deployable system MUST use React, TypeScript, Vite, Cloudflare Workers, D1, and R2 in one
  repository unless an approved amendment replaces a technology.
- The UI MUST be responsive and mobile-first, with recipe detail optimized for use while cooking.
- The MVP import methods are URL, free-form text, PDF, and manual entry. Image or screenshot
  import is outside MVP.
- Original PDFs MUST be retained in R2 and associated with their import records.
- Search MUST cover title, ingredients, tags, category, cuisine, and general keywords without
  requiring semantic or vector infrastructure.
- Authentication MAY be omitted for personal MVP deployments, but persistence and storage
  designs MUST allow a future owner identifier.
- Configuration and secrets MUST use environment configuration and Cloudflare bindings; secrets
  MUST NOT be committed.

## Specification and Delivery Workflow

1. Work MUST proceed through feature-based Spec Kit artifacts in dependency order, beginning
   with foundation and manual recipe CRUD before import features.
2. Each feature MUST have an approved specification before planning, an approved plan before
   tasks, and explicit implementation authorization before source changes.
3. Specifications MUST state user value, scope, exclusions, observable acceptance criteria,
   error behavior, security implications, and mobile expectations where relevant.
4. Plans MUST record consequential architecture decisions, interfaces, data-model changes,
   migrations, and test strategy. Discoveries that alter approved behavior MUST pause affected
   work until the artifacts are amended and re-approved.
5. Tasks MUST be small, dependency ordered, and organized around working vertical slices.
   Relevant tests MUST run after every meaningful increment.
6. A feature is done only when its acceptance criteria pass, critical automated tests exist,
   errors are handled, mobile and desktop behavior is verified, migrations are committed,
   documentation is current, secrets remain server-side, and existing critical tests pass.

## Governance

This constitution is the highest project-level development authority. Feature specifications,
plans, tasks, reviews, and implementation decisions MUST comply with it. When two documents
conflict, the constitution governs unless it is amended first.

Amendments require an explicit proposal describing the changed rule, rationale, affected
artifacts or code, and any migration work. The repository owner MUST approve the amendment before
it takes effect. Constitution versions use semantic versioning: MAJOR for incompatible governance
changes or principle removal, MINOR for new principles or materially expanded obligations, and
PATCH for non-semantic clarification. Every feature review MUST verify constitutional compliance;
any exception MUST be documented, justified, time-bounded where possible, and explicitly
approved.

**Version**: 1.0.0 | **Ratified**: 2026-08-27 | **Last Amended**: 2026-08-27
