import type { Recipe } from '../../src/services/recipes.js'

export function makeRecipe(overrides: Partial<Recipe> & Pick<Recipe, 'id' | 'title' | 'source'>): Recipe {
  return {
    favorite: false,
    graphicAvailable: false,
    tags: [],
    ingredients: [],
    instructions: [],
    cookCount: 0,
    cookLogs: [],
    createdAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-29T00:00:00.000Z',
    ...overrides,
  }
}
