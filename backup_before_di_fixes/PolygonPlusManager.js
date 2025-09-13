/**
 * @fileoverview Polygon plus marker management for Leaflet maps
 * @module PolygonPlusManager
 */

// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * Manages polygon plus markers on Leaflet maps
 * Provides functionality to add and remove plus markers at polygon centroids
 */
export class PolygonPlusManager {
  constructor() {
    // Logger will be set by BaseService constructor
    this.activeMarkers = new Map(); // Track active markers for cleanup
    this.defaultConfig = {
      size: 32,
      thickness: 8,
      color: '#fff',
      borderRadius: 3,
      className: 'polygon-plus-icon'
    };
    
    this.logger.info('PolygonPlusManager initialized');
  }

  /**
   * Add a non-interactive plus marker at the polygon's bounds center
   * @param {import('leaflet').Map} map - Leaflet map instance
   * @param {import('leaflet').Polygon|import('leaflet').Polyline} polygonLayer - Polygon layer
   * @param {Object} options - Marker options
   * @param {number} options.size - Marker size in pixels
   * @param {number} options.thickness - Plus sign thickness
   * @param {string} options.color - Plus sign color
   * @param {string} options.className - CSS class name
   * @returns {import('leaflet').Marker|null} Created marker or null if failed
   */
  addPolygonPlus(map, polygonLayer, options = {}) {
    const timer = this.logger.time('add-polygon-plus');
    
    try {
      if (!polygonLayer || !polygonLayer.getBounds) {
        this.logger.warn('Invalid polygon layer provided', {
          hasPolygonLayer: !!polygonLayer,
          hasGetBounds: !!(polygonLayer && polygonLayer.getBounds)
        });
        return null;
      }

      if (!map || !map.addLayer) {
        this.logger.warn('Invalid map instance provided', {
          hasMap: !!map,
          hasAddLayer: !!(map && map.addLayer)
        });
        return null;
      }

      const config = { ...this.defaultConfig, ...options };
      const center = polygonLayer.getBounds().getCenter();
      
      // Create SVG for the plus sign
      const svg = this.createPlusSVG(config);
      
      // Create Leaflet icon
      const icon = L.divIcon({
        className: config.className,
        html: svg,
        iconSize: [config.size, config.size],
        iconAnchor: [config.size / 2, config.size / 2],
      });
      
      // Create and add marker
      const marker = L.marker(center, { 
        icon, 
        interactive: false 
      }).addTo(map);
      
      // Attach marker to layer for later removal
      polygonLayer._plusMarker = marker;
      
      // Track the marker
      const markerId = this.generateMarkerId(polygonLayer);
      this.activeMarkers.set(markerId, {
        marker,
        polygonLayer,
        map,
        config
      });
      
      timer.end({ 
        center: { lat: center.lat, lng: center.lng },
        config,
        success: true 
      });
      
      this.logger.info('Polygon plus marker added', {
        center: { lat: center.lat, lng: center.lng },
        config,
        markerId
      });
      
      return marker;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to add polygon plus marker', {
        error: error.message,
        stack: error.stack
      });
      
