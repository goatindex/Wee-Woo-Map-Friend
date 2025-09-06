/**
 * @module modules/SesUnitsLoader
 * Modern ES6-based SES units loading for WeeWoo Map Friend
 * Renders non-interactive SES unit name labels from ses.geojson
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
import { logger } from './StructuredLogger.js';

/**
 * @class SesUnitsLoader
 * Loads and manages SES unit markers from GeoJSON sources
 */
export class SesUnitsLoader {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.markers = []; // Store markers for cleanup
    this.features = []; // Store raw features for getFeatures()
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'SesUnitsLoader' });
    
    // Bind methods
    this.init = this.init.bind(this);
    this.load = this.load.bind(this);
    this.getFeatures = this.getFeatures.bind(this);
    this.createIcon = this.createIcon.bind(this);
    this.clearMarkers = this.clearMarkers.bind(this);
    
    this.logger.info('SES units loading system initialized');
  }
  
  /**
   * Initialize the SES units loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting SES units loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('SES units loading system ready');
      
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
      this.logger.info('Layer manager ready, can load SES units');
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
   * Returns SES unit features as a Promise for preloader batching
   */
  async getFeatures() {
    if (this.features.length) {
      return this.features;
    }
    
    try {
      const response = await fetch('geojson/ses.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data?.features) {
        throw new Error('Invalid GeoJSON structure');
      }
      
      this.features = data.features;
      this.logger.info(`Loaded ${this.features.length} SES unit features`);
      return this.features;
      
    } catch (error) {
      this.logger.error('Error loading SES unit features', { 
        error: error.message 
      });
      return [];
    }
  }
  
  /**
   * Loads SES unit markers from ses.geojson and adds them to the map
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
      this.logger.info('Loading SES units...');
      
      this.loading = true;
      globalEventBus.emit('sesUnits:loading');
      
      // Check offline status
      if (this.isOffline()) {
        throw new Error('Offline - cannot load data');
      }
      
      const map = stateManager.get('map');
      if (!map) {
        throw new Error('Map not available');
      }
      
      const response = await fetch('geojson/ses.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data?.features) {
        throw new Error('Invalid GeoJSON structure');
      }
      
      // Clear any existing markers
      this.clearMarkers();
      
      let loaded = 0;
      this.features = data.features;
      
      // Iterate over SES unit features and add markers
      data.features.forEach(feature => {
        const props = feature.properties;
        if (!props) return;
        
        const unitName = props.SES_UNIT_NAME;
        const x = props.X_CORD;
        const y = props.Y_CORD;
        
        if (unitName && x && y) {
          try {
            const icon = this.createIcon(unitName);
            const marker = L.marker([y, x], { 
              icon, 
              interactive: false 
            }).addTo(map);
            
            this.markers.push(marker);
            loaded++;
            
          } catch (error) {
            this.logger.debug('Failed to create marker for SES unit', { 
              unitName, 
              x, 
              y, 
              error: error.message 
            });
          }
        }
      });
      
      // Mark as loaded
      this.loaded = true;
      this.loading = false;
      
      // Emit success event
      globalEventBus.emit('sesUnits:loaded', { 
        loadedCount: loaded,
        totalFeatures: this.features.length
      });
      
      this.logger.info('SES units loaded successfully', {
        loadedCount: loaded,
        totalFeatures: this.features.length
      });
      
    } catch (error) {
      this.logger.error('Failed to load SES units', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      globalEventBus.emit('sesUnits:error', { error });
      
      // Show user-friendly error
      this.showLoadingError(error);
      
      throw error;
    }
  }
  
  /**
   * Create SES unit marker icon
   */
  createIcon(unitName) {
    return L.divIcon({
      className: 'ses-unit-marker',
      html: `<div class="ses-unit-label">${this.toTitleCase(unitName)}</div>`,
      iconAnchor: [60, 44]
    });
  }
  
  /**
   * Clear all SES unit markers from the map
   */
  clearMarkers() {
    const map = stateManager.get('map');
    if (map) {
      this.markers.forEach(marker => {
        map.removeLayer(marker);
      });
    }
    this.markers = [];
    this.logger.debug('Cleared all SES unit markers');
  }
  
  /**
   * Utility methods
   */
  isOffline() {
    return window.isOffline ? window.isOffline() : !navigator.onLine;
  }
  
  showLoadingError(error) {
    if (window.showSidebarError) {
      window.showSidebarError(`Failed to load SES units: ${error.message}`);
    } else {
      this.logger.error(`Loading error: ${error.message}`);
    }
  }
  
  toTitleCase(str) {
    if (window.toTitleCase) {
      return window.toTitleCase(str);
    }
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  
  /**
   * Get SES units loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      loaded: this.loaded,
      featureCount: this.features.length,
      markerCount: this.markers.length
    };
  }
}

// Export singleton instance
export const sesUnitsLoader = new SesUnitsLoader();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
