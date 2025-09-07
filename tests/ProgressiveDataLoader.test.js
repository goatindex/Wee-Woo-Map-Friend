import { ProgressiveDataLoader } from '../js/modules/ProgressiveDataLoader.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';

// Mock dependencies
const mockDataService = {
  loadData: jest.fn(),
  getCachedData: jest.fn()
};

const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const config = {
      'data.loading.timeout': 30000,
      'data.loading.retries': 3
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

describe('ProgressiveDataLoader', () => {
  let loader;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create loader instance with mocked dependencies
    loader = new ProgressiveDataLoader(mockDataService, mockConfigService, mockEventBus);
    loader.logger = mockLogger.createChild({ module: 'ProgressiveDataLoader' });
  });

  describe('Progressive Loading', () => {
    it('should load critical data first', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      mockDataService.loadData.mockResolvedValue(criticalData);
      
      await loader.startProgressiveLoading();
      
      expect(mockDataService.loadData).toHaveBeenCalledWith('ses', expect.any(Object));
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loaded.critical', expect.any(Object));
    });

    it('should load important data after critical data', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockResolvedValueOnce(importantData) // lga
        .mockResolvedValueOnce(importantData); // cfa
      
      await loader.startProgressiveLoading();
      
      expect(mockDataService.loadData).toHaveBeenCalledWith('ses', expect.any(Object));
      expect(mockDataService.loadData).toHaveBeenCalledWith('lga', expect.any(Object));
      expect(mockDataService.loadData).toHaveBeenCalledWith('cfa', expect.any(Object));
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loaded.important', expect.any(Object));
    });

    it('should start background loading for secondary data', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      const secondaryData = [{ id: 3, name: 'Ambulance' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockResolvedValueOnce(importantData) // lga
        .mockResolvedValueOnce(importantData) // cfa
        .mockResolvedValueOnce(secondaryData); // ambulance
      
      await loader.startProgressiveLoading();
      
      // Wait for background loading to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockDataService.loadData).toHaveBeenCalledWith('ambulance', expect.any(Object));
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loaded.background', expect.any(Object));
    });

    it('should handle critical data loading failures', async () => {
      mockDataService.loadData.mockRejectedValue(new Error('Critical load failed'));
      
      await expect(loader.startProgressiveLoading()).rejects.toThrow('Critical load failed');
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loading.error', expect.any(Object));
    });

    it('should continue with important data even if some fail', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockRejectedValueOnce(new Error('LGA load failed')) // lga
        .mockResolvedValueOnce(importantData); // cfa
      
      // Should not throw error
      await expect(loader.startProgressiveLoading()).resolves.not.toThrow();
      
      expect(mockDataService.loadData).toHaveBeenCalledWith('ses', expect.any(Object));
      expect(mockDataService.loadData).toHaveBeenCalledWith('lga', expect.any(Object));
      expect(mockDataService.loadData).toHaveBeenCalledWith('cfa', expect.any(Object));
    });
  });

  describe('On-Demand Loading', () => {
    it('should load data on demand when not cached', async () => {
      const onDemandData = [{ id: 1, name: 'OnDemand' }];
      mockDataService.getCachedData.mockReturnValue(null);
      mockDataService.loadData.mockResolvedValue(onDemandData);
      
      const result = await loader.loadOnDemand('test');
      
      expect(result).toEqual(onDemandData);
      expect(mockDataService.loadData).toHaveBeenCalledWith('test', expect.any(Object));
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loaded.onDemand', expect.any(Object));
    });

    it('should return cached data when available', async () => {
      const cachedData = [{ id: 1, name: 'Cached' }];
      mockDataService.getCachedData.mockReturnValue(cachedData);
      
      const result = await loader.loadOnDemand('test');
      
      expect(result).toEqual(cachedData);
      expect(mockDataService.loadData).not.toHaveBeenCalled();
    });

    it('should handle on-demand loading errors', async () => {
      mockDataService.getCachedData.mockReturnValue(null);
      mockDataService.loadData.mockRejectedValue(new Error('On-demand load failed'));
      
      await expect(loader.loadOnDemand('test')).rejects.toThrow('On-demand load failed');
    });
  });

  describe('Progress Tracking', () => {
    it('should track loading progress for each phase', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockResolvedValueOnce(importantData) // lga
        .mockResolvedValueOnce(importantData); // cfa
      
      await loader.startProgressiveLoading();
      
      const criticalProgress = loader.getLoadingProgress('critical');
      expect(criticalProgress).toMatchObject({
        phase: 'critical',
        completed: 1,
        total: 1,
        percentage: 100
      });
      
      const importantProgress = loader.getLoadingProgress('important');
      expect(importantProgress).toMatchObject({
        phase: 'important',
        completed: 2,
        total: 2,
        percentage: 100
      });
    });

    it('should provide overall loading progress', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockResolvedValueOnce(importantData) // lga
        .mockResolvedValueOnce(importantData); // cfa
      
      await loader.startProgressiveLoading();
      
      const overallProgress = loader.getOverallProgress();
      expect(overallProgress).toMatchObject({
        phase: 'overall',
        completed: 3,
        total: 3,
        percentage: 100
      });
    });

    it('should notify progress subscribers', async () => {
      const callback = jest.fn();
      loader.subscribeToProgress('critical', callback);
      
      const criticalData = [{ id: 1, name: 'SES' }];
      mockDataService.loadData.mockResolvedValue(criticalData);
      
      await loader.startProgressiveLoading();
      
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'critical',
        percentage: 100
      }));
    });
  });

  describe('Statistics', () => {
    it('should track loading statistics', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      const importantData = [{ id: 2, name: 'LGA' }];
      
      mockDataService.loadData
        .mockResolvedValueOnce(criticalData) // ses
        .mockResolvedValueOnce(importantData) // lga
        .mockResolvedValueOnce(importantData); // cfa
      
      await loader.startProgressiveLoading();
      
      const stats = loader.getStatistics();
      expect(stats.totalLoads).toBe(3);
      expect(stats.criticalLoads).toBe(1);
      expect(stats.averageLoadTime).toBeGreaterThan(0);
    });

    it('should track on-demand loading statistics', async () => {
      const onDemandData = [{ id: 1, name: 'OnDemand' }];
      mockDataService.getCachedData.mockReturnValue(null);
      mockDataService.loadData.mockResolvedValue(onDemandData);
      
      await loader.loadOnDemand('test');
      
      const stats = loader.getStatistics();
      expect(stats.onDemandLoads).toBe(1);
      expect(stats.totalLoads).toBe(1);
    });

    it('should reset statistics', async () => {
      const criticalData = [{ id: 1, name: 'SES' }];
      mockDataService.loadData.mockResolvedValue(criticalData);
      
      await loader.startProgressiveLoading();
      
      loader.resetStatistics();
      
      const stats = loader.getStatistics();
      expect(stats.totalLoads).toBe(0);
      expect(stats.criticalLoads).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('should handle loading request events', async () => {
      const onDemandData = [{ id: 1, name: 'OnDemand' }];
      mockDataService.getCachedData.mockReturnValue(null);
      mockDataService.loadData.mockResolvedValue(onDemandData);
      
      // Simulate event
      const payload = {
        requestId: 'test-request',
        category: 'test',
        options: {}
      };
      
      await loader.handleLoadingRequest(payload);
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loading.result', {
        requestId: 'test-request',
        category: 'test',
        data: onDemandData
      });
    });

    it('should handle progress request events', () => {
      const payload = {
        requestId: 'test-request',
        phase: 'critical'
      };
      
      loader.handleProgressRequest(payload);
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('data.loading.progress.result', {
        requestId: 'test-request',
        phase: 'critical',
        progress: expect.any(Object)
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      loader.subscribers.set('test', new Set([jest.fn()]));
      loader.loadingPhases.set('test', ['test']);
      loader.loadingStrategies.set('test', {});
      loader.loadingQueue.set('test', {});
      loader.loadingProgress.set('test', {});
      loader.loadingState.set('test', 'loading');
      
      await loader.cleanup();
      
      expect(loader.subscribers.size).toBe(0);
      expect(loader.loadingPhases.size).toBe(0);
      expect(loader.loadingStrategies.size).toBe(0);
      expect(loader.loadingQueue.size).toBe(0);
      expect(loader.loadingProgress.size).toBe(0);
      expect(loader.loadingState.size).toBe(0);
    });
  });
});
