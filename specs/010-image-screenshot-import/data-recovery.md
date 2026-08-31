# Production Recovery: Approved Recipe Details

**Date**: 2026-08-31

Migration `0009_image_recipe_sources.sql` rebuilt the parent `recipes` table to add the `image` source
type. Its implementation caused dependent ingredient, instruction, and tag rows to be removed from nine
existing recipes. The immutable `recipe_imports.parsed_recipe_json` snapshots for all nine approved
imports remain present.

`0010_restore_recipe_details.sql` restores only the listed approved recipe IDs from those snapshots. It
does not modify recipe metadata, titles, notes, sources, timestamps, retained originals, import records,
or the two later image-sourced recipes. Before applying remotely, validate the exact expected aggregate:
9 recipes, 101 ingredients, 57 instructions, and 13 tags. Afterward, verify every listed recipe has its
child rows and run `PRAGMA foreign_key_check`.

Future parent-table constraint changes must be proven against a populated schema with child rows before
production use; a parent-table drop/rebuild is not an acceptable migration strategy without rebuilding and
restoring dependent tables in the same verified migration. The integration-test schema mirrors the live
`recipes.source_type` constraint and its existing image-approval test is the regression guard for image
source persistence.
