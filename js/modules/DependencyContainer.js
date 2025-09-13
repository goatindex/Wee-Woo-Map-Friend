/**
 * DependencyContainer - InversifyJS-based dependency injection system
 * Implements dependency injection with decorators and service bindings
 * 
 * @fileoverview Dependency injection container for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { Container } from 'inversify';
import { StructuredLogger } from './StructuredLogger.js';
import { EventBus } from './EventBus.js';
import { EnhancedEventBus } from './EnhancedEventBus.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';
import { ConfigService } from './ConfigService.js';
import { dataValidator } from './DataValidator.js';
import { EnvironmentService } from './EnvironmentService.js';
import { StateManager } from './StateManager.js';
import { ProgressiveDataLoader } from './ProgressiveDataLoader.js';
import { ComponentCommunication } from './ComponentCommunication.js';
import { ComponentLifecycleManager } from './ComponentLifecycleManager.js';
import { ComponentErrorBoundary } from './ComponentErrorBoundary.js';
import { ComponentMemoryManager } from './ComponentMemoryManager.js';
import { ARIAService } from './ARIAService.js';
import { RefactoredMapManager } from './RefactoredMapManager.js';
import { RefactoredSidebarManager } from './RefactoredSidebarManager.js';
import { RefactoredSearchManager } from './RefactoredSearchManager.js';
import { UnifiedErrorHandler } from './UnifiedErrorHandler.js';
import { CoordinateConverter } from './CoordinateConverter.js';
import { TextFormatter } from './TextFormatter.js';
import { PlatformService } from './PlatformService.js';
import { MobileComponentAdapter } from './MobileComponentAdapter.js';
import { MobileUIOptimizer } from './MobileUIOptimizer.js';
import { CircuitBreakerStrategy } from './CircuitBreakerStrategy.js';
import { RetryStrategy } from './RetryStrategy.js';
import { FallbackStrategy } from './FallbackStrategy.js';
import { HealthCheckService } from './HealthCheckService.js';
import { ErrorContext } from './ErrorContext.js';
import { ActiveListManager } from './ActiveListManager.js';
import { ConfigurationManager } from './ConfigurationManager.js';
import { EmphasisManager } from './EmphasisManager.js';
import { LabelManager } from './LabelManager.js';
import { FeatureEnhancer } from './FeatureEnhancer.js';
import { UtilityManager } from './UtilityManager.js';
import { PathResolver } from './PathResolver.js';
import { ErrorUI } from './ErrorUI.js';
import { EnvironmentConfig } from '/dist/modules/EnvironmentConfig.js';
import { DataValidator } from './DataValidator.js';
import { PolygonLoader } from './PolygonLoader.js';
import { AmbulanceLoader } from './AmbulanceLoader.js';
import { PoliceLoader } from './PoliceLoader.js';
import { LayerManager } from './LayerManager.js';
import { MapManager } from './MapManager.js';
import { DeviceManager } from './DeviceManager.js';
import { DataLoadingOrchestrator } from './DataLoadingOrchestrator.js';
// Service imports moved to methods to break circular dependencies
// import { DataService } from './DataService.js';

// TYPES moved to separate module to break circular dependencies

/**
 * Base service interface
 */
// BaseService moved to separate module to break circular dependencies

/**
 * Configuration service interface for managing application settings
 * Used by InversifyJS for dependency injection across the application
 * 
 * @typedef {Object} IConfigService
 * @property {function(string, any): any} get - Retrieve configuration value by key
 * @property {function(string, any): void} set - Set configuration value by key
 * @property {function(string): boolean} has - Check if configuration key exists
 * @property {function(): Record<string, any>} getAll - Get all configuration values
 * @property {function(): Promise<void>} load - Load configuration from storage
 * 
 * @example
 * // Used in dependency injection:
 * constructor(@inject(TYPES.ConfigService) private config: IConfigService) {}
 * 
 * @dependencies
 * - Used by: ApplicationBootstrap, StateManager, PlatformService
 * - Implements: ConfigService class
 */

/**
 * Event bus interface for application-wide event communication
 * Provides pub/sub pattern for loose coupling between components
 * 
 * @typedef {Object} IEventBus
 * @property {function(string, Function, Object): Function} on - Subscribe to event
 * @property {function(string, Function, Object): Function} once - Subscribe to event once
 * @property {function(string, Function): void} off - Unsubscribe from event
 * @property {function(string, any, any): Promise<any[]>} emit - Emit event asynchronously
 * @property {function(string, any, any): any[]} emitSync - Emit event synchronously
 * 
 * @example
 * // Subscribe to event:
 * eventBus.on('user:login', (data) => console.log('User logged in:', data));
 * 
 * // Emit event:
 * await eventBus.emit('user:login', { userId: 123 });
 * 
 * @dependencies
 * - Used by: All components for communication
 * - Implements: EnhancedEventBus class
 * - Related: StateManager, ComponentCommunication
 */

