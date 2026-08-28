import { reset } from 'cloudflare:test'
import { afterEach, beforeEach } from 'vitest'
import { applyRecipeMigration } from '../recipe-migration.js'

export async function resetRecipeTestState(): Promise<void> {
  await reset()
  const { env } = await import('cloudflare:test')
  await applyRecipeMigration(env.DB)
}

beforeEach(async () => {
  await resetRecipeTestState()
})

afterEach(async () => {
  await reset()
})
