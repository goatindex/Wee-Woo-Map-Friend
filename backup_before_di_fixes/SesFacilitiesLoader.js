/**
 * @module modules/SesFacilitiesLoader
 * Modern ES6-based SES facilities loading for WeeWoo Map Friend
 * Loads SES facility point coordinates from GeoJSON and maps them to SES polygon keys
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * @class SesFacilitiesLoader
 * Loads and manages SES facility coordinates from GeoJSON sources
 */
export class SesFacilitiesLoader {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.facilityCoords = new Map(); // key -> { lat, lng }
    this.features = []; // Store raw features for getFeatures()
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Bind methods
    this.init = this.init.bind(this);
    this.load = this.load.bind(this);
    this.getFeatures = this.getFeatures.bind(this);
    this.normalizeKey = this.normalizeKey.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);
    
    this.logger.info('SES facilities loading system initialized');
  }
  
  /**
   * Initialize the SES facilities loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting SES facilities loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('SES facilities loading system ready');
      
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
      this.logger.info('Layer manager ready, can load SES facilities');
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta.ses')) {
        this.logger.info('SES metadata updated');
      }
    });
    
    this.logger.info('Event listeners configured');
  }
  
  /**
   * Returns SES facility features as a Promise for preloader batching
   */
  async getFeatures() {
    if (this.features.length) {
      return this.features;
    }
    
    try {
      const response = await fetch('geojson/sesbld.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON');
      }
      
      this.features = data.features;
      this.logger.info(`Loaded ${this.features.length} SES facility features`);
      return this.features;
      
    } catch (error) {
      this.logger.error('Error loading SES facility features', { 
        error: error.message 
      });
      return [];
    }
  }
  
  /**
   * Load sesbld.geojson and build a name->coord map keyed like SES polygons
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
      this.logger.info('Loading SES facilities...');
      
      this.loading = true;
      globalEventBus.emit('sesFacilities:loading');
      
      // Check offline status
      if (this.isOffline()) {
        throw new Error('Offline - cannot load data');
      }
      
      const response = await fetch('geojson/sesbld.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !Array.isArray(data.features)) {
        throw new Error('Invalid GeoJSON');
      }
      
      const meta = configurationManager.get('categoryMeta.ses');
      let loaded = 0;
      this.facilityCoords.clear();
      this.features = data.features;
      
      data.features.forEach(feature => {
        const props = feature && feature.properties || {};
        
        // Facility file uses 'facility_name' (not the polygon nameProp)
        let raw = props['facility_name'];
        if (typeof raw !== 'string') return;
        
        const key = this.normalizeKey(raw);
        
        // Determine lat/lon from geometry or properties; convert if needed
        let lat = null, lon = null;
        
        try {
          if (feature.geometry && feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
            lon = +feature.geometry.coordinates[0];
            lat = +feature.geometry.coordinates[1];
          } else if (props.X_CORD && props.Y_CORD) {
            const conv = this.convertMGA94ToLatLon(props.X_CORD, props.Y_CORD);
            lon = conv[0]; 
            lat = conv[1];
          } else if (props.lon && props.lat) {
            lon = +props.lon; 
            lat = +props.lat;
          }
        } catch (e) {
          this.logger.debug('Coordinate conversion failed', { 
            feature: raw, 
            error: e.message 
          });
        }
        
        if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
          this.facilityCoords.set(key, { lat, lng: lon });
          loaded++;
        }
      });
      
      // Store in state manager for global access
      const coordsObject = {};
      this.facilityCoords.forEach((coords, key) => {
        coordsObject[key] = coords;
      });
      stateManager.set('sesFacilityCoords', coordsObject);
      
      // Mark as loaded
      this.loaded = true;
      this.loading = false;
      
      // Emit success event
      globalEventBus.emit('sesFacilities:loaded', { 
        loadedCount: loaded,
        uniqueKeys: this.facilityCoords.size
      });
      
      this.logger.info('SES facilities loaded successfully', {
        loadedCount: loaded,
        uniqueKeys: this.facilityCoords.size
      });
      
    } catch (error) {
      this.logger.error('Failed to load SES facilities', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      globalEventBus.emit('sesFacilities:error', { error });
      
      throw error;
    }
  }
  
  /**
   * Normalize SES facility names to match polygon keys
   */
  normalizeKey(name) {
    let s = (name || '').trim();
    // Defensively strip leading 'VICSES ' if present (in case source updates)
    s = s.replace(/^VIC\s*SES\s+/i, '') // "VIC SES ..."
         .replace(/^VICSES\s+/i, '')     // "VICSES ..."
         .replace(/^SES\s+/i, '');       // "SES ..."
    return s.toLowerCase();
  }
  
  /**
   * Convert MGA94 coordinates to lat/lon
   */
  convertMGA94ToLatLon(x, y) {
    if (window.convertMGA94ToLatLon) {
      return window.convertMGA94ToLatLon(x, y);
    }
    
    // Fallback: return as-is if conversion function not available
    this.logger.warn('MGA94 conversion function not available');
    return [x, y];
  }
  
  /**
   * Get coordinates for a SES facility by key
   */
  getCoordinates(key) {
    return this.facilityCoords.get(this.normalizeKey(key));
  }
  
  /**
   * Check if coordinates exist for a SES facility
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
   * Get SES facilities loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      loaded: this.loaded,
      featureCount: this.features.length,
      facilityCount: this.facilityCoords.size
    };
  }
}

// Export singleton instance
export const sesFacilitiesLoader = () => {
  console.warn('sesFacilitiesLoader: Legacy function called. Use DI container to get SesFacilitiesLoader instance.');
  throw new Error('Legacy function not available. Use DI container to get SesFacilitiesLoader instance.');
};

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