/**
 * Data service interface for managing GeoJSON data loading and caching
 * Handles data loading, caching, and update notifications
 * 
 * @typedef {Object} IDataService
 * @property {function(string): Promise<any[]>} loadData - Load data for specific category
 * @property {function(string[]): Promise<Map<string, any[]>>} loadDataBatch - Load multiple data categories
 * @property {function(string): any[]|null} getCachedData - Get cached data for category
 * @property {function(string): void} invalidateCache - Clear cache for category
 * @property {function(string, Function): Function} subscribeToDataUpdates - Subscribe to data updates
 * 
 * @example
 * // Load SES data:
 * const sesData = await dataService.loadData('ses');
 * 
 * // Subscribe to updates:
 * const unsubscribe = dataService.subscribeToDataUpdates('ses', (data) => {
 *   console.log('SES data updated:', data);
 * });
 * 
 * @dependencies
 * - Used by: MapManager, LayerManager, DataLoadingOrchestrator
 * - Implements: DataService class
 */

/**
 * State manager interface for centralized application state management
 * Provides reactive state updates and subscription system
 * 
 * @typedef {Object} IStateManager
 * @property {function(): any} getState - Get current application state
 * @property {function(any): void} setState - Set new application state
 * @property {function(string, Function): Function} subscribe - Subscribe to state changes
 * @property {function(any): void} dispatch - Dispatch state action
 * 
 * @example
 * // Get current state:
 * const currentState = stateManager.getState();
 * 
 * // Subscribe to changes:
 * const unsubscribe = stateManager.subscribe('map.zoom', (zoom) => {
 *   console.log('Map zoom changed to:', zoom);
 * });
 * 
 * @dependencies
 * - Used by: MapManager, SidebarManager, UIManager
 * - Implements: StateManager class
 */

/**
 * Platform service interface for device and platform detection
 * Provides platform-specific capabilities and feature detection
 * 
 * @typedef {Object} IPlatformService
 * @property {function(): string} getPlatform - Get current platform (web/ios/android)
 * @property {function(): any} getCapabilities - Get platform capabilities
 * @property {function(): boolean} isMobile - Check if running on mobile device
 * @property {function(): boolean} isDesktop - Check if running on desktop
 * @property {function(): boolean} isWeb - Check if running in web browser
 * 
 * @example
 * // Check platform:
 * if (platformService.isMobile()) {
 *   // Mobile-specific code
 * }
 * 
 * // Get capabilities:
 * const capabilities = platformService.getCapabilities();
 * 
 * @dependencies
 * - Used by: MobileComponentAdapter, MobileUIOptimizer, DeviceManager
 * - Implements: PlatformService class
 */

// Use the comprehensive ConfigService from ConfigService.js
// The ConfigService class is already imported and will be used directly


// DataService is now implemented in DataService.js


/**
 * Dependency container setup
 */
export class DependencyContainer {
  constructor() {
    this.container = new Container();
    this.initialized = false;
    this.setupBindings();
  }

  /**
   * Initialize the dependency container
   * This method is called by ApplicationBootstrap to complete the DI setup
   */
  initialize() {
    if (this.initialized) {
      console.log('[DependencyContainer] Already initialized');
      return;
    }

    try {
      console.log('[DependencyContainer] Initializing dependency container...');
      
      // Mark as initialized
      this.initialized = true;
      
      console.log('[DependencyContainer] Dependency container initialized successfully');
      return true;
    } catch (error) {
      console.error('[DependencyContainer] Failed to initialize:', error);
      this.initialized = false;
      throw error;
    }
  }

