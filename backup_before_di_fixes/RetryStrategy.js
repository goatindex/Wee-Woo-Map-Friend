/**
 * @module modules/RetryStrategy
 * Retry Strategy Implementation
 * 
 * This module provides a standalone retry strategy implementation that can be used
 * to automatically retry failed operations with configurable backoff strategies.
 * 
 * Key Features:
 * - Configurable retry attempts and delays
 * - Multiple backoff strategies (fixed, exponential, linear)
 * - Jitter support to prevent thundering herd
 * - Retry condition evaluation
 * - Performance monitoring
 * - No dependencies on other error modules (standalone)
 */

import { injectable } from 'inversify';

/**
 * Backoff strategies
 */
export const BACKOFF_STRATEGIES = {
  FIXED: 'fixed',
  EXPONENTIAL: 'exponential',
  LINEAR: 'linear',
  CUSTOM: 'custom'
};

/**
 * Retry condition types
 */
export const RETRY_CONDITIONS = {
  ALWAYS: 'always',
  ON_ERROR: 'on_error',
  ON_TIMEOUT: 'on_timeout',
  ON_NETWORK_ERROR: 'on_network_error',
  CUSTOM: 'custom'
};

/**
 * Default retry configuration
 */
export const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffStrategy: BACKOFF_STRATEGIES.EXPONENTIAL,
  backoffMultiplier: 2,
  jitter: true,
  jitterFactor: 0.1,
  retryCondition: RETRY_CONDITIONS.ON_ERROR,
  enableMetrics: true
};

/**
 * Retry Strategy Class
 * 
 * Implements retry logic with configurable backoff strategies
 * and retry conditions.
 */
