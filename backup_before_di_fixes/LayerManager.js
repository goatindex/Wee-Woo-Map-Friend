/**
 * @module modules/LayerManager
 * Modern ES6-based layer management for WeeWoo Map Friend
 * Manages map layers, panes, and layer operations
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';

/**
 * @class LayerManager
 * Manages map layers, panes, and layer operations
 */
@injectable()
export class LayerManager {
  constructor(
    @inject(TYPES.EventBus) private eventBus,
    @inject(TYPES.StateManager) private stateManager,
    @inject(TYPES.ConfigurationManager) private configurationManager
  ) {
    this.initialized = false;
    this.layers = new Map(); // category -> Map<key, Layer[]>
    this.panes = new Map(); // paneName -> L.Pane
    this.layerGroups = new Map(); // category -> L.LayerGroup
    
    // Layer configuration
    this.paneConfig = [
      ['lga', 400],
      ['cfa', 410],
      ['ses', 420],
      ['ambulance', 430],
      ['police', 440],
      ['frv', 450]
    ];
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupPanes = this.setupPanes.bind(this);
    this.addLayer = this.addLayer.bind(this);
    this.removeLayer = this.removeLayer.bind(this);
    this.showLayer = this.showLayer.bind(this);
    this.hideLayer = this.hideLayer.bind(this);
    this.getLayer = this.getLayer.bind(this);
    this.getLayersByCategory = this.getLayersByCategory.bind(this);
    this.clearCategory = this.clearCategory.bind(this);
    this.updateLayerStyle = this.updateLayerStyle.bind(this);
    this.isReady = this.isReady.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('🔲 LayerManager: Layer management system initialized');
  }
  
  /**
   * Initialize the layer manager
   */
  async init() {
    if (this.initialized) {
      console.warn('LayerManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 LayerManager: Starting layer manager initialization...');
      
      // Wait for map to be ready
      await this.waitForMap();
      
      // Set up map panes
      this.setupPanes();
      
      // Initialize layer storage
      this.initializeLayerStorage();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ LayerManager: Layer management system ready');
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Wait for map to be ready
   */
  async waitForMap() {
    const map = this.stateManager.get('map');
    if (map) {
      console.log('✅ LayerManager: Map already available');
      return;
    }
    
    console.log('⏳ LayerManager: Waiting for map...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for map'));
      }, 10000); // 10 second timeout
      
      const checkMap = () => {
        const map = this.stateManager.get('map');
        if (map) {
          clearTimeout(timeout);
          console.log('✅ LayerManager: Map ready');
          resolve();
        } else {
          setTimeout(checkMap, 100);
        }
      };
      
