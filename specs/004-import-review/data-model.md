# Data Model: Import Review and Save

## RecipeImport additions

| Field | Rules |
|---|---|
| approved_recipe_id | Nullable unique reference to the single recipe created from a ready import; absent until approval |

The existing `source_url`, status, creation time, parsed draft snapshot, and safe failure code remain
immutable. Only a ready import with a valid snapshot can transition to linked-to-approved-recipe.

## ReviewRecipeInput

Uses the existing manual recipe fields: title, description, servings, prep/cook/total minutes,
ingredients, instructions, cuisine, category, tags, notes, and favorite. It is an in-memory review
working copy and must satisfy the stable recipe validation before approval.

## Approved Recipe

The approved recipe is a normal persisted recipe with its own identifier and timestamps. It receives
the reviewed field values and retains URL source provenance from the import. It never replaces the
stored import snapshot.

## State transitions

```text
ready import --open review--> editable review copy --cancel--> ready import
ready import --approve once--> ready import linked to approved recipe
failed/no_recipe import --open review--> safe recovery; no save
```

An already linked import cannot create another approved recipe.