@injectable()
export class RetryStrategy {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Metrics
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      retryAttempts: 0,
      totalRetryTime: 0,
      averageRetryTime: 0,
      retryTimes: []
    };
    
    // Callbacks
    this.onRetry = null;
    this.onSuccess = null;
    this.onFailure = null;
    this.onMaxRetriesExceeded = null;
    
    // Bind methods
    this.execute = this.execute.bind(this);
    this.shouldRetry = this.shouldRetry.bind(this);
    this.calculateDelay = this.calculateDelay.bind(this);
  }

  /**
   * Execute an operation with retry logic
   * @param {Function} operation - The operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(operation, options = {}) {
    const startTime = performance.now();
    const maxRetries = options.maxRetries || this.config.maxRetries;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // Execute the operation
        const result = await operation();
        
        // Record success
        const duration = performance.now() - startTime;
        this.recordSuccess(attempt, duration);
        
        // Call success callback
        if (this.onSuccess) {
          this.onSuccess(result, attempt, duration);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt <= maxRetries && this.shouldRetry(error, attempt, options)) {
          // Calculate delay
          const delay = this.calculateDelay(attempt, options);
          
          // Record retry attempt
          this.recordRetry(attempt, delay);
          
          // Call retry callback
          if (this.onRetry) {
            this.onRetry(error, attempt, delay);
          }
          
          // Wait before retry
          await this.sleep(delay);
          
        } else {
          // Max retries exceeded or retry condition not met
          const duration = performance.now() - startTime;
          this.recordFailure(attempt, duration);
          
          // Call failure callback
          if (this.onFailure) {
            this.onFailure(error, attempt, duration);
          }
          
          // Call max retries exceeded callback
          if (attempt > maxRetries && this.onMaxRetriesExceeded) {
            this.onMaxRetriesExceeded(error, maxRetries);
          }
          
          throw error;
        }
      }
    }
  }

  /**
   * Check if operation should be retried
   * @param {Error} error - The error that occurred
   * @param {number} attempt - Current attempt number
   * @param {Object} options - Execution options
   * @returns {boolean} True if should retry
   */
  shouldRetry(error, attempt, options = {}) {
    const retryCondition = options.retryCondition || this.config.retryCondition;
    
    switch (retryCondition) {
      case RETRY_CONDITIONS.ALWAYS:
        return true;
        
      case RETRY_CONDITIONS.ON_ERROR:
        return true;
        
      case RETRY_CONDITIONS.ON_TIMEOUT:
        return error.name === 'TimeoutError' || error.message.includes('timeout');
        
      case RETRY_CONDITIONS.ON_NETWORK_ERROR:
        return error.name === 'NetworkError' || 
               error.message.includes('network') || 
               error.message.includes('fetch');
        
      case RETRY_CONDITIONS.CUSTOM:
        if (options.customRetryCondition && typeof options.customRetryCondition === 'function') {
          return options.customRetryCondition(error, attempt);
        }
        return false;
        
      default:
        return true;
    }
  }

  /**
   * Calculate delay for retry attempt
   * @param {number} attempt - Current attempt number (1-based)
   * @param {Object} options - Execution options
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt, options = {}) {
    const initialDelay = options.initialDelay || this.config.initialDelay;
    const maxDelay = options.maxDelay || this.config.maxDelay;
    const backoffStrategy = options.backoffStrategy || this.config.backoffStrategy;
    const backoffMultiplier = options.backoffMultiplier || this.config.backoffMultiplier;
    const jitter = options.jitter !== undefined ? options.jitter : this.config.jitter;
    const jitterFactor = options.jitterFactor || this.config.jitterFactor;
    
    let delay = 0;
    
    switch (backoffStrategy) {
      case BACKOFF_STRATEGIES.FIXED:
        delay = initialDelay;
        break;
        
      case BACKOFF_STRATEGIES.EXPONENTIAL:
        delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
        break;
        
      case BACKOFF_STRATEGIES.LINEAR:
        delay = initialDelay * attempt;
        break;
        
      case BACKOFF_STRATEGIES.CUSTOM:
        if (options.customDelay && typeof options.customDelay === 'function') {
          delay = options.customDelay(attempt);
        } else {
          delay = initialDelay;
        }
        break;
        
      default:
        delay = initialDelay;
    }
    
    // Apply max delay limit
    delay = Math.min(delay, maxDelay);
    
    // Apply jitter if enabled
    if (jitter) {
      const jitterAmount = delay * jitterFactor;
      const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + randomJitter);
    }
    
    return Math.round(delay);
  }

  /**
   * Record successful attempt
   * @param {number} attempt - Attempt number
   * @param {number} duration - Total duration
   * @private
   */
  recordSuccess(attempt, duration) {
    this.metrics.totalAttempts++;
    this.metrics.successfulAttempts++;
    this.metrics.retryTimes.push(duration);
    
    // Keep only last 100 retry times
    if (this.metrics.retryTimes.length > 100) {
      this.metrics.retryTimes.shift();
    }
    
    // Update average retry time
    this.updateAverageRetryTime();
  }

  /**
   * Record retry attempt
   * @param {number} attempt - Attempt number
   * @param {number} delay - Delay before retry
   * @private
   */
  recordRetry(attempt, delay) {
    this.metrics.totalAttempts++;
    this.metrics.retryAttempts++;
    this.metrics.totalRetryTime += delay;
  }

  /**
   * Record failed attempt
   * @param {number} attempt - Attempt number
   * @param {number} duration - Total duration
   * @private
   */
  recordFailure(attempt, duration) {
    this.metrics.totalAttempts++;
    this.metrics.failedAttempts++;
    this.metrics.retryTimes.push(duration);
    
    // Keep only last 100 retry times
    if (this.metrics.retryTimes.length > 100) {
      this.metrics.retryTimes.shift();
    }
    
    // Update average retry time
    this.updateAverageRetryTime();
  }

  /**
   * Update average retry time
   * @private
   */
  updateAverageRetryTime() {
    if (this.metrics.retryTimes.length > 0) {
      const sum = this.metrics.retryTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageRetryTime = sum / this.metrics.retryTimes.length;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      retryAttempts: 0,
      totalRetryTime: 0,
      averageRetryTime: 0,
      retryTimes: []
    };
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.successfulAttempts / this.metrics.totalAttempts) * 100 
      : 0;
    
    const retryRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.retryAttempts / this.metrics.totalAttempts) * 100 
      : 0;
    
    return {
      ...this.metrics,
      successRate: successRate,
      retryRate: retryRate,
      averageDelay: this.metrics.retryAttempts > 0 
        ? this.metrics.totalRetryTime / this.metrics.retryAttempts 
        : 0
    };
  }

  /**
   * Set retry callback
   * @param {Function} callback - Callback function
   */
  setOnRetry(callback) {
    this.onRetry = callback;
  }

  /**
   * Set success callback
   * @param {Function} callback - Callback function
   */
  setOnSuccess(callback) {
    this.onSuccess = callback;
  }

  /**
   * Set failure callback
   * @param {Function} callback - Callback function
   */
  setOnFailure(callback) {
    this.onFailure = callback;
  }

  /**
   * Set max retries exceeded callback
   * @param {Function} callback - Callback function
   */
  setOnMaxRetriesExceeded(callback) {
    this.onMaxRetriesExceeded = callback;
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
}