      checkMap();
    });
  }
  
  /**
   * Set up map panes for layer ordering
   */
  setupPanes() {
    try {
      const map = this.stateManager.get('map');
      if (!map) {
        throw new Error('Map not available for pane setup');
      }
      
      this.paneConfig.forEach(([name, z]) => {
        const pane = map.createPane(name);
        pane.style.zIndex = String(z);
        this.panes.set(name, pane);
      });
      
      console.log('✅ LayerManager: Map panes created');
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to setup panes:', error);
      throw error;
    }
  }
  
  /**
   * Initialize layer storage structure
   */
  initializeLayerStorage() {
    const categories = ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv'];
    
    categories.forEach(category => {
      this.layers.set(category, new Map());
      this.layerGroups.set(category, L.layerGroup());
    });
    
    console.log('✅ LayerManager: Layer storage initialized');
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for map ready events
    this.eventBus.on('map:ready', () => {
      console.log('🔄 LayerManager: Map ready, updating layer references');
      this.updateLayerReferences();
    });
    
    // Listen for state changes
    this.eventBus.on('stateChange', ({ property, value }) => {
      if (property === 'map') {
        this.updateLayerReferences();
      }
    });
    
    console.log('✅ LayerManager: Event listeners configured');
  }
  
  /**
   * Update layer references when map changes
   */
  updateLayerReferences() {
    const map = this.stateManager.get('map');
    if (!map) return;
    
    // Update layer groups with new map reference
    this.layerGroups.forEach((group, category) => {
      if (group.getLayers().length > 0) {
        group.addTo(map);
      }
    });
    
    console.log('🔄 LayerManager: Layer references updated');
  }
  
  /**
   * Add a layer to the manager
   */
  addLayer(category, key, layer) {
    try {
      if (!this.layers.has(category)) {
        this.layers.set(category, new Map());
      }
      
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers.has(key)) {
        categoryLayers.set(key, []);
      }
      
      categoryLayers.get(key).push(layer);
      
      // Add to layer group
      const layerGroup = this.layerGroups.get(category);
      if (layerGroup) {
        layerGroup.addLayer(layer);
      }
      
      // Emit layer added event
      this.eventBus.emit('layer:added', { category, key, layer });
      
      console.log(`✅ LayerManager: Layer added for ${category}/${key}`);
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to add layer:', error);
      throw error;
    }
  }
  
  /**
   * Remove a layer from the manager
   */
  removeLayer(category, key, layer) {
    try {
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers) return;
      
      const keyLayers = categoryLayers.get(key);
      if (!keyLayers) return;
      
      // Remove specific layer
      const index = keyLayers.indexOf(layer);
      if (index > -1) {
        keyLayers.splice(index, 1);
        
        // Remove from map
        const map = this.stateManager.get('map');
        if (map && layer) {
          map.removeLayer(layer);
        }
        
        // Remove from layer group
        const layerGroup = this.layerGroups.get(category);
        if (layerGroup) {
          layerGroup.removeLayer(layer);
        }
        
        // Emit layer removed event
        this.eventBus.emit('layer:removed', { category, key, layer });
        
        console.log(`✅ LayerManager: Layer removed for ${category}/${key}`);
      }
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to remove layer:', error);
      throw error;
    }
  }
  
  /**
   * Show all layers for a category/key
   */
  showLayer(category, key) {
    try {
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers) return;
      
      const keyLayers = categoryLayers.get(key);
      if (!keyLayers) return;
      
      const map = this.stateManager.get('map');
      if (!map) return;
      
      keyLayers.forEach(layer => {
        if (layer && !map.hasLayer(layer)) {
          layer.addTo(map);
        }
      });
      
      // Emit layer shown event
      this.eventBus.emit('layer:shown', { category, key, layers: keyLayers });
      
      console.log(`✅ LayerManager: Layers shown for ${category}/${key}`);
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to show layers:', error);
      throw error;
    }
  }
  
  /**
   * Hide all layers for a category/key
   */
  hideLayer(category, key) {
    try {
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers) return;
      
      const keyLayers = categoryLayers.get(key);
      if (!keyLayers) return;
      
      const map = this.stateManager.get('map');
      if (!map) return;
      
      keyLayers.forEach(layer => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      
      // Emit layer hidden event
      this.eventBus.emit('layer:hidden', { category, key, layers: keyLayers });
      
      console.log(`✅ LayerManager: Layers hidden for ${category}/${key}`);
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to hide layers:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific layer
   */
  getLayer(category, key, index = 0) {
    const categoryLayers = this.layers.get(category);
    if (!categoryLayers) return null;
    
    const keyLayers = categoryLayers.get(key);
    if (!keyLayers || !keyLayers[index]) return null;
    
    return keyLayers[index];
  }
  
  /**
   * Get all layers for a category
   */
  getLayersByCategory(category) {
    const categoryLayers = this.layers.get(category);
    if (!categoryLayers) return [];
    
    const allLayers = [];
    categoryLayers.forEach((keyLayers, key) => {
      allLayers.push(...keyLayers);
    });
    
    return allLayers;
  }
  
  /**
   * Clear all layers for a category
   */
  clearCategory(category) {
    try {
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers) return;
      
      const map = this.stateManager.get('map');
      
      categoryLayers.forEach((keyLayers, key) => {
        keyLayers.forEach(layer => {
          if (map && layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
      });
      
      // Clear storage
      categoryLayers.clear();
      
      // Clear layer group
      const layerGroup = this.layerGroups.get(category);
      if (layerGroup) {
        layerGroup.clearLayers();
      }
      
      // Emit category cleared event
      this.eventBus.emit('layer:categoryCleared', { category });
      
      console.log(`✅ LayerManager: Category ${category} cleared`);
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to clear category:', error);
      throw error;
    }
  }
  
  /**
   * Update layer style for a category/key
   */
  updateLayerStyle(category, key, style) {
    try {
      const categoryLayers = this.layers.get(category);
      if (!categoryLayers) return;
      
      const keyLayers = categoryLayers.get(key);
      if (!keyLayers) return;
      
      keyLayers.forEach(layer => {
        if (layer && layer.setStyle) {
          layer.setStyle(style);
        }
      });
      
      // Emit style updated event
      this.eventBus.emit('layer:styleUpdated', { category, key, style });
      
      console.log(`✅ LayerManager: Style updated for ${category}/${key}`);
      
    } catch (error) {
      console.error('🚨 LayerManager: Failed to update layer style:', error);
      throw error;
    }
  }
  
  /**
   * Check if layer manager is ready
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Get layer manager status
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      panes: this.panes.size,
      categories: this.layers.size,
      totalLayers: 0,
      layerGroups: this.layerGroups.size
    };
    
    // Count total layers
    this.layers.forEach((categoryLayers, category) => {
      categoryLayers.forEach((keyLayers, key) => {
        status.totalLayers += keyLayers.length;
      });
    });
    
    return status;
  }
}

// Export singleton instance
// Legacy compatibility functions - use DI container instead
export const layerManager = {
  init: () => { console.warn('layerManager.init: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  setupPanes: () => { console.warn('layerManager.setupPanes: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  addLayer: () => { console.warn('layerManager.addLayer: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  removeLayer: () => { console.warn('layerManager.removeLayer: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  showLayer: () => { console.warn('layerManager.showLayer: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  hideLayer: () => { console.warn('layerManager.hideLayer: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  getLayer: () => { console.warn('layerManager.getLayer: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  getLayersByCategory: () => { console.warn('layerManager.getLayersByCategory: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  clearCategory: () => { console.warn('layerManager.clearCategory: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  updateLayerStyle: () => { console.warn('layerManager.updateLayerStyle: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  isReady: () => { console.warn('layerManager.isReady: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); },
  getStatus: () => { console.warn('layerManager.getStatus: Legacy function called. Use DI container to get LayerManager instance.'); throw new Error('Legacy function not available. Use DI container to get LayerManager instance.'); }
};

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
