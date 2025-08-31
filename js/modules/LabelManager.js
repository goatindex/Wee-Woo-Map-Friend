/**
 * @module modules/LabelManager
 * Modern ES6-based label management for WeeWoo Map Friend
 * Manages map labels for features and provides label visibility controls
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { layerManager } from './LayerManager.js';

/**
 * @class LabelManager
 * Manages map labels for features
 */
export class LabelManager {
  constructor() {
    this.initialized = false;
    this.labels = new Map(); // category -> Map<key, L.Marker>
    this.labelSettings = new Map(); // category -> Map<key, { visible: boolean, text: string }>
    
    // Bind methods
    this.init = this.init.bind(this);
    this.ensureLabel = this.ensureLabel.bind(this);
    this.removeLabel = this.removeLabel.bind(this);
    this.showLabel = this.showLabel.bind(this);
    this.hideLabel = this.hideLabel.bind(this);
    this.updateLabel = this.updateLabel.bind(this);
    this.getLabel = this.getLabel.bind(this);
    this.isLabelVisible = this.isLabelVisible.bind(this);
    this.clearCategoryLabels = this.clearCategoryLabels.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('🏷️ LabelManager: Label management system initialized');
  }
  
  /**
   * Initialize the label manager
   */
  async init() {
    if (this.initialized) {
      console.warn('LabelManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 LabelManager: Starting label manager initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ LabelManager: Label management system ready');
      
    } catch (error) {
      console.error('🚨 LabelManager: Failed to initialize:', error);
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
        console.log(`⏳ LabelManager: Waiting for ${dep.name}...`);
        await this.waitForDependency(dep.check, dep.name);
      }
    }
    
    console.log('✅ LabelManager: All dependencies ready');
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
          console.log(`✅ LabelManager: ${name} ready`);
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
    // Listen for layer events
    globalEventBus.on('layer:added', ({ category, key, layer }) => {
      console.log(`🔄 LabelManager: Layer added for ${category}/${key}`);
    });
    
    globalEventBus.on('layer:removed', ({ category, key, layer }) => {
      // Remove label when layer is removed
      this.removeLabel(category, key);
    });
    
    // Listen for bulk operations
    globalEventBus.on('bulk:begin', () => {
      console.log('🔄 LabelManager: Bulk operation started, deferring label updates');
    });
    
    globalEventBus.on('bulk:end', () => {
      console.log('🔄 LabelManager: Bulk operation ended, processing deferred labels');
      this.processDeferredLabels();
    });
    
    // Listen for state changes
    globalEventBus.on('stateChange', ({ property, value }) => {
      if (property.startsWith('nameLabelMarkers')) {
        console.log('🔄 LabelManager: Label markers state changed');
      }
    });
    
