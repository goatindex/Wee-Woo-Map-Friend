/**
 * @jest-environment jsdom
 */

import { DataLoadingOrchestrator, dataLoadingOrchestrator } from './DataLoadingOrchestrator.js';
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

describe('DataLoadingOrchestrator', () => {
  let orchestrator;
  let mockPolygonLoader;

  beforeEach(() => {
    // Mock polygon loader for state manager
    mockPolygonLoader = {
      loadCategory: jest.fn().mockResolvedValue({ success: true })
    };
    
    // Set up state manager with mock polygon loader BEFORE creating orchestrator
    stateManager.set('polygonLoader', mockPolygonLoader);
    
    // Create a fresh instance for testing
    orchestrator = new DataLoadingOrchestrator();
    
    // Mock DOM methods
    document.body.innerHTML = '';
    document.createElement = jest.fn(() => ({
      id: '',
      innerText: '',
      style: {},
      remove: jest.fn()
    }));
    document.getElementById = jest.fn(() => null);
    document.body.appendChild = jest.fn();
  });

  afterEach(() => {
    if (orchestrator) {
      orchestrator = null;
    }
    // Clean up state
    stateManager.reset();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(orchestrator.initialized).toBe(false);
      expect(orchestrator.loadingPhase).toBe('idle');
      expect(orchestrator.loadedCategories).toBeInstanceOf(Set);
      expect(orchestrator.loadingPromises).toBeInstanceOf(Map);
      expect(orchestrator.performanceMetrics).toBeInstanceOf(Map);
      expect(orchestrator.errorRecovery).toBeInstanceOf(Map);
    });

    test('should have correct loading configuration', () => {
      expect(orchestrator.loadingConfig.priorities).toBeDefined();
      expect(orchestrator.loadingConfig.urls).toBeDefined();
      expect(orchestrator.loadingConfig.batchSizes).toBeDefined();
      
      // Check priority configuration
      expect(orchestrator.loadingConfig.priorities.ses).toBe('high');
      expect(orchestrator.loadingConfig.priorities.lga).toBe('high');
      expect(orchestrator.loadingConfig.priorities.cfa).toBe('medium');
      expect(orchestrator.loadingConfig.priorities.frv).toBe('low');
    });

    test('should initialize successfully with real dependencies', async () => {
      // Mock event bus emit to track events
      const emitSpy = jest.spyOn(globalEventBus, 'emit');
      
      await orchestrator.init();
      
      expect(orchestrator.initialized).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('dataOrchestrator:ready', expect.any(Object));
      
      emitSpy.mockRestore();
    });
  });

  describe('Category Priority Grouping', () => {
    test('should group categories by priority correctly', () => {
      const groups = orchestrator.groupCategoriesByPriority();
      
      expect(groups.high).toContain('ses');
      expect(groups.high).toContain('lga');
      expect(groups.medium).toContain('cfa');
      expect(groups.medium).toContain('ambulance');
      expect(groups.low).toContain('frv');
      expect(groups.low).toContain('police');
    });
  });

  describe('Loading Status', () => {
    test('should return correct loading status', () => {
      const status = orchestrator.getLoadingStatus();
      
      expect(status.phase).toBe('idle');
      expect(status.loadedCategories).toEqual([]);
      expect(status.loadingCategories).toEqual([]);
      expect(status.errorCategories).toEqual([]);
      expect(status.totalCategories).toBe(6);
    });
  });

  describe('Performance Metrics', () => {
    test('should return empty performance metrics initially', () => {
      const metrics = orchestrator.getPerformanceMetrics();
      expect(metrics).toEqual({});
    });
  });

  describe('Legacy Preloader Functionality', () => {
    test('should show loading spinner', () => {
      orchestrator.showLoadingSpinner();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should update loading spinner text', () => {
      const mockSpinner = {
        innerText: '',
        remove: jest.fn()
      };
      document.getElementById = jest.fn(() => mockSpinner);
      
      orchestrator.updateLoadingSpinner('Loading test...');
      
      expect(mockSpinner.innerText).toBe('Loading test...');
    });

    test('should hide loading spinner', () => {
      const mockSpinner = {
        remove: jest.fn()
      };
      document.getElementById = jest.fn(() => mockSpinner);
      
      orchestrator.hideLoadingSpinner();
      
      expect(mockSpinner.remove).toHaveBeenCalled();
    });

    test('should handle missing spinner gracefully', () => {
      document.getElementById = jest.fn(() => null);
      
      expect(() => {
        orchestrator.updateLoadingSpinner('test');
        orchestrator.hideLoadingSpinner();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle loading errors gracefully', () => {
      const error = new Error('Test error');
      
      expect(() => {
        orchestrator.handleLoadingError('test', error);
      }).not.toThrow();
      
      // Check that error was recorded
      const errorInfo = orchestrator.errorRecovery.get('test');
      expect(errorInfo).toBeDefined();
      expect(errorInfo.error).toBe('Test error');
      expect(errorInfo.retryCount).toBe(1);
    });

    test('should increment retry count on repeated errors', () => {
      const error = new Error('Test error');
      
      orchestrator.handleLoadingError('test', error);
      orchestrator.handleLoadingError('test', error);
      
      const errorInfo = orchestrator.errorRecovery.get('test');
      expect(errorInfo.retryCount).toBe(2);
    });

    test('should emit error events when handling errors', () => {
      const error = new Error('Test error');
      const emitSpy = jest.spyOn(globalEventBus, 'emit');
      
      orchestrator.handleLoadingError('test', error);
      
      expect(emitSpy).toHaveBeenCalledWith('dataOrchestrator:categoryError', expect.objectContaining({
        category: 'test',
        error: error,
        orchestrator: orchestrator
      }));
      
      emitSpy.mockRestore();
    });
  });

  describe('Readiness Check', () => {
    test('should not be ready initially', () => {
      expect(orchestrator.isReady()).toBe(false);
    });

    test('should be ready when initialized and loading complete', () => {
      orchestrator.initialized = true;
      orchestrator.loadingPhase = 'complete';
      
      expect(orchestrator.isReady()).toBe(true);
    });
  });

  describe('Global Instance', () => {
    test('should have a global instance', () => {
      expect(dataLoadingOrchestrator).toBeInstanceOf(DataLoadingOrchestrator);
    });

    test('should expose global instance on window', () => {
      expect(window.dataLoadingOrchestrator).toBe(dataLoadingOrchestrator);
    });
  });

  describe('Category Loading', () => {
    test('should load category successfully', async () => {
      // Initialize the orchestrator first to set up the polygon loader
      await orchestrator.init();
      
      // Use a category that wasn't loaded during initialization
      const emitSpy = jest.spyOn(globalEventBus, 'emit');
      
      await orchestrator.loadCategory('frv');
      
      expect(mockPolygonLoader.loadCategory).toHaveBeenCalledWith('frv', 'geojson/frv.geojson');
      expect(orchestrator.loadedCategories.has('frv')).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('dataOrchestrator:categoryLoaded', expect.objectContaining({
        category: 'frv',
        duration: expect.any(Number),
        orchestrator: orchestrator
      }));
      
      emitSpy.mockRestore();
    });

    test('should handle category loading errors', async () => {
      // Initialize the orchestrator first to set up the polygon loader
      await orchestrator.init();
      
      // Use a category that wasn't loaded during initialization
      const error = new Error('Load failed');
      mockPolygonLoader.loadCategory.mockRejectedValueOnce(error);
      const emitSpy = jest.spyOn(globalEventBus, 'emit');
      
      await expect(orchestrator.loadCategory('frv')).rejects.toThrow('Load failed');
      
      expect(emitSpy).toHaveBeenCalledWith('dataOrchestrator:categoryError', expect.objectContaining({
        category: 'frv',
        error: error,
        orchestrator: orchestrator
      }));
      
      emitSpy.mockRestore();
    });
  });

  describe('Legacy Compatibility', () => {
    test('should expose legacy startPreloading function', () => {
      expect(typeof window.startPreloading).toBe('function');
    });

    test('should delegate startPreloading to orchestrator', async () => {
      // Mock the startPreloading method
      const mockStartPreloading = jest.fn().mockResolvedValue();
      dataLoadingOrchestrator.startPreloading = mockStartPreloading;
      
      await window.startPreloading();
      
      expect(mockStartPreloading).toHaveBeenCalled();
    });
  });
});
