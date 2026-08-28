import { defineConfig, devices } from '@playwright/test'
const deployedBaseUrl = process.env.E2E_BASE_URL
const localPort = process.env.PLAYWRIGHT_PORT ?? '4173'
const localBaseUrl = `http://127.0.0.1:${localPort}`
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: true, forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 2 : 0, workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list', use: { baseURL: deployedBaseUrl ?? localBaseUrl, trace: 'on-first-retry' },
  webServer: deployedBaseUrl ? undefined : { command: `npm run preview -- --port ${localPort}`, url: localBaseUrl, reuseExistingServer: !process.env.CI },
  projects: deployedBaseUrl ? [{ name: 'deployed-smoke', use: { ...devices['Desktop Chrome'] } }] : [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { browserName: 'chromium', isMobile: true, viewport: { width: 320, height: 720 } } },
  ],
})
