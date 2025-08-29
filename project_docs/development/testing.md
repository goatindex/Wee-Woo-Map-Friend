# Testing Framework

Comprehensive testing guide for WeeWoo Map Friend, covering Jest setup, component testing, and mapping-specific test patterns.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Framework Overview](#framework-overview)
- [Environment Setup](#environment-setup)
- [Test Categories](#test-categories)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Testing Patterns](#testing-patterns)
- [Mocking Strategy](#mocking-strategy)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

WeeWoo Map Friend follows a comprehensive testing approach that ensures:

- **🧩 Component Reliability**: Each UI component works correctly in isolation
- **🗺️ Map Integration**: Mapping functionality behaves as expected
- **📱 Cross-Platform Compatibility**: Tests work across web and native environments
- **⚡ Performance Standards**: Tests validate performance requirements
- **🔄 Regression Prevention**: Changes don't break existing functionality

## Framework Overview

### **Core Technologies**

- **Jest**: Primary testing framework with jsdom environment
- **Babel**: Transpilation for ES6+ modules and import/export
- **jsdom**: Browser environment simulation for DOM testing
- **Custom Mocks**: Comprehensive mocking for Leaflet, Turf.js, and browser APIs

### **Test Structure**

```
tests/
├── setup.js              # Global test configuration and mocks
├── ComponentBase.test.js  # Base component system tests
└── HamburgerMenu.test.js  # UI component tests

js/
├── modules/
│   └── *.test.js         # Module-specific tests (optional)
└── components/
    └── *.test.js         # Component-specific tests (optional)
```

## Environment Setup

### **Dependencies**

The testing environment requires these key dependencies:

```json
{
  "devDependencies": {
    "@babel/preset-env": "^7.x.x",
    "babel-jest": "^29.x.x",
    "jest": "^29.x.x",
    "jest-environment-jsdom": "^29.x.x"
  }
}
```

### **Configuration Files**

#### **Jest Configuration** (`jest.config.json`)

```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
  "moduleFileExtensions": ["js", "json"],
  "transform": {
    "^.+\\.js$": "babel-jest"
  },
  "testMatch": [
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/js/**/*.test.js"
  ],
  "collectCoverageFrom": [
    "js/modules/**/*.js",
    "js/components/**/*.js",
    "!js/legacy/**/*.js",
    "!**/*.test.js"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"]
}
```

#### **Babel Configuration** (`.babelrc`)

```json
{
  "env": {
    "test": {
      "presets": [
        [
          "@babel/preset-env",
          {
            "targets": {
              "node": "current"
            }
          }
        ]
      ]
    }
  }
}
```

## Test Categories

### **1. Unit Tests**
Test individual functions and classes in isolation.

```javascript
// Example: Testing utility functions
describe('MapUtils', () => {
  test('should calculate correct distance', () => {
    const result = MapUtils.calculateDistance(point1, point2);
    expect(result).toBeCloseTo(expectedDistance, 2);
  });
});
```

### **2. Component Tests**
Test UI components with DOM interaction.

```javascript
// Example: Testing component lifecycle
describe('ComponentBase', () => {
  test('should initialize and destroy properly', () => {
    const component = new ComponentBase(container);
    component.initialize();
    
    expect(component.isInitialized).toBe(true);
    
    component.destroy();
    expect(component.isDestroyed).toBe(true);
  });
});
```

### **3. Integration Tests**
Test component interactions and data flow.

```javascript
// Example: Testing sidebar and map integration
describe('Sidebar Integration', () => {
  test('should update map when layer is activated', async () => {
    const sidebar = new Sidebar(container);
    const mockMap = mockLeafletMap();
    
    await sidebar.activateLayer('ses', 'example-polygon');
    
    expect(mockMap.addLayer).toHaveBeenCalled();
  });
});
```

### **4. Performance Tests**
Validate performance requirements and detect regressions.

```javascript
// Example: Performance boundary testing
describe('Layer Performance', () => {
  test('should render large dataset within time limit', async () => {
    const startTime = performance.now();
    
    await LayerManager.loadGeoJSON('large-dataset.geojson');
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(300); // 300ms limit
  });
});
```

## Writing Tests

### **File Organization**

#### **Test File Naming**
- **Unit tests**: `ComponentName.test.js`
- **Integration tests**: `FeatureName.integration.test.js`
- **Performance tests**: `FeatureName.performance.test.js`

#### **Test Structure Pattern**

```javascript
/**
 * @jest-environment jsdom
 */

import { ComponentToTest } from '../js/components/ComponentToTest.js';

describe('ComponentToTest', () => {
  let component;
  let container;

  beforeEach(() => {
    // Setup for each test
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup after each test
    if (component && !component.isDestroyed) {
      component.destroy();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Constructor', () => {
    test('should create component with valid container', () => {
      component = new ComponentToTest(container);
      
      expect(component.container).toBe(container);
      expect(component.isInitialized).toBe(false);
    });
  });

  describe('Methods', () => {
    beforeEach(() => {
      component = new ComponentToTest(container);
    });

    test('should perform expected behavior', () => {
      // Test implementation
    });
  });
});
```

### **Testing Best Practices**

#### **✅ Do:**
- Use descriptive test names that explain the expected behavior
- Test both success and error cases
- Clean up DOM elements and event listeners after each test
- Use appropriate assertions (`toBe`, `toEqual`, `toHaveBeenCalled`)
- Mock external dependencies (APIs, timers, etc.)
- Test component lifecycle (initialization, updates, destruction)

#### **❌ Don't:**
- Test implementation details (private methods, internal state)
- Create tests that depend on other tests (order dependency)
- Use real network requests or timers in tests
- Leave memory leaks (unremoved event listeners, DOM elements)
- Test third-party library functionality (Leaflet, Turf.js)

## Running Tests

### **Installation**

First, ensure testing dependencies are installed:

```bash
# Install Jest and related dependencies
npm install --save-dev jest jest-environment-jsdom babel-jest @babel/preset-env

# Or run the existing setup if package.json already includes these
npm install
```

### **Running Test Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- ComponentBase.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should initialize"
```

### **Coverage Reports**

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Terminal Output**: Displayed after running `npm test -- --coverage`

#### **Coverage Targets**

| Type | Target | Acceptable | Poor |
|------|--------|------------|------|
| **Statements** | > 80% | 70-80% | < 70% |
| **Branches** | > 75% | 65-75% | < 65% |
| **Functions** | > 85% | 75-85% | < 75% |
| **Lines** | > 80% | 70-80% | < 70% |

## Testing Patterns

### **Component Testing Pattern**

```javascript
describe('Component Lifecycle', () => {
  test('should initialize with correct default state', async () => {
    component = await Component.create(container, options);
    
    // Verify initial state
    expect(component.isInitialized).toBe(true);
    expect(component.container).toBe(container);
    expect(component.options).toMatchObject(expectedDefaults);
  });

  test('should handle user interactions', async () => {
    component = await Component.create(container);
    const mockHandler = jest.fn();
    component.on('event', mockHandler);
    
    // Simulate user action
    component.container.click();
    
    expect(mockHandler).toHaveBeenCalledWith(expectedEventData);
  });

  test('should clean up properly on destroy', () => {
    component = new Component(container);
    component.initialize();
    
    const spy = jest.spyOn(component, 'removeEventListeners');
    component.destroy();
    
    expect(spy).toHaveBeenCalled();
    expect(component.isDestroyed).toBe(true);
  });
});
```

### **Async Testing Pattern**

```javascript
describe('Async Operations', () => {
  test('should load data successfully', async () => {
    const mockData = { features: [] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const result = await DataLoader.loadGeoJSON('test.geojson');
    
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('test.geojson');
  });

  test('should handle load errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(DataLoader.loadGeoJSON('invalid.geojson'))
      .rejects.toThrow('Network error');
  });
});
```

### **Map Integration Testing**

```javascript
describe('Map Integration', () => {
  test('should add layer to map', () => {
    const mockLayer = { addTo: jest.fn() };
    global.L.geoJSON.mockReturnValue(mockLayer);
    
    MapManager.addGeoJSONLayer(mockGeoJSONData);
    
    expect(global.L.geoJSON).toHaveBeenCalledWith(mockGeoJSONData);
    expect(mockLayer.addTo).toHaveBeenCalled();
  });

  test('should handle map events', () => {
    const mapInstance = global.L.map();
    const eventHandler = jest.fn();
    
    MapManager.on('layerActivated', eventHandler);
    
    // Simulate map interaction
    mapInstance.fireEvent('click', { latlng: [lat, lng] });
    
    expect(eventHandler).toHaveBeenCalled();
  });
});
```

## Mocking Strategy

### **Global Mocks** (`tests/setup.js`)

#### **Leaflet.js Mocking**

```javascript
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fireEvent: jest.fn()
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  geoJSON: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    setStyle: jest.fn(),
    eachLayer: jest.fn()
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    bindPopup: jest.fn(),
    setLatLng: jest.fn()
  }))
};
```

#### **Turf.js Mocking**

```javascript
global.turf = {
  point: jest.fn((coords) => ({ 
    type: 'Feature', 
    geometry: { type: 'Point', coordinates: coords } 
  })),
  polygon: jest.fn((coords) => ({ 
    type: 'Feature', 
    geometry: { type: 'Polygon', coordinates: coords } 
  })),
  booleanPointInPolygon: jest.fn(() => true),
  distance: jest.fn(() => 1000),
  centroid: jest.fn((feature) => feature)
};
```

#### **Browser API Mocking**

```javascript
// Fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// LocalStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};
```

### **Custom Mocks for Tests**

```javascript
// Mock a specific service
jest.mock('../js/services/WeatherService.js', () => ({
  WeatherService: {
    getForecast: jest.fn(() => Promise.resolve({
      temperature: 20,
      conditions: 'Sunny'
    }))
  }
}));

