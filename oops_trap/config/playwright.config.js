import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/e2e',  
  reporter: [
    ['html', { outputFolder: '../test-results-e2e/html-report' }],
    ['json', { outputFile: '../test-results-e2e/json-report.json' }],
    ['junit', { outputFile: '../test-results-e2e/junit.xml' }],
    ['line']
  ],
  use: {
    baseURL: 'http://localhost:5173'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // для нормальной работы e2e
    timeout: 120 * 1000,
  },
});