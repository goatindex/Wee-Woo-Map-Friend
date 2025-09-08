/**
 * @module modules/ComponentErrorBoundary
 * Component-specific error boundary system for WeeWoo Map Friend
 * Provides error isolation, recovery strategies, and graceful degradation for components
 *
 * @fileoverview Component error boundary service for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { IEventBus } from './DependencyContainer.js';
import { BaseService } from './BaseService.js';
import { logger } from './StructuredLogger.js';
import { errorBoundary } from './ErrorBoundary.js';
import { Component, ComponentStatus } from './ComponentCommunication.js';
import { UnifiedErrorHandler } from './UnifiedErrorHandler.js';

/**
 * Component error boundary interface for error handling and recovery
 * Provides comprehensive error management for UI components
 * 
 * @typedef {Object} IComponentErrorBoundary
 * @property {function(): Promise<void>} initialize - Initialize error boundary system
 * @property {function(): Promise<void>} cleanup - Cleanup error boundary resources
 * @property {function(Component): Component} wrapComponent - Wrap component with error boundary
 * @property {function(Component, Error, string): Promise<void>} handleComponentError - Handle component errors
 * @property {function(Component): Promise<boolean>} recoverComponent - Attempt component recovery
 * @property {function(Component): void} isolateComponent - Isolate failing component
 * @property {function(string): ComponentError[]} getComponentErrorHistory - Get error history for component
 * @property {function(): ErrorStatistics} getErrorStatistics - Get overall error statistics
 * @property {function(string): void} clearComponentErrors - Clear errors for component
 * @property {function(string): boolean} isComponentIsolated - Check if component is isolated
 * @property {function(): string[]} getIsolatedComponents - Get list of isolated components
 * 
 * @example
 * // Wrap a component:
 * const wrappedComponent = errorBoundary.wrapComponent(myComponent);
 * 
 * // Handle errors:
 * await errorBoundary.handleComponentError(component, error, 'user-action');
 * 
 * @dependencies
 * - Used by: All UI components for error handling
 * - Implements: ComponentErrorBoundary class
 */

/**
 * Component error data structure for tracking component failures
 * 
 * @typedef {Object} ComponentError
 * @property {string} id - Unique error identifier
 * @property {string} componentId - ID of the component that failed
 * @property {string} componentName - Human-readable component name
 * @property {Error} error - The actual error object
 * @property {string} [context] - Optional context where error occurred
 * @property {number} timestamp - When the error occurred (Unix timestamp)
 * @property {number} recoveryAttempts - Number of recovery attempts made
 * @property {boolean} isRecovered - Whether the component was successfully recovered
 * @property {string} stackTrace - Error stack trace
 * @property {Record<string, any>} metadata - Additional error metadata
 */

/**
 * Error statistics data structure for monitoring component health
 * 
 * @typedef {Object} ErrorStatistics
 * @property {number} totalErrors - Total number of errors across all components
 * @property {Map<string, number>} errorsByComponent - Error count per component
 * @property {Map<string, number>} errorsByType - Error count by error type
 * @property {number} recoveryRate - Percentage of successful recoveries
 * @property {number} isolationRate - Percentage of components that were isolated
 * @property {number} averageRecoveryTime - Average time to recover components (ms)
 * @property {number} lastErrorTime - Timestamp of most recent error
 */

/**
 * Recovery strategy interface for component error recovery
 * 
 * @typedef {Object} RecoveryStrategy
 * @property {string} name - Name of the recovery strategy
 * @property {function(Error, Component): boolean} canHandle - Check if strategy can handle error
 * @property {function(Component, Error): Promise<boolean>} recover - Attempt to recover component
 * @property {number} priority - Priority level (higher = more important)
 */

/**
 * @class ComponentErrorBoundary
 * @implements {IComponentErrorBoundary}
 * Manages error boundaries for individual components, providing isolation and recovery.
 */
@injectable()
export class ComponentErrorBoundary extends BaseService {
  constructor(eventBus, globalErrorBoundary, unifiedErrorHandler) {
    super();
    this.eventBus = eventBus;
    this.globalErrorBoundary = globalErrorBoundary;
    this.unifiedErrorHandler = unifiedErrorHandler;
    this.logger = logger.createChild({ module: 'ComponentErrorBoundary' });
    this.componentErrors = new Map();
    this.isolatedComponents = new Set();
    this.recoveryStrategies = [];
    this.errorStatistics = {
      totalErrors: 0,
      errorsByComponent: new Map(),
      errorsByType: new Map(),
      recoveryRate: 0,
      isolationRate: 0,
      averageRecoveryTime: 0,
      lastErrorTime: 0
    };
    this.setupRecoveryStrategies();
  }

