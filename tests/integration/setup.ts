import { createTestHarness, type TestHarness } from 'wrangler'

export async function createFoundationHarness(): Promise<TestHarness> {
  const harness = createTestHarness({ workers: [{ configPath: './wrangler.jsonc' }] })
  await harness.listen()
  return harness
}
