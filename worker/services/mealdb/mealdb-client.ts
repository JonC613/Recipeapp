import type { MealDbFacet, MealDbRecipeDetail, MealDbRecipeSummary } from '../../../src/domain/recipe/mealdb.js'

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1/'
const MAX_RESPONSE_BYTES = 1_000_000
const MAX_RESULTS = 50
const INGREDIENT_SLOTS = 20

type RawMeal = Record<string, unknown>
type RawMealDbResponse = { meals?: unknown; categories?: unknown }

export class MealDbClientError extends Error {
  readonly code: 'UNAVAILABLE' | 'NOT_FOUND' | 'INVALID_RESPONSE'
  constructor(code: 'UNAVAILABLE' | 'NOT_FOUND' | 'INVALID_RESPONSE', message: string) {
    super(message)
    this.code = code
  }
}

export class MealDbClient {
  private readonly fetcher: typeof fetch
  constructor(fetcher: typeof fetch = fetch) { this.fetcher = fetcher }

  async categories(): Promise<MealDbFacet[]> {
    const response = await this.request('categories.php')
    return records(response.categories).map((item) => facet(item, 'strCategory')).filter(isPresent).slice(0, MAX_RESULTS)
  }

  async areas(): Promise<MealDbFacet[]> {
    const response = await this.request('list.php?a=list')
    return records(response.meals).map((item) => facet(item, 'strArea')).filter(isPresent).slice(0, MAX_RESULTS)
  }

  async byCategory(category: string): Promise<MealDbRecipeSummary[]> {
    return this.summaries(`filter.php?c=${encodeURIComponent(requiredText(category, 'category'))}`)
  }

  async byArea(area: string): Promise<MealDbRecipeSummary[]> {
    return this.summaries(`filter.php?a=${encodeURIComponent(requiredText(area, 'area'))}`)
  }

  async search(query: string): Promise<MealDbRecipeSummary[]> {
    return this.summaries(`search.php?s=${encodeURIComponent(requiredText(query, 'search query'))}`)
  }

  async recipe(id: string): Promise<MealDbRecipeDetail> {
    const providerId = requiredText(id, 'recipe identifier')
    const meals = records((await this.request(`lookup.php?i=${encodeURIComponent(providerId)}`)).meals)
    if (meals.length !== 1) throw new MealDbClientError('NOT_FOUND', 'TheMealDB recipe was not found.')
    return detail(meals[0])
  }

  private async summaries(path: string): Promise<MealDbRecipeSummary[]> {
    return records((await this.request(path)).meals).map(summary).filter(isPresent).slice(0, MAX_RESULTS)
  }

  private async request(path: string): Promise<RawMealDbResponse> {
    let response: Response
    try {
      response = await this.fetcher(new URL(path, BASE_URL), { headers: { accept: 'application/json' } })
    } catch {
      throw new MealDbClientError('UNAVAILABLE', 'TheMealDB is temporarily unavailable. Please try again.')
    }
    if (response.status === 404) throw new MealDbClientError('NOT_FOUND', 'TheMealDB recipe was not found.')
    if (!response.ok) throw new MealDbClientError('UNAVAILABLE', 'TheMealDB is temporarily unavailable. Please try again.')
    const length = Number(response.headers.get('content-length') ?? 0)
    if (length > MAX_RESPONSE_BYTES) throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
    try {
      const body = JSON.parse(text) as unknown
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
      return body as RawMealDbResponse
    } catch {
      throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
    }
  }
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new MealDbClientError('INVALID_RESPONSE', `A ${label} is required.`)
  return normalized
}

function records(value: unknown): RawMeal[] {
  if (value == null) return []
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
  }
  return value as RawMeal[]
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function facet(value: RawMeal, field: string): MealDbFacet | undefined {
  const label = text(value[field])
  return label ? { id: label, label } : undefined
}

function summary(value: RawMeal): MealDbRecipeSummary | undefined {
  const id = text(value.idMeal)
  const title = text(value.strMeal)
  return id && title ? { id, title, thumbnailUrl: text(value.strMealThumb), category: text(value.strCategory), area: text(value.strArea) } : undefined
}

function detail(value: RawMeal): MealDbRecipeDetail {
  const base = summary(value)
  if (!base) throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
  const ingredients = Array.from({ length: INGREDIENT_SLOTS }, (_, index) => ingredient(value, index + 1)).filter(isPresent)
  if (!ingredients.length) throw new MealDbClientError('INVALID_RESPONSE', 'TheMealDB returned an unusable response.')
  return {
    ...base,
    instructions: instructions(text(value.strInstructions)),
    ingredients,
    tags: (text(value.strTags) ?? '').split(',').map((item) => item.trim()).filter(Boolean),
    sourceUrl: text(value.strSource),
    attribution: 'TheMealDB',
  }
}

function ingredient(value: RawMeal, slot: number): { originalText: string } | undefined {
  const ingredientName = text(value[`strIngredient${slot}`])
  if (!ingredientName) return undefined
  const measure = text(value[`strMeasure${slot}`])
  return { originalText: measure ? `${measure} ${ingredientName}` : ingredientName }
}

function instructions(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  const steps = value.split(/\r?\n+/).map((step) => step.trim()).filter(Boolean)
  return steps.length ? steps : [value]
}

function isPresent<T>(value: T | undefined): value is T { return value !== undefined }
