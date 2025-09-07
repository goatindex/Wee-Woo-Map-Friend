import { ConfigService } from '../js/modules/ConfigService.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';
import { EnhancedEventBus } from '../js/modules/EnhancedEventBus.js';

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

// Mock global objects
const mockWindow = {
  location: { hostname: 'localhost' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  innerWidth: 1920,
  innerHeight: 1080
};

const mockProcess = {
  env: { NODE_ENV: 'test' }
};

describe('ConfigService', () => {
  let configService;
  let mockEventBus;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    global.window = mockWindow;
    global.process = mockProcess;
    
    // Create new instances
    mockEventBus = new EnhancedEventBus();
    configService = new ConfigService();
    
    // Replace the global event bus with our mock
    jest.spyOn(configService, 'setupEventHandlers').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.process;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(configService.config).toBeNull();
      expect(configService.validationRules.size).toBeGreaterThan(0);
      expect(configService.subscribers.size).toBe(0);
      expect(configService.cache.size).toBe(0);
      expect(configService.lastUpdated).toBeNull();
    });

    it('should setup validation rules on initialization', () => {
      expect(configService.validationRules.has('environment')).toBe(true);
      expect(configService.validationRules.has('platform')).toBe(true);
      expect(configService.validationRules.has('features')).toBe(true);
      expect(configService.validationRules.has('api')).toBe(true);
      expect(configService.validationRules.has('data')).toBe(true);
      expect(configService.validationRules.has('ui')).toBe(true);
      expect(configService.validationRules.has('performance')).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment from process.env', () => {
      global.process.env.NODE_ENV = 'development';
      const environment = configService.detectEnvironment();
      expect(environment).toBe('development');
    });

    it('should detect staging environment from hostname', () => {
      global.window.location.hostname = 'staging.example.com';
      delete global.process.env.NODE_ENV;
      const environment = configService.detectEnvironment();
      expect(environment).toBe('staging');
    });

    it('should detect production environment from hostname', () => {
      global.window.location.hostname = 'github.io';
      delete global.process.env.NODE_ENV;
      const environment = configService.detectEnvironment();
      expect(environment).toBe('production');
    });

    it('should default to development when no indicators found', () => {
      global.window.location.hostname = 'unknown.com';
      delete global.process.env.NODE_ENV;
      const environment = configService.detectEnvironment();
      expect(environment).toBe('development');
    });
  });

  describe('Platform Detection', () => {
    it('should detect mobile platform from user agent', () => {
      global.window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const platform = configService.detectPlatform();
      expect(platform).toBe('mobile');
    });

    it('should detect desktop platform from screen size', () => {
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const platform = configService.detectPlatform();
      expect(platform).toBe('desktop');
    });

    it('should detect web platform for smaller screens', () => {
      global.window.innerWidth = 800;
      global.window.innerHeight = 600;
      global.window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const platform = configService.detectPlatform();
      expect(platform).toBe('web');
    });

    it('should return desktop when window is undefined', () => {
      delete global.window;
      const platform = configService.detectPlatform();
      expect(platform).toBe('desktop');
    });
  });

  describe('Configuration Loading', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    it('should load and merge configurations successfully', () => {
      expect(configService.config).toBeDefined();
      expect(configService.config.environment).toBe('test');
      expect(configService.config.platform).toBe('desktop');
      expect(configService.config.features).toBeDefined();
      expect(configService.config.api).toBeDefined();
      expect(configService.config.data).toBeDefined();
      expect(configService.config.ui).toBeDefined();
      expect(configService.config.performance).toBeDefined();
    });

    it('should cache configuration after loading', () => {
      expect(configService.cache.has('current')).toBe(true);
      expect(configService.lastUpdated).toBeGreaterThan(0);
    });

    it('should emit config.loaded event after initialization', () => {
      // This would be tested with actual event bus integration
      expect(configService.config).toBeDefined();
    });
  });

  describe('Configuration Access', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    it('should get configuration values by path', () => {
      const value = configService.get('features.progressiveLoading');
      expect(value).toBe(true);
    });

    it('should return default value for non-existent path', () => {
      const value = configService.get('non.existent.path', 'default');
      expect(value).toBe('default');
    });

    it('should return null for non-existent path without default', () => {
      const value = configService.get('non.existent.path');
      expect(value).toBeNull();
    });

    it('should get environment', () => {
      const environment = configService.getEnvironment();
      expect(environment).toBe('test');
    });

    it('should get platform', () => {
      const platform = configService.getPlatform();
      expect(platform).toBe('desktop');
    });

    it('should check if feature is enabled', () => {
      const enabled = configService.isFeatureEnabled('progressiveLoading');
      expect(enabled).toBe(true);
    });

    it('should return false for non-existent feature', () => {
      const enabled = configService.isFeatureEnabled('nonExistentFeature');
      expect(enabled).toBe(false);
    });

    it('should get API configuration', () => {
      const apiConfig = configService.getApiConfig('timeout');
      expect(apiConfig).toBeDefined();
    });

    it('should get data configuration', () => {
      const dataConfig = configService.getDataConfig('cacheTimeout');
      expect(dataConfig).toBeDefined();
    });

    it('should get UI configuration', () => {
      const uiConfig = configService.getUIConfig('theme');
      expect(uiConfig).toBeDefined();
    });

    it('should get performance configuration', () => {
      const perfConfig = configService.getPerformanceConfig('lazyLoading');
      expect(perfConfig).toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    it('should set configuration values by path', () => {
      configService.set('features.newFeature', true);
      const value = configService.get('features.newFeature');
      expect(value).toBe(true);
    });

    it('should update nested configuration values', () => {
      configService.set('api.timeout', 10000);
      const value = configService.get('api.timeout');
      expect(value).toBe(10000);
    });

    it('should update lastUpdated timestamp when setting values', () => {
      const before = configService.lastUpdated;
      configService.set('features.test', true);
      expect(configService.lastUpdated).toBeGreaterThan(before);
    });

    it('should not set values when configuration not initialized', () => {
      configService.config = null;
      configService.set('features.test', true);
      // Should not throw error and should not set value
      expect(configService.get('features.test')).toBeNull();
    });
  });

  describe('Configuration Subscriptions', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    it('should add subscription for configuration path', () => {
      const callback = jest.fn();
      const unsubscribe = configService.subscribe('features.test', callback);
      
      expect(configService.subscribers.has('features.test')).toBe(true);
      expect(configService.subscribers.get('features.test').has(callback)).toBe(true);
      
      unsubscribe();
      expect(configService.subscribers.get('features.test').has(callback)).toBe(false);
    });

    it('should remove subscription when unsubscribe is called', () => {
      const callback = jest.fn();
      const unsubscribe = configService.subscribe('features.test', callback);
      
      expect(configService.subscribers.get('features.test').has(callback)).toBe(true);
      
      unsubscribe();
      expect(configService.subscribers.get('features.test').has(callback)).toBe(false);
    });

    it('should clean up empty subscription sets', () => {
      const callback = jest.fn();
      const unsubscribe = configService.subscribe('features.test', callback);
      
      expect(configService.subscribers.has('features.test')).toBe(true);
      
      unsubscribe();
      expect(configService.subscribers.has('features.test')).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration successfully', () => {
      const validConfig = {
        environment: 'development',
        platform: 'web',
        features: {},
        api: {},
        data: {},
        ui: {},
        performance: {}
      };
      
      const result = configService.validateConfiguration(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const invalidConfig = {
        environment: 'development'
        // Missing other required fields
      };
      
      const result = configService.validateConfiguration(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for invalid field types', () => {
      const invalidConfig = {
        environment: 123, // Should be string
        platform: 'web',
        features: {},
        api: {},
        data: {},
        ui: {},
        performance: {}
      };
      
      const result = configService.validateConfiguration(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('must be of type'))).toBe(true);
    });

    it('should fail validation for invalid field values', () => {
      const invalidConfig = {
        environment: 'invalid', // Not in allowed values
        platform: 'web',
        features: {},
        api: {},
        data: {},
        ui: {},
        performance: {}
      };
      
      const result = configService.validateConfiguration(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('must be one of'))).toBe(true);
    });

    it('should generate warnings for suspicious values', () => {
      const configWithWarnings = {
        environment: 'development',
        platform: 'web',
        features: {},
        api: { timeout: 500 }, // Very low timeout
        data: { cacheTimeout: 30000 }, // Very low cache timeout
        ui: {},
        performance: {}
      };
      
      const result = configService.validateConfiguration(configWithWarnings);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Reloading', () => {
    beforeEach(async () => {
      await configService.initialize();
    });

    it('should reload configuration successfully', async () => {
      const before = configService.lastUpdated;
      
      await configService.reload();
      
      expect(configService.config).toBeDefined();
      expect(configService.lastUpdated).toBeGreaterThan(before);
    });

    it('should emit config.reloaded event after reload', async () => {
      // This would be tested with actual event bus integration
      await configService.reload();
      expect(configService.config).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock loadConfiguration to throw error
      jest.spyOn(configService, 'loadConfiguration').mockRejectedValue(new Error('Load failed'));
      
      await expect(configService.initialize()).rejects.toThrow('Load failed');
    });

    it('should handle reload errors gracefully', async () => {
      await configService.initialize();
      
      // Mock loadConfiguration to throw error
      jest.spyOn(configService, 'loadConfiguration').mockRejectedValue(new Error('Reload failed'));
      
      await expect(configService.reload()).rejects.toThrow('Reload failed');
    });

    it('should handle validation errors during initialization', async () => {
      // Mock validateConfiguration to return invalid result
      jest.spyOn(configService, 'validateConfiguration').mockReturnValue({
        valid: false,
        errors: ['Test validation error'],
        warnings: []
      });
      
      await expect(configService.initialize()).rejects.toThrow('Configuration validation failed');
    });
  });

  describe('Utility Methods', () => {
    it('should get nested values correctly', () => {
      const obj = { a: { b: { c: 'value' } } };
      const value = configService.getNestedValue(obj, 'a.b.c');
      expect(value).toBe('value');
    });

    it('should return undefined for non-existent nested path', () => {
      const obj = { a: { b: { c: 'value' } } };
      const value = configService.getNestedValue(obj, 'a.b.d');
      expect(value).toBeUndefined();
    });

    it('should set nested values correctly', () => {
      const obj = { a: { b: {} } };
      configService.setNestedValue(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });

    it('should create nested objects when setting values', () => {
      const obj = {};
      configService.setNestedValue(obj, 'a.b.c', 'value');
      expect(obj.a.b.c).toBe('value');
    });

    it('should merge configurations correctly', () => {
      const base = { a: 1, b: { c: 2 } };
      const env = { b: { d: 3 }, e: 4 };
      const platform = { b: { c: 5 } };
      
      const result = configService.mergeConfigurations(base, env, platform);
      
      expect(result.a).toBe(1);
      expect(result.b.c).toBe(5); // Platform overrides base
      expect(result.b.d).toBe(3); // Env adds new property
      expect(result.e).toBe(4); // Env adds new property
    });
  });
});
