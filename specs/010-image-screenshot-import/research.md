# Research: Image and Screenshot Recipe Import

**Feature**: 010-image-screenshot-import  
**Date**: 2026-08-31

## Decisions

### Use one direct, structured vision request per extraction

The retained source will be uploaded from the Worker to OpenAI's Files API with purpose `vision`, then
provided to the existing Responses API request as one `input_image` file reference. The response will use
the existing strict recipe JSON schema and result mapper, rather than first producing free-form OCR text and
then asking a second model call to parse it. This preserves the owner's single explicit AI extraction
attempt and avoids exposing a private R2 object through a public URL.

OpenAI supports image inputs supplied by URL, Base64 data URL, or Files API identifier. A file identifier
is the appropriate private-source path here. The direct vision path will set `store: false` and delete the
temporary OpenAI file in a `finally` block. See [OpenAI image and vision documentation](https://developers.openai.com/api/docs/guides/images-vision).

### Keep the 10 MB application limit

The 10 MB product limit is intentionally below Cloudflare's 100 MB Free/Pro Worker request-body limit and
well below R2's single-upload capacity. It limits memory and cost exposure while supporting ordinary phone
photos and screenshots. Uploads will be retained to R2 through the existing private Worker binding with
content metadata, never through a public bucket URL. See [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and the [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

### Support HEIC through a private Cloudflare Images conversion boundary

OpenAI's current documented vision input formats are PNG, JPEG, WebP, and non-animated GIF; HEIC is not a
documented input format. Recipeapp will still accept and retain an HEIC source, then use the Cloudflare
Images Worker binding to transcode only that image to JPEG in memory before submitting it to OpenAI. This
binding can operate on raw R2 bytes, so no public image URL or separate image-storage product is needed.

This adds one Cloudflare Images transformation for an HEIC extraction. Cloudflare's current free allowance
is 5,000 unique transformations per month; overage behavior and pricing must be reviewed by the owner
before production rollout. The plan therefore keeps direct-supported formats out of this conversion path.
See [Cloudflare Images Workers binding](https://developers.cloudflare.com/images/optimization/binding/) and
[Cloudflare Images limits and formats](https://developers.cloudflare.com/images/get-started/limits/).

### Preserve the current import-history model

Feature 010 will add `image` as a `recipe_imports.source_type`, retain its private R2 key and filename, and
add narrowly named vision-attempt fields rather than overloading PDF OCR fields. The immutable parsed draft
remains the AI extraction snapshot; existing approval creates the editable saved Recipe exactly once.

### Validate bytes, not just browser-provided MIME labels

The Worker will require one multipart `file`, enforce the 10 MB limit, and recognize JPEG, PNG, WebP, and
HEIC/HEIF container signatures before R2 storage. The supplied MIME type and extension may improve the
owner-facing label but cannot authorize the upload. Browser preview is optional: a valid non-previewable
HEIC source still retains and can be extracted.

## Rejected Alternatives

| Alternative | Reason not selected |
|---|---|
| Public R2 URL passed directly to OpenAI | Violates private-source and no-public-URL requirements. |
| Base64 image data in the Responses request | Copies a 10 MB source into a larger JSON payload and puts avoidable pressure on Worker memory. |
| Existing two-call PDF OCR then text parser approach | Conflicts with the explicit one-attempt cost boundary and adds a second AI call. |
| Client-side HEIC conversion | Browser support is inconsistent and would make success depend on the owner's device. |
| General image/media framework | One image, four formats, and one provider do not justify speculative abstraction. |

## Implementation Prerequisite

Before production deployment, add the Cloudflare Images binding to this Worker and confirm the account's
transformation allowance/overage behavior. No R2 object will be made public. Local and automated tests will
use a binding double; production HEIC verification requires a deployed binding.
