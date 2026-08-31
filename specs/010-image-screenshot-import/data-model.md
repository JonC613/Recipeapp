# Data Model: Image Imports

`recipe_imports` gains `source_type = 'image'`, `status = 'pending'`, and dedicated vision state columns:

- `vision_status`: `available`, `attempted`, `succeeded`, or `failed`
- `vision_attempted_at`: timestamp for the single explicit attempt
- `vision_failure_code`: safe classified terminal failure
- `extraction_method = 'vision'` on successful image extraction

The existing private `source_r2_key` and safe `source_name` retain the original image. `parsed_recipe_json`
is the immutable schema-valid vision draft. New vision fields are null for all existing import rows.

`recipes.source_type` already permits application-defined values, so image approval persists a normal
Recipe with `source_type = 'image'`, source filename, and the private R2 key. The public image-import DTO
must not expose that key.
