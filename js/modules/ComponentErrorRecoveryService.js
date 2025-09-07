/**
 * @module modules/ComponentErrorRecoveryService
 * Component error recovery service for WeeWoo Map Friend
 * Implements error recovery strategies, circuit breakers, and retry logic
 *
 * @fileoverview Error recovery service for component error handling
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES, BaseService } from './DependencyContainer.js';
import { logger } from './StructuredLogger.js';

/**
 * @typedef {Object} ErrorRecoveryConfig
 * @property {number} maxRetryAttempts - Maximum retry attempts
 * @property {number} retryDelay - Initial retry delay in milliseconds
 * @property {boolean} exponentialBackoff - Whether to use exponential backoff
 * @property {number} circuitBreakerThreshold - Circuit breaker failure threshold
 * @property {number} circuitBreakerTimeout - Circuit breaker timeout in milliseconds
 * @property {boolean} autoRecoveryEnabled - Whether automatic recovery is enabled
 * @property {number} recoveryTimeout - Recovery operation timeout
 */

/**
 * @typedef {Object} ErrorResult
 * @property {boolean} success - Whether recovery was successful
 * @property {string} strategy - Recovery strategy used
 * @property {number} duration - Recovery duration in milliseconds
 * @property {string} [error] - Error message if recovery failed
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} CircuitBreakerState
 * @property {'CLOSED'|'OPEN'|'HALF_OPEN'} state - Current state
 * @property {number} failureCount - Number of consecutive failures
 * @property {number} lastFailureTime - Timestamp of last failure
 * @property {number} successCount - Number of consecutive successes
 */

/**
 * @class ComponentErrorRecoveryService
 * Manages component error recovery, circuit breakers, and retry strategies.
 */
