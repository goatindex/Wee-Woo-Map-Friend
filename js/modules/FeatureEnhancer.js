/**
 * @module modules/FeatureEnhancer
 * Modern ES6-based feature enhancement utilities
 * Replaces legacy feature enhancement functions with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class FeatureEnhancer
 * Handles feature enhancements like polygon plus markers and SES chevrons
 */
export class FeatureEnhancer {
  constructor() {
    this.initialized = false;
    this.activeEnhancements = new Map(); // featureId -> enhancement data
    this.sesFacilityCoords = new Map(); // normalized name -> coordinates
    this.cfaFacilityCoords = new Map(); // normalized name -> coordinates
    
    // Bind methods
    this.init = this.init.bind(this);
    this.addPolygonPlus = this.addPolygonPlus.bind(this);
    this.removePolygonPlus = this.removePolygonPlus.bind(this);
    this.showSesChevron = this.showSesChevron.bind(this);
    this.hideSesChevron = this.hideSesChevron.bind(this);
    this.storeSesFacilityCoords = this.storeSesFacilityCoords.bind(this);
    this.storeCfaFacilityCoords = this.storeCfaFacilityCoords.bind(this);
    this.getSesFacilityCoords = this.getSesFacilityCoords.bind(this);
    this.getCfaFacilityCoords = this.getCfaFacilityCoords.bind(this);
    this.clearEnhancements = this.clearEnhancements.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('✨ FeatureEnhancer: Feature enhancement system initialized');
  }
  
  /**
   * Initialize the feature enhancer
   */
  async init() {
    if (this.initialized) {
      console.warn('FeatureEnhancer: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 FeatureEnhancer: Starting feature enhancer initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize legacy compatibility
      this.setupLegacyCompatibility();
      
      this.initialized = true;
      console.log('✅ FeatureEnhancer: Feature enhancement system ready');
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Wait for required dependencies
   */
  async waitForDependencies() {
    const dependencies = [
      { name: 'L', global: 'L', timeout: 5000 },
      { name: 'Map', check: () => stateManager.get('map'), timeout: 10000 }
    ];
    
    for (const dep of dependencies) {
      if (dep.global && !window[dep.global]) {
        await this.waitForGlobal(dep.global, dep.timeout, dep.name);
      } else if (dep.check && !dep.check()) {
        await this.waitForDependency(dep.check, dep.name, dep.timeout);
      }
    }
    
    console.log('✅ FeatureEnhancer: All dependencies ready');
  }
  
  /**
   * Wait for a global variable to be available
   */
  async waitForGlobal(globalName, timeout, friendlyName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${friendlyName}`));
      }, timeout);
      
      const check = () => {
        if (window[globalName]) {
          clearTimeout(timer);
          resolve(window[globalName]);
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Wait for a dependency to be available
   */
  async waitForDependency(checkFn, name, timeout) {
    return new Promise((resolve, reject) => {
      if (checkFn()) {
        resolve();
        return;
      }
      
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${name}`));
      }, timeout);
      
