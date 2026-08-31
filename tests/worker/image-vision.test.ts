import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { createImagePendingImport, getImport } from '../../worker/repositories/imports.js'
import { handleImageVision } from '../../worker/routes/imports.js'
import type { ImageRecipeParser } from '../../worker/services/ai/image-recipe-parser.js'
import { storeImageSource } from '../../worker/services/storage/image-sources.js'

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
const parser: ImageRecipeParser = { parse: vi.fn(async () => ({ outcome: 'recipe', draft: { title: 'Image pasta', ingredients: [{ originalText: '1 lemon' }], instructions: [{ text: 'Cook gently.' }] } })) }
const post = (id: string) => new Request(`https://recipeapp.test/api/import/${id}/extract-image`, { method: 'POST' })

async function retained(name = 'pasta.jpg') {
  const id = crypto.randomUUID(); const key = await storeImageSource(env.RECIPE_SOURCES, id, jpeg, 'jpeg', name)
  return createImagePendingImport(env.DB, id, key, name, '2026-08-31T00:00:00.000Z')
}

describe('explicit image vision extraction', () => {
  it('makes one explicit extraction and returns a safe review draft', async () => {
    const imported = await retained()
    const response = await handleImageVision(post(imported.id), env, imported.id, { parser })
    expect(response.status).toBe(201)
    const body = await response.json() as Record<string, unknown>
    expect(body).toMatchObject({ sourceType: 'image', status: 'ready', visionStatus: 'succeeded', draft: { title: 'Image pasta', source: { type: 'image', sourceName: 'pasta.jpg' } } })
    expect(JSON.stringify(body)).not.toContain('sourceR2Key')
    expect(parser.parse).toHaveBeenCalledTimes(1)
    const second = await handleImageVision(post(imported.id), env, imported.id, { parser })
    expect(second.status).toBe(409); expect(parser.parse).toHaveBeenCalledTimes(1)
  })

  it('retains a final no-recipe outcome without creating a recipe', async () => {
    const imported = await retained('not-a-recipe.jpg')
    const noRecipe: ImageRecipeParser = { parse: vi.fn(async () => ({ outcome: 'not_recipe' })) }
    const response = await handleImageVision(post(imported.id), env, imported.id, { parser: noRecipe })
    expect(response.status).toBe(422)
    await expect(getImport(env.DB, imported.id)).resolves.toMatchObject({ status: 'no_recipe', visionStatus: 'failed', visionFailureCode: 'NO_RECIPE' })
    const recipes = await env.DB.prepare('SELECT id FROM recipes').all(); expect(recipes.results).toHaveLength(0)
  })
})
