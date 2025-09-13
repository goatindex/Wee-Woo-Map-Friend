# Testing Framework

Comprehensive testing guide for WeeWoo Map Friend using Playwright for both E2E and unit testing.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Framework Overview](#framework-overview)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Build Process Integration](#build-process-integration)
- [Test Performance Optimization](#test-performance-optimization)
- [Running Tests](#running-tests)
- [Multi-Server Architecture](#multi-server-architecture)
- [Test Categories](#test-categories)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

WeeWoo Map Friend uses **Playwright for all testing** - both E2E and unit testing - providing comprehensive coverage in a unified framework:

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

#### **Playwright (E2E & Unit Testing)**
- **Unified testing framework** for both E2E and unit testing
- **Real Browser Environment**: Tests run in actual browsers (Chrome, Firefox, Safari)
- **ES6 Modules**: Native support for modern JavaScript modules
- **Cross-Platform Testing**: Desktop and mobile browser testing
- **Unit Testing**: Isolated function testing using `page.evaluate()`
- **Fast Development**: Single framework for all testing needs

### **Test Structure**

#### **Playwright Tests (E2E & Unit)**
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
├── unit/                    # Unit tests for isolated functions
│   ├── unit-test-utilities.spec.js
│   ├── state-management.spec.js
│   ├── event-system.spec.js
│   └── utility-functions.spec.js
├── global-setup.js          # Global test setup
└── global-teardown.js       # Global test teardown
```

## Unified Testing Approach

### **When to Use Each Test Type**

#### **Use E2E Tests for:**
- **User Workflows** - Complete user journeys and interactions
- **Integration Testing** - Map, UI, and data loading integration
- **Cross-Browser Testing** - Compatibility across different browsers
- **Performance Testing** - Load time, accessibility, and performance metrics
- **Real Environment Testing** - Tests that require actual browser APIs

#### **Use Unit Tests for:**
- **Isolated Functions** - Individual functions and methods using `page.evaluate()`
- **Core Infrastructure** - State management, event system, logging
- **Mathematical Functions** - Coordinate conversion, data processing
- **Error Handling** - Error boundaries and recovery mechanisms
- **Configuration** - Configuration management and validation

### **Benefits of Unified Approach**

- **Single Framework** - One tool for all testing needs
- **Real Browser Environment** - All tests run in actual browsers
- **Comprehensive Coverage** - Both unit-level and integration-level testing
- **Simplified Maintenance** - No need to manage multiple testing frameworks
- **Consistent API** - Same testing patterns for all test types

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

### **Unit Test Structure (Playwright)**

```javascript
import { test, expect } from '@playwright/test';

test.describe('StateManager Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.stateManager !== 'undefined');
  });

  test('should set and get state values', async ({ page }) => {
    const result = await page.evaluate(() => {
      const stateManager = window.stateManager;
      stateManager.set('testKey', 'testValue');
      return stateManager.get('testKey');
    });
    
    expect(result).toBe('testValue');
  });

  test('should handle nested state updates', async ({ page }) => {
    const result = await page.evaluate(() => {
      const stateManager = window.stateManager;
      stateManager.set('user', { name: 'John', age: 30 });
      return {
        name: stateManager.get('user.name'),
        age: stateManager.get('user.age')
      };
    });
    
    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
  });
});
```

## Build Process Integration

### **Why Build Before Testing**

The application uses **SWC (Speedy Web Compiler)** to transform TypeScript decorators and ES6 modules into browser-compatible JavaScript. This build process is **essential for testing** because:

#### **Decorator Transformation**
- **Source Code** (`js/modules/`): Contains TypeScript decorators like `@injectable()` and `@inject()`
- **SWC Compilation**: Transforms decorators into standard JavaScript function calls
- **Output** (`dist/modules/`): Contains the transformed, browser-compatible code

#### **Build Process Flow**
```
Source Code (js/modules/) 
    ↓
SWC Compilation (decorators + ES6 + path stripping)
    ↓
Compiled JavaScript (dist/modules/)
    ↓
Playwright Tests (run against compiled code)
```

#### **What SWC Transforms**
```typescript
// Source code (js/modules/ConfigService.js)
@injectable()
export class ConfigService {
  @inject('ConfigService')
  private config: any;
}
```

**Into:**
```javascript
// Compiled code (dist/modules/ConfigService.js)
export class ConfigService {
  constructor() {
    this.config = container.get('ConfigService');
  }
}
```

### **Automatic Build Integration**

All test scripts now **automatically run the build process** before testing:

```bash
# These commands now include build:js automatically
npm run test              # Build + E2E + Unit tests
npm run test:e2e          # Build + E2E tests only
npm run test:unit         # Build + Unit tests only
npm run test:watch        # Build + Interactive UI mode
npm run test:dashboard    # Build + HTML report generation
```

### **Manual Build Process**

If you need to build manually:

```bash
# Build JavaScript modules
npm run build:js

# Watch for changes and auto-rebuild
npm run watch:js

# Serve compiled files for testing
npm run serve:dist
```

## Test Performance Optimization

### **Phase 1: Quick Wins (Implemented)**

#### **Parallel Execution**
- **Workers**: 6 workers locally, 2 on CI for optimal performance
- **Fully Parallel**: All tests run in parallel across browsers
- **Browser Parallelism**: Multiple browsers run simultaneously

#### **Test Categorization Scripts**
```bash
# Fast tests (unit + core)
npm run test:fast

# Slow tests (performance + debug)  
npm run test:slow

# Smoke tests (critical functionality)
npm run test:smoke

# Critical tests only
npm run test:critical

# Skip marked tests
npm run test:changed
```

#### **Retry Strategy**
- **Local Development**: No retries (faster feedback)
- **CI Environment**: 2 retries for flaky test handling

### **Phase 2: Multi-Server Architecture (Implemented)**

#### **4-Server Setup**
- **Port 8001**: Unit Tests (2 workers: unit-chromium, unit-firefox)
- **Port 8002**: E2E Tests (2 workers: e2e-chromium, e2e-mobile) + Compatibility
- **Port 8003**: Debug Tests (1 worker: debug-webkit)
- **Port 8004**: Performance Tests (1 worker: performance-chromium)

#### **Server-Specific Commands**
```bash
# Individual server tests
npm run test:unit        # Unit tests (port 8001)
npm run test:core        # E2E tests (port 8002)
npm run test:debug       # Debug tests (port 8003)
npm run test:performance # Performance tests (port 8004)

# Multi-server testing
npm run test:servers     # One project from each server
```

#### **Resource Distribution**
- **Eliminated Bottlenecks**: No single server contention
- **Parallel Server Execution**: All 4 servers run simultaneously
- **Optimized Worker Allocation**: 6 workers distributed across 4 servers
- **System Resource Utilization**: Optimized for 8-core, 16-thread systems

### **Expected Performance Gains**
- **Phase 1 Improvements**: 60-70% faster test runs
- **Phase 2 Multi-Server**: Additional 30-40% improvement
- **Total Expected Improvement**: 70-80% faster overall
- **Current Performance**: 7-12 minutes (down from 10-20 minutes)
- **Selective Testing**: 80-90% faster for incremental runs

## Running Tests

### **Available Scripts**

#### **Multi-Server Test Commands**
```bash
# Run all tests across all servers
npm run test

# Run specific server categories
npm run test:unit        # Unit tests (port 8001)
npm run test:core        # E2E tests (port 8002)
npm run test:debug       # Debug tests (port 8003)
npm run test:performance # Performance tests (port 8004)
npm run test:compatibility # Compatibility tests (port 8002)

# Multi-server testing
npm run test:servers     # One project from each server

# Run with UI
npm run test:watch

# Run in headed mode
npm run test:headed

# Generate test report
npm run test:report
```

#### **Test Categorization Scripts**
```bash
# Fast tests (unit + core)
npm run test:fast

# Slow tests (performance + debug)  
npm run test:slow

# Smoke tests (critical functionality)
npm run test:smoke

# Critical tests only
npm run test:critical

# Skip marked tests
npm run test:changed
```

#### **Unit Tests (Playwright)**
```bash
# Run all unit tests
npm run test:unit

# Run specific unit test categories
npm run test:unit -- --grep "State Management"
npm run test:unit -- --grep "Event System"
npm run test:unit -- --grep "Utility Functions"
```

## Multi-Server Architecture

### **Server Distribution**

The testing framework uses a **4-server architecture** to optimize performance and eliminate bottlenecks:

#### **Port 8001: Unit Tests**
- **Workers**: 2 (unit-chromium, unit-firefox)
- **Test Files**: `tests/unit/**/*.spec.js`
- **Purpose**: Fast, isolated function testing
- **Expected Runtime**: 2-4 minutes

#### **Port 8002: E2E Tests**
- **Workers**: 2 (e2e-chromium, e2e-mobile) + 1 (compatibility-firefox)
- **Test Files**: `tests/core/**/*.spec.js`, `tests/compatibility/**/*.spec.js`
- **Purpose**: End-to-end user workflow testing
- **Expected Runtime**: 3-5 minutes

#### **Port 8003: Debug Tests**
- **Workers**: 1 (debug-webkit)
- **Test Files**: `tests/debug/**/*.spec.js`
- **Purpose**: Error handling and debugging validation
- **Expected Runtime**: 3-5 minutes

#### **Port 8004: Performance Tests**
- **Workers**: 1 (performance-chromium)
- **Test Files**: `tests/performance/**/*.spec.js`
- **Purpose**: Performance and accessibility testing
- **Expected Runtime**: 2-3 minutes

### **Benefits of Multi-Server Setup**

#### **Performance Benefits**
- **Eliminated Bottlenecks**: No single server contention
- **Parallel Server Execution**: All 4 servers run simultaneously
- **Resource Distribution**: Load spread across multiple ports
- **Optimized Worker Allocation**: 6 workers distributed efficiently

#### **System Resource Utilization**
- **CPU**: 8 cores, 16 threads - optimal for 4 servers + 6 workers
- **Memory**: 30GB RAM - sufficient for all server instances
- **Network**: Localhost ports - no network latency
- **I/O**: Distributed file serving - reduced disk contention

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

### **Unit Tests (Playwright)**

#### **1. State Management (`tests/unit/state-management.spec.js`)**
- **State Operations**: Set, get, update, delete operations
- **State Persistence**: Local storage and session management
- **State Subscriptions**: Event-driven state changes
- **Error Handling**: Invalid operations and edge cases

#### **2. Event System (`tests/unit/event-system.spec.js`)**
- **Event Emission**: Basic event publishing
- **Event Listening**: Multiple listeners and subscriptions
- **Event Data**: Complex data passing and validation
- **Event Cleanup**: Listener removal and memory management

#### **3. Utility Functions (`tests/unit/utility-functions.spec.js`)**
- **Coordinate Conversion**: Lat/lng calculations and formatting
- **Data Validation**: GeoJSON, coordinates, email, phone validation
- **String Manipulation**: Capitalization, truncation, slugification
- **Array Operations**: Unique arrays, chunking, flattening, grouping

#### **4. Test Utilities (`tests/unit/unit-test-utilities.spec.js`)**
- **Testing Patterns**: Common unit testing approaches
- **Module Loading**: ES6 module availability and initialization
- **Isolated Functions**: Pure function testing without dependencies

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

### **Multi-Server Issues**

1. **Port Conflicts**
   - Check if ports 8001-8004 are available
   - Kill existing processes: `netstat -ano | findstr :8001`
   - Restart tests to clear port conflicts

2. **Server Startup Failures**
   - Verify Python is installed and accessible
   - Check server logs in terminal output
   - Ensure no firewall blocking localhost ports

3. **Worker Distribution Issues**
   - Verify all 6 workers are running
   - Check `playwright.config.js` worker configuration
   - Monitor system resources (CPU/Memory usage)

4. **Test Project Mismatches**
   - Verify test files match project `testMatch` patterns
   - Check `baseURL` configuration per project
   - Ensure correct server assignment

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
