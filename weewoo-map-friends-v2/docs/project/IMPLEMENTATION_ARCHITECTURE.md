# 🏗️ **Implementation Architecture - WeeWoo Map Friends V2**

## **Overview**

This document outlines the detailed implementation architecture for WeeWoo Map Friends V2, including component specifications, service layer patterns, state management strategies, and utility implementations across all three deployment platforms.

## **Multi-Platform Architecture**

### **Platform-Specific Implementations**

#### **GitHub.io (Phase 1) - Core Functionality**
- **Components**: Map display, layer management, basic routing, export
- **Services**: Static data services, offline storage
- **Stores**: Map state, layer state, export state
- **Utilities**: Configuration, logging, storage, validation

#### **Web App (Phase 2) - Enhanced Features**
- **Components**: All GitHub.io components + weather, alerts, drawing tools
- **Services**: API services, real-time data, backend integration
- **Stores**: Extended state management for all features
- **Utilities**: Enhanced utilities for backend integration

#### **Native Apps (Phase 3) - Native Capabilities**
- **Components**: All web app components + native device integration
- **Services**: Native API services, push notifications, device features
- **Stores**: Native state management with device integration
- **Utilities**: Native utilities for device-specific functionality

## **Component Architecture**

### **Core Components (All Platforms)**

#### **Map Component (`src/components/Map/`)**
```javascript
// MapComponent.js - Main map container
export class MapComponent {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.map = null;
    this.layers = new Map();
    this.controls = new Map();
  }
  
  // Core methods
  initialize() { /* Initialize Leaflet map */ }
  addLayer(layerConfig) { /* Add map layer */ }
  removeLayer(layerId) { /* Remove map layer */ }
  toggleLayer(layerId) { /* Toggle layer visibility */ }
  exportMap(format) { /* Export map as PDF/image */ }
}

// LayerManager.js - Layer management
export class LayerManager {
  constructor(map) {
    this.map = map;
    this.activeLayers = new Set();
    this.layerConfigs = new Map();
  }
  
  // Layer management methods
  loadLayer(config) { /* Load GeoJSON layer */ }
  updateLayerStyle(layerId, style) { /* Update layer styling */ }
  getLayerBounds(layerId) { /* Get layer bounds */ }
}

// MapControls.js - Map controls
export class MapControls {
  constructor(map) {
    this.map = map;
    this.controls = new Map();
  }
  
  // Control methods
  addGeocoder() { /* Add address search */ }
  addMeasureTool() { /* Add distance measurement */ }
  addFullscreen() { /* Add fullscreen toggle */ }
  addLocate() { /* Add GPS location */ }
}
```

#### **Sidebar Component (`src/components/Sidebar/`)**
```javascript
// SidebarComponent.js - Main sidebar container
export class SidebarComponent {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.sections = new Map();
    this.activeItems = new Set();
  }
  
  // Sidebar methods
  addSection(sectionConfig) { /* Add sidebar section */ }
  toggleItem(itemId) { /* Toggle sidebar item */ }
  updateActiveList() { /* Update active items list */ }
  collapseSection(sectionId) { /* Collapse sidebar section */ }
}

// LayerList.js - Layer management sidebar
export class LayerList {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.layers = new Map();
  }
  
  // Layer list methods
  addLayerItem(layerConfig) { /* Add layer to list */ }
  updateLayerStatus(layerId, status) { /* Update layer status */ }
  getActiveLayers() { /* Get active layers */ }
}

// ExportPanel.js - Export functionality
export class ExportPanel {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.exportFormats = ['pdf', 'png', 'jpg'];
  }
  
  // Export methods
  exportMap(format) { /* Export map in specified format */ }
  downloadFile(data, filename) { /* Download file */ }
  generatePDF() { /* Generate PDF export */ }
  generateImage() { /* Generate image export */ }
}
```

#### **Weather Component (`src/components/Weather/`) - Web App Only**
```javascript
// WeatherComponent.js - Weather display
export class WeatherComponent {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.weatherService = null;
    this.currentWeather = null;
  }
  
  // Weather methods
  initialize() { /* Initialize weather display */ }
  updateWeather(location) { /* Update weather data */ }
  displayForecast(forecast) { /* Display weather forecast */ }
  handleWeatherError(error) { /* Handle weather API errors */ }
}

// WeatherChart.js - Weather visualization
export class WeatherChart {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.chart = null;
  }
  
  // Chart methods
  createChart() { /* Create Chart.js visualization */ }
  updateData(newData) { /* Update chart data */ }
  exportChart() { /* Export chart as image */ }
}
```

