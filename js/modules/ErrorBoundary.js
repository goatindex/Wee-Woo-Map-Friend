/**
 * ErrorBoundary - Centralized error handling and recovery system
 * Implements circuit breaker pattern, retry strategies, and graceful degradation
 * 
 * @fileoverview Error boundary system for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { logger } from './StructuredLogger.js';

/**
 * Error classification types
 */
export const ErrorType = {
  NETWORK: 'network',
  DATA: 'data',
  VALIDATION: 'validation',
  RUNTIME: 'runtime',
  TIMEOUT: 'timeout',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Recovery strategy types
 */
export const RecoveryStrategy = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  DEGRADE: 'degrade',
  IGNORE: 'ignore',
  FAIL: 'fail'
};

/**
 * Circuit breaker states
 */
export const CircuitState = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

/**
 * Error context information
 */
export class ErrorContext {
  constructor(options = {}) {
    this.component = options.component || 'unknown';
    this.operation = options.operation || 'unknown';
    this.userId = options.userId || null;
    this.sessionId = options.sessionId || null;
    this.timestamp = Date.now();
    this.metadata = options.metadata || {};
  }
}

/**
 * Error classification result
 */
export class ErrorClassification {
  constructor(type, severity, strategy, retryable = false) {
    this.type = type;
    this.severity = severity;
    this.strategy = strategy;
    this.retryable = retryable;
    this.timestamp = Date.now();
  }
}

/**
 * Circuit breaker for preventing cascade failures
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    this.logger = logger.createChild({ module: 'CircuitBreaker' });
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {Function} operation - Operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} Operation result
   */
  async execute(operation, operationName = 'unknown') {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
      }
      this.state = CircuitState.HALF_OPEN;
      this.logger.info(`Circuit breaker transitioning to HALF_OPEN for ${operationName}`);
    }

    try {
      const result = await operation();
      this.onSuccess(operationName);
      return result;
    } catch (error) {
      this.onFailure(operationName, error);
      throw error;
    }
  }

  /**
   * Handle successful operation
   * @param {string} operationName - Name of the operation
   * @private
   */
  onSuccess(operationName) {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.logger.debug(`Circuit breaker success for ${operationName}`, {
      state: this.state,
      failureCount: this.failureCount
    });
  }

  /**
   * Handle failed operation
   * @param {string} operationName - Name of the operation
   * @param {Error} error - The error that occurred
   * @private
   */
  onFailure(operationName, error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    this.logger.warn(`Circuit breaker failure for ${operationName}`, {
      failureCount: this.failureCount,
      threshold: this.failureThreshold,
      error: error.message
    });

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.logger.error(`Circuit breaker OPEN for ${operationName}`, {
        state: this.state,
        nextAttempt: new Date(this.nextAttempt).toISOString(),
        failureCount: this.failureCount
      });
    }
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
      nextAttempt: this.nextAttempt,
      isOpen: this.state === CircuitState.OPEN
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    this.logger.info('Circuit breaker reset to CLOSED state');
  }
}

/**
 * Retry strategy with exponential backoff
 */
