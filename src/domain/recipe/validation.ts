import type { ManualRecipeInput, NormalizedManualRecipe, RecipeIngredientInput, RecipeInstructionInput } from './schema.js'

const textFields = ['description', 'cuisine', 'category', 'notes'] as const
const numberFields = ['servings', 'prepMinutes', 'cookMinutes', 'totalMinutes'] as const

function optionalText(value: unknown, field: string): string | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string') throw new Error(`${field} must be text`)
  return value.trim() || undefined
}
function optionalNumber(value: unknown, field: string): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative number`)
  return value
}
export function normalizeManualRecipe(input: ManualRecipeInput): NormalizedManualRecipe {
  const title = optionalText(input.title, 'Title')
  if (!title) throw new Error('Title is required')
  const ingredients = (input.ingredients ?? []).map((item: RecipeIngredientInput, position) => {
    const originalText = optionalText(item.originalText, 'Ingredient text')
    if (!originalText) throw new Error('Ingredient text is required')
    return { ...item, originalText, position }
  })
  const instructions = (input.instructions ?? []).map((item: RecipeInstructionInput, index) => {
    const text = optionalText(item.text, 'Instruction text')
    if (!text) throw new Error('Instruction text is required')
    return { text, stepNumber: index + 1 }
  })
  const result: NormalizedManualRecipe = { title, tags: [], ingredients, instructions }
  for (const field of textFields) result[field] = optionalText(input[field], field)
  for (const field of numberFields) result[field] = optionalNumber(input[field], field)
  const seen = new Set<string>()
  result.tags = (input.tags ?? []).flatMap((tag) => {
    const value = optionalText(tag, 'tag')
    if (!value || seen.has(value.toLowerCase())) return []
    seen.add(value.toLowerCase())
    return [value]
  })
  return result
}
