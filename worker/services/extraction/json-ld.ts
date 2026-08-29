import { ImportError, type RecipeDraft } from '../../../src/domain/recipe/imports.js'

export function extractRecipeDraft(html: string, originalUrl: string, importedAt: string): RecipeDraft {
  const recipes = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => { try { return flatten(JSON.parse(match[1])) } catch { return [] } }).filter(isRecipe)
  if (recipes.length !== 1 || !text((recipes[0] as Record<string, unknown>).name)) throw new ImportError('NO_RECIPE', 'No usable recipe was found at that URL. Try another URL or enter it manually.')
  const recipe = recipes[0] as Record<string, unknown>
  const instructions = instructionText(recipe.recipeInstructions).map((text) => ({ text }))
  return { title: text(recipe.name)!, description: text(recipe.description), servings: number(recipe.recipeYield), prepMinutes: duration(recipe.prepTime), cookMinutes: duration(recipe.cookTime), totalMinutes: duration(recipe.totalTime), cuisine: text(recipe.recipeCuisine), category: text(recipe.recipeCategory), tags: strings(recipe.keywords), ingredients: strings(recipe.recipeIngredient).map((originalText) => ({ originalText })), instructions, source: { type: 'url', originalUrl, importedAt } }
}
function flatten(value: unknown): unknown[] { if (Array.isArray(value)) return value.flatMap(flatten); if (value && typeof value === 'object') { const item = value as Record<string, unknown>; return [item, ...flatten(item['@graph'] ?? [])] } return [] }
function isRecipe(value: unknown): boolean { const type = (value as Record<string, unknown>)?.['@type']; return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe')) }
function text(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value.trim() : undefined }
function strings(value: unknown): string[] { const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []; return items.flatMap((item) => typeof item === 'string' && item.trim() ? [item.trim()] : []) }
function number(value: unknown): number | undefined { const match = text(value)?.match(/\d+(?:\.\d+)?/); return match ? Number(match[0]) : undefined }
function duration(value: unknown): number | undefined { const match = text(value)?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/); return match ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0) : undefined }
function instructionText(value: unknown): string[] { if (typeof value === 'string') return value.trim() ? [value.trim()] : []; if (!Array.isArray(value)) return []; return value.flatMap((item) => typeof item === 'string' ? [item] : item && typeof item === 'object' ? instructionText((item as Record<string, unknown>).text ?? (item as Record<string, unknown>).itemListElement) : []).filter(Boolean) }
