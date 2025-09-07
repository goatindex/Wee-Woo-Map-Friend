/**
 * DependencyContainer - InversifyJS-based dependency injection system
 * Implements dependency injection with decorators and service bindings
 * 
 * @fileoverview Dependency injection container for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import 'reflect-metadata';
import { Container, injectable, inject } from 'inversify';
import { logger } from './StructuredLogger.js';
import { enhancedEventBus } from './EnhancedEventBus.js';
import { errorBoundary } from './ErrorBoundary.js';
import { ConfigService } from './ConfigService.js';
import { dataValidator } from './DataValidator.js';
import { DataService } from './DataService.js';
import { ProgressiveDataLoader } from './ProgressiveDataLoader.js';
import { ComponentCommunication } from './ComponentCommunication.js';
import { ComponentLifecycleManager } from './ComponentLifecycleManager.js';
import { ComponentErrorBoundary } from './ComponentErrorBoundary.js';
import { ComponentMemoryManager } from './ComponentMemoryManager.js';
import { ARIAService } from './ARIAService.js';
import { RefactoredMapManager } from './RefactoredMapManager.js';
import { RefactoredSidebarManager } from './RefactoredSidebarManager.js';
import { RefactoredSearchManager } from './RefactoredSearchManager.js';
import { PlatformService } from './PlatformService.js';
import { MobileComponentAdapter } from './MobileComponentAdapter.js';
import { MobileUIOptimizer } from './MobileUIOptimizer.js';
import { UnifiedErrorHandler } from './UnifiedErrorHandler.js';
import { CircuitBreakerStrategy } from './CircuitBreakerStrategy.js';
import { RetryStrategy } from './RetryStrategy.js';
import { FallbackStrategy } from './FallbackStrategy.js';
import { HealthCheckService } from './HealthCheckService.js';
import { ErrorContext } from './ErrorContext.js';

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
  DataService: Symbol.for('DataService'),
  DataValidator: Symbol.for('DataValidator'),
  ProgressiveDataLoader: Symbol.for('ProgressiveDataLoader'),
  CacheService: Symbol.for('CacheService'),
  
  // State management
  StateManager: Symbol.for('StateManager'),
  StateStore: Symbol.for('StateStore'),
  
  // UI services
  MapManager: Symbol.for('MapManager'),
  RefactoredMapManager: Symbol.for('RefactoredMapManager'),
  SidebarManager: Symbol.for('SidebarManager'),
  RefactoredSidebarManager: Symbol.for('RefactoredSidebarManager'),
  SearchManager: Symbol.for('SearchManager'),
  RefactoredSearchManager: Symbol.for('RefactoredSearchManager'),
  UIManager: Symbol.for('UIManager'),
  
  // Component communication services
  ComponentCommunication: Symbol.for('ComponentCommunication'),
  ComponentLifecycleManager: Symbol.for('ComponentLifecycleManager'),
  ComponentErrorBoundary: Symbol.for('ComponentErrorBoundary'),
  ComponentMemoryManager: Symbol.for('ComponentMemoryManager'),
  
  // Accessibility services
  ARIAService: Symbol.for('ARIAService'),
  
  // Platform services
  PlatformService: Symbol.for('PlatformService'),
  DeviceService: Symbol.for('DeviceService'),
  MobileComponentAdapter: Symbol.for('MobileComponentAdapter'),
  MobileUIOptimizer: Symbol.for('MobileUIOptimizer'),
  
  // Utility services
  ValidationService: Symbol.for('ValidationService'),
  PerformanceService: Symbol.for('PerformanceService'),
  SecurityService: Symbol.for('SecurityService'),
  
  // Error handling services
  UnifiedErrorHandler: Symbol.for('UnifiedErrorHandler'),
  CircuitBreakerStrategy: Symbol.for('CircuitBreakerStrategy'),
  RetryStrategy: Symbol.for('RetryStrategy'),
  FallbackStrategy: Symbol.for('FallbackStrategy'),
  HealthCheckService: Symbol.for('HealthCheckService'),
  ErrorContext: Symbol.for('ErrorContext')
};

/**
 * Base service interface
 */
export class BaseService {
  constructor() {
    this.logger = logger.createChild({ 
      module: this.constructor.name 
    });
  }

