export interface RecipeIngredientInput {
  originalText: string
  quantity?: number
  quantityText?: string
  unit?: string
  ingredient?: string
  preparation?: string
  optional?: boolean
}
export interface RecipeInstructionInput { text: string; stepNumber?: number }
export interface ManualRecipeInput {
  title: string
  description?: string
  servings?: number
  prepMinutes?: number
  cookMinutes?: number
  totalMinutes?: number
  cuisine?: string
  category?: string
  tags?: string[]
  notes?: string
  ingredients?: RecipeIngredientInput[]
  instructions?: RecipeInstructionInput[]
}
export interface ReviewRecipeInput extends ManualRecipeInput { favorite?: boolean }
export type RecipeSource = { type: 'manual' } | { type: 'url'; originalUrl: string } | { type: 'text' }
export interface NormalizedManualRecipe extends Omit<ManualRecipeInput, 'tags' | 'ingredients' | 'instructions'> {
  tags: string[]
  ingredients: Array<RecipeIngredientInput & { position: number }>
  instructions: Array<RecipeInstructionInput & { stepNumber: number }>
}
