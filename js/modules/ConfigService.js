import { logger } from './StructuredLogger.js';
import { enhancedEventBus as globalEventBus } from './EnhancedEventBus.js';

/**
 * @typedef {Object} EnvironmentConfig
 * @property {string} environment - The current environment (development, staging, production)
 * @property {string} platform - The current platform (web, mobile, desktop)
 * @property {Object} features - Feature flags for the environment
 * @property {Object} api - API configuration for the environment
 * @property {Object} data - Data source configuration
 * @property {Object} ui - UI configuration for the environment
 * @property {Object} performance - Performance settings for the environment
 */

/**
 * @typedef {Object} ConfigValidationResult
 * @property {boolean} valid - Whether the configuration is valid
 * @property {string[]} errors - Array of validation errors
 * @property {string[]} warnings - Array of validation warnings
 */

/**
 * @class ConfigService
 * Centralized configuration management with environment detection,
 * dynamic loading, validation, and event-driven updates.
 */
export class ConfigService {
  constructor() {
    this.logger = logger.createChild({ module: 'ConfigService' });
    this.config = null;
    this.validationRules = new Map();
    this.subscribers = new Map();
    this.cache = new Map();
    this.lastUpdated = null;
    
    this.logger.info('ConfigService initialized');
    this.setupValidationRules();
    this.setupEventHandlers();
  }

