/**
 * @module modules/PolygonLoader
 * Modern ES6-based polygon loading for WeeWoo Map Friend
 * Replaces the legacy loadPolygonCategory function with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';

/**
 * @class PolygonLoader
 * Loads and manages polygon data from GeoJSON sources
 */
export class PolygonLoader {
  constructor() {
    this.initialized = false;
    this.loadingCategories = new Set();
    this.loadedCategories = new Set();
    this.categoryData = new Map(); // category -> { features, layers, names, nameToKey }
    
    // Bind methods
    this.init = this.init.bind(this);
    this.loadCategory = this.loadCategory.bind(this);
    this.processFeatures = this.processFeatures.bind(this);
    this.createLayers = this.createLayers.bind(this);
    this.updateState = this.updateState.bind(this);
    this.populateSidebar = this.populateSidebar.bind(this);
    this.getCategoryData = this.getCategoryData.bind(this);
    this.isCategoryLoaded = this.isCategoryLoaded.bind(this);
    this.isCategoryLoading = this.isCategoryLoading.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('📐 PolygonLoader: Polygon loading system initialized');
  }
  
  /**
   * Initialize the polygon loader
   */
  async init() {
    if (this.initialized) {
      console.warn('PolygonLoader: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 PolygonLoader: Starting polygon loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ PolygonLoader: Polygon loading system ready');
      
    } catch (error) {
      console.error('🚨 PolygonLoader: Failed to initialize:', error);
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
        console.log(`⏳ PolygonLoader: Waiting for ${dep.name}...`);
        await this.waitForDependency(dep.check, dep.name);
      }
    }
    
