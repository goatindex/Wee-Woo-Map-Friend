/**
 * @module modules/FallbackStrategy
 * Fallback Strategy Implementation
 * 
 * This module provides a standalone fallback strategy implementation that can be used
 * to provide alternative operations when primary operations fail.
 * 
 * Key Features:
 * - Multiple fallback levels
 * - Configurable fallback conditions
 * - Fallback data management
 * - Performance monitoring
 * - No dependencies on other error modules (standalone)
 */

/**
 * Fallback condition types
 */
export const FALLBACK_CONDITIONS = {
  ALWAYS: 'always',
  ON_ERROR: 'on_error',
  ON_TIMEOUT: 'on_timeout',
  ON_NETWORK_ERROR: 'on_network_error',
  ON_DATA_ERROR: 'on_data_error',
  CUSTOM: 'custom'
};

/**
 * Fallback data types
 */
export const FALLBACK_DATA_TYPES = {
  STATIC: 'static',
  CACHED: 'cached',
  DEFAULT: 'default',
  COMPUTED: 'computed',
  EXTERNAL: 'external'
};

/**
 * Default fallback configuration
 */
export const DEFAULT_CONFIG = {
  fallbackCondition: FALLBACK_CONDITIONS.ON_ERROR,
  enableMetrics: true,
  cacheFallbackData: true,
  fallbackDataTTL: 300000, // 5 minutes
  maxFallbackLevels: 3
};

/**
 * Fallback Strategy Class
 * 
 * Implements fallback logic with configurable fallback levels
 * and fallback conditions.
 */
export class FallbackStrategy {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Fallback levels
    this.fallbackLevels = [];
    this.currentLevel = 0;
    
    // Fallback data cache
    this.fallbackDataCache = new Map();
    
    // Metrics
    this.metrics = {
      totalAttempts: 0,
      primarySuccesses: 0,
      fallbackSuccesses: 0,
      totalFailures: 0,
      fallbackLevelsUsed: new Map(),
      averageFallbackTime: 0,
      fallbackTimes: []
    };
    
    // Callbacks
    this.onFallback = null;
    this.onFallbackSuccess = null;
    this.onFallbackFailure = null;
    this.onAllFallbacksExhausted = null;
    
