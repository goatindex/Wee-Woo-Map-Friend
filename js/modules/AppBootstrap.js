/**
 * @module modules/AppBootstrap
 * Modern ES6-based application bootstrap for WeeWoo Map Friend
 * Replaces legacy bootstrap.js with modern ES6 architecture
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { mapManager } from './MapManager.js';
import { layerManager } from './LayerManager.js';
import { deviceManager } from './DeviceManager.js';

/**
 * @class AppBootstrap
 * Modern ES6-based application bootstrap system
 */
export class AppBootstrap {
  constructor() {
    this.initialized = false;
    this.initStartTime = performance.now();
    this.deviceContext = null;
    this.nativeFeatures = null;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.waitForNativeFeatures = this.waitForNativeFeatures.bind(this);
    this.applyDeviceStyles = this.applyDeviceStyles.bind(this);
    this.initResponsiveHandling = this.initResponsiveHandling.bind(this);
    this.setupOrientationHandling = this.setupOrientationHandling.bind(this);
    this.initNativeIntegration = this.initNativeIntegration.bind(this);
    this.setupUI = this.setupUI.bind(this);
    this.loadComponents = this.loadComponents.bind(this);
    this.setupEventHandlers = this.setupEventHandlers.bind(this);
    this.handleInitialLocation = this.handleInitialLocation.bind(this);
    this.handleError = this.handleError.bind(this);
    
    console.log('🚀 AppBootstrap: Modern bootstrap system initialized');
  }
  
  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) {
      console.warn('AppBootstrap: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 AppBootstrap: Starting application initialization...');
      
      // Step 1: Wait for native features to be ready
      console.log('AppBootstrap: Step 1: Waiting for native features');
      this.nativeFeatures = await this.waitForNativeFeatures();
      
      // Step 2: Get device context with native info
      console.log('AppBootstrap: Step 2: Getting device context');
      this.deviceContext = await this.getDeviceContext();
      console.log('AppBootstrap: Device context initialized', this.deviceContext);
      
      // Step 3: Apply device-specific styling
      console.log('AppBootstrap: Step 3: Applying device styles');
      this.applyDeviceStyles(this.deviceContext);
      
      // Step 4: Initialize responsive breakpoint handling
      console.log('AppBootstrap: Step 4: Initializing responsive handling');
      this.initResponsiveHandling();
      
      // Step 5: Set up orientation change handling
      console.log('AppBootstrap: Step 5: Setting up orientation handling');
      this.setupOrientationHandling();
      
      // Step 6: Initialize native app integration
      console.log('AppBootstrap: Step 6: Initializing native integration');
      await this.initNativeIntegration();
      
      // Step 7: Initialize ES6 map system
      console.log('AppBootstrap: Step 7: Initializing ES6 map system');
      await this.initES6MapSystem();
      
      // Step 8: Set up collapsibles and UI components
      console.log('AppBootstrap: Step 8: Setting up UI components');
      this.setupUI();
      
      // Step 9: Initialize mobile documentation navigation
      if (window.MobileDocsNav) {
        console.log('AppBootstrap: Step 9: Initializing mobile docs navigation');
        window.MobileDocsNav.init();
      }
      
      // Step 10: Load data and UI components
      console.log('AppBootstrap: Step 10: Loading application components');
      await this.loadComponents();
      
      // Step 11: Set up event handlers
      console.log('AppBootstrap: Step 11: Setting up event handlers');
      this.setupEventHandlers();
      
      // Step 12: Handle initial geolocation
      console.log('AppBootstrap: Step 12: Handling initial location');
      this.handleInitialLocation();
      
      // Mark as initialized
      this.initialized = true;
      const endTime = performance.now();
      const initTime = endTime - this.initStartTime;
      
      console.log(`✅ AppBootstrap: Application initialization complete in ${initTime.toFixed(2)}ms`);
      
      // Emit ready event
      globalEventBus.emit('appbootstrap:ready', { 
        initTime, 
        deviceContext: this.deviceContext,
        nativeFeatures: this.nativeFeatures 
      });
      
    } catch (error) {
      console.error('🚨 AppBootstrap: Initialization failed:', error);
      this.handleError(error);
    }
  }
  
  /**
   * Wait for native features to be ready
   */
  async waitForNativeFeatures() {
    return new Promise((resolve) => {
      if (window.NativeFeatures) {
        // Listen for native features ready event
        window.addEventListener('nativeFeaturesReady', (event) => {
          console.log('AppBootstrap: Native features ready:', event.detail);
          resolve(event.detail);
        }, { once: true });
        
        // Fallback timeout
        setTimeout(() => {
          console.log('AppBootstrap: Native features timeout, continuing with web-only');
          resolve({ isNative: false });
        }, 1000);
      } else {
        resolve({ isNative: false });
      }
    });
  }
  
  /**
   * Get device context
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
   * Apply device-specific styles and classes
   */
  applyDeviceStyles(deviceContext) {
    const body = document.body;
    
    // Remove any existing device classes
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'device-large');
    body.classList.remove('platform-ios', 'platform-android', 'platform-web');
    body.classList.remove('context-portrait', 'context-landscape');
    
    // Add current device classes
    body.classList.add(`device-${deviceContext.breakpoint}`);
    body.classList.add(`platform-${deviceContext.platform}`);
    body.classList.add(`context-${deviceContext.orientation}`);
    
    // Add touch/hover context
    if (deviceContext.hasTouch) {
      body.classList.add('has-touch');
    } else {
      body.classList.add('no-touch');
    }
    
    // Add standalone/native app context
    if (deviceContext.isStandalone || (window.NativeFeatures && window.NativeFeatures.isNativeApp())) {
      body.classList.add('app-standalone');
    }
    
    console.log('AppBootstrap: Applied device styles:', {
      device: deviceContext.device,
      platform: deviceContext.platform,
      orientation: deviceContext.orientation,
      hasTouch: deviceContext.hasTouch,
      isStandalone: deviceContext.isStandalone
    });
  }
  
  /**
   * Initialize responsive breakpoint handling
   */
  initResponsiveHandling() {
    // Update breakpoint classes on resize
    const updateBreakpoints = () => {
      const deviceContext = this.getDeviceContext();
      this.applyDeviceStyles(deviceContext);
    };
    
    window.addEventListener('resize', this.debounce(updateBreakpoints, 150));
    
    // CSS custom properties for JavaScript integration
    const root = document.documentElement;
    const updateCSSProperties = () => {
      const context = this.getDeviceContext();
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
      setTimeout(() => {
        const deviceContext = this.getDeviceContext();
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
    window.addEventListener('resize', this.debounce(handleOrientationChange, 150));
  }
  
  /**
   * Initialize native app integration
   */
  async initNativeIntegration() {
    if (window.NativeFeatures && window.NativeFeatures.isNativeApp()) {
      console.log('AppBootstrap: Setting up native app integration');
      
      // Handle native app state changes
      window.addEventListener('nativeAppStateChange', (event) => {
        console.log('AppBootstrap: App state changed:', event.detail);
        
        if (event.detail.isActive) {
          // App became active - refresh data if needed
          this.handleAppActivation();
        } else {
          // App went to background - save state if needed
          this.handleAppBackground();
        }
      });
      
      // Handle native back button
      window.addEventListener('nativeBackButton', (event) => {
        console.log('AppBootstrap: Native back button pressed');
        this.handleNativeBackButton();
      });
      
      // Set up native geolocation enhancement
      this.setupNativeGeolocation();
      
    } else {
      console.log('AppBootstrap: Running in web browser mode');
    }
  }
  
  /**
   * Initialize ES6 map system
   */
  async initES6MapSystem() {
    try {
      // Initialize map manager
      await mapManager.init();
      
      // Initialize layer manager
      await layerManager.init();
      
      // Store map reference in state manager for legacy compatibility
      const map = mapManager.getMap();
      if (map) {
        stateManager.set('map', map);
        window.map = map; // Legacy compatibility
        
        // Store default view
        const defaultView = {
          center: map.getCenter(),
          zoom: map.getZoom()
        };
        stateManager.set('defaultView', defaultView);
        window.DEFAULT_VIEW = defaultView; // Legacy compatibility
        
        console.log('AppBootstrap: ES6 map system initialized successfully');
      } else {
        throw new Error('Map manager failed to provide map instance');
      }
      
    } catch (error) {
      console.error('AppBootstrap: ES6 map system initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up UI components
   */
  setupUI() {
    try {
      // Set up collapsible sections
      if (window.setupCollapsible) {
        window.setupCollapsible();
      }
      
      // Set up FAB buttons
      if (window.FABManager) {
        window.FABManager.init();
      }
      
      console.log('AppBootstrap: UI components setup complete');
      
    } catch (error) {
      console.warn('AppBootstrap: UI setup failed:', error);
    }
  }
  
  /**
   * Load application components
   */
  async loadComponents() {
    try {
      // Load category metadata
      if (window.loadCategoryMeta) {
        await window.loadCategoryMeta();
      }
      
      // Load initial data layers
      if (window.loadInitialLayers) {
        await window.loadInitialLayers();
      }
      
      console.log('AppBootstrap: Application components loaded');
      
    } catch (error) {
      console.warn('AppBootstrap: Component loading failed:', error);
    }
  }
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    try {
      // Set up global error handling
      window.addEventListener('error', (event) => {
        console.error('AppBootstrap: Global error:', event.error);
        globalEventBus.emit('app:error', { error: event.error });
      });
      
      // Set up unhandled promise rejection handling
      window.addEventListener('unhandledrejection', (event) => {
        console.error('AppBootstrap: Unhandled promise rejection:', event.reason);
        globalEventBus.emit('app:unhandledRejection', { reason: event.reason });
      });
      
      console.log('AppBootstrap: Event handlers setup complete');
      
    } catch (error) {
      console.warn('AppBootstrap: Event handler setup failed:', error);
    }
  }
  
  /**
   * Handle initial location
   */
  handleInitialLocation() {
    try {
      // Handle initial geolocation if available
      if (navigator.geolocation && window.handleInitialLocation) {
        window.handleInitialLocation();
      }
      
      console.log('AppBootstrap: Initial location handling complete');
      
    } catch (error) {
      console.warn('AppBootstrap: Initial location handling failed:', error);
    }
  }
  
  /**
   * Handle app activation (foreground)
   */
  handleAppActivation() {
    // Refresh map if needed
    const map = stateManager.get('map');
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
    
    // Check for data updates
    globalEventBus.emit('app:activated');
  }
  
  /**
   * Handle app going to background
   */
  handleAppBackground() {
    // Save current state
    if (stateManager) {
      stateManager.saveState();
    }
    
    globalEventBus.emit('app:backgrounded');
  }
  
  /**
   * Handle native back button
   */
  handleNativeBackButton() {
    // Check if any modals are open
    const openModal = document.querySelector('.app-modal:not([hidden])');
    const openDrawer = document.querySelector('.docs-drawer:not([hidden])');
    
    if (openModal) {
      openModal.hidden = true;
      const overlay = document.querySelector('.app-overlay');
      if (overlay) overlay.hidden = true;
      return;
    }
    
    if (openDrawer) {
      openDrawer.hidden = true;
      const overlay = document.querySelector('.app-overlay');
      if (overlay) overlay.hidden = true;
      return;
    }
    
    // If nothing to close, minimize app (native only)
    if (window.NativeFeatures && window.NativeFeatures.hasFeature('app')) {
      // Could implement app minimization here
    }
  }
  
  /**
   * Set up enhanced geolocation with native features
   */
  setupNativeGeolocation() {
    if (!window.NativeFeatures) return;
    
    // Replace global geolocation functions with native-enhanced versions
    window.getEnhancedPosition = async (options) => {
      try {
        const position = await window.NativeFeatures.getCurrentPosition(options);
        console.log('AppBootstrap: Enhanced position obtained:', position);
        return position;
      } catch (error) {
        console.warn('AppBootstrap: Enhanced geolocation failed:', error);
        throw error;
      }
    };
    
    window.watchEnhancedPosition = (callback, options) => {
      try {
        return window.NativeFeatures.watchPosition(callback, options);
      } catch (error) {
        console.warn('AppBootstrap: Enhanced position watching failed:', error);
        throw error;
      }
    };
  }
  
  /**
   * Handle bootstrap errors
   */
  handleError(error) {
    console.error('🚨 AppBootstrap: Handling error:', error);
    
    // Store error in state
    stateManager.set('bootstrapError', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Emit error event
    globalEventBus.emit('appbootstrap:error', { error });
    
    // Show user-friendly error message
    if (window.ErrorUI) {
      window.ErrorUI.showError('Application Initialization Error', error.message);
    }
  }
  
  /**
   * Utility function for debouncing
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
   * Get bootstrap status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      initTime: this.initStartTime ? Date.now() - this.initStartTime : 0,
      deviceContext: this.deviceContext,
      nativeFeatures: this.nativeFeatures
    };
  }
  
  /**
   * Check if bootstrap is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Export singleton instance
export const appBootstrap = new AppBootstrap();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.AppBootstrap = appBootstrap;
}
