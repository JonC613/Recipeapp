export type MealDbFacet = { id: string; label: string }

export type MealDbRecipeSummary = {
  id: string
  title: string
  thumbnailUrl?: string
  category?: string
  area?: string
}

export type MealDbRecipeDetail = MealDbRecipeSummary & {
  instructions?: string[]
  ingredients: Array<{ originalText: string }>
  tags: string[]
  sourceUrl?: string
  attribution: 'TheMealDB'
}
