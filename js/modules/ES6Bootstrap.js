/**
 * @module modules/ES6Bootstrap
 * New ES6-based bootstrap system that replaces legacy bootstrap.js
 * Coordinates migration from legacy to ES6 modules
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { es6IntegrationManager } from './ES6IntegrationManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { legacyCompatibility } from './LegacyCompatibility.js';
import { activeListManager } from './ActiveListManager.js';
import { mapManager } from './MapManager.js';
import { layerManager } from './LayerManager.js';
import { polygonLoader } from './PolygonLoader.js';
import { labelManager } from './LabelManager.js';
import { coordinateConverter } from './CoordinateConverter.js';
import { errorUI } from './ErrorUI.js';
import { textFormatter } from './TextFormatter.js';
import { featureEnhancer } from './FeatureEnhancer.js';
import { appBootstrap } from './AppBootstrap.js';
import { deviceManager } from './DeviceManager.js';
import { uiManager } from './UIManager.js';

/**
 * @class ES6Bootstrap
 * Modern ES6-based application bootstrap system
 */
export class ES6Bootstrap {
  constructor() {
    this.initialized = false;
    this.legacyBootstrap = null;
    this.migrationPhase = 'starting';
    this.initStartTime = performance.now();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.migrateLegacyBootstrap = this.migrateLegacyBootstrap.bind(this);
    this.setupLegacyIntegration = this.setupLegacyIntegration.bind(this);
    this.handleError = this.handleError.bind(this);
    
          // Debug: Check what managers are available in constructor
      console.log('🔍 ES6Bootstrap: Constructor - Available managers:', {
        mapManager: !!mapManager,
        layerManager: !!layerManager,
        polygonLoader: !!polygonLoader,
        labelManager: !!labelManager,
        coordinateConverter: !!coordinateConverter,
        errorUI: !!errorUI,
        textFormatter: !!textFormatter,
        featureEnhancer: !!featureEnhancer,
        appBootstrap: !!appBootstrap,
        deviceManager: !!deviceManager,
        uiManager: !!uiManager
      });
    
    console.log('🚀 ES6Bootstrap: Modern bootstrap system initialized');
  }
  
