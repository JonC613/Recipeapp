# Implementation Plan: PDF Recipe Import

**Branch**: `006-pdf-import` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

## Summary

Add a PDF upload path: validate a PDF, retain its private original in R2, extract bounded embedded text
through a replaceable Worker `ContentExtractor`, then offer an explicit one-attempt OCR fallback for
image-only scans. Both paths reuse `RecipeParser`, persist a source-aware draft or safe failure, and use
the existing review and one-time approval boundary. Background work and deployment remain out of scope.

## Technical Context

**Language/Version**: TypeScript 6.0; Cloudflare Workers runtime  
**Dependencies**: React/Vite/Cloudflare Vite plugin; `unpdf`; existing OpenAI Responses API with a separately configurable vision-capable OCR model  
**Storage**: R2 `RECIPE_SOURCES` originals; D1 import history plus OCR state; existing recipe tables unchanged  
**Testing**: Vitest component/Worker/integration and Playwright at 320/768/1440 with controlled doubles  
**Constraints**: 20 MB PDF, signature plus MIME validation, 50,000 extracted-character cap, 10-page OCR cap, one explicit OCR attempt and one subsequent parser call, no auto-retry/remote deployment  
**Scope**: Personal MVP; one recipe per PDF; reuse current review/save routes

## Constitution Check

**PASS before research and after design.** The slice is upload UI → validation → R2 → extract → parser →
D1 import → review/save → tests. Stable domain/provenance, explicit approval, worker-only secrets, safe
errors, and replaceable provider boundaries remain intact. No exception is required.

## Design Decisions

- Use a single Worker-to-R2 object write; 20 MB is within Cloudflare's single-upload guidance.
- Use `unpdf` behind `ContentExtractor`, then expose OCR only as an explicit recovery action.
- Validate multipart shape, `%PDF-` signature, and size before storage; retain source after persisted attempts.
- Fail safely above 50,000 extracted characters rather than silently truncating recipe content.
- Add `pdf` provenance and a migration for R2 key, filename, and extracted text; approval stays unique.
- Atomically claim one OCR attempt before any provider request; upload private source bytes temporarily
  as OpenAI `user_data`, reference the returned file ID in a Responses request with response storage
  disabled, and delete the provider file immediately after the response. Keep only bounded OCR text and
  safe status in D1.

## Project Structure

```text
src/components/imports/PdfImportForm.tsx
src/domain/recipe/{imports,schema}.ts
src/pages/{RecipeImportPage,RecipeImportResultPage,RecipeDetailPage}.tsx
src/services/imports.ts
worker/services/{extraction/{content-extractor,pdf-content-extractor,openai-pdf-ocr}.ts,storage/pdf-sources.ts,ai/ocr-processor.ts}
worker/{routes,repositories}/imports.ts
migrations/{0005_pdf_imports.sql,0006_pdf_ocr_attempts.sql}
tests/{fixtures/pdf-import,worker,integration,component,e2e}/
```

**Structure Decision**: Extend the existing feature-oriented repository. PDF details stay in Worker
extraction/storage; all drafts converge on existing review/save.

## Complexity Tracking

No constitution violations require justification.

## Implementation Outcomes

The approved design was implemented with `unpdf` 1.8.1 behind `ContentExtractor`. The PDF endpoint
retains a validated source in the existing private R2 binding, persists source-aware ready/failure import
records, and reuses the existing parser and review/approval boundary. Focused and full automated suites
verify the workflow with no paid provider calls.

## Amendment 001: OCR Plan

The Worker will expose `POST /api/import/:id/ocr` only for a retained PDF whose deterministic extraction
found no usable text. Before any paid request, D1 will atomically record the one allowed attempt and the
Worker will read the private source from R2, verify that it has no more than 10 pages, then upload its
bytes privately as temporary OpenAI `user_data` and pass the returned file ID to a configurable OCR
model through the Responses API. The adapter deletes the provider file immediately after the response
and configures a one-hour expiry as cleanup protection. The OCR adapter returns bounded plain text
through an application-owned interface; the existing parser makes the optional second,
constrained interpretation call. The browser sees only a disclosure, progress, and allow-listed result.
