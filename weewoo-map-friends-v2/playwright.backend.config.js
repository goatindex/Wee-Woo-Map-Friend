import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-backend',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-backend',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-backend',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome-backend',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari-backend',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run preview:backend',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});

