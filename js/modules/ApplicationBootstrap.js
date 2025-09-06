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
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'ApplicationBootstrap' });
    
    // Bind methods
    this.init = this.init.bind(this);
    this.handleError = this.handleError.bind(this);
    this.safeExecute = this.safeExecute.bind(this);
    
    this.logger.info('Unified application bootstrap system initialized');
  }

  /**
   * Execute a function with error handling and logging
   * @param {string} phase - Name of the initialization phase
   * @param {Function} fn - Function to execute
   */
  async safeExecute(phase, fn) {
    try {
      this.logger.info(`Starting phase: ${phase}`);
      const startTime = performance.now();
      
      await fn();
      
      const duration = performance.now() - startTime;
      this.logger.info(`Completed phase: ${phase}`, { duration });
      
    } catch (error) {
      this.logger.error(`Failed phase: ${phase}`, { 
        error: error.message, 
        stack: error.stack 
      });
      
      // Emit error event for monitoring
      globalEventBus.emit('app:bootstrapError', { 
        error, 
        context: { phase } 
      });
      
      throw error;
    }
  }

  /**
   * Initialize core modules directly
   */
  async initializeCoreModules() {
    this.logger.info('Initializing core modules...');
    
    try {
      // Initialize core modules in dependency order
      const { deviceManager } = await import('./DeviceManager.js');
      await deviceManager.init();
      
      const { collapsibleManager } = await import('./CollapsibleManager.js');
      await collapsibleManager.init();
      
      const { searchManager } = await import('./SearchManager.js');
      await searchManager.init();
      
      const { activeListManager } = await import('./ActiveListManager.js');
      await activeListManager.init();
      
      const { mapManager } = await import('./MapManager.js');
      await mapManager.init();
      
      const { layerManager } = await import('./LayerManager.js');
      await layerManager.init();
      
      const { polygonLoader } = await import('./PolygonLoader.js');
      await polygonLoader.init();
      
      const { labelManager } = await import('./LabelManager.js');
      await labelManager.init();
      
      const { emphasisManager } = await import('./EmphasisManager.js');
      await emphasisManager.init();
      
      const { utilityManager } = await import('./UtilityManager.js');
      await utilityManager.init();
      
      const { uiManager } = await import('./UIManager.js');
      await uiManager.init();
      
      this.logger.info('All core modules initialized');
    } catch (error) {
      this.logger.warn('Some modules failed to initialize', { error: error.message });
      // Continue with initialization - some modules may be optional
    }
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
    if (window.DeviceContext && window.DeviceContext.getContext) {
      return window.DeviceContext.getContext();
    }
    
    // Fallback device context
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
    
    window.addEventListener('resize', this.debounce(updateBreakpoints, 150));
    
    // CSS custom properties for JavaScript integration
    const root = document.documentElement;
    const updateCSSProperties = async () => {
      const context = await this.getDeviceContext();
      root.style.setProperty('--current-breakpoint', context.device);
      root.style.setProperty('--is-touch', context.hasTouch ? '1' : '0');
      root.style.setProperty('--is-landscape', context.orientation === 'landscape' ? '1' : '0');
    };
    
    updateCSSProperties();
    window.addEventListener('resize', this.debounce(updateCSSProperties, 150));
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
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', this.debounce(handleOrientationChange, 300));
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
   * Load data and UI components
   */
  async loadComponents() {
    const { polygonLoader } = await import('./PolygonLoader.js');
    if (polygonLoader && typeof polygonLoader.loadAllPolygons === 'function') {
      await polygonLoader.loadAllPolygons();
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
   * Set up legacy compatibility layer
   */
  async setupLegacyCompatibility() {
    this.logger.info('Setting up legacy compatibility layer...');
    
    // Legacy bootstrap functions
    window.AppBootstrap = {
      init: () => {
        this.logger.info('Legacy AppBootstrap.init() called - delegating to ApplicationBootstrap');
        return this.init();
      }
    };
    
    // Legacy global access patterns
    if (typeof window !== 'undefined') {
      // Expose key managers globally for legacy compatibility
      try {
        const { deviceManager } = await import('./DeviceManager.js');
        if (deviceManager) {
          window.deviceManager = deviceManager;
        }
      } catch (error) {
        this.logger.warn('DeviceManager not available for legacy compatibility', { error: error.message });
      }
      
      // StateManager is already imported at module level
      if (stateManager) {
        window.stateManager = stateManager;
      }
    }
    
    this.logger.info('Legacy compatibility layer active');
  }

  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    // Global error handling
    window.addEventListener('error', (event) => {
      this.logger.error('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
    
    // Global unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
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
   * Handle errors with recovery strategies
   */
  handleError(error, context = {}) {
    this.logger.error('Bootstrap error', {
      error: error.message,
      stack: error.stack,
      context
    });
    
    // Emit error event for global handling
    globalEventBus.emit('app:bootstrapError', { error, context });
    
    throw error;
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
      
      // Phase 1: Wait for DOM
      await this.safeExecute('DOM ready', async () => {
        await this.waitForDOM();
      });
      
      // Phase 2: Initialize core modules directly
      await this.safeExecute('core module initialization', async () => {
        await this.initializeCoreModules();
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
      });
      
      // Phase 12: Set up UI components
      await this.safeExecute('UI components', async () => {
        await this.setupUI();
      });
      
      // Phase 13: Load data and components
      await this.safeExecute('data loading', async () => {
        await this.loadComponents();
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
      
      // Phase 18: Mark as initialized
      this.initialized = true;
      
      const initTime = performance.now() - this.initStartTime;
      this.logger.info(`Unified application bootstrap complete`, { duration: initTime });
      
      // Emit completion event
      globalEventBus.emit('app:bootstrapComplete', { bootstrap: this });
      
    } catch (error) {
      this.handleError(error, { phase: 'bootstrap' });
    }
  }
}

// Export singleton instance
export const applicationBootstrap = new ApplicationBootstrap();

// Export for global access
if (typeof window !== 'undefined') {
  window.ApplicationBootstrap = applicationBootstrap;
  
  // Legacy compatibility layer
  console.log('🔧 ApplicationBootstrap: Setting up legacy compatibility layer');
  
  // Legacy initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applicationBootstrap.init());
  } else {
    applicationBootstrap.init();
  }
  
  console.log('✅ ApplicationBootstrap: Legacy compatibility layer active');
}
