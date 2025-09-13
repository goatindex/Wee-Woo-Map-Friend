/**
 * @module modules/PoliceLoader
 * Modern ES6-based police station loading for WeeWoo Map Friend
 * Replaces the legacy loadPolice function with a reactive, event-driven system
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';

/**
 * @class PoliceLoader
 * Loads and manages police station data from GeoJSON sources
 */
@injectable()
export class PoliceLoader {
  constructor(
    @inject(TYPES.EventBus) private eventBus,
    @inject(TYPES.StateManager) private stateManager,
    @inject(TYPES.ConfigurationManager) private configurationManager,
    @inject(TYPES.LayerManager) private layerManager,
    @inject(TYPES.StructuredLogger) private logger
  ) {
    this.initialized = false;
    this.loading = false;
    this.loaded = false;
    this.policeData = [];
    this.markers = new Map(); // key -> marker
    
    // Create module-specific logger
    this.moduleLogger = this.
    
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
    
    this.moduleLogger.info('Police loading system initialized');
  }
  
  /**
   * Initialize the police loader
   */
  async init() {
    if (this.initialized) {
      this.moduleLogger.warn('Already initialized');
      return;
    }
    
    try {
      this.moduleLogger.info('Starting police loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.moduleLogger.info('Police loading system ready');
      
    } catch (error) {
      this.moduleLogger.error('Failed to initialize', { 
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
      { name: 'LayerManager', check: () => this.layerManager.isReady() },
      { name: 'ConfigurationManager', check: () => this.configurationManager.isReady() },
      { name: 'StateManager', check: () => this.stateManager.isReady() }
    ];
    
    for (const dep of dependencies) {
      if (!dep.check()) {
        this.moduleLogger.info(`Waiting for ${dep.name}...`);
        await this.waitForDependency(dep.check, dep.name);
      }
    }
    
    this.moduleLogger.info('All dependencies ready');
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
          this.moduleLogger.info(`${name} ready`);
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
    this.eventBus.on('layer:ready', () => {
      this.moduleLogger.info('Layer manager ready, can load police stations');
    });
    
    // Listen for configuration changes
    this.eventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta.police')) {
        this.moduleLogger.info('Police metadata updated');
      }
    });
    
    this.moduleLogger.info('Event listeners configured');
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
      
      this.moduleLogger.info(`Loaded ${this.policeData.length} police features`);
      return this.policeData;
      
    } catch (error) {
      this.moduleLogger.error('Error loading police features', { 
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
      this.moduleLogger.warn('Already loading');
      return;
    }
    
    if (this.loaded) {
      this.moduleLogger.warn('Already loaded');
      return;
    }
    
    try {
      this.moduleLogger.info('Loading police stations...');
      
      this.loading = true;
      this.eventBus.emit('police:loading');
      
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
      this.eventBus.emit('police:loaded', { 
        featureCount: this.policeData.length 
      });
      
      this.moduleLogger.info('Police stations loaded successfully', {
        featureCount: this.policeData.length
      });
      
    } catch (error) {
      this.moduleLogger.error('Failed to load police stations', { 
        error: error.message, 
        stack: error.stack 
      });
      
      this.loading = false;
      
      // Emit error event
      this.eventBus.emit('police:error', { error });
      
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
    const meta = this.configurationManager.get(`categoryMeta.${category}`);
    if (!meta) {
      throw new Error(`No metadata found for category ${category}`);
    }
    
    // Initialize feature layers for police category
    const currentFeatureLayers = this.stateManager.get('featureLayers', {});
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
    
    this.stateManager.set('featureLayers', currentFeatureLayers);
    
    // Update names by category
    const currentNamesByCategory = this.stateManager.get('namesByCategory', {});
    currentNamesByCategory[category] = Object.keys(currentFeatureLayers[category])
      .map(key => {
        const match = this.policeData.find(feature => 
          (feature.properties?.[meta.nameProp] || '').trim().toLowerCase().replace(/\s+/g, '_') === key
        );
        return match ? (match.properties?.[meta.nameProp] || '').trim() : key;
      })
      .sort((a, b) => a.localeCompare(b));
    
    this.stateManager.set('namesByCategory', currentNamesByCategory);
    
    // Update name to key mapping
    const currentNameToKey = this.stateManager.get('nameToKey', {});
    currentNameToKey[category] = {};
    currentNamesByCategory[category].forEach(name => {
      currentNameToKey[category][name] = name.toLowerCase().replace(/\s+/g, '_');
    });
    
    this.stateManager.set('nameToKey', currentNameToKey);
    
    // Initialize emphasised state for category
    const currentEmphasised = this.stateManager.get('emphasised', {});
    if (!currentEmphasised[category]) {
      currentEmphasised[category] = {};
    }
    this.stateManager.set('emphasised', currentEmphasised);
    
    // Initialize name label markers for category
    const currentNameLabelMarkers = this.stateManager.get('nameLabelMarkers', {});
    if (!currentNameLabelMarkers[category]) {
      currentNameLabelMarkers[category] = {};
    }
    this.stateManager.set('nameLabelMarkers', currentNameLabelMarkers);
    
    this.moduleLogger.info(`Processed ${this.policeData.length} police features`);
  }
  
  /**
   * Populate sidebar with police station data
   */
  populateSidebar() {
    const category = 'police';
    const meta = this.configurationManager.get(`categoryMeta.${category}`);
    const listEl = document.getElementById(meta.listId);
    
    if (!listEl) {
      this.moduleLogger.error('policeList element not found in DOM');
      return;
    }
    
    // Clear existing content
    listEl.innerHTML = '';
    
    const namesByCategory = this.stateManager.get('namesByCategory', {});
    const nameToKey = this.stateManager.get('nameToKey', {});
    
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
    
    this.moduleLogger.info(`Sidebar populated with ${namesByCategory[category].length} police stations`);
  }
  
  /**
   * Set up "Show All" toggle functionality
   */
  setupToggleAll() {
    const category = 'police';
    const meta = this.configurationManager.get(`categoryMeta.${category}`);
    const toggleAll = document.getElementById(meta.toggleAllId);
    
    if (!toggleAll) {
      this.moduleLogger.warn(`Toggle all element not found for ${category}`);
      return;
    }
    
    // Remove existing event listeners
    const newToggleAll = toggleAll.cloneNode(true);
    toggleAll.parentNode.replaceChild(newToggleAll, toggleAll);
    
    // Add new event listener
    newToggleAll.addEventListener('change', (e) => {
      this.handleToggleAll(e.target.checked);
    });
    
    this.moduleLogger.info(`Toggle All functionality configured for ${category}`);
  }
  
  /**
   * Handle toggle all functionality
   */
  handleToggleAll(checked) {
    const category = 'police';
    const namesByCategory = this.stateManager.get('namesByCategory', {});
    const nameToKey = this.stateManager.get('nameToKey', {});
    
    // Begin bulk operation
    this.stateManager.beginBulkOperation('toggleAll', namesByCategory[category].length);
    
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
      this.stateManager.endBulkOperation();
    }
    
    this.moduleLogger.info(`Toggle All handled for ${category}`, { checked });
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
      const emphasised = this.stateManager.get('emphasised', {});
      if (emphasised.police) {
        emphasised.police[key] = false;
        this.stateManager.set('emphasised', emphasised);
      }
      
      const nameLabelMarkers = this.stateManager.get('nameLabelMarkers', {});
      const map = this.stateManager.get('map');
      if (nameLabelMarkers.police?.[key] && map) {
        map.removeLayer(nameLabelMarkers.police[key]);
        nameLabelMarkers.police[key] = null;
        this.stateManager.set('nameLabelMarkers', nameLabelMarkers);
      }
    }
    
    // Update active list
    this.eventBus.emit('activeList:update');
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
    const map = this.stateManager.get('map');
    if (!map) {
      this.moduleLogger.warn('Map not available');
      return;
    }
    
    // Check if marker already exists and is visible
    const featureLayers = this.stateManager.get('featureLayers', {});
    if (featureLayers.police?.[key]) {
      map.addLayer(featureLayers.police[key]);
      return;
    }
    
    // Find the feature for this key
    const feature = this.policeData.find(f => 
      (f.properties?.place_name || '').trim().toLowerCase().replace(/\s+/g, '_') === key
    );
    
    if (!feature) {
      this.moduleLogger.warn(`No feature found for key: ${key}`);
      return;
    }
    
    const coords = feature.geometry.coordinates;
    const lat = +coords[1];
    const lng = +coords[0];
    
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.moduleLogger.warn(`Invalid coordinates for ${key}: lat=${lat}, lng=${lng}`);
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
    this.stateManager.set('featureLayers', featureLayers);
    
    this.markers.set(key, marker);
    
    this.moduleLogger.debug(`Police marker shown for ${key}`);
  }
  