  /**
   * Initialize the ES6 bootstrap system
   */
  async init() {
    if (this.initialized) {
      console.warn('ES6Bootstrap: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 ES6Bootstrap: Starting modern bootstrap initialization...');
      
      // Phase 1: Wait for DOM and basic dependencies
      await this.waitForDOM();
      await this.waitForBasicDependencies();
      
      // Phase 2: Initialize ES6 integration manager
      await this.initES6Integration();
      
      // Phase 3: Migrate legacy bootstrap functionality
      await this.migrateLegacyBootstrap();
      
      // Phase 4: Initialize modern AppBootstrap
      await this.initAppBootstrap();
      
      // Phase 5: Set up legacy integration
      this.setupLegacyIntegration();
      
      // Phase 6: Initialize UI components
      await this.initUIComponents();
      
      // Phase 7: Initialize core ES6 systems
      await this.initCoreSystems();
      
      // Phase 8: Initialize legacy compatibility
      await this.initLegacyCompatibility();
      
      // Phase 9: Initialize active list manager
      await this.initActiveListManager();
      
      // Phase 10: Initialize map integration modules
      await this.initMapIntegration();
      
      // Phase 11: Initialize legacy function migration modules
      await this.initLegacyFunctionMigration();
      
      // Phase 12: Mark as initialized
      this.initialized = true;
      this.migrationPhase = 'complete';
      
      const initTime = performance.now() - this.initStartTime;
      console.log(`✅ ES6Bootstrap: Modern bootstrap complete (${initTime.toFixed(2)}ms)`);
      
      // Emit completion event
      globalEventBus.emit('es6bootstrap:complete', { bootstrap: this });
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Modern bootstrap failed:', error);
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Wait for basic dependencies to be available
   */
  async waitForBasicDependencies() {
    console.log('⏳ ES6Bootstrap: Waiting for basic dependencies...');
    
    const dependencies = [
      { name: 'L', global: 'L', timeout: 5000 },
      { name: 'DeviceContext', global: 'DeviceContext', timeout: 2000 }
    ];
    
    const promises = dependencies.map(dep => this.waitForGlobal(dep.global, dep.timeout, dep.name));
    
    try {
      await Promise.all(promises);
      console.log('✅ ES6Bootstrap: All basic dependencies ready');
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Some basic dependencies not ready:', error.message);
      // Continue anyway - some dependencies are optional
    }
  }
  
  /**
   * Wait for a global variable to be available
   */
  async waitForGlobal(globalName, timeout = 5000, friendlyName = globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      
      let attempts = 0;
      const maxAttempts = timeout / 100;
      
      const check = () => {
        if (window[globalName]) {
          console.log(`✅ ES6Bootstrap: ${friendlyName} ready`);
          resolve(window[globalName]);
        } else if (attempts++ >= maxAttempts) {
          reject(new Error(`Timeout waiting for ${friendlyName}`));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Initialize ES6 integration manager
   */
  async initES6Integration() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing ES6 integration manager...');
      
      await es6IntegrationManager.init();
      
      if (!es6IntegrationManager.isReady()) {
        throw new Error('ES6 integration manager failed to initialize');
      }
      
      console.log('✅ ES6Bootstrap: ES6 integration manager ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: ES6 integration manager failed:', error);
      throw error;
    }
  }
  
  /**
   * Migrate legacy bootstrap functionality to ES6
   */
  async migrateLegacyBootstrap() {
    try {
      console.log('🔄 ES6Bootstrap: Migrating legacy bootstrap functionality...');
      
      // Check if legacy bootstrap exists
      if (window.AppBootstrap) {
        this.legacyBootstrap = window.AppBootstrap;
        console.log('✅ ES6Bootstrap: Legacy bootstrap found and preserved');
      } else {
        console.warn('⚠️ ES6Bootstrap: No legacy bootstrap found');
      }
      
      // Migrate device context handling
      await this.migrateDeviceContext();
      
      // Migrate responsive handling
      this.migrateResponsiveHandling();
      
      // Migrate orientation handling
      this.migrateOrientationHandling();
      
      console.log('✅ ES6Bootstrap: Legacy bootstrap migration complete');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy bootstrap migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize modern AppBootstrap
   */
  async initAppBootstrap() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing modern AppBootstrap...');
      
      // Initialize device manager first
      await deviceManager.init();
      
      if (!deviceManager.isReady()) {
        throw new Error('Device manager failed to initialize');
      }
      
      // Initialize app bootstrap
      await appBootstrap.init();
      
      if (!appBootstrap.isReady()) {
        throw new Error('AppBootstrap failed to initialize');
      }
      
      console.log('✅ ES6Bootstrap: Modern AppBootstrap ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Modern AppBootstrap failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize UI components
   */
  async initUIComponents() {
    try {
      console.log('🎨 ES6Bootstrap: Initializing UI components...');
      
      // Initialize UI manager
      if (uiManager && typeof uiManager.init === 'function') {
        await uiManager.init();
        
        if (!uiManager.isReady()) {
          throw new Error('UI manager failed to initialize');
        }
        
        console.log('✅ ES6Bootstrap: UI manager ready');
      } else {
        console.warn('⚠️ ES6Bootstrap: UI manager not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: UI components ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: UI components initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Migrate device context handling
   */
  async migrateDeviceContext() {
    try {
      if (window.DeviceContext) {
        const deviceContext = window.DeviceContext.getContext();
        stateManager.set('deviceContext', deviceContext);
        console.log('✅ ES6Bootstrap: Device context migrated to state manager');
      }
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Device context migration failed:', error);
    }
  }
  
  /**
   * Migrate responsive handling
   */
  migrateResponsiveHandling() {
    try {
      // Set up responsive breakpoint handling
      const handleResize = debounce(() => {
        if (window.DeviceContext) {
          const context = window.DeviceContext.getContext();
          stateManager.set('deviceContext', context);
          globalEventBus.emit('device:resize', context);
        }
      }, 250);
      
      window.addEventListener('resize', handleResize);
      console.log('✅ ES6Bootstrap: Responsive handling migrated');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Responsive handling migration failed:', error);
    }
  }
  
  /**
   * Migrate orientation handling
   */
  migrateOrientationHandling() {
    try {
      // Set up orientation change handling
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          if (window.DeviceContext) {
            const context = window.DeviceContext.getContext();
            stateManager.set('deviceContext', context);
            globalEventBus.emit('device:orientationChange', context);
          }
        }, 100);
      });
      
      console.log('✅ ES6Bootstrap: Orientation handling migrated');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Orientation handling migration failed:', error);
    }
  }
  
  /**
   * Set up integration with legacy system
   */
  setupLegacyIntegration() {
    try {
      console.log('🔗 ES6Bootstrap: Setting up legacy integration...');
      
      // Hook into legacy bootstrap if it exists
      if (this.legacyBootstrap && this.legacyBootstrap.init) {
        const originalInit = this.legacyBootstrap.init;
        
        this.legacyBootstrap.init = async function(...args) {
          console.log('🤝 ES6Bootstrap: Legacy bootstrap starting...');
          
          try {
            const result = await originalInit.apply(this, args);
            
            // After legacy init, set up modern enhancements
            globalEventBus.emit('legacy:bootstrapped');
            console.log('✅ ES6Bootstrap: Legacy bootstrap complete, modern enhancements available');
            
            return result;
          } catch (error) {
            console.error('🚨 ES6Bootstrap: Legacy bootstrap failed:', error);
            globalEventBus.emit('legacy:bootstrapError', { error });
            throw error;
          }
        };
        
        console.log('✅ ES6Bootstrap: Legacy bootstrap integration complete');
      }
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Legacy integration setup failed:', error);
    }
  }
  
  /**
   * Initialize core ES6 systems
   */
  async initCoreSystems() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing core ES6 systems...');
      
      // Initialize state manager
      if (stateManager && typeof stateManager.init === 'function') {
        await stateManager.init();
      }
      
      // Initialize configuration manager
      if (configurationManager && typeof configurationManager.init === 'function') {
        await configurationManager.init();
      }
      
      // Set up global event listeners
      this.setupGlobalEvents();
      
      console.log('✅ ES6Bootstrap: Core ES6 systems ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Core systems initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy compatibility layer
   */
  async initLegacyCompatibility() {
    try {
      console.log('🔗 ES6Bootstrap: Initializing legacy compatibility...');
      
      // Initialize legacy compatibility layer
      if (legacyCompatibility && typeof legacyCompatibility.init === 'function') {
        await legacyCompatibility.init();
      }
      
      console.log('✅ ES6Bootstrap: Legacy compatibility ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy compatibility initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize active list manager
   */
  async initActiveListManager() {
    try {
      console.log('📋 ES6Bootstrap: Initializing active list manager...');
      
      // Initialize active list manager
      if (activeListManager && typeof activeListManager.init === 'function') {
        await activeListManager.init();
      }
      
      console.log('✅ ES6Bootstrap: Active list manager ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Active list manager initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize map integration modules
   */
  async initMapIntegration() {
    try {
      console.log('🗺️ ES6Bootstrap: Initializing map integration modules...');
      
      // Debug: Check what managers are available
      console.log('🔍 ES6Bootstrap: Available managers:', {
        mapManager: !!mapManager,
        layerManager: !!layerManager,
        polygonLoader: !!polygonLoader,
        labelManager: !!labelManager
      });
      
      // Initialize map manager first
      if (mapManager && typeof mapManager.init === 'function') {
        console.log('🗺️ ES6Bootstrap: Initializing map manager...');
        await mapManager.init();
        console.log('✅ ES6Bootstrap: Map manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Map manager not available or missing init method');
      }
      
      // Initialize layer manager
      if (layerManager && typeof layerManager.init === 'function') {
        console.log('🔲 ES6Bootstrap: Initializing layer manager...');
        await layerManager.init();
        console.log('✅ ES6Bootstrap: Layer manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Layer manager not available or missing init method');
      }
      
      // Initialize polygon loader
      if (polygonLoader && typeof polygonLoader.init === 'function') {
        console.log('📐 ES6Bootstrap: Initializing polygon loader...');
        await polygonLoader.init();
        console.log('✅ ES6Bootstrap: Polygon loader initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Polygon loader not available or missing init method');
      }
      
      // Initialize label manager
      if (labelManager && typeof labelManager.init === 'function') {
        console.log('🏷️ ES6Bootstrap: Initializing label manager...');
        await labelManager.init();
        console.log('✅ ES6Bootstrap: Label manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Label manager not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: Map integration modules ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Map integration initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy function migration modules
   */
  async initLegacyFunctionMigration() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing legacy function migration modules...');
      
      // Debug: Check what legacy migration modules are available
      console.log('🔍 ES6Bootstrap: Available legacy migration modules:', {
        coordinateConverter: !!coordinateConverter,
        errorUI: !!errorUI,
        textFormatter: !!textFormatter,
        featureEnhancer: !!featureEnhancer
      });
      
      // Initialize coordinate converter
      if (coordinateConverter && typeof coordinateConverter.init === 'function') {
        console.log('🗺️ ES6Bootstrap: Initializing coordinate converter...');
        await coordinateConverter.init();
        console.log('✅ ES6Bootstrap: Coordinate converter initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Coordinate converter not available or missing init method');
      }
      
      // Initialize error UI
      if (errorUI && typeof errorUI.init === 'function') {
        console.log('⚠️ ES6Bootstrap: Initializing error UI...');
        await errorUI.init();
        console.log('✅ ES6Bootstrap: Error UI initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Error UI not available or missing init method');
      }
      
      // Initialize text formatter
      if (textFormatter && typeof textFormatter.init === 'function') {
        console.log('📝 ES6Bootstrap: Initializing text formatter...');
        await textFormatter.init();
        console.log('✅ ES6Bootstrap: Text formatter initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Text formatter not available or missing init method');
      }
      
      // Initialize feature enhancer
      if (featureEnhancer && typeof featureEnhancer.init === 'function') {
        console.log('✨ ES6Bootstrap: Initializing feature enhancer...');
        await featureEnhancer.init();
        console.log('✅ ES6Bootstrap: Feature enhancer initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Feature enhancer not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: Legacy function migration modules ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy function migration initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    try {
      // Handle window resize with throttling
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const context = window.DeviceContext ? window.DeviceContext.getContext() : null;
          if (context) {
            stateManager.set('deviceContext', context);
          }
          globalEventBus.emit('app:resize', { 
            width: window.innerWidth, 
            height: window.innerHeight 
          });
        }, 250);
      });
      
      // Handle visibility change for PWA lifecycle
      document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        stateManager.set('appVisible', isVisible);
        globalEventBus.emit('app:visibilityChange', { visible: isVisible });
      });
      
      console.log('✅ ES6Bootstrap: Global event listeners ready');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Global event setup failed:', error);
    }
  }
  
  /**
   * Handle bootstrap errors
   */
  handleError(error) {
    console.error('🚨 ES6Bootstrap: Handling error:', error);
    
    // Store error in state
    stateManager.set('bootstrapError', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Emit error event
    globalEventBus.emit('es6bootstrap:error', { error });
    
    // Attempt fallback to legacy system
    this.fallbackToLegacy(error);
  }
  
  /**
   * Fallback to legacy system when modern system fails
   */
  fallbackToLegacy(error) {
    console.warn('🔄 ES6Bootstrap: Falling back to legacy system due to:', error.message);
    
    try {
      // Mark modern system as disabled
      window.useModernSystem = false;
      
      // If legacy bootstrap exists, try to use it
      if (this.legacyBootstrap && this.legacyBootstrap.init) {
        console.log('🤝 ES6Bootstrap: Using legacy bootstrap as fallback');
        this.legacyBootstrap.init().catch(console.error);
      } else {
        console.error('🚨 ES6Bootstrap: No legacy bootstrap available for fallback');
      }
      
    } catch (fallbackError) {
      console.error('🚨 ES6Bootstrap: Fallback to legacy also failed:', fallbackError);
    }
  }
  
  /**
   * Get bootstrap status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      migrationPhase: this.migrationPhase,
      legacyBootstrap: !!this.legacyBootstrap,
      initTime: this.initStartTime ? Date.now() - this.initStartTime : 0
    };
  }
  
  /**
   * Check if bootstrap is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Utility function for debouncing
function debounce(func, wait) {
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

// Export singleton instance
export const es6Bootstrap = new ES6Bootstrap();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.ES6Bootstrap = es6Bootstrap;
}
