/**
 * @module modules/LegacyCompatibility
 * Legacy compatibility layer for WeeWoo Map Friend
 * Maintains backward compatibility during ES6 migration
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class LegacyCompatibility
 * Provides backward compatibility for legacy window globals
 */
export class LegacyCompatibility {
  constructor() {
    this.initialized = false;
    this.legacyGlobals = new Map();
    this.legacyFunctions = new Map();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupLegacyGlobals = this.setupLegacyGlobals.bind(this);
    this.setupLegacyFunctions = this.setupLegacyFunctions.bind(this);
    this.createLegacyProxy = this.createLegacyProxy.bind(this);
    this.updateLegacyGlobal = this.updateLegacyGlobal.bind(this);
    
    console.log('🔗 LegacyCompatibility: Compatibility layer initialized');
  }
  
  /**
   * Initialize the legacy compatibility layer
   */
  async init() {
    if (this.initialized) {
      console.warn('LegacyCompatibility: Already initialized');
      return;
    }
    
    try {
      console.log('🔗 LegacyCompatibility: Setting up legacy compatibility...');
      
      // Set up legacy globals
      this.setupLegacyGlobals();
      
      // Set up legacy functions
      this.setupLegacyFunctions();
      
      // Set up event listeners for state changes
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ LegacyCompatibility: Legacy compatibility layer ready');
      
    } catch (error) {
      console.error('🚨 LegacyCompatibility: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Set up legacy global variables
   */
  setupLegacyGlobals() {
    // State-related globals
    this.createLegacyProxy('featureLayers', 'featureLayers');
    this.createLegacyProxy('namesByCategory', 'namesByCategory');
    this.createLegacyProxy('nameToKey', 'nameToKey');
    this.createLegacyProxy('emphasised', 'emphasised');
    this.createLegacyProxy('nameLabelMarkers', 'nameLabelMarkers');
    this.createLegacyProxy('activeListFilter', 'activeListFilter');
    this.createLegacyProxy('isBulkOperation', 'isBulkOperation');
    this.createLegacyProxy('pendingLabels', 'pendingLabels');
    
    // Configuration-related globals
    this.createLegacyProxy('outlineColors', 'outlineColors');
    this.createLegacyProxy('baseOpacities', 'baseOpacities');
    this.createLegacyProxy('labelColorAdjust', 'labelColorAdjust');
    this.createLegacyProxy('headerColorAdjust', 'headerColorAdjust');
    this.createLegacyProxy('categoryMeta', 'categoryMeta');
    
    // Map-related globals
    this.createLegacyProxy('map', 'map');
    
    console.log('✅ LegacyCompatibility: Legacy globals setup complete');
  }
  
  /**
   * Set up legacy functions
   */
  setupLegacyFunctions() {
    // Configuration utility functions
    this.legacyFunctions.set('adjustHexColor', (hex, factor) => {
      return configurationManager.get('utils.adjustHexColor')(hex, factor);
    });
    
    // Style functions
    this.legacyFunctions.set('sesStyle', () => {
      return configurationManager.get('styles.sesStyle')();
    });
    
    this.legacyFunctions.set('lgaStyle', () => {
      return configurationManager.get('styles.lgaStyle')();
    });
    
    this.legacyFunctions.set('cfaStyle', () => {
      return configurationManager.get('styles.cfaStyle')();
    });
    
    this.legacyFunctions.set('frvStyle', () => {
      return configurationManager.get('styles.frvStyle')();
    });
    
    // State utility functions
    this.legacyFunctions.set('setActiveListFilter', (v) => {
      stateManager.set('activeListFilter', v);
    });
    
    // Active list functions
    this.legacyFunctions.set('updateActiveList', () => {
      if (window.activeListManager) {
        window.activeListManager.updateActiveList();
      }
    });
    
    this.legacyFunctions.set('beginActiveListBulk', () => {
      if (window.activeListManager) {
        window.activeListManager.beginBulkOperation();
      }
    });
    
    this.legacyFunctions.set('endActiveListBulk', () => {
      if (window.activeListManager) {
        window.activeListManager.endBulkOperation();
      }
    });
    
    this.legacyFunctions.set('setupActiveListSync', (category) => {
      // This is now handled automatically by the ActiveListManager
      console.log(`🔄 ActiveListManager: Auto-sync enabled for ${category}`);
    });
    
    // Bulk operation functions
    this.legacyFunctions.set('beginBulkOperation', () => {
      return window.BulkOperationManager ? window.BulkOperationManager.begin('legacy') : false;
    });
    
    this.legacyFunctions.set('endBulkOperation', () => {
      if (window.BulkOperationManager) {
        window.BulkOperationManager.end();
      }
    });
    
    // Apply legacy functions to window
    this.legacyFunctions.forEach((func, name) => {
      window[name] = func;
    });
    
    console.log('✅ LegacyCompatibility: Legacy functions setup complete');
  }
  
  /**
   * Create a legacy proxy for a global variable
   * @param {string} globalName - Name of the global variable
   * @param {string} statePath - Path in the state manager
   */
  createLegacyProxy(globalName, statePath) {
    // Store the original value if it exists
    if (window[globalName] !== undefined) {
      this.legacyGlobals.set(globalName, window[globalName]);
    }
    
    // Create a proxy that syncs with the state manager
    let currentValue = stateManager.get(statePath);
    
    Object.defineProperty(window, globalName, {
      get: () => {
        // Get current value from state manager
        currentValue = stateManager.get(statePath);
        return currentValue;
      },
      set: (value) => {
        // Update state manager
        stateManager.set(statePath, value);
        currentValue = value;
        
        // Emit legacy update event
        globalEventBus.emit('legacy:globalUpdate', { 
          globalName, 
          value, 
          statePath 
        });
      },
      configurable: true,
      enumerable: true
    });
    
    // Store the proxy for later cleanup
    this.legacyGlobals.set(globalName, { proxy: true, statePath });
  }
  
  /**
   * Update a legacy global variable
   * @param {string} globalName - Name of the global variable
   * @param {any} value - New value
   */
  updateLegacyGlobal(globalName, value) {
    if (this.legacyGlobals.has(globalName)) {
      const legacy = this.legacyGlobals.get(globalName);
      if (legacy.proxy && legacy.statePath) {
        stateManager.set(legacy.statePath, value);
      } else {
        window[globalName] = value;
      }
    }
  }
  
  /**
   * Set up event listeners for state changes
   */
  setupEventListeners() {
    // Listen for state changes and update legacy globals
    globalEventBus.on('stateChange', ({ property, value }) => {
      // Find legacy globals that map to this state property
      this.legacyGlobals.forEach((legacy, globalName) => {
        if (legacy.proxy && legacy.statePath === property) {
          // The proxy will handle the update automatically
          console.log(`🔄 LegacyCompatibility: Synced ${globalName} with ${property}`);
        }
      });
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      // Update legacy globals that depend on this configuration
      this._updateLegacyFromConfig(path, value);
    });
    
    console.log('✅ LegacyCompatibility: Event listeners setup complete');
  }
  
  /**
   * Update legacy globals when configuration changes
   * @private
   * @param {string} configPath - Configuration path that changed
   * @param {any} value - New configuration value
   */
  _updateLegacyFromConfig(configPath, value) {
    // Map configuration paths to legacy globals
    const configToLegacy = {
      'outlineColors': 'outlineColors',
      'baseOpacities': 'baseOpacities',
      'labelColorAdjust': 'labelColorAdjust',
      'headerColorAdjust': 'headerColorAdjust',
      'categoryMeta': 'categoryMeta'
    };
    
    const rootPath = configPath.split('.')[0];
    if (configToLegacy[rootPath]) {
      const globalName = configToLegacy[rootPath];
      this.updateLegacyGlobal(globalName, configurationManager.get(rootPath));
    }
  }
  
  /**
   * Get compatibility status
   * @returns {Object} Compatibility status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      legacyGlobals: this.legacyGlobals.size,
      legacyFunctions: this.legacyFunctions.size,
      globals: Array.from(this.legacyGlobals.keys()),
      functions: Array.from(this.legacyFunctions.keys())
    };
  }
  
  /**
   * Check if a legacy global is available
   * @param {string} globalName - Name of the global to check
   * @returns {boolean} True if available
   */
  hasLegacyGlobal(globalName) {
    return this.legacyGlobals.has(globalName);
  }
  
  /**
   * Check if a legacy function is available
   * @param {string} functionName - Name of the function to check
   * @returns {boolean} True if available
   */
  hasLegacyFunction(functionName) {
    return this.legacyFunctions.has(functionName);
  }
  
  /**
   * Clean up legacy compatibility layer
   */
  cleanup() {
    try {
      // Remove event listeners
      globalEventBus.off('stateChange');
      globalEventBus.off('config:change');
      
      // Clear legacy globals and functions
      this.legacyGlobals.clear();
      this.legacyFunctions.clear();
      
      this.initialized = false;
      console.log('🧹 LegacyCompatibility: Cleanup complete');
      
    } catch (error) {
      console.error('🚨 LegacyCompatibility: Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const legacyCompatibility = new LegacyCompatibility();

// Export for global access
if (typeof window !== 'undefined') {
  window.legacyCompatibility = legacyCompatibility;
}
