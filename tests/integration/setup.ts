import { createTestHarness, type TestHarness } from 'wrangler'

export const localMigrationCommand = 'npm run db:migrate:local'

export async function createFoundationHarness(): Promise<TestHarness> {
  const harness = createTestHarness({ workers: [{ configPath: './wrangler.jsonc' }] })
  await harness.listen()
  return harness
}
