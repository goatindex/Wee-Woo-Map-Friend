/**
 * @module modules/UnifiedErrorHandler
 * Unified Error Handling System
 * 
 * This module provides a centralized error handling system that consolidates
 * all error handling functionality across the application. It serves as the
 * main interface for error processing, recovery, and reporting.
 * 
 * Key Features:
 * - Centralized error processing and classification
 * - Configurable error recovery strategies
 * - Circuit breaker pattern implementation
 * - Retry mechanisms with exponential backoff
 * - Graceful degradation support
 * - Comprehensive error logging and monitoring
 * - No dependencies on other error modules (standalone)
 */

import { injectable } from 'inversify';

/**
 * Error classification types
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  DATA: 'data',
  VALIDATION: 'validation',
  RUNTIME: 'runtime',
  TIMEOUT: 'timeout',
  PERMISSION: 'permission',
  CONFIGURATION: 'configuration',
  UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Recovery strategy types
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  DEGRADE: 'degrade',
  ABORT: 'abort',
  IGNORE: 'ignore'
};

/**
 * Circuit breaker states
 */
export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Unified Error Handler Class
 * 
 * Provides centralized error handling with configurable strategies
 * and comprehensive error processing capabilities.
 */
@injectable()
export class UnifiedErrorHandler {
  constructor(options = {}) {
    this.options = {
      // Default configuration
      maxRetries: 3,
      retryDelay: 1000,
      retryMultiplier: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      circuitBreakerResetTimeout: 60000,
      enableLogging: true,
      enableMetrics: true,
      ...options
    };

    // Error tracking
    this.errorHistory = [];
    this.errorCounts = new Map();
    this.circuitBreakers = new Map();
    this.recoveryStrategies = new Map();
    
    // Performance tracking
    this.metrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      circuitBreakerTrips: 0
    };

