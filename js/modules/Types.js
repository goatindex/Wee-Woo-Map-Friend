/**
 * @module modules/Types
 * Service identifiers for dependency injection
 * Centralized type definitions for InversifyJS container
 * 
 * @fileoverview Service type identifiers for dependency injection
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

/**
 * Service identifiers for dependency injection
 */
export const TYPES = {
  // Core services
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
  ErrorBoundary: Symbol.for('ErrorBoundary'),
  
  // Configuration services
  ConfigService: Symbol.for('ConfigService'),
  EnvironmentService: Symbol.for('EnvironmentService'),
  
  // Data services
  // DataService: Symbol.for('DataService'), // Archived - not currently used
  DataValidator: Symbol.for('DataValidator'),
  ProgressiveDataLoader: Symbol.for('ProgressiveDataLoader'),
  
  // Component services
  ComponentCommunication: Symbol.for('ComponentCommunication'),
  ComponentLifecycleManager: Symbol.for('ComponentLifecycleManager'),
  ComponentErrorBoundary: Symbol.for('ComponentErrorBoundary'),
  ComponentMemoryManager: Symbol.for('ComponentMemoryManager'),
  ARIAService: Symbol.for('ARIAService'),
  
  // Map services
  RefactoredMapManager: Symbol.for('RefactoredMapManager'),
  RefactoredSidebarManager: Symbol.for('RefactoredSidebarManager'),
  RefactoredSearchManager: Symbol.for('RefactoredSearchManager'),
  
  // Platform services
  PlatformService: Symbol.for('PlatformService'),
  MobileComponentAdapter: Symbol.for('MobileComponentAdapter'),
  MobileUIOptimizer: Symbol.for('MobileUIOptimizer'),
  
  // Error handling services
  UnifiedErrorHandler: Symbol.for('UnifiedErrorHandler'),
  CircuitBreakerStrategy: Symbol.for('CircuitBreakerStrategy'),
  RetryStrategy: Symbol.for('RetryStrategy'),
  FallbackStrategy: Symbol.for('FallbackStrategy'),
  HealthCheckService: Symbol.for('HealthCheckService'),
  ErrorContext: Symbol.for('ErrorContext'),
  
  // State management
  StateManager: Symbol.for('StateManager')
};