export class RetryStrategy {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitter = options.jitter || true;
    this.logger = logger.createChild({ module: 'RetryStrategy' });
  }

  /**
   * Execute operation with retry strategy
   * @param {Function} operation - Operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} Operation result
   */
  async execute(operation, operationName = 'unknown') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`Executing ${operationName} (attempt ${attempt}/${this.maxRetries})`);
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.info(`Operation ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        this.logger.warn(`Operation ${operationName} failed on attempt ${attempt}`, {
          attempt,
          maxRetries: this.maxRetries,
          error: error.message,
          willRetry: attempt < this.maxRetries
        });

        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          this.logger.debug(`Waiting ${delay}ms before retry for ${operationName}`);
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(`Operation ${operationName} failed after ${this.maxRetries} attempts`, {
      operationName,
      maxRetries: this.maxRetries,
      lastError: lastError?.message
    });

    throw lastError;
  }

  /**
   * Calculate delay for retry attempt
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Delay in milliseconds
   * @private
   */
  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelay);
    
    if (this.jitter) {
      // Add jitter to prevent thundering herd
      const jitterAmount = cappedDelay * 0.1;
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error classifier for determining error types and recovery strategies
 */
export class ErrorClassifier {
  constructor() {
    this.logger = logger.createChild({ module: 'ErrorClassifier' });
  }

  /**
   * Classify an error and determine recovery strategy
   * @param {Error} error - The error to classify
   * @param {ErrorContext} context - Error context information
   * @returns {ErrorClassification} Classification result
   */
  classify(error, context) {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Network errors
    if (this.isNetworkError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        RecoveryStrategy.RETRY,
        true
      );
    }

    // Timeout errors
    if (this.isTimeoutError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.TIMEOUT,
        ErrorSeverity.MEDIUM,
        RecoveryStrategy.RETRY,
        true
      );
    }

    // Data validation errors
    if (this.isValidationError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH,
        RecoveryStrategy.FALLBACK,
        false
      );
    }

    // Permission errors
    if (this.isPermissionError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.PERMISSION,
        ErrorSeverity.HIGH,
        RecoveryStrategy.DEGRADE,
        false
      );
    }

    // Data errors
    if (this.isDataError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.DATA,
        ErrorSeverity.MEDIUM,
        RecoveryStrategy.FALLBACK,
        true
      );
    }

    // Runtime errors
    if (this.isRuntimeError(error, errorMessage, errorName)) {
      return new ErrorClassification(
        ErrorType.RUNTIME,
        ErrorSeverity.CRITICAL,
        RecoveryStrategy.FAIL,
        false
      );
    }

    // Unknown errors
    this.logger.warn('Unknown error type classified', {
      error: error.message,
      name: error.name,
      context: context.component
    });

    return new ErrorClassification(
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      RecoveryStrategy.RETRY,
      true
    );
  }

  /**
   * Check if error is network-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if network error
   * @private
   */
  isNetworkError(error, message, name) {
    const networkIndicators = [
      'network', 'fetch', 'connection', 'timeout', 'unreachable',
      'dns', 'refused', 'reset', 'aborted', 'cors'
    ];
    
    return networkIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    ) || error.name === 'TypeError' && message.includes('fetch');
  }

  /**
   * Check if error is timeout-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if timeout error
   * @private
   */
  isTimeoutError(error, message, name) {
    return message.includes('timeout') || 
           name.includes('timeout') ||
           error.name === 'AbortError';
  }

  /**
   * Check if error is validation-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if validation error
   * @private
   */
  isValidationError(error, message, name) {
    const validationIndicators = [
      'validation', 'invalid', 'malformed', 'schema', 'format',
      'required', 'missing', 'type', 'constraint'
    ];
    
    return validationIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    );
  }

  /**
   * Check if error is permission-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if permission error
   * @private
   */
  isPermissionError(error, message, name) {
    const permissionIndicators = [
      'permission', 'unauthorized', 'forbidden', 'access denied',
      'not allowed', 'blocked', 'cors'
    ];
    
    return permissionIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    );
  }

  /**
   * Check if error is data-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if data error
   * @private
   */
  isDataError(error, message, name) {
    const dataIndicators = [
      'data', 'parse', 'json', 'xml', 'geojson', 'corrupt',
      'invalid format', 'unexpected token'
    ];
    
    return dataIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    );
  }

  /**
   * Check if error is runtime-related
   * @param {Error} error - The error
   * @param {string} message - Lowercase error message
   * @param {string} name - Lowercase error name
   * @returns {boolean} True if runtime error
   * @private
   */
  isRuntimeError(error, message, name) {
    const runtimeIndicators = [
      'referenceerror', 'typeerror', 'syntaxerror', 'rangeerror',
      'evalerror', 'internal error', 'out of memory'
    ];
    
    return runtimeIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    );
  }
}

/**
 * Main ErrorBoundary class for centralized error handling
 */
export class ErrorBoundary {
  constructor(options = {}) {
    this.logger = logger.createChild({ module: 'ErrorBoundary' });
    this.classifier = new ErrorClassifier();
    this.circuitBreakers = new Map();
    this.retryStrategies = new Map();
    this.fallbackHandlers = new Map();
    this.errorHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling
   * @private
   */
  setupGlobalErrorHandling() {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason), new ErrorContext({
          component: 'global',
          operation: 'unhandledrejection'
        }));
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), new ErrorContext({
          component: 'global',
          operation: 'globalError',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }));
      });
    }
  }

  /**
   * Handle an error with classification and recovery
   * @param {Error} error - The error to handle
   * @param {ErrorContext} context - Error context information
   * @returns {Promise<any>} Recovery result if applicable
   */
  async handleError(error, context) {
    const classification = this.classifier.classify(error, context);
    
    this.logger.error('Error handled by ErrorBoundary', {
      error: error.message,
      stack: error.stack,
      classification: {
        type: classification.type,
        severity: classification.severity,
        strategy: classification.strategy,
        retryable: classification.retryable
      },
      context: {
        component: context.component,
        operation: context.operation,
        timestamp: context.timestamp
      }
    });

    // Add to error history
    this.addToHistory({
      error,
      context,
      classification,
      timestamp: Date.now()
    });

    // Execute recovery strategy
    return this.executeRecoveryStrategy(error, context, classification);
  }

  /**
   * Execute recovery strategy based on classification
   * @param {Error} error - The original error
   * @param {ErrorContext} context - Error context
   * @param {ErrorClassification} classification - Error classification
   * @returns {Promise<any>} Recovery result
   * @private
   */
  async executeRecoveryStrategy(error, context, classification) {
    switch (classification.strategy) {
      case RecoveryStrategy.RETRY:
        return this.executeWithRetry(error, context);
      
      case RecoveryStrategy.FALLBACK:
        return this.executeWithFallback(error, context);
      
      case RecoveryStrategy.DEGRADE:
        return this.executeWithDegradation(error, context);
      
      case RecoveryStrategy.IGNORE:
        this.logger.warn('Error ignored as per strategy', {
          error: error.message,
          context: context.component
        });
        return null;
      
      case RecoveryStrategy.FAIL:
      default:
        throw error;
    }
  }

  /**
   * Execute operation with retry strategy
   * @param {Error} error - The error
   * @param {ErrorContext} context - Error context
   * @returns {Promise<any>} Retry result
   * @private
   */
  async executeWithRetry(error, context) {
    const retryStrategy = this.getRetryStrategy(context.component);
    const operation = () => this.recreateOperation(context);
    
    try {
      return await retryStrategy.execute(operation, `${context.component}.${context.operation}`);
    } catch (retryError) {
      this.logger.error('Retry strategy failed', {
        originalError: error.message,
        retryError: retryError.message,
        context: context.component
      });
      throw retryError;
    }
  }

  /**
   * Execute operation with fallback
   * @param {Error} error - The error
   * @param {ErrorContext} context - Error context
   * @returns {Promise<any>} Fallback result
   * @private
   */
  async executeWithFallback(error, context) {
    const fallbackHandler = this.fallbackHandlers.get(context.component);
    
    if (!fallbackHandler) {
      this.logger.warn('No fallback handler available', {
        component: context.component,
        error: error.message
      });
      throw error;
    }

    try {
      this.logger.info('Executing fallback handler', {
        component: context.component,
        operation: context.operation
      });
      
      return await fallbackHandler(error, context);
    } catch (fallbackError) {
      this.logger.error('Fallback handler failed', {
        originalError: error.message,
        fallbackError: fallbackError.message,
        context: context.component
      });
      throw fallbackError;
    }
  }

  /**
   * Execute operation with graceful degradation
   * @param {Error} error - The error
   * @param {ErrorContext} context - Error context
   * @returns {Promise<any>} Degradation result
   * @private
   */
  async executeWithDegradation(error, context) {
    this.logger.warn('Executing graceful degradation', {
      component: context.component,
      operation: context.operation,
      error: error.message
    });

    // Emit degradation event for UI to handle
    if (typeof globalEventBus !== 'undefined') {
      globalEventBus.emit('error:degradation', {
        component: context.component,
        operation: context.operation,
        error: error.message
      });
    }

    return null; // Degraded functionality
  }

  /**
   * Get or create circuit breaker for component
   * @param {string} component - Component name
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(component) {
    if (!this.circuitBreakers.has(component)) {
      this.circuitBreakers.set(component, new CircuitBreaker({
        failureThreshold: 5,
        timeout: 60000,
        resetTimeout: 30000
      }));
    }
    return this.circuitBreakers.get(component);
  }

  /**
   * Get or create retry strategy for component
   * @param {string} component - Component name
   * @returns {RetryStrategy} Retry strategy instance
   */
  getRetryStrategy(component) {
    if (!this.retryStrategies.has(component)) {
      this.retryStrategies.set(component, new RetryStrategy({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true
      }));
    }
    return this.retryStrategies.get(component);
  }

  /**
   * Register fallback handler for component
   * @param {string} component - Component name
   * @param {Function} handler - Fallback handler function
   */
  registerFallbackHandler(component, handler) {
    this.fallbackHandlers.set(component, handler);
    this.logger.info(`Fallback handler registered for ${component}`);
  }

  /**
   * Add error to history
   * @param {Object} errorInfo - Error information
   * @private
   */
  addToHistory(errorInfo) {
    this.errorHistory.push(errorInfo);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error history
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} Error history
   */
  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStatistics() {
    const stats = {
      total: this.errorHistory.length,
      byType: {},
      bySeverity: {},
      byComponent: {},
      recent: this.errorHistory.slice(-10)
    };

    this.errorHistory.forEach(({ classification, context }) => {
      // Count by type
      stats.byType[classification.type] = (stats.byType[classification.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[classification.severity] = (stats.bySeverity[classification.severity] || 0) + 1;
      
      // Count by component
      stats.byComponent[context.component] = (stats.byComponent[context.component] || 0) + 1;
    });

    return stats;
  }

  /**
   * Recreate operation from context (placeholder - should be implemented by caller)
   * @param {ErrorContext} context - Error context
   * @returns {Promise<any>} Operation result
   * @private
   */
  async recreateOperation(context) {
    // This is a placeholder - in a real implementation, this would
    // recreate the original operation based on the context
    throw new Error(`Operation recreation not implemented for ${context.component}.${context.operation}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach(breaker => breaker.reset());
    this.logger.info('All circuit breakers reset');
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.logger.info('Error history cleared');
  }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundary();
