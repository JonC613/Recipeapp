# Data Model: PDF Recipe Import

## Extensions

| Entity | Added behavior |
|---|---|
| Recipe source | Add `pdf`, private R2 object key, optional sanitized original filename, and import time. |
| Recipe import | Add `pdf` source type, `source_r2_key`, `source_name`, extracted text in `raw_text`, and safe failure codes. |
| Extracted content | Generalize to `text` or `pdf`, with bounded extracted text and optional source name. |

PDF failure codes: `INVALID_FILE`, `FILE_TOO_LARGE`, `PDF_UNREADABLE`, and `EXTRACTION_TOO_LARGE`, plus
existing parser outcomes. A valid upload transitions through retained source → ready/failed/no_recipe;
only a ready record can approve exactly one PDF-sourced recipe. Source bytes and original draft remain
immutable after approval.

## OCR Amendment Extensions

| Entity | Added behavior |
|---|---|
| Recipe import | Add OCR eligibility/state, one `ocr_attempted_at`, safe OCR failure code, and extraction method (`embedded_text` or `ocr`). |
| OCR attempt | Is represented by the import record, never a second recipe; the attempt is claimed before the provider call and cannot be reset. |
| OCR text | Reuses bounded `raw_text` only after success and remains separate from the parsed draft and reviewed recipe. |

OCR states are `available`, `attempted`, `succeeded`, `failed`, or `page_limit`. A retained image-only
PDF begins `available`; its status is not `ready` until OCR text passes the existing parser. A new
`0006_pdf_ocr_attempts.sql` migration must preserve every existing import row unchanged.