  /**
   * Initialize the configuration service by loading environment-specific config
   * @returns {Promise<EnvironmentConfig>} The loaded configuration
   */
  async initialize() {
    const timer = this.logger.time('config-initialization');
    
    try {
      this.logger.info('Initializing configuration service');
      
      // Detect environment and platform
      const environment = this.detectEnvironment();
      const platform = this.detectPlatform();
      
      this.logger.debug('Environment detection', { environment, platform });
      
      // Load configuration
      this.config = await this.loadConfiguration(environment, platform);
      
      // Validate configuration
      const validation = this.validateConfiguration(this.config);
      if (!validation.valid) {
        this.logger.error('Configuration validation failed', { errors: validation.errors });
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        this.logger.warn('Configuration validation warnings', { warnings: validation.warnings });
      }
      
      // Cache configuration
      this.cache.set('current', this.config);
      this.lastUpdated = Date.now();
      
      // Emit configuration loaded event
      globalEventBus.emit('config.loaded', {
        environment,
        platform,
        config: this.config,
        timestamp: this.lastUpdated
      });
      
      timer.end({ 
        environment, 
        platform, 
        configSize: Object.keys(this.config).length,
        validationWarnings: validation.warnings.length
      });
      
      this.logger.info('Configuration service initialized successfully', { environment, platform });
      return this.config;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to initialize configuration service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a configuration value by path
   * @param {string} path - Dot-notation path to the configuration value
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} The configuration value or default
   */
  get(path, defaultValue = null) {
    if (!this.config) {
      this.logger.warn('Configuration not initialized, returning default value', { path, defaultValue });
      return defaultValue;
    }
    
    const value = this.getNestedValue(this.config, path);
    
    if (value === undefined) {
      this.logger.debug('Configuration path not found, returning default', { path, defaultValue });
      return defaultValue;
    }
    
    this.logger.debug('Configuration value retrieved', { path, value });
    return value;
  }

  /**
   * Set a configuration value by path
   * @param {string} path - Dot-notation path to set
   * @param {*} value - Value to set
   * @param {boolean} emitEvent - Whether to emit configuration changed event
   */
  set(path, value, emitEvent = true) {
    if (!this.config) {
      this.logger.warn('Configuration not initialized, cannot set value', { path, value });
      return;
    }
    
    this.setNestedValue(this.config, path, value);
    this.lastUpdated = Date.now();
    
    this.logger.info('Configuration value set', { path, value });
    
    if (emitEvent) {
      globalEventBus.emit('config.changed', {
        path,
        value,
        timestamp: this.lastUpdated
      });
    }
  }

  /**
   * Subscribe to configuration changes
   * @param {string} path - Path to watch for changes
   * @param {Function} callback - Callback function to call when path changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path).add(callback);
    
    this.logger.debug('Configuration subscription added', { path, subscriberCount: this.subscribers.get(path).size });
    
    return () => {
      const subscribers = this.subscribers.get(path);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(path);
        }
      }
      this.logger.debug('Configuration subscription removed', { path });
    };
  }

  /**
   * Get the current environment
   * @returns {string} The current environment
   */
  getEnvironment() {
    return this.config?.environment || 'development';
  }

  /**
   * Get the current platform
   * @returns {string} The current platform
   */
  getPlatform() {
    return this.config?.platform || 'web';
  }

  /**
   * Check if a feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * Get API configuration
   * @param {string} service - Service name
   * @returns {Object} API configuration for the service
   */
  getApiConfig(service) {
    return this.get(`api.${service}`, {});
  }

  /**
   * Get data source configuration
   * @param {string} source - Data source name
   * @returns {Object} Data source configuration
   */
  getDataConfig(source) {
    return this.get(`data.${source}`, {});
  }

  /**
   * Get UI configuration
   * @param {string} component - Component name
   * @returns {Object} UI configuration for the component
   */
  getUIConfig(component) {
    return this.get(`ui.${component}`, {});
  }

  /**
   * Get performance configuration
   * @param {string} metric - Performance metric name
   * @returns {*} Performance configuration value
   */
  getPerformanceConfig(metric) {
    return this.get(`performance.${metric}`, null);
  }

  /**
   * Reload configuration from source
   * @returns {Promise<EnvironmentConfig>} The reloaded configuration
   */
  async reload() {
    this.logger.info('Reloading configuration');
    
    try {
      const environment = this.detectEnvironment();
      const platform = this.detectPlatform();
      
      const newConfig = await this.loadConfiguration(environment, platform);
      const validation = this.validateConfiguration(newConfig);
      
      if (!validation.valid) {
        this.logger.error('Configuration reload validation failed', { errors: validation.errors });
        throw new Error(`Configuration reload validation failed: ${validation.errors.join(', ')}`);
      }
      
      this.config = newConfig;
      this.cache.set('current', this.config);
      this.lastUpdated = Date.now();
      
      // Notify subscribers
      this.notifySubscribers();
      
      globalEventBus.emit('config.reloaded', {
        environment,
        platform,
        config: this.config,
        timestamp: this.lastUpdated
      });
      
      this.logger.info('Configuration reloaded successfully');
      return this.config;
      
    } catch (error) {
      this.logger.error('Failed to reload configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect the current environment
   * @private
   * @returns {string} The detected environment
   */
  detectEnvironment() {
    // Check for explicit environment variable
    if (typeof process !== 'undefined' && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    
    // Check for hostname patterns
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      
      if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
      }
      
      if (hostname.includes('github.io') || hostname.includes('production')) {
        return 'production';
      }
    }
    
    // Default to development
    return 'development';
  }

  /**
   * Detect the current platform
   * @private
   * @returns {string} The detected platform
   */
  detectPlatform() {
    if (typeof window === 'undefined') {
      return 'desktop';
    }
    
    // Check for mobile indicators
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (isMobile) {
      return 'mobile';
    }
    
    // Check for desktop indicators
    const isDesktop = window.innerWidth >= 1024 && window.innerHeight >= 768;
    
    if (isDesktop) {
      return 'desktop';
    }
    
    return 'web';
  }

  /**
   * Load configuration for environment and platform
   * @private
   * @param {string} environment - Environment name
   * @param {string} platform - Platform name
   * @returns {Promise<EnvironmentConfig>} The loaded configuration
   */
  async loadConfiguration(environment, platform) {
    const timer = this.logger.time('config-loading');
    
    try {
      // Load base configuration
      const baseConfig = await this.loadBaseConfiguration();
      
      // Load environment-specific configuration
      const envConfig = await this.loadEnvironmentConfiguration(environment);
      
      // Load platform-specific configuration
      const platformConfig = await this.loadPlatformConfiguration(platform);
      
      // Merge configurations (platform overrides environment, environment overrides base)
      const config = this.mergeConfigurations(baseConfig, envConfig, platformConfig);
      
      // Add runtime information
      config.environment = environment;
      config.platform = platform;
      config.loadedAt = Date.now();
      
      timer.end({ 
        environment, 
        platform, 
        baseConfigSize: Object.keys(baseConfig).length,
        envConfigSize: Object.keys(envConfig).length,
        platformConfigSize: Object.keys(platformConfig).length
      });
      
      return config;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      throw error;
    }
  }

  /**
   * Load base configuration
   * @private
   * @returns {Promise<Object>} Base configuration
   */
  async loadBaseConfiguration() {
    return {
      features: {
        progressiveLoading: true,
        errorRecovery: true,
        performanceMonitoring: true,
        accessibility: true,
        offlineSupport: true
      },
      api: {
        timeout: 5000,
        retries: 3,
        retryDelay: 1000
      },
      data: {
        cacheTimeout: 300000, // 5 minutes
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        validation: true
      },
      ui: {
        theme: 'light',
        language: 'en',
        animations: true,
        responsive: true
      },
      performance: {
        lazyLoading: true,
        virtualization: true,
        debounceDelay: 300
      }
    };
  }

  /**
   * Load environment-specific configuration
   * @private
   * @param {string} environment - Environment name
   * @returns {Promise<Object>} Environment-specific configuration
   */
  async loadEnvironmentConfiguration(environment) {
    const configs = {
      development: {
        features: {
          debugMode: true,
          verboseLogging: true,
          hotReload: true
        },
        api: {
          baseUrl: 'http://localhost:3000',
          timeout: 10000
        },
        data: {
          cacheTimeout: 60000, // 1 minute
          validation: true
        },
        ui: {
          debugOverlay: true
        },
        performance: {
          profiling: true
        }
      },
      staging: {
        features: {
          debugMode: false,
          verboseLogging: true,
          hotReload: false
        },
        api: {
          baseUrl: 'https://staging-api.example.com',
          timeout: 8000
        },
        data: {
          cacheTimeout: 180000, // 3 minutes
          validation: true
        },
        performance: {
          profiling: false
        }
      },
      production: {
        features: {
          debugMode: false,
          verboseLogging: false,
          hotReload: false
        },
        api: {
          baseUrl: 'https://api.example.com',
          timeout: 5000
        },
        data: {
          cacheTimeout: 300000, // 5 minutes
          validation: true
        },
        performance: {
          profiling: false,
          minification: true
        }
      }
    };
    
    return configs[environment] || {};
  }

  /**
   * Load platform-specific configuration
   * @private
   * @param {string} platform - Platform name
   * @returns {Promise<Object>} Platform-specific configuration
   */
  async loadPlatformConfiguration(platform) {
    const configs = {
      web: {
        features: {
          serviceWorker: true,
          pushNotifications: false
        },
        ui: {
          responsive: true,
          touchSupport: false
        },
        performance: {
          bundleSplitting: true
        }
      },
      mobile: {
        features: {
          serviceWorker: true,
          pushNotifications: true,
          nativeFeatures: true
        },
        ui: {
          responsive: true,
          touchSupport: true,
          nativeUI: true
        },
        performance: {
          bundleSplitting: false,
          lazyLoading: true
        }
      },
      desktop: {
        features: {
          serviceWorker: false,
          pushNotifications: false,
          nativeFeatures: false
        },
        ui: {
          responsive: false,
          touchSupport: false
        },
        performance: {
          bundleSplitting: true,
          lazyLoading: false
        }
      }
    };
    
    return configs[platform] || {};
  }

  /**
   * Merge multiple configuration objects
   * @private
   * @param {...Object} configs - Configuration objects to merge
   * @returns {Object} Merged configuration
   */
  mergeConfigurations(...configs) {
    const result = {};
    
    for (const config of configs) {
      this.deepMerge(result, config);
    }
    
    return result;
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
            target[key] = {};
          }
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   * @private
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot notation path
   * @returns {*} The value at the path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object using dot notation
   * @private
   * @param {Object} obj - Object to set value in
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Setup validation rules for configuration
   * @private
   */
  setupValidationRules() {
    this.validationRules.set('environment', {
      required: true,
      type: 'string',
      values: ['development', 'staging', 'production']
    });
    
    this.validationRules.set('platform', {
      required: true,
      type: 'string',
      values: ['web', 'mobile', 'desktop']
    });
    
    this.validationRules.set('features', {
      required: true,
      type: 'object'
    });
    
    this.validationRules.set('api', {
      required: true,
      type: 'object'
    });
    
    this.validationRules.set('data', {
      required: true,
      type: 'object'
    });
    
    this.validationRules.set('ui', {
      required: true,
      type: 'object'
    });
    
    this.validationRules.set('performance', {
      required: true,
      type: 'object'
    });
  }

  /**
   * Validate configuration against rules
   * @private
   * @param {EnvironmentConfig} config - Configuration to validate
   * @returns {ConfigValidationResult} Validation result
   */
  validateConfiguration(config) {
    const errors = [];
    const warnings = [];
    
    for (const [path, rule] of this.validationRules) {
      const value = this.getNestedValue(config, path);
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Required field '${path}' is missing`);
        continue;
      }
      
      // Skip validation if value is undefined and not required
      if (value === undefined) {
        continue;
      }
      
      // Check type
      if (rule.type && typeof value !== rule.type) {
        errors.push(`Field '${path}' must be of type '${rule.type}', got '${typeof value}'`);
        continue;
      }
      
      // Check allowed values
      if (rule.values && !rule.values.includes(value)) {
        errors.push(`Field '${path}' must be one of [${rule.values.join(', ')}], got '${value}'`);
        continue;
      }
    }
    
    // Additional validation
    if (config.api && config.api.timeout && config.api.timeout < 1000) {
      warnings.push('API timeout is very low, this may cause issues');
    }
    
    if (config.data && config.data.cacheTimeout && config.data.cacheTimeout < 60000) {
      warnings.push('Cache timeout is very low, this may impact performance');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Setup event handlers
   * @private
   */
  setupEventHandlers() {
    // Listen for configuration change events
    globalEventBus.on('config.changed', (event) => {
      this.handleConfigurationChange(event.payload);
    });
  }

  /**
   * Handle configuration change events
   * @private
   * @param {Object} payload - Event payload
   */
  handleConfigurationChange(payload) {
    const { path, value } = payload;
    
    // Notify subscribers for this specific path
    const subscribers = this.subscribers.get(path);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(value, path);
        } catch (error) {
          this.logger.error('Error in configuration change callback', { 
            path, 
            error: error.message 
          });
        }
      });
    }
    
    // Notify subscribers for parent paths
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentSubscribers = this.subscribers.get(parentPath);
      if (parentSubscribers) {
        parentSubscribers.forEach(callback => {
          try {
            callback(this.get(parentPath), parentPath);
          } catch (error) {
            this.logger.error('Error in parent configuration change callback', { 
              parentPath, 
              error: error.message 
            });
          }
        });
      }
    }
  }

  /**
   * Notify all subscribers of configuration changes
   * @private
   */
  notifySubscribers() {
    for (const [path, subscribers] of this.subscribers) {
      const value = this.get(path);
      subscribers.forEach(callback => {
        try {
          callback(value, path);
        } catch (error) {
          this.logger.error('Error in configuration notification callback', { 
            path, 
            error: error.message 
          });
        }
      });
    }
  }
}

// Export singleton instance
export const configService = new ConfigService();
