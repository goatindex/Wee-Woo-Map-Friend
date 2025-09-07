/**
 * @module modules/ApplicationBootstrap
 * Unified application bootstrap system
 * Combines dependency injection, application logic, and legacy compatibility
 * Replaces multiple bootstrap systems with single, maintainable solution
 */

// Core modules only - no circular dependencies
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { logger } from './StructuredLogger.js';
import { dependencyContainer } from './DependencyContainer.js';
import { UnifiedErrorHandler } from './UnifiedErrorHandler.js';
import { CircuitBreakerManager } from './CircuitBreakerStrategy.js';
import { HealthCheckService } from './HealthCheckService.js';
// DependencyRegistry removed - using direct module initialization

/**
 * @class ApplicationBootstrap
 * Unified application bootstrap system with dependency injection
 * Single system handling all application initialization
 */
export class ApplicationBootstrap {
  constructor() {
    this.initialized = false;
    this.initStartTime = performance.now();
    this.deviceContext = null;
    this.nativeFeatures = null;
    
    // Cleanup tracking
    this.cleanupFunctions = [];
    this.eventListeners = [];
    this.intervals = [];
    this.timeouts = [];
    this.initializedModules = new Set();
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'ApplicationBootstrap' });
    
    // Initialize UnifiedErrorHandler
    this.unifiedErrorHandler = new UnifiedErrorHandler({
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      enableLogging: true,
      enableMetrics: true
    });

    // Initialize CircuitBreakerManager
    this.circuitBreakerManager = new CircuitBreakerManager();

    // Initialize HealthCheckService
    this.healthCheckService = new HealthCheckService({
      checkInterval: 30000,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
      enableLogging: true
    });
    
    // Bind methods
    this.init = this.init.bind(this);
    this.handleError = this.handleError.bind(this);
    this.safeExecute = this.safeExecute.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.destroy = this.destroy.bind(this);
    
    this.logger.info('Unified application bootstrap system initialized');
  }

  /**
   * Execute a function with error handling, recovery, and logging
   * Delegates to UnifiedErrorHandler.safeExecute()
   * @param {string} phase - Name of the initialization phase
   * @param {Function} fn - Function to execute
   * @param {Object} options - Execution options
   */
  async safeExecute(phase, fn, options = {}) {
    return await this.unifiedErrorHandler.safeExecute(phase, fn, options);
  }

  /**
   * Initialize core modules directly with comprehensive error handling
   */
  async initializeCoreModules() {
    this.logger.info('Initializing core modules...');
    
    const moduleInitializers = [
      { name: 'DeviceManager', path: './DeviceManager.js', required: true },
      { name: 'CollapsibleManager', path: './CollapsibleManager.js', required: true },
      { name: 'SearchManager', path: './SearchManager.js', required: false },
      { name: 'ActiveListManager', path: './ActiveListManager.js', required: true },
      { name: 'MapManager', path: './MapManager.js', required: true },
      { name: 'LayerManager', path: './LayerManager.js', required: true },
      { name: 'PolygonLoader', path: './PolygonLoader.js', required: true },
      { name: 'LabelManager', path: './LabelManager.js', required: false },
      { name: 'EmphasisManager', path: './EmphasisManager.js', required: false },
      { name: 'UtilityManager', path: './UtilityManager.js', required: false },
      { name: 'UIManager', path: './UIManager.js', required: false }
    ];
    
    const initializedModules = new Map();
    
    for (const moduleInfo of moduleInitializers) {
      try {
        this.logger.info(`Loading module: ${moduleInfo.name}`);
        const module = await import(moduleInfo.path);
        
        // Get the singleton instance using standardized naming convention
        const singletonName = moduleInfo.name.charAt(0).toLowerCase() + moduleInfo.name.slice(1);
        let moduleInstance = module[singletonName] || module.default;
        
        // If we got the class instead of instance, try to get the singleton
        if (typeof moduleInstance === 'function' && module[singletonName]) {
          moduleInstance = module[singletonName];
        }
        
        if (!moduleInstance) {
          throw new Error(`Module ${moduleInfo.name} does not export expected instance`);
        }
        
        // Initialize the module
        if (typeof moduleInstance.init === 'function') {
          await moduleInstance.init();
          this.logger.info(`✅ ${moduleInfo.name} initialized successfully`);
          
          // Track module for cleanup
          this.trackModule(moduleInfo.name, moduleInstance);
        } else {
          this.logger.warn(`⚠️ ${moduleInfo.name} has no init method, skipping initialization`);
        }
        
        initializedModules.set(moduleInfo.name, moduleInstance);
        
        // Store specific module instances for direct access
        if (moduleInfo.name === 'DeviceManager') {
          this.deviceManager = moduleInstance;
        }
        
        // Special handling for PolygonLoader
        if (moduleInfo.name === 'PolygonLoader') {
          // Ensure PolygonLoader is fully initialized before storing
          if (moduleInstance.initialized) {
            stateManager.set('polygonLoader', moduleInstance);
            this.logger.info('PolygonLoader stored in state manager');
          } else {
            this.logger.warn('PolygonLoader not fully initialized, storing anyway');
            stateManager.set('polygonLoader', moduleInstance);
          }
        }
        
      } catch (error) {
        const errorMsg = `Failed to initialize ${moduleInfo.name}: ${error.message}`;
        
        if (moduleInfo.required) {
          this.logger.error(`❌ ${errorMsg}`);
          // Pass module context for recovery
          throw new Error(`Required module ${moduleInfo.name} failed to initialize: ${error.message}`);
        } else {
          this.logger.warn(`⚠️ ${errorMsg} (optional module)`);
          // Continue with optional module failure
        }
      }
    }
    
    this.logger.info(`Core modules initialization complete. ${initializedModules.size}/${moduleInitializers.length} modules loaded`);
    
    // Store initialized modules for later use
    this.initializedModules = initializedModules;
  }

  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
  }

  /**
   * Get device context with proper async handling
   */
  async getDeviceContext() {
    // Try to get device context from initialized deviceManager first
    if (this.deviceManager && typeof this.deviceManager.getContext === 'function') {
      try {
        return this.deviceManager.getContext();
      } catch (error) {
        this.logger.warn('Failed to get device context from deviceManager', { error: error.message });
      }
    }
    
    // Fallback to global DeviceContext if available
    if (window.DeviceContext && window.DeviceContext.getContext) {
      try {
        return window.DeviceContext.getContext();
      } catch (error) {
        this.logger.warn('Failed to get device context from global DeviceContext', { error: error.message });
      }
    }
    
    // Final fallback device context
    return {
      device: 'desktop',
      platform: 'web',
      orientation: 'landscape',
      hasTouch: false,
      isStandalone: false,
      breakpoint: 'desktop'
    };
  }

  /**
   * Wait for native features to be ready
   */
  async waitForNativeFeatures() {
    try {
      const { nativeFeatures } = await import('../native/features.js');
      if (nativeFeatures && typeof nativeFeatures.waitForReady === 'function') {
        return await nativeFeatures.waitForReady();
      }
      return nativeFeatures;
    } catch (error) {
      this.logger.warn('Native features not available', { error: error.message });
      return null;
    }
  }

  /**
   * Apply device-specific styling
   */
  applyDeviceStyles(deviceContext) {
    if (!deviceContext) return;
    
    const body = document.body;
    if (body) {
      // Remove existing device classes
      body.classList.remove('mobile', 'tablet', 'desktop', 'touch', 'no-touch');
      
      // Add current device classes
      body.classList.add(deviceContext.device);
      if (deviceContext.hasTouch) {
        body.classList.add('touch');
      } else {
        body.classList.add('no-touch');
      }
      
      // Add platform class
      body.classList.add(`platform-${deviceContext.platform}`);
    }
  }

  /**
   * Initialize responsive breakpoint handling
   */
  initResponsiveHandling() {
    // Update breakpoint classes on resize
    const updateBreakpoints = async () => {
      const deviceContext = await this.getDeviceContext();
      this.applyDeviceStyles(deviceContext);
    };
    
    this.registerEventListener(window, 'resize', this.debounce(updateBreakpoints, 150), 'responsive-breakpoints');
    
    // CSS custom properties for JavaScript integration
    const root = document.documentElement;
    const updateCSSProperties = async () => {
      const context = await this.getDeviceContext();
      root.style.setProperty('--current-breakpoint', context.device);
      root.style.setProperty('--is-touch', context.hasTouch ? '1' : '0');
      root.style.setProperty('--is-landscape', context.orientation === 'landscape' ? '1' : '0');
    };
    
    updateCSSProperties();
    this.registerEventListener(window, 'resize', this.debounce(updateCSSProperties, 150), 'css-properties-update');
  }

  /**
   * Set up orientation change handling
   */
  setupOrientationHandling() {
    const handleOrientationChange = () => {
      setTimeout(async () => {
        const deviceContext = await this.getDeviceContext();
        this.applyDeviceStyles(deviceContext);
        
        // Trigger map resize if available
        const map = stateManager.get('map');
        if (map) {
          map.invalidateSize();
        }
        
        // Dispatch custom event for other components
        globalEventBus.emit('app:orientationChange', { context: deviceContext });
      }, 100);
    };
    
    this.registerEventListener(window, 'orientationchange', handleOrientationChange, 'orientation-change');
    this.registerEventListener(window, 'resize', this.debounce(handleOrientationChange, 300), 'orientation-resize');
  }

  /**
   * Initialize native app integration
   */
  async initNativeIntegration() {
    // Native features are loaded via script tag in HTML, check if available
    if (window.NativeFeatures && typeof window.NativeFeatures.init === 'function') {
      await window.NativeFeatures.init();
    }
  }

  /**
   * Initialize ES6 map system
   * Note: MapManager is already initialized in initializeCoreModules() phase
   */
  async initES6MapSystem() {
    try {
      // MapManager is already initialized in Phase 2 (initializeCoreModules)
      // This phase is kept for future map-specific setup if needed
      this.logger.info('Map system already initialized in core modules phase');
    } catch (error) {
      this.logger.warn('Map system setup failed', { error: error.message });
      // Don't throw - allow bootstrap to continue without map
    }
  }

  /**
   * Set up UI components
   */
  async setupUI() {
    const { collapsibleManager } = await import('./CollapsibleManager.js');
    // CollapsibleManager auto-initializes via initializeExistingSections()
    // No manual setupCollapsible() call needed
  }

  /**
   * Load data and UI components with error handling
   */
  async loadComponents() {
    try {
      this.logger.info('Loading data and UI components...');
      
      const { DataLoadingOrchestrator } = await import('./DataLoadingOrchestrator.js');
      if (!DataLoadingOrchestrator) {
        throw new Error('DataLoadingOrchestrator class not found in module');
      }
      
      const orchestrator = new DataLoadingOrchestrator();
      if (typeof orchestrator.init !== 'function') {
        throw new Error('DataLoadingOrchestrator instance has no init method');
      }
      
      await orchestrator.init();
      this.logger.info('✅ DataLoadingOrchestrator initialized');
      
      if (typeof orchestrator.loadInitialData !== 'function') {
        throw new Error('DataLoadingOrchestrator instance has no loadInitialData method');
      }
      
      await orchestrator.loadInitialData();
      this.logger.info('✅ Data loading completed');
      
    } catch (error) {
      this.logger.error('❌ Failed to load components', { 
        error: error.message, 
        stack: error.stack 
      });
      throw new Error(`Component loading failed: ${error.message}`);
    }
  }

  /**
   * Set up event handlers
   */
  async setupEventHandlers() {
    const { searchManager } = await import('./SearchManager.js');
    if (searchManager && typeof searchManager.setupEventHandlers === 'function') {
      searchManager.setupEventHandlers();
    }
  }

  /**
   * Handle initial location
   */
  async handleInitialLocation() {
    const { mapManager } = await import('./MapManager.js');
    if (mapManager && typeof mapManager.handleInitialLocation === 'function') {
      await mapManager.handleInitialLocation();
    }
  }

  /**
   * Set up consolidated legacy compatibility layer
   * Centralizes all legacy global exposures and compatibility functions
   */
  async setupLegacyCompatibility() {
    this.logger.info('Setting up consolidated legacy compatibility layer...');
    
    if (typeof window === 'undefined') {
      this.logger.warn('Window not available - skipping legacy compatibility setup');
      return;
    }

    try {
      // Core legacy bootstrap functions
      this.setupLegacyBootstrap();
      
      // Core module global exposures
      await this.setupCoreModuleExposures();
      
      // Legacy utility functions
      await this.setupLegacyUtilityFunctions();
      
      // Legacy event system compatibility
      this.setupLegacyEventCompatibility();
      
      this.logger.info('Consolidated legacy compatibility layer active');
    } catch (error) {
      this.logger.error('Failed to setup legacy compatibility', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Set up legacy bootstrap functions
   */
  setupLegacyBootstrap() {
    // Legacy AppBootstrap interface
    window.AppBootstrap = {
      init: () => {
        this.logger.info('Legacy AppBootstrap.init() called - delegating to ApplicationBootstrap');
        return this.init();
      },
      // Add other legacy bootstrap methods as needed
      getInstance: () => this
    };

    // Legacy global bootstrap access
    window.ApplicationBootstrap = this;
    window.applicationBootstrap = this;
  }

  /**
   * Set up core module global exposures
   */
  async setupCoreModuleExposures() {
    const coreModules = [
      { name: 'StateManager', path: './StateManager.js', instanceName: 'stateManager' },
      { name: 'EventBus', path: './EventBus.js', instanceName: 'globalEventBus' },
      { name: 'DeviceManager', path: './DeviceManager.js', instanceName: 'deviceManager' },
      { name: 'MapManager', path: './MapManager.js', instanceName: 'mapManager' },
      { name: 'UIManager', path: './UIManager.js', instanceName: 'uiManager' },
      { name: 'LayerManager', path: './LayerManager.js', instanceName: 'layerManager' },
      { name: 'SearchManager', path: './SearchManager.js', instanceName: 'searchManager' },
      { name: 'ActiveListManager', path: './ActiveListManager.js', instanceName: 'activeListManager' },
      { name: 'FABManager', path: './FABManager.js', instanceName: 'fabManager' },
      { name: 'ConfigurationManager', path: './ConfigurationManager.js', instanceName: 'configurationManager' }
    ];

    for (const module of coreModules) {
      try {
        const moduleExports = await import(module.path);
        const ModuleClass = moduleExports[module.name];
        const instance = moduleExports[module.instanceName];
        
        if (ModuleClass) {
          window[module.name] = ModuleClass;
        }
        if (instance) {
          window[module.instanceName] = instance;
        }
        
        this.logger.debug(`Exposed ${module.name} globally`, { 
          hasClass: !!ModuleClass, 
          hasInstance: !!instance 
        });
      } catch (error) {
        this.logger.warn(`Failed to expose ${module.name} globally`, { 
          error: error.message,
          module: module.name 
        });
      }
    }
  }

  /**
   * Set up legacy utility functions
   */
  async setupLegacyUtilityFunctions() {
    // Legacy map access functions
    window.getMap = () => {
      if (window.mapManager && typeof window.mapManager.getMap === 'function') {
        return window.mapManager.getMap();
      }
      return null;
    };

    // Legacy bulk operation functions
    window.BulkOperationManager = {
      begin: (operationType, itemCount) => {
        if (window.stateManager && typeof window.stateManager.beginBulkOperation === 'function') {
          return window.stateManager.beginBulkOperation(operationType, itemCount);
        }
        return false;
      },
      end: () => {
        if (window.stateManager && typeof window.stateManager.endBulkOperation === 'function') {
          return window.stateManager.endBulkOperation();
        }
        return false;
      }
    };

    // Legacy bulk operation functions (direct access)
    window.beginBulkOperation = () => {
      if (window.stateManager && typeof window.stateManager.beginBulkOperation === 'function') {
        return window.stateManager.beginBulkOperation('legacy');
      }
      return false;
    };

    window.endBulkOperation = () => {
      if (window.stateManager && typeof window.stateManager.endBulkOperation === 'function') {
        return window.stateManager.endBulkOperation();
      }
      return false;
    };

    // Legacy device context functions
    try {
      const { getResponsiveContext, isMobileSize } = await import('./DeviceManager.js');
      if (getResponsiveContext) {
        window.getResponsiveContext = getResponsiveContext;
      }
      if (isMobileSize) {
        window.isMobileSize = isMobileSize;
      }
    } catch (error) {
      this.logger.warn('Failed to setup legacy device functions', { error: error.message });
    }
  }

  /**
   * Set up legacy event system compatibility
   */
  setupLegacyEventCompatibility() {
    // Legacy event system - ensure global event bus is available
    if (window.globalEventBus) {
      // Legacy event names mapping
      const legacyEventMap = {
        'map:ready': 'map:initialized',
        'data:loaded': 'data:loading:complete',
        'ui:ready': 'ui:initialized'
      };

      // Set up legacy event forwarding
      Object.entries(legacyEventMap).forEach(([legacyEvent, modernEvent]) => {
        window.globalEventBus.on(modernEvent, (data) => {
          window.globalEventBus.emit(legacyEvent, data);
        });
      });

      this.logger.debug('Legacy event compatibility active', { 
        mappedEvents: Object.keys(legacyEventMap).length 
      });
    }
  }

  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    // Global error handling
    this.registerEventListener(window, 'error', (event) => {
      this.logger.error('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    }, 'global-error-handler');
    
    // Global unhandled promise rejection handling
    this.registerEventListener(window, 'unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    }, 'global-promise-rejection-handler');
  }

  /**
   * Debounce utility function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Handle errors with recovery strategies (delegated to UnifiedErrorHandler)
   */
  handleError(error, context = {}) {
    return this.unifiedErrorHandler.handleError(error, context);
  }


  /**
   * Circuit breaker to prevent cascade failures
   * Delegates to CircuitBreakerManager.executeWithCircuitBreaker()
   */
  async executeWithCircuitBreaker(operation, options = {}) {
    return await this.circuitBreakerManager.executeWithCircuitBreaker(operation, options);
  }

  /**
   * Health check system to monitor application state (delegated to HealthCheckService)
   * @returns {Promise<Object>} Health status
   */
  async performHealthCheck() {
    return await this.healthCheckService.performComprehensiveHealthCheck();
  }


  /**
   * Check if application is in degraded mode
   */
  isDegradedMode() {
    return stateManager.get('degradedMode') === true;
  }

  /**
   * Get degraded mode information
   */
  getDegradedModeInfo() {
    if (!this.isDegradedMode()) {
      return null;
    }
    
    return {
      phase: stateManager.get('degradedPhase'),
      error: stateManager.get('degradedError'),
      timestamp: stateManager.get('degradedTimestamp') || Date.now()
    };
  }

  /**
   * Check network connectivity and handle offline scenarios (delegated to UnifiedErrorHandler)
   */
  async checkNetworkConnectivity() {
    return await this.unifiedErrorHandler.checkNetworkConnectivity();
  }

  /**
   * Handle network-related errors with retry logic (delegated to UnifiedErrorHandler)
   */
  async handleNetworkError(error, operation, maxRetries = 3) {
    return await this.unifiedErrorHandler.handleNetworkError(error, operation, maxRetries);
  }

  /**
   * Set up network monitoring and offline handling
   */
  setupNetworkMonitoring() {
    // Monitor online/offline status
    this.registerEventListener(window, 'online', () => {
      this.logger.info('Network connection restored');
      globalEventBus.emit('app:networkOnline');
      
      // Try to recover from network-related degraded mode
      if (this.isDegradedMode()) {
        const degradedInfo = this.getDegradedModeInfo();
        if (degradedInfo && degradedInfo.phase === 'data loading') {
          this.logger.info('Attempting to recover from network-related degraded mode');
          // Could trigger a retry of data loading here
        }
      }
    }, 'network-online-handler');
    
    this.registerEventListener(window, 'offline', () => {
      this.logger.warn('Network connection lost');
      globalEventBus.emit('app:networkOffline');
      
      // Show offline notification
      this.showOfflineNotification();
    }, 'network-offline-handler');
  }

  /**
   * Show offline notification to user (delegated to UnifiedErrorHandler)
   */
  showOfflineNotification() {
    return this.unifiedErrorHandler.showOfflineNotification();
  }

  /**
   * Initialize the unified application bootstrap system
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting unified application bootstrap initialization...');
      this.logger.info('Init called from main.js - single entry point confirmed');
      
      // Phase 1: Wait for DOM
      await this.safeExecute('DOM ready', async () => {
        await this.waitForDOM();
      });
      
      // Phase 1.5: Initialize dependency container and ARIA service
      await this.safeExecute('dependency container initialization', async () => {
        await dependencyContainer.initialize();
        
        // Initialize ARIA service
        const ariaService = dependencyContainer.get('ARIAService');
        if (ariaService && typeof ariaService.init === 'function') {
          await ariaService.init();
          this.logger.info('ARIAService initialized successfully');
        }
        
        // Initialize Platform service
        const platformService = dependencyContainer.get('PlatformService');
        if (platformService && typeof platformService.initialize === 'function') {
          await platformService.initialize();
          this.logger.info('PlatformService initialized successfully');
        }
        
        // Initialize Mobile Component Adapter
        const mobileComponentAdapter = dependencyContainer.get('MobileComponentAdapter');
        if (mobileComponentAdapter && typeof mobileComponentAdapter.initialize === 'function') {
          await mobileComponentAdapter.initialize();
          this.logger.info('MobileComponentAdapter initialized successfully');
        }
        
        // Initialize Mobile UI Optimizer
        const mobileUIOptimizer = dependencyContainer.get('MobileUIOptimizer');
        if (mobileUIOptimizer && typeof mobileUIOptimizer.initialize === 'function') {
          await mobileUIOptimizer.initialize();
          this.logger.info('MobileUIOptimizer initialized successfully');
        }
      });
      
      // Phase 2: Initialize core modules directly
      await this.safeExecute('core module initialization', async () => {
        await this.initializeCoreModules();
      }, { 
        allowRecovery: true, 
        allowDegradation: false, // Core modules are critical
        maxRetries: 2,
        context: { critical: true }
      });
      
      // Phase 5: Wait for native features
      await this.safeExecute('native features', async () => {
        this.nativeFeatures = await this.waitForNativeFeatures();
      });
      
      // Phase 6: Get device context
      await this.safeExecute('device context', async () => {
        this.deviceContext = await this.getDeviceContext();
        this.logger.info('Device context initialized', this.deviceContext);
      });
      
      // Phase 7: Apply device-specific styling
      await this.safeExecute('device styling', async () => {
        this.applyDeviceStyles(this.deviceContext);
      });
      
      // Phase 8: Initialize responsive handling
      await this.safeExecute('responsive handling', async () => {
        this.initResponsiveHandling();
      });
      
      // Phase 9: Set up orientation handling
      await this.safeExecute('orientation handling', async () => {
        this.setupOrientationHandling();
      });
      
      // Phase 10: Initialize native integration
      await this.safeExecute('native integration', async () => {
        await this.initNativeIntegration();
      });
      
      // Phase 11: Initialize ES6 map system
      await this.safeExecute('map system', async () => {
        await this.initES6MapSystem();
      }, { 
        allowRecovery: true, 
        allowDegradation: true, // Map can work in degraded mode
        maxRetries: 1,
        context: { feature: 'map' }
      });
      
      // Phase 12: Set up UI components
      await this.safeExecute('UI components', async () => {
        await this.setupUI();
      }, { 
        allowRecovery: true, 
        allowDegradation: true, // UI can work with basic functionality
        maxRetries: 1,
        context: { feature: 'ui' }
      });
      
      // Phase 13: Load data and components
      await this.safeExecute('data loading', async () => {
        await this.loadComponents();
      }, { 
        allowRecovery: true, 
        allowDegradation: true, // Data can load partially
        maxRetries: 2,
        context: { feature: 'data' }
      });
      
      // Phase 14: Set up event handlers
      await this.safeExecute('event handlers', async () => {
        await this.setupEventHandlers();
      });
      
      // Phase 15: Handle initial location
      await this.safeExecute('initial location', async () => {
        await this.handleInitialLocation();
      });
      
      // Phase 16: Set up legacy compatibility
      await this.safeExecute('legacy compatibility', async () => {
        await this.setupLegacyCompatibility();
      });
      
      // Phase 17: Set up global events
      await this.safeExecute('global events', async () => {
        this.setupGlobalEvents();
      });
      
      // Phase 18: Set up network monitoring
      await this.safeExecute('network monitoring', async () => {
        this.setupNetworkMonitoring();
      });
      
      // Phase 19: Mark as initialized
      this.initialized = true;
      
      const initTime = performance.now() - this.initStartTime;
      this.logger.info(`Unified application bootstrap complete`, { duration: initTime });
      
      // Emit completion event
      globalEventBus.emit('app:bootstrapComplete', { bootstrap: this });
      
    } catch (error) {
      this.handleError(error, { phase: 'bootstrap' });
    }
  }

  /**
   * Register a cleanup function to be called during cleanup
   * @param {Function} cleanupFn - Function to call during cleanup
   * @param {string} name - Name for the cleanup function (for logging)
   */
  registerCleanup(cleanupFn, name = 'unnamed') {
    this.cleanupFunctions.push({ fn: cleanupFn, name });
    this.logger.debug('Cleanup function registered', { name });
  }

  /**
   * Register an event listener for cleanup tracking
   * @param {EventTarget} target - Event target
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @param {Object} options - Event listener options
   */
  registerEventListener(target, event, listener, options = {}) {
    target.addEventListener(event, listener, options);
    this.eventListeners.push({ target, event, listener, options });
    this.logger.debug('Event listener registered', { event, target: target.constructor.name });
  }

  /**
   * Register an interval for cleanup tracking
   * @param {Function} callback - Interval callback
   * @param {number} delay - Interval delay in milliseconds
   * @param {string} name - Name for the interval (for logging)
   * @returns {number} Interval ID
   */
  registerInterval(callback, delay, name = 'unnamed') {
    const id = setInterval(callback, delay);
    this.intervals.push({ id, name, callback, delay });
    this.logger.debug('Interval registered', { name, delay });
    return id;
  }

  /**
   * Register a timeout for cleanup tracking
   * @param {Function} callback - Timeout callback
   * @param {number} delay - Timeout delay in milliseconds
   * @param {string} name - Name for the timeout (for logging)
   * @returns {number} Timeout ID
   */
  registerTimeout(callback, delay, name = 'unnamed') {
    const id = setTimeout(callback, delay);
    this.timeouts.push({ id, name, callback, delay });
    this.logger.debug('Timeout registered', { name, delay });
    return id;
  }

  /**
   * Track an initialized module for cleanup
   * @param {string} moduleName - Name of the module
   * @param {Object} moduleInstance - Module instance
   */
  trackModule(moduleName, moduleInstance) {
    this.initializedModules.add({ name: moduleName, instance: moduleInstance });
    this.logger.debug('Module tracked for cleanup', { moduleName });
  }

  /**
   * Cleanup all registered resources
   * @param {Object} options - Cleanup options
   */
  async cleanup(options = {}) {
    const { 
      force = false, 
      reason = 'manual',
      preserveState = false 
    } = options;

    this.logger.info('Starting application cleanup', { 
      reason, 
      force,
      cleanupFunctions: this.cleanupFunctions.length,
      eventListeners: this.eventListeners.length,
      intervals: this.intervals.length,
      timeouts: this.timeouts.length,
      modules: this.initializedModules.size
    });

    try {
      // 1. Clear all timeouts
      this.timeouts.forEach(({ id, name }) => {
        clearTimeout(id);
        this.logger.debug('Timeout cleared', { name });
      });
      this.timeouts = [];

      // 2. Clear all intervals
      this.intervals.forEach(({ id, name }) => {
        clearInterval(id);
        this.logger.debug('Interval cleared', { name });
      });
      this.intervals = [];

      // 3. Remove all event listeners
      this.eventListeners.forEach(({ target, event, listener, options }) => {
        target.removeEventListener(event, listener, options);
        this.logger.debug('Event listener removed', { 
          event, 
          target: target.constructor.name 
        });
      });
      this.eventListeners = [];

      // 4. Call module cleanup functions
      for (const { name, instance } of this.initializedModules) {
        try {
          if (instance && typeof instance.cleanup === 'function') {
            await instance.cleanup();
            this.logger.debug('Module cleanup completed', { moduleName: name });
          } else if (instance && typeof instance.destroy === 'function') {
            await instance.destroy();
            this.logger.debug('Module destroy completed', { moduleName: name });
          }
        } catch (error) {
          this.logger.warn('Module cleanup failed', { 
            moduleName: name, 
            error: error.message 
          });
        }
      }

      // 5. Call registered cleanup functions
      for (const { fn, name } of this.cleanupFunctions) {
        try {
          await fn();
          this.logger.debug('Cleanup function completed', { name });
        } catch (error) {
          this.logger.warn('Cleanup function failed', { 
            name, 
            error: error.message 
          });
        }
      }

      // 6. Clear tracking arrays
      this.cleanupFunctions = [];
      this.initializedModules.clear();

      // 7. Reset state if not preserving
      if (!preserveState) {
        this.initialized = false;
        this.deviceContext = null;
        this.nativeFeatures = null;
      }

      this.logger.info('Application cleanup completed', { reason });

    } catch (error) {
      this.logger.error('Cleanup failed', { 
        error: error.message, 
        reason 
      });
      throw error;
    }
  }

  /**
   * Complete application destruction
   * @param {Object} options - Destruction options
   */
  async destroy(options = {}) {
    const { reason = 'application-shutdown' } = options;

    this.logger.info('Starting application destruction', { reason });

    try {
      // 1. Cleanup all resources
      await this.cleanup({ ...options, force: true });

      // 2. Clear global references
      if (typeof window !== 'undefined') {
        // Remove global bootstrap references
        delete window.ApplicationBootstrap;
        delete window.applicationBootstrap;
        delete window.AppBootstrap;
        
        // Remove legacy utility functions
        delete window.getMap;
        delete window.BulkOperationManager;
        delete window.beginBulkOperation;
        delete window.endBulkOperation;
        delete window.getResponsiveContext;
        delete window.isMobileSize;
      }

      // 3. Clear module references
      this.initializedModules.clear();
      this.cleanupFunctions = [];
      this.eventListeners = [];
      this.intervals = [];
      this.timeouts = [];

      this.logger.info('Application destruction completed', { reason });

    } catch (error) {
      this.logger.error('Application destruction failed', { 
        error: error.message, 
        reason 
      });
      throw error;
    }
  }
}

// Export singleton instance
export const applicationBootstrap = new ApplicationBootstrap();

// Global exposure is now handled by the consolidated legacy compatibility system
// See setupLegacyBootstrap() method for details
