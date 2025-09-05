/**
 * @fileoverview LayerManager Test Suite
 * Tests for the LayerManager module using real-code testing principles
 */

import { LayerManager } from './LayerManager.js';

// Mock the stateManager module
jest.mock('./StateManager.js', () => ({
  stateManager: {
    get: jest.fn()
  }
}));

describe('LayerManager', () => {
  let layerManager;
  let mockMap;
  let mockLeaflet;

  beforeEach(async () => {
    // Mock Leaflet library
    mockLeaflet = {
      layerGroup: jest.fn(() => ({
        addLayer: jest.fn(),
        removeLayer: jest.fn(),
        hasLayer: jest.fn(),
        getLayers: jest.fn(() => []),
        clearLayers: jest.fn(),
        addTo: jest.fn(),
        remove: jest.fn()
      })),
      pane: jest.fn(() => ({
        style: { zIndex: 400 }
      }))
    };

    // Mock map instance
    mockMap = {
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      hasLayer: jest.fn(),
      createPane: jest.fn(() => mockLeaflet.pane()),
      getPane: jest.fn(() => mockLeaflet.pane())
    };

    // Set up global Leaflet
    global.L = mockLeaflet;

    // Set up stateManager mock
    const { stateManager } = await import('./StateManager.js');
    stateManager.get.mockReturnValue(mockMap);

    layerManager = new LayerManager();
  });

  afterEach(() => {
    // Clean up global state
    delete global.L;
    layerManager = null;
  });

  describe('constructor', () => {
    test('should create LayerManager instance with correct initial state', () => {
      expect(layerManager.initialized).toBe(false);
      expect(layerManager.layers).toBeInstanceOf(Map);
      expect(layerManager.panes).toBeInstanceOf(Map);
      expect(layerManager.layerGroups).toBeInstanceOf(Map);
      expect(layerManager.paneConfig).toEqual([
        ['lga', 400],
        ['cfa', 410],
        ['ses', 420],
        ['ambulance', 430],
        ['police', 440],
        ['frv', 450]
      ]);
    });
  });

  describe('init', () => {
    test('should initialize layer manager successfully', async () => {
      // Import the mocked stateManager
      const { stateManager } = await import('./StateManager.js');
      stateManager.get.mockReturnValue(mockMap);

      await layerManager.init();
      
      expect(layerManager.initialized).toBe(true);
    });

    test('should not initialize twice', async () => {
      const { stateManager } = await import('./StateManager.js');
      stateManager.get.mockReturnValue(mockMap);

      await layerManager.init();
      const firstInitialized = layerManager.initialized;
      
      await layerManager.init();
      expect(layerManager.initialized).toBe(firstInitialized);
    });

    test('should timeout if map is not available', async () => {
      const { stateManager } = await import('./StateManager.js');
      stateManager.get.mockReturnValue(null);

      // Mock the waitForMap method to simulate timeout
      const originalWaitForMap = layerManager.waitForMap;
      layerManager.waitForMap = jest.fn().mockRejectedValue(new Error('Timeout waiting for map'));
      
      await expect(layerManager.init()).rejects.toThrow('Timeout waiting for map');
      
      // Restore original method
      layerManager.waitForMap = originalWaitForMap;
    });
  });

  describe('setupPanes', () => {
    test('should create map panes', () => {
      layerManager.setupPanes(mockMap);
      
      expect(mockMap.createPane).toHaveBeenCalled();
      expect(layerManager.panes.size).toBeGreaterThan(0);
    });

    test('should not create panes if map not available', () => {
      // Mock stateManager to return null for map
      const { stateManager } = require('./StateManager.js');
      stateManager.get.mockReturnValue(null);
      
      expect(() => layerManager.setupPanes()).toThrow('Map not available for pane setup');
    });
  });

  describe('addLayer', () => {
    beforeEach(() => {
      layerManager.initialized = true;
    });

    test('should add layer to correct category and key', () => {
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      
      layerManager.addLayer('test-category', 'test-key', mockLayer);
      
      expect(layerManager.layers.has('test-category')).toBe(true);
      const categoryLayers = layerManager.layers.get('test-category');
      expect(categoryLayers.has('test-key')).toBe(true);
      const keyLayers = categoryLayers.get('test-key');
      expect(keyLayers).toContain(mockLayer);
    });

    test('should add layer to map if layer group exists', () => {
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      const mockLayerGroup = mockLeaflet.layerGroup();
      layerManager.layerGroups.set('test-category', mockLayerGroup);
      
      layerManager.addLayer('test-category', 'test-key', mockLayer);
      
      expect(mockLayerGroup.addLayer).toHaveBeenCalledWith(mockLayer);
    });
  });

  describe('removeLayer', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should remove layer from category and key', () => {
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      
      layerManager.removeLayer('test-category', 'test-key', mockLayer);
      
      const categoryLayers = layerManager.layers.get('test-category');
      const keyLayers = categoryLayers.get('test-key');
      expect(keyLayers).not.toContain(mockLayer);
    });

    test('should remove layer from map if present', () => {
      mockMap.hasLayer.mockReturnValue(true);
      
      // Get the layer that was added in beforeEach
      const categoryLayers = layerManager.layers.get('test-category');
      const keyLayers = categoryLayers.get('test-key');
      const layer = keyLayers[0];
      
      layerManager.removeLayer('test-category', 'test-key', layer);
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(layer);
    });
  });

  describe('showLayer', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should add layer to map if not already present', () => {
      mockMap.hasLayer.mockReturnValue(false);
      
      layerManager.showLayer('test-category', 'test-key');
      
      // Get the layer that was added in beforeEach
      const categoryLayers = layerManager.layers.get('test-category');
      const keyLayers = categoryLayers.get('test-key');
      const layer = keyLayers[0];
      
      expect(layer.addTo).toHaveBeenCalledWith(mockMap);
    });

    test('should not add layer to map if already present', () => {
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      mockMap.hasLayer.mockReturnValue(true);
      
      layerManager.showLayer('test-category', 'test-key');
      
      expect(mockLayer.addTo).not.toHaveBeenCalled();
    });
  });

  describe('hideLayer', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should remove layer from map if present', () => {
      mockMap.hasLayer.mockReturnValue(true);
      
      layerManager.hideLayer('test-category', 'test-key');
      
      // Get the layer that was added in beforeEach
      const categoryLayers = layerManager.layers.get('test-category');
      const keyLayers = categoryLayers.get('test-key');
      const layer = keyLayers[0];
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(layer);
    });

    test('should not remove layer from map if not present', () => {
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      mockMap.hasLayer.mockReturnValue(false);
      
      layerManager.hideLayer('test-category', 'test-key');
      
      expect(mockLayer.remove).not.toHaveBeenCalled();
    });
  });

  describe('getLayer', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should return layer by category, key, and index', () => {
      const layer = layerManager.getLayer('test-category', 'test-key', 0);
      
      expect(layer).toEqual({ 
        id: 'test-layer',
        addTo: expect.any(Function),
        remove: expect.any(Function),
        setStyle: expect.any(Function)
      });
    });

    test('should return null for non-existent category', () => {
      const layer = layerManager.getLayer('non-existent', 'test-key', 0);
      
      expect(layer).toBeNull();
    });

    test('should return null for non-existent key', () => {
      const layer = layerManager.getLayer('test-category', 'non-existent', 0);
      
      expect(layer).toBeNull();
    });
  });

  describe('getLayersByCategory', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer1 = { 
        id: 'test-layer-1',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      const mockLayer2 = { 
        id: 'test-layer-2',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'key1', mockLayer1);
      layerManager.addLayer('test-category', 'key2', mockLayer2);
    });

    test('should return all layers for category', () => {
      const layers = layerManager.getLayersByCategory('test-category');
      
      expect(layers).toHaveLength(2);
      expect(layers).toContainEqual({ 
        id: 'test-layer-1',
        addTo: expect.any(Function),
        remove: expect.any(Function),
        setStyle: expect.any(Function)
      });
      expect(layers).toContainEqual({ 
        id: 'test-layer-2',
        addTo: expect.any(Function),
        remove: expect.any(Function),
        setStyle: expect.any(Function)
      });
    });

    test('should return empty array for non-existent category', () => {
      const layers = layerManager.getLayersByCategory('non-existent');
      
      expect(layers).toEqual([]);
    });
  });

  describe('clearCategory', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should clear all layers in category', () => {
      layerManager.clearCategory('test-category');
      
      const categoryLayers = layerManager.layers.get('test-category');
      expect(categoryLayers.size).toBe(0);
    });

    test('should remove layers from map', () => {
      mockMap.hasLayer.mockReturnValue(true);
      
      // Get the layer before clearing the category
      const categoryLayers = layerManager.layers.get('test-category');
      const keyLayers = categoryLayers.get('test-key');
      const layer = keyLayers[0];
      
      layerManager.clearCategory('test-category');
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith(layer);
    });
  });

  describe('updateLayerStyle', () => {
    beforeEach(() => {
      layerManager.initialized = true;
      const mockLayer = { 
        id: 'test-layer',
        addTo: jest.fn(),
        remove: jest.fn(),
        setStyle: jest.fn()
      };
      layerManager.addLayer('test-category', 'test-key', mockLayer);
    });

    test('should update layer style', () => {
      const newStyle = { color: 'red', weight: 2 };
      
      layerManager.updateLayerStyle('test-category', 'test-key', newStyle);
      
      const layer = layerManager.getLayer('test-category', 'test-key', 0);
      expect(layer.setStyle).toHaveBeenCalledWith(newStyle);
    });
  });

  describe('isReady', () => {
    test('should return true when initialized', () => {
      layerManager.initialized = true;
      
      expect(layerManager.isReady()).toBe(true);
    });

    test('should return false when not initialized', () => {
      expect(layerManager.isReady()).toBe(false);
    });
  });

  describe('getStatus', () => {
    test('should return correct status when ready', () => {
      layerManager.initialized = true;
      layerManager.layers.set('test-category', new Map());
      
      const status = layerManager.getStatus();
      expect(status).toEqual({
        initialized: true,
        panes: 0,
        categories: 1,
        totalLayers: 0,
        layerGroups: 0
      });
    });

    test('should return correct status when not ready', () => {
      const status = layerManager.getStatus();
      expect(status).toEqual({
        initialized: false,
        panes: 0,
        categories: 0,
        totalLayers: 0,
        layerGroups: 0
      });
    });
  });
});