#### **Alerts Component (`src/components/Alerts/`) - Web App Only**
```javascript
// AlertsComponent.js - Emergency alerts display
export class AlertsComponent {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.alertsService = null;
    this.activeAlerts = [];
  }
  
  // Alerts methods
  initialize() { /* Initialize alerts display */ }
  fetchAlerts() { /* Fetch emergency alerts */ }
  displayAlert(alert) { /* Display individual alert */ }
  filterAlerts(criteria) { /* Filter alerts by criteria */ }
}

// AlertItem.js - Individual alert display
export class AlertItem {
  constructor(alert, container) {
    this.alert = alert;
    this.container = container;
  }
  
  // Alert item methods
  render() { /* Render alert item */ }
  updateSeverity(severity) { /* Update alert severity */ }
  markAsRead() { /* Mark alert as read */ }
}
```

### **Platform-Specific Components**

#### **Native App Components (`src/components/Native/`) - Native Apps Only**
```javascript
// NativeLocationComponent.js - Native GPS location
export class NativeLocationComponent {
  constructor() {
    this.capacitor = null;
    this.currentLocation = null;
  }
  
  // Native location methods
  async getCurrentLocation() { /* Get GPS location */ }
  async watchLocation(callback) { /* Watch location changes */ }
  async requestPermissions() { /* Request location permissions */ }
}

// NativeNotificationComponent.js - Push notifications
export class NativeNotificationComponent {
  constructor() {
    this.capacitor = null;
    this.isEnabled = false;
  }
  
  // Notification methods
  async requestPermission() { /* Request notification permission */ }
  async sendNotification(alert) { /* Send push notification */ }
  async scheduleNotification(alert, time) { /* Schedule notification */ }
}
```

## **Service Layer Architecture**

### **Base Service Pattern**
```javascript
// BaseService.js - Base service class
export class BaseService {
  constructor(config) {
    this.config = config;
    this.circuitBreaker = null;
    this.retryStrategy = null;
    this.cache = null;
  }
  
  // Base methods
  async request(url, options) { /* Make HTTP request */ }
  handleError(error) { /* Handle service errors */ }
  getCacheKey(url, params) { /* Generate cache key */ }
  isCircuitOpen() { /* Check circuit breaker status */ }
}

// ServiceFactory.js - Service factory
export class ServiceFactory {
  static createService(type, config) {
    switch (type) {
      case 'weather':
        return new WeatherService(config);
      case 'alerts':
        return new AlertsService(config);
      case 'geocoding':
        return new GeocodingService(config);
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  }
}
```

### **Core Services (All Platforms)**

#### **Map Data Service (`src/services/MapDataService.js`)**
```javascript
export class MapDataService extends BaseService {
  constructor(config) {
    super(config);
    this.geoJsonCache = new Map();
    this.loadingPromises = new Map();
  }
  
  // Map data methods
  async loadGeoJsonLayer(layerId) { /* Load GeoJSON layer */ }
  async getLayerBounds(layerId) { /* Get layer bounds */ }
  async searchFeatures(query, layerId) { /* Search features */ }
  async getFeatureInfo(featureId, layerId) { /* Get feature info */ }
  
  // Caching methods
  cacheGeoJson(layerId, data) { /* Cache GeoJSON data */ }
  getCachedGeoJson(layerId) { /* Get cached GeoJSON */ }
  clearCache() { /* Clear all cached data */ }
}
```

#### **Export Service (`src/services/ExportService.js`)**
```javascript
export class ExportService extends BaseService {
  constructor(config) {
    super(config);
    this.html2canvas = null;
    this.jsPDF = null;
  }
  
  // Export methods
  async exportToPDF(mapElement, options) { /* Export map to PDF */ }
  async exportToImage(mapElement, format) { /* Export map to image */ }
  async createZipFile(files) { /* Create ZIP file */ }
  async downloadFile(data, filename) { /* Download file */ }
  
  // Utility methods
  generateFilename(format) { /* Generate filename */ }
  validateExportOptions(options) { /* Validate export options */ }
}
```

### **Web App Services (Web App Only)**

