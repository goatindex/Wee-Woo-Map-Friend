/**
 * @module modules/CfaFacilitiesLoader
 * Modern ES6-based CFA facilities loading for WeeWoo Map Friend
 * Loads CFA facility point coordinates from cfabld.json and maps them to CFA polygon keys
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
import { logger } from './StructuredLogger.js';

/**
 * @class CfaFacilitiesLoader
 * Loads and manages CFA facility coordinates from JSON sources
 */
export class CfaFacilitiesLoader {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.facilityCoords = new Map(); // key -> { lat, lng }
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'CfaFacilitiesLoader' });
    
    // Bind methods
    this.init = this.init.bind(this);
    this.load = this.load.bind(this);
    this.getFeatures = this.getFeatures.bind(this);
    this.normalizeKey = this.normalizeKey.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);
    
    this.logger.info('CFA facilities loading system initialized');
  }
  
  /**
   * Initialize the CFA facilities loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting CFA facilities loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('CFA facilities loading system ready');
      
    } catch (error) {
      this.logger.error('Failed to initialize', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }
  
  /**
   * Wait for required dependencies
   */
  async waitForDependencies() {
    const dependencies = [
      { name: 'LayerManager', check: () => layerManager.isReady() },
      { name: 'ConfigurationManager', check: () => configurationManager.isReady() },
      { name: 'StateManager', check: () => stateManager.isReady() }
    ];
    
    for (const dep of dependencies) {
      if (!dep.check()) {
        this.logger.info(`Waiting for ${dep.name}...`);
        await this.waitForDependency(dep.check, dep.name);
      }
    }
    
    this.logger.info('All dependencies ready');
  }
  
  /**
   * Wait for a specific dependency
   */
  async waitForDependency(checkFn, name) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${name}`));
      }, 10000); // 10 second timeout
      
      const check = () => {
        if (checkFn()) {
          clearTimeout(timeout);
          this.logger.info(`${name} ready`);
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for layer manager events
    globalEventBus.on('layer:ready', () => {
      this.logger.info('Layer manager ready, can load CFA facilities');
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta.cfa')) {
        this.logger.info('CFA metadata updated');
      }
    });
    
    this.logger.info('Event listeners configured');
  }
  
  /**
   * Returns CFA facility features as a Promise for preloader batching.
   * Note: CFA facilities are loaded from JSON, not GeoJSON, so this returns empty array
   */
  async getFeatures() {
    // This is a placeholder - CFA facilities are loaded from JSON, not GeoJSON
    // But we return empty array to maintain consistency with other loaders
    return [];
  }
  
  /**
   * Load cfabld.json and build a name->coord map keyed like CFA polygons
   */
  async load() {
    if (this.loading) {
      this.logger.warn('Already loading');
      return;
    }
    
    if (this.loaded) {
      this.logger.warn('Already loaded');
      return;
    }
    
    try {
      this.logger.info('Loading CFA facilities...');
      
      this.loading = true;
      globalEventBus.emit('cfaFacilities:loading');
      
      // Check offline status
      if (this.isOffline()) {
        throw new Error('Offline - cannot load data');
      }
      
      const response = await fetch('cfabld.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.fields || !data.records) {
        throw new Error('Invalid cfabld.json structure');
      }
      
      // Find field indices
      const fields = data.fields.map(f => f.id);
      const brigadeNameIdx = fields.indexOf('Brigade Name');
      const latIdx = fields.indexOf('lat');
      const lngIdx = fields.indexOf('lng');
      
      if (brigadeNameIdx === -1) {
        throw new Error('Brigade Name field not found');
      }
      
      if (latIdx === -1 || lngIdx === -1) {
        this.logger.warn('CFA coordinates not found in cfabld.json - run add_cfa_coordinates.py first');
        this.loading = false;
        return;
      }
      
      let loaded = 0;
      this.facilityCoords.clear();
      
      data.records.forEach(record => {
        if (record.length <= Math.max(brigadeNameIdx, latIdx, lngIdx)) return;
        
        const brigadeName = record[brigadeNameIdx];
        const lat = record[latIdx];
        const lng = record[lngIdx];
        
        if (!brigadeName || lat == null || lng == null) return;
        
        try {
          const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
          const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
          
          if (!isNaN(latNum) && !isNaN(lngNum)) {
            const key = this.normalizeKey(brigadeName);
            this.facilityCoords.set(key, { lat: latNum, lng: lngNum });
            loaded++;
          }
        } catch (e) {
          // Skip invalid coordinates
          this.logger.debug('Skipped invalid coordinates', { 
            brigadeName, 
            lat, 
            lng, 
            error: e.message 
          });
        }
      });
      
      // Store in state manager for global access
      const coordsObject = {};
      this.facilityCoords.forEach((coords, key) => {
        coordsObject[key] = coords;
      });
      stateManager.set('cfaFacilityCoords', coordsObject);
      
      // Mark as loaded
      this.loaded = true;
      this.loading = false;
      
      // Emit success event
      globalEventBus.emit('cfaFacilities:loaded', { 
        loadedCount: loaded,
        uniqueKeys: this.facilityCoords.size
      });
      
      this.logger.info('CFA facilities loaded successfully', {
        loadedCount: loaded,
        uniqueKeys: this.facilityCoords.size
      });
      
    } catch (error) {
      this.logger.error('Failed to load CFA facilities', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      globalEventBus.emit('cfaFacilities:error', { error });
      
      throw error;
    }
  }
  
  /**
   * Normalize CFA brigade names to match polygon keys
   */
  normalizeKey(name) {
    return (name || '').trim().toLowerCase();
  }
  
  /**
   * Get coordinates for a CFA facility by key
   */
  getCoordinates(key) {
    return this.facilityCoords.get(this.normalizeKey(key));
  }
  
  /**
   * Check if coordinates exist for a CFA facility
   */
  hasCoordinates(key) {
    return this.facilityCoords.has(this.normalizeKey(key));
  }
  
  /**
   * Get all facility coordinates
   */
  getAllCoordinates() {
    const coords = {};
    this.facilityCoords.forEach((value, key) => {
      coords[key] = value;
    });
    return coords;
  }
  
  /**
   * Utility methods
   */
  isOffline() {
    return window.isOffline ? window.isOffline() : !navigator.onLine;
  }
  
  /**
   * Get CFA facilities loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      loaded: this.loaded,
      facilityCount: this.facilityCoords.size
    };
  }
}

// Export singleton instance
export const cfaFacilitiesLoader = new CfaFacilitiesLoader();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
