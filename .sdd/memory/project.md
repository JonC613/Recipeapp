---
type: Software Repository
title: Recipeapp
description: Personal, mobile-first Recipe Library application; Foundation is implemented and validated locally.
status: stable
generated: {"by":"adaptive-sdd/0.3.0","at":"2026-08-28T03:16:22Z"}
verified: [{"by":"human:owner","at":"2026-08-28T03:16:22Z"}]
sources: [{"id":"readme","resource":"../../README.md","title":"Repository README"},{"id":"foundation-spec","resource":"../../specs/001-foundation/spec.md","title":"Foundation specification"}]
sdd: {"profile_version":1,"assumptions":["No Git commit exists yet, so reconciliation begins without a commit baseline."]}
---

# Recipeapp

## Purpose

Recipeapp is a personal recipe library intended to capture, review, store, find, and read recipes.
The current durable capability is its responsive application foundation: a local browser shell, safe
Worker health endpoint, recovery experiences, and local D1/R2 binding simulation.

## Current capabilities

- Foundation UI, Worker health endpoint, and responsive recovery experiences are implemented and
  locally validated.
- D1 and R2 bindings are configured and their remote resources are provisioned; local development
  and tests use simulations by default.

## Boundaries

- Manual recipe CRUD is the next feature. Recipe import, AI extraction, search, application
  authentication, and recipe data persistence are not implemented.
- Remote deployment is intentionally deferred. Before any remote deployment, an owner-controlled
  custom hostname, Cloudflare Access with an owner-restricted Allow policy, and separate deployment
  approval are required.