#### **Weather Service (`src/services/WeatherService.js`)**
```javascript
export class WeatherService extends BaseService {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }
  
  // Weather methods
  async getCurrentWeather(location) { /* Get current weather */ }
  async getForecast(location, days) { /* Get weather forecast */ }
  async getWeatherAlerts(location) { /* Get weather alerts */ }
  
  // Data processing
  processWeatherData(rawData) { /* Process weather data */ }
  formatTemperature(temp, unit) { /* Format temperature */ }
  getWeatherIcon(condition) { /* Get weather icon */ }
}
```

#### **Alerts Service (`src/services/AlertsService.js`)**
```javascript
export class AlertsService extends BaseService {
  constructor(config) {
    super(config);
    this.apiUrl = config.apiUrl;
    this.pollingInterval = config.pollingInterval;
  }
  
  // Alerts methods
  async getEmergencyAlerts(region) { /* Get emergency alerts */ }
  async subscribeToAlerts(callback) { /* Subscribe to alert updates */ }
  async filterAlertsBySeverity(alerts, severity) { /* Filter by severity */ }
  
  // Real-time updates
  startPolling() { /* Start polling for alerts */ }
  stopPolling() { /* Stop polling */ }
  handleAlertUpdate(alert) { /* Handle alert update */ }
}
```

### **Native App Services (Native Apps Only)**

#### **Native Location Service (`src/services/NativeLocationService.js`)**
```javascript
export class NativeLocationService extends BaseService {
  constructor(config) {
    super(config);
    this.capacitor = config.capacitor;
    this.watchId = null;
  }
  
  // Native location methods
  async getCurrentPosition() { /* Get current GPS position */ }
  async watchPosition(callback) { /* Watch position changes */ }
  async clearWatch() { /* Clear position watch */ }
  async requestPermissions() { /* Request location permissions */ }
  
  // Location utilities
  calculateDistance(pos1, pos2) { /* Calculate distance */ }
  formatCoordinates(lat, lng) { /* Format coordinates */ }
}
```

#### **Native Notification Service (`src/services/NativeNotificationService.js`)**
```javascript
export class NativeNotificationService extends BaseService {
  constructor(config) {
    super(config);
    this.capacitor = config.capacitor;
    this.isEnabled = false;
  }
  
  // Notification methods
  async requestPermission() { /* Request notification permission */ }
  async sendNotification(title, body, data) { /* Send notification */ }
  async scheduleNotification(notification, scheduleTime) { /* Schedule notification */ }
  async cancelNotification(notificationId) { /* Cancel notification */ }
  
  // Notification utilities
  createEmergencyAlert(alert) { /* Create emergency alert notification */ }
  formatNotificationData(alert) { /* Format notification data */ }
}
```

## **State Management Architecture**

### **Zustand Store Pattern**
```javascript
// BaseStore.js - Base store class
export class BaseStore {
  constructor(name, initialState) {
    this.name = name;
    this.initialState = initialState;
    this.store = null;
  }
  
  // Base methods
  createStore() { /* Create Zustand store */ }
  getState() { /* Get current state */ }
  setState(newState) { /* Set new state */ }
  subscribe(callback) { /* Subscribe to state changes */ }
  reset() { /* Reset to initial state */ }
}
```

### **Core Stores (All Platforms)**

#### **Map Store (`src/stores/mapStore.js`)**
```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useMapStore = create(
  devtools(
    (set, get) => ({
      // State
      map: null,
      center: [-37.8136, 144.9631],
      zoom: 8,
      activeLayers: new Set(),
      layerConfigs: new Map(),
      isLoading: false,
      error: null,
      
      // Actions
      setMap: (map) => set({ map }),
      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      addLayer: (layerId, config) => set((state) => ({
        activeLayers: new Set([...state.activeLayers, layerId]),
        layerConfigs: new Map([...state.layerConfigs, [layerId, config]])
      })),
      removeLayer: (layerId) => set((state) => {
        const newActiveLayers = new Set(state.activeLayers);
        const newLayerConfigs = new Map(state.layerConfigs);
        newActiveLayers.delete(layerId);
        newLayerConfigs.delete(layerId);
        return { activeLayers: newActiveLayers, layerConfigs: newLayerConfigs };
      }),
      toggleLayer: (layerId) => set((state) => {
        const newActiveLayers = new Set(state.activeLayers);
        if (newActiveLayers.has(layerId)) {
          newActiveLayers.delete(layerId);
        } else {
          newActiveLayers.add(layerId);
        }
        return { activeLayers: newActiveLayers };
      }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set({
        map: null,
        center: [-37.8136, 144.9631],
        zoom: 8,
        activeLayers: new Set(),
        layerConfigs: new Map(),
        isLoading: false,
        error: null
      })
    }),
    { name: 'map-store' }
  )
);
```

