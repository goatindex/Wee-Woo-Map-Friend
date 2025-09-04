/**
 * @jest-environment jsdom
 */

import { LabelManager, labelManager, ensureLabel, removeLabel, formatAmbulanceName, formatPoliceName, formatLgaName, getPolygonLabelAnchor } from './LabelManager.js';

// Mock Leaflet
global.L = {
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  marker: jest.fn((latlng, options) => ({
    addTo: jest.fn().mockReturnThis(),
    getLatLng: jest.fn(() => latlng),
    ...options
  })),
  divIcon: jest.fn((options) => ({ ...options, type: 'divIcon' }))
};

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  backgroundColor: 'rgb(255, 0, 0)',
  getPropertyValue: jest.fn(() => '768px')
}));

describe('LabelManager', () => {
  let manager;
  let mockMap;
  let mockState;
  let mockConfig;
  let mockDependencies;

  beforeEach(() => {
    manager = new LabelManager();
    
    mockMap = {
      addLayer: jest.fn(),
      removeLayer: jest.fn()
    };
    
    mockState = {
      nameLabelMarkers: {},
      sesFacilityCoords: {
        'test-ses': { lat: -37.8, lng: 144.9 }
      },
      cfaFacilityCoords: {
        'test-cfa': { lat: -37.7, lng: 144.8 }
      }
    };
    
    mockConfig = {
      outlineColors: {
        ses: '#ff0000',
        lga: '#00ff00',
        cfa: '#0000ff',
        ambulance: '#ffff00',
        police: '#ff00ff'
      },
      labelColorAdjust: {
        ses: 1.2,
        lga: 0.8
      }
    };
    
    mockDependencies = {
      map: mockMap,
      state: mockState,
      config: mockConfig
    };
    
    jest.clearAllMocks();
  });

  describe('formatAmbulanceName', () => {
    test('should format ambulance station names correctly', () => {
      expect(manager.formatAmbulanceName('Melbourne Ambulance Station')).toBe('Melbourne Ambo');
      expect(manager.formatAmbulanceName('Bendigo Station')).toBe('Bendigo');
      expect(manager.formatAmbulanceName('')).toBe('');
      expect(manager.formatAmbulanceName(null)).toBe('');
    });
  });

  describe('formatPoliceName', () => {
    test('should format police station names correctly', () => {
      expect(manager.formatPoliceName('Melbourne Police Station')).toBe('Melbourne');
      expect(manager.formatPoliceName('Bendigo Police Station')).toBe('Bendigo');
      expect(manager.formatPoliceName('')).toBe('');
      expect(manager.formatPoliceName(null)).toBe('');
    });
  });

  describe('formatLgaName', () => {
    test('should remove unincorporated from LGA names', () => {
      expect(manager.formatLgaName('Melbourne (Unincorporated)')).toBe('Melbourne');
      expect(manager.formatLgaName('Bendigo (Uninc)')).toBe('Bendigo');
      expect(manager.formatLgaName('Geelong Unincorporated')).toBe('Geelong');
      expect(manager.formatLgaName('Ballarat Uninc.')).toBe('Ballarat');
      expect(manager.formatLgaName('')).toBe('');
      expect(manager.formatLgaName(null)).toBe('');
    });
  });

  describe('toTitleCase', () => {
    test('should convert strings to title case', () => {
      expect(manager.toTitleCase('hello world')).toBe('Hello World');
      expect(manager.toTitleCase('HELLO_WORLD')).toBe('Hello World');
      expect(manager.toTitleCase('')).toBe('');
      expect(manager.toTitleCase(null)).toBe('');
    });
  });

  describe('resolveLabelColor', () => {
    test('should resolve color from layer options for polygons', () => {
      const mockLayer = {
        options: {
          color: '#ff0000',
          fillColor: '#00ff00'
        }
      };
      
      const color = manager.resolveLabelColor('ses', false, mockLayer, mockConfig);
      expect(color).toBe('#ff0000');
    });

    test('should resolve color from computed style for points', () => {
      const mockMarker = {
        getElement: jest.fn(() => ({
          querySelector: jest.fn(() => ({
            style: { backgroundColor: 'rgb(255, 0, 0)' }
          }))
        }))
      };
      
      const color = manager.resolveLabelColor('ambulance', true, mockMarker, mockConfig);
      expect(color).toBe('rgb(255, 0, 0)');
    });

    test('should fallback to config outline color', () => {
      const color = manager.resolveLabelColor('ses', false, null, mockConfig);
      expect(color).toBe('#ff0000');
    });

    test('should return fallback color when no color found', () => {
      const color = manager.resolveLabelColor('unknown', false, null, {});
      expect(color).toBe('#000000');
    });
  });

  describe('getPolygonLabelAnchor', () => {
    test('should return bounds center when available', () => {
      const mockLayer = {
        getBounds: jest.fn(() => ({
          isValid: jest.fn(() => true),
          getCenter: jest.fn(() => ({ lat: -37.8, lng: 144.9 }))
        }))
      };
      
      const result = manager.getPolygonLabelAnchor(mockLayer);
      expect(result).toEqual({ lat: -37.8, lng: 144.9 });
    });

    test('should fallback to coordinate analysis', () => {
      const mockLayer = {
        getBounds: jest.fn(() => ({
          isValid: jest.fn(() => false)
        })),
        getLatLngs: jest.fn(() => [
          { lat: -37.8, lng: 144.9 },
          { lat: -37.7, lng: 144.8 }
        ])
      };
      
      const result = manager.getPolygonLabelAnchor(mockLayer);
      expect(L.latLng).toHaveBeenCalled();
    });

    test('should handle empty coordinates', () => {
      const mockLayer = {
        getBounds: jest.fn(() => ({
          isValid: jest.fn(() => false)
        })),
        getLatLngs: jest.fn(() => [])
      };
      
      const result = manager.getPolygonLabelAnchor(mockLayer);
      expect(L.latLng).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('processName', () => {
    test('should add line breaks for long names', () => {
      expect(manager.processName('Short Name')).toBe('Short Name');
      expect(manager.processName('Very Long Name That Should Break')).toBe('Very Long Name<br>That Should Break');
      expect(manager.processName('')).toBe('');
      expect(manager.processName(null)).toBe('');
    });
  });

  describe('adjustHexColor', () => {
    test('should adjust hex color brightness', () => {
      expect(manager.adjustHexColor('#ff0000', 1.5)).toBe('#ff0000'); // Clamped to max
      expect(manager.adjustHexColor('#ff0000', 0.5)).toBe('#800000');
      expect(manager.adjustHexColor('ff0000', 0.5)).toBe('#800000'); // Without #
      expect(manager.adjustHexColor('', 0.5)).toBe('');
      expect(manager.adjustHexColor('#ff0000', null)).toBe('#ff0000');
    });
  });

  describe('ensureLabel', () => {
    test('should create label for point markers', () => {
      const mockMarker = {
        getLatLng: jest.fn(() => ({ lat: -37.8, lng: 144.9 }))
      };
      
      manager.ensureLabel('ambulance', 'test-ambulance', 'Test Station', true, mockMarker, mockDependencies);
      
      expect(L.marker).toHaveBeenCalled();
      expect(L.divIcon).toHaveBeenCalled();
      expect(mockState.nameLabelMarkers.ambulance['test-ambulance']).toBeDefined();
    });

    test('should create label for polygon layers', () => {
      const mockLayer = {
        getBounds: jest.fn(() => ({
          isValid: jest.fn(() => true),
          getCenter: jest.fn(() => ({ lat: -37.8, lng: 144.9 }))
        }))
      };
      
      manager.ensureLabel('ses', 'test-ses', 'Test SES', false, mockLayer, mockDependencies);
      
      expect(L.marker).toHaveBeenCalled();
      expect(mockState.nameLabelMarkers.ses['test-ses']).toBeDefined();
    });

    test('should use pre-calculated coordinates for SES facilities', () => {
      const mockLayer = {};
      
      manager.ensureLabel('ses', 'test-ses', 'Test SES', false, mockLayer, mockDependencies);
      
      expect(L.latLng).toHaveBeenCalledWith(-37.8, 144.9);
    });

    test('should use pre-calculated coordinates for CFA facilities', () => {
      const mockLayer = {};
      
      manager.ensureLabel('cfa', 'test-cfa', 'Test CFA', false, mockLayer, mockDependencies);
      
      expect(L.latLng).toHaveBeenCalledWith(-37.7, 144.8);
    });

    test('should handle missing map gracefully', () => {
      const mockDependenciesNoMap = { ...mockDependencies, map: null };
      
      expect(() => {
        manager.ensureLabel('ses', 'test', 'Test', false, {}, mockDependenciesNoMap);
      }).not.toThrow();
    });

    test('should handle missing latlng gracefully', () => {
      const mockLayer = {
        getBounds: jest.fn(() => ({
          isValid: jest.fn(() => false)
        })),
        getLatLngs: jest.fn(() => [])
      };
      
      expect(() => {
        manager.ensureLabel('ses', 'test', 'Test', false, mockLayer, mockDependencies);
      }).not.toThrow();
    });
  });

  describe('removeLabel', () => {
    test('should remove existing label', () => {
      const mockMarker = { remove: jest.fn() };
      mockState.nameLabelMarkers.ses = { 'test-ses': mockMarker };
      
      manager.removeLabel('ses', 'test-ses', mockDependencies);
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(mockMarker);
      expect(mockState.nameLabelMarkers.ses['test-ses']).toBeNull();
    });

    test('should handle missing markers gracefully', () => {
      expect(() => {
        manager.removeLabel('unknown', 'test', mockDependencies);
      }).not.toThrow();
    });

    test('should handle missing marker gracefully', () => {
      mockState.nameLabelMarkers.ses = {};
      
      expect(() => {
        manager.removeLabel('ses', 'test', mockDependencies);
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    test('should remove all labels', () => {
      const mockMarker1 = { remove: jest.fn() };
      const mockMarker2 = { remove: jest.fn() };
      
      mockState.nameLabelMarkers = {
        ses: { 'test1': mockMarker1 },
        lga: { 'test2': mockMarker2 }
      };
      
      manager.destroy(mockDependencies);
      
      expect(mockMap.removeLayer).toHaveBeenCalledTimes(2);
      expect(mockState.nameLabelMarkers.ses).toEqual({});
      expect(mockState.nameLabelMarkers.lga).toEqual({});
    });

    test('should handle missing markers gracefully', () => {
      expect(() => {
        manager.destroy(mockDependencies);
      }).not.toThrow();
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function exports', () => {
      // Test the manager method directly first
      expect(manager.formatAmbulanceName('Test Station')).toBe('Test');
      expect(manager.formatAmbulanceName('Test Ambulance Station')).toBe('Test Ambo');
      
      // Test legacy exports
      expect(formatAmbulanceName('Test Station')).toBe('Test');
      expect(formatAmbulanceName('Test Ambulance Station')).toBe('Test Ambo');
      expect(formatPoliceName('Test Police Station')).toBe('Test');
      expect(formatLgaName('Test (Unincorporated)')).toBe('Test');
      expect(getPolygonLabelAnchor).toBeDefined();
    });

    test('should work with singleton instance', () => {
      expect(labelManager).toBeInstanceOf(LabelManager);
      expect(labelManager.formatAmbulanceName('Test')).toBe('Test');
    });
  });
});