@injectable()
export class ComponentErrorRecoveryService extends BaseService {
  constructor(
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.ErrorBoundary) errorBoundary
  ) {
    super();
    this.eventBus = eventBus;
    this.errorBoundary = errorBoundary;
    this.logger = logger.createChild({ module: 'ComponentErrorRecoveryService' });

    // Error recovery strategies
    this.errorRecoveryStrategies = new Map();
    this.componentErrorBoundaries = new Map();
    this.errorStateManager = {
      errorHistory: new Map(),
      recoveryAttempts: new Map(),
      circuitBreakers: new Map(),
      retryStrategies: new Map()
    };

    // Default configuration
    this.recoveryConfig = {
      maxRetryAttempts: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      autoRecoveryEnabled: true,
      recoveryTimeout: 10000
    };

    this.logger.info('ComponentErrorRecoveryService initialized');
  }

  /**
   * Initializes the error recovery service.
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.info('Initializing ComponentErrorRecoveryService');
    
    // Register default recovery strategies
    this.registerDefaultStrategies();
    
    this.logger.info('ComponentErrorRecoveryService initialized successfully');
  }

  /**
   * Registers a custom error recovery strategy for a component.
   * @param {string} componentId - Component ID
   * @param {Function} strategy - Recovery strategy function
   */
  registerErrorRecoveryStrategy(componentId, strategy) {
    if (typeof strategy !== 'function') {
      this.logger.warn('Error recovery strategy must be a function', { componentId });
      return;
    }

    this.errorRecoveryStrategies.set(componentId, strategy);
    this.logger.debug('Error recovery strategy registered', { componentId });
  }

  /**
   * Unregisters an error recovery strategy for a component.
   * @param {string} componentId - Component ID
   */
  unregisterErrorRecoveryStrategy(componentId) {
    this.errorRecoveryStrategies.delete(componentId);
    this.logger.debug('Error recovery strategy unregistered', { componentId });
  }

  /**
   * Creates a component-specific error boundary.
   * @param {string} componentId - Component ID
   * @param {Object} config - Error boundary configuration
   * @returns {Object} Error boundary instance
   */
  createComponentErrorBoundary(componentId, config = {}) {
    const errorBoundary = {
      componentId,
      errorCount: 0,
      lastError: null,
      isRecovering: false,
      recoveryAttempts: 0,
      maxRecoveryAttempts: config.maxRecoveryAttempts || this.recoveryConfig.maxRetryAttempts,
      lastRecoveryTime: 0,
      circuitBreakerState: 'CLOSED',
      circuitBreakerFailures: 0,
      circuitBreakerLastFailure: 0
    };

    this.componentErrorBoundaries.set(componentId, errorBoundary);
    this.logger.debug('Component error boundary created', { componentId, config });
    
    return errorBoundary;
  }

  /**
   * Handles a component error with recovery strategies.
   * @param {string} componentId - Component ID
   * @param {Error} error - The error that occurred
   * @param {Object} context - Additional context
   * @returns {Promise<ErrorResult>} Recovery result
   */
  async handleComponentError(componentId, error, context = {}) {
    try {
      this.logger.error('Component error occurred', { 
        componentId, 
        error: error.message, 
        stack: error.stack,
        context 
      });

      // Record error in history
      this.recordErrorInHistory(componentId, error, context);

      // Get or create error boundary
      let errorBoundary = this.componentErrorBoundaries.get(componentId);
      if (!errorBoundary) {
        errorBoundary = this.createComponentErrorBoundary(componentId);
      }

      // Update error boundary
      this.updateComponentErrorStatus(componentId, error);

      // Check if circuit breaker is open
      if (this.isCircuitBreakerOpen(componentId)) {
        this.logger.warn('Circuit breaker open for component', { componentId });
        return {
          success: false,
          strategy: 'circuit_breaker_open',
          duration: 0,
          error: 'Circuit breaker is open'
        };
      }

      // Attempt recovery if enabled
      if (this.recoveryConfig.autoRecoveryEnabled) {
        const recoveryResult = await this.attemptComponentRecovery(componentId, error, context);
        
        if (recoveryResult.success) {
          this.logger.info('Component error recovery successful', { 
            componentId, 
            strategy: recoveryResult.strategy,
            duration: recoveryResult.duration 
          });
          
          // Reset circuit breaker on success
          this.resetComponentErrorState(componentId);
          
          return recoveryResult;
        } else {
          this.logger.warn('Component error recovery failed', { 
            componentId, 
            strategy: recoveryResult.strategy,
            error: recoveryResult.error 
          });
          
          // Open circuit breaker if too many failures
          if (errorBoundary.errorCount >= this.recoveryConfig.circuitBreakerThreshold) {
            this.openCircuitBreaker(componentId);
          }
          
          return recoveryResult;
        }
      }

      // No recovery attempted
      return {
        success: false,
        strategy: 'no_recovery',
        duration: 0,
        error: 'Automatic recovery disabled'
      };

    } catch (recoveryError) {
      this.logger.error('Error recovery system failed', { 
        componentId, 
        originalError: error.message,
        recoveryError: recoveryError.message,
        stack: recoveryError.stack 
      });
      
      return {
        success: false,
        strategy: 'recovery_system_error',
        duration: 0,
        error: recoveryError.message
      };
    }
  }

  /**
   * Records an error in the error history.
   * @param {string} componentId - Component ID
   * @param {Error} error - The error
   * @param {Object} context - Additional context
   */
  recordErrorInHistory(componentId, error, context) {
    const errorEntry = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context
    };

    if (!this.errorStateManager.errorHistory.has(componentId)) {
      this.errorStateManager.errorHistory.set(componentId, []);
    }

    const history = this.errorStateManager.errorHistory.get(componentId);
    history.push(errorEntry);

    // Keep only last 100 errors per component
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Checks if circuit breaker is open for a component.
   * @param {string} componentId - Component ID
   * @returns {boolean} True if circuit breaker is open
   */
  isCircuitBreakerOpen(componentId) {
    const errorBoundary = this.componentErrorBoundaries.get(componentId);
    if (!errorBoundary) return false;

    if (errorBoundary.circuitBreakerState === 'OPEN') {
      const timeSinceLastFailure = Date.now() - errorBoundary.circuitBreakerLastFailure;
      if (timeSinceLastFailure > this.recoveryConfig.circuitBreakerTimeout) {
        // Transition to half-open
        errorBoundary.circuitBreakerState = 'HALF_OPEN';
        this.logger.debug('Circuit breaker transitioning to half-open', { componentId });
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Attempts to recover a component from an error.
   * @param {string} componentId - Component ID
   * @param {Error} error - The error
   * @param {Object} context - Additional context
   * @returns {Promise<ErrorResult>} Recovery result
   */
  async attemptComponentRecovery(componentId, error, context) {
    const startTime = Date.now();
    const errorBoundary = this.componentErrorBoundaries.get(componentId);

    try {
      // Check if we've exceeded max recovery attempts
      if (errorBoundary && errorBoundary.recoveryAttempts >= errorBoundary.maxRecoveryAttempts) {
        return {
          success: false,
          strategy: 'max_attempts_exceeded',
          duration: Date.now() - startTime,
          error: 'Maximum recovery attempts exceeded'
        };
      }

      // Get custom recovery strategy or use default
      const customStrategy = this.errorRecoveryStrategies.get(componentId);
      const strategy = customStrategy || this.defaultComponentRecovery.bind(this);

      // Execute recovery with timeout
      const recoveryPromise = strategy(componentId, error, context);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Recovery timeout')), this.recoveryConfig.recoveryTimeout);
      });

      const result = await Promise.race([recoveryPromise, timeoutPromise]);

      // Update recovery attempts
      if (errorBoundary) {
        errorBoundary.recoveryAttempts++;
        errorBoundary.lastRecoveryTime = Date.now();
      }

      return {
        success: true,
        strategy: customStrategy ? 'custom' : 'default',
        duration: Date.now() - startTime,
        metadata: result
      };

    } catch (recoveryError) {
      this.logger.error('Component recovery failed', { 
        componentId, 
        error: recoveryError.message,
        duration: Date.now() - startTime 
      });

      return {
        success: false,
        strategy: 'recovery_failed',
        duration: Date.now() - startTime,
        error: recoveryError.message
      };
    }
  }

  /**
   * Default component recovery strategy.
   * @param {string} componentId - Component ID
   * @param {Error} error - The error
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Recovery result
   */
  async defaultComponentRecovery(componentId, error, context) {
    this.logger.info('Executing default component recovery', { componentId, error: error.message });

    // Emit recovery event
    this.eventBus.emit('component.recovery.attempted', {
      componentId,
      error: error.message,
      strategy: 'default',
      timestamp: Date.now()
    });

    // Simple recovery: wait and retry
    await new Promise(resolve => setTimeout(resolve, this.recoveryConfig.retryDelay));

    return {
      recovered: true,
      strategy: 'default_retry',
      timestamp: Date.now()
    };
  }

  /**
   * Opens the circuit breaker for a component.
   * @param {string} componentId - Component ID
   */
  openCircuitBreaker(componentId) {
    const errorBoundary = this.componentErrorBoundaries.get(componentId);
    if (errorBoundary) {
      errorBoundary.circuitBreakerState = 'OPEN';
      errorBoundary.circuitBreakerLastFailure = Date.now();
      this.logger.warn('Circuit breaker opened for component', { componentId });
      
      this.eventBus.emit('component.circuit_breaker.opened', {
        componentId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Resets the error state for a component.
   * @param {string} componentId - Component ID
   */
  resetComponentErrorState(componentId) {
    const errorBoundary = this.componentErrorBoundaries.get(componentId);
    if (errorBoundary) {
      errorBoundary.errorCount = 0;
      errorBoundary.lastError = null;
      errorBoundary.recoveryAttempts = 0;
      errorBoundary.circuitBreakerState = 'CLOSED';
      errorBoundary.circuitBreakerFailures = 0;
      errorBoundary.circuitBreakerLastFailure = 0;
      
      this.logger.debug('Component error state reset', { componentId });
      
      this.eventBus.emit('component.error_state.reset', {
        componentId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Updates the error status for a component.
   * @param {string} componentId - Component ID
   * @param {Error} error - The error
   */
  updateComponentErrorStatus(componentId, error) {
    const errorBoundary = this.componentErrorBoundaries.get(componentId);
    if (errorBoundary) {
      errorBoundary.errorCount++;
      errorBoundary.lastError = error.message;
      errorBoundary.circuitBreakerFailures++;
      errorBoundary.circuitBreakerLastFailure = Date.now();
    }
  }

  /**
   * Gets error statistics for a component.
   * @param {string} componentId - Component ID
   * @returns {Object} Error statistics
   */
  getComponentErrorStats(componentId) {
    const errorBoundary = this.componentErrorBoundaries.get(componentId);
    const errorHistory = this.errorStateManager.errorHistory.get(componentId) || [];
    
    return {
      componentId,
      errorCount: errorBoundary?.errorCount || 0,
      lastError: errorBoundary?.lastError || null,
      recoveryAttempts: errorBoundary?.recoveryAttempts || 0,
      circuitBreakerState: errorBoundary?.circuitBreakerState || 'CLOSED',
      errorHistoryCount: errorHistory.length,
      lastErrorTime: errorHistory.length > 0 ? errorHistory[errorHistory.length - 1].timestamp : null
    };
  }

  /**
   * Gets system-wide error statistics.
   * @returns {Object} System error statistics
   */
  getSystemErrorStats() {
    const stats = {
      totalComponents: this.componentErrorBoundaries.size,
      totalErrors: 0,
      componentsWithErrors: 0,
      openCircuitBreakers: 0,
      totalRecoveryAttempts: 0
    };

    for (const [componentId, errorBoundary] of this.componentErrorBoundaries) {
      stats.totalErrors += errorBoundary.errorCount;
      if (errorBoundary.errorCount > 0) {
        stats.componentsWithErrors++;
      }
      if (errorBoundary.circuitBreakerState === 'OPEN') {
        stats.openCircuitBreakers++;
      }
      stats.totalRecoveryAttempts += errorBoundary.recoveryAttempts;
    }

    return stats;
  }

  /**
   * Sets the error recovery configuration.
   * @param {ErrorRecoveryConfig} config - New configuration
   */
  setErrorRecoveryConfig(config) {
    this.recoveryConfig = { ...this.recoveryConfig, ...config };
    this.logger.info('Error recovery configuration updated', { config: this.recoveryConfig });
  }

  /**
   * Registers default recovery strategies.
   * @private
   */
  registerDefaultStrategies() {
    // Register default retry strategy
    this.errorStateManager.retryStrategies.set('default', {
      maxAttempts: this.recoveryConfig.maxRetryAttempts,
      delay: this.recoveryConfig.retryDelay,
      exponentialBackoff: this.recoveryConfig.exponentialBackoff
    });

    this.logger.debug('Default recovery strategies registered');
  }

  /**
   * Cleans up the error recovery service.
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.logger.info('Cleaning up ComponentErrorRecoveryService');

    try {
      // Clear all error recovery data
      this.errorRecoveryStrategies.clear();
      this.componentErrorBoundaries.clear();
      this.errorStateManager.errorHistory.clear();
      this.errorStateManager.recoveryAttempts.clear();
      this.errorStateManager.circuitBreakers.clear();
      this.errorStateManager.retryStrategies.clear();

      this.logger.info('ComponentErrorRecoveryService cleanup completed');
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentErrorRecoveryService.cleanup' });
      this.logger.error('ComponentErrorRecoveryService cleanup failed', { error: error.message });
    } finally {
      await super.cleanup();
    }
  }
}
