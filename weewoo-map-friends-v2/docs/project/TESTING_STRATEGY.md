# 🧪 Testing Strategy - WeeWoo Map Friends V2

## Overview

This document outlines the comprehensive testing strategy for WeeWoo Map Friends V2, designed to ensure reliability, performance, and maintainability for emergency services applications.

## Testing Philosophy

### Core Principles

1. **Reliability First**: Critical for emergency services applications
2. **Performance Validation**: Ensure 3-second load requirement
3. **Cross-Platform Testing**: Mobile and desktop compatibility
4. **Offline Capability**: PWA functionality validation
5. **Real Environment Testing**: Test in actual browser conditions
6. **Fast Feedback**: Quick unit tests, comprehensive E2E tests

### Testing Pyramid

```
    ┌─────────────────┐
    │   E2E Tests     │  ← 20% - User workflows, cross-browser
    │   (Playwright)  │
    ├─────────────────┤
    │ Integration     │  ← 30% - Component interactions
    │ Tests (Vitest)  │
    ├─────────────────┤
    │   Unit Tests    │  ← 50% - Individual functions
    │   (Vitest)      │
    └─────────────────┘
```

## Technology Stack

### Testing Framework Selection

| Component | Technology | Version | Purpose | Bundle Size |
|-----------|------------|---------|---------|-------------|
| **Unit Testing** | Vitest | ^1.0.0 | Fast unit tests | ~15mb |
| **Integration Testing** | Vitest | ^1.0.0 | Component tests | ~15mb |
| **E2E Testing** | Playwright | ^1.40.0 | User workflows | ~50mb |
| **API Testing** | Playwright | ^1.40.0 | Backend integration | ~50mb |
| **Visual Testing** | Playwright | ^1.40.0 | UI regression | ~50mb |
| **Performance Testing** | Playwright | ^1.40.0 | Load metrics | ~50mb |

### Multi-Platform Testing Configuration

#### **Platform-Specific Playwright Configs**
- **`playwright.github.config.js`** - GitHub.io static deployment testing
- **`playwright.webapp.config.js`** - Full web app with backend testing
- **`playwright.native.config.js`** - Native app testing (limited)

#### **Vite Configuration for Testing**
- **Multi-Platform Builds**: Platform-specific Vite configurations
- **Environment Variables**: Feature flags for testing different modes
- **Test Environment**: Isolated test environment setup
- **Mock Services**: API mocking for offline testing

### Why This Combination?

1. **Vitest Benefits**:
   - 10x faster than Jest
   - Native Vite integration
   - ES6 module support
   - Hot reload for tests
   - Excellent TypeScript support

2. **Playwright Benefits**:
   - Cross-browser testing
   - Mobile device testing
   - API testing capabilities
   - Visual regression testing
   - Real browser environment

## Test Organization

### Directory Structure

```
tests/
├── unit/                    # Vitest unit tests
│   ├── services/
│   │   ├── WeatherService.test.js
│   │   ├── AlertService.test.js
│   │   └── BaseService.test.js
│   ├── stores/
│   │   ├── mapStore.test.js
│   │   └── weatherStore.test.js
│   ├── managers/
│   │   ├── MapManager.test.js
│   │   └── LayerManager.test.js
│   ├── utils/
│   │   ├── Logger.test.js
│   │   ├── Config.test.js
│   │   └── Storage.test.js
│   └── types/
│       └── validators.test.js
├── integration/             # Vitest integration tests
│   ├── components/
│   │   ├── MapComponent.test.js
│   │   ├── SidebarComponent.test.js
│   │   └── WeatherComponent.test.js
│   ├── workflows/
│   │   ├── LayerToggle.test.js
│   │   ├── WeatherIntegration.test.js
│   │   └── StatePersistence.test.js
│   └── api/
│       ├── WeatherAPI.test.js
│       └── AlertAPI.test.js
├── e2e/                     # Playwright E2E tests
│   ├── user-journeys/
│   │   ├── map-navigation.spec.js
│   │   ├── layer-management.spec.js
│   │   └── weather-display.spec.js
│   ├── cross-browser/
│   │   ├── chrome.spec.js
│   │   ├── firefox.spec.js
│   │   └── safari.spec.js
│   ├── mobile/
│   │   ├── mobile-navigation.spec.js
│   │   └── touch-interactions.spec.js
│   └── performance/
│       ├── load-time.spec.js
│       └── memory-usage.spec.js
├── api/                     # Playwright API tests
│   ├── weather-api.spec.js
│   ├── alert-api.spec.js
│   └── backend-health.spec.js
├── visual/                  # Playwright visual tests
│   ├── regression/
│   │   ├── map-layout.spec.js
│   │   └── sidebar-ui.spec.js
│   └── responsive/
│       ├── mobile-layout.spec.js
│       └── tablet-layout.spec.js
└── fixtures/                # Test data and mocks
    ├── geojson/
    ├── weather-data/
    └── mock-responses/
```

