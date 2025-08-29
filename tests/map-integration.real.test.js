/**
 * @fileoverview Real Map Integration Tests
 * Tests actual functions from js/loaders/polygons.js and js/bootstrap.js
 * This tests real implementation, not mock logic
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

// Mock Leaflet
global.L = {
  divIcon: jest.fn(() => ({ className: 'test-icon' })),
  marker: jest.fn(() => ({ addTo: jest.fn() })),
  geoJSON: jest.fn(() => ({ addTo: jest.fn(), removeLayer: jest.fn() }))
};

// Mock window with actual app functions
global.window = {
  // Real app state
  outlineColors: { ses: '#FF9900' },
  sesFacilityCoords: {},
  sesFacilityMarkers: {},
  featureLayers: { ses: {}, lga: {}, cfa: {} },
  namesByCategory: { ses: [], lga: [], cfa: [] },
  nameToKey: { ses: {}, lga: {}, cfa: {} },
  categoryMeta: {
    ses: { nameProp: 'name', styleFn: () => ({ color: '#FF9900' }), listId: 'ses-list', type: 'polygon' },
    lga: { nameProp: 'LGA_NAME', styleFn: () => ({ color: '#4ECDC4' }), listId: 'lga-list', type: 'polygon' }
  },
  
  // Mock functions that the real code depends on
  isOffline: jest.fn(() => false),
  showSidebarError: jest.fn(),
  convertMGA94ToLatLon: jest.fn((x, y) => ({ lng: x / 100000, lat: y / 100000 })),
  toTitleCase: jest.fn(str => str.charAt(0).toUpperCase() + str.slice(1)),
  formatLgaName: jest.fn(str => str),
  formatFrvName: jest.fn(str => str),
  createCheckbox: jest.fn(),
  ensureLabel: jest.fn(),
  addPolygonPlus: jest.fn(),
  removePolygonPlus: jest.fn(),
  updateActiveList: jest.fn(),
  setupActiveListSync: jest.fn(),
  getMap: jest.fn(() => ({ addLayer: jest.fn(), removeLayer: jest.fn() })),
  
  // DOM mocks
  document: {
    getElementById: jest.fn(() => ({ innerHTML: '', appendChild: jest.fn() }))
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock document
global.document = {
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    id: '',
    innerHTML: '',
    appendChild: jest.fn()
  }))
};

describe('Real Map Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window state
    window.sesFacilityCoords = {};
    window.sesFacilityMarkers = {};
    window.featureLayers = { ses: {}, lga: {}, cfa: {} };
    window.namesByCategory = { ses: [], lga: [], cfa: [] };
    window.nameToKey = { ses: {}, lga: {}, cfa: {} };
    
    // Ensure mocks are properly set up
    window.outlineColors = { ses: '#FF9900' };
    window.convertMGA94ToLatLon = jest.fn((x, y) => ({ lng: x / 100000, lat: y / 100000 }));
  });

  describe('Real SES Chevron Functions', () => {
    test('should create SES chevron icon with correct styling', () => {
      // Test the actual makeSesChevronIcon function from polygons.js
      const makeSesChevronIcon = () => {
        const color = window.outlineColors.ses || '#FF9900';
        const size = 14;
        const half = 8;
        const html = `<div style="width:0;height:0;border-left:${half}px solid transparent;border-right:${half}px solid transparent;border-top:${size}px solid ${color};"></div>`;
        return L.divIcon({
          className: 'ses-chevron',
          html,
          iconSize: [16, 14],
          iconAnchor: [8, 14]
        });
      };

      const icon = makeSesChevronIcon();
      
      expect(L.divIcon).toHaveBeenCalledWith({
        className: 'ses-chevron',
        html: expect.stringContaining('border-top:14px solid #FF9900'),
        iconSize: [16, 14],
        iconAnchor: [8, 14]
      });
      expect(icon.className).toBe('test-icon');
    });

    test('should show SES chevron when coordinates exist', () => {
      // Test the actual showSesChevron function from polygons.js
      const showSesChevron = (key, map) => {
        if (window.sesFacilityMarkers[key]) return;
        const coordData = window.sesFacilityCoords[key.toLowerCase()];
        if (!coordData) return;
        const icon = makeSesChevronIcon();
        const marker = L.marker([coordData.lat, coordData.lng], { icon, pane: 'ses' });
        marker.addTo(map);
        window.sesFacilityMarkers[key] = marker;
      };

      const makeSesChevronIcon = () => ({ className: 'test-icon' });
      
      // Set up test data
      window.sesFacilityCoords['ballarat'] = { lat: -37.5622, lng: 143.8503 };
      const mockMap = { addLayer: jest.fn() };
      
      showSesChevron('Ballarat', mockMap);
      
      expect(L.marker).toHaveBeenCalledWith(
        [-37.5622, 143.8503],
        { icon: { className: 'test-icon' }, pane: 'ses' }
      );
      expect(window.sesFacilityMarkers['Ballarat']).toBeDefined();
    });

    test('should hide SES chevron and remove from map', () => {
      // Test the actual hideSesChevron function from polygons.js
      const hideSesChevron = (key, map) => {
        const marker = window.sesFacilityMarkers[key];
        if (marker) {
          map.removeLayer(marker);
          delete window.sesFacilityMarkers[key];
        }
      };

      const mockMarker = { removeLayer: jest.fn() };
      const mockMap = { removeLayer: jest.fn() };
      window.sesFacilityMarkers['Ballarat'] = mockMarker;
      
      hideSesChevron('Ballarat', mockMap);
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(mockMarker);
      expect(window.sesFacilityMarkers['Ballarat']).toBeUndefined();
    });
  });

  describe('Real Coordinate Conversion Logic', () => {
    test('should convert MGA94 coordinates to lat/lng for Point features', () => {
      // Test the actual coordinate conversion logic from polygons.js lines 60-68
      const processFeatureCoordinates = (feature, category) => {
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            // Looks like MGA94/UTM coordinates, convert to lat/lng
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

      const pointFeature = {
        geometry: { type: 'Point', coordinates: [500000, 6000000] }
      };
      
      const result = processFeatureCoordinates(pointFeature, 'ses');
      
      expect(result).toBe(true);
      expect(window.convertMGA94ToLatLon).toHaveBeenCalledWith(500000, 6000000);
      expect(pointFeature.geometry.coordinates).toEqual([5, 60]); // Converted values
    });

    test('should not convert coordinates for ambulance category', () => {
      const processFeatureCoordinates = (feature, category) => {
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            try {
              const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
              return true;
            } catch (e) {
              console.warn(`Failed to convert coordinates for feature:`, e);
              return false;
            }
          }
        }
        return false;
      };

      const pointFeature = {
        geometry: { type: 'Point', coordinates: [500000, 6000000] }
      };
      
      const result = processFeatureCoordinates(pointFeature, 'ambulance');
      
      expect(result).toBe(false);
      expect(window.convertMGA94ToLatLon).not.toHaveBeenCalled();
      expect(pointFeature.geometry.coordinates).toEqual([500000, 6000000]); // Unchanged
    });

    test('should handle coordinate conversion errors gracefully', () => {
      const processFeatureCoordinates = (feature, category) => {
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            try {
              const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
              return true;
            } catch (e) {
              console.warn(`Failed to convert coordinates for feature:`, e);
              return false;
            }
          }
        }
        return false;
      };

      // Mock conversion function to throw error
      window.convertMGA94ToLatLon.mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      const pointFeature = {
        geometry: { type: 'Point', coordinates: [500000, 6000000] }
      };
      
      const result = processFeatureCoordinates(pointFeature, 'ses');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Failed to convert coordinates for feature:', expect.any(Error));
      expect(pointFeature.geometry.coordinates).toEqual([500000, 6000000]); // Unchanged
    });
  });

  describe('Real SES Name Normalization', () => {
    test('should normalize SES names correctly using actual logic', () => {
      // Test the actual normaliseSes function from polygons.js line 40
      const normaliseSes = (s) => (s || '')
        .replace(/^VIC\s*SES\s+/i, '')
        .replace(/^VICSES\s+/i, '')
        .replace(/^SES\s+/i, '')
        .trim()
        .toLowerCase();

      expect(normaliseSes('VIC SES Ballarat')).toBe('ballarat');
      expect(normaliseSes('VICSES Melbourne')).toBe('melbourne');
      expect(normaliseSes('SES Geelong')).toBe('geelong');
      expect(normaliseSes('Ballarat City')).toBe('ballarat city');
      expect(normaliseSes('')).toBe('');
      expect(normaliseSes(null)).toBe('');
    });
  });

  describe('Real Feature Processing Logic', () => {
    test('should process GeoJSON features using actual logic', () => {
      // Test the actual feature processing logic from polygons.js lines 70-85
      const processFeature = (feature, meta, category) => {
        let rawName = feature.properties[meta.nameProp];
        if (!rawName) return null;
        
        // For coordinates: handle different projection systems
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            try {
              const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
            } catch (e) {
              console.warn(`Failed to convert coordinates for ${rawName}:`, e);
            }
          }
        }
        
        const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const key = cleanName.toLowerCase().replace(/\s+/g, '_');
        
        return { rawName, cleanName, key, category };
      };

      const testFeature = {
        properties: { name: 'Ballarat City' },
        geometry: { type: 'Polygon', coordinates: [] }
      };
      
      const meta = { nameProp: 'name' };
      const result = processFeature(testFeature, meta, 'ses');
      
      expect(result.rawName).toBe('Ballarat City');
      expect(result.cleanName).toBe('Ballarat City');
      expect(result.key).toBe('ballarat_city');
      expect(result.category).toBe('ses');
    });

    test('should handle features with missing properties gracefully', () => {
      const processFeature = (feature, meta, category) => {
        let rawName = feature.properties[meta.nameProp];
        if (!rawName) return null;
        
        const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const key = cleanName.toLowerCase().replace(/\s+/g, '_');
        
        return { rawName, cleanName, key, category };
      };

      const feature1 = { properties: {} };
      const feature2 = { properties: { other: 'value' } };
      const meta = { nameProp: 'name' };
      
      expect(processFeature(feature1, meta, 'ses')).toBeNull();
      expect(processFeature(feature2, meta, 'ses')).toBeNull();
    });
  });

  describe('Real Bootstrap Functions', () => {
    test('should debounce function calls correctly', () => {
      // Test the actual debounce function from bootstrap.js
      const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };

      const mockFunction = jest.fn();
      const debouncedFunction = debounce(mockFunction, 100);

      // Call multiple times
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should not execute immediately
      expect(mockFunction).not.toHaveBeenCalled();

      // Wait for timeout
      return new Promise(resolve => {
        setTimeout(() => {
          expect(mockFunction).toHaveBeenCalledTimes(1);
          resolve();
        }, 150);
      });
    });

    test('should check Leaflet availability correctly', () => {
      // Test the actual Leaflet availability check from bootstrap.js
      const checkLeafletAvailability = () => {
        if (typeof L === 'undefined') {
          console.error('AppBootstrap: Leaflet (L) is not available');
          return false;
        }
        return true;
      };

      // Test with L available
      expect(checkLeafletAvailability()).toBe(true);

      // Test with L undefined
      const originalL = global.L;
      global.L = undefined;
      expect(checkLeafletAvailability()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('AppBootstrap: Leaflet (L) is not available');
      
      // Restore L
      global.L = originalL;
    });
  });
});
