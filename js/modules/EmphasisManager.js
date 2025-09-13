/**
 * @module EmphasisManager
 * Toggle emphasis state for polygons and point markers.
 * Migrated from js/emphasise.js
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';

/**
 * EmphasisManager - Handles emphasis visual state for map features
 */
@injectable()
export class EmphasisManager extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger,
    @inject(TYPES.StateManager) stateManager
  ) {
    super(structuredLogger);
    this.stateManager = stateManager;
    this.logger.info('EmphasisManager initialized');
  }

  /**
   * Initialize the EmphasisManager
   * @param {Object} dependencies - Dependencies object
   */
  async init(dependencies) {
    const timer = this.logger.time('init-emphasis-manager');
    
    try {
      this.logger.info('Initializing EmphasisManager...');
      
      // Initialize any required state or setup
      // (Currently no specific initialization needed, but this provides consistency)
      
      timer.end({ success: true });
      
      this.logger.info('EmphasisManager initialization complete');
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to initialize EmphasisManager', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Set emphasis visual state for a given category/key.
   * Polygons: adjust fillOpacity; Points: toggle CSS class.
   * @param {'ses'|'lga'|'cfa'|'ambulance'} category
   * @param {string} key
   * @param {boolean} on
   * @param {boolean} [isPoint]
   * @param {Object} dependencies - Dependencies object with state and config
   */
  setEmphasis(category, key, on, isPoint, dependencies) {
    const timer = this.logger.time('set-emphasis');
    
    try {
      const { state, config } = dependencies;
      
      if (!state.emphasised) {
        state.emphasised = {};
      }
      if (!state.emphasised[category]) {
        state.emphasised[category] = {};
      }
      
      state.emphasised[category][key] = on;
      
      if (isPoint) {
        this.setPointEmphasis(category, key, on, dependencies);
      } else {
        this.setPolygonEmphasis(category, key, on, dependencies);
      }
      
      timer.end({ 
        category, 
        key, 
        on, 
        isPoint,
        success: true 
      });
      
      this.logger.debug('Emphasis set', { category, key, on, isPoint });
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to set emphasis', {
        error: error.message,
        stack: error.stack,
        category,
        key,
        on,
        isPoint
      });
    }
  }

  /**
   * Set emphasis for point markers using CSS classes
   * @param {string} category
   * @param {string} key
   * @param {boolean} on
   * @param {Object} dependencies
   */
  setPointEmphasis(category, key, on, dependencies) {
    const { state } = dependencies;
    
    if (!state.featureLayers || !state.featureLayers[category]) {
      this.logger.warn('Feature layers not available for point emphasis', { category, key });
      return;
    }
    
    const marker = state.featureLayers[category][key];
    if (marker && marker.getElement) {
      const element = marker.getElement();
      if (element) {
        const cls = `${category}-emph`;
        element.classList.toggle(cls, !!on);
        
        this.logger.debug('Point emphasis applied', { category, key, on, className: cls });
      } else {
        this.logger.warn('Marker element not available', { category, key });
      }
    } else {
      this.logger.warn('Marker not found for point emphasis', { category, key });
    }
  }

  /**
   * Set emphasis for polygon layers using fill opacity
   * @param {string} category
   * @param {string} key
   * @param {boolean} on
   * @param {Object} dependencies
   */
  setPolygonEmphasis(category, key, on, dependencies) {
    const { state, config } = dependencies;
    
    if (!state.featureLayers || !state.featureLayers[category]) {
      this.logger.warn('Feature layers not available for polygon emphasis', { category, key });
      return;
    }
    
    const layers = state.featureLayers[category][key];
    if (layers && Array.isArray(layers)) {
      layers.forEach((layer, index) => {
        if (layer && layer.setStyle) {
          try {
            // Get current style
            const orig = layer.options;
            let base = orig && typeof orig.fillOpacity === 'number' ? orig.fillOpacity : 0.2;
            
            // If not emphasised, revert to base opacity from config
            if (!on) {
              // Get base opacity from config using ConfigurationManager
              const configurationManager = this.stateManager.get('configurationManager');
              if (configurationManager) {
                const styleFn = configurationManager.getStyle(category);
                if (styleFn) {
                  const styleResult = styleFn();
                  base = styleResult.fillOpacity ?? base;
                }
              }
              layer.setStyle({ fillOpacity: base });
            } else {
              // Emphasised: add 0.15
              layer.setStyle({ fillOpacity: Math.min(base + 0.15, 1) });
            }
            
            this.logger.debug('Polygon emphasis applied', { 
              category, 
              key, 
              on, 
              layerIndex: index,
              finalOpacity: on ? Math.min(base + 0.15, 1) : base
            });
            
          } catch (error) {
            this.logger.error('Failed to apply polygon emphasis', {
              error: error.message,
              category,
              key,
              layerIndex: index
            });
          }
        } else {
          this.logger.warn('Layer does not support setStyle', { category, key, layerIndex: index });
        }
      });
    } else {
      this.logger.warn('Layers not found or not an array for polygon emphasis', { category, key });
    }
  }

  /**
   * Get emphasis state for a category/key
   * @param {string} category
   * @param {string} key
   * @param {Object} dependencies
   * @returns {boolean}
   */
  getEmphasis(category, key, dependencies) {
    const { state } = dependencies;
    
    if (!state.emphasised || !state.emphasised[category]) {
      return false;
    }
    
    return !!state.emphasised[category][key];
  }

  /**
   * Toggle emphasis state for a category/key
   * @param {string} category
   * @param {string} key
   * @param {boolean} [isPoint]
   * @param {Object} dependencies
   * @returns {boolean} New emphasis state
   */
  toggleEmphasis(category, key, isPoint, dependencies) {
    const currentState = this.getEmphasis(category, key, dependencies);
    const newState = !currentState;
    
    this.setEmphasis(category, key, newState, isPoint, dependencies);
    
    return newState;
  }

  /**
   * Clear all emphasis for a category
   * @param {string} category
   * @param {Object} dependencies
   */
  clearCategoryEmphasis(category, dependencies) {
    const timer = this.logger.time('clear-category-emphasis');
    
    try {
      const { state } = dependencies;
      
      if (!state.emphasised || !state.emphasised[category]) {
        timer.end({ category, reason: 'no-emphasis', success: true });
        return;
      }
      
      const keys = Object.keys(state.emphasised[category]);
      let clearedCount = 0;
      
      for (const key of keys) {
        if (state.emphasised[category][key]) {
          // Determine if this is a point or polygon based on feature layers
          const isPoint = this.isPointFeature(category, key, dependencies);
          this.setEmphasis(category, key, false, isPoint, dependencies);
          clearedCount++;
        }
      }
      
      timer.end({ category, clearedCount, success: true });
      
      this.logger.info('Category emphasis cleared', { category, clearedCount });
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to clear category emphasis', {
        error: error.message,
        category
      });
    }
  }

  /**
   * Clear all emphasis across all categories
   * @param {Object} dependencies
   */
  clearAllEmphasis(dependencies) {
    const timer = this.logger.time('clear-all-emphasis');
    
    try {
      const { state } = dependencies;
      
      if (!state.emphasised) {
        timer.end({ reason: 'no-emphasis', success: true });
        return;
      }
      
      const categories = Object.keys(state.emphasised);
      let totalCleared = 0;
      
      for (const category of categories) {
        const beforeCount = Object.keys(state.emphasised[category]).length;
        this.clearCategoryEmphasis(category, dependencies);
        totalCleared += beforeCount;
      }
      
      timer.end({ totalCleared, categories: categories.length, success: true });
      
      this.logger.info('All emphasis cleared', { totalCleared, categories: categories.length });
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to clear all emphasis', {
        error: error.message
      });
    }
  }

  /**
   * Check if a feature is a point feature
   * @param {string} category
   * @param {string} key
   * @param {Object} dependencies
   * @returns {boolean}
   */
  isPointFeature(category, key, dependencies) {
    const { state } = dependencies;
    
    if (!state.featureLayers || !state.featureLayers[category]) {
      return false;
    }
    
    const feature = state.featureLayers[category][key];
    
    // If it's an array, it's likely a polygon (multiple layers)
    if (Array.isArray(feature)) {
      return false;
    }
    
    // If it has getElement method, it's likely a marker (point)
    if (feature && typeof feature.getElement === 'function') {
      return true;
    }
    
    // Default to false (polygon)
    return false;
  }

  /**
   * Get emphasis statistics
   * @param {Object} dependencies
   * @returns {Object}
   */
  getEmphasisStats(dependencies) {
    const { state } = dependencies;
    
    if (!state.emphasised) {
      return { total: 0, byCategory: {} };
    }
    
    const stats = { total: 0, byCategory: {} };
    
    for (const category in state.emphasised) {
      const categoryStats = { total: 0, emphasised: 0 };
      
      for (const key in state.emphasised[category]) {
        categoryStats.total++;
        if (state.emphasised[category][key]) {
          categoryStats.emphasised++;
        }
      }
      
      stats.byCategory[category] = categoryStats;
      stats.total += categoryStats.total;
    }
    
    return stats;
  }

  /**
   * Clean up emphasis manager
   * @param {Object} dependencies
   */
  destroy(dependencies) {
    const timer = this.logger.time('destroy-emphasis-manager');
    
    try {
      this.clearAllEmphasis(dependencies);
      
      timer.end({ success: true });
      
      this.logger.info('EmphasisManager destroyed');
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to destroy EmphasisManager', {
        error: error.message
      });
    }
  }
}

// Create singleton instance
export const emphasisManager = () => {
  console.warn('emphasisManager: Legacy function called. Use DI container to get EmphasisManager instance.');
  throw new Error('Legacy function not available. Use DI container to get EmphasisManager instance.');
};

// Legacy compatibility exports
export const setEmphasis = (category, key, on, isPoint, dependencies) => 
  emphasisManager.setEmphasis(category, key, on, isPoint, dependencies);

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details