#### **Export Store (`src/stores/exportStore.js`)**
```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useExportStore = create(
  devtools(
    (set, get) => ({
      // State
      isExporting: false,
      exportFormat: 'pdf',
      exportOptions: {
        quality: 'high',
        includeLayers: true,
        includeLegend: true
      },
      exportHistory: [],
      error: null,
      
      // Actions
      setExporting: (isExporting) => set({ isExporting }),
      setExportFormat: (format) => set({ exportFormat: format }),
      updateExportOptions: (options) => set((state) => ({
        exportOptions: { ...state.exportOptions, ...options }
      })),
      addToHistory: (exportItem) => set((state) => ({
        exportHistory: [...state.exportHistory, exportItem]
      })),
      clearHistory: () => set({ exportHistory: [] }),
      setError: (error) => set({ error }),
      reset: () => set({
        isExporting: false,
        exportFormat: 'pdf',
        exportOptions: {
          quality: 'high',
          includeLayers: true,
          includeLegend: true
        },
        exportHistory: [],
        error: null
      })
    }),
    { name: 'export-store' }
  )
);
```

### **Web App Stores (Web App Only)**

#### **Weather Store (`src/stores/weatherStore.js`)**
```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useWeatherStore = create(
  devtools(
    (set, get) => ({
      // State
      currentWeather: null,
      forecast: null,
      alerts: [],
      isLoading: false,
      lastUpdated: null,
      error: null,
      
      // Actions
      setCurrentWeather: (weather) => set({ 
        currentWeather: weather,
        lastUpdated: new Date()
      }),
      setForecast: (forecast) => set({ forecast }),
      setAlerts: (alerts) => set({ alerts }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      updateWeather: (location) => {
        // Trigger weather update
        set({ isLoading: true, error: null });
      },
      reset: () => set({
        currentWeather: null,
        forecast: null,
        alerts: [],
        isLoading: false,
        lastUpdated: null,
        error: null
      })
    }),
    { name: 'weather-store' }
  )
);
```

## **Utility Architecture**

### **Core Utilities (All Platforms)**

#### **Configuration Utility (`src/utils/Config.js`)**
```javascript
export class Config {
  constructor() {
    this.config = this.loadConfig();
  }
  
  // Configuration methods
  loadConfig() { /* Load configuration from environment */ }
  get(key, defaultValue) { /* Get configuration value */ }
  set(key, value) { /* Set configuration value */ }
  isFeatureEnabled(feature) { /* Check if feature is enabled */ }
  
  // Platform detection
  isGitHubMode() { /* Check if running in GitHub mode */ }
  isWebAppMode() { /* Check if running in web app mode */ }
  isNativeMode() { /* Check if running in native mode */ }
  
  // Feature flags
  getFeatureFlags() { /* Get all feature flags */ }
  updateFeatureFlags(flags) { /* Update feature flags */ }
}

// Singleton instance
export const config = new Config();
```

#### **Logger Utility (`src/utils/Logger.js`)**
```javascript
export class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }
  
  // Logging methods
  error(message, ...args) { /* Log error message */ }
  warn(message, ...args) { /* Log warning message */ }
  info(message, ...args) { /* Log info message */ }
  debug(message, ...args) { /* Log debug message */ }
  
  // Utility methods
  setLevel(level) { /* Set logging level */ }
  isLevelEnabled(level) { /* Check if level is enabled */ }
  formatMessage(level, message, ...args) { /* Format log message */ }
}

// Singleton instance
export const logger = new Logger(process.env.NODE_ENV === 'development' ? 'debug' : 'info');
```

#### **Storage Utility (`src/utils/Storage.js`)**
```javascript
export class Storage {
  constructor() {
    this.storage = this.detectStorage();
  }
  
  // Storage methods
  async set(key, value) { /* Set storage value */ }
  async get(key, defaultValue) { /* Get storage value */ }
  async remove(key) { /* Remove storage value */ }
  async clear() { /* Clear all storage */ }
  async keys() { /* Get all storage keys */ }
  
  // Utility methods
  detectStorage() { /* Detect available storage */ }
  isAvailable() { /* Check if storage is available */ }
  getSize() { /* Get storage size */ }
  getQuota() { /* Get storage quota */ }
}

// Singleton instance
export const storage = new Storage();
```

