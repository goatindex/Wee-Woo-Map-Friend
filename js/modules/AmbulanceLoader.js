/**
 * @module modules/AmbulanceLoader
 * Modern ES6-based ambulance station loading for WeeWoo Map Friend
 * Replaces the legacy loadAmbulance function with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
import { logger } from './StructuredLogger.js';

/**
 * @class AmbulanceLoader
 * Loads and manages ambulance station data from GeoJSON sources
 */
export class AmbulanceLoader {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.ambulanceData = [];
    this.markers = new Map(); // key -> marker
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'AmbulanceLoader' });
    
    // Bind methods
    this.init = this.init.bind(this);
    this.load = this.load.bind(this);
    this.getFeatures = this.getFeatures.bind(this);
    this.createIcon = this.createIcon.bind(this);
    this.showMarker = this.showMarker.bind(this);
    this.hideMarker = this.hideMarker.bind(this);
    this.processFeatures = this.processFeatures.bind(this);
    this.populateSidebar = this.populateSidebar.bind(this);
    this.setupToggleAll = this.setupToggleAll.bind(this);
    this.handleMarkerToggle = this.handleMarkerToggle.bind(this);
    
    this.logger.info('Ambulance loading system initialized');
  }
  
  /**
   * Initialize the ambulance loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting ambulance loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('Ambulance loading system ready');
      
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
      this.logger.info('Layer manager ready, can load ambulance stations');
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta.ambulance')) {
        this.logger.info('Ambulance metadata updated');
      }
    });
    
    this.logger.info('Event listeners configured');
  }
  
  /**
   * Get ambulance features as a Promise for preloader batching
   */
  async getFeatures() {
    if (this.ambulanceData.length) {
      return this.ambulanceData;
    }
    
    try {
      const response = await fetch('geojson/ambulance.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.ambulanceData = data.features.filter(feature =>
        feature?.properties?.facility_state?.toLowerCase() === 'victoria' &&
        feature.properties.facility_lat && 
        feature.properties.facility_long
      );
      
      this.logger.info(`Loaded ${this.ambulanceData.length} ambulance features`);
      return this.ambulanceData;
      
    } catch (error) {
      this.logger.error('Error loading ambulance features', { 
        error: error.message 
      });
      return [];
    }
  }
  
  /**
   * Load the ambulance dataset and build the sidebar list
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
      this.logger.info('Loading ambulance stations...');
      
      this.loading = true;
      globalEventBus.emit('ambulance:loading');
      
      // Check offline status
      if (this.isOffline()) {
        throw new Error('Offline - cannot load data');
      }
      
      // Get features
      await this.getFeatures();
      
      // Process features and update state
      this.processFeatures();
      
      // Populate sidebar
      this.populateSidebar();
      
      // Set up toggle all functionality
      this.setupToggleAll();
      
      // Mark as loaded
      this.loaded = true;
      this.loading = false;
      
      // Emit success event
      globalEventBus.emit('ambulance:loaded', { 
        featureCount: this.ambulanceData.length 
      });
      
      this.logger.info('Ambulance stations loaded successfully', {
        featureCount: this.ambulanceData.length
      });
      
    } catch (error) {
      this.logger.error('Failed to load ambulance stations', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      globalEventBus.emit('ambulance:error', { error });
      
      // Show user-friendly error
      this.showLoadingError(error);
      
      throw error;
    }
  }
  
  /**
   * Process features and update application state
   */
  processFeatures() {
    const category = 'ambulance';
    const meta = configurationManager.get(`categoryMeta.${category}`);
    if (!meta) {
      throw new Error(`No metadata found for category ${category}`);
    }
    
    // Initialize feature layers for ambulance category
    const currentFeatureLayers = stateManager.get('featureLayers', {});
    if (!currentFeatureLayers[category]) {
      currentFeatureLayers[category] = {};
    }
    
    // Process each feature
    this.ambulanceData.forEach(feature => {
      const rawName = (feature.properties[meta.nameProp] || '').trim();
      if (!rawName) return;
      
      const key = rawName.toLowerCase().replace(/\s+/g, '_');
      currentFeatureLayers[category][key] = null; // Will be populated when marker is shown
    });
    
    stateManager.set('featureLayers', currentFeatureLayers);
    
    // Update names by category
    const currentNamesByCategory = stateManager.get('namesByCategory', {});
    currentNamesByCategory[category] = Object.keys(currentFeatureLayers[category])
      .map(key => {
        const match = this.ambulanceData.find(feature => 
          feature.properties[meta.nameProp].trim().toLowerCase().replace(/\s+/g, '_') === key
        );
        return match ? match.properties[meta.nameProp].trim() : key;
      })
      .sort((a, b) => a.localeCompare(b));
    
    stateManager.set('namesByCategory', currentNamesByCategory);
    
    // Update name to key mapping
    const currentNameToKey = stateManager.get('nameToKey', {});
    currentNameToKey[category] = {};
    currentNamesByCategory[category].forEach(name => {
      currentNameToKey[category][name] = name.toLowerCase().replace(/\s+/g, '_');
    });
    
    stateManager.set('nameToKey', currentNameToKey);
    
    // Initialize emphasised state for category
    const currentEmphasised = stateManager.get('emphasised', {});
    if (!currentEmphasised[category]) {
      currentEmphasised[category] = {};
    }
    stateManager.set('emphasised', currentEmphasised);
    
    // Initialize name label markers for category
    const currentNameLabelMarkers = stateManager.get('nameLabelMarkers', {});
    if (!currentNameLabelMarkers[category]) {
      currentNameLabelMarkers[category] = {};
    }
    stateManager.set('nameLabelMarkers', currentNameLabelMarkers);
    
    this.logger.info(`Processed ${this.ambulanceData.length} ambulance features`);
  }
  
  /**
   * Populate sidebar with ambulance station data
   */
  populateSidebar() {
    const category = 'ambulance';
    const meta = configurationManager.get(`categoryMeta.${category}`);
    const listEl = document.getElementById('ambulanceList');
    
    if (!listEl) {
      this.logger.error('ambulanceList element not found in DOM');
      return;
    }
    
    // Clear existing content
    listEl.innerHTML = '';
    
    const namesByCategory = stateManager.get('namesByCategory', {});
    const nameToKey = stateManager.get('nameToKey', {});
    
    // Create checkboxes for each ambulance station
    namesByCategory[category].forEach(fullName => {
      const key = nameToKey[category][fullName];
      const checked = meta.defaultOn ? meta.defaultOn(fullName) : false;
      
      // Remove 'ambulance station' at end (case-insensitive), trim, and title case for sidebar
      let displayName = fullName.replace(/\s*ambulance station\s*$/i, '').trim();
      displayName = this.toTitleCase(displayName);
      
      const checkbox = this.createCheckbox(`${category}_${key}`, displayName, checked, (e) => {
        this.handleMarkerToggle(key, e.target.checked);
      });
      
      listEl.appendChild(checkbox);
      
      // Show marker if checked by default
      if (checked) {
        this.showMarker(key);
      }
    });
    
    this.logger.info(`Sidebar populated with ${namesByCategory[category].length} ambulance stations`);
  }
  
  /**
   * Set up "Show All" toggle functionality
   */
  setupToggleAll() {
    const category = 'ambulance';
    const meta = configurationManager.get(`categoryMeta.${category}`);
    const toggleAll = document.getElementById(meta.toggleAllId);
    
    if (!toggleAll) {
      this.logger.warn(`Toggle all element not found for ${category}`);
      return;
    }
    
    // Remove existing event listeners
    const newToggleAll = toggleAll.cloneNode(true);
    toggleAll.parentNode.replaceChild(newToggleAll, toggleAll);
    
    // Add new event listener
    newToggleAll.addEventListener('change', (e) => {
      this.handleToggleAll(e.target.checked);
    });
    
    this.logger.info(`Toggle All functionality configured for ${category}`);
  }
  
  /**
   * Handle toggle all functionality
   */
  handleToggleAll(checked) {
    const category = 'ambulance';
    const namesByCategory = stateManager.get('namesByCategory', {});
    const nameToKey = stateManager.get('nameToKey', {});
    
    // Begin bulk operation
    stateManager.beginBulkOperation('toggleAll', namesByCategory[category].length);
    
    try {
      namesByCategory[category].forEach(name => {
        const key = nameToKey[category][name];
        const element = document.getElementById(`${category}_${key}`);
        let checkbox = null;
        
        if (element) {
          checkbox = element.tagName === 'INPUT' ? element : element.querySelector('input[type="checkbox"]');
        }
        
        if (!checkbox) return;
        
        checkbox.checked = checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } finally {
      // End bulk operation
      stateManager.endBulkOperation();
    }
    
    this.logger.info(`Toggle All handled for ${category}`, { checked });
  }
  
  /**
   * Handle individual marker toggle
   */
  handleMarkerToggle(key, checked) {
    if (checked) {
      this.showMarker(key);
    } else {
      this.hideMarker(key);
      
      // Clean up emphasis and labels
      const emphasised = stateManager.get('emphasised', {});
      if (emphasised.ambulance) {
        emphasised.ambulance[key] = false;
        stateManager.set('emphasised', emphasised);
      }
      
      const nameLabelMarkers = stateManager.get('nameLabelMarkers', {});
      const map = stateManager.get('map');
      if (nameLabelMarkers.ambulance?.[key] && map) {
        map.removeLayer(nameLabelMarkers.ambulance[key]);
        nameLabelMarkers.ambulance[key] = null;
        stateManager.set('nameLabelMarkers', nameLabelMarkers);
      }
    }
    
    // Update active list
    globalEventBus.emit('activeList:update');
  }
  
  /**
   * Create ambulance marker icon
   */
  createIcon() {
    return L.divIcon({
      className: 'ambulance-marker',
      html: `<div style="width:28px;height:28px;background:#d32f2f;border-radius:50%;
        display:flex;align-items:center;justify-content:center;border:2px solid #fff;position:relative;">
        <div style="position:absolute;left:50%;top:50%;width:16px;height:16px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;left:4.2px;top:-1.6px;width:8px;height:20px;background:#fff;border-radius:2px;display:flex;align-items:center;justify-content:center;"></div>
          <div style="position:absolute;left:-1.6px;top:4.0px;width:20px;height:8px;background:#fff;border-radius:2px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>`,
      iconSize: [28, 28], 
      iconAnchor: [14, 14], 
      popupAnchor: [10, -20]
    });
  }
  
  /**
   * Show ambulance marker for the given key
   */
  showMarker(key) {
    const map = stateManager.get('map');
    if (!map) {
      this.logger.warn('Map not available');
      return;
    }
    
    // Check if marker already exists and is visible
    const featureLayers = stateManager.get('featureLayers', {});
    if (featureLayers.ambulance?.[key]) {
      map.addLayer(featureLayers.ambulance[key]);
      return;
    }
    
    // Find the feature for this key
    const feature = this.ambulanceData.find(f => 
      f.properties.facility_name.trim().toLowerCase().replace(/\s+/g, '_') === key
    );
    
    if (!feature) {
      this.logger.warn(`No feature found for key: ${key}`);
      return;
    }
    
    const lat = +feature.properties.facility_lat;
    const lng = +feature.properties.facility_long;
    
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.logger.warn(`Invalid coordinates for ${key}: lat=${lat}, lng=${lng}`);
      return;
    }
    
    // Create and add marker
    const marker = L.marker([lat, lng], { 
      icon: this.createIcon() 
    }).addTo(map);
    
    // Bind popup
    marker.bindPopup(feature.properties.facility_name);
    
    // Store marker reference
    featureLayers.ambulance[key] = marker;
    stateManager.set('featureLayers', featureLayers);
    
    this.markers.set(key, marker);
    
    this.logger.debug(`Ambulance marker shown for ${key}`);
  }
  
  /**
   * Hide ambulance marker for the given key
   */
  hideMarker(key) {
    const map = stateManager.get('map');
    if (!map) {
      this.logger.warn('Map not available');
      return;
    }
    
    const featureLayers = stateManager.get('featureLayers', {});
    const marker = featureLayers.ambulance?.[key];
    
    if (marker) {
      map.removeLayer(marker);
      
      // Remove emphasis styling if present
      const element = marker.getElement();
      if (element) {
        element.classList.remove('ambulance-emph');
      }
      
      this.logger.debug(`Ambulance marker hidden for ${key}`);
    }
    
    this.markers.delete(key);
  }
  
  /**
   * Create a checkbox element
   */
  createCheckbox(id, label, checked, onChange) {
    const container = document.createElement('div');
    container.style.cssText = 'display:flex; align-items:center; margin-bottom:2px;';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = checked;
    checkbox.addEventListener('change', onChange);
    
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    labelEl.style.marginLeft = '8px';
    
    container.appendChild(checkbox);
    container.appendChild(labelEl);
    
    return container;
  }
  
  /**
   * Utility methods (delegated to legacy functions if available)
   */
  isOffline() {
    return window.isOffline ? window.isOffline() : !navigator.onLine;
  }
  
  showLoadingError(error) {
    if (window.showSidebarError) {
      window.showSidebarError(`Failed to load ambulance data: ${error.message}`);
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
   * Get ambulance loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      loaded: this.loaded,
      featureCount: this.ambulanceData.length,
      markerCount: this.markers.size
    };
  }
}

// Export singleton instance
export const ambulanceLoader = new AmbulanceLoader();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
