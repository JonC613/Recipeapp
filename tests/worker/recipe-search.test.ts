import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { handleRecipes } from '../../worker/routes/recipes.js'

describe('recipe search request parsing', () => {
  it('rejects a malformed favorite filter', async () => {
    const response = await handleRecipes(new Request('https://recipeapp.test/api/recipes?favorite=maybe'), env)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  })

  it('accepts normalized keyword and every supported field criterion', async () => {
    const response = await handleRecipes(new Request('https://recipeapp.test/api/recipes?q=%20blackstone%20corn%20&tag=grill&ingredient=corn&cuisine=american&category=side&favorite=true'), env)
    expect(response.status).toBe(200)
  })
})
