# Quickstart: Validate PDF Recipe Import

Use the existing ignored local OpenAI key and local D1/R2 simulations; do not deploy or configure remote
secrets. Automated tests use controlled PDF/extractor/parser doubles and no paid calls.

```powershell
npm run typecheck
npm run cf-typecheck
npm test
npm run test:worker
npm run test:integration
npm run test:e2e
```

Manually, run `npm run dev`, upload a text-based PDF below 20 MB, review/edit/save its draft, and verify
the recipe shows PDF provenance. Also try invalid, image-only, and oversized files: they must offer safe
recovery without saving a recipe. See [contract](contracts/pdf-import.openapi.yaml) and
[data model](data-model.md).

For OCR validation, use a controlled image-only PDF of 10 pages or fewer. First verify it exposes a
clearly labeled **Try OCR** action and has made no provider request. Select that action once, use an OCR
double for automated tests, then verify the resulting draft can be reviewed and saved. Revisit the import
and confirm a second OCR attempt is unavailable. Do not run paid OCR during automated tests.