    // Bind methods
    this.execute = this.execute.bind(this);
    this.addFallbackLevel = this.addFallbackLevel.bind(this);
    this.shouldUseFallback = this.shouldUseFallback.bind(this);
  }

  /**
   * Add a fallback level
   * @param {Object} fallbackLevel - Fallback level configuration
   */
  addFallbackLevel(fallbackLevel) {
    const level = {
      id: fallbackLevel.id || `level_${this.fallbackLevels.length + 1}`,
      name: fallbackLevel.name || `Fallback Level ${this.fallbackLevels.length + 1}`,
      operation: fallbackLevel.operation,
      data: fallbackLevel.data,
      dataType: fallbackLevel.dataType || FALLBACK_DATA_TYPES.STATIC,
      condition: fallbackLevel.condition || this.config.fallbackCondition,
      priority: fallbackLevel.priority || this.fallbackLevels.length + 1,
      enabled: fallbackLevel.enabled !== false,
      ...fallbackLevel
    };
    
    this.fallbackLevels.push(level);
    
    // Sort by priority
    this.fallbackLevels.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute operation with fallback logic
   * @param {Function} primaryOperation - Primary operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(primaryOperation, options = {}) {
    const startTime = performance.now();
    this.currentLevel = 0;
    
    try {
      // Try primary operation first
      const result = await primaryOperation();
      
      // Record primary success
      const duration = performance.now() - startTime;
      this.recordPrimarySuccess(duration);
      
      return result;
      
    } catch (error) {
      // Check if we should use fallback
      if (this.shouldUseFallback(error, options)) {
        return await this.executeFallback(error, startTime, options);
      } else {
        // Record failure
        const duration = performance.now() - startTime;
        this.recordFailure(duration);
        throw error;
      }
    }
  }

  /**
   * Execute fallback logic
   * @param {Error} error - The error that occurred
   * @param {number} startTime - Start time of operation
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Fallback result
   * @private
   */
  async executeFallback(error, startTime, options = {}) {
    const enabledLevels = this.fallbackLevels.filter(level => level.enabled);
    
    for (let i = 0; i < enabledLevels.length; i++) {
      const level = enabledLevels[i];
      this.currentLevel = i + 1;
      
      try {
        // Check if fallback level condition is met
        if (this.checkFallbackCondition(level, error, options)) {
          // Execute fallback operation
          const result = await this.executeFallbackLevel(level, error, options);
          
          // Record fallback success
          const duration = performance.now() - startTime;
          this.recordFallbackSuccess(level, duration);
          
          // Call fallback success callback
          if (this.onFallbackSuccess) {
            this.onFallbackSuccess(result, level, duration);
          }
          
          return result;
        }
      } catch (fallbackError) {
        // Record fallback failure
        const duration = performance.now() - startTime;
        this.recordFallbackFailure(level, fallbackError, duration);
        
        // Call fallback callback
        if (this.onFallback) {
          this.onFallback(fallbackError, level, duration);
        }
        
        // Continue to next fallback level
        continue;
      }
    }
    
    // All fallbacks exhausted
    const duration = performance.now() - startTime;
    this.recordFailure(duration);
    
    // Call all fallbacks exhausted callback
    if (this.onAllFallbacksExhausted) {
      this.onAllFallbacksExhausted(error, duration);
    }
    
    throw error;
  }

  /**
   * Execute a specific fallback level
   * @param {Object} level - Fallback level configuration
   * @param {Error} error - The error that occurred
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Fallback result
   * @private
   */
  async executeFallbackLevel(level, error, options = {}) {
    // Check cache first if data type is cached
    if (level.dataType === FALLBACK_DATA_TYPES.CACHED) {
      const cachedData = this.getCachedFallbackData(level.id);
      if (cachedData) {
        return cachedData;
      }
    }
    
    let result;
    
    if (level.operation && typeof level.operation === 'function') {
      // Execute fallback operation
      result = await level.operation(error, options);
    } else if (level.data !== undefined) {
      // Use fallback data
      result = level.data;
    } else {
      throw new Error(`No fallback operation or data provided for level: ${level.id}`);
    }
    
    // Cache result if configured
    if (this.config.cacheFallbackData && level.dataType === FALLBACK_DATA_TYPES.CACHED) {
      this.cacheFallbackData(level.id, result);
    }
    
    return result;
  }

  /**
   * Check if fallback condition is met
   * @param {Object} level - Fallback level configuration
   * @param {Error} error - The error that occurred
   * @param {Object} options - Execution options
   * @returns {boolean} True if condition is met
   * @private
   */
  checkFallbackCondition(level, error, options = {}) {
    const condition = level.condition || this.config.fallbackCondition;
    
    switch (condition) {
      case FALLBACK_CONDITIONS.ALWAYS:
        return true;
        
      case FALLBACK_CONDITIONS.ON_ERROR:
        return true;
        
      case FALLBACK_CONDITIONS.ON_TIMEOUT:
        return error.name === 'TimeoutError' || error.message.includes('timeout');
        
      case FALLBACK_CONDITIONS.ON_NETWORK_ERROR:
        return error.name === 'NetworkError' || 
               error.message.includes('network') || 
               error.message.includes('fetch');
        
      case FALLBACK_CONDITIONS.ON_DATA_ERROR:
        return error.name === 'DataError' || 
               error.message.includes('data') || 
               error.message.includes('parse');
        
      case FALLBACK_CONDITIONS.CUSTOM:
        if (level.customCondition && typeof level.customCondition === 'function') {
          return level.customCondition(error, options);
        }
        return false;
        
      default:
        return true;
    }
  }

  /**
   * Check if we should use fallback
   * @param {Error} error - The error that occurred
   * @param {Object} options - Execution options
   * @returns {boolean} True if should use fallback
   */
  shouldUseFallback(error, options = {}) {
    const fallbackCondition = options.fallbackCondition || this.config.fallbackCondition;
    
    switch (fallbackCondition) {
      case FALLBACK_CONDITIONS.ALWAYS:
        return true;
        
      case FALLBACK_CONDITIONS.ON_ERROR:
        return true;
        
      case FALLBACK_CONDITIONS.ON_TIMEOUT:
        return error.name === 'TimeoutError' || error.message.includes('timeout');
        
      case FALLBACK_CONDITIONS.ON_NETWORK_ERROR:
        return error.name === 'NetworkError' || 
               error.message.includes('network') || 
               error.message.includes('fetch');
        
      case FALLBACK_CONDITIONS.ON_DATA_ERROR:
        return error.name === 'DataError' || 
               error.message.includes('data') || 
               error.message.includes('parse');
        
      case FALLBACK_CONDITIONS.CUSTOM:
        if (options.customFallbackCondition && typeof options.customFallbackCondition === 'function') {
          return options.customFallbackCondition(error, options);
        }
        return false;
        
      default:
        return true;
    }
  }

  /**
   * Cache fallback data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @private
   */
  cacheFallbackData(key, data) {
    this.fallbackDataCache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: this.config.fallbackDataTTL
    });
  }

  /**
   * Get cached fallback data
   * @param {string} key - Cache key
   * @returns {any} Cached data or null
   * @private
   */
  getCachedFallbackData(key) {
    const cached = this.fallbackDataCache.get(key);
    if (cached) {
      // Check if cache is still valid
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      } else {
        // Remove expired cache
        this.fallbackDataCache.delete(key);
      }
    }
    return null;
  }

  /**
   * Record primary success
   * @param {number} duration - Operation duration
   * @private
   */
  recordPrimarySuccess(duration) {
    this.metrics.totalAttempts++;
    this.metrics.primarySuccesses++;
  }

  /**
   * Record fallback success
   * @param {Object} level - Fallback level
   * @param {number} duration - Operation duration
   * @private
   */
  recordFallbackSuccess(level, duration) {
    this.metrics.totalAttempts++;
    this.metrics.fallbackSuccesses++;
    
    // Record fallback level usage
    const levelCount = this.metrics.fallbackLevelsUsed.get(level.id) || 0;
    this.metrics.fallbackLevelsUsed.set(level.id, levelCount + 1);
    
    // Record fallback time
    this.metrics.fallbackTimes.push(duration);
    
    // Keep only last 100 fallback times
    if (this.metrics.fallbackTimes.length > 100) {
      this.metrics.fallbackTimes.shift();
    }
    
    // Update average fallback time
    this.updateAverageFallbackTime();
  }

  /**
   * Record fallback failure
   * @param {Object} level - Fallback level
   * @param {Error} error - The error that occurred
   * @param {number} duration - Operation duration
   * @private
   */
  recordFallbackFailure(level, error, duration) {
    // Record fallback time even for failures
    this.metrics.fallbackTimes.push(duration);
    
    // Keep only last 100 fallback times
    if (this.metrics.fallbackTimes.length > 100) {
      this.metrics.fallbackTimes.shift();
    }
    
    // Update average fallback time
    this.updateAverageFallbackTime();
  }

  /**
   * Record total failure
   * @param {number} duration - Operation duration
   * @private
   */
  recordFailure(duration) {
    this.metrics.totalAttempts++;
    this.metrics.totalFailures++;
  }

  /**
   * Update average fallback time
   * @private
   */
  updateAverageFallbackTime() {
    if (this.metrics.fallbackTimes.length > 0) {
      const sum = this.metrics.fallbackTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageFallbackTime = sum / this.metrics.fallbackTimes.length;
    }
  }

  /**
   * Clear fallback data cache
   */
  clearCache() {
    this.fallbackDataCache.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalAttempts: 0,
      primarySuccesses: 0,
      fallbackSuccesses: 0,
      totalFailures: 0,
      fallbackLevelsUsed: new Map(),
      averageFallbackTime: 0,
      fallbackTimes: []
    };
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalAttempts > 0 
      ? ((this.metrics.primarySuccesses + this.metrics.fallbackSuccesses) / this.metrics.totalAttempts) * 100 
      : 0;
    
    const fallbackRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.fallbackSuccesses / this.metrics.totalAttempts) * 100 
      : 0;
    
    return {
      ...this.metrics,
      successRate: successRate,
      fallbackRate: fallbackRate,
      fallbackLevelsUsed: Object.fromEntries(this.metrics.fallbackLevelsUsed),
      currentLevel: this.currentLevel,
      totalLevels: this.fallbackLevels.length
    };
  }

  /**
   * Set fallback callback
   * @param {Function} callback - Callback function
   */
  setOnFallback(callback) {
    this.onFallback = callback;
  }

  /**
   * Set fallback success callback
   * @param {Function} callback - Callback function
   */
  setOnFallbackSuccess(callback) {
    this.onFallbackSuccess = callback;
  }

  /**
   * Set fallback failure callback
   * @param {Function} callback - Callback function
   */
  setOnFallbackFailure(callback) {
    this.onFallbackFailure = callback;
  }

  /**
   * Set all fallbacks exhausted callback
   * @param {Function} callback - Callback function
   */
  setOnAllFallbacksExhausted(callback) {
    this.onAllFallbacksExhausted = callback;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get fallback levels
   * @returns {Array} Fallback levels
   */
  getFallbackLevels() {
    return [...this.fallbackLevels];
  }

  /**
   * Remove fallback level
   * @param {string} id - Fallback level ID
   */
  removeFallbackLevel(id) {
    this.fallbackLevels = this.fallbackLevels.filter(level => level.id !== id);
  }

  /**
   * Clear all fallback levels
   */
  clearFallbackLevels() {
    this.fallbackLevels = [];
  }
}

