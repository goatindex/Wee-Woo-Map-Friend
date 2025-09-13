/**
 * @module modules/CircuitBreakerStrategy
 * Circuit Breaker Strategy Implementation
 * 
 * This module provides a standalone circuit breaker implementation that can be used
 * to prevent cascade failures by temporarily blocking operations when they fail repeatedly.
 * 
 * Key Features:
 * - Three states: CLOSED, OPEN, HALF_OPEN
 * - Configurable failure thresholds and timeouts
 * - Automatic state transitions
 * - Performance monitoring
 * - No dependencies on other error modules (standalone)
 */

import { injectable } from 'inversify';

/**
 * Circuit breaker states
 */
export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Circuit breaker configuration
 */
export const DEFAULT_CONFIG = {
  failureThreshold: 5,
  timeout: 30000,
  resetTimeout: 60000,
  monitoringPeriod: 60000,
  enableMetrics: true
};

/**
 * Circuit Breaker Strategy Class
 * 
 * Implements the circuit breaker pattern to prevent cascade failures
 * by temporarily blocking operations when they fail repeatedly.
 */
@injectable()
export class CircuitBreakerStrategy {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Circuit breaker state
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      circuitBreakerResets: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    
    // State change callbacks
    this.onStateChange = null;
    this.onFailure = null;
    this.onSuccess = null;
    
