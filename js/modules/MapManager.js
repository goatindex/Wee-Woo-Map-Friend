/**
 * @module modules/MapManager
 * Modern ES6-based map management for WeeWoo Map Friend
 * Replaces map initialization logic from bootstrap.js with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';
import { logger } from './StructuredLogger.js';

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
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'MapManager' });
    
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
    
    this.logger.info('Map management system initialized', {
      module: 'MapManager',
      timestamp: Date.now()
    });
  }
  
  /**
   * Initialize the map manager
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized - skipping duplicate initialization', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }
    
    // Additional guard: check if map container already has a map
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer._leaflet_id) {
      this.logger.warn('Map container already has a Leaflet map - cleaning up first', {
        operation: 'init',
        containerId: 'map',
        action: 'cleanup_required'
      });
      this.cleanup();
    }
    
    const timer = this.logger.time('map-initialization');
    try {
      this.logger.info('Starting map initialization', {
        operation: 'init',
        config: this.config
      });
      
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
      timer.end({
        success: true,
        mapId: this.map._leaflet_id,
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      });
      this.logger.info('Map system ready', {
        mapId: this.map._leaflet_id,
        center: this.map.getCenter(),
        zoom: this.map.getZoom(),
        bounds: this.map.getBounds(),
        tileLayer: this.baseTileLayer ? 'configured' : 'missing',
        zoomControl: this.zoomControl ? 'configured' : 'missing',
        panes: Object.keys(this.map.panes).length
      });
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        config: this.config
      });
      this.logger.error('Map initialization failed', {
        operation: 'init',
        error: error.message,
        stack: error.stack,
        config: this.config
      });
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
      this.logger.info('Leaflet already available', {
        operation: 'waitForLeaflet',
        version: L.version,
        loadTime: 0,
        source: 'preloaded'
      });
      return;
    }
    
    const timer = this.logger.time('leaflet-load');
    this.logger.debug('Waiting for Leaflet library', {
      operation: 'waitForLeaflet',
      maxWaitTime: 10000
    });
    
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        timer.end({
          success: false,
          error: 'timeout',
          loadTime: Date.now() - startTime
        });
        reject(new Error('Timeout waiting for Leaflet library - check network connection and CDN availability'));
      }, 10000); // 10 second timeout
      
      const checkLeaflet = () => {
        if (typeof L !== 'undefined') {
          clearTimeout(timeout);
          timer.end({
            success: true,
            loadTime: Date.now() - startTime,
            version: L.version
          });
          this.logger.info('Leaflet library loaded successfully', {
            operation: 'waitForLeaflet',
            loadTime: Date.now() - startTime,
            version: L.version
          });
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
    const timer = this.logger.time('map-creation');
    try {
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        throw new Error('Map container element not found');
      }
      
      // Create map instance with optimized settings
      this.map = L.map('map', this.config);
      
      // Legacy compatibility handled through StateManager
      // No direct window.map assignment to avoid fragmented state
      
      timer.end({
        success: true,
        mapId: this.map._leaflet_id,
        config: this.config
      });
      this.logger.info('Map instance created', {
        operation: 'createMap',
        mapId: this.map._leaflet_id,
        config: this.config,
        containerId: 'map',
        containerExists: !!mapContainer
      });
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        config: this.config
      });
      this.logger.error('Failed to create map', {
        operation: 'createMap',
        error: error.message,
        stack: error.stack,
        config: this.config
      });
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
      this.logger.info('Base tile layer added', {
        operation: 'setupBaseTileLayer',
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        mapId: this.map._leaflet_id
      });
      
    } catch (error) {
      this.logger.error('Failed to setup base tile layer', {
        operation: 'setupBaseTileLayer',
        error: error.message,
        stack: error.stack,
        tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      });
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
      // Position zoom controls to avoid conflict with layer menu
      // Layer menu is positioned at topright, so use topright for mobile and bottomright for desktop
      const position = deviceContext?.device === 'mobile' ? 'topright' : 'bottomright';
      
      this.zoomControl = L.control.zoom({
        position: position
      });
      
      this.zoomControl.addTo(this.map);
      this.logger.info('Zoom control added', { position });
      
    } catch (error) {
      this.logger.error('Failed to setup zoom control', {
        operation: 'setupZoomControl',
        error: error.message,
        stack: error.stack,
        position: position
      });
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
      
      this.logger.debug('Map panes created', {
        operation: 'setupMapPanes',
        paneCount: Object.keys(this.map.panes).length
      });
      
    } catch (error) {
      this.logger.error('Failed to setup map panes', {
        operation: 'setupMapPanes',
        error: error.message,
        stack: error.stack,
        panes: panes
      });
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
      
      this.logger.debug('Map events configured', {
        operation: 'setupMapEvents',
        eventCount: Object.keys(this.map._events || {}).length
      });
      
    } catch (error) {
      this.logger.error('Failed to setup map events', {
        operation: 'setupMapEvents',
        error: error.message,
        stack: error.stack
      });
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
      this.logger.info('Map view reset', {
        operation: 'resetView',
        center: this.defaultView.center,
        zoom: this.defaultView.zoom
      });
      
    } catch (error) {
      this.logger.error('Failed to reset map view', {
        operation: 'resetView',
        error: error.message,
        stack: error.stack,
        defaultView: this.defaultView
      });
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
        const mapId = this.map._leaflet_id;
        this.map.remove();
        this.logger.info('Existing map cleaned up', {
          operation: 'cleanup',
          mapId: mapId,
          action: 'map_removed'
        });
      } catch (error) {
        this.logger.warn('Error cleaning up map', {
          operation: 'cleanup',
          error: error.message,
          stack: error.stack
        });
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
