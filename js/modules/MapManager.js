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
      console.warn('MapManager: Already initialized');
      return;
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
      
      // Store map reference in state manager
      stateManager.set('map', this.map);
      
      // Store default view
      this.defaultView = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      };
      stateManager.set('defaultView', this.defaultView);
      
      // Emit map ready event
      globalEventBus.emit('map:ready', { map: this.map, manager: this });
      
      this.initialized = true;
      console.log('✅ MapManager: Map system ready');
      
    } catch (error) {
      console.error('🚨 MapManager: Failed to initialize:', error);
      globalEventBus.emit('map:error', { error });
      throw error;
    }
  }
  
  /**
   * Wait for Leaflet library to be available
   */
  async waitForLeaflet() {
    if (typeof L !== 'undefined') {
      console.log('✅ MapManager: Leaflet already available');
      return;
    }
    
    console.log('⏳ MapManager: Waiting for Leaflet library...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for Leaflet library'));
      }, 10000); // 10 second timeout
      
      const checkLeaflet = () => {
        if (typeof L !== 'undefined') {
          clearTimeout(timeout);
          console.log('✅ MapManager: Leaflet library loaded');
          resolve();
        } else {
          setTimeout(checkLeaflet, 100);
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
      
      // Store map reference for legacy compatibility
      if (typeof window !== 'undefined') {
        window.map = this.map;
        window.getMap = () => this.map;
      }
      
      console.log('✅ MapManager: Map instance created');
      
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
      console.log('✅ MapManager: Base tile layer added');
      
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
      console.log('✅ MapManager: Zoom control added');
      
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
   * Check if map is ready
   */
  isReady() {
    return this.initialized && this.map !== null;
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
}

// Export singleton instance
export const mapManager = new MapManager();

// Export for global access
if (typeof window !== 'undefined') {
  window.mapManager = mapManager;
}
