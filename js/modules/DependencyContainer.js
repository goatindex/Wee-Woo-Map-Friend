/**
 * DependencyContainer - InversifyJS-based dependency injection system
 * Implements dependency injection with decorators and service bindings
 * 
 * @fileoverview Dependency injection container for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { Container, injectable, inject } from 'inversify';
import { logger } from './StructuredLogger.js';
import { enhancedEventBus } from './EnhancedEventBus.js';
import { errorBoundary } from './ErrorBoundary.js';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';
import { ConfigService } from './ConfigService.js';
import { dataValidator } from './DataValidator.js';
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

/**
 * Environment service implementation
 */
@injectable()
export class EnvironmentService extends BaseService {
  private platform: string = 'unknown';
  private capabilities: any = {};

  constructor() {
    super();
  }

  async initialize() {
    await super.initialize();
    this.detectPlatform();
    this.detectCapabilities();
  }

  getPlatform(): string {
    return this.platform;
  }

  getCapabilities(): any {
    return this.capabilities;
  }

  isMobile(): boolean {
    return this.platform === 'mobile';
  }

  isDesktop(): boolean {
    return this.platform === 'desktop';
  }

  isWeb(): boolean {
    return this.platform === 'web';
  }

  private detectPlatform(): void {
    if (typeof window === 'undefined') {
      this.platform = 'node';
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone|tablet/.test(userAgent)) {
      this.platform = 'mobile';
    } else if (/electron/.test(userAgent)) {
      this.platform = 'desktop';
    } else {
      this.platform = 'web';
    }

    this.logger.info('Platform detected', { platform: this.platform });
  }

  private detectCapabilities(): void {
    if (typeof window === 'undefined') {
      this.capabilities = {};
      return;
    }

    this.capabilities = {
      geolocation: 'geolocation' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.detectWebGL(),
      touch: 'ontouchstart' in window,
      localStorage: this.detectLocalStorage(),
      indexedDB: 'indexedDB' in window,
      webWorkers: typeof Worker !== 'undefined',
      es6Modules: this.detectES6Modules(),
      fetch: 'fetch' in window,
      promises: typeof Promise !== 'undefined'
    };

    this.logger.info('Capabilities detected', { capabilities: this.capabilities });
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private detectLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  private detectES6Modules(): boolean {
    try {
      // Check if dynamic import is supported
      return typeof window !== 'undefined' && 'import' in window;
    } catch (e) {
      return false;
    }
  }
}

// DataService is now implemented in DataService.js

/**
 * State manager implementation
 */
@injectable()
export class StateManager extends BaseService implements IStateManager {
  private state: any = {};
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {
    super();
  }

  async initialize() {
    await super.initialize();
    this.initializeDefaultState();
  }

  getState(): any {
    return this.state;
  }

  setState(newState: any): void {
    const oldState = this.state;
    this.state = { ...this.state, ...newState };
    
    this.logger.debug('State updated', { 
      oldState: this.sanitizeState(oldState), 
      newState: this.sanitizeState(newState) 
    });
    
    this.eventBus.emit('state:updated', { 
      oldState: this.sanitizeState(oldState), 
      newState: this.sanitizeState(this.state) 
    });
  }

  subscribe(path: string, listener: Function): Function {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path)!.add(listener);
    
    return () => {
      const pathSubscribers = this.subscribers.get(path);
      if (pathSubscribers) {
        pathSubscribers.delete(listener);
      }
    };
  }

  dispatch(action: any): void {
    this.logger.debug('Action dispatched', { action });
    this.eventBus.emit('state:action', action);
  }

  private initializeDefaultState(): void {
    this.state = {
      map: {
        center: [0, 0],
        zoom: 10,
        layers: new Map()
      },
      sidebar: {
        expandedSections: [],
        selectedItems: new Map()
      },
      data: {
        categories: new Map(),
        loading: new Map()
      },
      ui: {
        theme: 'light',
        language: 'en'
      }
    };
  }

  private sanitizeState(state: any): any {
    // Remove sensitive data before logging
    const sanitized = { ...state };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}

/**
 * Dependency container setup
 */
export class DependencyContainer {
  private container: Container;
  private initialized: boolean = false;

  constructor() {
    this.container = new Container();
    this.setupBindings();
  }