      return null;
    }
  }

  /**
   * Remove a previously added plus marker associated with the polygon layer
   * @param {import('leaflet').Polygon|import('leaflet').Polyline} polygonLayer - Polygon layer
   * @param {import('leaflet').Map} map - Leaflet map instance
   * @returns {boolean} True if marker was removed successfully
   */
  removePolygonPlus(polygonLayer, map) {
    const timer = this.logger.time('remove-polygon-plus');
    
    try {
      if (!polygonLayer) {
        this.logger.warn('No polygon layer provided for marker removal');
        return false;
      }

      const markerId = this.generateMarkerId(polygonLayer);
      const markerInfo = this.activeMarkers.get(markerId);
      
      if (markerInfo && markerInfo.marker) {
        // Remove from map
        if (map && map.removeLayer) {
          map.removeLayer(markerInfo.marker);
        }
        
        // Clean up references
        polygonLayer._plusMarker = null;
        this.activeMarkers.delete(markerId);
        
        timer.end({ 
          markerId,
          success: true 
        });
        
        this.logger.info('Polygon plus marker removed', {
          markerId
        });
        
        return true;
      } else if (polygonLayer._plusMarker) {
        // Fallback: remove using legacy method
        if (map && map.removeLayer) {
          map.removeLayer(polygonLayer._plusMarker);
        }
        polygonLayer._plusMarker = null;
        
        timer.end({ 
          markerId: 'legacy',
          success: true 
        });
        
        this.logger.info('Polygon plus marker removed (legacy method)', {
          markerId: 'legacy'
        });
        
        return true;
      } else {
        this.logger.debug('No plus marker found for polygon layer', {
          markerId
        });
        return false;
      }
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to remove polygon plus marker', {
        error: error.message,
        stack: error.stack
      });
      
      return false;
    }
  }

  /**
   * Remove all active plus markers
   * @param {import('leaflet').Map} map - Leaflet map instance
   * @returns {number} Number of markers removed
   */
  removeAllPlusMarkers(map) {
    const timer = this.logger.time('remove-all-plus-markers');
    
    try {
      let removedCount = 0;
      
      for (const [markerId, markerInfo] of this.activeMarkers) {
        if (this.removePolygonPlus(markerInfo.polygonLayer, map)) {
          removedCount++;
        }
      }
      
      timer.end({ 
        removedCount,
        success: true 
      });
      
      this.logger.info('All polygon plus markers removed', {
        removedCount
      });
      
      return removedCount;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to remove all plus markers', {
        error: error.message,
        stack: error.stack
      });
      
      return 0;
    }
  }

  /**
   * Get count of active plus markers
   * @returns {number} Number of active markers
   */
  getActiveMarkerCount() {
    return this.activeMarkers.size;
  }

  /**
   * Create SVG markup for the plus sign
   * @param {Object} config - Marker configuration
   * @returns {string} SVG markup
   */
  createPlusSVG(config) {
    const { size, thickness, color, borderRadius } = config;
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
      <rect x="${(size - thickness) / 2}" y="0" width="${thickness}" height="${size}" fill="${color}" rx="${borderRadius}"/>
      <rect x="0" y="${(size - thickness) / 2}" width="${size}" height="${thickness}" fill="${color}" rx="${borderRadius}"/>
    </svg>`;
  }

  /**
   * Generate a unique ID for a marker based on polygon layer
   * @param {import('leaflet').Polygon|import('leaflet').Polyline} polygonLayer - Polygon layer
   * @returns {string} Unique marker ID
   */
  generateMarkerId(polygonLayer) {
    // Use layer's internal ID or create one based on properties
    if (polygonLayer._leaflet_id) {
      return `plus-marker-${polygonLayer._leaflet_id}`;
    }
    
    // Fallback: use timestamp and random number
    return `plus-marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update marker configuration for all active markers
   * @param {Object} newConfig - New configuration options
   */
  updateMarkerConfig(newConfig) {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    
    this.logger.info('Marker configuration updated', {
      newConfig: this.defaultConfig
    });
  }

  /**
   * Clean up resources and remove all markers
   */
  destroy() {
    this.logger.info('PolygonPlusManager destroying, cleaning up resources');
    
    // Remove all active markers
    for (const [markerId, markerInfo] of this.activeMarkers) {
      try {
        if (markerInfo.map && markerInfo.map.removeLayer) {
          markerInfo.map.removeLayer(markerInfo.marker);
        }
        markerInfo.polygonLayer._plusMarker = null;
      } catch (error) {
        this.logger.warn('Error cleaning up marker during destroy', {
          markerId,
          error: error.message
        });
      }
    }
    
    this.activeMarkers.clear();
    
    this.logger.info('PolygonPlusManager destroyed');
  }
}

// Create and export a singleton instance
export const polygonPlusManager = () => {
  console.warn('polygonPlusManager: Legacy function called. Use DI container to get PolygonPlusManager instance.');
  throw new Error('Legacy function not available. Use DI container to get PolygonPlusManager instance.');
};

// Legacy compatibility functions for backward compatibility
export const addPolygonPlus = (map, polygonLayer, options) => 
  polygonPlusManager.addPolygonPlus(map, polygonLayer, options);

export const removePolygonPlus = (polygonLayer, map) => 
  polygonPlusManager.removePolygonPlus(polygonLayer, map);

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details