/**
 * @module modules/MapManager
 * Modern ES6-based map management for WeeWoo Map Friend
 * Replaces map initialization logic from bootstrap.js with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class MapManager
 * Manages the Leaflet map instance and core map functionality
 */
export class MapManager {
  constructor() {
    this.initialized = false;
    this.map = null;
    this.defaultView = null;
    this.baseTileLayer = null;
    this.zoomControl = null;
    
    // Map configuration
    this.config = {
      center: [-37.8136, 144.9631], // Melbourne
      zoom: 8,
      zoomSnap: 0.333,
      zoomDelta: 0.333,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.waitForLeaflet = this.waitForLeaflet.bind(this);
    this.createMap = this.createMap.bind(this);
    this.setupBaseTileLayer = this.setupBaseTileLayer.bind(this);
    this.setupZoomControl = this.setupZoomControl.bind(this);
    this.setupMapPanes = this.setupMapPanes.bind(this);
    this.setupMapEvents = this.setupMapEvents.bind(this);
    this.resetView = this.resetView.bind(this);
    this.getMap = this.getMap.bind(this);
    this.isReady = this.isReady.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('🗺️ MapManager: Map management system initialized');
  }
  
  /**
   * Initialize the map manager
   */
  async init() {
    if (this.initialized) {
      console.warn('MapManager: Already initialized - skipping duplicate initialization');
      return;
    }
    
    // Additional guard: check if map container already has a map
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
      console.warn('MapManager: Map container already has a Leaflet map - cleaning up first');
      this.cleanup();
    }
    
    try {
      console.log('🔧 MapManager: Starting map initialization...');
      
      // Wait for Leaflet to be available
      await this.waitForLeaflet();
      
      // Create the map instance
      this.createMap();
      
      // Set up base tile layer
      this.setupBaseTileLayer();
      
      // Set up zoom control
      this.setupZoomControl();
      
      // Set up map panes
      this.setupMapPanes();
      
      // Set up map events
      this.setupMapEvents();
      
      // Store the actual map instance in state manager for other modules to use
      stateManager.set('map', this.map);
      
      // Also store serializable map state for debugging and persistence
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();
      
      stateManager.set('mapState', {
        id: this.map._leaflet_id,
        center: {
          lat: center.lat,
          lng: center.lng
        },
        zoom: this.map.getZoom(),
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        ready: true
      });
      
      // Store default view
      this.defaultView = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      };
      stateManager.set('defaultView', this.defaultView);
      
      // Set map ready flag in state manager
      stateManager.set('mapReady', true);
      
      // Emit map ready event
      globalEventBus.emit('map:ready', { map: this.map, manager: this });
      
      this.initialized = true;
      this.logger.info('Map system ready');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to initialize:', error);
      globalEventBus.emit('map:error', { error });
      throw error;
    }
  }
  
  /**
   * Wait for Leaflet library to be available
   * Enhanced version with better error handling and performance
   */
  async waitForLeaflet() {
    if (typeof L !== 'undefined') {
      this.logger.info('Leaflet already available');
      return;
    }
    
    console.log('⏳ MapManager: Waiting for Leaflet library...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for Leaflet library - check network connection and CDN availability'));
      }, 10000); // 10 second timeout
      
      const checkLeaflet = () => {
        if (typeof L !== 'undefined') {
          clearTimeout(timeout);
          this.logger.info('Leaflet library loaded successfully');
          resolve();
        } else {
          // Use requestAnimationFrame for better performance than setTimeout
          requestAnimationFrame(checkLeaflet);
        }
      };
      
      checkLeaflet();
    });
  }
  
  /**
   * Create the Leaflet map instance
   */
  createMap() {
    try {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        throw new Error('Map container element not found');
      }
      
      // Create map instance with optimized settings
      this.map = L.map('map', this.config);
      
      // Legacy compatibility handled through StateManager
      // No direct window.map assignment to avoid fragmented state
      
      this.logger.info('Map instance created');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to create map:', error);
      throw error;
    }
  }
  
  /**
   * Set up the base tile layer
   */
  setupBaseTileLayer() {
    try {
      this.baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
      
      this.baseTileLayer.addTo(this.map);
      this.logger.info('Base tile layer added');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to setup base tile layer:', error);
      throw error;
    }
  }
  
  /**
   * Set up zoom control
   */
  setupZoomControl() {
    try {
      // Get device context for positioning
      const deviceContext = stateManager.get('deviceContext');
      const position = deviceContext?.device === 'mobile' ? 'bottomright' : 'topleft';
      
      this.zoomControl = L.control.zoom({
        position: position
      });
      
      this.zoomControl.addTo(this.map);
      this.logger.info('Zoom control added');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to setup zoom control:', error);
      throw error;
    }
  }
  
  /**
   * Set up map panes for layer ordering
   */
  setupMapPanes() {
    try {
      // Create panes to control z-order (bottom -> top): LGA, CFA, SES, Ambulance, Police, FRV
      const panes = [
        ['lga', 400],
        ['cfa', 410],
        ['ses', 420],
        ['ambulance', 430],
        ['police', 440],
        ['frv', 450]
      ];
      
      panes.forEach(([name, z]) => {
        this.map.createPane(name);
        this.map.getPane(name).style.zIndex = String(z);
      });
      
      console.log('✅ MapManager: Map panes created');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to setup map panes:', error);
      throw error;
    }
  }
  
  /**
   * Set up map event handlers
   */
  setupMapEvents() {
    try {
      // Handle map interactions with native feedback
      this.map.on('click', () => {
        if (window.NativeFeatures) {
          window.NativeFeatures.hapticFeedback('light');
        }
        globalEventBus.emit('map:click', { map: this.map });
      });
      
      this.map.on('zoomend', () => {
        if (window.NativeFeatures) {
          window.NativeFeatures.hapticFeedback('light');
        }
        globalEventBus.emit('map:zoomend', { map: this.map, zoom: this.map.getZoom() });
      });
      
      this.map.on('moveend', () => {
        globalEventBus.emit('map:moveend', { 
          map: this.map, 
          center: this.map.getCenter(),
          bounds: this.map.getBounds()
        });
      });
      
      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.map) {
          setTimeout(() => this.map.invalidateSize(), 100);
        }
      });
      
      console.log('✅ MapManager: Map events configured');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to setup map events:', error);
      throw error;
    }
  }
  
  /**
   * Reset map to default view
   */
  resetView() {
    if (!this.map || !this.defaultView) return;
    
    try {
      this.map.setView(this.defaultView.center, this.defaultView.zoom);
      globalEventBus.emit('map:reset', { map: this.map });
      console.log('✅ MapManager: Map view reset');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to reset map view:', error);
    }
  }
  
  /**
   * Get the map instance
   */
  getMap() {
    return this.map;
  }
  
  /**
   * Get map instance from state manager (for legacy compatibility)
   * Returns the actual map instance, not the serialized state
   */
  static getMapFromState() {
    return mapManager.getMap();
  }
  
  /**
   * Check if map is ready
   */
  isReady() {
    return this.initialized && this.map !== null;
  }
  
  /**
   * Clean up existing map instance
   */
  cleanup() {
    if (this.map) {
      try {
        this.map.remove();
        console.log('✅ MapManager: Existing map cleaned up');
      } catch (error) {
        console.warn('MapManager: Error cleaning up map:', error);
      }
      this.map = null;
    }
    
    // Reset state
    this.initialized = false;
    this.defaultView = null;
    this.baseTileLayer = null;
    this.zoomControl = null;
  }
  
  /**
   * Get map manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mapReady: this.isReady(),
      mapCenter: this.map ? this.map.getCenter() : null,
      mapZoom: this.map ? this.map.getZoom() : null,
      defaultView: this.defaultView,
      baseTileLayer: !!this.baseTileLayer,
      zoomControl: !!this.zoomControl
    };
  }

  /**
   * Cleanup map manager resources
   */
  async cleanup() {
    this.logger.info('Cleaning up MapManager resources');
    
    try {
      // Remove map from DOM
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      
      // Clear references
      this.baseTileLayer = null;
      this.zoomControl = null;
      this.mapPanes = {};
      
      // Reset state
      this.initialized = false;
      this.defaultView = null;
      
      this.logger.info('MapManager cleanup completed');
    } catch (error) {
      this.logger.error('MapManager cleanup failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const mapManager = new MapManager();

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
