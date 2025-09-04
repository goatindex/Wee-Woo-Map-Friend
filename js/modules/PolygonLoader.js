/**
 * @module modules/PolygonLoader
 * Modern ES6-based polygon loading for WeeWoo Map Friend
 * Replaces the legacy loadPolygonCategory function with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';
import { logger } from './StructuredLogger.js';
import { labelManager } from './LabelManager.js';

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
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'PolygonLoader' });
    
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
    
    this.logger.info('Polygon loading system initialized');
  }
  
  /**
   * Initialize the polygon loader
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized');
      return;
    }
    
    try {
      this.logger.info('Starting polygon loader initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.logger.info('Polygon loading system ready');
      
    } catch (error) {
      this.logger.error('Failed to initialize', { error: error.message, stack: error.stack });
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
      
      // Initialize SES facility markers and coordinates
      if (!stateManager.get('sesFacilityMarkers')) {
        stateManager.set('sesFacilityMarkers', {});
      }
      if (!stateManager.get('sesFacilityCoords')) {
        stateManager.set('sesFacilityCoords', {});
      }
      
      this.logger.info(`State updated for category ${category}`);
      
    } catch (error) {
      this.logger.error(`Failed to update state for ${category}`, { 
        error: error.message, 
        stack: error.stack 
      });
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
   * Handle "Show All" toggle with optimized bulk operations
   */
  async handleShowAllToggle(category, checked) {
    try {
      const categoryData = this.categoryData.get(category);
      if (!categoryData) return;
      
      const meta = configurationManager.get(`categoryMeta.${category}`);
      const toggleAll = document.getElementById(meta.toggleAllId);
      
      // Optimistic UI: disable toggle and show loading state
      if (toggleAll) {
        toggleAll.disabled = true;
        toggleAll.title = `${checked ? 'Loading' : 'Unloading'} ${categoryData.names.length} ${category} items...`;
      }
      
      // Begin bulk operation for performance
      const bulkStarted = stateManager.beginBulkOperation('toggleAll', categoryData.names.length);
      if (!bulkStarted) {
        this.logger.warn('Bulk operation already active, proceeding without bulk optimization');
      }
      
      try {
        // Category-specific batch sizes for optimal performance
        const batchSizes = {
          'ses': 15,
          'lga': 8,
          'cfa': 12,
          'frv': 5,
          'ambulance': 20,
          'police': 20
        };
        const batchSize = batchSizes[category] || 10;
        
        for (let i = 0; i < categoryData.names.length; i += batchSize) {
          const batch = categoryData.names.slice(i, i + batchSize);
          
          // Process current batch - direct layer manipulation for performance
          batch.forEach(displayName => {
            const key = categoryData.nameToKey[displayName];
            const container = document.getElementById(`${category}_${key}`);
            let rowCb = null;
            
            if (container && container.tagName !== 'INPUT') {
              rowCb = container.querySelector('input[type="checkbox"]');
            } else {
              rowCb = container; // it's already the input
            }
            
            // Update checkbox state WITHOUT dispatching change event during bulk operation
            if (rowCb) {
              rowCb.checked = checked;
              this.logger.debug(`Updated checkbox ${category}_${key}: ${checked} (bulk operation)`);
            } else {
              this.logger.warn(`No checkbox found for ${category}_${key}`);
            }
            
            // Direct layer manipulation (bypass change event for performance)
            this.handleFeatureToggleDirect(category, key, checked, displayName);
          });
          
          // Yield control after each batch with progress feedback
          const processed = Math.min(i + batchSize, categoryData.names.length);
          if (toggleAll) {
            toggleAll.title = `${checked ? 'Loading' : 'Unloading'} ${processed}/${categoryData.names.length} ${category} items...`;
          }
          
          // Progressive yielding: smaller batches get shorter delays
          const yieldDelay = batchSize <= 8 ? 8 : 
                            batchSize <= 12 ? 12 : 16;
          
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              setTimeout(resolve, yieldDelay);
            });
          });
        }
        
      } finally {
        // End bulk operations and process deferred items
        stateManager.endBulkOperation();
        
        // Restore toggle state
        if (toggleAll) {
          toggleAll.disabled = false;
          toggleAll.title = `Toggle all ${category} items`;
        }
      }
      
      this.logger.info(`Show All toggle handled for ${category}`, { 
        checked, 
        itemCount: categoryData.names.length 
      });
      
    } catch (error) {
      this.logger.error(`Failed to handle Show All toggle for ${category}`, { 
        error: error.message, 
        stack: error.stack 
      });
    }
  }
  
  /**
   * Handle feature toggle directly (for bulk operations)
   */
  handleFeatureToggleDirect(category, key, checked, displayName) {
    try {
      const map = stateManager.get('map');
      if (!map) return;
      
      const featureLayers = stateManager.get('featureLayers', {});
      const categoryLayers = featureLayers[category]?.[key];
      
      if (!categoryLayers) return;
      
      categoryLayers.forEach(layer => {
        if (checked) {
          layer.addTo(map);
          
          // Handle special category logic
          if (category === 'ambulance') {
            this.addPolygonPlus(map, layer);
          }
          if (category === 'ses') {
            this.showSesChevron(key, map);
          }
          
          // Defer label creation during bulk operation
          if (stateManager.get('isBulkOperation')) {
            const meta = configurationManager.get(`categoryMeta.${category}`);
            if (meta.type === 'polygon') {
              const labelName = this.formatDisplayName(category, displayName);
              stateManager.addPendingLabel({
                category, 
                key, 
                labelName, 
                isPoint: false, 
                layer: layer
              });
            }
          } else {
            // Show name label for polygons
            const meta = configurationManager.get(`categoryMeta.${category}`);
            if (meta.type === 'polygon') {
              const labelName = this.formatDisplayName(category, displayName);
              this.ensureLabel(category, key, labelName, false, layer);
            }
          }
        } else {
          map.removeLayer(layer);
          
          // Handle special category logic
          if (category === 'ambulance') {
            this.removePolygonPlus(layer, map);
          }
          if (category === 'ses') {
            this.hideSesChevron(key, map);
          }
          
          // Clean up emphasis and labels
          const emphasised = stateManager.get('emphasised', {});
          if (emphasised[category]) {
            emphasised[category][key] = false;
            stateManager.set('emphasised', emphasised);
          }
          
          const nameLabelMarkers = stateManager.get('nameLabelMarkers', {});
          if (nameLabelMarkers[category]?.[key]) {
            map.removeLayer(nameLabelMarkers[category][key]);
            nameLabelMarkers[category][key] = null;
            stateManager.set('nameLabelMarkers', nameLabelMarkers);
          }
        }
      });
      
    } catch (error) {
      this.logger.warn(`Feature toggle direct failed for ${category}/${key}`, { 
        error: error.message 
      });
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
      this.logger.warn(`Special category logic failed for ${category}/${key}`, { 
        error: error.message 
      });
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
  
  /**
   * Create SES chevron icon
   */
  makeSesChevronIcon() {
    const outlineColors = configurationManager.get('outlineColors', {});
    const color = outlineColors.ses || '#FF9900';
    const size = 14; // height of triangle
    const half = 8;  // half width of base
    const html = `<div style="width:0;height:0;border-left:${half}px solid transparent;border-right:${half}px solid transparent;border-top:${size}px solid ${color};"></div>`;
    return L.divIcon({
      className: 'ses-chevron',
      html,
      iconSize: [16, 14],
      iconAnchor: [8, 14]
    });
  }

  /**
   * Show SES chevron marker
   */
  showSesChevron(key, map = null) {
    try {
      if (!map) {
        map = stateManager.get('map');
        if (!map) return;
      }
      
      // Check if marker already exists
      const sesFacilityMarkers = stateManager.get('sesFacilityMarkers', {});
      if (sesFacilityMarkers[key]) return;
      
      // Get coordinates
      const sesFacilityCoords = stateManager.get('sesFacilityCoords', {});
      const coordData = sesFacilityCoords[key.toLowerCase()];
      if (!coordData) return;
      
      // Create and add marker
      const icon = this.makeSesChevronIcon();
      const marker = L.marker([coordData.lat, coordData.lng], { 
        icon, 
        pane: 'ses' 
      }).addTo(map);
      
      // Store marker reference
      sesFacilityMarkers[key] = marker;
      stateManager.set('sesFacilityMarkers', sesFacilityMarkers);
      
      this.logger.debug(`SES chevron shown for ${key}`);
      
    } catch (error) {
      this.logger.warn(`Failed to show SES chevron for ${key}`, { 
        error: error.message 
      });
    }
  }
  
  /**
   * Hide SES chevron marker
   */
  hideSesChevron(key, map = null) {
    try {
      if (!map) {
        map = stateManager.get('map');
        if (!map) return;
      }
      
      const sesFacilityMarkers = stateManager.get('sesFacilityMarkers', {});
      const marker = sesFacilityMarkers[key];
      
      if (marker) {
        map.removeLayer(marker);
        delete sesFacilityMarkers[key];
        stateManager.set('sesFacilityMarkers', sesFacilityMarkers);
        
        this.logger.debug(`SES chevron hidden for ${key}`);
      }
      
    } catch (error) {
      this.logger.warn(`Failed to hide SES chevron for ${key}`, { 
        error: error.message 
      });
    }
  }
  
  addPolygonPlus(map, layer) {
    try {
      if (window.addPolygonPlus) {
        window.addPolygonPlus(map, layer);
        this.logger.debug('Polygon plus added');
      }
    } catch (error) {
      this.logger.warn('Failed to add polygon plus', { 
        error: error.message 
      });
    }
  }
  
  removePolygonPlus(layer, map) {
    try {
      if (window.removePolygonPlus) {
        window.removePolygonPlus(layer, map);
        this.logger.debug('Polygon plus removed');
      }
    } catch (error) {
      this.logger.warn('Failed to remove polygon plus', { 
        error: error.message 
      });
    }
  }
  
  ensureLabel(category, key, name, isPoint, layer) {
    if (labelManager) {
      labelManager.ensureLabel(category, key, name, isPoint, layer);
    }
  }
  
  removeLabel(category, key) {
    if (labelManager) {
      labelManager.removeLabel(category, key);
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
