# Testing Framework

Comprehensive testing guide for WeeWoo Map Friend using a hybrid approach: Playwright E2E testing and Jest unit testing.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Framework Overview](#framework-overview)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

WeeWoo Map Friend uses a **hybrid testing approach** combining Playwright E2E testing and Jest unit testing for comprehensive coverage:

### **Core Principles**

- **🧩 Component Reliability**: Each UI component works correctly in real browser environment
- **🗺️ Map Integration**: Mapping functionality behaves as expected in actual browser
- **📱 Cross-Platform Compatibility**: Tests work across different browsers and devices
- **⚡ Performance Standards**: Tests validate performance requirements in real environment
- **🔄 Regression Prevention**: Changes don't break existing functionality
- **✅ Quality Assurance**: Tests validate real implementation in actual browser
- **🔧 ES6 Module Testing**: Comprehensive testing of modern ES6 architecture in browser
- **🚨 Problem-Finding**: Tests designed to identify real issues and system vulnerabilities
- **🛡️ Error Resilience**: Tests validate error handling and recovery mechanisms

## Framework Overview

### **Core Technologies**

#### **Playwright (E2E Testing)**
- **Primary E2E testing framework** with real browser support
- **ES6 Modules**: Native support for modern JavaScript modules
- **Real Browser Environment**: Tests run in actual browsers (Chrome, Firefox, Safari)
- **Cross-Platform Testing**: Desktop and mobile browser testing

#### **Jest (Unit Testing)**
- **Unit testing framework** for core infrastructure components
- **Mock-based testing** for isolated function testing
- **Fast execution** for development iteration
- **Edge case testing** for error conditions and boundary values

### **Test Structure**

#### **Playwright Tests (E2E)**
```
tests/
├── core/                    # Core functionality tests
│   ├── map-functionality.spec.js
│   ├── sidebar-functionality.spec.js
│   └── user-journeys.spec.js
├── performance/             # Performance tests
│   └── performance-accessibility.spec.js
├── compatibility/           # Cross-browser tests
│   └── cross-browser.spec.js
├── debug/                   # Debug and validation tests
│   ├── data-validation.spec.js
│   ├── data-loading.spec.js
│   ├── ui-components.spec.js
│   ├── error-monitoring.spec.js
│   └── module-validation.spec.js
├── global-setup.js          # Global test setup
└── global-teardown.js       # Global test teardown
```

#### **Jest Tests (Unit)**
```
js/modules/
├── StateManager.test.js           # State management (50 tests)
├── EventBus.test.js               # Event system (31 tests)
├── StructuredLogger.test.js       # Logging system (52 tests)
├── UtilityManager.test.js         # Utility functions (59 tests)
├── ErrorBoundary.test.js          # Error recovery (36 tests)
├── DeviceManager.test.js          # Device detection (40 tests)
├── ConfigurationManager.test.js   # Configuration (19 tests)
├── DataLoadingOrchestrator.test.js # Data orchestration (35 tests)
└── CoordinateConverter.test.js    # Mathematical utilities (14 tests)
```

## Hybrid Testing Approach

### **When to Use Each Framework**

#### **Use Playwright for:**
- **E2E User Workflows** - Complete user journeys and interactions
- **Integration Testing** - Map, UI, and data loading integration
- **Cross-Browser Testing** - Compatibility across different browsers
- **Performance Testing** - Load time, accessibility, and performance metrics
- **Real Environment Testing** - Tests that require actual browser APIs

#### **Use Jest for:**
- **Unit Testing** - Individual functions and methods
- **Core Infrastructure** - State management, event system, logging
- **Mathematical Functions** - Coordinate conversion, data processing
- **Error Handling** - Error boundaries and recovery mechanisms
- **Configuration** - Configuration management and validation

### **Benefits of Hybrid Approach**

- **Comprehensive Coverage** - Both unit-level and integration-level testing
- **Fast Development** - Quick unit tests for rapid iteration
- **Real Validation** - E2E tests ensure actual functionality works
- **Maintainable** - Each framework used for its strengths
- **No Redundancy** - Eliminated duplicate test coverage

## Writing Tests

### **Playwright Test Structure**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('#element')).toBeVisible();
  });
});
```

### **ES6 Module Testing**

```javascript
test('should load ES6 modules correctly', async ({ page }) => {
  const moduleStatus = await page.evaluate(() => {
    return {
      dataValidator: typeof window.DataValidator !== 'undefined',
      stateManager: typeof window.stateManager !== 'undefined',
      eventBus: typeof window.globalEventBus !== 'undefined'
    };
  });

  expect(moduleStatus.dataValidator).toBe(true);
  expect(moduleStatus.stateManager).toBe(true);
  expect(moduleStatus.eventBus).toBe(true);
});
```

### **Jest Test Structure**

```javascript
import { StateManager } from './StateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test('should set and get state values', () => {
    stateManager.set('testKey', 'testValue');
    expect(stateManager.get('testKey')).toBe('testValue');
  });

  test('should handle nested state updates', () => {
    stateManager.set('user', { name: 'John', age: 30 });
    expect(stateManager.get('user.name')).toBe('John');
    expect(stateManager.get('user.age')).toBe(30);
  });
});
```

## Running Tests

### **Available Scripts**

#### **Playwright Tests (E2E)**
```bash
# Run all Playwright tests
npm run test

