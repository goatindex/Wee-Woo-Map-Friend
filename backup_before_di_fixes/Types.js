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
  ApplicationBootstrap: Symbol.for('ApplicationBootstrap'),
  DependencyContainer: Symbol.for('DependencyContainer'),
  
  // Configuration services
  ConfigService: Symbol.for('ConfigService'),
  EnvironmentService: Symbol.for('EnvironmentService'),
  
  // Data services
  // DataService: Symbol.for('DataService'), // Archived - not currently used
  DataValidator: Symbol.for('DataValidator'),
  ProgressiveDataLoader: Symbol.for('ProgressiveDataLoader'),
  PolygonLoader: Symbol.for('PolygonLoader'),
  AmbulanceLoader: Symbol.for('AmbulanceLoader'),
  PoliceLoader: Symbol.for('PoliceLoader'),
  LayerManager: Symbol.for('LayerManager'),
  MapManager: Symbol.for('MapManager'),
  
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
  StateManager: Symbol.for('StateManager'),
  
  // UI Management services
  ActiveListManager: Symbol.for('ActiveListManager'),
  ConfigurationManager: Symbol.for('ConfigurationManager'),
  StructuredLogger: Symbol.for('StructuredLogger'),
  EmphasisManager: Symbol.for('EmphasisManager'),
  LabelManager: Symbol.for('LabelManager'),
  TextFormatter: Symbol.for('TextFormatter'),
  
  // Utility services
  CoordinateConverter: Symbol.for('CoordinateConverter'),
  BaseService: Symbol.for('BaseService'),
  FeatureEnhancer: Symbol.for('FeatureEnhancer'),
  UtilityManager: Symbol.for('UtilityManager'),
  PathResolver: Symbol.for('PathResolver'),
  ErrorUI: Symbol.for('ErrorUI'),
  EnvironmentConfig: Symbol.for('EnvironmentConfig'),
  
  // Core modules
  MapManager: Symbol.for('MapManager'),
  DeviceManager: Symbol.for('DeviceManager'),
  DataLoadingOrchestrator: Symbol.for('DataLoadingOrchestrator')
};
