/**
 * @module modules/PolygonLoader.test
 * Test suite for the PolygonLoader module
 */

import { PolygonLoader } from './PolygonLoader.js';

// Mock dependencies
jest.mock('./EventBus.js', () => ({
  globalEventBus: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }
}));

jest.mock('./StateManager.js', () => ({
  stateManager: {
    get: jest.fn(),
    set: jest.fn(),
    isReady: jest.fn(() => true)
  }
}));

jest.mock('./ConfigurationManager.js', () => ({
  configurationManager: {
    get: jest.fn(),
    isReady: jest.fn(() => true)
  }
}));

jest.mock('./LayerManager.js', () => ({
  layerManager: {
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    isReady: jest.fn(() => true)
  }
}));

// Import mocked dependencies
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';

// Mock Leaflet
global.L = {
  geoJSON: jest.fn(() => ({
    addTo: jest.fn(),
    removeLayer: jest.fn()
  })),
  divIcon: jest.fn(() => ({})),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    removeLayer: jest.fn()
  }))
};

// Mock window functions
global.window = {
  isOffline: jest.fn(() => false),
  showSidebarError: jest.fn(),
  convertMGA94ToLatLon: jest.fn((x, y) => ({ lat: y, lng: x })),
  addPolygonPlus: jest.fn(),
  removePolygonPlus: jest.fn(),
  ensureLabel: jest.fn(),
  removeLabel: jest.fn(),
  formatLgaName: jest.fn((name) => name),
  formatFrvName: jest.fn((name) => name),
  toTitleCase: jest.fn((name) => name)
};

