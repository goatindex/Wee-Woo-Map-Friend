/**
 * @module modules/StateManager
 * Centralized state management for WeeWoo Map Friend application
 * Replaces window globals with a reactive state system
 */

import { EventBus } from './EventBus.js';
import { logger } from './StructuredLogger.js';
import { labelManager } from './LabelManager.js';
import { activeListManager } from './ActiveListManager.js';

/**
 * @class StateManager
 * @extends EventBus
 * Manages application state with reactivity and persistence
 */
export class StateManager extends EventBus {
  constructor() {
    super();
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'StateManager' });
    
    // Internal state storage
    this._state = {};
    this._computed = new Map();
    this._watchers = new Map();
    this._middleware = [];
    
    // Create reactive proxy
    this.state = new Proxy(this._state, {
      get: (target, property) => {
        // Return computed value if available
        if (this._computed.has(property)) {
          return this._computed.get(property).getter();
        }
        return target[property];
      },
      
      set: (target, property, value) => {
        const oldValue = target[property];
        
        // Run middleware
        for (const middleware of this._middleware) {
          const result = middleware(property, value, oldValue);
          if (result !== undefined) {
            value = result;
          }
        }
        
        // Only update if value actually changed
        if (oldValue !== value) {
          target[property] = value;
          
          // Emit state change event
          this.emit('stateChange', { 
            property, 
            value, 
            oldValue, 
            state: this._state 
          });
          
          // Emit property-specific event
          this.emit(`state:${property}`, { value, oldValue });
          
          // Run watchers
          if (this._watchers.has(property)) {
            const watchers = this._watchers.get(property);
            watchers.forEach(watcher => {
              try {
                watcher(value, oldValue);
              } catch (error) {
                this.logger.error(`Error in watcher for '${property}'`, { error: error.message, stack: error.stack });
              }
            });
          }
          
          // Update dependent computed properties
          this._updateComputedProperties(property);
        }
        
        return true;
      },
      
      deleteProperty: (target, property) => {
        if (property in target) {
          const oldValue = target[property];
          delete target[property];
          
          this.emit('stateChange', { 
            property, 
            value: undefined, 
            oldValue, 
            state: this._state,
            action: 'delete'
          });
          
          this.emit(`state:${property}`, { value: undefined, oldValue });
        }
        return true;
      }
    });
    
    // Initialize with legacy state from window globals
    this._migrateLegacyState();
    
    // Set up legacy compatibility layer
    this._setupLegacyCompatibility();
    
    // Bind methods
    this.isReady = this.isReady.bind(this);
  }
  
  /**
   * Migrate existing window globals to state management
   * @private
   */
  _migrateLegacyState() {
    // Migrate existing global state
    if (typeof window !== 'undefined') {
      const legacyGlobals = [
        'map', 'featureLayers', 'namesByCategory', 'nameToKey', 'emphasised', 
        'nameLabelMarkers', 'pendingLabels', 'markersLayer', 'categoryMeta', 
        'outlineColors', 'baseOpacities', 'labelColorAdjust', 'headerColorAdjust'
      ];
      
      legacyGlobals.forEach(globalName => {
        if (window[globalName] !== undefined) {
          this._state[globalName] = window[globalName];
        }
      });
      
      // Initialize empty structures if they don't exist
      this._state.featureLayers = this._state.featureLayers || { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
      this._state.namesByCategory = this._state.namesByCategory || { ses:[], lga:[], cfa:[], ambulance:[], police:[], frv:[] };
      this._state.nameToKey = this._state.nameToKey || { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
      this._state.emphasised = this._state.emphasised || { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
      this._state.nameLabelMarkers = this._state.nameLabelMarkers || { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
      this._state.pendingLabels = this._state.pendingLabels || [];
      
      // UI and application state
      this._state.activeListFilter = '';
      this._state.sidebarVisible = true;
      this._state.isBulkOperation = false;
      
      // Legacy facility coordinate variables
      this._state.sesFacilityCoords = window.sesFacilityCoords || {};
      this._state.sesFacilityMarkers = window.sesFacilityMarkers || {};
      this._state.cfaFacilityCoords = window.cfaFacilityCoords || {};
      
      // Device and responsive state
      this._state.deviceContext = window.DeviceContext ? window.DeviceContext.getContext() : null;
      this._state.windowSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Application state
      this._state.appInitialized = false;
      this._state.mapReady = false;
      this._state.dataLoaded = false;
      this._state.errorState = null;
    }
    
    this.logger.info('Legacy state migration complete');
  }
  
  /**
   * Set up legacy compatibility layer
   * Maintains backward compatibility with window globals
   */
  _setupLegacyCompatibility() {
    if (typeof window === 'undefined') return;
    
    this.logger.debug('Setting up legacy compatibility layer');
    
    // Legacy state variables - proxy to StateManager
    const legacyStateVars = [
      'featureLayers', 'namesByCategory', 'nameToKey', 'emphasised', 
      'nameLabelMarkers', 'pendingLabels', 'activeListFilter', 'isBulkOperation'
    ];
    
    legacyStateVars.forEach(varName => {
      Object.defineProperty(window, varName, {
        get: () => this.get(varName),
        set: (value) => this.set(varName, value),
        configurable: true
      });
    });
    
    // Legacy facility coordinate variables
    Object.defineProperty(window, 'sesFacilityCoords', {
      get: () => this.get('sesFacilityCoords', {}),
      set: (value) => this.set('sesFacilityCoords', value),
      configurable: true
    });
    
    Object.defineProperty(window, 'sesFacilityMarkers', {
      get: () => this.get('sesFacilityMarkers', {}),
      set: (value) => this.set('sesFacilityMarkers', value),
      configurable: true
    });
    
    Object.defineProperty(window, 'cfaFacilityCoords', {
      get: () => this.get('cfaFacilityCoords', {}),
      set: (value) => this.set('cfaFacilityCoords', value),
      configurable: true
    });
    
    // Legacy map functions
    window.setMap = (map) => {
      this.set('map', map);
    };
    
    window.getMap = () => {
      const map = this.get('map');
      if (!map) throw new Error('Map not initialised yet');
      return map;
    };
    
    // Legacy filter function
    window.setActiveListFilter = (v) => {
      this.set('activeListFilter', v);
    };
    
    // Legacy BulkOperationManager - proxy to StateManager methods
    window.BulkOperationManager = {
      begin: (operationType, itemCount) => this.beginBulkOperation(operationType, itemCount),
      end: () => this.endBulkOperation(),
      isActive: () => this.isBulkOperationActive(),
      addPendingLabel: (labelData) => this.addPendingLabel(labelData),
      markActiveListUpdatePending: () => this.markActiveListUpdatePending(),
      getStatus: () => this.getBulkOperationStatus()
    };
    
    // Legacy bulk operation functions
    window.beginBulkOperation = () => this.beginBulkOperation('legacy');
    window.endBulkOperation = () => this.endBulkOperation();
    
    this.logger.info('Legacy compatibility layer active');
  }
  
  /**
   * Add middleware for state changes
   * @param {Function} middleware - Middleware function (property, newValue, oldValue) => newValue
   */
  addMiddleware(middleware) {
    if (typeof middleware === 'function') {
      this._middleware.push(middleware);
    }
  }
  
  /**
   * Remove middleware
   * @param {Function} middleware - Middleware function to remove
   */
  removeMiddleware(middleware) {
    const index = this._middleware.indexOf(middleware);
    if (index !== -1) {
      this._middleware.splice(index, 1);
    }
  }
  
  /**
   * Watch for changes to a specific property
   * @param {string} property - Property name to watch
   * @param {Function} callback - Callback function (newValue, oldValue) => void
   * @returns {Function} Unwatch function
   */
  watch(property, callback) {
    if (!this._watchers.has(property)) {
      this._watchers.set(property, []);
    }
    
    this._watchers.get(property).push(callback);
    
    // Return unwatch function
    return () => {
      const watchers = this._watchers.get(property);
      if (watchers) {
        const index = watchers.indexOf(callback);
        if (index !== -1) {
          watchers.splice(index, 1);
        }
        
        // Clean up empty watcher arrays
        if (watchers.length === 0) {
          this._watchers.delete(property);
        }
      }
    };
  }
  
  /**
   * Define computed property that depends on other state
   * @param {string} name - Computed property name
   * @param {Function} getter - Function that computes the value
   * @param {string[]} dependencies - Array of state properties this depends on
   */
  computed(name, getter, dependencies = []) {
    this._computed.set(name, {
      getter,
      dependencies,
      cached: null,
      dirty: true
    });
    
    // Watch dependencies and mark as dirty when they change
    dependencies.forEach(dep => {
      this.watch(dep, () => {
        const computed = this._computed.get(name);
        if (computed) {
          computed.dirty = true;
          this.emit(`computed:${name}`, { name, value: computed.getter() });
        }
      });
    });
  }
  
  /**
   * Update computed properties when dependencies change
   * @private
   * @param {string} changedProperty - Property that changed
   */
  _updateComputedProperties(changedProperty) {
    this._computed.forEach((computed, name) => {
      if (computed.dependencies.includes(changedProperty)) {
        computed.dirty = true;
        this.emit(`computed:${name}`, { name, value: computed.getter() });
      }
    });
  }
  
  /**
   * Get current state value
   * @param {string} path - Property path (supports nested: 'user.name')
   * @param {any} defaultValue - Default value if property doesn't exist
   * @returns {any} Property value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this._state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  /**
   * Set state value
   * @param {string|Object} path - Property path or object of key-value pairs
   * @param {any} value - Value to set (ignored if path is object)
   */
  set(path, value) {
    if (typeof path === 'object') {
      // Batch update
      Object.entries(path).forEach(([key, val]) => {
        this.state[key] = val;
      });
    } else {
      // Single property update
      const keys = path.split('.');
      let current = this._state;
      
      // Navigate to parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set final property
      const finalKey = keys[keys.length - 1];
      current[finalKey] = value;
      
      // Trigger reactivity manually for nested properties
      this.emit('stateChange', { 
        property: path, 
        value, 
        oldValue: undefined, 
        state: this._state 
      });
    }
  }
  
  /**
   * Reset state to initial values
   * @param {string[]} [properties] - Specific properties to reset (optional)
   */
  reset(properties) {
    if (properties) {
      properties.forEach(prop => {
        delete this.state[prop];
      });
    } else {
      // Clear all state
      Object.keys(this._state).forEach(key => {
        delete this.state[key];
      });
      
      // Re-initialize with defaults
      this._migrateLegacyState();
    }
    
    this.emit('stateReset', { properties });
  }
  
  /**
   * Persist state to localStorage
   * @param {string} key - Storage key
   * @param {string[]} [properties] - Specific properties to persist (optional)
   */
  persist(key = 'weewoo-map-state', properties) {
    try {
      const dataToStore = properties 
        ? properties.reduce((acc, prop) => {
            if (prop in this._state) {
              acc[prop] = this._state[prop];
            }
            return acc;
          }, {})
        : this._state;
      
      localStorage.setItem(key, JSON.stringify(dataToStore));
      this.emit('statePersisted', { key, data: dataToStore });
    } catch (error) {
      this.logger.error('Failed to persist state', { error: error.message, stack: error.stack });
    }
  }
  
  /**
   * Restore state from localStorage
   * @param {string} key - Storage key
   * @param {boolean} merge - Whether to merge with current state (default: true)
   */
  restore(key = 'weewoo-map-state', merge = true) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        
        if (merge) {
          Object.entries(data).forEach(([prop, value]) => {
            this.state[prop] = value;
          });
        } else {
          this.reset();
          Object.entries(data).forEach(([prop, value]) => {
            this.state[prop] = value;
          });
        }
        
        this.emit('stateRestored', { key, data });
      }
    } catch (error) {
      this.logger.error('Failed to restore state', { error: error.message, stack: error.stack });
    }
  }
  
  /**
   * Get a snapshot of current state
   * @param {string[]} [properties] - Specific properties to include (optional)
   * @returns {Object} State snapshot
   */
  getSnapshot(properties) {
    if (properties) {
      return properties.reduce((acc, prop) => {
        if (prop in this._state) {
          acc[prop] = this._state[prop];
        }
        return acc;
      }, {});
    }
    
    return { ...this._state };
  }
  
  /**
   * Begin a bulk operation
   * @param {string} operationType - Type of operation (e.g., 'toggleAll', 'import', 'reset')
   * @param {number} itemCount - Number of items to be processed
   * @returns {boolean} True if operation started successfully
   */
  beginBulkOperation(operationType, itemCount = 0) {
    if (this.get('isBulkOperation')) {
      this.logger.warn('Bulk operation already active, nested calls not supported');
      return false;
    }
    
    this.set('isBulkOperation', true);
    this.set('bulkOperationType', operationType);
    this.set('bulkOperationItemCount', itemCount);
    this.set('bulkOperationStartTime', Date.now());
    this.set('bulkOperationPendingLabels', []);
    this.set('bulkOperationPendingActiveListUpdate', false);
    
    this.logger.info(`Bulk operation started: ${operationType}`, { itemCount });
    this.emit('bulkOperation:started', { operationType, itemCount });
    return true;
  }
  
  /**
   * End a bulk operation and process deferred items
   */
  endBulkOperation() {
    if (!this.get('isBulkOperation')) {
      this.logger.warn('No bulk operation active to end');
      return;
    }
    
    const operationType = this.get('bulkOperationType');
    const startTime = this.get('bulkOperationStartTime');
    const duration = Date.now() - startTime;
    
    this.logger.info(`Bulk operation completed: ${operationType}`, { duration });
    
    // Process deferred labels first
    const pendingLabels = this.get('bulkOperationPendingLabels', []);
    if (pendingLabels.length > 0) {
      this.logger.debug(`Processing ${pendingLabels.length} deferred labels`);
      this._processDeferredLabels(pendingLabels);
    }
    
    // Process active list update if pending
    if (this.get('bulkOperationPendingActiveListUpdate')) {
      this.logger.debug('Processing pending active list update');
      this._processActiveListUpdate();
    }
    
    // Clear bulk operation state
    this.set('isBulkOperation', false);
    this.set('bulkOperationType', null);
    this.set('bulkOperationItemCount', 0);
    this.set('bulkOperationStartTime', null);
    this.set('bulkOperationPendingLabels', []);
    this.set('bulkOperationPendingActiveListUpdate', false);
    
    this.emit('bulkOperation:ended', { operationType, duration });
  }
  
  /**
   * Check if a bulk operation is currently active
   * @returns {boolean} True if bulk operation is active
   */
  isBulkOperationActive() {
    return this.get('isBulkOperation', false);
  }
  
  /**
   * Add a pending label for deferred creation
   * @param {Object} labelData - Label data object
   */
  addPendingLabel(labelData) {
    if (!this.get('isBulkOperation')) {
      this.logger.warn('Cannot add pending label outside of bulk operation');
      return;
    }
    
    const pendingLabels = this.get('bulkOperationPendingLabels', []);
    pendingLabels.push(labelData);
    this.set('bulkOperationPendingLabels', pendingLabels);
  }
  
  /**
   * Mark active list update as pending
   */
  markActiveListUpdatePending() {
    if (!this.get('isBulkOperation')) {
      this.logger.warn('Cannot mark active list update pending outside of bulk operation');
      return;
    }
    this.set('bulkOperationPendingActiveListUpdate', true);
  }
  
  /**
   * Process deferred labels in optimized batches
   * @private
   * @param {Array} labels - Array of label data objects
   */
  async _processDeferredLabels(labels) {
    if (labels.length === 0) return;
    
    // Category-specific batch sizes for label creation
    const labelBatchSizes = {
      'lga': 1,   // Process LGA labels one at a time due to extreme complexity
      'cfa': 8,   // Larger batches for CFA since we use pre-calculated coordinates
      'ses': 8,   // Larger batches for SES since we use pre-calculated coordinates
      'ambulance': 10,
      'police': 10
    };
    
    // Group labels by category for optimized processing
    const labelsByCategory = {};
    labels.forEach(label => {
      if (!labelsByCategory[label.category]) {
        labelsByCategory[label.category] = [];
      }
      labelsByCategory[label.category].push(label);
    });
    
    // Process each category with its optimal batch size
    const categoryKeys = Object.keys(labelsByCategory);
    let totalBatches = 0;
    let currentBatch = 0;
    
    // Calculate total number of batches for progress tracking
    categoryKeys.forEach(category => {
      const categoryLabels = labelsByCategory[category];
      const batchSize = labelBatchSizes[category] || 10;
      totalBatches += Math.ceil(categoryLabels.length / batchSize);
    });
    
    this.logger.debug(`Processing ${labels.length} labels in ${totalBatches} batches`);
    
    for (let catIndex = 0; catIndex < categoryKeys.length; catIndex++) {
      const category = categoryKeys[catIndex];
      const categoryLabels = labelsByCategory[category];
      const batchSize = labelBatchSizes[category] || 10;
      
      for (let i = 0; i < categoryLabels.length; i += batchSize) {
        const batch = categoryLabels.slice(i, i + batchSize);
        currentBatch++;
        
        // Process current batch
        batch.forEach(({category, key, labelName, isPoint, layer}) => {
          const featureLayers = this.get('featureLayers', {});
          if (featureLayers[category] && featureLayers[category][key] && 
              featureLayers[category][key].some(l => l._map)) {
            // Only create label if the layer is still on the map
            if (labelManager) {
              labelManager.ensureLabel(category, key, labelName, isPoint, layer);
            }
          }
        });
        
        // Yield between all batches except the very last one
        if (currentBatch < totalBatches) {
          if (category === 'lga') {
            await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay for LGA
          } else {
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }
      }
    }
    
    this.logger.info('All deferred labels processed');
  }
  
  /**
   * Process pending active list update
   * @private
   */
  _processActiveListUpdate() {
    if (activeListManager) {
      this.logger.debug('Calling updateActiveList after bulk operation');
      activeListManager.updateActiveList();
    } else {
      this.logger.warn('ActiveListManager not found');
    }
  }
  
  /**
   * Get current bulk operation status
   * @returns {Object} Bulk operation status information
   */
  getBulkOperationStatus() {
    return {
      isActive: this.get('isBulkOperation', false),
      operationType: this.get('bulkOperationType'),
      itemCount: this.get('bulkOperationItemCount', 0),
      duration: this.get('bulkOperationStartTime') ? Date.now() - this.get('bulkOperationStartTime') : 0,
      pendingLabels: this.get('bulkOperationPendingLabels', []).length,
      pendingActiveListUpdate: this.get('bulkOperationPendingActiveListUpdate', false)
    };
  }
  
  /**
   * Check if state manager is ready
   * @returns {boolean} True if initialized
   */
  isReady() {
    return true; // StateManager is always ready after construction
  }
}

// Create global state manager instance
export const stateManager = new StateManager();

// Export convenient access to state
export const state = stateManager.state;

// Export for global access
if (typeof window !== 'undefined') {
  window.StateManager = StateManager;
  window.stateManager = stateManager;
}