  setupBindings() {
    // Core services
    this.container.bind(TYPES.StructuredLogger).to(StructuredLogger).inSingletonScope();
    
    // Create logger instance for EnhancedEventBus
    const logger = new StructuredLogger();
    
    // Error handling services - MUST be bound before EnhancedEventBus creation
    this.container.bind(TYPES.UnifiedErrorHandler).to(UnifiedErrorHandler).inSingletonScope();
    
    // Create enhancedEventBus with container and logger to break circular dependency
    this.enhancedEventBus = new EnhancedEventBus({}, this.container, logger);
    this.container.bind(TYPES.EventBus).toConstantValue(this.enhancedEventBus);
    this.container.bind(TYPES.ErrorBoundary).to(ErrorBoundary).inSingletonScope();

    // Configuration services
    this.container.bind(TYPES.ConfigService).to(ConfigService).inSingletonScope();
    this.container.bind(TYPES.EnvironmentService).to(EnvironmentService).inSingletonScope();

    // Data services - temporarily disabled due to circular dependency
    // this.container.bind<IDataService>(TYPES.DataService).to(DataService).inSingletonScope();
    // DataValidator binding moved to setupBindings() method
    this.container.bind(TYPES.ProgressiveDataLoader).to(ProgressiveDataLoader).inSingletonScope();

    // State management
    this.container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();

    // Component communication services - enabled after circular dependency fix
    this.container.bind(TYPES.ComponentCommunication).to(ComponentCommunication).inSingletonScope();
    this.container.bind(TYPES.ComponentLifecycleManager).to(ComponentLifecycleManager).inSingletonScope();
    this.container.bind(TYPES.ComponentErrorBoundary).to(ComponentErrorBoundary).inSingletonScope();
    this.container.bind(TYPES.ComponentMemoryManager).to(ComponentMemoryManager).inSingletonScope();
    
    // Accessibility services - enabled after circular dependency fix
    this.container.bind(TYPES.ARIAService).to(ARIAService).inSingletonScope();
    
    // UI services - enabled after circular dependency fix
    this.container.bind(TYPES.RefactoredMapManager).to(RefactoredMapManager).inSingletonScope();
    this.container.bind(TYPES.RefactoredSidebarManager).to(RefactoredSidebarManager).inSingletonScope();
    this.container.bind(TYPES.RefactoredSearchManager).to(RefactoredSearchManager).inSingletonScope();
    
    // UI Management services
    this.container.bind(TYPES.ActiveListManager).to(ActiveListManager).inSingletonScope();
    this.container.bind(TYPES.ConfigurationManager).to(ConfigurationManager).inSingletonScope();
    this.container.bind(TYPES.EmphasisManager).to(EmphasisManager).inSingletonScope();
    this.container.bind(TYPES.LabelManager).to(LabelManager).inSingletonScope();
    
    // Utility services
    this.container.bind(TYPES.CoordinateConverter).to(CoordinateConverter).inSingletonScope();
    this.container.bind(TYPES.TextFormatter).to(TextFormatter).inSingletonScope();
    this.container.bind(TYPES.BaseService).to(BaseService).inSingletonScope();
    this.container.bind(TYPES.FeatureEnhancer).to(FeatureEnhancer).inSingletonScope();
    this.container.bind(TYPES.UtilityManager).to(UtilityManager).inSingletonScope();
    this.container.bind(TYPES.PathResolver).to(PathResolver).inSingletonScope();
    this.container.bind(TYPES.ErrorUI).to(ErrorUI).inSingletonScope();
    this.container.bind(TYPES.EnvironmentConfig).to(EnvironmentConfig).inSingletonScope();
    this.container.bind(TYPES.DataValidator).to(DataValidator).inSingletonScope();
    this.container.bind(TYPES.PolygonLoader).to(PolygonLoader).inSingletonScope();
    this.container.bind(TYPES.AmbulanceLoader).to(AmbulanceLoader).inSingletonScope();
    this.container.bind(TYPES.PoliceLoader).to(PoliceLoader).inSingletonScope();
    this.container.bind(TYPES.LayerManager).to(LayerManager).inSingletonScope();
    this.container.bind(TYPES.MapManager).to(MapManager).inSingletonScope();
    this.container.bind(TYPES.DeviceManager).to(DeviceManager).inSingletonScope();
    this.container.bind(TYPES.DataLoadingOrchestrator).to(DataLoadingOrchestrator).inSingletonScope();
    
    // Platform services - temporarily commented out to break circular dependencies
    this.container.bind(TYPES.PlatformService).to(PlatformService).inSingletonScope();
    this.container.bind(TYPES.MobileComponentAdapter).to(MobileComponentAdapter).inSingletonScope();
    this.container.bind(TYPES.MobileUIOptimizer).to(MobileUIOptimizer).inSingletonScope();
    
    // Error handling services - enabled after circular dependency fix
    // UnifiedErrorHandler moved to before EnhancedEventBus creation
    this.container.bind(TYPES.CircuitBreakerStrategy).to(CircuitBreakerStrategy).inSingletonScope();
    this.container.bind(TYPES.RetryStrategy).to(RetryStrategy).inSingletonScope();
    this.container.bind(TYPES.FallbackStrategy).to(FallbackStrategy).inSingletonScope();
    this.container.bind(TYPES.HealthCheckService).to(HealthCheckService).inSingletonScope();
    this.container.bind(TYPES.ErrorContext).to(ErrorContext).inSingletonScope();

    // Use direct logger calls since DependencyContainer doesn't extend BaseService
    const setupLogger = new StructuredLogger();
    setupLogger.info('Dependency container bindings configured');
  }