  /**
   * Initializes the ComponentErrorBoundary service.
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await super.initialize();
    this.logger.info('ComponentErrorBoundary initialized');
  }

  /**
   * Wraps a component with error boundary functionality.
   * @param {Component} component - The component to wrap.
   * @returns {Component} The wrapped component.
   */
  wrapComponent(component) {
    const originalEmit = component.emit.bind(component);
    const originalInitialize = component.initialize.bind(component);
    const originalCleanup = component.cleanup.bind(component);

    // Wrap emit method
    component.emit = async (event: string, data?: any) => {
      try {
        originalEmit(event, data);
      } catch (error) {
        await this.handleComponentError(component, error as Error, 'emit');
      }
    };

    // Wrap initialize method
    component.initialize = async () => {
      try {
        await originalInitialize();
      } catch (error) {
        await this.handleComponentError(component, error as Error, 'initialize');
        throw error; // Re-throw to maintain error propagation
      }
    };

    // Wrap cleanup method
    component.cleanup = async () => {
      try {
        await originalCleanup();
      } catch (error) {
        await this.handleComponentError(component, error as Error, 'cleanup');
        // Don't re-throw cleanup errors to prevent cascade failures
      }
    };

    this.logger.debug('Component wrapped with error boundary', {
      componentId: component.id,
      componentName: component.name
    });

    return component;
  }

  /**
   * Handles an error that occurred in a component.
   * @param {Component} component - The component that encountered the error.
   * @param {Error} error - The error that occurred.
   * @param {string} [context] - Additional context about where the error occurred.
   */
  async handleComponentError(component, error, context) {
    // Use UnifiedErrorHandler for error processing
    const result = await this.unifiedErrorHandler.handleError(error, {
      component: component.id,
      operation: context || 'component_operation',
      userId: null,
      sessionId: null,
      metadata: {
        componentName: component.name,
        componentType: component.type,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });

    // Create component error record for backward compatibility
    const componentError: ComponentError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      componentId: component.id,
      componentName: component.name,
      error,
      context,
      timestamp: Date.now(),
      recoveryAttempts: 0,
      isRecovered: result.success || false,
      stackTrace: error.stack || '',
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        componentType: component.type,
        unifiedHandlerResult: result
      }
    };

    // Store error for backward compatibility
    if (!this.componentErrors.has(component.id)) {
      this.componentErrors.set(component.id, []);
    }
    this.componentErrors.get(component.id)!.push(componentError);

    // Update statistics
    this.updateErrorStatistics(componentError);

    // Emit error event
    this.eventBus.emit('component:error:occurred', {
      componentId: component.id,
      component: component,
      error: componentError,
      statistics: this.errorStatistics,
      unifiedHandlerResult: result
    });

