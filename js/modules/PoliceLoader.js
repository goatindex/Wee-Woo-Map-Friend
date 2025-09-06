/**
 * @module modules/PoliceLoader
 * Modern ES6-based police station loading for WeeWoo Map Friend
 * Replaces the legacy loadPolice function with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
import { logger } from './StructuredLogger.js';

/**
 * @class PoliceLoader
 * Loads and manages police station data from GeoJSON sources
 */
export class PoliceLoader {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.policeData = [];
    this.markers = new Map(); // key -> marker
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'PoliceLoader' });
    
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
    
    this.logger.info('Police loading system initialized');
  }
  
  /**
   * Initialize the police loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting police loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('Police loading system ready');
      
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
      this.logger.info('Layer manager ready, can load police stations');
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta.police')) {
        this.logger.info('Police metadata updated');
      }
    });
    
    this.logger.info('Event listeners configured');
  }
  
  /**
   * Get police features as a Promise for preloader batching
   */
  async getFeatures() {
    if (this.policeData.length) {
      return this.policeData;
    }
    
    try {
      const response = await fetch('geojson/police.geojson');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.policeData = (data.features || []).filter(feature => {
        if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return false;
        if (!feature.properties || (feature.properties.feature || '').toUpperCase() !== 'POLICE STATION') return false;
        const coords = feature.geometry.coordinates;
        return Array.isArray(coords) && coords.length >= 2 && Number.isFinite(+coords[0]) && Number.isFinite(+coords[1]);
      });
      
      this.logger.info(`Loaded ${this.policeData.length} police features`);
      return this.policeData;
      
    } catch (error) {
      this.logger.error('Error loading police features', { 
        error: error.message 
      });
      return [];
    }
  }
  
  /**
   * Load the police stations dataset and build the sidebar list
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
      this.logger.info('Loading police stations...');
      
      this.loading = true;
      globalEventBus.emit('police:loading');
      
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
      globalEventBus.emit('police:loaded', { 
        featureCount: this.policeData.length 
      });
      
      this.logger.info('Police stations loaded successfully', {
        featureCount: this.policeData.length
      });
      
    } catch (error) {
      this.logger.error('Failed to load police stations', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      globalEventBus.emit('police:error', { error });
      
      // Show user-friendly error
      this.showLoadingError(error);
      
      throw error;
    }
  }
  
  /**
   * Process features and update application state
   */
  processFeatures() {
    const category = 'police';
    const meta = configurationManager.get(`categoryMeta.${category}`);
    if (!meta) {
      throw new Error(`No metadata found for category ${category}`);
    }
    
    // Initialize feature layers for police category
    const currentFeatureLayers = stateManager.get('featureLayers', {});
    if (!currentFeatureLayers[category]) {
      currentFeatureLayers[category] = {};
    }
    
    // Process each feature
    this.policeData.forEach(feature => {
      const rawName = (feature.properties?.[meta.nameProp] || '').trim();
      if (!rawName) return;
      
      const key = rawName.toLowerCase().replace(/\s+/g, '_');
      currentFeatureLayers[category][key] = null; // Will be populated when marker is shown
    });
    
    stateManager.set('featureLayers', currentFeatureLayers);
    
    // Update names by category
    const currentNamesByCategory = stateManager.get('namesByCategory', {});
    currentNamesByCategory[category] = Object.keys(currentFeatureLayers[category])
      .map(key => {
        const match = this.policeData.find(feature => 
          (feature.properties?.[meta.nameProp] || '').trim().toLowerCase().replace(/\s+/g, '_') === key
        );
        return match ? (match.properties?.[meta.nameProp] || '').trim() : key;
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
    
    this.logger.info(`Processed ${this.policeData.length} police features`);
  }
  
  /**
   * Populate sidebar with police station data
   */
  populateSidebar() {
    const category = 'police';
    const meta = configurationManager.get(`categoryMeta.${category}`);
    const listEl = document.getElementById(meta.listId);
    
    if (!listEl) {
      this.logger.error('policeList element not found in DOM');
      return;
    }
    
    // Clear existing content
    listEl.innerHTML = '';
    
    const namesByCategory = stateManager.get('namesByCategory', {});
    const nameToKey = stateManager.get('nameToKey', {});
    
    // Create checkboxes for each police station
    namesByCategory[category].forEach(fullName => {
      const key = nameToKey[category][fullName];
      const checked = meta.defaultOn ? meta.defaultOn(fullName) : false;
      
      // Remove 'Police Station' at end (case-insensitive), trim, and title case for sidebar
      let displayName = fullName.replace(/\s*police station\s*$/i, '').trim();
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
    
    this.logger.info(`Sidebar populated with ${namesByCategory[category].length} police stations`);
  }
  
  /**
   * Set up "Show All" toggle functionality
   */
  setupToggleAll() {
    const category = 'police';
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
    const category = 'police';
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
      if (emphasised.police) {
        emphasised.police[key] = false;
        stateManager.set('emphasised', emphasised);
      }
      
      const nameLabelMarkers = stateManager.get('nameLabelMarkers', {});
      const map = stateManager.get('map');
      if (nameLabelMarkers.police?.[key] && map) {
        map.removeLayer(nameLabelMarkers.police[key]);
        nameLabelMarkers.police[key] = null;
        stateManager.set('nameLabelMarkers', nameLabelMarkers);
      }
    }
    
    // Update active list
    globalEventBus.emit('activeList:update');
  }
  
  /**
   * Create police marker icon
   */
  createIcon() {
    return L.divIcon({
      className: 'police-marker',
      html: `<div style="width:28px;height:28px;background:#145088;border-radius:50%;
        display:flex;align-items:center;justify-content:center;border:2px solid #fff;position:relative;overflow:hidden;">
        <div style="position:absolute;left:-8px;right:-8px;top:50%;height:12px;transform:translateY(-50%);
          background:
            linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff) 0 0/12px 12px,
            linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff) 6px 6px/12px 12px;">
        </div>
      </div>`,
      iconSize: [28, 28], 
      iconAnchor: [14, 14], 
      popupAnchor: [10, -20]
    });
  }
  
  /**
   * Show police marker for the given key
   */
  showMarker(key) {
    const map = stateManager.get('map');
    if (!map) {
      this.logger.warn('Map not available');
      return;
    }
    
    // Check if marker already exists and is visible
    const featureLayers = stateManager.get('featureLayers', {});
    if (featureLayers.police?.[key]) {
      map.addLayer(featureLayers.police[key]);
      return;
    }
    
    // Find the feature for this key
    const feature = this.policeData.find(f => 
      (f.properties?.place_name || '').trim().toLowerCase().replace(/\s+/g, '_') === key
    );
    
    if (!feature) {
      this.logger.warn(`No feature found for key: ${key}`);
      return;
    }
    
    const coords = feature.geometry.coordinates;
    const lat = +coords[1];
    const lng = +coords[0];
    
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.logger.warn(`Invalid coordinates for ${key}: lat=${lat}, lng=${lng}`);
      return;
    }
    
    // Create and add marker
    const marker = L.marker([lat, lng], { 
      icon: this.createIcon() 
    }).addTo(map);
    
    // Bind popup
    const popupName = (feature.properties.place_name || 'Police Station');
    marker.bindPopup(this.toTitleCase(popupName.toLowerCase()));
    
    // Store marker reference
    featureLayers.police[key] = marker;
    stateManager.set('featureLayers', featureLayers);
    
    this.markers.set(key, marker);
    
    this.logger.debug(`Police marker shown for ${key}`);
  }
  
  /**
   * Hide police marker for the given key
   */
  hideMarker(key) {
    const map = stateManager.get('map');
    if (!map) {
      this.logger.warn('Map not available');
      return;
    }
    
    const featureLayers = stateManager.get('featureLayers', {});
    const marker = featureLayers.police?.[key];
    
    if (marker) {
      map.removeLayer(marker);
      
      // Remove emphasis styling if present
      const element = marker.getElement();
      if (element) {
        element.classList.remove('police-emph');
      }
      
      this.logger.debug(`Police marker hidden for ${key}`);
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
      window.showSidebarError(`Failed to load police data: ${error.message}`);
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
   * Get police loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      loaded: this.loaded,
      featureCount: this.policeData.length,
      markerCount: this.markers.size
    };
  }
}

// Export singleton instance
export const policeLoader = new PoliceLoader();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