  /**
   * Get service instance with enhanced error reporting
   * @param {Symbol} serviceIdentifier - Service identifier
   * @returns {any} Service instance
   */
  get(serviceIdentifier) {
    const getLogger = new StructuredLogger();
    
    // Input validation
    if (serviceIdentifier === null || serviceIdentifier === undefined) {
      const error = new Error('Service identifier cannot be null or undefined');
      getLogger.error('Invalid service identifier provided to get()', {
        operation: 'get',
        serviceIdentifier: serviceIdentifier,
        recommendation: 'Provide a valid service identifier from TYPES'
      });
      
      // Emit error event for external monitoring
      this.enhancedEventBus.emit('dependency:error', {
        type: 'validation_error',
        operation: 'get',
        message: 'Service identifier cannot be null or undefined',
        context: { serviceIdentifier },
        severity: 'error',
        recoverable: false
      });
      
      throw error;
    }

    // Check if service is bound
    if (!this.container.isBound(serviceIdentifier)) {
      const availableServices = this.getAvailableServices();
      const error = new Error(`Service '${serviceIdentifier.toString()}' is not bound in container`);
      
      getLogger.error('Service not bound in container', {
        operation: 'get',
        serviceIdentifier: serviceIdentifier.toString(),
        availableServices: availableServices,
        recommendation: 'Check if service is properly bound in setupBindings()'
      });
      
      // Emit error event for external monitoring
      this.enhancedEventBus.emit('dependency:error', {
        type: 'service_not_found',
        operation: 'get',
        message: `Service '${serviceIdentifier.toString()}' is not bound in container`,
        context: { 
          serviceIdentifier: serviceIdentifier.toString(),
          availableServices: availableServices
        },
        severity: 'error',
        recoverable: false
      });
      
      throw error;
    }

    try {
      const service = this.container.get(serviceIdentifier);
      
      // Log successful service retrieval
      getLogger.debug('Service retrieved successfully', {
        operation: 'get',
        serviceIdentifier: serviceIdentifier.toString(),
        serviceType: service.constructor.name,
        isInitialized: service.initialized || false
      });
      
      return service;
    } catch (error) {
      // Enhanced error reporting for service resolution failures
      getLogger.error('Service resolution failed', {
        operation: 'get',
        serviceIdentifier: serviceIdentifier.toString(),
        error: error.message,
        stack: error.stack,
        recommendation: 'Check service dependencies and binding configuration'
      });
      
      // Emit error event for external monitoring
      this.enhancedEventBus.emit('dependency:error', {
        type: 'resolution_error',
        operation: 'get',
        message: `Service resolution failed: ${error.message}`,
        context: { 
          serviceIdentifier: serviceIdentifier.toString(),
          error: error.message
        },
        severity: 'error',
        recoverable: true
      });
      
      throw error;
    }
  }

  /**
   * Check if service is bound with enhanced error reporting
   * @param {Symbol} serviceIdentifier - Service identifier
   * @returns {boolean} True if bound
   */
  isBound(serviceIdentifier) {
    const isBoundLogger = new StructuredLogger();
    
    // Input validation
    if (serviceIdentifier === null || serviceIdentifier === undefined) {
      isBoundLogger.warn('Invalid service identifier provided to isBound()', {
        operation: 'isBound',
        serviceIdentifier: serviceIdentifier,
        recommendation: 'Provide a valid service identifier from TYPES'
      });
      return false;
    }

    const isBound = this.container.isBound(serviceIdentifier);
    
    // Log binding status for debugging
    isBoundLogger.debug('Service binding status checked', {
      operation: 'isBound',
      serviceIdentifier: serviceIdentifier.toString(),
      isBound: isBound
    });
    
    return isBound;
  }

  /**
   * Get list of available services for error reporting
   * @returns {Array<string>} List of available service identifiers
   */
  getAvailableServices() {
    const availableServices = [];
    
    // Check all TYPES for bound services
    for (const [key, value] of Object.entries(TYPES)) {
      if (this.container.isBound(value)) {
        availableServices.push(key);
      }
    }
    
    return availableServices;
  }