    console.log('✅ PolygonLoader: All dependencies ready');
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
          console.log(`✅ PolygonLoader: ${name} ready`);
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
      console.log('🔄 PolygonLoader: Layer manager ready, can load polygons');
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta')) {
        console.log('🔄 PolygonLoader: Category metadata updated');
      }
    });
    
    console.log('✅ PolygonLoader: Event listeners configured');
  }
  
  /**
   * Load a polygon category from GeoJSON
   */
  async loadCategory(category, url) {
    if (this.loadingCategories.has(category)) {
      console.warn(`PolygonLoader: Category ${category} already loading`);
      return;
    }
    
    if (this.loadedCategories.has(category)) {
      console.warn(`PolygonLoader: Category ${category} already loaded`);
      return;
    }
    
    try {
      console.log(`🔧 PolygonLoader: Loading category ${category} from ${url}`);
      
      this.loadingCategories.add(category);
      globalEventBus.emit('polygon:loading', { category, url });
      
      // Check offline status
      if (this.isOffline()) {
        throw new Error('Offline - cannot load data');
      }
      
      // Fetch GeoJSON data
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category}: ${response.status}`);
      }
      
      const geojson = await response.json();
      
      // Process features
      const processedData = this.processFeatures(category, geojson.features);
      
      // Create map layers
      const layers = this.createLayers(category, processedData.features);
      
      // Update application state
      this.updateState(category, processedData, layers);
      
      // Populate sidebar
      this.populateSidebar(category, processedData);
      
      // Mark as loaded
      this.loadedCategories.add(category);
      this.loadingCategories.delete(category);
      
      // Store category data
      this.categoryData.set(category, {
        features: processedData.features,
        layers: layers,
        names: processedData.names,
        nameToKey: processedData.nameToKey
      });
      
      // Emit success event
      globalEventBus.emit('polygon:loaded', { 
        category, 
        featureCount: processedData.features.length,
        layerCount: layers.length
      });
      
      console.log(`✅ PolygonLoader: Category ${category} loaded successfully`);
      
    } catch (error) {
      console.error(`🚨 PolygonLoader: Failed to load category ${category}:`, error);
      
      this.loadingCategories.delete(category);
      
      // Emit error event
      globalEventBus.emit('polygon:error', { category, error });
      
      // Show user-friendly error
      this.showLoadingError(category, error);
      
      throw error;
    }
  }
  
  /**
   * Process GeoJSON features for a category
   */
  processFeatures(category, features) {
    const meta = configurationManager.get(`categoryMeta.${category}`);
    if (!meta) {
      throw new Error(`No metadata found for category ${category}`);
    }
    
    const processedFeatures = [];
    const names = [];
    const nameToKey = {};
    
    // Normalize SES names to match facilities
    const normaliseSes = (s) => (s || '')
      .replace(/^VIC\s*SES\s+/i, '')
      .replace(/^VICSES\s+/i, '')
      .replace(/^SES\s+/i, '')
      .trim()
      .toLowerCase();
    
    features.forEach(feature => {
      try {
        // Validate feature structure
        if (!feature || !feature.geometry || !feature.properties) {
          console.warn(`Invalid feature structure in ${category}:`, feature);
          return;
        }
        
        let rawName = feature.properties[meta.nameProp];
        if (!rawName) return;
        
        // Handle coordinate conversion for different projection systems
        if (feature.geometry.type === 'Point' && category !== 'ambulance') {
          const coords = feature.geometry.coordinates;
          if (coords.length >= 2 && coords[0] > 1000) {
            // Looks like MGA94/UTM coordinates, convert to lat/lng
            try {
              const latLng = this.convertMGA94ToLatLon(coords[0], coords[1]);
              feature.geometry.coordinates = [latLng.lng, latLng.lat];
            } catch (e) {
              console.warn(`Failed to convert coordinates for ${rawName}:`, e);
            }
          }
        }
        
        const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const key = cleanName.toLowerCase().replace(/\s+/g, '_');
        
        // Store SES facility coordinates for chevron display
        if (category === 'ses') {
          const normalizedName = normaliseSes(cleanName);
          if (normalizedName) {
            this.storeSesFacilityCoords(normalizedName, feature);
          }
        }
        
        processedFeatures.push({
          ...feature,
          _cleanName: cleanName,
          _key: key
        });
        
        names.push(cleanName);
        nameToKey[cleanName] = key;
        
      } catch (error) {
        console.warn(`Error processing feature in ${category}:`, feature, error);
      }
    });
    
    // Sort names alphabetically
    names.sort((a, b) => a.localeCompare(b));
    
    return {
      features: processedFeatures,
      names: names,
      nameToKey: nameToKey
    };
  }
  
  /**
   * Create map layers from processed features
   */
  createLayers(category, features) {
    const meta = configurationManager.get(`categoryMeta.${category}`);
    const layers = [];
    
    // Group features by key
    const featuresByKey = new Map();
    features.forEach(feature => {
      const key = feature._key;
      if (!featuresByKey.has(key)) {
        featuresByKey.set(key, []);
      }
      featuresByKey.get(key).push(feature);
    });
    
    // Create layers for each key
    featuresByKey.forEach((keyFeatures, key) => {
      try {
        const style = meta.styleFn ? meta.styleFn() : {};
        const layer = L.geoJSON(keyFeatures, {
          style,
          pane: category
        });
        
        if (layer) {
          layers.push(layer);
          
          // Add to layer manager
          layerManager.addLayer(category, key, layer);
        }
        
      } catch (error) {
        console.warn(`Invalid GeoJSON feature for ${category}/${key}:`, error);
      }
    });
    
    return layers;
  }
  
  /**
   * Update application state with loaded data
   */
  updateState(category, processedData, layers) {
    try {
      // Update feature layers in state
      const currentFeatureLayers = stateManager.get('featureLayers', {});
      if (!currentFeatureLayers[category]) {
        currentFeatureLayers[category] = {};
      }
      
      // Group layers by key
      const layersByKey = {};
      processedData.features.forEach(feature => {
        const key = feature._key;
        if (!layersByKey[key]) {
          layersByKey[key] = [];
        }
        layersByKey[key].push(feature);
      });
      
      currentFeatureLayers[category] = layersByKey;
      stateManager.set('featureLayers', currentFeatureLayers);
      
      // Update names by category
      const currentNamesByCategory = stateManager.get('namesByCategory', {});
      currentNamesByCategory[category] = processedData.names;
      stateManager.set('namesByCategory', currentNamesByCategory);
      
      // Update name to key mapping
      const currentNameToKey = stateManager.get('nameToKey', {});
      currentNameToKey[category] = processedData.nameToKey;
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
      
      console.log(`✅ PolygonLoader: State updated for category ${category}`);
      
    } catch (error) {
      console.error(`🚨 PolygonLoader: Failed to update state for ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Populate sidebar with category data
   */
  populateSidebar(category, processedData) {
    try {
      const meta = configurationManager.get(`categoryMeta.${category}`);
      const listEl = document.getElementById(meta.listId);
      
      if (!listEl) {
        console.warn(`PolygonLoader: Sidebar list element not found for ${category}`);
        return;
      }
      
      // Clear existing content
      listEl.innerHTML = '';
      
      // Create checkboxes for each feature
      processedData.names.forEach(displayName => {
        const key = processedData.nameToKey[displayName];
        const checked = meta.defaultOn ? meta.defaultOn(displayName) : false;
        
        // Create row container
        const row = document.createElement('div');
        row.className = 'sidebar-list-row';
        row.id = `${category}_${key}`;
        
        // Create checkbox
        const checkbox = this.createCheckbox(`${category}_${key}`, displayName, checked, (e) => {
          this.handleFeatureToggle(category, key, e.target.checked, displayName);
        });
        
        row.appendChild(checkbox);
        listEl.appendChild(row);
      });
      
      // Set up "Show All" toggle
      this.setupShowAllToggle(category, meta);
      
      console.log(`✅ PolygonLoader: Sidebar populated for category ${category}`);
      
    } catch (error) {
      console.error(`🚨 PolygonLoader: Failed to populate sidebar for ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Set up "Show All" toggle for a category
   */
  setupShowAllToggle(category, meta) {
    const toggleAllId = meta.toggleAllId;
    if (!toggleAllId) return;
    
    const toggleAll = document.getElementById(toggleAllId);
    if (!toggleAll) return;
    
    // Remove existing event listeners
    const newToggleAll = toggleAll.cloneNode(true);
    toggleAll.parentNode.replaceChild(newToggleAll, toggleAll);
    
    // Add new event listener
    newToggleAll.addEventListener('change', (e) => {
      this.handleShowAllToggle(category, e.target.checked);
    });
    
    console.log(`✅ PolygonLoader: Show All toggle configured for ${category}`);
  }
  
  /**
   * Handle individual feature toggle
   */
  handleFeatureToggle(category, key, checked, displayName) {
    try {
      if (checked) {
        // Show layer
        layerManager.showLayer(category, key);
        
        // Show name label for polygons
        const meta = configurationManager.get(`categoryMeta.${category}`);
        if (meta.type === 'polygon') {
          const labelName = this.formatDisplayName(category, displayName);
          this.ensureLabel(category, key, labelName, false);
        }
        
        // Handle special category logic
        this.handleSpecialCategoryLogic(category, key, true);
        
      } else {
        // Hide layer
        layerManager.hideLayer(category, key);
        
        // Remove label
        this.removeLabel(category, key);
        
        // Handle special category logic
        this.handleSpecialCategoryLogic(category, key, false);
      }
      
      // Update active list
      globalEventBus.emit('activeList:update');
      
    } catch (error) {
      console.error(`🚨 PolygonLoader: Failed to handle feature toggle for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Handle "Show All" toggle
   */
  handleShowAllToggle(category, checked) {
    try {
      const categoryData = this.categoryData.get(category);
      if (!categoryData) return;
      
      // Begin bulk operation
      globalEventBus.emit('bulk:begin', { category, operation: 'showAll' });
      
      try {
        categoryData.names.forEach(displayName => {
          const key = categoryData.nameToKey[displayName];
          const checkbox = document.getElementById(`${category}_${key}`);
          
          if (checkbox && checkbox.checked !== checked) {
            checkbox.checked = checked;
            this.handleFeatureToggle(category, key, checked, displayName);
          }
        });
        
      } finally {
        // End bulk operation
        globalEventBus.emit('bulk:end', { category, operation: 'showAll' });
      }
      
      console.log(`✅ PolygonLoader: Show All toggle handled for ${category}`);
      
    } catch (error) {
      console.error(`🚨 PolygonLoader: Failed to handle Show All toggle for ${category}:`, error);
    }
  }
  
  /**
   * Handle special category logic (SES chevrons, ambulance polygon plus, etc.)
   */
  handleSpecialCategoryLogic(category, key, showing) {
    try {
      if (category === 'ses' && showing) {
        this.showSesChevron(key);
      } else if (category === 'ses' && !showing) {
        this.hideSesChevron(key);
      } else if (category === 'ambulance' && showing) {
        this.addPolygonPlus(key);
      } else if (category === 'ambulance' && !showing) {
        this.removePolygonPlus(key);
      }
    } catch (error) {
      console.warn(`PolygonLoader: Special category logic failed for ${category}/${key}:`, error);
    }
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
   * Format display name based on category
   */
  formatDisplayName(category, name) {
    if (category === 'lga') {
      return this.formatLgaName(name);
    } else if (category === 'frv') {
      return this.formatFrvName(name);
    }
    return name;
  }
  
  /**
   * Utility methods (delegated to legacy functions if available)
   */
  isOffline() {
    return window.isOffline ? window.isOffline() : !navigator.onLine;
  }
  
  showLoadingError(category, error) {
    if (window.showSidebarError) {
      window.showSidebarError(`Failed to load ${category}: ${error.message}`);
    } else {
      console.error(`Loading error for ${category}:`, error);
    }
  }
  
  convertMGA94ToLatLon(x, y) {
    if (window.convertMGA94ToLatLon) {
      return window.convertMGA94ToLatLon(x, y);
    }
    // Fallback implementation or throw error
    throw new Error('MGA94 coordinate conversion not available');
  }
  
  storeSesFacilityCoords(name, feature) {
    if (window.sesFacilityCoords && feature.geometry.type === 'Point') {
      window.sesFacilityCoords[name] = {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      };
    }
  }
  
  showSesChevron(key) {
    if (window.showSesChevron) {
      const map = stateManager.get('map');
      if (map) window.showSesChevron(key, map);
    }
  }
  
  hideSesChevron(key) {
    if (window.hideSesChevron) {
      const map = stateManager.get('map');
      if (map) window.hideSesChevron(key, map);
    }
  }
  
  addPolygonPlus(key) {
    if (window.addPolygonPlus) {
      const map = stateManager.get('map');
      if (map) {
        const layer = layerManager.getLayer('ambulance', key);
        if (layer) window.addPolygonPlus(map, layer);
      }
    }
  }
  
  removePolygonPlus(key) {
    if (window.removePolygonPlus) {
      const map = stateManager.get('map');
      if (map) {
        const layer = layerManager.getLayer('ambulance', key);
        if (layer) window.removePolygonPlus(layer, map);
      }
    }
  }
  
  ensureLabel(category, key, name, isPoint, layer) {
    if (window.ensureLabel) {
      window.ensureLabel(category, key, name, isPoint, layer);
    }
  }
  
  removeLabel(category, key) {
    if (window.removeLabel) {
      window.removeLabel(category, key);
    }
  }
  
  formatLgaName(name) {
    if (window.formatLgaName) {
      return window.formatLgaName(name);
    }
    return name;
  }
  
  formatFrvName(name) {
    if (window.formatFrvName) {
      return window.formatFrvName(name);
    }
    return name;
  }
  
  /**
   * Get category data
   */
  getCategoryData(category) {
    return this.categoryData.get(category);
  }
  
  /**
   * Check if category is loaded
   */
  isCategoryLoaded(category) {
    return this.loadedCategories.has(category);
  }
  
  /**
   * Check if category is loading
   */
  isCategoryLoading(category) {
    return this.loadingCategories.has(category);
  }
  
  /**
   * Get polygon loader status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loadingCategories: Array.from(this.loadingCategories),
      loadedCategories: Array.from(this.loadedCategories),
      totalCategories: this.categoryData.size,
      categoryData: Object.fromEntries(
        Array.from(this.categoryData.entries()).map(([category, data]) => [
          category,
          {
            featureCount: data.features.length,
            layerCount: data.layers.length,
            nameCount: data.names.length
          }
        ])
      )
    };
  }
}

// Export singleton instance
export const polygonLoader = new PolygonLoader();

// Export for global access
if (typeof window !== 'undefined') {
  window.polygonLoader = polygonLoader;
  // Legacy compatibility
  window.loadPolygonCategory = (category, url) => polygonLoader.loadCategory(category, url);
}