// Mock with implementation
const mockMapInstance = {
  setView: jest.fn(),
  addLayer: jest.fn(),
  on: jest.fn((event, handler) => {
    // Store handler for later simulation
    mockMapInstance._handlers = mockMapInstance._handlers || {};
    mockMapInstance._handlers[event] = handler;
  }),
  fireEvent: jest.fn((event, data) => {
    const handler = mockMapInstance._handlers?.[event];
    if (handler) handler(data);
  })
};
```

## Performance Testing

### **Performance Test Structure**

```javascript
describe('Performance Tests', () => {
  beforeEach(() => {
    // Clear any performance markers
    performance.clearMarks();
    performance.clearMeasures();
  });

  test('should load large GeoJSON within time limit', async () => {
    const startTime = performance.now();
    
    await LayerManager.loadGeoJSON('large-dataset.geojson');
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500); // 500ms limit
  });

  test('should render polygons efficiently', () => {
    const polygons = generateTestPolygons(1000);
    
    performance.mark('render-start');
    
    polygons.forEach(polygon => {
      MapRenderer.addPolygon(polygon);
    });
    
    performance.mark('render-end');
    performance.measure('polygon-rendering', 'render-start', 'render-end');
    
    const measure = performance.getEntriesByName('polygon-rendering')[0];
    expect(measure.duration).toBeLessThan(200); // 200ms for 1000 polygons
  });
});
```

### **Memory Testing**

```javascript
describe('Memory Management', () => {
  test('should not leak memory after component destruction', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Create and destroy multiple components
    for (let i = 0; i < 100; i++) {
      const component = new TestComponent(document.createElement('div'));
      component.initialize();
      component.destroy();
    }
    
    // Force garbage collection (if available)
    if (global.gc) global.gc();
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryGrowth = finalMemory - initialMemory;
    
    // Memory growth should be minimal
    expect(memoryGrowth).toBeLessThan(1000000); // 1MB limit
  });
});
```

## Troubleshooting

### **Common Issues**

#### **❌ Jest Configuration Errors**

**Problem**: `Cannot use import statement outside a module`

**Solution**: Ensure Babel is configured correctly:

```json
// .babelrc
{
  "env": {
    "test": {
      "presets": [["@babel/preset-env", { "targets": { "node": "current" } }]]
    }
  }
}
```

#### **❌ Mock Not Working**

**Problem**: Real dependencies are being called instead of mocks

**Solution**: Check mock is defined before import:

```javascript
// Mock BEFORE importing the module that uses it
jest.mock('../js/services/ApiService.js');
import { ComponentThatUsesApi } from '../js/components/Component.js';
```

#### **❌ DOM Element Not Found**

**Problem**: `Cannot read property of null` for DOM elements

**Solution**: Ensure proper setup and cleanup:

```javascript
beforeEach(() => {
  document.body.innerHTML = '<div id="container"></div>';
});