/**
 * Retry Manager Class
 * 
 * Manages multiple retry strategies for different operations
 */
export class RetryManager {
  constructor() {
    this.retryStrategies = new Map();
    this.defaultConfig = { ...DEFAULT_CONFIG };
  }

  /**
   * Get or create a retry strategy for a key
   * @param {string} key - Retry strategy key
   * @param {Object} config - Configuration options
   * @returns {RetryStrategy} Retry strategy instance
   */
  getRetryStrategy(key, config = {}) {
    if (!this.retryStrategies.has(key)) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const retryStrategy = new RetryStrategy(mergedConfig);
      this.retryStrategies.set(key, retryStrategy);
    }
    return this.retryStrategies.get(key);
  }

  /**
   * Execute operation with retry logic
   * @param {string} key - Retry strategy key
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(key, operation, options = {}) {
    const retryStrategy = this.getRetryStrategy(key, options.config);
    return retryStrategy.execute(operation, { ...options, key });
  }

  /**
   * Get all retry strategy metrics
   * @returns {Object} All retry strategy metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [key, retryStrategy] of this.retryStrategies) {
      metrics[key] = retryStrategy.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all retry strategies
   */
  resetAll() {
    for (const retryStrategy of this.retryStrategies.values()) {
      retryStrategy.resetMetrics();
    }
  }

  /**
   * Reset specific retry strategy
   * @param {string} key - Retry strategy key
   */
  reset(key) {
    const retryStrategy = this.retryStrategies.get(key);
    if (retryStrategy) {
      retryStrategy.resetMetrics();
    }
  }

  /**
   * Remove retry strategy
   * @param {string} key - Retry strategy key
   */
  remove(key) {
    this.retryStrategies.delete(key);
  }

  /**
   * Clear all retry strategies
   */
  clear() {
    this.retryStrategies.clear();
  }

  /**
   * Update default configuration
   * @param {Object} config - New default configuration
   */
  updateDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get overall retry statistics
   * @returns {Object} Overall retry statistics
   */
  getOverallStatistics() {
    const strategies = Array.from(this.retryStrategies.values());
    const totalAttempts = strategies.reduce((sum, strategy) => sum + strategy.metrics.totalAttempts, 0);
    const totalSuccessful = strategies.reduce((sum, strategy) => sum + strategy.metrics.successfulAttempts, 0);
    const totalRetries = strategies.reduce((sum, strategy) => sum + strategy.metrics.retryAttempts, 0);
    
    return {
      totalStrategies: strategies.length,
      totalAttempts: totalAttempts,
      totalSuccessful: totalSuccessful,
      totalRetries: totalRetries,
      overallSuccessRate: totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 0,
      overallRetryRate: totalAttempts > 0 ? (totalRetries / totalAttempts) * 100 : 0
    };
  }
}

/**
 * Create a singleton retry manager
 * @returns {RetryManager} Singleton instance
 */
export function createRetryManager() {
  if (!window.retryManager) {
    window.retryManager = new RetryManager();
  }
  return window.retryManager;
}

/**
 * Get the singleton retry manager
 * @returns {RetryManager} Singleton instance
 */
export function getRetryManager() {
  if (!window.retryManager) {
    window.retryManager = new RetryManager();
  }
  return window.retryManager;
}

// Export default
export default RetryStrategy;