## Test Categories

### 1. Unit Tests (Vitest)

#### **Purpose**: Test individual functions and methods in isolation

#### **Coverage Areas**:
- Service layer methods
- State management actions
- Utility functions
- Data validation
- Error handling

#### **Example**:
```javascript
// tests/unit/services/WeatherService.test.js
import { describe, it, expect, vi } from 'vitest';
import { WeatherService } from '../../../src/services/WeatherService.js';

describe('WeatherService', () => {
  let weatherService;
  
  beforeEach(() => {
    weatherService = new WeatherService('test-api-key');
  });
  
  it('should fetch weather data', async () => {
    const mockResponse = { temperature: 25, condition: 'sunny' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await weatherService.getCurrentWeather('Melbourne');
    expect(result).toEqual(mockResponse);
  });
  
  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(weatherService.getCurrentWeather('Melbourne'))
      .rejects.toThrow('API Error');
  });
});
```

### 2. Integration Tests (Vitest)

#### **Purpose**: Test component interactions and workflows

#### **Coverage Areas**:
- Component integration
- Service interactions
- State management flows
- API integration
- Error boundaries

#### **Example**:
```javascript
// tests/integration/workflows/WeatherIntegration.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherService } from '../../../src/services/WeatherService.js';
import { useWeatherStore } from '../../../src/stores/weatherStore.js';

describe('Weather Integration', () => {
  let weatherService;
  let store;
  
  beforeEach(() => {
    weatherService = new WeatherService('test-key');
    store = useWeatherStore.getState();
  });
  
  it('should update store when weather data is fetched', async () => {
    const mockData = { temperature: 25, condition: 'sunny' };
    vi.spyOn(weatherService, 'getCurrentWeather').mockResolvedValue(mockData);
    
    await weatherService.fetchAndStoreWeather('Melbourne');
    
    expect(store.weatherData).toEqual(mockData);
  });
});
```

### 3. E2E Tests (Playwright)

#### **Purpose**: Test complete user workflows in real browser

#### **Coverage Areas**:
- User journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance metrics
- Accessibility

#### **Example**:
```javascript
// tests/e2e/user-journeys/map-navigation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Map Navigation', () => {
  test('should load map and display emergency service boundaries', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await expect(page.locator('#map')).toBeVisible();
    
    // Check for emergency service layers
    await expect(page.locator('[data-layer="ses"]')).toBeVisible();
    await expect(page.locator('[data-layer="cfa"]')).toBeVisible();
    await expect(page.locator('[data-layer="ambulance"]')).toBeVisible();
  });
  
  test('should toggle layers on and off', async ({ page }) => {
    await page.goto('/');
    
    // Toggle SES layer
    await page.click('[data-layer="ses"]');
    await expect(page.locator('[data-layer="ses"]')).toHaveClass(/active/);
    
    // Verify layer is visible on map
    await expect(page.locator('.leaflet-layer')).toBeVisible();
  });
});
```

### 4. API Tests (Playwright)

#### **Purpose**: Test backend API integration

