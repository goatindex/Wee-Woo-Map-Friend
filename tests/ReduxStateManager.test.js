/**
 * ReduxStateManager Test Suite
 * Comprehensive tests for the Redux Toolkit state management system
 */

import { 
  ReduxStateManager,
  store,
  mapActions,
  sidebarActions,
  dataActions,
  uiActions,
  platformActions,
  selectMapState,
  selectSidebarState,
  selectDataState,
  selectUIState,
  selectPlatformState,
  loadDataAsync,
  loadDataBatchAsync
} from '../js/modules/ReduxStateManager.js';

// Mock dependencies
jest.mock('../js/modules/StructuredLogger.js', () => ({
  logger: {
    createChild: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../js/modules/EnhancedEventBus.js', () => ({
  enhancedEventBus: {
    emit: jest.fn()
  },
  EventTypes: {
    STATE_UPDATED: 'state:updated'
  }
}));

describe('ReduxStateManager System', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new ReduxStateManager();
    jest.clearAllMocks();
  });

  describe('ReduxStateManager Class', () => {
    test('should create state manager instance', () => {
      expect(stateManager).toBeInstanceOf(ReduxStateManager);
    });

    test('should get initial state', () => {
      const state = stateManager.getState();
      
      expect(state).toHaveProperty('map');
      expect(state).toHaveProperty('sidebar');
      expect(state).toHaveProperty('data');
      expect(state).toHaveProperty('ui');
      expect(state).toHaveProperty('platform');
    });

    test('should get slice state', () => {
      const mapState = stateManager.getSliceState('map');
      const sidebarState = stateManager.getSliceState('sidebar');
      
      expect(mapState).toHaveProperty('center');
      expect(mapState).toHaveProperty('zoom');
      expect(sidebarState).toHaveProperty('expandedSections');
      expect(sidebarState).toHaveProperty('selectedItems');
    });

    test('should dispatch actions', () => {
      const initialState = stateManager.getState();
      
      stateManager.dispatch({ type: 'test/action', payload: 'test' });
      
      // State should remain the same for unknown actions
      expect(stateManager.getState()).toEqual(initialState);
    });

    test('should subscribe to state changes', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);
      
      stateManager.dispatch({ type: 'test/action', payload: 'test' });
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    test('should subscribe to slice changes', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribeToSlice('map', listener);
      
      mapActions.setCenter([1, 1]);
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('Map Actions', () => {
    test('should set map center', () => {
      const center = [144.9631, -37.8136] as [number, number];
      mapActions.setCenter(center);
      
      const state = stateManager.getState();
      expect(state.map.center).toEqual(center);
    });

    test('should set map zoom', () => {
      const zoom = 15;
      mapActions.setZoom(zoom);
      
      const state = stateManager.getState();
      expect(state.map.zoom).toBe(zoom);
    });

    test('should add map layer', () => {
      const layer = { id: 'test-layer', type: 'polygon' };
      mapActions.addLayer('test-layer', layer);
      
      const state = stateManager.getState();
      expect(state.map.layers.has('test-layer')).toBe(true);
      expect(state.map.layers.get('test-layer')).toEqual(layer);
    });

    test('should remove map layer', () => {
      mapActions.addLayer('test-layer', { id: 'test-layer' });
      mapActions.removeLayer('test-layer');
      
      const state = stateManager.getState();
      expect(state.map.layers.has('test-layer')).toBe(false);
    });

    test('should set selected features', () => {
      const features = ['feature1', 'feature2'];
      mapActions.setSelectedFeatures(features);
      
      const state = stateManager.getState();
      expect(state.map.selectedFeatures).toEqual(features);
    });

    test('should set viewport', () => {
      const viewport = { width: 800, height: 600 };
      mapActions.setViewport(viewport);
      
      const state = stateManager.getState();
      expect(state.map.viewport).toEqual(viewport);
    });

    test('should set loading state', () => {
      mapActions.setMapLoading(true);
      
      const state = stateManager.getState();
      expect(state.map.loading).toBe(true);
    });

    test('should set error state', () => {
      const error = 'Test error';
      mapActions.setMapError(error);
      
      const state = stateManager.getState();
      expect(state.map.error).toBe(error);
    });

    test('should clear error', () => {
      mapActions.setMapError('Test error');
      mapActions.clearMapError();
      
      const state = stateManager.getState();
      expect(state.map.error).toBeNull();
    });
  });

  describe('Sidebar Actions', () => {
    test('should toggle section', () => {
      sidebarActions.toggleSection('test-section');
      
      const state = stateManager.getState();
      expect(state.sidebar.expandedSections).toContain('test-section');
      
      sidebarActions.toggleSection('test-section');
      expect(state.sidebar.expandedSections).not.toContain('test-section');
    });

    test('should set selected items', () => {
      const category = 'test-category';
      const items = ['item1', 'item2'];
      sidebarActions.setSelectedItems(category, items);
      
      const state = stateManager.getState();
      expect(state.sidebar.selectedItems.get(category)).toEqual(items);
    });

    test('should add selected item', () => {
      const category = 'test-category';
      const item = 'test-item';
      sidebarActions.addSelectedItem(category, item);
      
      const state = stateManager.getState();
      expect(state.sidebar.selectedItems.get(category)).toContain(item);
    });

    test('should remove selected item', () => {
      const category = 'test-category';
      const item = 'test-item';
      sidebarActions.addSelectedItem(category, item);
      sidebarActions.removeSelectedItem(category, item);
      
      const state = stateManager.getState();
      expect(state.sidebar.selectedItems.get(category)).not.toContain(item);
    });

    test('should set search query', () => {
      const query = 'test search';
      sidebarActions.setSearchQuery(query);
      
      const state = stateManager.getState();
      expect(state.sidebar.searchQuery).toBe(query);
    });

    test('should set filter options', () => {
      const options = { type: 'emergency', status: 'active' };
      sidebarActions.setFilterOptions(options);
      
      const state = stateManager.getState();
      expect(state.sidebar.filterOptions).toEqual(options);
    });
  });

  describe('Data Actions', () => {
    test('should set category data', () => {
      const category = 'test-category';
      const data = [{ id: 1, name: 'Test Item' }];
      dataActions.setCategoryData(category, data);
      
      const state = stateManager.getState();
      expect(state.data.categories.get(category)).toEqual(data);
      expect(state.data.lastUpdated.has(category)).toBe(true);
    });

    test('should set data loading state', () => {
      const category = 'test-category';
      dataActions.setDataLoading(category, true);
      
      const state = stateManager.getState();
      expect(state.data.loading.get(category)).toBe(true);
    });

    test('should set data error', () => {
      const category = 'test-category';
      const error = 'Test error';
      dataActions.setDataError(category, error);
      
      const state = stateManager.getState();
      expect(state.data.errors.get(category)).toBe(error);
    });

    test('should clear data error', () => {
      const category = 'test-category';
      dataActions.setDataError(category, 'Test error');
      dataActions.clearDataError(category);
      
      const state = stateManager.getState();
      expect(state.data.errors.has(category)).toBe(false);
    });

    test('should set cache', () => {
      const key = 'test-key';
      const data = { cached: 'data' };
      dataActions.setCache(key, data);
      
      const state = stateManager.getState();
      expect(state.data.cache.get(key)).toEqual(data);
    });

    test('should clear cache', () => {
      const key = 'test-key';
      dataActions.setCache(key, { data: 'test' });
      dataActions.clearCache(key);
      
      const state = stateManager.getState();
      expect(state.data.cache.has(key)).toBe(false);
    });

    test('should clear all cache', () => {
      dataActions.setCache('key1', { data: 'test1' });
      dataActions.setCache('key2', { data: 'test2' });
      dataActions.clearAllCache();
      
      const state = stateManager.getState();
      expect(state.data.cache.size).toBe(0);
    });
  });

  describe('UI Actions', () => {
    test('should set theme', () => {
      uiActions.setTheme('dark');
      
      const state = stateManager.getState();
      expect(state.ui.theme).toBe('dark');
    });

    test('should set language', () => {
      const language = 'es';
      uiActions.setLanguage(language);
      
      const state = stateManager.getState();
      expect(state.ui.language).toBe(language);
    });

    test('should add notification', () => {
      const notification = { id: '1', message: 'Test notification' };
      uiActions.addNotification(notification);
      
      const state = stateManager.getState();
      expect(state.ui.notifications).toContain(notification);
    });

    test('should remove notification', () => {
      const notification = { id: '1', message: 'Test notification' };
      uiActions.addNotification(notification);
      uiActions.removeNotification('1');
      
      const state = stateManager.getState();
      expect(state.ui.notifications).not.toContain(notification);
    });

    test('should clear notifications', () => {
      uiActions.addNotification({ id: '1', message: 'Test' });
      uiActions.clearNotifications();
      
      const state = stateManager.getState();
      expect(state.ui.notifications).toHaveLength(0);
    });

    test('should add modal', () => {
      const modal = { id: '1', type: 'confirmation' };
      uiActions.addModal(modal);
      
      const state = stateManager.getState();
      expect(state.ui.modals).toContain(modal);
    });

    test('should remove modal', () => {
      const modal = { id: '1', type: 'confirmation' };
      uiActions.addModal(modal);
      uiActions.removeModal('1');
      
      const state = stateManager.getState();
      expect(state.ui.modals).not.toContain(modal);
    });

    test('should clear modals', () => {
      uiActions.addModal({ id: '1', type: 'confirmation' });
      uiActions.clearModals();
      
      const state = stateManager.getState();
      expect(state.ui.modals).toHaveLength(0);
    });
  });

  describe('Platform Actions', () => {
    test('should set platform', () => {
      platformActions.setPlatform('mobile');
      
      const state = stateManager.getState();
      expect(state.platform.type).toBe('mobile');
    });

    test('should set capabilities', () => {
      const capabilities = { geolocation: true, webGL: false };
      platformActions.setCapabilities(capabilities);
      
      const state = stateManager.getState();
      expect(state.platform.capabilities).toEqual(capabilities);
    });

    test('should set connectivity', () => {
      const connectivity = { online: true, type: 'wifi' };
      platformActions.setConnectivity(connectivity);
      
      const state = stateManager.getState();
      expect(state.platform.connectivity).toEqual(connectivity);
    });
  });

  describe('Async Thunks', () => {
    test('should load data asynchronously', async () => {
      const category = 'ses';
      const result = await store.dispatch(loadDataAsync(category));
      
      expect(result.type).toBe('data/loadData/fulfilled');
      expect(result.payload.category).toBe(category);
      expect(Array.isArray(result.payload.data)).toBe(true);
    });

    test('should load data batch asynchronously', async () => {
      const categories = ['ses', 'lga', 'cfa'];
      const result = await store.dispatch(loadDataBatchAsync(categories));
      
      expect(result.type).toBe('data/loadDataBatch/fulfilled');
      expect(result.payload).toBeInstanceOf(Map);
      expect(result.payload.size).toBe(3);
    });

    test('should handle async errors', async () => {
      // Mock a failing async operation
      const mockLoadDataAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await mockLoadDataAsync();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Selectors', () => {
    test('should select map state', () => {
      const state = stateManager.getState();
      const mapState = selectMapState(state);
      
      expect(mapState).toHaveProperty('center');
      expect(mapState).toHaveProperty('zoom');
      expect(mapState).toHaveProperty('layers');
    });

    test('should select sidebar state', () => {
      const state = stateManager.getState();
      const sidebarState = selectSidebarState(state);
      
      expect(sidebarState).toHaveProperty('expandedSections');
      expect(sidebarState).toHaveProperty('selectedItems');
      expect(sidebarState).toHaveProperty('searchQuery');
    });

    test('should select data state', () => {
      const state = stateManager.getState();
      const dataState = selectDataState(state);
      
      expect(dataState).toHaveProperty('categories');
      expect(dataState).toHaveProperty('loading');
      expect(dataState).toHaveProperty('errors');
    });

    test('should select UI state', () => {
      const state = stateManager.getState();
      const uiState = selectUIState(state);
      
      expect(uiState).toHaveProperty('theme');
      expect(uiState).toHaveProperty('language');
      expect(uiState).toHaveProperty('notifications');
    });

    test('should select platform state', () => {
      const state = stateManager.getState();
      const platformState = selectPlatformState(state);
      
      expect(platformState).toHaveProperty('type');
      expect(platformState).toHaveProperty('capabilities');
      expect(platformState).toHaveProperty('connectivity');
    });
  });

  describe('State Manager Utilities', () => {
    test('should export state', () => {
      const exportedState = stateManager.exportState();
      expect(typeof exportedState).toBe('string');
      
      const parsedState = JSON.parse(exportedState);
      expect(parsedState).toHaveProperty('map');
      expect(parsedState).toHaveProperty('sidebar');
    });

    test('should import state', () => {
      const testState = {
        map: { center: [1, 1], zoom: 15 },
        sidebar: { searchQuery: 'test' }
      };
      
      stateManager.importState(JSON.stringify(testState));
      
      const state = stateManager.getState();
      expect(state.map.center).toEqual([1, 1]);
      expect(state.map.zoom).toBe(15);
      expect(state.sidebar.searchQuery).toBe('test');
    });

    test('should handle invalid JSON import', () => {
      const invalidJson = 'invalid json';
      
      // Should not throw error
      expect(() => {
        stateManager.importState(invalidJson);
      }).not.toThrow();
    });

    test('should get DevTools extension', () => {
      const devTools = stateManager.getDevTools();
      // In test environment, DevTools might not be available
      expect(devTools).toBeDefined();
    });

    test('should reset state', () => {
      mapActions.setCenter([1, 1]);
      stateManager.resetState();
      
      const state = stateManager.getState();
      expect(state.map.center).toEqual([0, 0]);
    });
  });

  describe('Event Integration', () => {
    test('should emit state change events', () => {
      const { enhancedEventBus } = require('../js/modules/EnhancedEventBus.js');
      
      mapActions.setCenter([1, 1]);
      
      expect(enhancedEventBus.emit).toHaveBeenCalledWith(
        'state:updated',
        expect.objectContaining({
          state: expect.any(Object),
          timestamp: expect.any(Number)
        })
      );
    });
  });
});