afterEach(() => {
  document.body.innerHTML = '';
});
```

#### **❌ Async Test Timeout**

**Problem**: Tests timeout with async operations

**Solution**: Use proper async/await pattern:

```javascript
test('should handle async operation', async () => {
  const promise = asyncFunction();
  await expect(promise).resolves.toEqual(expectedResult);
});
```

### **Debugging Tests**

#### **Enable Debug Output**

```javascript
// Add to specific tests for debugging
console.log('Component state:', component.getState());
console.log('DOM structure:', container.innerHTML);
```

#### **Using Jest Debugging**

```bash
# Run Jest with Node debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file with debugging
node --inspect-brk node_modules/.bin/jest ComponentBase.test.js --runInBand
```

#### **Test Coverage Debugging**

```bash
# Generate detailed coverage report
npm test -- --coverage --verbose

# View coverage for specific files
npm test -- --coverage --collectCoverageFrom="js/components/ComponentBase.js"
```

### **Performance Debugging**

```javascript
// Add performance monitoring to tests
test('should be performant', () => {
  const startTime = performance.now();
  
  // Test operation
  performOperation();
  
  const duration = performance.now() - startTime;
  console.log(`Operation took ${duration}ms`);
  
  expect(duration).toBeLessThan(100);
});
```

## Related Documentation

- **[Performance Baselines](../../README.md#performance)**: Performance optimization and monitoring (*Documentation planned*)
- **[Component Architecture](../../docs/intro.md)**: Component design patterns and system overview
- **[Development Setup](../../README.md#quick-start)**: Development environment setup and local development
- **[API Reference](../../README.md#api-reference)**: API documentation and usage examples

---

*This testing framework documentation provides comprehensive guidance for maintaining code quality and reliability in WeeWoo Map Friend. Keep tests updated as the application evolves, and ensure new features include appropriate test coverage.*