  /**
   * Get service binding information for debugging
   * @param {Symbol} serviceIdentifier - Service identifier
   * @returns {Object} Service binding information
   */
  getServiceInfo(serviceIdentifier) {
    if (serviceIdentifier === null || serviceIdentifier === undefined) {
      return {
        bound: false,
        error: 'Invalid service identifier',
        availableServices: this.getAvailableServices()
      };
    }

    const isBound = this.container.isBound(serviceIdentifier);
    let serviceInfo = {
      bound: isBound,
      identifier: serviceIdentifier.toString(),
      availableServices: this.getAvailableServices()
    };

    if (isBound) {
      try {
        const service = this.container.get(serviceIdentifier);
        serviceInfo.serviceType = service.constructor.name;
        serviceInfo.isInitialized = service.initialized || false;
        serviceInfo.hasInitializeMethod = typeof service.initialize === 'function';
        serviceInfo.hasCleanupMethod = typeof service.cleanup === 'function';
      } catch (error) {
        serviceInfo.error = error.message;
        serviceInfo.resolutionFailed = true;
      }
    }

    return serviceInfo;
  }

  /**
   * Get container statistics for monitoring
   * @returns {Object} Container statistics
   */
  getContainerStats() {
    const availableServices = this.getAvailableServices();
    const totalServices = Object.keys(TYPES).length;
    const boundServices = availableServices.length;
    const unboundServices = totalServices - boundServices;
    
    return {
      totalServices,
      boundServices,
      unboundServices,
      bindingRate: totalServices > 0 ? (boundServices / totalServices) * 100 : 0,
      availableServices,
      unboundServiceTypes: Object.keys(TYPES).filter(key => !availableServices.includes(key))
    };
  }

  /**
   * Initialize all services
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Use direct logger calls since DependencyContainer doesn't extend BaseService
    const initLogger = new StructuredLogger();
    initLogger.info('Initializing dependency container');

    // Initialize core services
    const configService = this.get(TYPES.ConfigService);
    await configService.initialize();

    const environmentService = this.get(TYPES.EnvironmentService);
    await environmentService.initialize();

    // const dataService = this.get<IDataService>(TYPES.DataService); // Archived - DataService not available
    // await dataService.initialize();

    const stateManager = this.get<IStateManager>(TYPES.StateManager);
    await stateManager.initialize();

    const platformService = this.get(TYPES.PlatformService);
    await platformService.initialize();

    // Initialize mobile services
    const mobileComponentAdapter = this.get(TYPES.MobileComponentAdapter);
    await mobileComponentAdapter.initialize();

    const mobileUIOptimizer = this.get(TYPES.MobileUIOptimizer);
    await mobileUIOptimizer.initialize();

    this.initialized = true;
    // Use direct logger calls since DependencyContainer doesn't extend BaseService
    initLogger.info('Dependency container initialized successfully');
  }

  /**
   * Cleanup all services
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Use direct logger calls since DependencyContainer doesn't extend BaseService
    const cleanupLogger = new StructuredLogger();
    cleanupLogger.info('Cleaning up dependency container');
    
    // Get all services and cleanup
    const services = [
      this.get(TYPES.ConfigService),
      this.get(TYPES.EnvironmentService),
      // this.get<IDataService>(TYPES.DataService), // Archived - DataService not available
      this.get(TYPES.StateManager),
      this.get(TYPES.PlatformService),
      this.get(TYPES.MobileComponentAdapter),
      this.get(TYPES.MobileUIOptimizer)
    ];

    for (const service of services) {
      if (service && typeof service.cleanup === 'function') {
        await service.cleanup();
      }
    }

    this.initialized = false;
    cleanupLogger.info('Dependency container cleaned up');
  }

  /**
   * Get container instance
   * @returns {Container} InversifyJS container
   */
  getContainer() {
    return this.container;
  }

  /**
   * Get container status for monitoring
   * @returns {Object} Container status information
   */
  getStatus() {
    const stats = this.getContainerStats();
    
    return {
      initialized: this.initialized,
      containerType: 'InversifyJS',
      totalServices: stats.totalServices,
      boundServices: stats.boundServices,
      unboundServices: stats.unboundServices,
      bindingRate: stats.bindingRate,
      availableServices: stats.availableServices,
      unboundServiceTypes: stats.unboundServiceTypes,
      timestamp: Date.now()
    };
  }
}

// Export interfaces
export { IEventBus, IStateManager, IEnvironmentService } from './interfaces.js';
// IDataService archived - not currently used

// Export singleton instance
export const dependencyContainer = () => {
  console.warn('dependencyContainer: Legacy function called. Use DI container to get DependencyContainer instance.');
  throw new Error('Legacy function not available. Use DI container to get DependencyContainer instance.');
};