/**
 * Fallback Manager Class
 * 
 * Manages multiple fallback strategies for different operations
 */
export class FallbackManager {
  constructor() {
    this.fallbackStrategies = new Map();
    this.defaultConfig = { ...DEFAULT_CONFIG };
  }

  /**
   * Get or create a fallback strategy for a key
   * @param {string} key - Fallback strategy key
   * @param {Object} config - Configuration options
   * @returns {FallbackStrategy} Fallback strategy instance
   */
  getFallbackStrategy(key, config = {}) {
    if (!this.fallbackStrategies.has(key)) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const fallbackStrategy = new FallbackStrategy(mergedConfig);
      this.fallbackStrategies.set(key, fallbackStrategy);
    }
    return this.fallbackStrategies.get(key);
  }

  /**
   * Execute operation with fallback logic
   * @param {string} key - Fallback strategy key
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(key, operation, options = {}) {
    const fallbackStrategy = this.getFallbackStrategy(key, options.config);
    return fallbackStrategy.execute(operation, { ...options, key });
  }

  /**
   * Get all fallback strategy metrics
   * @returns {Object} All fallback strategy metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [key, fallbackStrategy] of this.fallbackStrategies) {
      metrics[key] = fallbackStrategy.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all fallback strategies
   */
  resetAll() {
    for (const fallbackStrategy of this.fallbackStrategies.values()) {
      fallbackStrategy.resetMetrics();
    }
  }

  /**
   * Reset specific fallback strategy
   * @param {string} key - Fallback strategy key
   */
  reset(key) {
    const fallbackStrategy = this.fallbackStrategies.get(key);
    if (fallbackStrategy) {
      fallbackStrategy.resetMetrics();
    }
  }

  /**
   * Remove fallback strategy
   * @param {string} key - Fallback strategy key
   */
  remove(key) {
    this.fallbackStrategies.delete(key);
  }

  /**
   * Clear all fallback strategies
   */
  clear() {
    this.fallbackStrategies.clear();
  }

  /**
   * Update default configuration
   * @param {Object} config - New default configuration
   */
  updateDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get overall fallback statistics
   * @returns {Object} Overall fallback statistics
   */
  getOverallStatistics() {
    const strategies = Array.from(this.fallbackStrategies.values());
    const totalAttempts = strategies.reduce((sum, strategy) => sum + strategy.metrics.totalAttempts, 0);
    const totalSuccesses = strategies.reduce((sum, strategy) => sum + strategy.metrics.primarySuccesses + strategy.metrics.fallbackSuccesses, 0);
    const totalFallbacks = strategies.reduce((sum, strategy) => sum + strategy.metrics.fallbackSuccesses, 0);
    
    return {
      totalStrategies: strategies.length,
      totalAttempts: totalAttempts,
      totalSuccesses: totalSuccesses,
      totalFallbacks: totalFallbacks,
      overallSuccessRate: totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0,
      overallFallbackRate: totalAttempts > 0 ? (totalFallbacks / totalAttempts) * 100 : 0
    };
  }
}

/**
 * Create a singleton fallback manager
 * @returns {FallbackManager} Singleton instance
 */
export function createFallbackManager() {
  if (!window.fallbackManager) {
    window.fallbackManager = new FallbackManager();
  }
  return window.fallbackManager;
}

/**
 * Get the singleton fallback manager
 * @returns {FallbackManager} Singleton instance
 */
export function getFallbackManager() {
  if (!window.fallbackManager) {
    window.fallbackManager = new FallbackManager();
  }
  return window.fallbackManager;
}

// Export default
export default FallbackStrategy;
