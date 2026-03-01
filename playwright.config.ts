import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: { baseURL: 'http://localhost:3000', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { command: 'npm start', url: 'http://localhost:3000', timeout: 120000, reuseExistingServer: true },
});