# Run specific test categories
npm run test:core
npm run test:performance
npm run test:compatibility
npm run test:debug

# Run with UI
npm run test:watch

# Run in headed mode
npm run test:headed

# Generate test report
npm run test:report
```

#### **Jest Tests (Unit)**
```bash
# Run all Jest tests
npm test

# Run Jest tests in watch mode
npm run test:watch

# Run Jest tests with coverage
npm run test:coverage
```

## Test Categories

### **Playwright Tests (E2E)**

#### **1. Core Tests (`tests/core/`)**
- **Map Functionality**: Map initialization, layer loading, interactions
- **Sidebar Functionality**: UI components, collapsible sections, search
- **User Journeys**: Complete user workflows and scenarios

#### **2. Performance Tests (`tests/performance/`)**
- **Load Time**: Application startup and data loading performance
- **Accessibility**: WCAG compliance and accessibility features
- **Performance Metrics**: Core Web Vitals and performance benchmarks

#### **3. Compatibility Tests (`tests/compatibility/`)**
- **Cross-Browser**: Chrome, Firefox, Safari, Edge compatibility
- **Mobile Testing**: iOS Safari, Android Chrome testing
- **Responsive Design**: Different viewport sizes and orientations

#### **4. Debug Tests (`tests/debug/`)**
- **Data Validation**: GeoJSON validation and data integrity
- **Data Loading**: Data loading functionality and error handling
- **UI Components**: Component interactions and event system
- **Error Monitoring**: Console errors and error handling
- **Module Validation**: ES6 module loading and initialization

### **Jest Tests (Unit)**

#### **1. Core Infrastructure (`js/modules/`)**
- **StateManager**: State management, persistence, events (50 tests)
- **EventBus**: Event system, pub/sub, error handling (31 tests)
- **StructuredLogger**: Logging system, levels, transports (52 tests)
- **UtilityManager**: Utility functions, helpers (59 tests)

#### **2. Error Handling (`js/modules/`)**
- **ErrorBoundary**: Error recovery, component lifecycle (36 tests)
- **DeviceManager**: Device detection, capabilities (40 tests)

#### **3. Configuration (`js/modules/`)**
- **ConfigurationManager**: Configuration management (19 tests)
- **DataLoadingOrchestrator**: Data loading coordination (35 tests)

#### **4. Utilities (`js/modules/`)**
- **CoordinateConverter**: Mathematical utilities, coordinate conversion (14 tests)

## Performance Testing

### **Load Time Testing**

```javascript
test('should load within performance budget', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // 3 second budget
});
```

### **Accessibility Testing**

```javascript
test('should meet accessibility standards', async ({ page }) => {
  // Check for proper ARIA labels
  await expect(page.locator('[aria-label]')).toHaveCount(5);
  
  // Check for proper heading structure
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h2')).toHaveCount(3);
});
```

## Troubleshooting

### **Common Issues**

1. **Module Loading Errors**
   - Check browser console for ES6 module errors
   - Verify module syntax and imports
   - Check Service Worker interference

2. **Test Timeouts**
   - Increase timeout for slow operations
   - Use `waitForLoadState('networkidle')` for page loads
   - Check for infinite loops or hanging promises

3. **Element Not Found**
   - Use `page.waitForSelector()` for dynamic content
   - Check if element is in iframe or shadow DOM
   - Verify element selectors are correct

### **Debug Mode**

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npx playwright test tests/core/map-functionality.spec.js --debug
```

## Best Practices

1. **Use Real Browser Environment**: Tests run in actual browsers, not simulated environments
2. **Test Real User Scenarios**: Focus on actual user workflows and interactions
3. **Cross-Browser Testing**: Ensure compatibility across different browsers
4. **Performance Monitoring**: Include performance checks in tests
5. **Error Handling**: Test error scenarios and recovery mechanisms
6. **Accessibility**: Include accessibility checks in tests
7. **Mobile Testing**: Test on mobile devices and different viewport sizes
