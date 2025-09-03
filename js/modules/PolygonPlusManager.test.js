/**
 * @fileoverview Tests for PolygonPlusManager module
 */

import { PolygonPlusManager, polygonPlusManager, addPolygonPlus, removePolygonPlus } from './PolygonPlusManager.js';

// Mock Leaflet
global.L = {
  divIcon: jest.fn((options) => ({ ...options, type: 'divIcon' })),
  marker: jest.fn((center, options) => ({
    addTo: jest.fn().mockReturnThis(),
    ...options,
    type: 'marker',
    _latlng: center
  }))
};

describe('PolygonPlusManager', () => {
  let manager;
  let mockMap;
  let mockPolygonLayer;

  beforeEach(() => {
    manager = new PolygonPlusManager();
    mockMap = {
      addLayer: jest.fn(),
      removeLayer: jest.fn()
    };
    mockPolygonLayer = {
      getBounds: jest.fn(() => ({
        getCenter: jest.fn(() => ({ lat: -37.8, lng: 144.9 }))
      })),
      _plusMarker: null,
      _leaflet_id: 12345 // Consistent ID for testing
    };
    jest.clearAllMocks();
    
    // Reset L.marker mock to return fresh objects
    L.marker.mockImplementation((center, options) => ({
      addTo: jest.fn().mockReturnThis(),
      ...options,
      type: 'marker',
      _latlng: center
    }));
  });

  describe('addPolygonPlus', () => {
    test('should add plus marker to polygon layer', () => {
      const result = manager.addPolygonPlus(mockMap, mockPolygonLayer);
      
      expect(result).toBeTruthy();
      expect(L.divIcon).toHaveBeenCalled();
      expect(L.marker).toHaveBeenCalled();
      expect(result.addTo).toHaveBeenCalled();
      expect(mockPolygonLayer._plusMarker).toBeTruthy();
    });

    test('should return null for invalid polygon layer', () => {
      const result = manager.addPolygonPlus(mockMap, null);
      
      expect(result).toBeNull();
      expect(L.marker).not.toHaveBeenCalled();
    });

    test('should return null for invalid map', () => {
      const result = manager.addPolygonPlus(null, mockPolygonLayer);
      
      expect(result).toBeNull();
      expect(L.marker).not.toHaveBeenCalled();
    });

    test('should use custom options', () => {
      const options = {
        size: 48,
        thickness: 12,
        color: '#ff0000'
      };
      
      manager.addPolygonPlus(mockMap, mockPolygonLayer, options);
      
      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          iconSize: [48, 48]
        })
      );
    });

    test('should track active markers', () => {
      manager.addPolygonPlus(mockMap, mockPolygonLayer);
      
      expect(manager.getActiveMarkerCount()).toBe(1);
    });
  });

  describe('removePolygonPlus', () => {
    test('should remove plus marker from polygon layer', () => {
      // First add a marker
      const marker = manager.addPolygonPlus(mockMap, mockPolygonLayer);
      const initialCount = manager.getActiveMarkerCount();
      
      // Then remove it
      const result = manager.removePolygonPlus(mockPolygonLayer, mockMap);
      
      expect(result).toBe(true);
      expect(marker.addTo).toHaveBeenCalled();
      expect(mockPolygonLayer._plusMarker).toBeNull();
      expect(manager.getActiveMarkerCount()).toBe(initialCount - 1);
    });

    test('should handle polygon layer without marker', () => {
      const result = manager.removePolygonPlus(mockPolygonLayer, mockMap);
      
      expect(result).toBe(false);
      expect(mockMap.removeLayer).not.toHaveBeenCalled();
    });

    test('should handle legacy marker removal', () => {
      // Simulate legacy marker
      const legacyMarker = { type: 'legacy-marker' };
      mockPolygonLayer._plusMarker = legacyMarker;
      
      const result = manager.removePolygonPlus(mockPolygonLayer, mockMap);
      
      expect(result).toBe(true);
      expect(mockMap.removeLayer).toHaveBeenCalledWith(legacyMarker);
      expect(mockPolygonLayer._plusMarker).toBeNull();
    });
  });

  describe('removeAllPlusMarkers', () => {
    test('should remove all active markers', () => {
      // Add multiple markers with different IDs
      const polygon1 = { ...mockPolygonLayer, _leaflet_id: 12345 };
      const polygon2 = { ...mockPolygonLayer, _leaflet_id: 67890 };
      
      const marker1 = manager.addPolygonPlus(mockMap, polygon1);
      const marker2 = manager.addPolygonPlus(mockMap, polygon2);
      
      expect(manager.getActiveMarkerCount()).toBe(2);
      
      const removedCount = manager.removeAllPlusMarkers(mockMap);
      
      expect(removedCount).toBe(2);
      expect(manager.getActiveMarkerCount()).toBe(0);
    });

    test('should handle empty marker list', () => {
      const removedCount = manager.removeAllPlusMarkers(mockMap);
      
      expect(removedCount).toBe(0);
    });
  });

  describe('getActiveMarkerCount', () => {
    test('should return correct count of active markers', () => {
      expect(manager.getActiveMarkerCount()).toBe(0);
      
      manager.addPolygonPlus(mockMap, mockPolygonLayer);
      expect(manager.getActiveMarkerCount()).toBe(1);
      
      const polygon2 = { ...mockPolygonLayer, _leaflet_id: 67890 };
      manager.addPolygonPlus(mockMap, polygon2);
      expect(manager.getActiveMarkerCount()).toBe(2);
    });
  });

  describe('createPlusSVG', () => {
    test('should create valid SVG markup', () => {
      const config = {
        size: 32,
        thickness: 8,
        color: '#fff',
        borderRadius: 3
      };
      
      const svg = manager.createPlusSVG(config);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('width="32"');
      expect(svg).toContain('height="32"');
      expect(svg).toContain('fill="#fff"');
      expect(svg).toContain('rx="3"');
    });
  });

  describe('generateMarkerId', () => {
    test('should generate ID from leaflet_id', () => {
      mockPolygonLayer._leaflet_id = 123;
      
      const id = manager.generateMarkerId(mockPolygonLayer);
      
      expect(id).toBe('plus-marker-123');
    });

    test('should generate fallback ID when no leaflet_id', () => {
      const polygonWithoutId = { ...mockPolygonLayer };
      delete polygonWithoutId._leaflet_id;
      
      const id = manager.generateMarkerId(polygonWithoutId);
      
      expect(id).toMatch(/^plus-marker-\d+-[a-z0-9]+$/);
    });
  });

  describe('updateMarkerConfig', () => {
    test('should update default configuration', () => {
      const newConfig = {
        size: 48,
        color: '#ff0000'
      };
      
      manager.updateMarkerConfig(newConfig);
      
      expect(manager.defaultConfig.size).toBe(48);
      expect(manager.defaultConfig.color).toBe('#ff0000');
      expect(manager.defaultConfig.thickness).toBe(8); // Should preserve existing values
    });
  });

  describe('destroy', () => {
    test('should clean up all resources', () => {
      // Add some markers with different IDs
      manager.addPolygonPlus(mockMap, mockPolygonLayer);
      const polygon2 = { ...mockPolygonLayer, _leaflet_id: 67890 };
      manager.addPolygonPlus(mockMap, polygon2);
      
      expect(manager.getActiveMarkerCount()).toBe(2);
      
      manager.destroy();
      
      expect(manager.getActiveMarkerCount()).toBe(0);
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function exports', () => {
      const result = addPolygonPlus(mockMap, mockPolygonLayer);
      
      expect(result).toBeTruthy();
      expect(L.marker).toHaveBeenCalled();
    });

    test('should work with legacy remove function', () => {
      manager.addPolygonPlus(mockMap, mockPolygonLayer);
      
      const result = removePolygonPlus(mockPolygonLayer, mockMap);
      
      expect(result).toBe(true);
      expect(mockMap.removeLayer).toHaveBeenCalled();
    });

    test('should work with singleton instance', () => {
      polygonPlusManager.addPolygonPlus(mockMap, mockPolygonLayer);
      
      expect(polygonPlusManager.getActiveMarkerCount()).toBeGreaterThan(0);
    });
  });
});