  private setupBindings(): void {
    // Core services
    this.container.bind(TYPES.Logger).toConstantValue(logger);
    this.container.bind(TYPES.EventBus).toConstantValue(enhancedEventBus);
    this.container.bind(TYPES.ErrorBoundary).toConstantValue(errorBoundary);

    // Configuration services
    this.container.bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
    // this.container.bind(TYPES.EnvironmentService).to(EnvironmentService).inSingletonScope();

    // Data services - temporarily disabled due to circular dependency
    // this.container.bind<IDataService>(TYPES.DataService).to(DataService).inSingletonScope();
    this.container.bind(TYPES.DataValidator).toConstantValue(dataValidator);
    // this.container.bind(TYPES.ProgressiveDataLoader).to(ProgressiveDataLoader).inSingletonScope();

    // State management - temporarily commented out to break circular dependencies
    // this.container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();

    // Component communication services - temporarily commented out to break circular dependencies
    // this.container.bind(TYPES.ComponentCommunication).to(ComponentCommunication).inSingletonScope();
    // this.container.bind(TYPES.ComponentLifecycleManager).to(ComponentLifecycleManager).inSingletonScope();
    // this.container.bind(TYPES.ComponentErrorBoundary).to(ComponentErrorBoundary).inSingletonScope();
    // this.container.bind(TYPES.ComponentMemoryManager).to(ComponentMemoryManager).inSingletonScope();
    
    // Accessibility services - temporarily commented out to break circular dependencies
    // this.container.bind(TYPES.ARIAService).to(ARIAService).inSingletonScope();
    
    // UI services - temporarily commented out to break circular dependencies
    // this.container.bind(TYPES.RefactoredMapManager).to(RefactoredMapManager).inSingletonScope();
    // this.container.bind(TYPES.RefactoredSidebarManager).to(RefactoredSidebarManager).inSingletonScope();
    // this.container.bind(TYPES.RefactoredSearchManager).to(RefactoredSearchManager).inSingletonScope();
    
    // Platform services - temporarily commented out to break circular dependencies
    // this.container.bind(TYPES.PlatformService).to(PlatformService).inSingletonScope();
    // this.container.bind(TYPES.MobileComponentAdapter).to(MobileComponentAdapter).inSingletonScope();
    // this.container.bind(TYPES.MobileUIOptimizer).to(MobileUIOptimizer).inSingletonScope();
    
    // Error handling services - temporarily commented out to break circular dependencies
    // this.container.bind(TYPES.UnifiedErrorHandler).to(UnifiedErrorHandler).inSingletonScope();
    // this.container.bind(TYPES.CircuitBreakerStrategy).to(CircuitBreakerStrategy).inSingletonScope();
    // this.container.bind(TYPES.RetryStrategy).to(RetryStrategy).inSingletonScope();
    // this.container.bind(TYPES.FallbackStrategy).to(FallbackStrategy).inSingletonScope();
    // this.container.bind(TYPES.HealthCheckService).to(HealthCheckService).inSingletonScope();
    // this.container.bind(TYPES.ErrorContext).to(ErrorContext).inSingletonScope();

    this.logger.info('Dependency container bindings configured');
  }

  /**
   * Get service instance
   * @param {Symbol} serviceIdentifier - Service identifier
   * @returns {any} Service instance
   */
  get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }

  /**
   * Check if service is bound
   * @param {Symbol} serviceIdentifier - Service identifier
   * @returns {boolean} True if bound
   */
  isBound(serviceIdentifier: symbol): boolean {
    return this.container.isBound(serviceIdentifier);
  }

  /**
   * Initialize all services
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing dependency container');

    // Initialize core services
    const configService = this.get<IConfigService>(TYPES.ConfigService);
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
    this.logger.info('Dependency container initialized successfully');
  }

  /**
   * Cleanup all services
   * @returns {Promise<void>}
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up dependency container');
    
    // Get all services and cleanup
    const services = [
      this.get<IConfigService>(TYPES.ConfigService),
      this.get(TYPES.EnvironmentService),
      // this.get<IDataService>(TYPES.DataService), // Archived - DataService not available
      this.get<IStateManager>(TYPES.StateManager),
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
    this.logger.info('Dependency container cleaned up');
  }

  /**
   * Get container instance
   * @returns {Container} InversifyJS container
   */
  getContainer(): Container {
    return this.container;
  }
}

// Export interfaces
export { IEventBus, IStateManager } from './interfaces.js';
// IDataService archived - not currently used

// Export singleton instance
export const dependencyContainer = new DependencyContainer();