    console.log('✅ LabelManager: Event listeners configured');
  }
  
  /**
   * Ensure a label exists for a feature
   */
  ensureLabel(category, key, name, isPoint, layerOrMarker) {
    try {
      if (!this.initialized) {
        console.warn('LabelManager: Not initialized, deferring label creation');
        this.deferLabelCreation(category, key, name, isPoint, layerOrMarker);
        return;
      }
      
      // Check if label already exists
      if (this.labels.has(category) && this.labels.get(category).has(key)) {
        console.log(`LabelManager: Label already exists for ${category}/${key}`);
        return;
      }
      
      // Create label
      const label = this.createLabel(category, key, name, isPoint, layerOrMarker);
      if (!label) {
        console.warn(`LabelManager: Failed to create label for ${category}/${key}`);
        return;
      }
      
      // Store label
      if (!this.labels.has(category)) {
        this.labels.set(category, new Map());
      }
      this.labels.get(category).set(key, label);
      
      // Store label settings
      if (!this.labelSettings.has(category)) {
        this.labelSettings.set(category, new Map());
      }
      this.labelSettings.get(category).set(key, {
        visible: true,
        text: name
      });
      
      // Add to map
      const map = stateManager.get('map');
      if (map) {
        label.addTo(map);
      }
      
      // Update state manager
      this.updateLabelState(category, key, label);
      
      // Emit label created event
      globalEventBus.emit('label:created', { category, key, label, name });
      
      console.log(`✅ LabelManager: Label created for ${category}/${key}`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to ensure label for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Create a label marker
   */
  createLabel(category, key, name, isPoint, layerOrMarker) {
    try {
      let position;
      
      if (isPoint) {
        // For point features, use the marker position
        if (layerOrMarker && layerOrMarker.getLatLng) {
          position = layerOrMarker.getLatLng();
        } else {
          console.warn(`LabelManager: Cannot get position for point feature ${category}/${key}`);
          return null;
        }
      } else {
        // For polygon features, calculate centroid
        if (layerOrMarker && layerOrMarker.getBounds) {
          position = layerOrMarker.getBounds().getCenter();
        } else if (Array.isArray(layerOrMarker) && layerOrMarker[0] && layerOrMarker[0].getBounds) {
          position = layerOrMarker[0].getBounds().getCenter();
        } else {
          console.warn(`LabelManager: Cannot get position for polygon feature ${category}/${key}`);
          return null;
        }
      }
      
      // Create label marker
      const label = L.marker(position, {
        icon: this.createLabelIcon(name, category),
        pane: 'labels',
        interactive: false
      });
      
      return label;
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to create label for ${category}/${key}:`, error);
      return null;
    }
  }
  
  /**
   * Create label icon
   */
  createLabelIcon(text, category) {
    try {
      // Get category styling
      const outlineColors = configurationManager.get('outlineColors', {});
      const labelColorAdjust = configurationManager.get('labelColorAdjust', {});
      
      const baseColor = outlineColors[category] || '#000000';
      const factor = labelColorAdjust[category] ?? 1.0;
      
      // Adjust color if utility function available
      let color = baseColor;
      if (window.adjustHexColor) {
        color = window.adjustHexColor(baseColor, factor);
      }
      
      // Create label HTML
      const html = `
        <div style="
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid ${color};
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: bold;
          color: ${color};
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        ">
          ${text}
        </div>
      `;
      
      return L.divIcon({
        html: html,
        className: 'feature-label',
        iconSize: [text.length * 8 + 20, 24],
        iconAnchor: [(text.length * 8 + 20) / 2, 12]
      });
      
    } catch (error) {
      console.error('🚨 LabelManager: Failed to create label icon:', error);
      
      // Fallback to simple text icon
      return L.divIcon({
        html: `<div style="background: white; padding: 2px 6px; border: 1px solid black;">${text}</div>`,
        className: 'feature-label-fallback',
        iconSize: [text.length * 8 + 20, 24],
        iconAnchor: [(text.length * 8 + 20) / 2, 12]
      });
    }
  }
  
  /**
   * Remove a label
   */
  removeLabel(category, key) {
    try {
      const categoryLabels = this.labels.get(category);
      if (!categoryLabels) return;
      
      const label = categoryLabels.get(key);
      if (!label) return;
      
      // Remove from map
      const map = stateManager.get('map');
      if (map && map.hasLayer(label)) {
        map.removeLayer(label);
      }
      
      // Remove from storage
      categoryLabels.delete(key);
      
      // Remove settings
      const categorySettings = this.labelSettings.get(category);
      if (categorySettings) {
        categorySettings.delete(key);
      }
      
      // Update state manager
      this.removeLabelState(category, key);
      
      // Emit label removed event
      globalEventBus.emit('label:removed', { category, key });
      
      console.log(`✅ LabelManager: Label removed for ${category}/${key}`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to remove label for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Show a label
   */
  showLabel(category, key) {
    try {
      const label = this.getLabel(category, key);
      if (!label) return;
      
      const map = stateManager.get('map');
      if (map && !map.hasLayer(label)) {
        label.addTo(map);
      }
      
      // Update settings
      const categorySettings = this.labelSettings.get(category);
      if (categorySettings && categorySettings.has(key)) {
        categorySettings.get(key).visible = true;
      }
      
      // Emit label shown event
      globalEventBus.emit('label:shown', { category, key });
      
      console.log(`✅ LabelManager: Label shown for ${category}/${key}`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to show label for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Hide a label
   */
  hideLabel(category, key) {
    try {
      const label = this.getLabel(category, key);
      if (!label) return;
      
      const map = stateManager.get('map');
      if (map && map.hasLayer(label)) {
        map.removeLayer(label);
      }
      
      // Update settings
      const categorySettings = this.labelSettings.get(category);
      if (categorySettings && categorySettings.has(key)) {
        categorySettings.get(key).visible = false;
      }
      
      // Emit label hidden event
      globalEventBus.emit('label:hidden', { category, key });
      
      console.log(`✅ LabelManager: Label hidden for ${category}/${key}`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to hide label for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Update label text or styling
   */
  updateLabel(category, key, newText) {
    try {
      const label = this.getLabel(category, key);
      if (!label) return;
      
      // Update icon with new text
      const newIcon = this.createLabelIcon(newText, category);
      label.setIcon(newIcon);
      
      // Update settings
      const categorySettings = this.labelSettings.get(category);
      if (categorySettings && categorySettings.has(key)) {
        categorySettings.get(key).text = newText;
      }
      
      // Emit label updated event
      globalEventBus.emit('label:updated', { category, key, newText });
      
      console.log(`✅ LabelManager: Label updated for ${category}/${key}`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to update label for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Get a label
   */
  getLabel(category, key) {
    const categoryLabels = this.labels.get(category);
    if (!categoryLabels) return null;
    
    return categoryLabels.get(key) || null;
  }
  
  /**
   * Check if a label is visible
   */
  isLabelVisible(category, key) {
    const categorySettings = this.labelSettings.get(category);
    if (!categorySettings) return false;
    
    const settings = categorySettings.get(key);
    return settings ? settings.visible : false;
  }
  
  /**
   * Clear all labels for a category
   */
  clearCategoryLabels(category) {
    try {
      const categoryLabels = this.labels.get(category);
      if (!categoryLabels) return;
      
      const map = stateManager.get('map');
      
      categoryLabels.forEach((label, key) => {
        if (map && map.hasLayer(label)) {
          map.removeLayer(label);
        }
      });
      
      // Clear storage
      categoryLabels.clear();
      
      // Clear settings
      const categorySettings = this.labelSettings.get(category);
      if (categorySettings) {
        categorySettings.clear();
      }
      
      // Emit category cleared event
      globalEventBus.emit('label:categoryCleared', { category });
      
      console.log(`✅ LabelManager: Category ${category} labels cleared`);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to clear category ${category} labels:`, error);
    }
  }
  
  /**
   * Defer label creation until manager is ready
   */
  deferLabelCreation(category, key, name, isPoint, layerOrMarker) {
    // Store deferred label creation request
    if (!this.deferredLabels) {
      this.deferredLabels = [];
    }
    
    this.deferredLabels.push({
      category,
      key,
      name,
      isPoint,
      layerOrMarker
    });
    
    console.log(`⏳ LabelManager: Label creation deferred for ${category}/${key}`);
  }
  
  /**
   * Process deferred label creation requests
   */
  processDeferredLabels() {
    if (!this.deferredLabels || this.deferredLabels.length === 0) return;
    
    console.log(`🔄 LabelManager: Processing ${this.deferredLabels.length} deferred labels`);
    
    const labelsToProcess = [...this.deferredLabels];
    this.deferredLabels = [];
    
    labelsToProcess.forEach(({ category, key, name, isPoint, layerOrMarker }) => {
      this.ensureLabel(category, key, name, isPoint, layerOrMarker);
    });
  }
  
  /**
   * Update label state in state manager
   */
  updateLabelState(category, key, label) {
    try {
      const currentNameLabelMarkers = stateManager.get('nameLabelMarkers', {});
      if (!currentNameLabelMarkers[category]) {
        currentNameLabelMarkers[category] = {};
      }
      
      currentNameLabelMarkers[category][key] = label;
      stateManager.set('nameLabelMarkers', currentNameLabelMarkers);
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to update label state for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Remove label state from state manager
   */
  removeLabelState(category, key) {
    try {
      const currentNameLabelMarkers = stateManager.get('nameLabelMarkers', {});
      if (currentNameLabelMarkers[category] && currentNameLabelMarkers[category][key]) {
        delete currentNameLabelMarkers[category][key];
        stateManager.set('nameLabelMarkers', currentNameLabelMarkers);
      }
      
    } catch (error) {
      console.error(`🚨 LabelManager: Failed to remove label state for ${category}/${key}:`, error);
    }
  }
  
  /**
   * Get label manager status
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      totalLabels: 0,
      visibleLabels: 0,
      categories: this.labels.size,
      deferredLabels: this.deferredLabels ? this.deferredLabels.length : 0
    };
    
    // Count total and visible labels
    this.labels.forEach((categoryLabels, category) => {
      status.totalLabels += categoryLabels.size;
      
      categoryLabels.forEach((label, key) => {
        if (this.isLabelVisible(category, key)) {
          status.visibleLabels++;
        }
      });
    });
    
    return status;
  }
}

// Export singleton instance
export const labelManager = new LabelManager();

// Export for global access
if (typeof window !== 'undefined') {
  window.labelManager = labelManager;
  // Legacy compatibility
  window.ensureLabel = (category, key, name, isPoint, layerOrMarker) => 
    labelManager.ensureLabel(category, key, name, isPoint, layerOrMarker);
  window.removeLabel = (category, key) => 
    labelManager.removeLabel(category, key);
}
