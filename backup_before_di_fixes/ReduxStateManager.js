/**
 * ReduxStateManager - Redux Toolkit-based state management system
 * Implements centralized state management with slices, DevTools, and TypeScript support
 * 
 * @fileoverview Redux Toolkit state management for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
import { enhancedEventBus, EventTypes } from './EnhancedEventBus.js';

/**
 * Map state slice
 */
const mapSlice = createSlice({
  name: 'map',
  initialState: {
    center: [0, 0] as [number, number],
    zoom: 10,
    layers: new Map<string, any>(),
    selectedFeatures: [] as string[],
    viewport: { width: 0, height: 0 },
    loading: false,
    error: null as string | null
  },
  reducers: {
    setCenter: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    addLayer: (state, action: PayloadAction<{ id: string; layer: any }>) => {
      state.layers.set(action.payload.id, action.payload.layer);
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      state.layers.delete(action.payload);
    },
    setSelectedFeatures: (state, action: PayloadAction<string[]>) => {
      state.selectedFeatures = action.payload;
    },
    setViewport: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.viewport = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

/**
 * Sidebar state slice
 */
const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: {
    expandedSections: [] as string[],
    selectedItems: new Map<string, string[]>(),
    searchQuery: '',
    filterOptions: {} as Record<string, any>,
    loading: false,
    error: null as string | null
  },
  reducers: {
    toggleSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      const index = state.expandedSections.indexOf(sectionId);
      if (index > -1) {
        state.expandedSections.splice(index, 1);
      } else {
        state.expandedSections.push(sectionId);
      }
    },
    setSelectedItems: (state, action: PayloadAction<{ category: string; items: string[] }>) => {
      state.selectedItems.set(action.payload.category, action.payload.items);
    },
    addSelectedItem: (state, action: PayloadAction<{ category: string; item: string }>) => {
      const { category, item } = action.payload;
      if (!state.selectedItems.has(category)) {
        state.selectedItems.set(category, []);
      }
      const items = state.selectedItems.get(category)!;
      if (!items.includes(item)) {
        items.push(item);
      }
    },
    removeSelectedItem: (state, action: PayloadAction<{ category: string; item: string }>) => {
      const { category, item } = action.payload;
      const items = state.selectedItems.get(category);
      if (items) {
        const index = items.indexOf(item);
        if (index > -1) {
          items.splice(index, 1);
        }
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterOptions: (state, action: PayloadAction<Record<string, any>>) => {
      state.filterOptions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

/**
 * Data state slice
 */
const dataSlice = createSlice({
  name: 'data',
  initialState: {
    categories: new Map<string, any>(),
    loading: new Map<string, boolean>(),
    errors: new Map<string, string>(),
    lastUpdated: new Map<string, number>(),
    cache: new Map<string, any>()
  },
  reducers: {
    setCategoryData: (state, action: PayloadAction<{ category: string; data: any[] }>) => {
      state.categories.set(action.payload.category, action.payload.data);
      state.lastUpdated.set(action.payload.category, Date.now());
    },
    setLoading: (state, action: PayloadAction<{ category: string; loading: boolean }>) => {
      state.loading.set(action.payload.category, action.payload.loading);
    },
    setError: (state, action: PayloadAction<{ category: string; error: string }>) => {
      state.errors.set(action.payload.category, action.payload.error);
    },
    clearError: (state, action: PayloadAction<string>) => {
      state.errors.delete(action.payload);
    },
    setCache: (state, action: PayloadAction<{ key: string; data: any }>) => {
      state.cache.set(action.payload.key, action.payload.data);
    },
    clearCache: (state, action: PayloadAction<string>) => {
      state.cache.delete(action.payload);
    },
    clearAllCache: (state) => {
      state.cache.clear();
    }
  }
});

/**
 * UI state slice
 */
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light' as 'light' | 'dark',
    language: 'en',
    notifications: [] as any[],
    modals: [] as any[],
    loading: false,
    error: null as string | null
  },
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    addNotification: (state, action: PayloadAction<any>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    addModal: (state, action: PayloadAction<any>) => {
      state.modals.push(action.payload);
    },
    removeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },
    clearModals: (state) => {
      state.modals = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

/**
 * Platform state slice
 */
const platformSlice = createSlice({
  name: 'platform',
  initialState: {
    type: 'web' as 'web' | 'mobile' | 'desktop',
    capabilities: {} as Record<string, boolean>,
    connectivity: {
      online: true,
      type: 'unknown' as string
    }
  },
  reducers: {
    setPlatform: (state, action: PayloadAction<'web' | 'mobile' | 'desktop'>) => {
      state.type = action.payload;
    },
    setCapabilities: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.capabilities = action.payload;
    },
    setConnectivity: (state, action: PayloadAction<{ online: boolean; type: string }>) => {
      state.connectivity = action.payload;
    }
  }
});

/**
 * Async thunks for data loading
 */
export const loadDataAsync = createAsyncThunk(
  'data/loadData',
  async (category: string, { rejectWithValue }) => {
    try {
      // Simulate data loading
      const mockData = generateMockData(category);
      await new Promise(resolve => setTimeout(resolve, 100));
      return { category, data: mockData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadDataBatchAsync = createAsyncThunk(
  'data/loadDataBatch',
  async (categories: string[], { rejectWithValue }) => {
    try {
      const results = new Map();
      for (const category of categories) {
        const mockData = generateMockData(category);
        await new Promise(resolve => setTimeout(resolve, 50));
        results.set(category, mockData);
      }
      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Generate mock data for testing
 */
function generateMockData(category: string): any[] {
  const mockData = {
    'ses': [
      { id: 1, name: 'SES Unit 1', type: 'emergency', coordinates: [144.9631, -37.8136] },
      { id: 2, name: 'SES Unit 2', type: 'emergency', coordinates: [144.9631, -37.8136] }
    ],
    'lga': [
      { id: 1, name: 'Local Government Area 1', type: 'boundary', coordinates: [144.9631, -37.8136] },
      { id: 2, name: 'Local Government Area 2', type: 'boundary', coordinates: [144.9631, -37.8136] }
    ],
    'cfa': [
      { id: 1, name: 'CFA Station 1', type: 'fire', coordinates: [144.9631, -37.8136] },
      { id: 2, name: 'CFA Station 2', type: 'fire', coordinates: [144.9631, -37.8136] }
    ],
    'ambulance': [
      { id: 1, name: 'Ambulance Station 1', type: 'medical', coordinates: [144.9631, -37.8136] },
      { id: 2, name: 'Ambulance Station 2', type: 'medical', coordinates: [144.9631, -37.8136] }
    ],
    'police': [
      { id: 1, name: 'Police Station 1', type: 'law', coordinates: [144.9631, -37.8136] },
      { id: 2, name: 'Police Station 2', type: 'law', coordinates: [144.9631, -37.8136] }
    ]
  };

  return mockData[category] || [];
}

/**
 * Configure Redux store
 */
export const store = configureStore({
  reducer: {
    map: mapSlice.reducer,
    sidebar: sidebarSlice.reducer,
    data: dataSlice.reducer,
    ui: uiSlice.reducer,
    platform: platformSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['data.categories', 'data.cache', 'sidebar.selectedItems', 'map.layers']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

/**
 * Redux state manager class
 */
export class ReduxStateManager {
  private store: typeof store;
  private logger: any;
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.store = store;
    // Logger will be set by BaseService constructor
    this.setupEventListeners();
  }

  /**
   * Get current state
   */
  getState() {
    return this.store.getState();
  }

  /**
   * Get specific slice state
   */
  getSliceState(sliceName: string) {
    const state = this.getState();
    return state[sliceName];
  }

  /**
   * Dispatch action
   */
  dispatch(action: any) {
    this.store.dispatch(action);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: Function) {
    return this.store.subscribe(listener);
  }

  /**
   * Subscribe to specific slice changes
   */
  subscribeToSlice(sliceName: string, listener: Function) {
    if (!this.subscribers.has(sliceName)) {
      this.subscribers.set(sliceName, new Set());
    }
    
    this.subscribers.get(sliceName)!.add(listener);
    
    return () => {
      const sliceSubscribers = this.subscribers.get(sliceName);
      if (sliceSubscribers) {
        sliceSubscribers.delete(listener);
      }
    };
  }

  /**
   * Map actions
   */
  mapActions = {
    setCenter: (center: [number, number]) => this.dispatch(mapSlice.actions.setCenter(center)),
    setZoom: (zoom: number) => this.dispatch(mapSlice.actions.setZoom(zoom)),
    addLayer: (id: string, layer: any) => this.dispatch(mapSlice.actions.addLayer({ id, layer })),
    removeLayer: (id: string) => this.dispatch(mapSlice.actions.removeLayer(id)),
    setSelectedFeatures: (features: string[]) => this.dispatch(mapSlice.actions.setSelectedFeatures(features)),
    setViewport: (viewport: { width: number; height: number }) => this.dispatch(mapSlice.actions.setViewport(viewport)),
    setMapLoading: (loading: boolean) => this.dispatch(mapSlice.actions.setLoading(loading)),
    setMapError: (error: string | null) => this.dispatch(mapSlice.actions.setError(error)),
    clearMapError: () => this.dispatch(mapSlice.actions.clearError())
  };

  /**
   * Sidebar actions
   */
  sidebarActions = {
    toggleSection: (sectionId: string) => this.dispatch(sidebarSlice.actions.toggleSection(sectionId)),
    setSelectedItems: (category: string, items: string[]) => this.dispatch(sidebarSlice.actions.setSelectedItems({ category, items })),
    addSelectedItem: (category: string, item: string) => this.dispatch(sidebarSlice.actions.addSelectedItem({ category, item })),
    removeSelectedItem: (category: string, item: string) => this.dispatch(sidebarSlice.actions.removeSelectedItem({ category, item })),
    setSearchQuery: (query: string) => this.dispatch(sidebarSlice.actions.setSearchQuery(query)),
    setFilterOptions: (options: Record<string, any>) => this.dispatch(sidebarSlice.actions.setFilterOptions(options)),
    setSidebarLoading: (loading: boolean) => this.dispatch(sidebarSlice.actions.setLoading(loading)),
    setSidebarError: (error: string | null) => this.dispatch(sidebarSlice.actions.setError(error)),
    clearSidebarError: () => this.dispatch(sidebarSlice.actions.clearError())
  };

  /**
   * Data actions
   */
  dataActions = {
    setCategoryData: (category: string, data: any[]) => this.dispatch(dataSlice.actions.setCategoryData({ category, data })),
    setDataLoading: (category: string, loading: boolean) => this.dispatch(dataSlice.actions.setLoading({ category, loading })),
    setDataError: (category: string, error: string) => this.dispatch(dataSlice.actions.setError({ category, error })),
    clearDataError: (category: string) => this.dispatch(dataSlice.actions.clearError(category)),
    setCache: (key: string, data: any) => this.dispatch(dataSlice.actions.setCache({ key, data })),
    clearCache: (key: string) => this.dispatch(dataSlice.actions.clearCache(key)),
    clearAllCache: () => this.dispatch(dataSlice.actions.clearAllCache()),
    loadData: (category: string) => this.dispatch(loadDataAsync(category)),
    loadDataBatch: (categories: string[]) => this.dispatch(loadDataBatchAsync(categories))
  };

  /**
   * UI actions
   */
  uiActions = {
    setTheme: (theme: 'light' | 'dark') => this.dispatch(uiSlice.actions.setTheme(theme)),
    setLanguage: (language: string) => this.dispatch(uiSlice.actions.setLanguage(language)),
    addNotification: (notification: any) => this.dispatch(uiSlice.actions.addNotification(notification)),
    removeNotification: (id: string) => this.dispatch(uiSlice.actions.removeNotification(id)),
    clearNotifications: () => this.dispatch(uiSlice.actions.clearNotifications()),
    addModal: (modal: any) => this.dispatch(uiSlice.actions.addModal(modal)),
    removeModal: (id: string) => this.dispatch(uiSlice.actions.removeModal(id)),
    clearModals: () => this.dispatch(uiSlice.actions.clearModals()),
    setUILoading: (loading: boolean) => this.dispatch(uiSlice.actions.setLoading(loading)),
    setUIError: (error: string | null) => this.dispatch(uiSlice.actions.setError(error)),
    clearUIError: () => this.dispatch(uiSlice.actions.clearError())
  };

  /**
   * Platform actions
   */
  platformActions = {
    setPlatform: (type: 'web' | 'mobile' | 'desktop') => this.dispatch(platformSlice.actions.setPlatform(type)),
    setCapabilities: (capabilities: Record<string, boolean>) => this.dispatch(platformSlice.actions.setCapabilities(capabilities)),
    setConnectivity: (connectivity: { online: boolean; type: string }) => this.dispatch(platformSlice.actions.setConnectivity(connectivity))
  };

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    // Listen for state changes and emit events
    this.store.subscribe(() => {
      const state = this.getState();
      
      // Emit state change event
      enhancedEventBus.emit(EventTypes.STATE_UPDATED, {
        state: this.sanitizeState(state),
        timestamp: Date.now()
      });
    });

    // Listen for specific slice changes
    this.store.subscribe(() => {
      const state = this.getState();
      
      // Notify slice subscribers
      for (const [sliceName, subscribers] of this.subscribers) {
        const sliceState = state[sliceName];
        subscribers.forEach(listener => {
          try {
            listener(sliceState);
          } catch (error) {
            this.logger.error('Slice subscriber error', {
              sliceName,
              error: error.message
            });
          }
        });
      }
    });
  }

  /**
   * Sanitize state for logging
   */
  private sanitizeState(state: any): any {
    const sanitized = { ...state };
    
    // Remove sensitive data
    if (sanitized.data && sanitized.data.cache) {
      sanitized.data.cache = new Map(); // Clear cache data
    }
    
    return sanitized;
  }

  /**
   * Get Redux DevTools extension
   */
  getDevTools() {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      return (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    }
    return null;
  }

  /**
   * Time travel debugging
   */
  timeTravel(actionIndex: number) {
    const devTools = this.getDevTools();
    if (devTools) {
      devTools.send('JUMP_TO_ACTION', actionIndex);
    }
  }

  /**
   * Reset state to initial
   */
  resetState() {
    this.store.dispatch({ type: 'RESET_STATE' });
  }

  /**
   * Export state for debugging
   */
  exportState() {
    return JSON.stringify(this.getState(), null, 2);
  }

  /**
   * Import state from JSON
   */
  importState(jsonState: string) {
    try {
      const state = JSON.parse(jsonState);
      this.store.dispatch({ type: 'IMPORT_STATE', payload: state });
    } catch (error) {
      this.logger.error('Failed to import state', { error: error.message });
    }
  }
}

// Export singleton instance
export const reduxStateManager = () => {
  console.warn('reduxStateManager: Legacy function called. Use DI container to get ReduxStateManager instance.');
  throw new Error('Legacy function not available. Use DI container to get ReduxStateManager instance.');
};

// Export action creators
export const mapActions = reduxStateManager.mapActions;
export const sidebarActions = reduxStateManager.sidebarActions;
export const dataActions = reduxStateManager.dataActions;
export const uiActions = reduxStateManager.uiActions;
export const platformActions = reduxStateManager.platformActions;

// Export selectors
export const selectMapState = (state: any) => state.map;
export const selectSidebarState = (state: any) => state.sidebar;
export const selectDataState = (state: any) => state.data;
export const selectUIState = (state: any) => state.ui;
export const selectPlatformState = (state: any) => state.platform;

// Export store for direct access if needed
export { store };