#### **Coverage Areas**:
- Weather API endpoints
- Alert API endpoints
- Error handling
- Response validation
- Authentication

#### **Example**:
```javascript
// tests/api/weather-api.spec.js
import { test, expect } from '@playwright/test';

test.describe('Weather API', () => {
  test('should fetch weather data', async ({ request }) => {
    const response = await request.get('/api/weather?location=Melbourne');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('temperature');
    expect(data).toHaveProperty('condition');
  });
  
  test('should handle invalid location', async ({ request }) => {
    const response = await request.get('/api/weather?location=InvalidLocation');
    
    expect(response.status()).toBe(400);
  });
});
```

### 5. Visual Tests (Playwright)

#### **Purpose**: Detect UI regressions and layout issues

#### **Coverage Areas**:
- Map layout
- Sidebar UI
- Mobile responsiveness
- Cross-browser consistency

#### **Example**:
```javascript
// tests/visual/regression/map-layout.spec.js
import { test, expect } from '@playwright/test';

test.describe('Map Layout Visual Tests', () => {
  test('map layout should match baseline', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForSelector('#map');
    
    // Take screenshot
    await expect(page).toHaveScreenshot('map-layout.png');
  });
  
  test('sidebar should match baseline', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForSelector('.sidebar');
    
    await expect(page.locator('.sidebar')).toHaveScreenshot('sidebar-ui.png');
  });
});
```

## Configuration

### Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{js,ts}', 'tests/integration/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/e2e/**/*', 'tests/api/**/*', 'tests/visual/**/*'],
    setupFiles: ['./tests/setup/vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts'
      ]
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
```

### Playwright Configuration

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] }
    }
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## Performance Testing

### Load Time Testing

```javascript
// tests/e2e/performance/load-time.spec.js
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load in under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('#map');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should have good Lighthouse scores', async ({ page }) => {
    await page.goto('/');
    
    const lighthouse = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Lighthouse performance audit
        // Implementation details...
      });
    });
    
    expect(lighthouse.performance).toBeGreaterThan(90);
  });
});
```

### Memory Usage Testing

```javascript
// tests/e2e/performance/memory-usage.spec.js
import { test, expect } from '@playwright/test';

