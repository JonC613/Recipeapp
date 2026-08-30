---
type: Software Repository
title: Recipeapp
description: Personal, mobile-first Recipe Library application with manual, URL, text, and retained PDF imports, optional scanned-PDF OCR, explicit import review and saving, and traditional saved-recipe search.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-29T18:00:00Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"},{"by":"human:owner","at":"2026-08-29T08:16:46Z"},{"by":"human:owner","at":"2026-08-30T01:47:45Z"},{"by":"human:owner","at":"2026-08-30T05:51:22Z"}]
sources: [{"id":"readme","resource":"../../README.md","title":"Repository README"},{"id":"foundation-spec","resource":"../../specs/001-foundation/spec.md","title":"Foundation specification"},{"id":"recipe-library-spec","resource":"../../specs/002-recipe-library/spec.md","title":"Recipe Library specification"},{"id":"url-import-spec","resource":"../../specs/003-url-import/spec.md","title":"URL Recipe Import specification"},{"id":"import-review-spec","resource":"../../specs/004-import-review/spec.md","title":"Import Review and Save specification"},{"id":"text-import-spec","resource":"../../specs/005-text-import/spec.md","title":"Text Recipe Import specification"},{"id":"pdf-import-spec","resource":"../../specs/006-pdf-import/spec.md","title":"PDF Recipe Import specification"},{"id":"recipe-search-spec","resource":"../../specs/007-recipe-search/spec.md","title":"Recipe Search specification"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Recipeapp

## Purpose

Recipeapp is a personal recipe library intended to capture, review, store, find, and read recipes.
Its current durable capability is a locally validated Recipe Library with manual recipes,
deterministic URL-import drafts, AI-assisted pasted-text drafts, and retained PDF imports with an
explicit OCR fallback for scanned documents. Every import converges on review and explicit save; cooks can
then find approved recipes through traditional search and filters, built on safe Worker-owned Cloudflare
service boundaries.

## Current capabilities

- Cooks can create, view, edit, favorite, find, and deliberately delete manual recipes.
- D1 persists recipe metadata, ordered ingredients, instructions, tags, manual source provenance,
  and timestamps through a version-controlled local migration.
- Cooks can import one public recipe URL into an unsaved draft from published Recipe JSON-LD, view
  its source and extracted fields, correct the draft during review, explicitly save one URL-sourced
  recipe, reopen its retained import record, or safely recover to manual entry.
- D1 preserves URL import attempts and their immutable source URL, status, safe failure code, and
  extraction snapshot separately from saved recipes; an approved import has one linked library recipe.
- Cooks can paste one bounded block of recipe text to create an AI-extracted, unsaved draft, review and
  correct it, and explicitly save one text-sourced recipe. D1 retains the original text and extraction
  snapshot separately from the approved recipe, including safe failed-import outcomes.
- Cooks can upload one valid PDF up to 20 MB. The Worker retains the original privately in R2, attempts
  deterministic embedded-text extraction, creates an unsaved draft when usable recipe text is found,
  and reuses the existing review and explicit-save workflow.
- For a retained image-only PDF of at most 10 pages, the cook can explicitly request one OCR attempt
  after seeing an AI-credit disclosure. Usable OCR text passes through the constrained recipe parser;
  terminal outcomes remain recoverable and never create a recipe automatically.
- D1 preserves PDF source metadata, extraction snapshots, extraction method, OCR state and attempt time,
  safe failure classifications, and the reviewed recipe separately so later edits cannot destroy the
  retained source or extraction history.
- Cooks can search saved recipes case-insensitively across title, ingredients, tags, cuisine, and category,
  then combine a keyword with favorite, tag, ingredient, cuisine, or category filters. Criteria are
  read-only, clearable, and return only saved recipe summaries.
- Foundation UI, Worker health endpoint, and responsive recovery experiences remain implemented and
  locally validated. D1 and private R2 bindings are exercised through local simulations and tests.

## Boundaries

- Application authentication, standalone image/screenshot import, semantic/vector search, recipe ranking,
  and conversational search are not implemented.
- AI text parsing and OCR use Worker-only OpenAI credentials. OCR requires explicit user action, is
  limited to one attempt per retained import, uses a temporary `user_data` provider file with a
  one-hour expiry fallback, and attempts immediate deletion. Automated tests use controlled doubles
  and make no paid provider calls.
- Remote deployment is intentionally deferred. Before any remote deployment, an owner-controlled
  custom hostname, Cloudflare Access with an owner-restricted Allow policy, and separate deployment
  approval are required.