  /**
   * Hide police marker for the given key
   */
  hideMarker(key) {
    const map = this.stateManager.get('map');
    if (!map) {
      this.moduleLogger.warn('Map not available');
      return;
    }
    
    const featureLayers = this.stateManager.get('featureLayers', {});
    const marker = featureLayers.police?.[key];
    
    if (marker) {
      map.removeLayer(marker);
      
      // Remove emphasis styling if present
      const element = marker.getElement();
      if (element) {
        element.classList.remove('police-emph');
      }
      
      this.moduleLogger.debug(`Police marker hidden for ${key}`);
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
      this.moduleLogger.error(`Loading error: ${error.message}`);
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
// Legacy compatibility functions - use DI container instead
export const policeLoader = {
  init: () => { console.warn('policeLoader.init: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  load: () => { console.warn('policeLoader.load: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  getFeatures: () => { console.warn('policeLoader.getFeatures: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  createIcon: () => { console.warn('policeLoader.createIcon: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  showMarker: () => { console.warn('policeLoader.showMarker: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  hideMarker: () => { console.warn('policeLoader.hideMarker: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  processFeatures: () => { console.warn('policeLoader.processFeatures: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  populateSidebar: () => { console.warn('policeLoader.populateSidebar: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  setupToggleAll: () => { console.warn('policeLoader.setupToggleAll: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); },
  handleMarkerToggle: () => { console.warn('policeLoader.handleMarkerToggle: Legacy function called. Use DI container to get PoliceLoader instance.'); throw new Error('Legacy function not available. Use DI container to get PoliceLoader instance.'); }
};

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
