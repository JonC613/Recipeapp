# TheMealDB Application Contract

The application contract exposes normalized Recipeapp DTOs only. It does not expose TheMealDB API keys,
provider request URLs, or raw provider responses.

## Planned endpoints

- `GET /api/mealdb/categories` → `[{ "id": "Chicken", "label": "Chicken" }]`
- `GET /api/mealdb/areas` → `[{ "id": "Japanese", "label": "Japanese" }]`
- `GET /api/mealdb/recipes?category=Chicken` or `?area=Japanese` → bounded recipe summaries.
- `GET /api/mealdb/search?q=teriyaki` → bounded recipe summaries.
- `GET /api/mealdb/recipes/:providerId` → a normalized, attributed recipe preview.
- `POST /api/import/mealdb` → later explicit-import endpoint that returns the existing Recipeapp import
  projection and is the first operation that persists a provider import.

Every unavailable or malformed provider result maps to Recipeapp's allow-listed `SERVICE_UNAVAILABLE`
response without provider payload details.
