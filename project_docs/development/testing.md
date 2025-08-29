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

The testing environment includes these key dependencies (already configured in `package.json`):

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0", 
    "babel-jest": "^29.7.0",
    "@babel/preset-env": "^7.22.0"
  }
}
```

**Note**: These dependencies are already included in the project's `package.json`, so no additional installation is required beyond running `npm install`.

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

### **Search Functionality Testing**

Pattern for testing search components with emergency services data:

```javascript
describe('SearchManager Functionality', () => {
  let searchManager;
  let searchInput;
  let searchResults;

  beforeEach(() => {
    // Create search DOM structure
    container.innerHTML = `
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search emergency services...">
        <div class="search-results"></div>
      </div>
    `;
    
    searchInput = container.querySelector('.search-input');
    searchResults = container.querySelector('.search-results');
    searchManager = new SearchManager(container, mockEmergencyData);
  });

  test('should filter search results by category', () => {
    // Simulate user typing
    searchInput.value = 'ballarat';
    searchInput.dispatchEvent(new Event('input'));

    // Should find results in multiple categories
    const results = searchResults.querySelectorAll('.search-result-item');
    expect(results.length).toBeGreaterThan(0);
    
    // Verify results contain expected categories
    const resultTexts = Array.from(results).map(r => r.textContent);
    expect(resultTexts.some(text => text.includes('SES'))).toBe(true);
    expect(resultTexts.some(text => text.includes('LGA'))).toBe(true);
  });

  test('should handle no search results gracefully', () => {
    searchInput.value = 'nonexistent location';
    searchInput.dispatchEvent(new Event('input'));

    const noResults = searchResults.querySelector('.no-results');
    expect(noResults).toBeTruthy();
    expect(noResults.textContent).toContain('No results found');
  });

  test('should activate item when search result is clicked', () => {
    const mockActivate = jest.fn();
    searchManager.on('itemActivated', mockActivate);
    
    searchInput.value = 'ballarat';
    searchInput.dispatchEvent(new Event('input'));
    
    const firstResult = searchResults.querySelector('.search-result-item');
    firstResult.click();
    
    expect(mockActivate).toHaveBeenCalledWith(expect.objectContaining({
      category: 'ses',
      key: 'ballarat_city',
      name: 'Ballarat City'
    }));
  });
});
```

### **DOM Testing Patterns**

WeeWoo-specific patterns for testing DOM interactions:

```javascript
describe('DOM Testing Patterns', () => {
  test('should test component render structure', () => {
    const component = new ActiveListManager(container, mockEmergencyData);
    component.render();

    // Test specific DOM structure
    expect(container.querySelector('.active-list-container')).toBeTruthy();
    expect(container.querySelector('.active-list-header')).toBeTruthy();
    expect(container.querySelectorAll('.active-list-icon-header')).toHaveLength(3);
  });

  test('should test button interactions with proper wait patterns', (done) => {
    const component = new CollapsibleManager(container);
    const toggleButton = container.querySelector('.collapsible-toggle');
    
    toggleButton.click();
    
    // Use setTimeout for async DOM updates (project pattern)
    setTimeout(() => {
      expect(container.querySelector('.collapsed')).toBeTruthy();
      done();
    }, 20);
  });

  test('should test form interactions', () => {
    const checkbox = container.querySelector('input[type="checkbox"]');
    const mockHandler = jest.fn();
    
    checkbox.addEventListener('change', mockHandler);
    
    // Simulate user interaction
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    expect(mockHandler).toHaveBeenCalled();
    expect(checkbox.checked).toBe(true);
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
- Use `setTimeout` for async DOM updates (20ms is project standard)
- Test with real emergency services data structure (SES, LGA, CFA)

#### **❌ Don't:**
- Test implementation details (private methods, internal state)
- Create tests that depend on other tests (order dependency)
- Use real network requests or timers in tests
- Leave memory leaks (unremoved event listeners, DOM elements)
- Test third-party library functionality (Leaflet, Turf.js)
- Forget to test accessibility attributes (aria-expanded, etc.)

## Running Tests

### **Quick Start**

The project is pre-configured for testing. To get started:

```bash
# Install all dependencies (including testing dependencies)
npm install

# Run tests
npm test
```

### **Available Test Commands**

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm test` | Run all tests once | CI/CD, quick validation |
| `npm run test:watch` | Run tests in watch mode | Active development |
| `npm run test:coverage` | Generate coverage report | Before commits, coverage analysis |
| `npm run test:pwa` | Serve app for manual testing | PWA functionality testing |

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run PWA test server (serves app on localhost:8000)
npm run test:pwa

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

#### **WeeWoo Map Friend Component Pattern**

Based on the actual project components like `HamburgerMenu` and `SearchManager`:

```javascript
describe('HamburgerMenu Component', () => {
  let hamburgerMenu;
  let container;

  beforeEach(() => {
    // Standard DOM setup for WeeWoo components
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container');
  });

  afterEach(() => {
    if (hamburgerMenu) {
      hamburgerMenu.destroy();
    }
    document.body.innerHTML = '';
  });

  test('should create component with default options', async () => {
    hamburgerMenu = await HamburgerMenu.create(container);
    
    expect(hamburgerMenu).toBeInstanceOf(HamburgerMenu);
    expect(hamburgerMenu.isOpen).toBe(false);
    expect(hamburgerMenu.options.position).toBe('top-right');
  });

  test('should handle menu toggle interactions', () => {
    const button = hamburgerMenu.find('.hamburger-button');
    
    // Test open
    button.click();
    expect(hamburgerMenu.isOpen).toBe(true);
    expect(button.classList.contains('active')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    
    // Test close
    button.click();
    expect(hamburgerMenu.isOpen).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  test('should clean up properly on destroy', () => {
    const spy = jest.spyOn(hamburgerMenu, 'removeEventListeners');
    hamburgerMenu.destroy();
    
    expect(spy).toHaveBeenCalled();
    expect(hamburgerMenu.isDestroyed).toBe(true);
  });
});
```

#### **Emergency Services Data Testing**

Pattern for testing components that handle SES, LGA, CFA data:

```javascript
describe('ActiveListManager with Emergency Services Data', () => {
  // Real mock data pattern from the project
  const mockEmergencyData = {
    namesByCategory: {
      ses: ['Alpine Resorts', 'Ararat Rural City', 'Ballarat City'],
      lga: ['Ballarat', 'Bendigo', 'Geelong'], 
      cfa: ['Ballarat Group', 'Bendigo Group', 'Geelong Group']
    },
    nameToKey: {
      ses: {
        'Alpine Resorts': 'alpine_resorts',
        'Ballarat City': 'ballarat_city'
      },
      lga: {
        'Ballarat': 'ballarat',
        'Geelong': 'geelong'
      }
    },
    categoryMeta: {
      ses: { type: 'polygon' },
      lga: { type: 'polygon' },
      cfa: { type: 'point' }
    },
    outlineColors: {
      ses: '#ff6b35',
      lga: '#4ecdc4', 
      cfa: '#45b7d1'
    }
  };

  test('should handle emergency services data correctly', () => {
    const manager = new ActiveListManager(container, mockEmergencyData);
    
    expect(manager.data.namesByCategory.ses).toHaveLength(3);
    expect(manager.data.outlineColors.ses).toBe('#ff6b35');
    expect(manager.data.categoryMeta.cfa.type).toBe('point');
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

#### **GeoJSON Layer Testing Pattern**

Based on real emergency services GeoJSON handling:

```javascript
describe('Emergency Services GeoJSON Integration', () => {
  let mockGeoJSONLayer;
  
  beforeEach(() => {
    mockGeoJSONLayer = {
      addTo: jest.fn(),
      remove: jest.fn(),
      setStyle: jest.fn(),
      eachLayer: jest.fn()
    };
    global.L.geoJSON.mockReturnValue(mockGeoJSONLayer);
  });

  test('should load SES polygon layer correctly', () => {
    const sesGeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { 
          name: 'Ballarat City',
          category: 'ses' 
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[143.8, -37.5], [143.9, -37.5], [143.9, -37.6], [143.8, -37.6], [143.8, -37.5]]]
        }
      }]
    };

    LayerManager.addGeoJSONLayer('ses', sesGeoJSON);
    
    expect(global.L.geoJSON).toHaveBeenCalledWith(sesGeoJSON, expect.objectContaining({
      style: expect.any(Function),
      onEachFeature: expect.any(Function)
    }));
    expect(mockGeoJSONLayer.addTo).toHaveBeenCalled();
  });

  test('should handle CFA point markers correctly', () => {
    const cfaGeoJSON = {
      type: 'FeatureCollection', 
      features: [{
        type: 'Feature',
        properties: {
          name: 'Ballarat Fire Station',
          category: 'cfa'
        },
        geometry: {
          type: 'Point',
          coordinates: [143.85, -37.55]
        }
      }]
    };

    LayerManager.addGeoJSONLayer('cfa', cfaGeoJSON);
    
    expect(global.L.geoJSON).toHaveBeenCalledWith(cfaGeoJSON, expect.objectContaining({
      pointToLayer: expect.any(Function)
    }));
  });

  test('should apply correct styling for emergency services', () => {
    const stylingOptions = {
      ses: { color: '#ff6b35', weight: 2 },
      lga: { color: '#4ecdc4', weight: 2 },
      cfa: { color: '#45b7d1', weight: 3 }
    };

    Object.keys(stylingOptions).forEach(category => {
      const style = LayerManager.getStyleForCategory(category);
      expect(style.color).toBe(stylingOptions[category].color);
      expect(style.weight).toBe(stylingOptions[category].weight);
    });
  });
});
```

#### **State Management Integration Testing**

Pattern for testing StateManager and EventBus integration:

```javascript
describe('State Management Integration', () => {
  let component;
  let mockStateManager;
  let mockEventBus;

  beforeEach(() => {
    // Mock the global state manager 
    mockStateManager = {
      setState: jest.fn(),
      getState: jest.fn(() => ({})),
      subscribe: jest.fn()
    };
    
    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };

    // Replace global instances
    jest.spyOn(require('../modules/StateManager.js'), 'stateManager', 'get')
      .mockReturnValue(mockStateManager);
    jest.spyOn(require('../modules/EventBus.js'), 'globalEventBus', 'get')
      .mockReturnValue(mockEventBus);
  });

  test('should update state when layer is activated', () => {
    const searchManager = new SearchManager(container, mockEmergencyData);
    
    searchManager.activateItem('ses', 'ballarat_city', 'Ballarat City');
    
    expect(mockStateManager.setState).toHaveBeenCalledWith({
      activeItems: expect.objectContaining({
        ses: expect.arrayContaining(['ballarat_city'])
      })
    });
  });

  test('should emit events for layer changes', () => {
    const activeListManager = new ActiveListManager(container, mockEmergencyData);
    
    activeListManager.removeItem('lga', 'geelong');
    
    expect(mockEventBus.emit).toHaveBeenCalledWith('layerRemoved', {
      category: 'lga',
      key: 'geelong'
    });
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

#### **Emergency Services Performance Testing**

Performance tests specific to WeeWoo Map Friend's mapping requirements:

```javascript
describe('Emergency Services Performance Tests', () => {
  beforeEach(() => {
    // Clear any performance markers
    performance.clearMarks();
    performance.clearMeasures();
  });

  test('should load SES GeoJSON data within performance targets', async () => {
    const startTime = performance.now();
    
    // Test with real SES data size (~85ms target from baselines)
    await LayerManager.loadGeoJSON('ses', mockLargeSESData);
    
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(100); // SES rendering target: 85ms
  });

  test('should handle LGA polygon rendering efficiently', () => {
    const lgaPolygons = generateMockLGAPolygons(79); // Victoria has 79 LGAs
    
    performance.mark('lga-render-start');
    
    lgaPolygons.forEach(polygon => {
      LayerManager.addPolygonToMap('lga', polygon);
    });
    
    performance.mark('lga-render-end');
    performance.measure('lga-rendering', 'lga-render-start', 'lga-render-end');
    
    const measure = performance.getEntriesByName('lga-rendering')[0];
    expect(measure.duration).toBeLessThan(120); // LGA rendering target: 120ms
  });

  test('should perform search filtering within acceptable time', () => {
    const searchManager = new SearchManager(container, mockLargeEmergencyData);
    
    performance.mark('search-start');
    
    // Test search with common query that returns many results
    const results = searchManager.filterResults('ballarat');
    
    performance.mark('search-end');
    performance.measure('search-filtering', 'search-start', 'search-end');
    
    const measure = performance.getEntriesByName('search-filtering')[0];
    expect(measure.duration).toBeLessThan(50); // Search should be under 50ms
    expect(results.length).toBeGreaterThan(0);
  });

  test('should handle active list updates efficiently', () => {
    const activeListManager = new ActiveListManager(container, mockEmergencyData);
    
    performance.mark('update-start');
    
    // Add multiple items rapidly (simulating user activating many layers)
    for (let i = 0; i < 10; i++) {
      activeListManager.addItem('ses', `item_${i}`, `Test Item ${i}`);
    }
    
    performance.mark('update-end');
    performance.measure('active-list-updates', 'update-start', 'update-end');
    
    const measure = performance.getEntriesByName('active-list-updates')[0];
    expect(measure.duration).toBeLessThan(100); // Multiple updates under 100ms
  });
});
```

#### **Memory Performance Testing**

```javascript
describe('Memory Management Performance', () => {
  test('should not leak memory when loading/unloading layers', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Load and unload emergency services layers multiple times
    for (let cycle = 0; cycle < 5; cycle++) {
      const layerManager = new LayerManager();
      
      // Load all emergency services categories
      ['ses', 'lga', 'cfa', 'ambulance', 'police'].forEach(category => {
        layerManager.loadCategory(category, mockEmergencyData[category]);
      });
      
      // Clean up
      layerManager.destroy();
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryGrowth = finalMemory - initialMemory;
    
    // Memory growth should be minimal for emergency services data
    expect(memoryGrowth).toBeLessThan(5000000); // 5MB limit for multiple cycles
  });

  test('should handle large GeoJSON datasets without memory spikes', () => {
    const beforeMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Load largest dataset (police stations)
    const policeManager = new PoliceLayerManager();
    policeManager.loadPoliceStations(mockLargePoliceData);
    
    const afterMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = afterMemory - beforeMemory;
    
    // Memory increase should be reasonable for police data
    expect(memoryIncrease).toBeLessThan(1000000); // 1MB limit for police data
    
    // Clean up
    policeManager.destroy();
  });
});
```



## CI/CD Integration

### **Automated Testing Workflows**

Integrate testing into your development workflow with automated CI/CD pipelines and quality gates.

#### **GitHub Actions Workflow**

Create `.github/workflows/test.yml` for automated testing:

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run tests
      run: npm run test:coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
        
    - name: Comment coverage on PR
      if: github.event_name == 'pull_request'
      uses: romeovs/lcov-reporter-action@v0.3.1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        lcov-file: ./coverage/lcov.info
```

#### **Enhanced Package.json Scripts**

Update `package.json` with comprehensive testing scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --ci --watchAll=false",
    "test:unit": "jest --testPathPattern=tests/",
    "test:integration": "jest --testPathPattern=integration/",
    "test:performance": "jest --testNamePattern='Performance'",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "lint": "eslint js/ tests/ --ext .js",
    "lint:fix": "eslint js/ tests/ --ext .js --fix",
    "quality:check": "npm run lint && npm run test:coverage",
    "quality:report": "npm run test:coverage && npm run lint",
    "pre-commit": "npm run quality:check"
  }
}
```

### **Pre-commit Hooks**

#### **Husky Setup**

Install and configure Husky for pre-commit hooks:

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky init

# Add pre-commit hook
echo "npm run pre-commit" > .husky/pre-commit
chmod +x .husky/pre-commit
```

#### **Lint-staged Configuration**

Add `lint-staged` for efficient pre-commit checks in `package.json`:

```json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^14.0.1"
  },
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "jest --bail --findRelatedTests"
    ],
    "*.{js,json,md}": [
      "prettier --write"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci"
    }
  }
}
```

### **Quality Gates and Coverage**

#### **Coverage Thresholds**

Configure coverage thresholds in `jest.config.json`:

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 85, 
      "lines": 80,
      "statements": 80
    },
    "./js/components/": {
      "branches": 80,
      "functions": 90,
      "lines": 85,
      "statements": 85
    },
    "./js/modules/": {
      "branches": 85,
      "functions": 95,
      "lines": 90,
      "statements": 90
    }
  },
  "collectCoverageFrom": [
    "js/modules/**/*.js",
    "js/components/**/*.js", 
    "!js/legacy/**/*.js",
    "!**/*.test.js",
    "!**/node_modules/**"
  ]
}
```

#### **Performance Budgets**

Add performance budget checks to CI:

```yaml
# Add to GitHub Actions workflow
- name: Performance Budget Check
  run: |
    # Run performance tests and check against budgets
    npm run test:performance
    
    # Check bundle size (if applicable)
    npm run build
    npx bundlesize
    
- name: Fail on Performance Regression
  run: |
    # Extract performance metrics and compare
    node scripts/check-performance-budget.js
```

Create `scripts/check-performance-budget.js`:

```javascript
// Performance budget checker for emergency services mapping
const fs = require('fs');
const path = require('path');

const PERFORMANCE_BUDGETS = {
  'SES Layer Rendering': 100,      // 100ms max
  'LGA Layer Rendering': 120,      // 120ms max  
  'Search Filtering': 50,          // 50ms max
  'Active List Updates': 100,      // 100ms max
  'Memory Usage': 1000000,        // 1MB max
  'Bundle Size': 500000            // 500KB max
};

const PERFORMANCE_REPORT_PATH = './coverage/performance-report.json';

function checkPerformanceBudget() {
  if (!fs.existsSync(PERFORMANCE_REPORT_PATH)) {
    console.log('⚠️ Performance report not found, skipping budget check');
    return true;
  }

  const report = JSON.parse(fs.readFileSync(PERFORMANCE_REPORT_PATH, 'utf8'));
  let budgetPassed = true;

  Object.entries(PERFORMANCE_BUDGETS).forEach(([metric, budget]) => {
    const actual = report[metric];
    if (actual && actual > budget) {
      console.error(`❌ Performance budget exceeded for ${metric}:`);
      console.error(`   Budget: ${budget}ms, Actual: ${actual}ms`);
      budgetPassed = false;
    } else if (actual) {
      console.log(`✅ ${metric}: ${actual}ms (budget: ${budget}ms)`);
    }
  });

  if (!budgetPassed) {
    console.error('\n❌ Performance budget check failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All performance budgets passed!');
  }
}

checkPerformanceBudget();
```

### **Automated Quality Reporting**

#### **Pull Request Checks**

Create `.github/workflows/pr-checks.yml`:

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ main ]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # Fetch full history for better analysis
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run quality checks
      run: npm run quality:report
      
    - name: Test changed files only
      run: |
        # Get list of changed JavaScript files
        CHANGED_FILES=$(git diff --name-only origin/main...HEAD | grep -E '\.(js)$' | tr '\n' ' ')
        if [ ! -z "$CHANGED_FILES" ]; then
          echo "Testing changed files: $CHANGED_FILES"
          npx jest --bail --findRelatedTests $CHANGED_FILES
        else
          echo "No JavaScript files changed"
        fi
        
    - name: Comment Test Results
      if: always()
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          
          // Read coverage report
          const coverage = JSON.parse(fs.readFileSync('./coverage/coverage-summary.json', 'utf8'));
          
          const comment = `
          ## 🧪 Test Results
          
          | Metric | Coverage | Status |
          |--------|----------|--------|
          | Statements | ${coverage.total.statements.pct}% | ${coverage.total.statements.pct >= 80 ? '✅' : '❌'} |
          | Branches | ${coverage.total.branches.pct}% | ${coverage.total.branches.pct >= 75 ? '✅' : '❌'} |
          | Functions | ${coverage.total.functions.pct}% | ${coverage.total.functions.pct >= 85 ? '✅' : '❌'} |
          | Lines | ${coverage.total.lines.pct}% | ${coverage.total.lines.pct >= 80 ? '✅' : '❌'} |
          
          [View detailed coverage report](${context.payload.pull_request.html_url}/checks)
          `;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

#### **Scheduled Quality Reports**

Create `.github/workflows/weekly-quality.yml`:

```yaml
name: Weekly Quality Report

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:      # Allow manual triggers

jobs:
  quality-report:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Generate comprehensive quality report
      run: |
        # Run full test suite
        npm run test:coverage
        
        # Run performance tests
        npm run test:performance
        
        # Generate quality metrics
        npx jest --coverage --outputFile=./reports/test-results.json --json
        
    - name: Upload quality reports
      uses: actions/upload-artifact@v3
      with:
        name: quality-reports
        path: |
          coverage/
          reports/
        retention-days: 30
        
    - name: Create quality summary
      run: |
        echo "# Weekly Quality Report" >> quality-summary.md
        echo "Generated on: $(date)" >> quality-summary.md
        echo "" >> quality-summary.md
        
        # Add test statistics
        echo "## Test Coverage" >> quality-summary.md
        npx jest --coverage --silent | tail -n 10 >> quality-summary.md
        
        # Add performance metrics
        echo "" >> quality-summary.md
        echo "## Performance Metrics" >> quality-summary.md
        echo "- Emergency services layers tested" >> quality-summary.md
        echo "- Mapping performance validated" >> quality-summary.md
        
    - name: Create issue with quality report
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const summary = fs.readFileSync('./quality-summary.md', 'utf8');
          
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: `Weekly Quality Report - ${new Date().toISOString().split('T')[0]}`,
            body: summary,
            labels: ['quality', 'automated']
          });
```

### **Development Workflow Integration**

#### **VS Code Integration**

Create `.vscode/tasks.json` for IDE integration:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Tests",
      "type": "npm",
      "script": "test",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Tests with Coverage",
      "type": "npm", 
      "script": "test:coverage",
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Watch Tests",
      "type": "npm",
      "script": "test:watch",
      "group": "test",
      "isBackground": true,
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Quality Check",
      "type": "npm",
      "script": "quality:check", 
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true
    },
    {
      "type": "node", 
      "request": "launch",
      "name": "Debug Specific Test",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "${fileBasenameNoExtension}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
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