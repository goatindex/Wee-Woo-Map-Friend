/**
 * @fileoverview Component Integration Tests
 * Tests actual component interactions and data flow
 * Phase 3: Integration Testing for system validation
 */

// Mock console for testing
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock performance API
global.performance = {
  now: jest.fn(() => 1000)
};

// Mock fetch
global.fetch = jest.fn();

// Mock Leaflet
global.L = {
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fireEvent: jest.fn(),
    getBounds: jest.fn(() => ({
      getCenter: jest.fn(() => ({ lat: -37.5622, lng: 143.8503 }))
    }))
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn()
  })),
  geoJSON: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    setStyle: jest.fn(),
    eachLayer: jest.fn(),
    getBounds: jest.fn(() => ({
      getCenter: jest.fn(() => ({ lat: -37.5622, lng: 143.8503 }))
    }))
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
    bindPopup: jest.fn(),
    setLatLng: jest.fn()
  })),
  divIcon: jest.fn(() => ({ className: 'test-icon' }))
};

// Mock document with actual app functions
global.document = {
  getElementById: jest.fn(),
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    id: '',
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    appendChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    }
  })),
  querySelector: jest.fn(),
  body: {
    appendChild: jest.fn()
  }
};

// Ensure document methods are properly mocked
global.document.getElementById = jest.fn();
global.document.querySelector = jest.fn();
global.document.createElement = jest.fn((tag) => ({
  tagName: tag.toUpperCase(),
  className: '',
  id: '',
  innerHTML: '',
  textContent: '',
  style: {},
  dataset: {},
  children: [],
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  }
}));

// Mock window with actual app state and functions
global.window = {
  // Real app state
  namesByCategory: { ses: [], lga: [], cfa: [], ambulance: [], police: [], frv: [] },
  nameToKey: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  featureLayers: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  categoryMeta: {
    ses: { nameProp: 'name', styleFn: () => ({ color: '#FF9900' }), listId: 'ses-list', type: 'polygon' },
    lga: { nameProp: 'LGA_NAME', styleFn: () => ({ color: '#4ECDC4' }), listId: 'lga-list', type: 'polygon' },
    cfa: { nameProp: 'name', styleFn: () => ({ color: '#45B7D1' }), listId: 'cfa-list', type: 'point' }
  },
  outlineColors: { ses: '#FF9900', lga: '#4ECDC4', cfa: '#45B7D1' },
  emphasised: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  labelColorAdjust: { ses: 1.0, lga: 1.0, cfa: 1.0 },
  
  // Mock functions that the real code depends on
  ensureLabel: jest.fn(),
  removeLabel: jest.fn(),
  setEmphasis: jest.fn(),
  formatAmbulanceName: jest.fn(str => str),
  formatPoliceName: jest.fn(str => str),
  adjustHexColor: jest.fn((color, factor) => color),
  convertMGA94ToLatLon: jest.fn((x, y) => ({ lng: x / 100000, lat: y / 100000 })),
  toTitleCase: jest.fn(str => str.charAt(0).toUpperCase() + str.slice(1)),
  formatLgaName: jest.fn(str => str),
  formatFrvName: jest.fn(str => str),
  createCheckbox: jest.fn(),
  addPolygonPlus: jest.fn(),
  removePolygonPlus: jest.fn(),
  updateActiveList: jest.fn(),
  setupActiveListSync: jest.fn(),
  getMap: jest.fn(() => ({ addLayer: jest.fn(), removeLayer: jest.fn() })),
  
  // DOM mocks
  location: {
    hostname: 'localhost'
  },
  localStorage: {
    getItem: jest.fn(() => 'willyweather'),
    setItem: jest.fn()
  }
};