test.describe('Memory Usage', () => {
  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
    
    // Perform memory-intensive operations
    for (let i = 0; i < 100; i++) {
      await page.click('[data-layer="ses"]');
      await page.click('[data-layer="cfa"]');
    }
    
    // Force garbage collection
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Data Management

### Fixtures and Mocks

```javascript
// tests/fixtures/weather-data.js
export const mockWeatherData = {
  current: {
    temperature: 25,
    condition: 'sunny',
    humidity: 60,
    windSpeed: 15
  },
  forecast: [
    { date: '2025-01-01', high: 28, low: 18, condition: 'sunny' },
    { date: '2025-01-02', high: 26, low: 16, condition: 'cloudy' }
  ]
};

// tests/fixtures/geojson/ses-boundaries.geojson
export const mockSESBoundaries = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'SES Unit 1' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[144.9631, -37.8136], [144.9731, -37.8136], [144.9731, -37.8036], [144.9631, -37.8036], [144.9631, -37.8136]]]
      }
    }
  ]
};
```

## Best Practices

### 1. **Test Naming Conventions**

```javascript
// Good: Descriptive and specific
describe('WeatherService.getCurrentWeather()', () => {
  it('should return weather data for valid location', () => {});
  it('should throw error for invalid API key', () => {});
  it('should handle network timeout gracefully', () => {});
});

// Bad: Vague and unclear
describe('WeatherService', () => {
  it('should work', () => {});
  it('should not break', () => {});
});
```

### 2. **Test Organization**

```javascript
// Group related tests
describe('MapManager', () => {
  describe('Layer Management', () => {
    it('should add layer', () => {});
    it('should remove layer', () => {});
    it('should toggle layer visibility', () => {});
  });
  
  describe('Event Handling', () => {
    it('should handle map click', () => {});
    it('should handle layer toggle', () => {});
  });
});
```

### 3. **Mocking Strategy**

```javascript
// Mock external dependencies
vi.mock('../../../src/services/WeatherService.js', () => ({
  WeatherService: vi.fn().mockImplementation(() => ({
    getCurrentWeather: vi.fn(),
    getForecast: vi.fn()
  }))
}));

// Mock browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
});
```

### 4. **Error Testing**

```javascript
// Test error conditions
it('should handle API errors gracefully', async () => {
  const error = new Error('API Error');
  vi.spyOn(weatherService, 'getCurrentWeather').mockRejectedValue(error);
  
  await expect(weatherService.fetchWeather('Melbourne'))
    .rejects.toThrow('API Error');
});
```

## Emergency Services Considerations

### 1. **Reliability Testing**

- Test offline scenarios
- Validate PWA functionality
- Test with poor network conditions
- Verify error recovery mechanisms

### 2. **Performance Testing**

- Ensure 3-second load time
- Test on low-end devices
- Validate memory usage
- Check battery impact

### 3. **Accessibility Testing**

- Screen reader compatibility
- Keyboard navigation
- High contrast mode
- Touch target sizes

### 4. **Security Testing**

- API key protection
- Data validation
- XSS prevention
- CSRF protection

## Testing Infrastructure Setup

### **Test File Structure**
```
tests/
├── unit/                    # Unit tests (Vitest)
│   ├── components/         # Component unit tests
│   ├── services/           # Service layer tests
│   ├── stores/             # State management tests
│   ├── utils/              # Utility function tests
│   └── __mocks__/          # Mock implementations
├── integration/            # Integration tests (Vitest)
│   ├── api/               # API integration tests
│   ├── components/        # Component interaction tests
│   └── workflows/         # User workflow tests
├── e2e/                   # End-to-end tests (Playwright)
│   ├── github/            # GitHub.io specific tests
│   ├── webapp/            # Web app specific tests
│   ├── native/            # Native app specific tests
│   └── shared/            # Shared E2E test utilities
├── fixtures/              # Test data and fixtures
│   ├── geojson/           # GeoJSON test data
│   ├── api-responses/     # Mock API responses
│   └── images/            # Test images
└── helpers/               # Test utilities and helpers
    ├── test-utils.js      # Common test utilities
    ├── mock-factory.js    # Mock data factory
    └── page-objects/      # Page object models
```

### **Configuration Files**
- **`vitest.config.js`** - Unit and integration test configuration
- **`playwright.github.config.js`** - GitHub.io E2E testing
- **`playwright.webapp.config.js`** - Web app E2E testing
- **`playwright.native.config.js`** - Native app E2E testing
- **`test-setup.js`** - Global test setup and teardown

### **Test Utilities and Helpers**
- **Mock Services**: API mocking for offline testing
- **Test Data Factory**: Generate test data consistently
- **Page Objects**: Reusable page interaction patterns
- **Custom Matchers**: Domain-specific test assertions
- **Test Fixtures**: Reusable test data and setup

### **Multi-Platform Testing Strategy**
- **GitHub.io Tests**: Static functionality, offline capabilities
- **Web App Tests**: Backend integration, real-time features
- **Native App Tests**: Device-specific functionality, app store features

## Conclusion

This comprehensive testing strategy ensures that WeeWoo Map Friends V2 meets the high reliability and performance standards required for emergency services applications. The combination of Vitest for fast unit testing and Playwright for comprehensive E2E testing provides the perfect balance of speed, coverage, and reliability.

**Key Success Factors**:
1. **Comprehensive Coverage**: Unit, integration, and E2E tests
2. **Performance Validation**: 3-second load requirement
3. **Cross-Platform Testing**: Mobile and desktop compatibility
4. **Real Environment Testing**: Actual browser conditions
5. **Fast Feedback**: Quick unit tests, comprehensive E2E tests
6. **Emergency Services Focus**: Critical functionality validation
7. **Multi-Platform Support**: Platform-specific testing configurations

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Draft
