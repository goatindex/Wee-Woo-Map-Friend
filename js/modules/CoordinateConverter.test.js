/**
 * @fileoverview Tests for CoordinateConverter module
 */

import { CoordinateConverter, coordinateConverter, convertMGA94ToLatLon } from './CoordinateConverter.js';

// Mock proj4
global.proj4 = jest.fn((from, to, coords) => {
  // Mock conversion: add some offset to simulate real conversion
  return [coords[0] + 0.001, coords[1] + 0.001];
});

global.proj4.WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

describe('CoordinateConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new CoordinateConverter();
    jest.clearAllMocks();
  });

  describe('convertMGA94ToLatLon', () => {
    test('should convert valid MGA94 coordinates to WGS84', () => {
      const x = 500000;
      const y = 6000000;
      
      const result = converter.convertMGA94ToLatLon(x, y);
      
      expect(result).toEqual([500000.001, 6000000.001]);
    });

    test('should return null for invalid input types', () => {
      const result1 = converter.convertMGA94ToLatLon('invalid', 6000000);
      const result2 = converter.convertMGA94ToLatLon(500000, 'invalid');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    test('should handle missing proj4 library', () => {
      const originalProj4 = global.proj4;
      delete global.proj4;
      
      const result = converter.convertMGA94ToLatLon(500000, 6000000);
      
      expect(result).toBeNull();
      
      // Restore proj4
      global.proj4 = originalProj4;
    });
  });

  describe('batchConvertMGA94ToLatLon', () => {
    test('should convert multiple coordinates', () => {
      const coordinates = [
        { x: 500000, y: 6000000 },
        { x: 510000, y: 6010000 }
      ];
      
      const results = converter.batchConvertMGA94ToLatLon(coordinates);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        x: 500000,
        y: 6000000,
        lon: 500000.001,
        lat: 6000000.001,
        converted: true
      });
    });

    test('should handle invalid input', () => {
      const result = converter.batchConvertMGA94ToLatLon('invalid');
      
      expect(result).toEqual([]);
    });
  });

  describe('validateMGA94Coordinates', () => {
    test('should validate coordinates within bounds', () => {
      const result = converter.validateMGA94Coordinates(500000, 6000000);
      
      expect(result).toBe(true);
    });

    test('should reject coordinates outside bounds', () => {
      const result1 = converter.validateMGA94Coordinates(100000, 6000000); // x too low
      const result2 = converter.validateMGA94Coordinates(500000, 5000000); // y too low
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function export', () => {
      const result = convertMGA94ToLatLon(500000, 6000000);
      
      expect(result).toEqual([500000.001, 6000000.001]);
    });

    test('should work with singleton instance', () => {
      const result = coordinateConverter.convertMGA94ToLatLon(500000, 6000000);
      
      expect(result).toEqual([500000.001, 6000000.001]);
    });
  });
});
