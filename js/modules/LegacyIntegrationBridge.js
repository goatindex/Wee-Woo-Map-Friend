/**
 * @module modules/LegacyIntegrationBridge
 * Bridge system for seamless integration between legacy and ES6 systems
 * Provides backward compatibility while enabling modern architecture
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class LegacyIntegrationBridge
 * Bridges legacy functions with modern ES6 modules
 */
export class LegacyIntegrationBridge {
  constructor() {
    this.initialized = false;
    this.legacyFunctions = new Map();
    this.es6Modules = new Map();
    this.migrationMap = new Map();
    this.compatibilityLayer = new Map();
    
    // Legacy function mappings
    this.legacyMappings = {
      // Data loading functions
      'loadPolygonCategory': 'polygonLoader.loadCategory',
      'loadSesFacilities': 'pointLoader.loadSesFacilities',
      'loadCfaFacilities': 'pointLoader.loadCfaFacilities',
      'loadAmbulance': 'pointLoader.loadAmbulance',
      'loadPolice': 'pointLoader.loadPolice',
      
      // Map functions
      'getMap': 'mapManager.getMap',
      'resetView': 'mapManager.resetView',
      'addToMap': 'layerManager.addLayer',
      'removeFromMap': 'layerManager.removeLayer',
      
      // UI functions
      'setupCollapsible': 'collapsibleManager.setupCollapsible',
      'updateActiveList': 'activeListManager.updateActiveList',
      'showSidebarError': 'errorUI.showSidebarError',
      
      // Utility functions
      'convertMGA94ToLatLon': 'coordinateConverter.convertMGA94ToLatLon',
      'normalizeName': 'textFormatter.normalizeName'
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupLegacyDelegation = this.setupLegacyDelegation.bind(this);
    this.migratePreloaderCalls = this.migratePreloaderCalls.bind(this);
    this.createCompatibilityLayer = this.createCompatibilityLayer.bind(this);
    this.delegateLegacyFunction = this.delegateLegacyFunction.bind(this);
    this.handleLegacyError = this.handleLegacyError.bind(this);
    this.getBridgeStatus = this.getBridgeStatus.bind(this);
    
    console.log('🌉 LegacyIntegrationBridge: Legacy integration bridge initialized');
  }
  
  /**
   * Initialize the legacy integration bridge
   */
  async init() {
    if (this.initialized) {
      console.warn('LegacyIntegrationBridge: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 LegacyIntegrationBridge: Starting initialization...');
      
      // Set up legacy function delegation
      await this.setupLegacyDelegation();
      
      // Migrate legacy preloader calls
      await this.migratePreloaderCalls();
      
      // Create compatibility layer
      this.createCompatibilityLayer();
      
      // Set up error handling
      this.setupErrorHandling();
      
      this.initialized = true;
      console.log('✅ LegacyIntegrationBridge: Initialization complete');
      
      // Emit ready event
      globalEventBus.emit('legacyBridge:ready', { bridge: this });
      
    } catch (error) {
      console.error('🚨 LegacyIntegrationBridge: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up legacy function delegation to ES6 modules
   */
  async setupLegacyDelegation() {
    console.log('🔧 LegacyIntegrationBridge: Setting up legacy function delegation...');
    
    // Wait for ES6 modules to be available
    await this.waitForES6Modules();
    
    // Set up each legacy function mapping
    Object.entries(this.legacyMappings).forEach(([legacyFunction, es6Mapping]) => {
      this.setupLegacyFunction(legacyFunction, es6Mapping);
    });
    
    console.log('✅ LegacyIntegrationBridge: Legacy function delegation setup complete');
  }
  
  /**
   * Wait for ES6 modules to be available
   */
  async waitForES6Modules() {
    console.log('⏳ LegacyIntegrationBridge: Waiting for ES6 modules...');
    
    const requiredModules = [
      'polygonLoader',
      'mapManager', 
      'layerManager',
      'activeListManager',
      'collapsibleManager'
    ];
    
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait
    
    while (attempts < maxAttempts) {
      const availableModules = requiredModules.filter(moduleName => {
        const module = stateManager.get(moduleName);
        return module && typeof module === 'object';
      });
      
      if (availableModules.length === requiredModules.length) {
        console.log('✅ LegacyIntegrationBridge: All required ES6 modules available');
        return;
      }
      
      // Wait 100ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.warn('⚠️ LegacyIntegrationBridge: Some ES6 modules not available after timeout');
  }
  
  /**
   * Set up a single legacy function
   */
  setupLegacyFunction(legacyFunction, es6Mapping) {
    console.log(`🔧 LegacyIntegrationBridge: Setting up ${legacyFunction} -> ${es6Mapping}`);
    
    // Parse ES6 mapping (e.g., "polygonLoader.loadCategory")
    const [moduleName, methodName] = es6Mapping.split('.');
    
    // Create delegated function
    const delegatedFunction = async (...args) => {
      try {
        const module = stateManager.get(moduleName);
        if (!module) {
          throw new Error(`LegacyIntegrationBridge: ES6 module ${moduleName} not available`);
        }
        
        if (typeof module[methodName] !== 'function') {
          throw new Error(`LegacyIntegrationBridge: Method ${methodName} not found on ${moduleName}`);
        }
        
        console.log(`🌉 LegacyIntegrationBridge: Delegating ${legacyFunction} to ${es6Mapping}`);
        return await module[methodName](...args);
        
      } catch (error) {
        console.error(`🚨 LegacyIntegrationBridge: Delegation failed for ${legacyFunction}:`, error);
        this.handleLegacyError(legacyFunction, error);
        throw error;
      }
    };
    
    // Store in legacy functions map
    this.legacyFunctions.set(legacyFunction, delegatedFunction);
    
    // Set up window global
    if (typeof window !== 'undefined') {
      window[legacyFunction] = delegatedFunction;
    }
    
    console.log(`✅ LegacyIntegrationBridge: ${legacyFunction} delegation setup complete`);
  }
  
  /**
   * Migrate legacy preloader calls to ES6 orchestration
   */
  async migratePreloaderCalls() {
    console.log('🔧 LegacyIntegrationBridge: Migrating legacy preloader calls...');
    
    // Check if legacy preloader exists
    if (typeof window.preloadOrder === 'undefined') {
      console.log('ℹ️ LegacyIntegrationBridge: No legacy preloader found, skipping migration');
      return;
    }
    
    // Convert legacy preloader calls to ES6 orchestration
    const preloadOrder = window.preloadOrder || [];
    
    preloadOrder.forEach(item => {
      if (item.loader && typeof item.loader === 'function') {
        // Wrap legacy loader with ES6 orchestration
        const originalLoader = item.loader;
        item.loader = async () => {
          try {
            console.log(`🌉 LegacyIntegrationBridge: Migrating preloader call: ${item.name}`);
            
            // Execute original loader
            const result = await originalLoader();
            
            // Emit event for ES6 orchestration
            globalEventBus.emit('legacyBridge:preloaderMigrated', { 
              name: item.name, 
              result,
              bridge: this 
            });
            
            return result;
            
          } catch (error) {
            console.error(`🚨 LegacyIntegrationBridge: Preloader migration failed for ${item.name}:`, error);
            this.handleLegacyError(`preloader:${item.name}`, error);
            throw error;
          }
        };
      }
    });
    
    console.log('✅ LegacyIntegrationBridge: Legacy preloader migration complete');
  }
  
  /**
   * Create compatibility layer for legacy code
   */
  createCompatibilityLayer() {
    console.log('🔧 LegacyIntegrationBridge: Creating compatibility layer...');
    
    // Set up legacy global variables
    if (typeof window !== 'undefined') {
      // Legacy state variables
      window.featureLayers = window.featureLayers || {};
      window.namesByCategory = window.namesByCategory || {};
      window.nameToKey = window.nameToKey || {};
      window.emphasised = window.emphasised || {};
      window.nameLabelMarkers = window.nameLabelMarkers || {};
      window.pendingLabels = window.pendingLabels || [];
      
      // Legacy configuration
      window.categoryMeta = window.categoryMeta || {};
      window.outlineColors = window.outlineColors || {};
      window.baseOpacities = window.baseOpacities || {};
      
      // Legacy utility functions
      window.BulkOperationManager = window.BulkOperationManager || {
        begin: () => true,
        end: () => {},
        isActive: () => false
      };
      
      // Legacy UI functions
      window.beginActiveListBulk = window.beginActiveListBulk || (() => {});
      window.endActiveListBulk = window.endActiveListBulk || (() => {});
    }
    
    // Set up state synchronization
    this.setupStateSynchronization();
    
    console.log('✅ LegacyIntegrationBridge: Compatibility layer created');
  }
  
  /**
   * Set up state synchronization between legacy and ES6 systems
   */
  setupStateSynchronization() {
    // Listen for ES6 state changes and update legacy globals
    globalEventBus.on('state:featureLayersChanged', ({ featureLayers }) => {
      if (typeof window !== 'undefined') {
        window.featureLayers = featureLayers;
      }
    });
    
    globalEventBus.on('state:namesByCategoryChanged', ({ namesByCategory }) => {
      if (typeof window !== 'undefined') {
        window.namesByCategory = namesByCategory;
      }
    });
    
    globalEventBus.on('state:nameToKeyChanged', ({ nameToKey }) => {
      if (typeof window !== 'undefined') {
        window.nameToKey = nameToKey;
      }
    });
    
    // Listen for legacy state changes and update ES6 state
    if (typeof window !== 'undefined') {
      // Set up watchers for legacy global changes
      this.setupLegacyStateWatchers();
    }
    
    console.log('✅ LegacyIntegrationBridge: State synchronization setup complete');
  }
  
  /**
   * Set up watchers for legacy state changes
   */
  setupLegacyStateWatchers() {
    // Watch for changes to legacy globals and sync to ES6 state
    const legacyGlobals = ['featureLayers', 'namesByCategory', 'nameToKey', 'emphasised'];
    
    legacyGlobals.forEach(globalName => {
      if (window[globalName]) {
        // Create a proxy to watch for changes
        const originalValue = window[globalName];
        window[globalName] = new Proxy(originalValue, {
          set: (target, property, value) => {
            target[property] = value;
            
            // Emit event for ES6 state update
            globalEventBus.emit(`legacyBridge:${globalName}Changed`, { 
              property, 
              value,
              bridge: this 
            });
            
            return true;
          }
        });
      }
    });
    
    console.log('✅ LegacyIntegrationBridge: Legacy state watchers setup complete');
  }
  
  /**
   * Set up error handling for legacy integration
   */
  setupErrorHandling() {
    // Listen for legacy errors
    globalEventBus.on('legacyBridge:error', ({ functionName, error }) => {
      console.error(`🚨 LegacyIntegrationBridge: Legacy function error (${functionName}):`, error);
      
      // Emit error event for error handling system
      globalEventBus.emit('system:error', { 
        source: 'legacyBridge',
        functionName,
        error,
        bridge: this 
      });
    });
    
    console.log('✅ LegacyIntegrationBridge: Error handling setup complete');
  }
  
  /**
   * Handle legacy function errors
   */
  handleLegacyError(functionName, error) {
    console.error(`🚨 LegacyIntegrationBridge: Error in legacy function ${functionName}:`, error);
    
    // Emit error event
    globalEventBus.emit('legacyBridge:error', { 
      functionName, 
      error,
      bridge: this 
    });
    
    // Attempt recovery if possible
    this.attemptLegacyRecovery(functionName, error);
  }
  
  /**
   * Attempt recovery for legacy function errors
   */
  attemptLegacyRecovery(functionName, error) {
    console.log(`🔄 LegacyIntegrationBridge: Attempting recovery for ${functionName}`);
    
    // Recovery strategies based on function type
    if (functionName.startsWith('load')) {
      // Data loading errors - retry with exponential backoff
      setTimeout(() => {
        console.log(`🔄 LegacyIntegrationBridge: Retrying ${functionName}`);
        // Retry logic would go here
      }, 1000);
    } else if (functionName.startsWith('setup')) {
      // Setup errors - reinitialize
      console.log(`🔄 LegacyIntegrationBridge: Reinitializing ${functionName}`);
      // Reinitialization logic would go here
    }
  }
  
  /**
   * Get bridge status and statistics
   */
  getBridgeStatus() {
    return {
      initialized: this.initialized,
      legacyFunctions: Array.from(this.legacyFunctions.keys()),
      es6Modules: Array.from(this.es6Modules.keys()),
      migrationMap: Array.from(this.migrationMap.keys()),
      compatibilityLayer: Array.from(this.compatibilityLayer.keys()),
      totalLegacyFunctions: this.legacyFunctions.size,
      totalES6Modules: this.es6Modules.size
    };
  }
  
  /**
   * Check if a legacy function is available
   */
  isLegacyFunctionAvailable(functionName) {
    return this.legacyFunctions.has(functionName);
  }
  
  /**
   * Get ES6 module for a legacy function
   */
  getES6ModuleForLegacyFunction(functionName) {
    const mapping = this.legacyMappings[functionName];
    if (!mapping) return null;
    
    const [moduleName] = mapping.split('.');
    return stateManager.get(moduleName);
  }
  
  /**
   * Check if bridge is ready
   */
  isReady() {
    return this.initialized && this.legacyFunctions.size > 0;
  }
}

// Export singleton instance
export const legacyIntegrationBridge = new LegacyIntegrationBridge();

