/**
 * @module modules/ConfigurationManager
 * Centralized configuration management for WeeWoo Map Friend
 * Replaces js/config.js with a modern ES6 configuration system
 */

import { injectable } from 'inversify';
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { logger } from './StructuredLogger.js';

/**
 * @class ConfigurationManager
 * Manages application configuration with validation and dynamic updates
 */
@injectable()
export class ConfigurationManager {
  constructor() {
    this._config = {};
    this._validators = new Map();
    this._watchers = new Map();
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'ConfigurationManager' });
    
    // Bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.update = this.update.bind(this);
    this.validate = this.validate.bind(this);
    this.addValidator = this.addValidator.bind(this);
    this.watch = this.watch.bind(this);
    this.isReady = this.isReady.bind(this);
    
    // Initialize configuration
    this._initializeConfiguration();
    
    // Store config in state manager for other modules to access
    stateManager.set('config', this._config);
    
    this.logger.info('Configuration system initialized', {
      operation: 'constructor',
      configKeys: Object.keys(this._config),
      validators: this._validators.size,
      watchers: this._watchers.size
    });
  }
  
  /**
   * Initialize default configuration
   */
  _initializeConfiguration() {
    // Color configuration
    this._config.outlineColors = {
      ses: '#cc7a00',
      lga: 'black',
      cfa: '#FF0000',
      ambulance: '#d32f2f',
      police: '#145088',
      frv: '#DC143C'
    };
    
    // Opacity configuration
    this._config.baseOpacities = {
      ses: 0.2,
      lga: 0.1,
      cfa: 0.1,
      frv: 0.1
    };
    
    // Color adjustment factors
    this._config.labelColorAdjust = {
      ses: 0.85,
      lga: 1.0,
      cfa: 1.0,
      ambulance: 1.0,
      police: 1.0,
      frv: 1.0
    };
    
    this._config.headerColorAdjust = {
      ses: 0.85,
      lga: 1.0,
      cfa: 0.9,
      ambulance: 1.0,
      police: 0.95,
      frv: 0.9
    };
    
    // Category metadata
    this._config.categoryMeta = {
      ses: {
        type: 'polygon',
        nameProp: 'RESPONSE_ZONE_NAME',
        styleFn: 'sesStyle',
        defaultOn: () => false,
        listId: 'sesList',
        toggleAllId: 'toggleAllSES'
      },
      lga: {
        type: 'polygon',
        nameProp: 'LGA_NAME',
        styleFn: 'lgaStyle',
        defaultOn: () => false,
        listId: 'lgaList',
        toggleAllId: 'toggleAllLGAs'
      },
      cfa: {
        type: 'polygon',
        nameProp: 'BRIG_NAME',
        styleFn: 'cfaStyle',
        defaultOn: () => false,
        listId: 'cfaList',
        toggleAllId: 'toggleAllCFA'
      },
      ambulance: {
        type: 'point',
        nameProp: 'facility_name',
        styleFn: null,
        defaultOn: () => false,
        listId: 'ambulanceList',
        toggleAllId: 'toggleAllAmbulance'
      },
      police: {
        type: 'point',
        nameProp: 'place_name',
        styleFn: null,
        defaultOn: () => false,
        listId: 'policeList',
        toggleAllId: 'toggleAllPolice'
      },
      frv: {
        type: 'polygon',
        nameProp: 'AGENCY',
        styleFn: 'frvStyle',
        defaultOn: () => false,
        listId: 'frvList',
        toggleAllId: 'toggleAllFRV'
      }
    };
    
    // Style functions
    this._config.styles = {
      sesStyle: () => ({ 
        color: '#FF9900', 
        weight: 3, 
        fillColor: 'orange', 
        fillOpacity: 0.2 
      }),
      lgaStyle: () => ({ 
        color: '#001A70', 
        weight: 1.5, 
        fillColor: '#0082CA', 
        fillOpacity: 0.1, 
        dashArray: '8 8' 
      }),
      cfaStyle: () => ({ 
        color: 'red', 
        weight: 2, 
        fillColor: 'red', 
        fillOpacity: 0.1 
      }),
      frvStyle: () => ({ 
        color: 'crimson', 
        weight: 2, 
        fillColor: 'crimson', 
        fillOpacity: 0.1 
      })
    };
    
    // Utility functions
    this._config.utils = {
      adjustHexColor: this._adjustHexColor.bind(this)
    };
    
    this.logger.info('Default configuration loaded', {
      operation: '_initializeConfiguration',
      configSections: Object.keys(this._config),
      outlineColors: Object.keys(this._config.outlineColors),
      styles: Object.keys(this._config.styles)
    });
  }
  
  /**
   * Get configuration value
   * @param {string} path - Configuration path (e.g., 'outlineColors.ses')
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Configuration value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this._config;
    
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
   * Set configuration value
   * @param {string|Object} path - Configuration path or object of key-value pairs
   * @param {any} value - Value to set (ignored if path is object)
   */
  set(path, value) {
    if (typeof path === 'object') {
      // Batch update
      Object.entries(path).forEach(([key, val]) => {
        this._setValue(key, val);
      });
    } else {
      this._setValue(path, value);
    }
  }
  
  /**
   * Set a single configuration value
   * @private
   * @param {string} path - Configuration path
   * @param {any} value - Value to set
   */
  _setValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this._config;
    
    // Navigate to parent object
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Validate value if validator exists
    if (this._validators.has(path)) {
      const validator = this._validators.get(path);
      const validationResult = validator(value);
      if (validationResult !== true) {
        this.logger.warn('Validation failed', {
          operation: '_setValue',
          path,
          value,
          validationResult,
          validator: this._validators.get(path).name || 'anonymous'
        });
        return;
      }
    }
    
    // Set value
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Emit change event
    globalEventBus.emit('config:change', { path, value, oldValue });
    
    // Run watchers
    if (this._watchers.has(path)) {
      this._watchers.get(path).forEach(watcher => {
        try {
          watcher(value, oldValue);
        } catch (error) {
          this.logger.error('Error in watcher', {
            operation: '_setValue',
            path,
            value,
            oldValue,
            error: error.message,
            stack: error.stack
          });
        }
      });
    }
    
    this.logger.debug('Configuration updated', {
      operation: '_setValue',
      path,
      value,
      oldValue,
      hasWatchers: this._watchers.has(path),
      watcherCount: this._watchers.get(path)?.length || 0
    });
  }
  
  /**
   * Update configuration with new values
   * @param {Object} updates - Object containing configuration updates
   */
  update(updates) {
    if (typeof updates === 'object' && updates !== null) {
      this.set(updates);
    }
  }
  
  /**
   * Validate configuration value
   * @param {string} path - Configuration path
   * @param {any} value - Value to validate
   * @returns {boolean|string} True if valid, error message if invalid
   */
  validate(path, value) {
    if (this._validators.has(path)) {
      return this._validators.get(path)(value);
    }
    return true; // No validator means always valid
  }
  
  /**
   * Add validation rule for configuration path
   * @param {string} path - Configuration path
   * @param {Function} validator - Validation function (value) => boolean|string
   */
  addValidator(path, validator) {
    if (typeof validator === 'function') {
      this._validators.set(path, validator);
      this.logger.debug('Validator added', {
        operation: 'addValidator',
        path,
        validatorName: validator.name || 'anonymous',
        totalValidators: this._validators.size
      });
    }
  }
  
  /**
   * Watch for configuration changes
   * @param {string} path - Configuration path to watch
   * @param {Function} callback - Callback function (newValue, oldValue) => void
   * @returns {Function} Unwatch function
   */
  watch(path, callback) {
    if (!this._watchers.has(path)) {
      this._watchers.set(path, []);
    }
    
    this._watchers.get(path).push(callback);
    
    // Return unwatch function
    return () => {
      const watchers = this._watchers.get(path);
      if (watchers) {
        const index = watchers.indexOf(callback);
        if (index !== -1) {
          watchers.splice(index, 1);
        }
        
        // Clean up empty watcher arrays
        if (watchers.length === 0) {
          this._watchers.delete(path);
        }
      }
    };
  }
  
  /**
   * Get all configuration as a flat object
   * @returns {Object} Flattened configuration object
   */
  getAll() {
    return this._flattenObject(this._config);
  }
  
  /**
   * Flatten nested object for easier access
   * @private
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Current path prefix
   * @returns {Object} Flattened object
   */
  _flattenObject(obj, prefix = '') {
    const flattened = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'function') {
        Object.assign(flattened, this._flattenObject(value, path));
      } else {
        flattened[path] = value;
      }
    });
    
    return flattened;
  }
  
  /**
   * Reset configuration to defaults
   */
  reset() {
    this._initializeConfiguration();
    globalEventBus.emit('config:reset');
    this.logger.info('Configuration reset to defaults', {
      operation: 'reset',
      configKeys: Object.keys(this._config),
      validators: this._validators.size,
      watchers: this._watchers.size
    });
  }
  
  /**
   * Export configuration for persistence
   * @returns {Object} Configuration object for export
   */
  export() {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      config: JSON.parse(JSON.stringify(this._config))
    };
  }
  
  /**
   * Import configuration from external source
   * @param {Object} configData - Configuration data to import
   */
  import(configData) {
    if (configData && configData.config) {
      this._config = { ...this._config, ...configData.config };
      globalEventBus.emit('config:imported', { config: this._config });
      this.logger.info('Configuration imported', {
        operation: 'import',
        importedKeys: Object.keys(configData.config),
        totalKeys: Object.keys(this._config).length,
        hasConfig: !!configData.config
      });
    }
  }
  
  /**
   * Color adjustment utility function
   * @private
   * @param {string} hex - Hex color string
   * @param {number} factor - Adjustment factor (0.9 = 10% darker, 1.1 = 10% lighter)
   * @returns {string} Adjusted hex color
   */
  _adjustHexColor(hex, factor) {
    try {
      const m = (hex || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
      if (!m) return hex;
      
      const n = parseInt(m[1], 16);
      let r = (n >> 16) & 0xff;
      let g = (n >> 8) & 0xff;
      let b = n & 0xff;
      
      r = Math.max(0, Math.min(255, Math.round(r * factor)));
      g = Math.max(0, Math.min(255, Math.round(g * factor)));
      b = Math.max(0, Math.min(255, Math.round(b * factor)));
      
      const toHex = (v) => v.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return hex;
    }
  }
  
  /**
   * Get style function for a category
   * @param {string} category - Category name (e.g., 'ses', 'lga', 'cfa', 'frv')
   * @returns {Function|null} Style function or null if not found
   */
  getStyle(category) {
    const styleFnName = this.get(`categoryMeta.${category}.styleFn`);
    if (styleFnName && this._config.styles && this._config.styles[styleFnName]) {
      return this._config.styles[styleFnName];
    }
    return null;
  }
  
  /**
   * Get color adjustment utility function
   * @returns {Function} Color adjustment function
   */
  getColorAdjuster() {
    return this._config.utils.adjustHexColor;
  }
  
  /**
   * Check if configuration manager is ready
   * @returns {boolean} True if initialized
   */
  isReady() {
    return true; // ConfigurationManager is always ready after construction
  }
  
  /**
   * Get configuration status
   * @returns {Object} Configuration status information
   */
  getStatus() {
    return {
      initialized: true,
      configCount: Object.keys(this._flattenObject(this._config)).length,
      validators: this._validators.size,
      watchers: this._watchers.size,
      categories: Object.keys(this._config.categoryMeta || {}),
      colors: Object.keys(this._config.outlineColors || {}),
      styles: Object.keys(this._config.styles || {})
    };
  }
}

// Export singleton instance
export const configurationManager = new ConfigurationManager();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
