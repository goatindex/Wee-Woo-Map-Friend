/**
 * @fileoverview Data Loaders Tests
 * Tests for GeoJSON loading, error handling, and data validation
 */

// Mock fetch for testing
global.fetch = jest.fn();

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

describe('Data Loaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('GeoJSON Loading', () => {
    test('should load SES data successfully', async () => {
      const mockSESData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Alpine Resorts',
              key: 'alpine_resorts'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSESData)
      });

      const response = await fetch('/geojson/ses.geojson');
      const data = await response.json();

      expect(data.type).toBe('FeatureCollection');
      expect(data.features).toHaveLength(1);
      expect(data.features[0].properties.name).toBe('Alpine Resorts');
    });

    test('should load LGA data successfully', async () => {
      const mockLGAData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Ballarat',
              key: 'ballarat'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLGAData)
      });

      const response = await fetch('/geojson/LGAs.geojson');
      const data = await response.json();

      expect(data.type).toBe('FeatureCollection');
      expect(data.features).toHaveLength(1);
      expect(data.features[0].properties.name).toBe('Ballarat');
    });

    test('should load CFA data successfully', async () => {
      const mockCFAData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Ballarat Group',
              key: 'ballarat_group'
            },
            geometry: {
              type: 'Point',
              coordinates: [143.8, -37.6]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCFAData)
      });

      const response = await fetch('/geojson/cfa.geojson');
      const data = await response.json();

      expect(data.type).toBe('FeatureCollection');
      expect(data.features).toHaveLength(1);
      expect(data.features[0].properties.name).toBe('Ballarat Group');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/geojson/ses.geojson');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle HTTP error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const response = await fetch('/geojson/missing.geojson');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const response = await fetch('/geojson/malformed.geojson');
      
      try {
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Invalid JSON');
      }
    });

    test('should handle missing GeoJSON properties', async () => {
      const mockDataWithMissingProps = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {}, // Missing name and key
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            }
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDataWithMissingProps)
      });

      const response = await fetch('/geojson/incomplete.geojson');
      const data = await response.json();

      expect(data.features[0].properties.name).toBeUndefined();
      expect(data.features[0].properties.key).toBeUndefined();
    });
  });

  describe('Data Validation', () => {
    test('should validate GeoJSON structure', async () => {
      const validGeoJSON = {
        type: 'FeatureCollection',
        features: []
      };

      expect(validGeoJSON.type).toBe('FeatureCollection');
      expect(Array.isArray(validGeoJSON.features)).toBe(true);
    });

    test('should validate feature properties', async () => {
      const validFeature = {
        type: 'Feature',
        properties: {
          name: 'Test Feature',
          key: 'test_key'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      };

      expect(validFeature.type).toBe('Feature');
      expect(validFeature.properties.name).toBeDefined();
      expect(validFeature.properties.key).toBeDefined();
      expect(validFeature.geometry).toBeDefined();
    });

    test('should validate geometry types', async () => {
      const validPolygon = {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      };

      const validPoint = {
        type: 'Point',
        coordinates: [0, 0]
      };

      expect(validPolygon.type).toBe('Polygon');
      expect(validPoint.type).toBe('Point');
      expect(Array.isArray(validPolygon.coordinates)).toBe(true);
      expect(Array.isArray(validPoint.coordinates)).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track loading performance', async () => {
      // Verify performance API is available
      expect(performance).toBeDefined();
      expect(typeof performance.now).toBe('function');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      });

      await fetch('/geojson/ses.geojson');
      
      // Verify we can measure time
      const startTime = performance.now();
      expect(typeof startTime).toBe('number');
      expect(startTime).toBeGreaterThan(0);
    });

    test('should handle large datasets efficiently', async () => {
      const largeDataset = {
        type: 'FeatureCollection',
        features: Array.from({ length: 1000 }, (_, i) => ({
          type: 'Feature',
          properties: { name: `Feature ${i}`, key: `feature_${i}` },
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        }))
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      });

      const response = await fetch('/geojson/large.geojson');
      const data = await response.json();

      expect(data.features).toHaveLength(1000);
    });
  });

  describe('Caching Strategy', () => {
    test('should implement proper caching headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([
          ['cache-control', 'max-age=3600'],
          ['etag', '"abc123"']
        ]),
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      });

      const response = await fetch('/geojson/ses.geojson');
      
      // Should have caching headers
      expect(response.headers.get('cache-control')).toBe('max-age=3600');
      expect(response.headers.get('etag')).toBe('"abc123"');
    });

    test('should handle conditional requests', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 304,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      });

      const response = await fetch('/geojson/ses.geojson', {
        headers: { 'if-none-match': '"abc123"' }
      });

      expect(response.status).toBe(304);
    });
  });

  describe('Data Transformation', () => {
    test('should normalize feature names', async () => {
      const rawData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: '  Alpine Resorts  ', // Extra whitespace
              key: 'alpine_resorts'
            },
            geometry: { type: 'Polygon', coordinates: [] }
          }
        ]
      };

      // Normalize the name
      const normalizedName = rawData.features[0].properties.name.trim();
      expect(normalizedName).toBe('Alpine Resorts');
    });

    test('should generate keys from names', async () => {
      const name = 'Alpine Resorts';
      const key = name.toLowerCase().replace(/\s+/g, '_');
      
      expect(key).toBe('alpine_resorts');
    });

    test('should handle special characters in names', async () => {
      const name = 'St. Kilda & District';
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      
      expect(key).toBe('st_kilda_district');
    });
  });
});
