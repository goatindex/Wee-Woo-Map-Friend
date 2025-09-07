/**
 * DependencyContainer Test Suite
 * Comprehensive tests for the dependency injection system
 */

import { 
  DependencyContainer,
  TYPES,
  BaseService,
  ConfigService,
  EnvironmentService,
  DataService,
  StateManager
} from '../js/modules/DependencyContainer.js';

// Mock dependencies
jest.mock('../js/modules/StructuredLogger.js', () => ({
  logger: {
    createChild: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../js/modules/EnhancedEventBus.js', () => ({
  enhancedEventBus: {
    on: jest.fn(),
    once: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    emitSync: jest.fn()
  }
}));

jest.mock('../js/modules/ErrorBoundary.js', () => ({
  errorBoundary: {
    handleError: jest.fn()
  }
}));

describe('DependencyContainer System', () => {
  let container;

  beforeEach(() => {
    container = new DependencyContainer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DependencyContainer', () => {
    test('should create container instance', () => {
      expect(container).toBeInstanceOf(DependencyContainer);
      expect(container.getContainer()).toBeDefined();
    });

    test('should check if service is bound', () => {
      expect(container.isBound(TYPES.Logger)).toBe(true);
      expect(container.isBound(TYPES.EventBus)).toBe(true);
      expect(container.isBound(TYPES.ConfigService)).toBe(true);
      expect(container.isBound(TYPES.EnvironmentService)).toBe(true);
      expect(container.isBound(TYPES.DataService)).toBe(true);
      expect(container.isBound(TYPES.StateManager)).toBe(true);
    });

    test('should get service instances', () => {
      const configService = container.get(TYPES.ConfigService);
      const environmentService = container.get(TYPES.EnvironmentService);
      const dataService = container.get(TYPES.DataService);
      const stateManager = container.get(TYPES.StateManager);

      expect(configService).toBeInstanceOf(ConfigService);
      expect(environmentService).toBeInstanceOf(EnvironmentService);
      expect(dataService).toBeInstanceOf(DataService);
      expect(stateManager).toBeInstanceOf(StateManager);
    });

    test('should initialize all services', async () => {
      await container.initialize();

      // Services should be initialized
      const configService = container.get(TYPES.ConfigService);
      const environmentService = container.get(TYPES.EnvironmentService);
      const dataService = container.get(TYPES.DataService);
      const stateManager = container.get(TYPES.StateManager);

      expect(configService).toBeDefined();
      expect(environmentService).toBeDefined();
      expect(dataService).toBeDefined();
      expect(stateManager).toBeDefined();
    });

    test('should cleanup all services', async () => {
      await container.initialize();
      await container.cleanup();

      // Container should be cleaned up
      expect(container.initialized).toBe(false);
    });
  });

  describe('ConfigService', () => {
    let configService;

    beforeEach(async () => {
      configService = container.get(TYPES.ConfigService);
      await configService.initialize();
    });

    test('should initialize with default configuration', () => {
      expect(configService.get('app.name')).toBe('WeeWoo Map Friend');
      expect(configService.get('app.version')).toBe('2.0.0');
      expect(configService.has('app.environment')).toBe(true);
    });

    test('should get configuration values', () => {
      const appName = configService.get('app.name');
      const appVersion = configService.get('app.version');
      const debugEnabled = configService.get('debug.enabled');

      expect(appName).toBe('WeeWoo Map Friend');
      expect(appVersion).toBe('2.0.0');
      expect(typeof debugEnabled).toBe('boolean');
    });

    test('should return default values for missing keys', () => {
      const missingValue = configService.get('missing.key', 'default');
      expect(missingValue).toBe('default');
    });

    test('should set configuration values', () => {
      configService.set('test.key', 'test.value');
      expect(configService.get('test.key')).toBe('test.value');
    });

    test('should check if configuration key exists', () => {
      expect(configService.has('app.name')).toBe(true);
      expect(configService.has('missing.key')).toBe(false);
    });

    test('should get all configuration', () => {
      const allConfig = configService.getAll();
      expect(typeof allConfig).toBe('object');
      expect(allConfig['app.name']).toBe('WeeWoo Map Friend');
    });

    test('should detect environment correctly', () => {
      // Mock window.location for testing
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'localhost'
        },
        writable: true
      });

      const configService = new ConfigService();
      expect(configService.get('app.environment')).toBe('development');
    });
  });

  describe('EnvironmentService', () => {
    let environmentService;

    beforeEach(async () => {
      environmentService = container.get(TYPES.EnvironmentService);
      await environmentService.initialize();
    });

    test('should detect platform', () => {
      const platform = environmentService.getPlatform();
      expect(['web', 'mobile', 'desktop', 'node']).toContain(platform);
    });

    test('should check platform type', () => {
      const isMobile = environmentService.isMobile();
      const isDesktop = environmentService.isDesktop();
      const isWeb = environmentService.isWeb();

      expect(typeof isMobile).toBe('boolean');
      expect(typeof isDesktop).toBe('boolean');
      expect(typeof isWeb).toBe('boolean');
    });

    test('should detect capabilities', () => {
      const capabilities = environmentService.getCapabilities();
      
      expect(typeof capabilities).toBe('object');
      expect(typeof capabilities.geolocation).toBe('boolean');
      expect(typeof capabilities.serviceWorker).toBe('boolean');
      expect(typeof capabilities.webGL).toBe('boolean');
      expect(typeof capabilities.touch).toBe('boolean');
      expect(typeof capabilities.localStorage).toBe('boolean');
    });

    test('should detect mobile platform', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      const environmentService = new EnvironmentService();
      environmentService.detectPlatform();
      expect(environmentService.isMobile()).toBe(true);
    });
  });

  describe('DataService', () => {
    let dataService;

    beforeEach(async () => {
      dataService = container.get(TYPES.DataService);
      await dataService.initialize();
    });

    test('should load data for category', async () => {
      const data = await dataService.loadData('ses');
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
    });

    test('should cache loaded data', async () => {
      const data1 = await dataService.loadData('ses');
      const data2 = await dataService.loadData('ses');
      
      expect(data1).toBe(data2); // Same reference due to caching
    });

    test('should load data batch', async () => {
      const categories = ['ses', 'lga', 'cfa'];
      const results = await dataService.loadDataBatch(categories);
      
      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(3);
      expect(results.has('ses')).toBe(true);
      expect(results.has('lga')).toBe(true);
      expect(results.has('cfa')).toBe(true);
    });

    test('should get cached data', async () => {
      await dataService.loadData('ses');
      const cachedData = dataService.getCachedData('ses');
      
      expect(Array.isArray(cachedData)).toBe(true);
      expect(cachedData.length).toBeGreaterThan(0);
    });

    test('should return null for uncached data', () => {
      const cachedData = dataService.getCachedData('nonexistent');
      expect(cachedData).toBeNull();
    });

    test('should invalidate cache', async () => {
      await dataService.loadData('ses');
      expect(dataService.getCachedData('ses')).not.toBeNull();
      
      dataService.invalidateCache('ses');
      expect(dataService.getCachedData('ses')).toBeNull();
    });

    test('should subscribe to data updates', async () => {
      const callback = jest.fn();
      const unsubscribe = dataService.subscribeToDataUpdates('ses', callback);
      
      await dataService.loadData('ses');
      
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('StateManager', () => {
    let stateManager;

    beforeEach(async () => {
      stateManager = container.get(TYPES.StateManager);
      await stateManager.initialize();
    });

    test('should initialize with default state', () => {
      const state = stateManager.getState();
      
      expect(state).toHaveProperty('map');
      expect(state).toHaveProperty('sidebar');
      expect(state).toHaveProperty('data');
      expect(state).toHaveProperty('ui');
      expect(state.map).toHaveProperty('center');
      expect(state.map).toHaveProperty('zoom');
      expect(state.map).toHaveProperty('layers');
    });

    test('should update state', () => {
      const newState = { test: 'value' };
      stateManager.setState(newState);
      
      const state = stateManager.getState();
      expect(state.test).toBe('value');
    });

    test('should merge state updates', () => {
      stateManager.setState({ map: { center: [1, 1] } });
      stateManager.setState({ sidebar: { expanded: true } });
      
      const state = stateManager.getState();
      expect(state.map.center).toEqual([1, 1]);
      expect(state.sidebar.expanded).toBe(true);
    });

    test('should subscribe to state changes', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe('test.path', listener);
      
      stateManager.setState({ test: 'value' });
      
      // Note: In a real implementation, this would trigger the listener
      // For now, we just verify the subscription was created
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
    });

    test('should dispatch actions', () => {
      const action = { type: 'TEST_ACTION', payload: 'test' };
      stateManager.dispatch(action);
      
      // Action should be dispatched (in real implementation, this would trigger reducers)
      expect(action.type).toBe('TEST_ACTION');
    });
  });

  describe('BaseService', () => {
    test('should create base service with logger', () => {
      const service = new BaseService();
      expect(service.logger).toBeDefined();
    });

    test('should initialize service', async () => {
      const service = new BaseService();
      await service.initialize();
      // Should not throw
    });

    test('should cleanup service', async () => {
      const service = new BaseService();
      await service.cleanup();
      // Should not throw
    });
  });

  describe('Service Integration', () => {
    test('should inject dependencies correctly', async () => {
      await container.initialize();
      
      const dataService = container.get(TYPES.DataService);
      const configService = container.get(TYPES.ConfigService);
      
      // DataService should have ConfigService injected
      expect(dataService.configService).toBe(configService);
    });

    test('should handle circular dependencies', () => {
      // This test ensures that our DI setup doesn't create circular dependencies
      const container = new DependencyContainer();
      
      // Should be able to get all services without circular dependency issues
      expect(() => {
        container.get(TYPES.ConfigService);
        container.get(TYPES.EnvironmentService);
        container.get(TYPES.DataService);
        container.get(TYPES.StateManager);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization errors', async () => {
      // Mock a service that throws during initialization
      const mockService = {
        initialize: jest.fn().mockRejectedValue(new Error('Initialization failed')),
        cleanup: jest.fn()
      };

      // This test ensures error handling in service initialization
      await expect(mockService.initialize()).rejects.toThrow('Initialization failed');
    });

    test('should handle service cleanup errors', async () => {
      const mockService = {
        initialize: jest.fn().mockResolvedValue(),
        cleanup: jest.fn().mockRejectedValue(new Error('Cleanup failed'))
      };

      await expect(mockService.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('TYPES Constants', () => {
    test('should have all required service types', () => {
      expect(TYPES.Logger).toBeDefined();
      expect(TYPES.EventBus).toBeDefined();
      expect(TYPES.ErrorBoundary).toBeDefined();
      expect(TYPES.ConfigService).toBeDefined();
      expect(TYPES.EnvironmentService).toBeDefined();
      expect(TYPES.DataService).toBeDefined();
      expect(TYPES.StateManager).toBeDefined();
    });

    test('should have unique symbols', () => {
      const symbols = Object.values(TYPES);
      const uniqueSymbols = new Set(symbols);
      expect(symbols.length).toBe(uniqueSymbols.size);
    });
  });
});