    // Check if component should be isolated
    this.checkIsolationThreshold(component);
  }

  /**
   * Attempts to recover a component from an error.
   * @param {Component} component - The component to recover.
   * @returns {Promise<boolean>} True if recovery was successful.
   */
  async recoverComponent(component) {
    const componentErrors = this.componentErrors.get(component.id) || [];
    const latestError = componentErrors[componentErrors.length - 1];
    
    if (!latestError) {
      this.logger.warn('No errors found for component recovery', { componentId: component.id });
      return false;
    }

    try {
      this.logger.info('Attempting component recovery', {
        componentId: component.id,
        componentName: component.name,
        errorId: latestError.id,
        recoveryAttempts: latestError.recoveryAttempts
      });

      // Find appropriate recovery strategy
      const strategy = this.recoveryStrategies.find(s => s.canHandle(latestError.error, component));
      
      if (!strategy) {
        this.logger.warn('No recovery strategy found for component', {
          componentId: component.id,
          errorType: latestError.error.constructor.name
        });
        return false;
      }

      // Attempt recovery
      const recoveryStartTime = Date.now();
      const recovered = await strategy.recover(component, latestError.error);
      const recoveryTime = Date.now() - recoveryStartTime;

      latestError.recoveryAttempts++;
      latestError.isRecovered = recovered;

      if (recovered) {
        this.logger.info('Component recovery successful', {
          componentId: component.id,
          componentName: component.name,
          strategy: strategy.name,
          recoveryTime,
          recoveryAttempts: latestError.recoveryAttempts
        });

        // Update statistics
        this.updateRecoveryStatistics(recoveryTime);

        // Emit recovery event
        this.eventBus.emit('component:error:recovered', {
          componentId: component.id,
          component: component,
          error: latestError,
          strategy: strategy.name,
          recoveryTime
        });

        // Remove from isolated components if it was isolated
        this.isolatedComponents.delete(component.id);

      } else {
        this.logger.warn('Component recovery failed', {
          componentId: component.id,
          componentName: component.name,
          strategy: strategy.name,
          recoveryAttempts: latestError.recoveryAttempts
        });
      }

      return recovered;

    } catch (recoveryError) {
      this.globalErrorBoundary.catch(recoveryError, {
        context: 'ComponentErrorBoundary.recoverComponent',
        componentId: component.id,
        originalError: latestError.error.message
      });

      this.logger.error('Component recovery attempt failed', {
        componentId: component.id,
        componentName: component.name,
        recoveryError: recoveryError.message,
        originalError: latestError.error.message
      });

      return false;
    }
  }

  /**
   * Isolates a component to prevent error propagation.
   * @param {Component} component - The component to isolate.
   */
  isolateComponent(component) {
    if (this.isolatedComponents.has(component.id)) {
      this.logger.warn('Component already isolated', { componentId: component.id });
      return;
    }

    try {
      // Add to isolated components
      this.isolatedComponents.add(component.id);

      // Disable component functionality
      component.hide?.();
      
      // Mark component as unhealthy
      if (component.status) {
        component.status.health = 'unhealthy';
      }

      this.logger.info('Component isolated', {
        componentId: component.id,
        componentName: component.name,
        totalIsolated: this.isolatedComponents.size
      });

      // Emit isolation event
      this.eventBus.emit('component:error:isolated', {
        componentId: component.id,
        component: component,
        totalIsolated: this.isolatedComponents.size
      });

    } catch (error) {
      this.globalErrorBoundary.catch(error, {
        context: 'ComponentErrorBoundary.isolateComponent',
        componentId: component.id
      });
      this.logger.error('Failed to isolate component', {
        componentId: component.id,
        error: error.message
      });
    }
  }

  /**
   * Gets the error history for a specific component.
   * @param {string} componentId - The component ID.
   * @returns {ComponentError[]} Array of errors for the component.
   */
  getComponentErrorHistory(componentId: string): ComponentError[] {
    return this.componentErrors.get(componentId) || [];
  }

  /**
   * Gets error statistics across all components.
   * @returns {ErrorStatistics} Current error statistics.
   */
  getErrorStatistics(): ErrorStatistics {
    return { ...this.errorStatistics };
  }

  /**
   * Clears error history for a specific component.
   * @param {string} componentId - The component ID.
   */
  clearComponentErrors(componentId: string): void {
    this.componentErrors.delete(componentId);
    this.isolatedComponents.delete(componentId);
    
    this.logger.info('Component errors cleared', { componentId });
    
    // Emit clear event
    this.eventBus.emit('component:error:cleared', { componentId });
  }

  /**
   * Checks if a component is currently isolated.
   * @param {string} componentId - The component ID.
   * @returns {boolean} True if the component is isolated.
   */
  isComponentIsolated(componentId: string): boolean {
    return this.isolatedComponents.has(componentId);
  }

  /**
   * Gets all currently isolated components.
   * @returns {string[]} Array of isolated component IDs.
   */
  getIsolatedComponents(): string[] {
    return Array.from(this.isolatedComponents);
  }

  /**
   * Sets up recovery strategies for different types of errors.
   * @private
   */
  private setupRecoveryStrategies(): void {
    // Re-initialization strategy
    this.recoveryStrategies.push({
      name: 'reinitialize',
      priority: 1,
      canHandle: (error, component) => {
        return error.name === 'TypeError' || 
               error.message.includes('not defined') ||
               error.message.includes('Cannot read property');
      },
      recover: async (component) => {
        try {
          await component.initialize();
          return true;
        } catch {
          return false;
        }
      }
    });

    // State reset strategy
    this.recoveryStrategies.push({
      name: 'resetState',
      priority: 2,
      canHandle: (error, component) => {
        return error.message.includes('state') || 
               error.message.includes('undefined');
      },
      recover: async (component) => {
        try {
          if (component.update) {
            await component.update({});
          }
          return true;
        } catch {
          return false;
        }
      }
    });

    // DOM refresh strategy
    this.recoveryStrategies.push({
      name: 'refreshDOM',
      priority: 3,
      canHandle: (error, component) => {
        return error.message.includes('DOM') || 
               error.message.includes('element') ||
               error.message.includes('container');
      },
      recover: async (component) => {
        try {
          if (component.refresh) {
            await component.refresh();
          }
          return true;
        } catch {
          return false;
        }
      }
    });

    // Sort strategies by priority
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);

    this.logger.info('Recovery strategies configured', {
      strategyCount: this.recoveryStrategies.length,
      strategies: this.recoveryStrategies.map(s => s.name)
    });
  }

  /**
   * Attempts to recover a component using available strategies.
   * @private
   * @param {Component} component - The component to recover.
   * @param {ComponentError} error - The error that occurred.
   */
  private async attemptRecovery(component, error) {
    // Don't attempt recovery if component is already isolated
    if (this.isolatedComponents.has(component.id)) {
      return;
    }

    // Don't attempt recovery if too many errors
    const errorCount = this.componentErrors.get(component.id)?.length || 0;
    if (errorCount > 5) {
      this.logger.warn('Too many errors for component, skipping recovery', {
        componentId: component.id,
        errorCount
      });
      return;
    }

    // Attempt recovery
    const recovered = await this.recoverComponent(component);
    
    if (!recovered) {
      this.logger.warn('Component recovery failed, considering isolation', {
        componentId: component.id,
        errorCount
      });
    }
  }

  /**
   * Checks if a component should be isolated based on error threshold.
   * @private
   * @param {Component} component - The component to check.
   */
  private checkIsolationThreshold(component) {
    const errorCount = this.componentErrors.get(component.id)?.length || 0;
    const recentErrors = this.componentErrors.get(component.id)?.filter(
      e => Date.now() - e.timestamp < 60000 // Last minute
    ).length || 0;

    // Isolate if too many errors or too many recent errors
    if (errorCount > 10 || recentErrors > 3) {
      this.isolateComponent(component);
    }
  }

  /**
   * Updates error statistics with a new error.
   * @private
   * @param {ComponentError} error - The error to add to statistics.
   */
  private updateErrorStatistics(error) {
    this.errorStatistics.totalErrors++;
    this.errorStatistics.lastErrorTime = error.timestamp;

    // Update errors by component
    const componentCount = this.errorStatistics.errorsByComponent.get(error.componentId) || 0;
    this.errorStatistics.errorsByComponent.set(error.componentId, componentCount + 1);

    // Update errors by type
    const errorType = error.error.constructor.name;
    const typeCount = this.errorStatistics.errorsByType.get(errorType) || 0;
    this.errorStatistics.errorsByType.set(errorType, typeCount + 1);

    // Update isolation rate
    this.errorStatistics.isolationRate = this.isolatedComponents.size / this.componentErrors.size;
  }

  /**
   * Updates recovery statistics.
   * @private
   * @param {number} recoveryTime - The time taken for recovery.
   */
  private updateRecoveryStatistics(recoveryTime: number): void {
    const totalRecovered = Array.from(this.componentErrors.values())
      .flat()
      .filter(e => e.isRecovered).length;
    
    this.errorStatistics.recoveryRate = totalRecovered / this.errorStatistics.totalErrors;
    
    // Update average recovery time
    const allRecoveryTimes = Array.from(this.componentErrors.values())
      .flat()
      .filter(e => e.isRecovered)
      .map(e => e.timestamp); // This would need to track actual recovery times
    
    if (allRecoveryTimes.length > 0) {
      this.errorStatistics.averageRecoveryTime = recoveryTime; // Simplified for now
    }
  }

  /**
   * Cleans up the ComponentErrorBoundary service.
   * @returns {Promise<void>}
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up ComponentErrorBoundary');

    try {
      // Clear all error data
      this.componentErrors.clear();
      this.isolatedComponents.clear();
      this.recoveryStrategies = [];

      // Reset statistics
      this.errorStatistics = {
        totalErrors: 0,
        errorsByComponent: new Map(),
        errorsByType: new Map(),
        recoveryRate: 0,
        isolationRate: 0,
        averageRecoveryTime: 0,
        lastErrorTime: 0
      };

      this.logger.info('ComponentErrorBoundary cleanup completed');
    } catch (error) {
      this.globalErrorBoundary.catch(error, { context: 'ComponentErrorBoundary.cleanup' });
      this.logger.error('ComponentErrorBoundary cleanup failed', { error: error.message });
    } finally {
      await super.cleanup();
    }
  }
}

// Export a singleton instance for direct use where DI is not yet fully integrated
export const componentErrorBoundary = new ComponentErrorBoundary(
  // These will be injected properly when used with DI container
  null as any, // eventBus
  errorBoundary
);
