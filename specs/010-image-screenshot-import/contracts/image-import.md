# Image Import Contract

## Retain source

`POST /api/import/image` accepts multipart form-data with exactly one `file` part.

- Accepted formats: JPEG, PNG, WebP, and HEIC/HEIF.
- Maximum size: 10 MiB.
- The declared MIME type and detected image signature must agree.
- Success is `201` with a safe image import projection in `pending` state and `visionStatus: "available"`.
- The success payload excludes the R2 key, source bytes, temporary provider IDs, and raw provider output.
- Uploading never invokes AI and never creates a library recipe.

## Extract source

`POST /api/import/:id/extract-image` may be called once for an image import whose vision state is
`available`.

- Success is `201` and returns a ready, editable Recipe Draft.
- A second attempt is `409`.
- No usable recipe, multiple recipes, invalid provider output, or provider unavailability return an
  application-owned safe error and retain a final import outcome. No library recipe is created.

## Approval

Existing `POST /api/import/:id/approve` behavior applies unchanged: it accepts edited review values only
for a ready draft, creates one recipe, and preserves the source/import snapshot.
