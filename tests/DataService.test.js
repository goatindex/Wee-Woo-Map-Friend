import { DataService } from '../js/modules/DataService.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';
import { dataValidator } from '../js/modules/DataValidator.js';

// Mock dependencies
const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const config = {
      'api.baseUrl': 'https://api.example.com',
      'data.geojsonPath': '/geojson',
      'data.maxStringLength': 1000
    };
    return config[key] || defaultValue;
  })
};

const mockEventBus = {
  on: jest.fn(),
  emit: jest.fn()
};

// Mock logger for testing
const mockLogger = new StructuredLogger({
  transports: [{
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(() => ({ end: jest.fn() })),
    createChild: jest.fn(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      time: jest.fn(() => ({ end: jest.fn() })),
      createChild: jest.fn(() => ({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        time: jest.fn(() => ({ end: jest.fn() })),
      })),
    })),
  }]
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('DataService', () => {
  let dataService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Create DataService instance with mocked dependencies
    dataService = new DataService(mockConfigService, mockEventBus, dataValidator);
    dataService.logger = mockLogger.createChild({ module: 'DataService' });
    
    // Mock validator methods
    dataValidator.validateGeoJSON = jest.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: []
    });
    dataValidator.sanitizeData = jest.fn((data) => data);
  });

  describe('Data Loading', () => {
    it('should load data from cache when available', async () => {
      const testData = [{ id: 1, name: 'Test' }];
      dataService.cache.set('test', testData);
      
      const result = await dataService.loadData('test');
      
      expect(result).toEqual(testData);
      expect(fetch).not.toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loaded', expect.any(Object));
    });

    it('should load data from source when not cached', async () => {
      const testData = [{ id: 1, name: 'Test' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: testData
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      const result = await dataService.loadData('ses');
      
      expect(result).toEqual(testData);
      expect(fetch).toHaveBeenCalledWith('/geojson/ses.geojson', expect.any(Object));
      expect(dataService.cache.get('ses')).toEqual(testData);
    });

    it('should handle API loading errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(dataService.loadData('ses')).rejects.toThrow('Failed to load data for category \'ses\': Network error');
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.load.error', expect.any(Object));
    });

    it('should validate data when validation is enabled', async () => {
      const testData = [{ id: 1, name: 'Test' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: testData
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('ses', { validate: true });
      
      expect(dataValidator.validateGeoJSON).toHaveBeenCalledWith({
        type: 'FeatureCollection',
        features: testData
      });
    });

    it('should sanitize data when sanitization is enabled', async () => {
      const testData = [{ id: 1, name: '  Test  ' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: testData
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('ses', { sanitize: true });
      
      expect(dataValidator.sanitizeData).toHaveBeenCalled();
    });

    it('should skip cache when cache is disabled', async () => {
      const testData = [{ id: 1, name: 'Test' }];
      dataService.cache.set('test', testData);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 2, name: 'New' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      const result = await dataService.loadData('test', { cache: false });
      
      expect(result).toEqual([{ id: 2, name: 'New' }]);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Batch Loading', () => {
    it('should load multiple categories in batch', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'Test' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      const result = await dataService.loadDataBatch(['ses', 'lga']);
      
      expect(result).toHaveProperty('ses');
      expect(result).toHaveProperty('lga');
      expect(result.get('ses')).toEqual([{ id: 1, name: 'Test' }]);
      expect(result.get('lga')).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should handle partial failures in batch loading', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'Test' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      // Mock one category to fail
      jest.spyOn(dataService, 'loadData')
        .mockResolvedValueOnce([{ id: 1, name: 'SES' }])
        .mockRejectedValueOnce(new Error('LGA load failed'));
      
      const result = await dataService.loadDataBatch(['ses', 'lga']);
      
      expect(result.get('ses')).toEqual([{ id: 1, name: 'SES' }]);
      expect(result.get('lga')).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should return cached data when available', () => {
      const testData = [{ id: 1, name: 'Test' }];
      dataService.cache.set('test', testData);
      
      const result = dataService.getCachedData('test');
      
      expect(result).toEqual(testData);
    });

    it('should return null when data not cached', () => {
      const result = dataService.getCachedData('nonexistent');
      
      expect(result).toBeNull();
    });

    it('should invalidate cache for specific category', () => {
      dataService.cache.set('test', [{ id: 1, name: 'Test' }]);
      dataService.loadHistory.set('test', [{ id: 1, name: 'Test' }]);
      
      dataService.invalidateCache('test');
      
      expect(dataService.cache.has('test')).toBe(false);
      expect(dataService.loadHistory.has('test')).toBe(false);
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.cache.invalidated', { category: 'test' });
    });

    it('should invalidate all caches', () => {
      dataService.cache.set('test1', [{ id: 1 }]);
      dataService.cache.set('test2', [{ id: 2 }]);
      dataService.loadHistory.set('test1', [{ id: 1 }]);
      dataService.loadHistory.set('test2', [{ id: 2 }]);
      
      dataService.invalidateAllCaches();
      
      expect(dataService.cache.size).toBe(0);
      expect(dataService.loadHistory.size).toBe(0);
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.cache.invalidated.all');
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to data updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = dataService.subscribeToDataUpdates('test', callback);
      
      expect(dataService.subscribers.has('test')).toBe(true);
      expect(dataService.subscribers.get('test').has(callback)).toBe(true);
      
      // Test unsubscribe
      unsubscribe();
      expect(dataService.subscribers.get('test').has(callback)).toBe(false);
    });

    it('should subscribe to progress updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = dataService.subscribeToProgress('test', callback);
      
      expect(dataService.progressSubscribers.has('test')).toBe(true);
      expect(dataService.progressSubscribers.get('test').has(callback)).toBe(true);
      
      // Test unsubscribe
      unsubscribe();
      expect(dataService.progressSubscribers.get('test').has(callback)).toBe(false);
    });

    it('should notify subscribers when data is loaded', async () => {
      const callback = jest.fn();
      dataService.subscribeToDataUpdates('test', callback);
      
      const testData = [{ id: 1, name: 'Test' }];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: testData
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('test');
      
      expect(callback).toHaveBeenCalledWith(testData);
    });
  });

  describe('Statistics', () => {
    it('should track loading statistics', async () => {
      const initialStats = dataService.getStatistics();
      expect(initialStats.totalLoads).toBe(0);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'Test' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('test');
      
      const updatedStats = dataService.getStatistics();
      expect(updatedStats.totalLoads).toBe(1);
      expect(updatedStats.cacheMisses).toBe(1);
      expect(updatedStats.averageLoadTime).toBeGreaterThan(0);
    });

    it('should track cache hits', async () => {
      const testData = [{ id: 1, name: 'Test' }];
      dataService.cache.set('test', testData);
      
      await dataService.loadData('test');
      
      const stats = dataService.getStatistics();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('Data Sources', () => {
    it('should load from file source for known categories', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'SES' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('ses');
      
      expect(fetch).toHaveBeenCalledWith('/geojson/ses.geojson', expect.any(Object));
    });

    it('should load mock data for unknown categories', async () => {
      const result = await dataService.loadData('unknown');
      
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      dataValidator.validateGeoJSON.mockResolvedValue({
        valid: false,
        errors: ['Invalid geometry'],
        warnings: []
      });
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'Test' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      await dataService.loadData('test', { validate: true });
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.validation.failed', expect.any(Object));
    });

    it('should handle subscriber callback errors', async () => {
      const callback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      dataService.subscribeToDataUpdates('test', callback);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          type: 'FeatureCollection',
          features: [{ id: 1, name: 'Test' }]
        })
      };
      fetch.mockResolvedValue(mockResponse);
      
      // Should not throw error
      await expect(dataService.loadData('test')).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      dataService.cache.set('test', [{ id: 1 }]);
      dataService.subscribers.set('test', new Set([jest.fn()]));
      dataService.progressSubscribers.set('test', new Set([jest.fn()]));
      dataService.dataSchemas.set('test', {});
      dataService.loadHistory.set('test', [{ id: 1 }]);
      
      await dataService.cleanup();
      
      expect(dataService.cache.size).toBe(0);
      expect(dataService.subscribers.size).toBe(0);
      expect(dataService.progressSubscribers.size).toBe(0);
      expect(dataService.dataSchemas.size).toBe(0);
      expect(dataService.loadHistory.size).toBe(0);
    });
  });
});