    // Initialize default recovery strategies
    this.initializeDefaultStrategies();
    
    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.classifyError = this.classifyError.bind(this);
    this.executeRecovery = this.executeRecovery.bind(this);
  }

  /**
   * Initialize default recovery strategies
   * @private
   */
  initializeDefaultStrategies() {
    // Network errors - retry with exponential backoff
    this.recoveryStrategies.set(ERROR_TYPES.NETWORK, {
      strategy: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 3,
      delay: 1000,
      multiplier: 2
    });

    // Data errors - fallback to cached data
    this.recoveryStrategies.set(ERROR_TYPES.DATA, {
      strategy: RECOVERY_STRATEGIES.FALLBACK,
      fallbackData: null
    });

    // Validation errors - abort operation
    this.recoveryStrategies.set(ERROR_TYPES.VALIDATION, {
      strategy: RECOVERY_STRATEGIES.ABORT
    });

    // Runtime errors - retry once, then degrade
    this.recoveryStrategies.set(ERROR_TYPES.RUNTIME, {
      strategy: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 1,
      fallbackStrategy: RECOVERY_STRATEGIES.DEGRADE
    });

    // Timeout errors - retry with longer timeout
    this.recoveryStrategies.set(ERROR_TYPES.TIMEOUT, {
      strategy: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 2,
      delay: 2000
    });

    // Permission errors - abort operation
    this.recoveryStrategies.set(ERROR_TYPES.PERMISSION, {
      strategy: RECOVERY_STRATEGIES.ABORT
    });

    // Configuration errors - abort operation
    this.recoveryStrategies.set(ERROR_TYPES.CONFIGURATION, {
      strategy: RECOVERY_STRATEGIES.ABORT
    });

    // Unknown errors - retry once, then abort
    this.recoveryStrategies.set(ERROR_TYPES.UNKNOWN, {
      strategy: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 1,
      fallbackStrategy: RECOVERY_STRATEGIES.ABORT
    });
  }

  /**
   * Main error handling method
   * @param {Error} error - The error to handle
   * @param {Object} context - Error context information
   * @param {Object} options - Handling options
   * @returns {Promise<Object>} Error handling result
   */
  async handleError(error, context = {}, options = {}) {
    const startTime = performance.now();
    
    try {
      // Classify the error
      const classification = this.classifyError(error, context);
      
      // Update metrics
      this.updateMetrics(classification);
      
      // Log the error
      if (this.options.enableLogging) {
        this.logError(error, classification, context);
      }
      
      // Check circuit breaker
      const circuitBreakerKey = this.getCircuitBreakerKey(context);
      if (this.isCircuitBreakerOpen(circuitBreakerKey)) {
        return this.handleCircuitBreakerOpen(error, context);
      }
      
      // Execute recovery strategy
      const recoveryResult = await this.executeRecovery(error, classification, context, options);
      
      // Update circuit breaker
      this.updateCircuitBreaker(circuitBreakerKey, recoveryResult.success);
      
      // Record error in history
      this.recordError(error, classification, context, recoveryResult);
      
      const duration = performance.now() - startTime;
      
      return {
        success: recoveryResult.success,
        error: error,
        classification: classification,
        recovery: recoveryResult,
        context: context,
        duration: duration,
        timestamp: Date.now()
      };
      
    } catch (handlingError) {
      // If error handling itself fails, log and return failure
      console.error('Error handling failed:', handlingError);
      return {
        success: false,
        error: error,
        handlingError: handlingError,
        context: context,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Classify an error based on its properties and context
   * @param {Error} error - The error to classify
   * @param {Object} context - Error context
   * @returns {Object} Error classification
   */
  classifyError(error, context = {}) {
    const type = this.determineErrorType(error, context);
    const severity = this.determineErrorSeverity(error, type, context);
    
    return {
      type: type,
      severity: severity,
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      timestamp: Date.now(),
      context: context
    };
  }

  /**
   * Determine error type based on error properties and context
   * @param {Error} error - The error
   * @param {Object} context - Error context
   * @returns {string} Error type
   */
  determineErrorType(error, context) {
    // Check for specific error types
    if (error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }
    
    if (error.name === 'ValidationError' || error.message.includes('validation') || error.message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION;
    }
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT;
    }
    
    if (error.name === 'PermissionError' || error.message.includes('permission') || error.message.includes('unauthorized')) {
      return ERROR_TYPES.PERMISSION;
    }
    
    if (error.name === 'ConfigurationError' || error.message.includes('config')) {
      return ERROR_TYPES.CONFIGURATION;
    }
    
    if (error.message.includes('data') || error.message.includes('JSON') || error.message.includes('parse')) {
      return ERROR_TYPES.DATA;
    }
    
    // Check context for hints
    if (context.operation === 'network' || context.source === 'network') {
      return ERROR_TYPES.NETWORK;
    }
    
    if (context.operation === 'validation' || context.source === 'validation') {
      return ERROR_TYPES.VALIDATION;
    }
    
    // Default to runtime error
    return ERROR_TYPES.RUNTIME;
  }

  /**
   * Determine error severity based on error type and context
   * @param {Error} error - The error
   * @param {string} type - Error type
   * @param {Object} context - Error context
   * @returns {string} Error severity
   */
  determineErrorSeverity(error, type, context) {
    // Critical errors
    if (type === ERROR_TYPES.CONFIGURATION || type === ERROR_TYPES.PERMISSION) {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    // High severity errors
    if (type === ERROR_TYPES.NETWORK || type === ERROR_TYPES.DATA) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium severity errors
    if (type === ERROR_TYPES.RUNTIME || type === ERROR_TYPES.TIMEOUT) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    // Low severity errors
    if (type === ERROR_TYPES.VALIDATION) {
      return ERROR_SEVERITY.LOW;
    }
    
    // Default to medium
    return ERROR_SEVERITY.MEDIUM;
  }

  /**
   * Execute recovery strategy for the error
   * @param {Error} error - The error
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Recovery result
   */
  async executeRecovery(error, classification, context, options = {}) {
    const strategy = this.recoveryStrategies.get(classification.type);
    
    if (!strategy) {
      return { success: false, strategy: 'none', reason: 'No strategy found' };
    }
    
    try {
      switch (strategy.strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          return await this.executeRetryStrategy(error, strategy, context, options);
          
        case RECOVERY_STRATEGIES.FALLBACK:
          return await this.executeFallbackStrategy(error, strategy, context, options);
          
        case RECOVERY_STRATEGIES.DEGRADE:
          return await this.executeDegradeStrategy(error, strategy, context, options);
          
        case RECOVERY_STRATEGIES.ABORT:
          return await this.executeAbortStrategy(error, strategy, context, options);
          
        case RECOVERY_STRATEGIES.IGNORE:
          return await this.executeIgnoreStrategy(error, strategy, context, options);
          
        default:
          return { success: false, strategy: strategy.strategy, reason: 'Unknown strategy' };
      }
    } catch (recoveryError) {
      return {
        success: false,
        strategy: strategy.strategy,
        error: recoveryError,
        reason: 'Recovery strategy failed'
      };
    }
  }

  /**
   * Execute retry strategy with exponential backoff
   * @param {Error} error - The error
   * @param {Object} strategy - Retry strategy configuration
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Retry result
   */
  async executeRetryStrategy(error, strategy, context, options) {
    const maxRetries = options.maxRetries || strategy.maxRetries || this.options.maxRetries;
    const delay = options.delay || strategy.delay || this.options.retryDelay;
    const multiplier = options.multiplier || strategy.retryMultiplier || this.options.retryMultiplier;
    
    let lastError = error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait before retry (except first attempt)
        if (attempt > 1) {
          const retryDelay = delay * Math.pow(multiplier, attempt - 2);
          await this.sleep(retryDelay);
        }
        
        // Execute the operation if provided
        if (options.operation && typeof options.operation === 'function') {
          const result = await options.operation();
          return {
            success: true,
            strategy: RECOVERY_STRATEGIES.RETRY,
            attempts: attempt,
            result: result
          };
        }
        
        // If no operation provided, assume retry succeeded
        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.RETRY,
          attempts: attempt
        };
        
      } catch (retryError) {
        lastError = retryError;
        
        // If this is the last attempt, try fallback strategy
        if (attempt === maxRetries && strategy.fallbackStrategy) {
          return await this.executeFallbackStrategy(lastError, { strategy: strategy.fallbackStrategy }, context, options);
        }
      }
    }
    
    return {
      success: false,
      strategy: RECOVERY_STRATEGIES.RETRY,
      attempts: maxRetries,
      error: lastError,
      reason: 'Max retries exceeded'
    };
  }

  /**
   * Execute fallback strategy
   * @param {Error} error - The error
   * @param {Object} strategy - Fallback strategy configuration
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Fallback result
   */
  async executeFallbackStrategy(error, strategy, context, options) {
    try {
      // Use fallback data if provided
      if (strategy.fallbackData) {
        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.FALLBACK,
          data: strategy.fallbackData
        };
      }
      
      // Use fallback operation if provided
      if (options.fallbackOperation && typeof options.fallbackOperation === 'function') {
        const result = await options.fallbackOperation();
        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.FALLBACK,
          result: result
        };
      }
      
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        reason: 'No fallback available'
      };
      
    } catch (fallbackError) {
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.FALLBACK,
        error: fallbackError,
        reason: 'Fallback operation failed'
      };
    }
  }

  /**
   * Execute degrade strategy
   * @param {Error} error - The error
   * @param {Object} strategy - Degrade strategy configuration
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Degrade result
   */
  async executeDegradeStrategy(error, strategy, context, options) {
    try {
      // Execute degraded operation if provided
      if (options.degradedOperation && typeof options.degradedOperation === 'function') {
        const result = await options.degradedOperation();
        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.DEGRADE,
          result: result,
          degraded: true
        };
      }
      
      // Return degraded success
      return {
        success: true,
        strategy: RECOVERY_STRATEGIES.DEGRADE,
        degraded: true,
        reason: 'Operation degraded'
      };
      
    } catch (degradeError) {
      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.DEGRADE,
        error: degradeError,
        reason: 'Degrade operation failed'
      };
    }
  }

  /**
   * Execute abort strategy
   * @param {Error} error - The error
   * @param {Object} strategy - Abort strategy configuration
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Abort result
   */
  async executeAbortStrategy(error, strategy, context, options) {
    return {
      success: false,
      strategy: RECOVERY_STRATEGIES.ABORT,
      error: error,
      reason: 'Operation aborted'
    };
  }

  /**
   * Execute ignore strategy
   * @param {Error} error - The error
   * @param {Object} strategy - Ignore strategy configuration
   * @param {Object} context - Error context
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Ignore result
   */
  async executeIgnoreStrategy(error, strategy, context, options) {
    return {
      success: true,
      strategy: RECOVERY_STRATEGIES.IGNORE,
      reason: 'Error ignored'
    };
  }

  /**
   * Circuit breaker management
   */
  
  /**
   * Get circuit breaker key for context
   * @param {Object} context - Error context
   * @returns {string} Circuit breaker key
   */
  getCircuitBreakerKey(context) {
    return context.operation || context.source || 'default';
  }

  /**
   * Check if circuit breaker is open
   * @param {string} key - Circuit breaker key
   * @returns {boolean} True if circuit breaker is open
   */
  isCircuitBreakerOpen(key) {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) return false;
    
    if (breaker.state === CIRCUIT_STATES.OPEN) {
      // Check if reset timeout has passed
      if (Date.now() - breaker.lastFailureTime > this.options.circuitBreakerResetTimeout) {
        breaker.state = CIRCUIT_STATES.HALF_OPEN;
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Update circuit breaker state
   * @param {string} key - Circuit breaker key
   * @param {boolean} success - Whether operation succeeded
   */
  updateCircuitBreaker(key, success) {
    let breaker = this.circuitBreakers.get(key);
    
    if (!breaker) {
      breaker = {
        state: CIRCUIT_STATES.CLOSED,
        failureCount: 0,
        lastFailureTime: 0
      };
      this.circuitBreakers.set(key, breaker);
    }
    
    if (success) {
      breaker.failureCount = 0;
      breaker.state = CIRCUIT_STATES.CLOSED;
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failureCount >= this.options.circuitBreakerThreshold) {
        breaker.state = CIRCUIT_STATES.OPEN;
        this.metrics.circuitBreakerTrips++;
      }
    }
  }

  /**
   * Handle circuit breaker open state
   * @param {Error} error - The error
   * @param {Object} context - Error context
   * @returns {Object} Circuit breaker open result
   */
  handleCircuitBreakerOpen(error, context) {
    return {
      success: false,
      error: error,
      reason: 'Circuit breaker is open',
      circuitBreakerOpen: true,
      context: context,
      timestamp: Date.now()
    };
  }

  /**
   * Utility methods
   */
  
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log error with classification and context
   * @param {Error} error - The error
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @private
   */
  logError(error, classification, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      classification: classification,
      context: context
    };
    
    // Log to console with appropriate level
    switch (classification.severity) {
      case ERROR_SEVERITY.CRITICAL:
        console.error('CRITICAL ERROR:', logEntry);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error('HIGH SEVERITY ERROR:', logEntry);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn('MEDIUM SEVERITY ERROR:', logEntry);
        break;
      case ERROR_SEVERITY.LOW:
        console.info('LOW SEVERITY ERROR:', logEntry);
        break;
      default:
        console.log('ERROR:', logEntry);
    }
  }

  /**
   * Update error metrics
   * @param {Object} classification - Error classification
   * @private
   */
  updateMetrics(classification) {
    this.metrics.totalErrors++;
    
    // Update error counts by type
    const typeCount = this.metrics.errorsByType.get(classification.type) || 0;
    this.metrics.errorsByType.set(classification.type, typeCount + 1);
    
    // Update error counts by severity
    const severityCount = this.metrics.errorsBySeverity.get(classification.severity) || 0;
    this.metrics.errorsBySeverity.set(classification.severity, severityCount + 1);
  }

  /**
   * Record error in history
   * @param {Error} error - The error
   * @param {Object} classification - Error classification
   * @param {Object} context - Error context
   * @param {Object} recovery - Recovery result
   * @private
   */
  recordError(error, classification, context, recovery) {
    const errorRecord = {
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      classification: classification,
      context: context,
      recovery: recovery
    };
    
    this.errorHistory.push(errorRecord);
    
    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }
  }

  /**
   * Execute a function with error handling, recovery, and logging
   * Extracted from ApplicationBootstrap.safeExecute()
   * @param {string} phase - Name of the initialization phase
   * @param {Function} fn - Function to execute
   * @param {Object} options - Execution options
   * @returns {Promise<any>} Result of the function execution
   */
  async safeExecute(phase, fn, options = {}) {
    const { 
      allowRecovery = true, 
      allowDegradation = true, 
      maxRetries = 1,
      context = {},
      timeout = 30000 // 30 second timeout
    } = options;

    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        // Log phase start
        if (this.options.enableLogging) {
          console.info(`Starting phase: ${phase}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
        }
        const startTime = performance.now();
        
        // Add timeout handling
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Phase ${phase} timed out after ${timeout}ms`)), timeout);
        });
        
        const result = await Promise.race([fn(), timeoutPromise]);
        
        const duration = performance.now() - startTime;
        if (this.options.enableLogging) {
          console.info(`Completed phase: ${phase}`, { duration });
        }
        return result; // Success, exit retry loop
        
      } catch (error) {
        if (this.options.enableLogging) {
          console.error(`Failed phase: ${phase}`, { 
            error: error.message, 
            stack: error.stack,
            retryCount,
            maxRetries
          });
        }
        
        // Emit error event for monitoring (if globalEventBus is available)
        if (typeof window !== 'undefined' && window.globalEventBus) {
          window.globalEventBus.emit('app:bootstrapError', { 
            error, 
            context: { phase, retryCount, ...context } 
          });
        }
        
        // Attempt recovery if enabled and we haven't exceeded max retries
        if (allowRecovery && retryCount < maxRetries) {
          const recoverySuccessful = await this.attemptErrorRecovery(error, phase, context);
          if (recoverySuccessful) {
            if (this.options.enableLogging) {
              console.info(`Recovery successful for phase: ${phase}`);
            }
            retryCount++;
            continue; // Retry the phase
          }
        }
        
        // If recovery failed or not allowed, try graceful degradation
        if (allowDegradation) {
          const degradationSuccessful = await this.gracefulDegradation(phase, error);
          if (degradationSuccessful) {
            if (this.options.enableLogging) {
              console.warn(`Phase ${phase} continuing in degraded mode`);
            }
            return null; // Continue with degraded functionality
          }
        }
        
        // If all recovery attempts failed, throw the error
        throw error;
      }
    }
  }

  /**
   * Attempt error recovery with fallback strategies
   * Extracted from ApplicationBootstrap.attemptErrorRecovery()
   * @param {Error} error - The error that occurred
   * @param {string} phase - The phase where the error occurred
   * @param {Object} context - Additional context about the error
   * @returns {boolean} - Whether recovery was successful
   */
  async attemptErrorRecovery(error, phase, context = {}) {
    if (this.options.enableLogging) {
      console.warn(`Attempting error recovery for phase: ${phase}`, {
        error: error.message,
        context
      });
    }

    try {
      switch (phase) {
        case 'core module initialization':
          return await this.recoverFromModuleInitError(error, context);
        
        case 'data loading':
          return await this.recoverFromDataLoadingError(error, context);
        
        case 'map system':
          return await this.recoverFromMapSystemError(error, context);
        
        case 'UI components':
          return await this.recoverFromUIError(error, context);
        
        default:
          if (this.options.enableLogging) {
            console.warn(`No specific recovery strategy for phase: ${phase}`);
          }
          return false;
      }
    } catch (recoveryError) {
      if (this.options.enableLogging) {
        console.error('Error recovery failed', {
          originalError: error.message,
          recoveryError: recoveryError.message,
          phase
        });
      }
      return false;
    }
  }

  /**
   * Recover from module initialization errors
   * @param {Error} error - The error that occurred
   * @param {Object} context - Error context
   * @returns {boolean} - Whether recovery was successful
   */
  async recoverFromModuleInitError(error, context) {
    if (this.options.enableLogging) {
      console.info('Attempting module initialization recovery...');
    }
    
    // Try to reinitialize failed modules with fallback strategies
    const failedModule = context.moduleName;
    if (failedModule) {
      try {
        // Wait a bit before retry
        await this.sleep(1000);
        
        // Try to reimport the module using absolute path (consistent with ApplicationBootstrap)
        const module = await import(`/dist/modules/${failedModule}.js`);
        const singletonName = failedModule.charAt(0).toLowerCase() + failedModule.slice(1);
        const moduleInstance = module[singletonName] || module.default;
        
        if (moduleInstance && typeof moduleInstance.init === 'function') {
          await moduleInstance.init();
          if (this.options.enableLogging) {
            console.info(`Successfully recovered module: ${failedModule}`);
          }
          return true;
        }
      } catch (retryError) {
        if (this.options.enableLogging) {
          console.warn(`Module recovery failed for ${failedModule}`, {
            retryError: retryError.message
          });
        }
      }
    }
    
    return false;
  }

  /**
   * Recover from data loading errors
   * @param {Error} error - The error that occurred
   * @param {Object} context - Error context
   * @returns {boolean} - Whether recovery was successful
   */
  async recoverFromDataLoadingError(error, context) {
    if (this.options.enableLogging) {
      console.info('Attempting data loading recovery...');
    }
    
    try {
      // Try to load data with reduced functionality
      const { DataLoadingOrchestrator } = await import('/dist/modules/DataLoadingOrchestrator.js');
      const orchestrator = new DataLoadingOrchestrator();
      
      if (typeof orchestrator.init === 'function') {
        await orchestrator.init();
        if (this.options.enableLogging) {
          console.info('Data loading recovery successful');
        }
        return true;
      }
    } catch (recoveryError) {
      if (this.options.enableLogging) {
        console.warn('Data loading recovery failed', {
          recoveryError: recoveryError.message
        });
      }
    }
    
    return false;
  }

  /**
   * Recover from map system errors
   * @param {Error} error - The error that occurred
   * @param {Object} context - Error context
   * @returns {boolean} - Whether recovery was successful
   */
  async recoverFromMapSystemError(error, context) {
    if (this.options.enableLogging) {
      console.info('Attempting map system recovery...');
    }
    
    try {
      // Try to reinitialize map with fallback configuration
      const { mapManager } = await import('/dist/modules/MapManager.js');
      if (mapManager && typeof mapManager.recover === 'function') {
        await mapManager.recover();
        if (this.options.enableLogging) {
          console.info('Map system recovery successful');
        }
        return true;
      }
    } catch (recoveryError) {
      if (this.options.enableLogging) {
        console.warn('Map system recovery failed', {
          recoveryError: recoveryError.message
        });
      }
    }
    
    return false;
  }

  /**
   * Recover from UI component errors
   * @param {Error} error - The error that occurred
   * @param {Object} context - Error context
   * @returns {boolean} - Whether recovery was successful
   */
  async recoverFromUIError(error, context) {
    if (this.options.enableLogging) {
      console.info('Attempting UI recovery...');
    }
    
    try {
      // Try to reinitialize UI components
      const { collapsibleManager } = await import('/dist/modules/CollapsibleManager.js');
      if (collapsibleManager && typeof collapsibleManager.recover === 'function') {
        await collapsibleManager.recover();
        if (this.options.enableLogging) {
          console.info('UI recovery successful');
        }
        return true;
      }
    } catch (recoveryError) {
      if (this.options.enableLogging) {
        console.warn('UI recovery failed', {
          recoveryError: recoveryError.message
        });
      }
    }
    
    return false;
  }

  /**
   * Graceful degradation - continue with reduced functionality
   * Extracted from ApplicationBootstrap.gracefulDegradation()
   * @param {string} phase - The phase that failed
   * @param {Error} error - The error that occurred
   * @returns {boolean} - Whether degradation was successful
   */
  async gracefulDegradation(phase, error) {
    if (this.options.enableLogging) {
      console.warn(`Entering graceful degradation mode for phase: ${phase}`, {
        error: error.message
      });
    }

    // Set a flag to indicate degraded mode (if stateManager is available)
    if (typeof window !== 'undefined' && window.stateManager) {
      window.stateManager.set('degradedMode', true);
      window.stateManager.set('degradedPhase', phase);
      window.stateManager.set('degradedError', error.message);
    }
    
    // Emit event for other components to handle degraded mode (if globalEventBus is available)
    if (typeof window !== 'undefined' && window.globalEventBus) {
      window.globalEventBus.emit('app:degradedMode', { phase, error });
    }
    
    // Show user notification about degraded mode
    this.showDegradedModeNotification(phase, error);
    
    // Continue with basic functionality
    if (this.options.enableLogging) {
      console.info('Application continuing in degraded mode');
    }
    return true;
  }

  /**
   * Show user notification about degraded mode
   * Extracted from ApplicationBootstrap.showDegradedModeNotification()
   * @param {string} phase - The phase that failed
   * @param {Error} error - The error that occurred
   */
  showDegradedModeNotification(phase, error) {
    try {
      // Create a user-friendly notification
      const notification = document.createElement('div');
      notification.className = 'degraded-mode-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b35;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      `;
      
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Limited Functionality</div>
        <div>Some features may not be available due to a technical issue.</div>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
            Dismiss
          </button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
      
    } catch (notificationError) {
      if (this.options.enableLogging) {
        console.warn('Failed to show degraded mode notification', {
          notificationError: notificationError.message
        });
      }
    }
  }

  /**
   * Public API methods
   */
  
  /**
   * Get error metrics
   * @returns {Object} Error metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorHistory: this.errorHistory.length,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([key, breaker]) => ({
        key,
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime
      }))
    };
  }

  /**
   * Get error history
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} Error history
   */
  getErrorHistory(limit = 50) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      circuitBreakerTrips: 0
    };
  }

  /**
   * Set recovery strategy for error type
   * @param {string} errorType - Error type
   * @param {Object} strategy - Recovery strategy
   */
  setRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Get recovery strategy for error type
   * @param {string} errorType - Error type
   * @returns {Object} Recovery strategy
   */
  getRecoveryStrategy(errorType) {
    return this.recoveryStrategies.get(errorType);
  }

  /**
   * Reset circuit breaker for key
   * @param {string} key - Circuit breaker key
   */
  resetCircuitBreaker(key) {
    const breaker = this.circuitBreakers.get(key);
    if (breaker) {
      breaker.state = CIRCUIT_STATES.CLOSED;
      breaker.failureCount = 0;
      breaker.lastFailureTime = 0;
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    for (const [key, breaker] of this.circuitBreakers) {
      breaker.state = CIRCUIT_STATES.CLOSED;
      breaker.failureCount = 0;
      breaker.lastFailureTime = 0;
    }
  }

  /**
   * Check network connectivity and handle offline scenarios
   * Extracted from ApplicationBootstrap.checkNetworkConnectivity()
   * @returns {Promise<boolean>} True if network is available
   */
  async checkNetworkConnectivity() {
    try {
      // Simple connectivity check
      const { environmentConfig } = await import('/dist/modules/EnvironmentConfig.js');
      const faviconPath = environmentConfig.getFaviconPath();
      const response = await fetch(faviconPath, { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      if (this.options.enableLogging) {
        console.warn('Network connectivity check failed', {
          error: error.message
        });
      }
      return false;
    }
  }

  /**
   * Handle network-related errors with retry logic
   * Extracted from ApplicationBootstrap.handleNetworkError()
   * @param {Error} error - The network error
   * @param {string} operation - The operation that failed
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<boolean>} True if retry should be attempted
   */
  async handleNetworkError(error, operation, maxRetries = 3) {
    if (this.options.enableLogging) {
      console.warn(`Network error in ${operation}`, {
        error: error.message,
        maxRetries
      });
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
        
        // Check connectivity before retry
        const isOnline = await this.checkNetworkConnectivity();
        if (!isOnline) {
          if (this.options.enableLogging) {
            console.warn(`Still offline, attempt ${attempt}/${maxRetries}`);
          }
          continue;
        }
        
        if (this.options.enableLogging) {
          console.info(`Retrying ${operation}, attempt ${attempt}/${maxRetries}`);
        }
        return true; // Indicate retry should be attempted
        
      } catch (retryError) {
        if (this.options.enableLogging) {
          console.warn(`Retry attempt ${attempt} failed for ${operation}`, {
            retryError: retryError.message
          });
        }
      }
    }
    
    // All retries failed
    if (this.options.enableLogging) {
      console.error(`All retry attempts failed for ${operation}`);
    }
    return false;
  }

  /**
   * Show offline notification to user
   * Extracted from ApplicationBootstrap.showOfflineNotification()
   */
  showOfflineNotification() {
    try {
      // Remove existing offline notification
      const existing = document.querySelector('.offline-notification');
      if (existing) {
        existing.remove();
      }
      
      const notification = document.createElement('div');
      notification.className = 'offline-notification';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #ff6b35;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      notification.innerHTML = `
        <span>📡</span>
        <span>You're offline. Some features may not be available.</span>
      `;
      
      document.body.appendChild(notification);
      
    } catch (notificationError) {
      if (this.options.enableLogging) {
        console.warn('Failed to show offline notification', {
          notificationError: notificationError.message
        });
      }
    }
  }
}

/**
 * Create a singleton instance of UnifiedErrorHandler
 * @param {Object} options - Configuration options
 * @returns {UnifiedErrorHandler} Singleton instance
 */
export function createUnifiedErrorHandler(options = {}) {
  if (!window.unifiedErrorHandler) {
    window.unifiedErrorHandler = new UnifiedErrorHandler(options);
  }
  return window.unifiedErrorHandler;
}

/**
 * Get the singleton instance of UnifiedErrorHandler
 * @returns {UnifiedErrorHandler} Singleton instance
 */
export function getUnifiedErrorHandler() {
  if (!window.unifiedErrorHandler) {
    window.unifiedErrorHandler = new UnifiedErrorHandler();
  }
  return window.unifiedErrorHandler;
}

// Export default instance
export default UnifiedErrorHandler;
