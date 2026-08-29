import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handleTextImport } from '../../worker/routes/imports.js'
import { getImport } from '../../worker/repositories/imports.js'
import type { RecipeParser } from '../../worker/services/ai/recipe-parser.js'
import { RecipeParserError } from '../../worker/services/ai/recipe-parser.js'
import { multipleRecipeText, nonRecipeText, singleRecipeText } from '../fixtures/text-import.js'

const recipeParser: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'recipe', draft: { title: 'Rosemary potatoes', ingredients: [{ originalText: '1 heaping tablespoon finely chopped fresh rosemary', ingredient: 'rosemary' }], instructions: [{ text: 'Toss potatoes with rosemary.' }] } })) }
const request = (text: unknown) => new Request('https://recipeapp.test/api/import/text', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) })

describe('text recipe import', () => {
  it('creates one ready unsaved text draft with immutable source', async () => {
    const response = await handleTextImport(request(singleRecipeText), env, { parser: recipeParser, now: () => '2026-08-29T00:00:00.000Z' })
    expect(response.status).toBe(201)
    const imported = await response.json() as { id: string; sourceType: string; sourceText: string; draft: { source: { type: string }; ingredients: Array<{ originalText: string }> } }
    expect(imported).toMatchObject({ sourceType: 'text', sourceText: singleRecipeText, draft: { source: { type: 'text' }, ingredients: [{ originalText: '1 heaping tablespoon finely chopped fresh rosemary' }] } })
    expect(recipeParser.parse).toHaveBeenCalledTimes(1)
    await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ sourceText: singleRecipeText, status: 'ready' })
    const recipes = await env.DB.prepare('SELECT id FROM recipes').all(); expect(recipes.results).toHaveLength(0)
  })
  it('rejects invalid input before parser invocation', async () => {
    const parser: RecipeParser = { parse: vi.fn() }
    const empty = await handleTextImport(request('   '), env, { parser }); const oversized = await handleTextImport(request('x'.repeat(50_001)), env, { parser })
    expect(empty.status).toBe(400); expect(oversized.status).toBe(400); expect(parser.parse).not.toHaveBeenCalled()
  })
  it('retains safe non-recipe and multiple-recipe outcomes without recipes', async () => {
    const noRecipe: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'not_recipe' })) }; const multiple: RecipeParser = { parse: vi.fn(async () => ({ outcome: 'multiple_recipes' })) }
    const first = await handleTextImport(request(nonRecipeText), env, { parser: noRecipe }); const second = await handleTextImport(request(multipleRecipeText), env, { parser: multiple })
    expect(first.status).toBe(422); expect(second.status).toBe(422)
    const attempts = await env.DB.prepare('SELECT source_type, status, failure_code FROM recipe_imports ORDER BY created_at').all(); expect(attempts.results).toEqual(expect.arrayContaining([expect.objectContaining({ source_type: 'text', status: 'no_recipe', failure_code: 'NO_RECIPE' }), expect.objectContaining({ source_type: 'text', status: 'failed', failure_code: 'MULTIPLE_RECIPES' })]))
  })
  it('keeps invalid output and provider failures safe without exposing source text', async () => {
    const invalid: RecipeParser = { parse: vi.fn(async () => { throw new RecipeParserError('INVALID_OUTPUT', 'raw provider response') }) }; const unavailable: RecipeParser = { parse: vi.fn(async () => { throw new RecipeParserError('UNAVAILABLE', 'raw provider response') }) }
    const first = await handleTextImport(request('Private recipe source'), env, { parser: invalid }); const second = await handleTextImport(request('Another private source'), env, { parser: unavailable })
    expect(first.status).toBe(503); expect(second.status).toBe(503)
    await expect(first.text()).resolves.not.toContain('Private recipe source'); await expect(second.text()).resolves.not.toContain('raw provider response')
    const recipes = await env.DB.prepare('SELECT id FROM recipes').all(); expect(recipes.results).toHaveLength(0)
  })
})
