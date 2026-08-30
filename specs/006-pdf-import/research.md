# Research: PDF Recipe Import

## Decisions

1. **Single R2 upload** — A 20 MB document fits Cloudflare's documented single-upload path; multipart
adds lifecycle complexity without MVP value. [R2 upload docs](https://developers.cloudflare.com/r2/objects/upload-objects/)
and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
2. **`unpdf` behind `ContentExtractor`** — Its serverless PDF.js build documents Cloudflare Workers
support and text extraction. Keeping it behind an application interface permits replacement or future OCR.
[unpdf](https://github.com/unjs/unpdf).
3. **Retain then extract** — Validate before storage, write the original privately to R2, and persist
ready/failure provenance separately. Reject text over 50,000 characters rather than losing content by
truncation.
4. **Reuse existing review/approval** — PDF differs only at acquisition; it still converges into the
existing draft and one-time approval boundary.
5. **Explicit OpenAI OCR fallback** — GPT-5 Mini accepts image input and structured outputs, while the
   Responses API accepts file input. Use a separately configurable OCR model through an application-owned
   interface, send source bytes only after an explicit user action, set response storage to false, and
   retain only bounded OCR text. This adds no new provider account or browser credential.
   [GPT-5 Mini capabilities](https://developers.openai.com/api/docs/models/gpt-5-mini) and
   [Responses file input](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).
6. **Atomic one-attempt claim** — Persist the OCR attempt timestamp before calling the provider; a repeat
   action sees the recorded attempt rather than creating another cost. Reject documents above 10 pages
   before the provider call. This preserves explicit user cost control even through refreshes or retries.
7. **Temporary provider file ID instead of inline PDF data** — Live validation showed that the Responses
   endpoint rejected both tested inline `file_data` encodings for the retained scanned PDF. The official
   Files API supports `purpose=user_data`, and Responses accepts a resulting `file_id`. Upload privately,
   set the minimum one-hour expiry as crash protection, reference the file ID once, and delete it in a
   `finally` cleanup path. R2 remains private and no provider file ID or response payload is persisted.
8. **Copy bytes before PDF.js page counting** — `unpdf`/PDF.js may transfer and detach the supplied
   `Uint8Array` buffer while loading a document. OCR still needs the same retained bytes after enforcing
   the 10-page limit, so page counting must operate on `Uint8Array.from(sourceBytes)`. A Worker regression
   test transfers the parser copy and verifies that the original source remains intact for upload.
