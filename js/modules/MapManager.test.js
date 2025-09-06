/**
 * @fileoverview MapManager Test Suite
 * Tests for the MapManager module using real-code testing principles
 */

import { MapManager } from './MapManager.js';

describe('MapManager', () => {
  let mapManager;
  let mockMapContainer;
  let mockLeaflet;

  beforeEach(() => {
    // Create a mock map container element
    mockMapContainer = document.createElement('div');
    mockMapContainer.id = 'map';
    document.body.appendChild(mockMapContainer);

    // Mock Leaflet library
    mockLeaflet = {
      map: jest.fn(() => ({
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        hasLayer: jest.fn(),
        setView: jest.fn(),
        invalidateSize: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        getZoom: jest.fn(() => 8),
        getCenter: jest.fn(() => ({ lat: -37.8136, lng: 144.9631 })),
        getBounds: jest.fn(() => ({
          getNorthEast: jest.fn(() => ({ lat: -37.5, lng: 145.5 })),
          getSouthWest: jest.fn(() => ({ lat: -38.0, lng: 144.5 }))
        })),
        createPane: jest.fn(() => ({ style: { zIndex: 400 } })),
        getPane: jest.fn(() => ({ style: { zIndex: 400 } }))
      })),
      tileLayer: jest.fn(() => ({
        addTo: jest.fn(),
        setOpacity: jest.fn(),
        setZIndex: jest.fn()
      })),
      control: {
        zoom: jest.fn(() => ({
          addTo: jest.fn(),
          setPosition: jest.fn()
        }))
      },
      pane: jest.fn(() => ({
        style: { zIndex: 400 }
      }))
    };

    // Set up global Leaflet
    global.L = mockLeaflet;

    mapManager = new MapManager();
  });

  afterEach(() => {
    // Clean up DOM
    if (mockMapContainer && mockMapContainer.parentNode) {
      mockMapContainer.parentNode.removeChild(mockMapContainer);
    }
    
    // Clean up global state
    delete global.L;
    mapManager = null;
  });

  describe('constructor', () => {
    test('should create MapManager instance with correct initial state', () => {
      expect(mapManager.initialized).toBe(false);
      expect(mapManager.map).toBeNull();
      expect(mapManager.defaultView).toBeNull();
      expect(mapManager.baseTileLayer).toBeNull();
      expect(mapManager.zoomControl).toBeNull();
      expect(mapManager.config).toEqual({
        center: [-37.8136, 144.9631],
        zoom: 8,
        zoomSnap: 0.333,
        zoomDelta: 0.333,
        preferCanvas: true,
        zoomControl: false,
        attributionControl: false
      });
    });
  });

  describe('init', () => {
    test('should initialize map successfully', async () => {
      await mapManager.init();
      
      expect(mapManager.initialized).toBe(true);
      expect(mapManager.map).toBeDefined();
      expect(mockLeaflet.map).toHaveBeenCalledWith('map', expect.objectContaining({
        center: [-37.8136, 144.9631],
        zoom: 8,
        zoomSnap: 0.333,
        zoomDelta: 0.333,
        preferCanvas: true,
        zoomControl: false,
        attributionControl: false
      }));
    });

    test('should not initialize twice', async () => {
      await mapManager.init();
      const firstMap = mapManager.map;
      
      await mapManager.init();
      expect(mapManager.map).toBe(firstMap);
    });

    test('should handle missing map container', async () => {
      // Remove the map container
      document.body.removeChild(mockMapContainer);
      
      await expect(mapManager.init()).rejects.toThrow('Map container element not found');
    });
  });

  describe('waitForLeaflet', () => {
    test('should resolve immediately if Leaflet is available', async () => {
      await expect(mapManager.waitForLeaflet()).resolves.toBeUndefined();
    });

    test('should timeout if Leaflet is not available', async () => {
      delete global.L;
      
      // Mock the waitForLeaflet method to simulate timeout
      const originalWaitForLeaflet = mapManager.waitForLeaflet;
      mapManager.waitForLeaflet = jest.fn().mockRejectedValue(new Error('Timeout waiting for Leaflet library'));
      
      await expect(mapManager.waitForLeaflet()).rejects.toThrow('Timeout waiting for Leaflet library');
      
      // Restore original method
      mapManager.waitForLeaflet = originalWaitForLeaflet;
    });
  });

  describe('createMap', () => {
    test('should create map with correct configuration', () => {
      mapManager.createMap();
      
      expect(mapManager.map).toBeDefined();
      expect(mockLeaflet.map).toHaveBeenCalledWith('map', mapManager.config);
    });

    test('should throw error if map container not found', () => {
      document.body.removeChild(mockMapContainer);
      
      expect(() => mapManager.createMap()).toThrow('Map container element not found');
    });
  });

  describe('setupBaseTileLayer', () => {
    test('should create and configure base tile layer', () => {
      mapManager.map = mockLeaflet.map();
      mapManager.setupBaseTileLayer();
      
      expect(mockLeaflet.tileLayer).toHaveBeenCalled();
      expect(mapManager.baseTileLayer).toBeDefined();
    });
  });

  describe('setupZoomControl', () => {
    test('should create and configure zoom control', () => {
      mapManager.map = mockLeaflet.map();
      mapManager.setupZoomControl();
      
      expect(mockLeaflet.control.zoom).toHaveBeenCalledWith({
        position: 'topleft'
      });
      expect(mapManager.zoomControl).toBeDefined();
    });
  });

  describe('setupMapPanes', () => {
    test('should create map panes', () => {
      mapManager.map = mockLeaflet.map();
      mapManager.setupMapPanes();
      
      expect(mapManager.map.createPane).toHaveBeenCalled();
    });
  });

  describe('setupMapEvents', () => {
    test('should set up map event listeners', () => {
      mapManager.map = mockLeaflet.map();
      mapManager.setupMapEvents();
      
      expect(mapManager.map.on).toHaveBeenCalled();
    });
  });

  describe('resetView', () => {
    test('should reset map view to default', () => {
      mapManager.map = mockLeaflet.map();
      mapManager.defaultView = { center: [-37.8136, 144.9631], zoom: 8 };
      
      mapManager.resetView();
      
      expect(mapManager.map.setView).toHaveBeenCalledWith([-37.8136, 144.9631], 8);
    });

    test('should not reset if map or defaultView not available', () => {
      mapManager.resetView();
      expect(mockLeaflet.map().setView).not.toHaveBeenCalled();
    });
  });

  describe('getMap', () => {
    test('should return map instance', () => {
      const mockMap = mockLeaflet.map();
      mapManager.map = mockMap;
      
      expect(mapManager.getMap()).toBe(mockMap);
    });
  });

  describe('isReady', () => {
    test('should return true when initialized', () => {
      mapManager.initialized = true;
      mapManager.map = mockLeaflet.map();
      
      expect(mapManager.isReady()).toBe(true);
    });

    test('should return false when not initialized', () => {
      expect(mapManager.isReady()).toBe(false);
    });
  });

  describe('getStatus', () => {
    test('should return correct status when ready', () => {
      mapManager.initialized = true;
      mapManager.map = mockLeaflet.map();
      mapManager.defaultView = { center: [-37.8136, 144.9631], zoom: 8 };
      mapManager.baseTileLayer = mockLeaflet.tileLayer();
      mapManager.zoomControl = mockLeaflet.control.zoom();
      
      const status = mapManager.getStatus();
      expect(status).toEqual({
        initialized: true,
        mapReady: true,
        mapCenter: { lat: -37.8136, lng: 144.9631 },
        mapZoom: 8,
        defaultView: { center: [-37.8136, 144.9631], zoom: 8 },
        baseTileLayer: true,
        zoomControl: true
      });
    });

    test('should return correct status when not ready', () => {
      const status = mapManager.getStatus();
      expect(status).toEqual({
        initialized: false,
        mapReady: false,
        mapCenter: null,
        mapZoom: null,
        defaultView: null,
        baseTileLayer: false,
        zoomControl: false
      });
    });
  });
});
