/**
 * Playwright Configuration for WeeWoo Map Friend
 * Automated browser testing for ES6 module validation
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Run all test files in the new structure
  testMatch: [
    '**/*.spec.js'
  ],
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Optimize worker count for performance
  workers: process.env.CI ? 2 : 6,  // 2 workers on CI, 6 on local
  
  // Reporter to use - HTML dashboard + minimal terminal output
  reporter: [
    ['html', { 
      open: 'always',  // Always open browser
      outputFolder: 'playwright-report' 
    }],
    ['line'],  // Clean progress view in terminal
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL configured per project for multi-server setup
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Console monitoring
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Multi-server projects for optimal resource distribution
  projects: [
    // Unit Tests (Port 8001) - 2 workers
    {
      name: 'unit-chromium',
      testMatch: 'tests/unit/**/*.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8001',
      },
    },
    {
      name: 'unit-firefox', 
      testMatch: 'tests/unit/**/*.spec.js',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:8001',
      },
    },
    
    // E2E Tests (Port 8002) - 2 workers
    {
      name: 'e2e-chromium',
      testMatch: 'tests/core/**/*.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8002',
      },
    },
    {
      name: 'e2e-mobile',
      testMatch: 'tests/core/**/*.spec.js', 
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:8002',
      },
    },
    
    // Debug Tests (Port 8003) - 1 worker
    {
      name: 'debug-webkit',
      testMatch: 'tests/debug/**/*.spec.js',
      use: { 
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:8003',
      },
    },
    
    // Performance Tests (Port 8004) - 1 worker
    {
      name: 'performance-chromium',
      testMatch: 'tests/performance/**/*.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8004',
      },
    },
    
    // Compatibility Tests (Port 8002) - shared with E2E
    {
      name: 'compatibility-firefox',
      testMatch: 'tests/compatibility/**/*.spec.js',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:8002',
      },
    }
  ],
  
  // Multi-server configuration for optimal performance
  webServer: [
    // Unit Tests Server (Port 8001) - 2 workers
    {
      command: 'python -m http.server 8001 --bind 127.0.0.1',
      url: 'http://localhost:8001',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // E2E Tests Server (Port 8002) - 2 workers  
    {
      command: 'python -m http.server 8002 --bind 127.0.0.1',
      url: 'http://localhost:8002',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // Debug Tests Server (Port 8003) - 1 worker
    {
      command: 'python -m http.server 8003 --bind 127.0.0.1',
      url: 'http://localhost:8003',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // Performance Tests Server (Port 8004) - 1 worker
    {
      command: 'python -m http.server 8004 --bind 127.0.0.1',
      url: 'http://localhost:8004',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    }
  ],
  
  // Global setup and teardown
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
  
  // Test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },
});