/**
 * @module modules/StateManager
 * Centralized state management for WeeWoo Map Friend application
 * Replaces window globals with a reactive state system
 */

import { EventBus } from './EventBus.js';

/**
 * @class StateManager
 * @extends EventBus
 * Manages application state with reactivity and persistence
 */
export class StateManager extends EventBus {
  constructor() {
    super();
    
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
                console.error(`StateManager: Error in watcher for '${property}':`, error);
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
      this._state.activeListFilter = window.activeListFilter || '';
      this._state.sidebarVisible = window.sidebarVisible !== undefined ? window.sidebarVisible : true;
      this._state.isBulkOperation = window.isBulkOperation || false;
      
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
    
    console.log('✅ StateManager: Legacy state migration complete');
  }
  
  /**
   * Set up legacy compatibility layer
   * Maintains backward compatibility with window globals
   */
  _setupLegacyCompatibility() {
    if (typeof window === 'undefined') return;
    
    // Create legacy compatibility functions
    window.setActiveListFilter = (v) => {
      this.set('activeListFilter', v);
    };
    
    // Create legacy compatibility properties
    Object.defineProperty(window, 'activeListFilter', {
      get: () => this.get('activeListFilter'),
      set: (v) => this.set('activeListFilter', v),
      configurable: true
    });
    
    // Create computed properties for legacy compatibility
    this.computed('activeListFilter', () => this.get('activeListFilter'), []);
    
    console.log('✅ StateManager: Legacy compatibility layer ready');
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
      console.error('StateManager: Failed to persist state:', error);
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
      console.error('StateManager: Failed to restore state:', error);
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