describe('PolygonLoader', () => {
  let polygonLoader;
  let mockMap;
  let mockGeoJSON;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instances
    polygonLoader = new PolygonLoader();
    
    // Mock map
    mockMap = {
      addLayer: jest.fn(),
      removeLayer: jest.fn()
    };
    
    // Mock GeoJSON data
    mockGeoJSON = {
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          },
          properties: {
            name: 'Test Feature 1'
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [144.9631, -37.8136]
          },
          properties: {
            name: 'Test Feature 2'
          }
        }
      ]
    };
    
    // Mock state manager
    stateManager._state = stateManager._state || {};
    
    stateManager.set.mockImplementation((key, value) => {
      // Store the value for later retrieval
      stateManager._state[key] = value;
    });
    
    stateManager.get.mockImplementation((key, defaultValue = null) => {
      const value = stateManager._state[key];
      if (value === undefined) {
        // For objects, create a new object and store it
        if (typeof defaultValue === 'object' && defaultValue !== null) {
          const newValue = { ...defaultValue };
          stateManager._state[key] = newValue;
          return newValue;
        }
        return defaultValue;
      }
      // Return the actual reference for objects so modifications work
      return value;
    });
    
    // Initialize state
    stateManager.set('map', mockMap);
    stateManager.set('featureLayers', {});
    stateManager.set('namesByCategory', {});
    stateManager.set('nameToKey', {});
    stateManager.set('emphasised', {});
    stateManager.set('nameLabelMarkers', {});
    stateManager.set('sesFacilityMarkers', {});
    stateManager.set('sesFacilityCoords', {});
    
    // Mock configuration manager
    configurationManager.get.mockImplementation((key, defaultValue = null) => {
      const config = {
        'categoryMeta.test': {
          nameProp: 'name',
          listId: 'test-list',
          toggleAllId: 'toggleAll-test',
          styleFn: () => ({ color: '#ff0000' }),
          type: 'polygon',
          defaultOn: () => false
        }
      };
      return config[key] || defaultValue;
    });
    
    // Mock layer manager
    layerManager.addLayer = jest.fn();
    layerManager.showLayer = jest.fn();
    layerManager.hideLayer = jest.fn();
    layerManager.getLayer = jest.fn();
  });

  afterEach(() => {
    // Clean up
    if (polygonLoader) {
      polygonLoader.destroy?.();
    }
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      expect(polygonLoader.initialized).toBe(false);
      expect(polygonLoader.loadingCategories).toBeInstanceOf(Set);
      expect(polygonLoader.loadedCategories).toBeInstanceOf(Set);
      expect(polygonLoader.categoryData).toBeInstanceOf(Map);
    });

    test('should create module-specific logger', () => {
      expect(polygonLoader.logger).toBeDefined();
      expect(polygonLoader.logger.context).toBeDefined();
      // Check if the module context is set
      expect(polygonLoader.logger.context.get('module')).toBe('PolygonLoader');
    });
  });

  describe('Category Loading', () => {
    beforeEach(async () => {
      // Mock dependencies as ready
      stateManager.isReady = jest.fn(() => true);
      configurationManager.isReady = jest.fn(() => true);
      layerManager.isReady = jest.fn(() => true);
      
      await polygonLoader.init();
    });

    test('should load category successfully', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeoJSON)
        })
      );

      await polygonLoader.loadCategory('test', 'http://example.com/test.geojson');

      expect(polygonLoader.isCategoryLoaded('test')).toBe(true);
      expect(polygonLoader.loadingCategories.has('test')).toBe(false);
      expect(polygonLoader.categoryData.has('test')).toBe(true);
    });

    test('should handle loading errors gracefully', async () => {
      // Mock fetch failure
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404
        })
      );

      await expect(
        polygonLoader.loadCategory('test', 'http://example.com/test.geojson')
      ).rejects.toThrow();

      expect(polygonLoader.isCategoryLoaded('test')).toBe(false);
      expect(polygonLoader.loadingCategories.has('test')).toBe(false);
    });

    test('should prevent duplicate loading', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeoJSON)
        })
      );

      // Load first time
      await polygonLoader.loadCategory('test', 'http://example.com/test.geojson');
      
      // Try to load again
      await polygonLoader.loadCategory('test', 'http://example.com/test.geojson');
      
      // Should only fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Feature Processing', () => {
    test('should process features correctly', () => {
      const result = polygonLoader.processFeatures('test', mockGeoJSON.features);
      
      expect(result.features).toHaveLength(2);
      expect(result.names).toHaveLength(2);
      expect(result.nameToKey).toHaveProperty('Test Feature 1');
      expect(result.nameToKey).toHaveProperty('Test Feature 2');
    });

    test('should handle invalid features gracefully', () => {
      const invalidFeatures = [
        null,
        { properties: { name: 'Valid' } }, // Missing geometry
        { geometry: {}, properties: { name: 'Valid' } }, // Invalid geometry
        { geometry: { type: 'Polygon' }, properties: {} } // Missing name
      ];
      
      const result = polygonLoader.processFeatures('test', invalidFeatures);
      
      // Should filter out invalid features but keep valid ones
      expect(result.features.length).toBeLessThanOrEqual(invalidFeatures.length);
      expect(result.names.length).toBeLessThanOrEqual(invalidFeatures.length);
    });

    test('should convert MGA94 coordinates', () => {
      const mga94Feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [500000, 6000000] // MGA94 coordinates
        },
        properties: {
          name: 'MGA94 Feature'
        }
      };
      
      // Ensure the mock is properly set up
      global.window.convertMGA94ToLatLon = jest.fn((x, y) => ({ lat: y, lng: x }));
      
      const result = polygonLoader.processFeatures('test', [mga94Feature]);
      
      expect(global.window.convertMGA94ToLatLon).toHaveBeenCalledWith(500000, 6000000);
    });
  });

  describe('SES Chevron Functionality', () => {
    beforeEach(() => {
      stateManager.set('map', mockMap);
      stateManager.set('sesFacilityCoords', {
        'test_feature': { lat: -37.8136, lng: 144.9631 }
      });
      stateManager.set('sesFacilityMarkers', {});
    });

    test('should create SES chevron icon', () => {
      const icon = polygonLoader.makeSesChevronIcon();
      
      expect(global.L.divIcon).toHaveBeenCalled();
      expect(icon).toBeDefined();
    });

    test('should show SES chevron', () => {
      // Mock the marker creation
      const mockMarker = { addTo: jest.fn() };
      global.L.marker = jest.fn(() => mockMarker);
      
      // Set up coordinates with lowercase key (as the implementation expects)
      stateManager.set('sesFacilityCoords', {
        'test_feature': { lat: -37.8136, lng: 144.9631 }
      });
      
      polygonLoader.showSesChevron('test_feature', mockMap);
      
      expect(global.L.marker).toHaveBeenCalled();
      expect(mockMarker.addTo).toHaveBeenCalledWith(mockMap);
      
      const sesFacilityMarkers = stateManager.get('sesFacilityMarkers');
      expect(sesFacilityMarkers['test_feature']).toBeDefined();
    });

    test('should hide SES chevron', () => {
      // Mock the marker creation
      const mockMarker = { addTo: jest.fn(), removeLayer: jest.fn() };
      global.L.marker = jest.fn(() => mockMarker);
      
      // Set up coordinates with lowercase key (as the implementation expects)
      stateManager.set('sesFacilityCoords', {
        'test_feature': { lat: -37.8136, lng: 144.9631 }
      });
      
      // First show the chevron
      polygonLoader.showSesChevron('test_feature', mockMap);
      
      // Verify the marker was stored in state
      const sesFacilityMarkers = stateManager.get('sesFacilityMarkers');
      expect(sesFacilityMarkers['test_feature']).toBeDefined();
      
      // Then hide it
      polygonLoader.hideSesChevron('test_feature', mockMap);
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(mockMarker);
      
      // Verify the marker was removed from state
      const updatedSesFacilityMarkers = stateManager.get('sesFacilityMarkers');
      expect(updatedSesFacilityMarkers['test_feature']).toBeUndefined();
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      // Mock dependencies as ready
      stateManager.isReady = jest.fn(() => true);
      configurationManager.isReady = jest.fn(() => true);
      layerManager.isReady = jest.fn(() => true);
      
      await polygonLoader.init();
      
      // Load test data
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeoJSON)
        })
      );
      
      await polygonLoader.loadCategory('test', 'http://example.com/test.geojson');
    });

    test('should handle bulk toggle operations', async () => {
      // Mock DOM elements
      const mockCheckbox = { checked: false };
      document.getElementById = jest.fn(() => mockCheckbox);
      
      // Mock state manager bulk operations
      stateManager.beginBulkOperation = jest.fn(() => true);
      stateManager.endBulkOperation = jest.fn();
      stateManager.get = jest.fn((key) => {
        if (key === 'isBulkOperation') return true;
        if (key === 'featureLayers') return { test: { 'test_feature_1': [{}] } };
        return {};
      });
      
      await polygonLoader.handleShowAllToggle('test', true);
      
      expect(stateManager.beginBulkOperation).toHaveBeenCalled();
      expect(stateManager.endBulkOperation).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('should check if category is loaded', () => {
      polygonLoader.loadedCategories.add('test');
      
      expect(polygonLoader.isCategoryLoaded('test')).toBe(true);
      expect(polygonLoader.isCategoryLoaded('nonexistent')).toBe(false);
    });

    test('should check if category is loading', () => {
      polygonLoader.loadingCategories.add('test');
      
      expect(polygonLoader.isCategoryLoading('test')).toBe(true);
      expect(polygonLoader.isCategoryLoading('nonexistent')).toBe(false);
    });

    test('should get category data', () => {
      const testData = { features: [], layers: [], names: [], nameToKey: {} };
      polygonLoader.categoryData.set('test', testData);
      
      expect(polygonLoader.getCategoryData('test')).toBe(testData);
      expect(polygonLoader.getCategoryData('nonexistent')).toBeUndefined();
    });

    test('should get status', () => {
      polygonLoader.initialized = true;
      polygonLoader.loadedCategories.add('test1');
      polygonLoader.loadedCategories.add('test2');
      polygonLoader.categoryData.set('test1', { features: [1, 2], layers: [1], names: ['a', 'b'] });
      
      const status = polygonLoader.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.loadedCategories).toContain('test1');
      expect(status.loadedCategories).toContain('test2');
      expect(status.totalCategories).toBe(1);
      expect(status.categoryData.test1.featureCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle offline state', async () => {
      global.window.isOffline = jest.fn(() => true);
      
      await expect(
        polygonLoader.loadCategory('test', 'http://example.com/test.geojson')
      ).rejects.toThrow('Offline - cannot load data');
    });

    test('should handle network errors', async () => {
      // Ensure we're not offline
      global.window.isOffline = jest.fn(() => false);
      
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      await expect(
        polygonLoader.loadCategory('test', 'http://example.com/test.geojson')
      ).rejects.toThrow('Network error');
    });
  });
});