  /**
   * Initialize the service
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.info(`${this.constructor.name} initialized`);
  }

  /**
   * Cleanup the service
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.logger.info(`${this.constructor.name} cleaned up`);
  }
}

/**
 * Configuration service interface
 */
export interface IConfigService {
  get(key: string, defaultValue?: any): any;
  set(key: string, value: any): void;
  has(key: string): boolean;
  getAll(): Record<string, any>;
  load(): Promise<void>;
}

/**
 * Event bus service interface
 */
export interface IEventBus {
  on(eventType: string, handler: Function, options?: any): Function;
  once(eventType: string, handler: Function, options?: any): Function;
  off(eventType: string, listener: any): void;
  emit(eventType: string, payload?: any, metadata?: any): Promise<any[]>;
  emitSync(eventType: string, payload?: any, metadata?: any): any[];
}

/**
 * Data service interface
 */
export interface IDataService {
  loadData(category: string): Promise<any[]>;
  loadDataBatch(categories: string[]): Promise<Map<string, any[]>>;
  getCachedData(category: string): any[] | null;
  invalidateCache(category: string): void;
  subscribeToDataUpdates(category: string, callback: Function): Function;
}

/**
 * State manager interface
 */
export interface IStateManager {
  getState(): any;
  setState(newState: any): void;
  subscribe(path: string, listener: Function): Function;
  dispatch(action: any): void;
}

/**
 * Platform service interface
 */
export interface IPlatformService {
  getPlatform(): string;
  getCapabilities(): any;
  isMobile(): boolean;
  isDesktop(): boolean;
  isWeb(): boolean;
}

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
      return typeof import !== 'undefined';
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
    this.container.bind(TYPES.EnvironmentService).to(EnvironmentService).inSingletonScope();

    // Data services
    this.container.bind<IDataService>(TYPES.DataService).to(DataService).inSingletonScope();
    this.container.bind(TYPES.DataValidator).toConstantValue(dataValidator);
    this.container.bind(TYPES.ProgressiveDataLoader).to(ProgressiveDataLoader).inSingletonScope();

    // State management
    this.container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();

    // Component communication services
    this.container.bind(TYPES.ComponentCommunication).to(ComponentCommunication).inSingletonScope();
    this.container.bind(TYPES.ComponentLifecycleManager).to(ComponentLifecycleManager).inSingletonScope();
    this.container.bind(TYPES.ComponentErrorBoundary).to(ComponentErrorBoundary).inSingletonScope();
    this.container.bind(TYPES.ComponentMemoryManager).to(ComponentMemoryManager).inSingletonScope();
    
    // Accessibility services
    this.container.bind(TYPES.ARIAService).to(ARIAService).inSingletonScope();
    
    // UI services
    this.container.bind(TYPES.RefactoredMapManager).to(RefactoredMapManager).inSingletonScope();
    this.container.bind(TYPES.RefactoredSidebarManager).to(RefactoredSidebarManager).inSingletonScope();
    this.container.bind(TYPES.RefactoredSearchManager).to(RefactoredSearchManager).inSingletonScope();
    
    // Platform services
    this.container.bind(TYPES.PlatformService).to(PlatformService).inSingletonScope();
    this.container.bind(TYPES.MobileComponentAdapter).to(MobileComponentAdapter).inSingletonScope();
    this.container.bind(TYPES.MobileUIOptimizer).to(MobileUIOptimizer).inSingletonScope();
    
    // Error handling services
    this.container.bind(TYPES.UnifiedErrorHandler).to(UnifiedErrorHandler).inSingletonScope();
    this.container.bind(TYPES.CircuitBreakerStrategy).to(CircuitBreakerStrategy).inSingletonScope();
    this.container.bind(TYPES.RetryStrategy).to(RetryStrategy).inSingletonScope();
    this.container.bind(TYPES.FallbackStrategy).to(FallbackStrategy).inSingletonScope();
    this.container.bind(TYPES.HealthCheckService).to(HealthCheckService).inSingletonScope();
    this.container.bind(TYPES.ErrorContext).to(ErrorContext).inSingletonScope();

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

    const dataService = this.get<IDataService>(TYPES.DataService);
    await dataService.initialize();

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
      this.get<IDataService>(TYPES.DataService),
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

// Export singleton instance
export const dependencyContainer = new DependencyContainer();
