# Quickstart: Validate Recipe Search

## Prerequisites

- Install dependencies with `npm ci`.
- Start the local application with `npm run dev`.
- Use a local D1-backed library containing at least five saved recipes with distinct title, ingredient,
  tag, cuisine, category, and favorite values.

## Manual validation

1. Open the Recipe Library and verify the full saved library appears in existing update order.
2. Search for a title word, an ingredient word, a tag, a cuisine, and a category. For each, verify the
   expected saved card appears and unrelated cards do not.
3. Search using different capitalization, leading/trailing spaces, and repeated internal whitespace.
   Verify the same intended results appear.
4. Apply the favorite filter and each field filter alone, then combine one with a keyword. Verify every
   visible result matches every active criterion.
5. Produce a no-results state, then clear one or all criteria. Verify the correct saved results return and
   the library was not changed.
6. At 320, 768, and 1440 CSS pixels, repeat a search, clear it, and open a result. Verify controls are
   visible and usable with no horizontal page scrolling.
7. Confirm that no result list exposes import source text, PDF/OCR content, or private source-file details.

## Automated validation

Run `npm run build`, `npm run cf-typecheck`, `npm run lint`, `npm test`, `npm run test:worker`,
`npm run test:integration`, and `npm run test:e2e`. Feature-specific coverage verifies request validation,
D1 matching and conjunctive filters, browser controls, and 320/768/1440 journeys. The feature passes only
when its new coverage and existing critical CRUD/import tests remain green.