      const check = () => {
        if (checkFn()) {
          clearTimeout(timer);
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
    // Listen for polygon plus requests
    globalEventBus.on('enhancement:polygonPlus', ({ action, map, layer, key }) => {
      try {
        if (action === 'add') {
          this.addPolygonPlus(map, layer, key);
        } else if (action === 'remove') {
          this.removePolygonPlus(layer, map, key);
        }
      } catch (error) {
        globalEventBus.emit('enhancement:error', { error: error.message, action, key });
      }
    });
    
    // Listen for SES chevron requests
    globalEventBus.on('enhancement:sesChevron', ({ action, key, map }) => {
      try {
        if (action === 'show') {
          this.showSesChevron(key, map);
        } else if (action === 'hide') {
          this.hideSesChevron(key, map);
        }
      } catch (error) {
        globalEventBus.emit('enhancement:error', { error: error.message, action, key });
      }
    });
    
    // Listen for facility coordinate storage
    globalEventBus.on('enhancement:storeCoords', ({ category, name, coordinates }) => {
      try {
        if (category === 'ses') {
          this.storeSesFacilityCoords(name, coordinates);
        } else if (category === 'cfa') {
          this.storeCfaFacilityCoords(name, coordinates);
        }
      } catch (error) {
        globalEventBus.emit('enhancement:error', { error: error.message, action: 'storeCoords', category, name });
      }
    });
    
    console.log('✅ FeatureEnhancer: Event listeners configured');
  }
  
  /**
   * Set up legacy compatibility
   */
  setupLegacyCompatibility() {
    // Initialize legacy global objects if they don't exist
    if (typeof window !== 'undefined') {
      if (!window.sesFacilityCoords) {
        window.sesFacilityCoords = {};
      }
      if (!window.cfaFacilityCoords) {
        window.cfaFacilityCoords = {};
      }
    }
    
    console.log('✅ FeatureEnhancer: Legacy compatibility configured');
  }
  
  /**
   * Add a plus marker at the center of a polygon
   * @param {Object} map - Leaflet map instance
   * @param {Object} polygonLayer - Polygon layer to enhance
   * @param {string} key - Feature key for tracking
   */
  addPolygonPlus(map, polygonLayer, key) {
    try {
      if (!polygonLayer || !polygonLayer.getBounds) {
        console.warn('⚠️ FeatureEnhancer: Invalid polygon layer for plus marker');
        return;
      }
      
      if (!map) {
        console.warn('⚠️ FeatureEnhancer: No map available for plus marker');
        return;
      }
      
      // Remove existing plus marker if any
      this.removePolygonPlus(polygonLayer, map, key);
      
      // Get polygon center
      const center = polygonLayer.getBounds().getCenter();
      
      // Create SVG plus icon
      const size = 32, thickness = 8;
      const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
        <rect x="${(size-thickness)/2}" y="0" width="${thickness}" height="${size}" fill="#fff" rx="3"/>
        <rect x="0" y="${(size-thickness)/2}" width="${size}" height="${thickness}" fill="#fff" rx="3"/>
      </svg>`;
      
      // Create Leaflet icon
      const icon = L.divIcon({
        className: 'polygon-plus-icon',
        html: svg,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
      
      // Create and add marker
      const marker = L.marker(center, { icon, interactive: false }).addTo(map);
      
      // Store enhancement data
      this.activeEnhancements.set(key, {
        type: 'polygonPlus',
        marker: marker,
        layer: polygonLayer,
        map: map
      });
      
      // Attach marker to layer for legacy compatibility
      polygonLayer._plusMarker = marker;
      
      // Emit enhancement added event
      globalEventBus.emit('enhancement:added', { type: 'polygonPlus', key, marker });
      
      console.log(`✅ FeatureEnhancer: Polygon plus marker added for ${key}`);
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to add polygon plus:', error);
      throw error;
    }
  }
  
  /**
   * Remove a plus marker from a polygon
   * @param {Object} polygonLayer - Polygon layer
   * @param {Object} map - Leaflet map instance
   * @param {string} key - Feature key for tracking
   */
  removePolygonPlus(polygonLayer, map, key) {
    try {
      const enhancement = this.activeEnhancements.get(key);
      
      if (enhancement && enhancement.type === 'polygonPlus') {
        // Remove marker from map
        if (enhancement.marker && map) {
          map.removeLayer(enhancement.marker);
        }
        
        // Remove from active enhancements
        this.activeEnhancements.delete(key);
        
        // Clear legacy reference
        if (polygonLayer && polygonLayer._plusMarker) {
          polygonLayer._plusMarker = null;
        }
        
        // Emit enhancement removed event
        globalEventBus.emit('enhancement:removed', { type: 'polygonPlus', key });
        
        console.log(`✅ FeatureEnhancer: Polygon plus marker removed for ${key}`);
      }
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to remove polygon plus:', error);
      throw error;
    }
  }
  
  /**
   * Show SES chevron for a facility
   * @param {string} key - Facility key
   * @param {Object} map - Leaflet map instance
   */
  showSesChevron(key, map) {
    try {
      if (!map) {
        console.warn('⚠️ FeatureEnhancer: No map available for SES chevron');
        return;
      }
      
      // Get facility coordinates
      const coords = this.getSesFacilityCoords(key);
      if (!coords) {
        console.warn(`⚠️ FeatureEnhancer: No coordinates found for SES facility ${key}`);
        return;
      }
      
      // Remove existing chevron if any
      this.hideSesChevron(key, map);
      
      // Create chevron marker (simplified implementation)
      const icon = L.divIcon({
        className: 'ses-chevron-icon',
        html: '🔻',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      const marker = L.marker([coords.lat, coords.lng], { icon, interactive: false }).addTo(map);
      
      // Store enhancement data
      this.activeEnhancements.set(`ses_chevron_${key}`, {
        type: 'sesChevron',
        marker: marker,
        key: key,
        map: map
      });
      
      // Emit enhancement added event
      globalEventBus.emit('enhancement:added', { type: 'sesChevron', key, marker });
      
      console.log(`✅ FeatureEnhancer: SES chevron shown for ${key}`);
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to show SES chevron:', error);
      throw error;
    }
  }
  
  /**
   * Hide SES chevron for a facility
   * @param {string} key - Facility key
   * @param {Object} map - Leaflet map instance
   */
  hideSesChevron(key, map) {
    try {
      const enhancementKey = `ses_chevron_${key}`;
      const enhancement = this.activeEnhancements.get(enhancementKey);
      
      if (enhancement && enhancement.type === 'sesChevron') {
        // Remove marker from map
        if (enhancement.marker && map) {
          map.removeLayer(enhancement.marker);
        }
        
        // Remove from active enhancements
        this.activeEnhancements.delete(enhancementKey);
        
        // Emit enhancement removed event
        globalEventBus.emit('enhancement:removed', { type: 'sesChevron', key });
        
        console.log(`✅ FeatureEnhancer: SES chevron hidden for ${key}`);
      }
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to hide SES chevron:', error);
      throw error;
    }
  }
  
  /**
   * Store SES facility coordinates
   * @param {string} name - Normalized facility name
   * @param {Object} feature - GeoJSON feature
   */
  storeSesFacilityCoords(name, feature) {
    try {
      if (!name || !feature || feature.geometry.type !== 'Point') {
        return;
      }
      
      const coords = {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      };
      
      // Store in local map
      this.sesFacilityCoords.set(name.toLowerCase(), coords);
      
      // Store in legacy global for compatibility
      if (typeof window !== 'undefined') {
        window.sesFacilityCoords[name.toLowerCase()] = coords;
      }
      
      console.log(`✅ FeatureEnhancer: SES facility coordinates stored for ${name}`);
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to store SES facility coordinates:', error);
    }
  }
  
  /**
   * Store CFA facility coordinates
   * @param {string} name - Normalized facility name
   * @param {Object} feature - GeoJSON feature
   */
  storeCfaFacilityCoords(name, feature) {
    try {
      if (!name || !feature || feature.geometry.type !== 'Point') {
        return;
      }
      
      const coords = {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      };
      
      // Store in local map
      this.cfaFacilityCoords.set(name.toLowerCase(), coords);
      
      // Store in legacy global for compatibility
      if (typeof window !== 'undefined') {
        window.cfaFacilityCoords[name.toLowerCase()] = coords;
      }
      
      console.log(`✅ FeatureEnhancer: CFA facility coordinates stored for ${name}`);
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to store CFA facility coordinates:', error);
    }
  }
  
  /**
   * Get SES facility coordinates
   * @param {string} key - Facility key
   * @returns {Object|null} - Coordinates object or null
   */
  getSesFacilityCoords(key) {
    if (!key) return null;
    
    // Try local map first
    const coords = this.sesFacilityCoords.get(key.toLowerCase());
    if (coords) return coords;
    
    // Fall back to legacy global
    if (typeof window !== 'undefined' && window.sesFacilityCoords) {
      return window.sesFacilityCoords[key.toLowerCase()] || null;
    }
    
    return null;
  }
  
  /**
   * Get CFA facility coordinates
   * @param {string} key - Facility key
   * @returns {Object|null} - Coordinates object or null
   */
  getCfaFacilityCoords(key) {
    if (!key) return null;
    
    // Try local map first
    const coords = this.cfaFacilityCoords.get(key.toLowerCase());
    if (coords) return coords;
    
    // Fall back to legacy global
    if (typeof window !== 'undefined' && window.cfaFacilityCoords) {
      return window.cfaFacilityCoords[key.toLowerCase()] || null;
    }
    
    return null;
  }
  
  /**
   * Clear all active enhancements
   */
  clearEnhancements() {
    try {
      this.activeEnhancements.forEach((enhancement, key) => {
        if (enhancement.marker && enhancement.map) {
          enhancement.map.removeLayer(enhancement.marker);
        }
      });
      
      this.activeEnhancements.clear();
      
      console.log('✅ FeatureEnhancer: All enhancements cleared');
      
    } catch (error) {
      console.error('🚨 FeatureEnhancer: Failed to clear enhancements:', error);
    }
  }
  
  /**
   * Get feature enhancer status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeEnhancements: this.activeEnhancements.size,
      sesFacilities: this.sesFacilityCoords.size,
      cfaFacilities: this.cfaFacilityCoords.size,
      enhancementTypes: Array.from(new Set(
        Array.from(this.activeEnhancements.values()).map(e => e.type)
      ))
    };
  }
}

// Export singleton instance
export const featureEnhancer = new FeatureEnhancer();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
