/**
 * @module modules/RefactoredMapManager
 * Refactored MapManager using event-driven architecture and dependency injection
 * Implements ARIA support and independent initialization
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';
import { logger } from './StructuredLogger.js';

/**
 * @class RefactoredMapManager
 * Manages the Leaflet map instance with event-driven communication and ARIA support
 */
@injectable()
export class RefactoredMapManager extends BaseService {
  constructor(
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.StateManager) stateManager,
    @inject(TYPES.ConfigService) configService,
    @inject(TYPES.ARIAService) ariaService,
    @inject(TYPES.ErrorBoundary) errorBoundary
  ) {
    super();
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.configService = configService;
    this.ariaService = ariaService;
    this.errorBoundary = errorBoundary;
    
    this.initialized = false;
    this.map = null;
    this.defaultView = null;
    this.baseTileLayer = null;
    this.zoomControl = null;
    this.mapContainer = null;
    
    // Create module-specific logger
    this.logger = logger.createChild({ module: 'RefactoredMapManager' });
    
    // Map configuration from config service
    this.config = {
      center: [-37.8136, 144.9631], // Melbourne
      zoom: 8,
      zoomSnap: 0.333,
      zoomDelta: 0.333,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false
    };
    
    // Event subscriptions
    this.eventSubscriptions = new Map();
    
    this.logger.info('RefactoredMapManager initialized', {
      module: 'RefactoredMapManager',
      timestamp: Date.now()
    });
  }

  /**
   * Initialize the map manager with event-driven communication
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized - skipping duplicate initialization', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }

    const timer = this.logger.time('refactored-map-initialization');
    
    try {
      this.logger.info('Starting refactored map initialization', {
        operation: 'init',
        config: this.config
      });

      // Set up event listeners
      this.setupEventListeners();

      // Wait for Leaflet to be available
      await this.waitForLeaflet();

      // Create the map instance
      await this.createMap();

      // Set up ARIA support
      await this.setupARIA();

      // Set up base tile layer
      await this.setupBaseTileLayer();

      // Set up zoom control
      await this.setupZoomControl();

      // Set up map panes
      await this.setupMapPanes();

      // Set up map events
      await this.setupMapEvents();

      // Update state manager
      await this.updateStateManager();

      // Emit map ready event
      this.eventBus.emit('map.ready', {
        map: this.map,
        manager: this,
        timestamp: Date.now()
      });

      this.initialized = true;
      
      timer.end({
        success: true,
        mapId: this.map._leaflet_id,
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      });
      
      this.logger.info('Refactored map system ready', {
        mapId: this.map._leaflet_id,
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      });

    } catch (error) {
      timer.end({
        success: false,
        error: error.message
      });
      
      this.logger.error('Map initialization failed', {
        operation: 'init',
        error: error.message,
        stack: error.stack
      });
      
      // Emit error event
      this.eventBus.emit('map.error', {
        error: error.message,
        operation: 'init',
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Set up event listeners for event-driven communication
   */
  setupEventListeners() {
    // Listen for data loading events
    this.eventSubscriptions.set('data.loaded', 
      this.eventBus.on('data.loaded', (event) => {
        this.handleDataLoaded(event.payload);
      })
    );

    // Listen for layer selection events
    this.eventSubscriptions.set('sidebar.layer.selected',
      this.eventBus.on('sidebar.layer.selected', (event) => {
        this.handleLayerSelection(event.payload);
      })
    );

    // Listen for layer deselection events
    this.eventSubscriptions.set('sidebar.layer.deselected',
      this.eventBus.on('sidebar.layer.deselected', (event) => {
        this.handleLayerDeselection(event.payload);
      })
    );

    // Listen for search events
    this.eventSubscriptions.set('search.result.selected',
      this.eventBus.on('search.result.selected', (event) => {
        this.handleSearchResultSelection(event.payload);
      })
    );

    // Listen for view reset events
    this.eventSubscriptions.set('map.reset.view',
      this.eventBus.on('map.reset.view', () => {
        this.resetView();
      })
    );

    this.logger.debug('Event listeners set up', {
      operation: 'setupEventListeners',
      subscriptionCount: this.eventSubscriptions.size
    });
  }

  /**
   * Wait for Leaflet to be available
   */
  async waitForLeaflet() {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waitTime = 0;

    while (waitTime < maxWaitTime) {
      if (typeof window !== 'undefined' && window.L) {
        this.logger.debug('Leaflet detected', {
          operation: 'waitForLeaflet',
          waitTime: waitTime
        });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }

    throw new Error('Leaflet not available after 10 seconds');
  }

  /**
   * Create the map instance
   */
  async createMap() {
    try {
      // Check if map container already has a map
      this.mapContainer = document.getElementById('map');
      if (this.mapContainer && this.mapContainer._leaflet_id) {
        this.logger.warn('Map container already has a Leaflet map - cleaning up first', {
          operation: 'createMap',
          containerId: 'map',
          action: 'cleanup_required'
        });
        this.cleanup();
      }

      // Create map instance
      this.map = window.L.map('map', this.config);
      
      this.logger.info('Map instance created', {
        operation: 'createMap',
        mapId: this.map._leaflet_id,
        config: this.config
      });

    } catch (error) {
      this.logger.error('Failed to create map instance', {
        operation: 'createMap',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Set up ARIA support for the map
   */
  async setupARIA() {
    if (!this.mapContainer || !this.ariaService) return;

    try {
      // Set up basic ARIA attributes
      this.mapContainer.setAttribute('role', 'application');
      this.mapContainer.setAttribute('aria-label', 'Interactive map showing emergency services boundaries and facilities');
      this.mapContainer.setAttribute('aria-describedby', 'map-instructions');

      // Create map instructions for screen readers
      let instructions = document.getElementById('map-instructions');
      if (!instructions) {
        instructions = document.createElement('div');
        instructions.id = 'map-instructions';
        instructions.className = 'sr-only';
        instructions.textContent = 'Use arrow keys to navigate the map. Press Enter to zoom in, Space to zoom out. Use Tab to move between map controls.';
        this.mapContainer.appendChild(instructions);
      }

      // Announce map initialization
      this.ariaService.announce('Map initialized and ready for use', 'polite');

      this.logger.debug('ARIA support set up', {
        operation: 'setupARIA',
        mapId: this.map._leaflet_id
      });

    } catch (error) {
      this.logger.error('Failed to set up ARIA support', {
        operation: 'setupARIA',
        error: error.message
      });
      // Don't throw - ARIA is not critical for map functionality
    }
  }

  /**
   * Set up base tile layer
   */
  async setupBaseTileLayer() {
    try {
      const tileUrl = this.configService.get('map.tileUrl', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      const attribution = this.configService.get('map.attribution', '© OpenStreetMap contributors');

      this.baseTileLayer = window.L.tileLayer(tileUrl, {
        attribution: attribution,
        maxZoom: 18
      });

      this.baseTileLayer.addTo(this.map);

      this.logger.debug('Base tile layer set up', {
        operation: 'setupBaseTileLayer',
        tileUrl: tileUrl
      });

    } catch (error) {
      this.logger.error('Failed to set up base tile layer', {
        operation: 'setupBaseTileLayer',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up zoom control
   */
  async setupZoomControl() {
    try {
      this.zoomControl = window.L.control.zoom({
        position: 'topright'
      });

      this.zoomControl.addTo(this.map);

      // Add ARIA support to zoom controls
      const zoomIn = this.mapContainer.querySelector('.leaflet-control-zoom-in');
      const zoomOut = this.mapContainer.querySelector('.leaflet-control-zoom-out');
      
      if (zoomIn) {
        zoomIn.setAttribute('aria-label', 'Zoom in');
        zoomIn.setAttribute('role', 'button');
      }
      
      if (zoomOut) {
        zoomOut.setAttribute('aria-label', 'Zoom out');
        zoomOut.setAttribute('role', 'button');
      }

      this.logger.debug('Zoom control set up', {
        operation: 'setupZoomControl'
      });

    } catch (error) {
      this.logger.error('Failed to set up zoom control', {
        operation: 'setupZoomControl',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up map panes
   */
  async setupMapPanes() {
    try {
      // Create custom panes for different layer types
      const panes = ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv'];
      
      panes.forEach(paneName => {
        if (!this.map.getPane(paneName)) {
          this.map.createPane(paneName);
          const pane = this.map.getPane(paneName);
          pane.style.zIndex = 400 + panes.indexOf(paneName);
        }
      });

      this.logger.debug('Map panes set up', {
        operation: 'setupMapPanes',
        panes: panes
      });

    } catch (error) {
      this.logger.error('Failed to set up map panes', {
        operation: 'setupMapPanes',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up map events
   */
  async setupMapEvents() {
    try {
      // Map view change events
      this.map.on('moveend', () => {
        this.handleMapMove();
      });

      this.map.on('zoomend', () => {
        this.handleMapZoom();
      });

      // Map click events
      this.map.on('click', (e) => {
        this.handleMapClick(e);
      });

      this.logger.debug('Map events set up', {
        operation: 'setupMapEvents'
      });

    } catch (error) {
      this.logger.error('Failed to set up map events', {
        operation: 'setupMapEvents',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update state manager with map information
   */
  async updateStateManager() {
    try {
      // Store the actual map instance
      this.stateManager.dispatch({
        type: 'map/setMap',
        payload: this.map
      });

      // Store serializable map state
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();

      this.stateManager.dispatch({
        type: 'map/setState',
        payload: {
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
        }
      });

      // Store default view
      this.defaultView = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      };

      this.stateManager.dispatch({
        type: 'map/setDefaultView',
        payload: this.defaultView
      });

      // Set map ready flag
      this.stateManager.dispatch({
        type: 'map/setReady',
        payload: true
      });

      this.logger.debug('State manager updated', {
        operation: 'updateStateManager',
        mapId: this.map._leaflet_id
      });

    } catch (error) {
      this.logger.error('Failed to update state manager', {
        operation: 'updateStateManager',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle data loaded events
   */
  handleDataLoaded(payload) {
    this.logger.debug('Data loaded event received', {
      operation: 'handleDataLoaded',
      category: payload.category,
      featureCount: payload.features?.length
    });

    // Emit event for other components
    this.eventBus.emit('map.data.available', {
      category: payload.category,
      features: payload.features,
      timestamp: Date.now()
    });
  }

  /**
   * Handle layer selection events
   */
  handleLayerSelection(payload) {
    this.logger.debug('Layer selection event received', {
      operation: 'handleLayerSelection',
      category: payload.category,
      itemId: payload.itemId
    });

    // Add layer to map
    this.addLayer(payload.category, payload.itemId);
  }

  /**
   * Handle layer deselection events
   */
  handleLayerDeselection(payload) {
    this.logger.debug('Layer deselection event received', {
      operation: 'handleLayerDeselection',
      category: payload.category,
      itemId: payload.itemId
    });

    // Remove layer from map
    this.removeLayer(payload.category, payload.itemId);
  }

  /**
   * Handle search result selection events
   */
  handleSearchResultSelection(payload) {
    this.logger.debug('Search result selection event received', {
      operation: 'handleSearchResultSelection',
      result: payload.result
    });

    // Zoom to search result
    this.zoomToFeature(payload.result);
  }

  /**
   * Handle map move events
   */
  handleMapMove() {
    const center = this.map.getCenter();
    
    this.stateManager.dispatch({
      type: 'map/setCenter',
      payload: [center.lat, center.lng]
    });

    // Emit map move event
    this.eventBus.emit('map.moved', {
      center: center,
      timestamp: Date.now()
    });
  }

  /**
   * Handle map zoom events
   */
  handleMapZoom() {
    const zoom = this.map.getZoom();
    
    this.stateManager.dispatch({
      type: 'map/setZoom',
      payload: zoom
    });

    // Emit map zoom event
    this.eventBus.emit('map.zoomed', {
      zoom: zoom,
      timestamp: Date.now()
    });
  }

  /**
   * Handle map click events
   */
  handleMapClick(e) {
    this.logger.debug('Map clicked', {
      operation: 'handleMapClick',
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });

    // Emit map click event
    this.eventBus.emit('map.clicked', {
      latlng: e.latlng,
      timestamp: Date.now()
    });
  }

  /**
   * Add a layer to the map
   */
  addLayer(category, itemId) {
    try {
      // Get layer data from state manager
      const layers = this.stateManager.getState().map.layers;
      const layer = layers.get(`${category}_${itemId}`);
      
      if (layer) {
        layer.addTo(this.map);
        
        this.logger.debug('Layer added to map', {
          operation: 'addLayer',
          category: category,
          itemId: itemId
        });

        // Emit layer added event
        this.eventBus.emit('map.layer.added', {
          category: category,
          itemId: itemId,
          layer: layer,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      this.logger.error('Failed to add layer to map', {
        operation: 'addLayer',
        category: category,
        itemId: itemId,
        error: error.message
      });
    }
  }

  /**
   * Remove a layer from the map
   */
  removeLayer(category, itemId) {
    try {
      // Get layer data from state manager
      const layers = this.stateManager.getState().map.layers;
      const layer = layers.get(`${category}_${itemId}`);
      
      if (layer) {
        layer.removeFrom(this.map);
        
        this.logger.debug('Layer removed from map', {
          operation: 'removeLayer',
          category: category,
          itemId: itemId
        });

        // Emit layer removed event
        this.eventBus.emit('map.layer.removed', {
          category: category,
          itemId: itemId,
          layer: layer,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      this.logger.error('Failed to remove layer from map', {
        operation: 'removeLayer',
        category: category,
        itemId: itemId,
        error: error.message
      });
    }
  }

  /**
   * Zoom to a specific feature
   */
  zoomToFeature(feature) {
    try {
      if (feature && feature.geometry) {
        const layer = window.L.geoJSON(feature);
        this.map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        
        this.logger.debug('Zoomed to feature', {
          operation: 'zoomToFeature',
          featureId: feature.properties?.id || 'unknown'
        });

        // Announce zoom action
        if (this.ariaService) {
          this.ariaService.announce('Map zoomed to selected feature', 'polite');
        }
      }

    } catch (error) {
      this.logger.error('Failed to zoom to feature', {
        operation: 'zoomToFeature',
        error: error.message
      });
    }
  }

  /**
   * Reset map view to default
   */
  resetView() {
    try {
      if (this.defaultView) {
        this.map.setView(this.defaultView.center, this.defaultView.zoom);
        
        this.logger.debug('Map view reset', {
          operation: 'resetView',
          center: this.defaultView.center,
          zoom: this.defaultView.zoom
        });

        // Announce reset action
        if (this.ariaService) {
          this.ariaService.announce('Map view reset to default', 'polite');
        }

        // Emit reset event
        this.eventBus.emit('map.view.reset', {
          center: this.defaultView.center,
          zoom: this.defaultView.zoom,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      this.logger.error('Failed to reset map view', {
        operation: 'resetView',
        error: error.message
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
   * Check if map is ready
   */
  isReady() {
    return this.initialized && this.map !== null;
  }

  /**
   * Get map status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mapReady: this.map !== null,
      mapId: this.map?._leaflet_id || null,
      center: this.map?.getCenter() || null,
      zoom: this.map?.getZoom() || null
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      // Remove event subscriptions
      this.eventSubscriptions.forEach((unsubscribe, eventType) => {
        unsubscribe();
      });
      this.eventSubscriptions.clear();

      // Remove map instance
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Reset state
      this.initialized = false;
      this.mapContainer = null;
      this.baseTileLayer = null;
      this.zoomControl = null;

      this.logger.info('Map manager cleaned up', {
        operation: 'cleanup'
      });

    } catch (error) {
      this.logger.error('Failed to cleanup map manager', {
        operation: 'cleanup',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const refactoredMapManager = new RefactoredMapManager();