### **Platform-Specific Utilities**

#### **Native Utilities (`src/utils/Native.js`) - Native Apps Only**
```javascript
export class NativeUtils {
  constructor() {
    this.capacitor = null;
    this.deviceInfo = null;
  }
  
  // Device methods
  async getDeviceInfo() { /* Get device information */ }
  async getNetworkStatus() { /* Get network status */ }
  async requestPermissions(permissions) { /* Request permissions */ }
  
  // Native features
  async vibrate(pattern) { /* Trigger haptic feedback */ }
  async shareContent(content) { /* Share content */ }
  async openUrl(url) { /* Open URL in browser */ }
  
  // Platform detection
  isIOS() { /* Check if running on iOS */ }
  isAndroid() { /* Check if running on Android */ }
  getPlatform() { /* Get current platform */ }
}
```

## **Implementation Patterns**

### **Component Lifecycle Pattern**
```javascript
export class ComponentBase {
  constructor(container, options) {
    this.container = container;
    this.options = options;
    this.isInitialized = false;
    this.isDestroyed = false;
  }
  
  // Lifecycle methods
  async initialize() { /* Initialize component */ }
  async render() { /* Render component */ }
  async update() { /* Update component */ }
  async destroy() { /* Destroy component */ }
  
  // Event handling
  addEventListener(event, handler) { /* Add event listener */ }
  removeEventListener(event, handler) { /* Remove event listener */ }
  emit(event, data) { /* Emit event */ }
}
```

### **Service Integration Pattern**
```javascript
export class ServiceIntegration {
  constructor(services) {
    this.services = services;
    this.circuitBreakers = new Map();
  }
  
  // Integration methods
  async callService(serviceName, method, ...args) { /* Call service method */ }
  async callMultipleServices(serviceCalls) { /* Call multiple services */ }
  handleServiceError(serviceName, error) { /* Handle service error */ }
  
  // Circuit breaker
  isServiceAvailable(serviceName) { /* Check if service is available */ }
  resetCircuitBreaker(serviceName) { /* Reset circuit breaker */ }
}
```

## **Error Handling Strategy**

### **Error Types**
```javascript
export class AppError extends Error {
  constructor(message, code, context) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }
}

export class ServiceError extends AppError {
  constructor(message, service, status) {
    super(message, 'SERVICE_ERROR', { service, status });
    this.name = 'ServiceError';
  }
}

export class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}
```

### **Error Handling Utilities**
```javascript
export class ErrorHandler {
  static handle(error) { /* Handle application errors */ }
  static log(error) { /* Log error */ }
  static notify(error) { /* Notify user of error */ }
  static recover(error) { /* Attempt error recovery */ }
}
```

## **Performance Optimization**

### **Lazy Loading Pattern**
```javascript
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }
  
  // Lazy loading methods
  async loadModule(moduleName) { /* Load module lazily */ }
  async preloadModule(moduleName) { /* Preload module */ }
  isModuleLoaded(moduleName) { /* Check if module is loaded */ }
  unloadModule(moduleName) { /* Unload module */ }
}
```

### **Caching Strategy**
```javascript
export class CacheManager {
  constructor() {
    this.caches = new Map();
    this.ttl = new Map();
  }
  
  // Caching methods
  set(key, value, ttl) { /* Set cache value */ }
  get(key) { /* Get cache value */ }
  has(key) { /* Check if key exists */ }
  delete(key) { /* Delete cache value */ }
  clear() { /* Clear all caches */ }
  isExpired(key) { /* Check if key is expired */ }
}
```

## **Conclusion**

This implementation architecture provides a comprehensive foundation for WeeWoo Map Friends V2 across all three deployment platforms. The modular design ensures code reusability while allowing platform-specific optimizations and features.

**Key Implementation Principles**:
1. **Modular Architecture**: Clear separation of concerns
2. **Platform Agnostic**: Core functionality works everywhere
3. **Progressive Enhancement**: Features added per platform
4. **Error Resilience**: Comprehensive error handling
5. **Performance Focus**: Optimized for emergency services use
6. **Maintainable Code**: Clear patterns and documentation

**Next Steps**:
1. Implement core components and services
2. Set up state management stores
3. Create utility functions
4. Add platform-specific features
5. Implement error handling
6. Add performance optimizations