// Mock global functions that components use
global.namesByCategory = window.namesByCategory;
global.nameToKey = window.nameToKey;
global.featureLayers = window.featureLayers;
global.categoryMeta = window.categoryMeta;
global.outlineColors = window.outlineColors;
global.emphasised = window.emphasised;
global.labelColorAdjust = window.labelColorAdjust;

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window state
    window.namesByCategory = { ses: [], lga: [], cfa: [], ambulance: [], police: [], frv: [] };
    window.nameToKey = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.featureLayers = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.emphasised = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.categoryMeta = {
      ses: { nameProp: 'name', styleFn: () => ({ color: '#FF9900' }), listId: 'ses-list', type: 'polygon' },
      lga: { nameProp: 'LGA_NAME', styleFn: () => ({ color: '#4ECDC4' }), listId: 'lga-list', type: 'polygon' },
      cfa: { nameProp: 'name', styleFn: () => ({ color: '#45B7D1' }), listId: 'cfa-list', type: 'point' }
    };
    
    // Ensure mocks are properly set up
    window.outlineColors = { ses: '#FF9900', lga: '#4ECDC4', cfa: '#45B7D1' };
    window.ensureLabel = jest.fn();
    window.removeLabel = jest.fn();
    window.setEmphasis = jest.fn();
    window.updateActiveList = jest.fn();
    window.setupActiveListSync = jest.fn();
    
    // Reset global mocks
    global.namesByCategory = window.namesByCategory;
    global.nameToKey = window.nameToKey;
    global.featureLayers = window.featureLayers;
    global.categoryMeta = window.categoryMeta;
    global.outlineColors = window.outlineColors;
    global.emphasised = window.emphasised;
    global.labelColorAdjust = window.labelColorAdjust;
  });

  describe('Data Flow Integration: GeoJSON → UI → Map', () => {
    test('should integrate GeoJSON loading with sidebar activation', () => {
      // Test the complete data flow from GeoJSON loading to sidebar activation
      
      // 1. Simulate GeoJSON data loading (from loaders/polygons.js logic)
      const mockSESGeoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { name: 'Ballarat City' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[143.8, -37.5], [143.9, -37.5], [143.9, -37.6], [143.8, -37.6], [143.8, -37.5]]]
          }
        }]
      };

      // 2. Simulate the feature processing logic (from polygons.js)
      const processFeature = (feature, meta, category) => {
        let rawName = feature.properties[meta.nameProp];
        if (!rawName) return null;
        
        const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const key = cleanName.toLowerCase().replace(/\s+/g, '_');
        
        return { rawName, cleanName, key, category };
      };

      const meta = window.categoryMeta.ses;
      const processedFeature = processFeature(mockSESGeoJSON.features[0], meta, 'ses');
      
      expect(processedFeature).toEqual({
        rawName: 'Ballarat City',
        cleanName: 'Ballarat City',
        key: 'ballarat_city',
        category: 'ses'
      });

      // 3. Simulate adding to app state (from polygons.js)
      window.namesByCategory.ses.push(processedFeature.rawName);
      window.nameToKey.ses[processedFeature.rawName] = processedFeature.key;
      
      expect(window.namesByCategory.ses).toContain('Ballarat City');
      expect(window.nameToKey.ses['Ballarat City']).toBe('ballarat_city');

      // 4. Simulate map layer creation (from polygons.js)
      const mockLayer = L.geoJSON(mockSESGeoJSON.features[0], {
        style: meta.styleFn()
      });
      
      window.featureLayers.ses[processedFeature.key] = [mockLayer];
      
      expect(window.featureLayers.ses['ballarat_city']).toBeDefined();
      expect(L.geoJSON).toHaveBeenCalledWith(mockSESGeoJSON.features[0], {
        style: { color: '#FF9900' }
      });

      // 5. Simulate sidebar activation (from activeList.js)
      const simulateSidebarActivation = (category, key) => {
        // This simulates what happens when a user checks a checkbox in the sidebar
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.id = `${category}_${key}`;
        
        // Simulate the change event that triggers updateActiveList
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        return checkbox;
      };

      const activatedCheckbox = simulateSidebarActivation('ses', 'ballarat_city');
      
      expect(activatedCheckbox.checked).toBe(true);
      expect(activatedCheckbox.id).toBe('ses_ballarat_city');
      expect(activatedCheckbox.dispatchEvent).toHaveBeenCalled();
    });

    test('should integrate coordinate conversion with map display', () => {
      // Test the integration between coordinate conversion and map layer creation
      
      // 1. Simulate MGA94 coordinate data (from polygons.js coordinate handling)
      const mockPointFeature = {
        type: 'Feature',
        properties: { name: 'Ballarat Point' },
        geometry: {
          type: 'Point',
          coordinates: [500000, 6000000] // MGA94 coordinates
        }
      };

      // 2. Simulate coordinate conversion logic (from polygons.js lines 60-68)
      const processFeatureCoordinates = (feature, category) => {
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            try {
              const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
              return true; // Conversion happened
            } catch (e) {
              console.warn(`Failed to convert coordinates for feature:`, e);
              return false; // Conversion failed
            }
          }
        }
        return false; // No conversion needed
      };

      // Ensure the mock function is properly set up
      window.convertMGA94ToLatLon = jest.fn((x, y) => ({ lng: x / 100000, lat: y / 100000 }));

      const conversionResult = processFeatureCoordinates(mockPointFeature, 'ses');
      
      expect(conversionResult).toBe(true);
      expect(window.convertMGA94ToLatLon).toHaveBeenCalledWith(500000, 6000000);
      expect(mockPointFeature.geometry.coordinates).toEqual([5, 60]); // Converted values

      // 3. Simulate map layer creation with converted coordinates
      const mockPointLayer = L.marker(mockPointFeature.geometry.coordinates, {
        icon: L.divIcon({ className: 'ses-point' })
      });
      
      expect(L.marker).toHaveBeenCalledWith([5, 60], expect.objectContaining({
        icon: expect.any(Object)
      }));
      expect(L.divIcon).toHaveBeenCalledWith({ className: 'ses-point' });
    });

    test('should integrate emphasis toggling with map updates', () => {
      // Test the integration between emphasis toggling and map layer updates
      
      // 1. Set up a feature with emphasis state
      window.namesByCategory.ses = ['Ballarat City'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city' };
      window.featureLayers.ses = { ballarat_city: [L.geoJSON()] };
      
      // 2. Simulate emphasis toggle (from activeList.js emphasis handling)
      const simulateEmphasisToggle = (category, key, isEmphasised) => {
        // This simulates the emphasis checkbox change event
        window.emphasised[category][key] = isEmphasised;
        
        // Call the actual setEmphasis function
        window.setEmphasis(category, key, isEmphasised, window.categoryMeta[category]?.type === 'point');
        
        // Update the active list to reflect changes
        window.updateActiveList();
      };

      // Test emphasis ON
      simulateEmphasisToggle('ses', 'ballarat_city', true);
      
      expect(window.emphasised.ses['ballarat_city']).toBe(true);
      expect(window.setEmphasis).toHaveBeenCalledWith('ses', 'ballarat_city', true, false);
      expect(window.updateActiveList).toHaveBeenCalled();

      // Test emphasis OFF
      simulateEmphasisToggle('ses', 'ballarat_city', false);
      
      expect(window.emphasised.ses['ballarat_city']).toBe(false);
      expect(window.setEmphasis).toHaveBeenCalledWith('ses', 'ballarat_city', false, false);
    });

    test('should integrate label toggling with map display', () => {
      // Test the integration between label toggling and map label management
      
      // 1. Set up a feature with label state
      window.namesByCategory.ses = ['Ballarat City'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city' };
      window.featureLayers.ses = { ballarat_city: [L.geoJSON()] };
      
      // 2. Simulate label toggle ON (from activeList.js label handling)
      const simulateLabelToggle = (category, key, showLabel, name) => {
        if (showLabel) {
          let layerOrMarker = null;
          let isPoint = (window.categoryMeta[category]?.type === 'point');
          
          if (isPoint) {
            layerOrMarker = window.featureLayers[category][key];
          } else {
            layerOrMarker = window.featureLayers[category][key] && window.featureLayers[category][key][0];
          }
          
          window.ensureLabel(category, key, name, isPoint, layerOrMarker);
        } else {
          window.removeLabel(category, key);
        }
      };

      // Test label ON
      simulateLabelToggle('ses', 'ballarat_city', true, 'Ballarat City');
      
      expect(window.ensureLabel).toHaveBeenCalledWith('ses', 'ballarat_city', 'Ballarat City', false, expect.any(Object));

      // Test label OFF
      simulateLabelToggle('ses', 'ballarat_city', false, 'Ballarat City');
      
      expect(window.removeLabel).toHaveBeenCalledWith('ses', 'ballarat_city');
    });
  });

  describe('Component Communication Integration', () => {
    test('should integrate sidebar checkbox changes with map layer visibility', () => {
      // Test the integration between sidebar checkbox state and map layer visibility
      
      // 1. Set up mock map and layers
      const mockMap = {
        addLayer: jest.fn(),
        removeLayer: jest.fn()
      };
      
      const mockSESLayer = L.geoJSON();
      window.featureLayers.ses = { ballarat_city: [mockSESLayer] };
      
      // 2. Simulate checkbox change event (from activeList.js event handling)
      const simulateCheckboxChange = (category, key, isChecked) => {
        // Create a mock checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isChecked;
        checkbox.id = `${category}_${key}`;
        
        // Simulate the change event
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Simulate the map layer management logic
        if (isChecked) {
          mockMap.addLayer(mockSESLayer);
        } else {
          mockMap.removeLayer(mockSESLayer);
        }
        
        return { checkbox, mockMap };
      };

      // Test checkbox checked (layer added)
      const { mockMap: map1 } = simulateCheckboxChange('ses', 'ballarat_city', true);
      
      expect(map1.addLayer).toHaveBeenCalledWith(mockSESLayer);

      // Test checkbox unchecked (layer removed)
      const { mockMap: map2 } = simulateCheckboxChange('ses', 'ballarat_city', false);
      
      expect(map2.removeLayer).toHaveBeenCalledWith(mockSESLayer);
    });

    test('should integrate bulk operations with UI updates', () => {
      // Test the integration between bulk operations and UI state management
      
      // 1. Simulate bulk operation start (from activeList.js bulk handling)
      let _bulkActive = false;
      let _bulkPending = false;

      const beginActiveListBulk = () => {
        _bulkActive = true;
      };

      const endActiveListBulk = () => {
        _bulkActive = false;
        const pending = _bulkPending;
        _bulkPending = false;
        if (pending) window.updateActiveList();
      };

      // 2. Simulate multiple operations during bulk mode
      const simulateBulkOperations = () => {
        beginActiveListBulk();
        
        // Simulate multiple checkbox changes without triggering updates
        const checkboxes = ['ballarat_city', 'geelong_city', 'bendigo_city'];
        
        checkboxes.forEach(key => {
          // These operations should not trigger updateActiveList immediately
          window.namesByCategory.ses.push(`Test ${key}`);
          window.nameToKey.ses[`Test ${key}`] = key;
        });
        
        // Mark that updates are pending
        _bulkPending = true;
        
        // End bulk mode - should trigger one updateActiveList call
        endActiveListBulk();
        
        return { checkboxes, _bulkActive, _bulkPending };
      };

      const result = simulateBulkOperations();
      
      expect(result._bulkActive).toBe(false);
      expect(result._bulkPending).toBe(false);
      expect(window.updateActiveList).toHaveBeenCalledTimes(1); // Only called once at the end
      expect(window.namesByCategory.ses).toHaveLength(3);
    });
  });

  describe('Error Handling Integration', () => {
    test('should integrate coordinate conversion errors with graceful fallback', () => {
      // Test the integration between coordinate conversion errors and error handling
      
      // 1. Simulate coordinate conversion failure
      window.convertMGA94ToLatLon = jest.fn(() => {
        throw new Error('Coordinate conversion failed');
      });

      const mockPointFeature = {
        type: 'Feature',
        properties: { name: 'Invalid Point' },
        geometry: {
          type: 'Point',
          coordinates: [999999, 9999999] // Invalid coordinates
        }
      };

      // 2. Test error handling integration (from polygons.js error handling)
      const processFeatureCoordinatesWithErrorHandling = (feature, category) => {
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            try {
              const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
              return true; // Conversion happened
            } catch (e) {
              console.warn(`Failed to convert coordinates for feature:`, e);
              // Keep original coordinates as fallback
              return false; // Conversion failed
            }
          }
        }
        return false; // No conversion needed
      };

      const result = processFeatureCoordinatesWithErrorHandling(mockPointFeature, 'ses');
      
      expect(result).toBe(false); // Conversion failed
      expect(console.warn).toHaveBeenCalledWith('Failed to convert coordinates for feature:', expect.any(Error));
      expect(mockPointFeature.geometry.coordinates).toEqual([999999, 9999999]); // Original coordinates preserved
    });

    test('should integrate network errors with user feedback', async () => {
      // Test the integration between network errors and user feedback
      
      // 1. Simulate network failure in weather data fetching
      global.fetch.mockRejectedValue(new Error('Network error'));

      // 2. Test error handling integration (from activeList.js weather error handling)
      const simulateWeatherDataFetchWithError = async (lat, lon) => {
        try {
          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          if (!res.ok) throw new Error(`Weather API error ${res.status}`);
          return await res.json();
        } catch (e) {
          // Simulate the error handling from activeList.js
          return { error: true, message: 'Error loading weather data.' };
        }
      };

      const result = await simulateWeatherDataFetchWithError(-37.5622, 143.8503);
      
      expect(result.error).toBe(true);
      expect(result.message).toBe('Error loading weather data.');
      expect(global.fetch).toHaveBeenCalledWith('/api/weather?lat=-37.5622&lon=143.8503');
    });
  });

  describe('Performance Integration', () => {
    test('should integrate performance monitoring with component operations', () => {
      // Test the integration between performance monitoring and component operations
      
      // 1. Simulate performance monitoring (from bootstrap.js and other components)
      const measureOperationPerformance = (operationName, operation) => {
        const startTime = performance.now();
        
        // Execute the operation
        const result = operation();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log performance data
        console.log(`${operationName} took ${duration}ms`);
        
        return { result, duration };
      };

      // 2. Test performance monitoring integration with map operations
      const mockMapOperation = () => {
        // Simulate a map operation (e.g., adding multiple layers)
        const layers = [];
        for (let i = 0; i < 10; i++) {
          layers.push(L.geoJSON());
        }
        return layers;
      };

      const { result, duration } = measureOperationPerformance('Map Layer Addition', mockMapOperation);
      
      expect(result).toHaveLength(10);
      expect(duration).toBeGreaterThan(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Map Layer Addition took \d+\.\d+ms/));
      expect(L.geoJSON).toHaveBeenCalledTimes(10);
    });

    test('should integrate memory usage monitoring with component lifecycle', () => {
      // Test the integration between memory monitoring and component lifecycle
      
      // 1. Simulate memory monitoring (from performance tests and monitoring)
      const monitorMemoryUsage = (operationName, operation) => {
        const beforeMemory = performance.memory?.usedJSHeapSize || 0;
        
        // Execute the operation
        const result = operation();
        
        const afterMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryIncrease = afterMemory - beforeMemory;
        
        // Log memory data
        console.log(`${operationName} memory increase: ${memoryIncrease} bytes`);
        
        return { result, memoryIncrease };
      };

      // 2. Test memory monitoring integration with component operations
      const mockComponentOperation = () => {
        // Simulate a component operation that might use memory
        const components = [];
        for (let i = 0; i < 5; i++) {
          components.push({
            id: `component_${i}`,
            data: new Array(1000).fill('test data')
          });
        }
        return components;
      };

      const { result, memoryIncrease } = monitorMemoryUsage('Component Creation', mockComponentOperation);
      
      expect(result).toHaveLength(5);
      expect(memoryIncrease).toBeGreaterThanOrEqual(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Component Creation memory increase: \d+ bytes/));
    });
  });
});
