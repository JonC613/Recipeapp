---
type: Software Repository
title: Recipeapp
description: Personal, mobile-first Recipe Library application with locally validated manual recipe CRUD.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-28T14:35:00Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"}]
sources: [{"id":"readme","resource":"../../README.md","title":"Repository README"},{"id":"foundation-spec","resource":"../../specs/001-foundation/spec.md","title":"Foundation specification"},{"id":"recipe-library-spec","resource":"../../specs/002-recipe-library/spec.md","title":"Recipe Library specification"}]
sdd: {"profile_version":1,"assumptions":[]}
---

# Recipeapp

## Purpose

Recipeapp is a personal recipe library intended to capture, review, store, find, and read recipes.
Its current durable capability is a locally validated manual Recipe Library, built on the responsive
application foundation, safe Worker error handling, and local Cloudflare binding simulation.

## Current capabilities

- Cooks can create, view, edit, favorite, title-filter, and deliberately delete manual recipes.
- D1 persists recipe metadata, ordered ingredients, instructions, tags, manual source provenance,
  and timestamps through a version-controlled local migration.
- Foundation UI, Worker health endpoint, and responsive recovery experiences remain implemented and
  locally validated. D1 and R2 bindings are configured; local development and tests use simulations.

## Boundaries

- Recipe URL/text/PDF import, AI extraction, application authentication, and broader ingredient,
  tag, category, or semantic search are not implemented. R2 is configured but unused by this feature.
- Remote deployment is intentionally deferred. Before any remote deployment, an owner-controlled
  custom hostname, Cloudflare Access with an owner-restricted Allow policy, and separate deployment
  approval are required.
