import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { handleImageImport } from '../../worker/routes/imports.js'

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])

function request(file: File | File[]): Request {
  const body = new FormData()
  for (const entry of Array.isArray(file) ? file : [file]) body.append('file', entry)
  return new Request('https://recipeapp.test/api/import/image', { method: 'POST', body })
}

describe('image recipe import', () => {
  it('retains a valid image without invoking AI or exposing its private R2 key', async () => {
    const store = vi.fn(async () => 'imports/image-private/source.jpg')
    const response = await handleImageImport(request(new File([jpeg], 'handwritten-card.jpg', { type: 'image/jpeg' })), env, { store, now: () => '2026-08-31T00:00:00.000Z' })
    expect(response.status).toBe(201)
    const body = await response.json() as Record<string, unknown>
    expect(body).toMatchObject({ sourceType: 'image', sourceName: 'handwritten-card.jpg', status: 'pending', visionStatus: 'available' })
    expect(body).not.toHaveProperty('sourceR2Key')
    expect(JSON.stringify(body)).not.toContain('image-private')
    expect(store).toHaveBeenCalledWith(env.RECIPE_SOURCES, expect.any(String), jpeg, 'jpeg', 'handwritten-card.jpg')
    const rows = await env.DB.prepare("SELECT source_type, source_r2_key, status, vision_status FROM recipe_imports WHERE source_name = 'handwritten-card.jpg'").all()
    expect(rows.results).toContainEqual(expect.objectContaining({ source_type: 'image', source_r2_key: 'imports/image-private/source.jpg', status: 'pending', vision_status: 'available' }))
  })

  it('stores accepted image bytes privately through R2', async () => {
    const response = await handleImageImport(request(new File([jpeg], 'private.jpg', { type: 'image/jpeg' })), env)
    expect(response.status).toBe(201)
    const row = await env.DB.prepare("SELECT source_r2_key FROM recipe_imports WHERE source_name = 'private.jpg'").first<{ source_r2_key: string }>()
    const source = await env.RECIPE_SOURCES.get(row!.source_r2_key)
    expect(source).not.toBeNull(); await expect(source!.arrayBuffer()).resolves.toEqual(jpeg.buffer)
  })

  it('rejects invalid, oversized, mismatched, and multiple files before retention', async () => {
    const store = vi.fn(async () => 'imports/should-not-exist/source.jpg')
    const invalid = await handleImageImport(request(new File([new Uint8Array([1, 2, 3])], 'bad.jpg', { type: 'image/jpeg' })), env, { store })
    const mismatched = await handleImageImport(request(new File([jpeg], 'bad.png', { type: 'image/png' })), env, { store })
    const oversized = await handleImageImport(request(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })), env, { store })
    const multiple = await handleImageImport(request([new File([jpeg], 'first.jpg', { type: 'image/jpeg' }), new File([jpeg], 'second.jpg', { type: 'image/jpeg' })]), env, { store })
    expect(invalid.status).toBe(400); expect(mismatched.status).toBe(400); expect(oversized.status).toBe(413); expect(multiple.status).toBe(400)
    expect(store).not.toHaveBeenCalled()
  })

  it('returns a safe recoverable error when private retention fails', async () => {
    const response = await handleImageImport(request(new File([jpeg], 'down.jpg', { type: 'image/jpeg' })), env, { store: async () => { throw new Error('storage internal detail') } })
    expect(response.status).toBe(503); await expect(response.text()).resolves.not.toContain('storage internal detail')
  })
})