    // Bind methods
    this.execute = this.execute.bind(this);
    this.canExecute = this.canExecute.bind(this);
    this.recordSuccess = this.recordSuccess.bind(this);
    this.recordFailure = this.recordFailure.bind(this);
  }

  /**
   * Execute an operation with circuit breaker protection
   * @param {Function} operation - The operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(operation, options = {}) {
    const startTime = performance.now();
    
    // Check if circuit breaker allows execution
    if (!this.canExecute()) {
      const error = new Error(`Circuit breaker is ${this.state}`);
      error.circuitBreakerState = this.state;
      error.circuitBreakerKey = options.key || 'default';
      throw error;
    }
    
    try {
      // Execute the operation
      const result = await operation();
      
      // Record success
      const duration = performance.now() - startTime;
      this.recordSuccess(duration);
      
      return result;
      
    } catch (error) {
      // Record failure
      const duration = performance.now() - startTime;
      this.recordFailure(error, duration);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Check if the circuit breaker allows execution
   * @returns {boolean} True if execution is allowed
   */
  canExecute() {
    switch (this.state) {
      case CIRCUIT_STATES.CLOSED:
        return true;
        
      case CIRCUIT_STATES.OPEN:
        // Check if reset timeout has passed
        if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
          this.setState(CIRCUIT_STATES.HALF_OPEN);
          return true;
        }
        return false;
        
      case CIRCUIT_STATES.HALF_OPEN:
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Record a successful operation
   * @param {number} duration - Operation duration in milliseconds
   * @private
   */
  recordSuccess(duration) {
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;
    
    // Update metrics
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Update average response time
    this.updateAverageResponseTime();
    
    // State transition from HALF_OPEN to CLOSED
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.setState(CIRCUIT_STATES.CLOSED);
      this.metrics.circuitBreakerResets++;
    }
    
    // Call success callback
    if (this.onSuccess) {
      this.onSuccess(duration);
    }
  }

  /**
   * Record a failed operation
   * @param {Error} error - The error that occurred
   * @param {number} duration - Operation duration in milliseconds
   * @private
   */
  recordFailure(error, duration) {
    this.lastFailureTime = Date.now();
    this.failureCount++;
    
    // Update metrics
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Update average response time
    this.updateAverageResponseTime();
    
    // Check if circuit breaker should trip
    if (this.failureCount >= this.config.failureThreshold) {
      this.setState(CIRCUIT_STATES.OPEN);
      this.metrics.circuitBreakerTrips++;
    }
    
    // Call failure callback
    if (this.onFailure) {
      this.onFailure(error, duration);
    }
  }

  /**
   * Set circuit breaker state
   * @param {string} newState - New state
   * @private
   */
  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      
      // Call state change callback
      if (this.onStateChange) {
        this.onStateChange(oldState, newState);
      }
    }
  }

  /**
   * Update average response time
   * @private
   */
  updateAverageResponseTime() {
    if (this.metrics.responseTimes.length > 0) {
      const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset() {
    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    
    // Reset metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0,
      circuitBreakerResets: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  /**
   * Get current circuit breaker state
   * @returns {Object} Current state information
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      canExecute: this.canExecute(),
      timeUntilReset: this.getTimeUntilReset()
    };
  }

  /**
   * Get time until circuit breaker resets (if OPEN)
   * @returns {number} Milliseconds until reset, or 0 if not applicable
   */
  getTimeUntilReset() {
    if (this.state === CIRCUIT_STATES.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      const timeUntilReset = this.config.resetTimeout - timeSinceFailure;
      return Math.max(0, timeUntilReset);
    }
    return 0;
  }

  /**
   * Get circuit breaker metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;
    
    return {
      ...this.metrics,
      successRate: successRate,
      failureRate: 100 - successRate,
      currentState: this.state,
      failureCount: this.failureCount,
      timeUntilReset: this.getTimeUntilReset()
    };
  }

  /**
   * Set state change callback
   * @param {Function} callback - Callback function
   */
  setOnStateChange(callback) {
    this.onStateChange = callback;
  }

  /**
   * Set failure callback
   * @param {Function} callback - Callback function
   */
  setOnFailure(callback) {
    this.onFailure = callback;
  }

  /**
   * Set success callback
   * @param {Function} callback - Callback function
   */
  setOnSuccess(callback) {
    this.onSuccess = callback;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if circuit breaker is healthy
   * @returns {boolean} True if healthy
   */
  isHealthy() {
    return this.state === CIRCUIT_STATES.CLOSED && this.failureCount === 0;
  }

  /**
   * Get health status
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    
    return {
      healthy: this.isHealthy(),
      state: this.state,
      successRate: metrics.successRate,
      failureRate: metrics.failureRate,
      averageResponseTime: metrics.averageResponseTime,
      circuitBreakerTrips: metrics.circuitBreakerTrips,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure: this.lastFailureTime > 0 ? Date.now() - this.lastFailureTime : null
    };
  }
}

/**
 * Circuit Breaker Manager Class
 * 
 * Manages multiple circuit breakers for different operations
 */
export class CircuitBreakerManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.defaultConfig = { ...DEFAULT_CONFIG };
  }

  /**
   * Get or create a circuit breaker for a key
   * @param {string} key - Circuit breaker key
   * @param {Object} config - Configuration options
   * @returns {CircuitBreakerStrategy} Circuit breaker instance
   */
  getCircuitBreaker(key, config = {}) {
    if (!this.circuitBreakers.has(key)) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const circuitBreaker = new CircuitBreakerStrategy(mergedConfig);
      this.circuitBreakers.set(key, circuitBreaker);
    }
    return this.circuitBreakers.get(key);
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {string} key - Circuit breaker key
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async execute(key, operation, options = {}) {
    const circuitBreaker = this.getCircuitBreaker(key, options.config);
    return circuitBreaker.execute(operation, { ...options, key });
  }

  /**
   * Execute operation with circuit breaker protection (ApplicationBootstrap compatibility)
   * Extracted from ApplicationBootstrap.executeWithCircuitBreaker()
   * @param {Function} operation - The operation to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Operation result
   */
  async executeWithCircuitBreaker(operation, options = {}) {
    const {
      failureThreshold = 5,
      timeout = 60000,
      resetTimeout = 30000,
      name = 'operation'
    } = options;

    // Get or create circuit breaker for this operation
    const circuitBreaker = this.getCircuitBreaker(name, {
      failureThreshold,
      timeout,
      resetTimeout
    });

    // Execute with circuit breaker protection
    return circuitBreaker.execute(operation, { key: name });
  }

  /**
   * Get all circuit breaker states
   * @returns {Object} All circuit breaker states
   */
  getAllStates() {
    const states = {};
    for (const [key, circuitBreaker] of this.circuitBreakers) {
      states[key] = circuitBreaker.getState();
    }
    return states;
  }

  /**
   * Get all circuit breaker metrics
   * @returns {Object} All circuit breaker metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [key, circuitBreaker] of this.circuitBreakers) {
      metrics[key] = circuitBreaker.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }

  /**
   * Reset specific circuit breaker
   * @param {string} key - Circuit breaker key
   */
  reset(key) {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Remove circuit breaker
   * @param {string} key - Circuit breaker key
   */
  remove(key) {
    this.circuitBreakers.delete(key);
  }

  /**
   * Clear all circuit breakers
   */
  clear() {
    this.circuitBreakers.clear();
  }

  /**
   * Update default configuration
   * @param {Object} config - New default configuration
   */
  updateDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get overall health status
   * @returns {Object} Overall health status
   */
  getOverallHealthStatus() {
    const circuitBreakers = Array.from(this.circuitBreakers.values());
    const healthyCount = circuitBreakers.filter(cb => cb.isHealthy()).length;
    const totalCount = circuitBreakers.length;
    
    return {
      totalCircuitBreakers: totalCount,
      healthyCircuitBreakers: healthyCount,
      unhealthyCircuitBreakers: totalCount - healthyCount,
      overallHealth: totalCount > 0 ? (healthyCount / totalCount) * 100 : 100
    };
  }
}

/**
 * Create a singleton circuit breaker manager
 * @returns {CircuitBreakerManager} Singleton instance
 */
export function createCircuitBreakerManager() {
  if (!window.circuitBreakerManager) {
    window.circuitBreakerManager = new CircuitBreakerManager();
  }
  return window.circuitBreakerManager;
}

/**
 * Get the singleton circuit breaker manager
 * @returns {CircuitBreakerManager} Singleton instance
 */
export function getCircuitBreakerManager() {
  if (!window.circuitBreakerManager) {
    window.circuitBreakerManager = new CircuitBreakerManager();
  }
  return window.circuitBreakerManager;
}

// Export default
export default CircuitBreakerStrategy;
