# Data Flow & State Management

## Overview

The WeeWoo Map Friend application uses a sophisticated state management system that combines modern ES6 module-based state management with legacy compatibility layers. This system ensures data consistency, performance optimization, and maintainable code architecture across the entire application while providing a smooth migration path from legacy systems.

## State Architecture

### **Modern ES6 State System**

The application uses a modern ES6 module-based state management system with legacy compatibility:

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                        │
├─────────────────────────────────────────────────────────────┤
│  Modern ES6 State (StateManager)  │  Legacy Compatibility Layer │
│  • Reactive updates               │  • Backward compatibility   │
│  • Middleware support             │  • Performance optimized    │
│  • Computed properties            │  • Bulk operations          │
│  • Watchers & observers           │  • Label management         │
│  • Event-driven updates           │  • Window global fallbacks  │
└─────────────────────────────────────────────────────────────┘
```

### **State Categories**

#### **1. Feature Layer State**

```javascript
// Map layers for each category
window.featureLayers = {
  ses: {}, // State Emergency Service boundaries
  lga: {}, // Local Government Areas
  cfa: {}, // Country Fire Authority
  ambulance: {}, // Ambulance stations
  police: {}, // Police stations
  frv: {}, // Fire Rescue Victoria
};
```

#### **2. Feature Names & Keys**

```javascript
// Names organized by category
window.namesByCategory = {
  ses: ['SES Unit 1', 'SES Unit 2', ...],
  lga: ['City of Melbourne', 'City of Yarra', ...],
  cfa: ['CFA Brigade 1', 'CFA Brigade 2', ...],
  // ... other categories
};

// Key mapping for efficient lookups
window.nameToKey = {
  ses: { 'SES Unit 1': 'ses_001', 'SES Unit 2': 'ses_002' },
  lga: { 'City of Melbourne': 'lga_001', ... },
  // ... other categories
};
```

#### **3. UI State**

```javascript
// Emphasis and label states
window.emphasised = {
  ses: { 'ses_001': true, 'ses_002': false },
  lga: { 'lga_001': false, ... },
  // ... other categories
};

window.nameLabelMarkers = {
  ses: { 'ses_001': markerInstance, ... },
  // ... other categories
};
```

#### **4. Application State**

```javascript
// UI and application state
window.activeListFilter = ''; // Search filter text
window.isBulkOperation = false; // Bulk operation flag
window.pendingLabels = []; // Deferred label creation
```

## ES6 State Management System

### **1. Modern StateManager**

The application now uses a modern ES6 StateManager for primary state management:

```javascript
// Import StateManager
import { stateManager } from './StateManager.js';

// Read state
const sesNames = stateManager.getState('namesByCategory.ses');
const isEmphasised = stateManager.getState('emphasised.ses.ses_001');

// Write state
stateManager.setState('emphasised.ses.ses_001', true);
stateManager.setState('activeListFilter', 'melbourne');

// Subscribe to state changes
stateManager.subscribe('emphasised.ses', (newValue) => {
  console.log('SES emphasis state changed:', newValue);
});
```

### **2. Event-Driven State Updates**

State changes are now propagated through the globalEventBus:

```javascript
import { globalEventBus } from './globalEventBus.js';

// Emit state change events
globalEventBus.emit('state:emphasised:changed', {
  category: 'ses',
  key: 'ses_001',
  value: true
});

// Listen for state changes
globalEventBus.on('state:emphasised:changed', (data) => {
  // Handle state change
  updateUI(data);
});
```

### **3. Legacy State Management (Maintained for Compatibility)**

#### **Direct State Access**

#### **State Update Functions**

```javascript
// Set active list filter
window.setActiveListFilter('search term');

// Begin/end bulk operations
window.beginBulkOperation();
// ... perform multiple operations
window.endBulkOperation();
```

#### **Bulk Operations**

```javascript
// Optimized bulk label creation
window.beginBulkOperation();

// Add multiple features
features.forEach((feature) => {
  window.featureLayers.ses[feature.key] = feature.layer;
  window.namesByCategory.ses.push(feature.name);
  window.nameToKey.ses[feature.name] = feature.key;
});

window.endBulkOperation(); // Processes deferred labels
```

### **2. Modern State Management (StateManager)**

#### **Reactive State with Map State Serialization**

```javascript
import { StateManager } from './modules/StateManager.js';

const stateManager = new StateManager();

// Access reactive state
const currentFilter = stateManager.state.activeListFilter;
const currentLayers = stateManager.state.featureLayers;

// Update state (triggers reactivity)
stateManager.state.activeListFilter = 'new filter';
stateManager.state.featureLayers.ses = newSesLayers;

// Map state is stored as serializable data (no circular references)
const mapState = stateManager.state.map;
// Returns: { id, center: {lat, lng}, zoom, bounds: {north, south, east, west}, ready }
```

#### **State Watchers**

```javascript
// Watch specific state properties
stateManager.watch('activeListFilter', (newValue, oldValue) => {
  console.log(`Filter changed from "${oldValue}" to "${newValue}"`);
  updateSearchResults(newValue);
});

// Watch multiple properties
stateManager.watch(['featureLayers', 'emphasised'], (newValue, oldValue) => {
  updateMapDisplay();
});
```

#### **Computed Properties**

```javascript
// Define computed properties
stateManager.computed('activeFeatureCount', () => {
  let count = 0;
  Object.values(stateManager.state.featureLayers).forEach((category) => {
    count += Object.keys(category).length;
  });
  return count;
});

// Use computed property
const totalFeatures = stateManager.state.activeFeatureCount;
```

#### **Map State Serialization Strategy**

```javascript
// Map state is stored as serializable data to avoid circular references
function serializeMapState(map) {
  const center = map.getCenter();
  const bounds = map.getBounds();
  
  return {
    id: map._leaflet_id,
    center: {
      lat: center.lat,
      lng: center.lng
    },
    zoom: map.getZoom(),
    bounds: {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    },
    ready: true
  };
}

// StateManager skips circular reference checks for map state
stateManager.set('map', serializeMapState(this.map));
```

#### **Middleware**

```javascript
// Add state validation middleware
stateManager.use((property, value, oldValue) => {
  if (property === 'activeListFilter' && typeof value !== 'string') {
    console.warn('Filter must be a string, converting...');
    return String(value);
  }
  return value;
});

// Add logging middleware
stateManager.use((property, value, oldValue) => {
  console.log(`State change: ${property} = ${oldValue} → ${value}`);
  return value;
});
```

## Data Flow Patterns

### **1. User Interaction Flow**

```
User Action → Event → State Update → UI Update → Map Update
     ↓           ↓         ↓           ↓          ↓
  Click checkbox → change → emphasis → sidebar → map layer
```

#### **Example: Feature Selection**

```javascript
// 1. User clicks checkbox
checkbox.addEventListener('change', (e) => {
  const category = e.target.dataset.category;
  const key = e.target.dataset.key;
  const isChecked = e.target.checked;

  // 2. Update state
  if (isChecked) {
    window.emphasised[category][key] = true;
    addFeatureToMap(category, key);
  } else {
    window.emphasised[category][key] = false;
    removeFeatureFromMap(category, key);
  }

  // 3. Update UI
  updateActiveList();
  updateEmphasisDisplay();
});
```

### **2. Data Loading Flow**

```
Data Source → Loader → State Update → UI Components → Map Rendering
     ↓          ↓          ↓            ↓             ↓
  GeoJSON → loadSES → featureLayers → Sidebar → Leaflet layers
```

#### **Example: SES Data Loading**

```javascript
// 1. Load data
async function loadSESData() {
  const response = await fetch('data/ses.geojson');
  const data = await response.json();

  // 2. Begin bulk operation
  window.beginBulkOperation();

  // 3. Process features
  data.features.forEach((feature) => {
    const key = `ses_${feature.properties.ID}`;
    const name = feature.properties.NAME;

    // 4. Update state
    window.featureLayers.ses[key] = createLeafletLayer(feature);
    window.namesByCategory.ses.push(name);
    window.nameToKey.ses[name] = key;
  });

  // 5. End bulk operation (processes labels)
  window.endBulkOperation();

  // 6. Update UI
  updateSidebar();
  emit('data:ses:loaded', { count: data.features.length });
}
```

### **3. Event-Driven Communication**

#### **Event Flow Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │───▶│  Component      │───▶│  State Update   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Event Emit    │◀───│  State Change   │◀───│  Reactive       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Other         │    │  Watchers       │    │  UI Update      │
│  Components    │    │  Execute        │    │  Components     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Event Types**

```javascript
// State change events
'stateChange'; // Any state property change
'state:propertyName'; // Specific property change
'stateReset'; // State reset operation
'statePersisted'; // State saved to storage
'stateRestored'; // State restored from storage

// Component events
'component:initialized'; // Component initialization
'component:stateChange'; // Component state change
'component:destroyed'; // Component destruction

// Application events
'app:stateManagerReady'; // State manager ready
'data:category:loaded'; // Data category loaded
'feature:selected'; // Feature selection
'feature:deselected'; // Feature deselection
```

## Error Handling in Data Flow

### **1. Error Classification & Handling**

#### **Network Errors**

```javascript
// Handle network failures with retry logic
async function loadDataWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw new Error(`Failed to load data after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

#### **Data Validation Errors**

```javascript
// Validate GeoJSON data integrity
function validateGeoJSON(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return errors;
  }

  if (!Array.isArray(data.features)) {
    errors.push('Data must have a features array');
    return errors;
  }

  data.features.forEach((feature, index) => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      errors.push(`Feature ${index} missing geometry or coordinates`);
    }

    if (!feature.properties || !feature.properties.NAME) {
      errors.push(`Feature ${index} missing properties or NAME`);
    }
  });

  return errors;
}
```

#### **State Consistency Errors**

```javascript
// Detect and repair state inconsistencies
function repairStateInconsistencies() {
  const errors = [];

  // Check for orphaned layers
  Object.entries(window.featureLayers).forEach(([category, layers]) => {
    Object.keys(layers).forEach((key) => {
      if (!window.nameToKey[category][key]) {
        errors.push(`Orphaned layer: ${category}.${key}`);
        // Remove orphaned layer
        delete window.featureLayers[category][key];
      }
    });
  });

  // Check for missing names
  Object.entries(window.namesByCategory).forEach(([category, names]) => {
    names.forEach((name) => {
      if (!window.nameToKey[category][name]) {
        errors.push(`Missing key for name: ${category}.${name}`);
        // Remove invalid name
        const index = window.namesByCategory[category].indexOf(name);
        if (index > -1) {
          window.namesByCategory[category].splice(index, 1);
        }
      }
    });
  });

  return errors;
}
```

### **2. Recovery Mechanisms**

#### **Graceful Degradation**

```javascript
// Continue functioning with reduced capabilities
async function loadDataWithFallback(categories) {
  const results = {};

  for (const category of categories) {
    try {
      results[category] = await loadCategoryData(category);
    } catch (error) {
      console.warn(`Failed to load ${category}:`, error.message);

      // Try to load from cache
      try {
        results[category] = await loadFromCache(category);
        console.log(`Loaded ${category} from cache`);
      } catch (cacheError) {
        console.error(`Failed to load ${category} from cache:`, cacheError.message);

        // Use empty data as last resort
        results[category] = { features: [] };
        results[category]._degraded = true;
      }
    }
  }

  return results;
}
```

#### **State Recovery**

```javascript
// Recover from error states
async function recoverFromError(error) {
  console.log('Attempting to recover from error:', error.message);

  // Clear any corrupted state
  clearCorruptedState();

  // Attempt to restore from backup
  try {
    await restoreFromBackup();
    console.log('Successfully recovered from backup');
  } catch (backupError) {
    console.error('Failed to restore from backup:', backupError.message);

    // Reset to initial state
    resetToInitialState();
    console.log('Reset to initial state');
  }

  // Notify user of recovery
  notifyUser('System recovered from error. Some data may have been lost.');
}
```

### **3. Error Monitoring & Reporting**

#### **Error Tracking**

```javascript
// Track errors for monitoring and debugging
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  trackError(error, context = {}) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      type: error.constructor.name,
    };

    this.errors.push(errorRecord);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (window.location.hostname === 'localhost') {
      console.error('Error tracked:', errorRecord);
    }

    // Send to monitoring service in production
    if (window.location.protocol === 'https:') {
      this.sendToMonitoring(errorRecord);
    }
  }

  async sendToMonitoring(errorRecord) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorRecord),
      });
    } catch (sendError) {
      console.warn('Failed to send error to monitoring:', sendError.message);
    }
  }

  getErrorSummary() {
    const errorTypes = {};
    this.errors.forEach((error) => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorTypes,
      recentErrors: this.errors.slice(-10),
    };
  }
}

// Global error tracker
window.errorTracker = new ErrorTracker();
```

## Performance Optimization

### **1. Bulk Operations**

#### **Label Creation Batching**

```javascript
// Category-specific batch sizes for optimal performance
const labelBatchSizes = {
  lga: 1, // Process LGA labels one at a time (complex geometry)
  cfa: 8, // Larger batches for CFA (pre-calculated coordinates)
  ses: 8, // Larger batches for SES (pre-calculated coordinates)
  ambulance: 10,
  police: 10,
};

// Process labels in batches using requestAnimationFrame
window.processDeferredLabels = async function () {
  // ... batch processing logic
  for (let i = 0; i < categoryLabels.length; i += batchSize) {
    const batch = categoryLabels.slice(i, i + batchSize);

    // Process batch
    batch.forEach(processLabel);

    // Yield between batches
    if (i + batchSize < categoryLabels.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
};
```

#### **Memory Management**

```javascript
// Clean up unused markers
function cleanupUnusedMarkers() {
  Object.entries(window.nameLabelMarkers).forEach(([category, markers]) => {
    Object.entries(markers).forEach(([key, marker]) => {
      if (!window.featureLayers[category][key]) {
        // Remove marker from map
        if (marker && marker._map) {
          marker.remove();
        }
        // Clear reference
        delete window.nameLabelMarkers[category][key];
      }
    });
  });
}
```

### **2. Lazy Loading**

#### **Progressive Data Loading**

```javascript
// Load data progressively
async function loadDataProgressively(categories) {
  for (const category of categories) {
    // Load category data
    await loadCategoryData(category);

    // Update UI for this category
    updateCategoryUI(category);

    // Yield to keep UI responsive
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
```

#### **Conditional Rendering**

```javascript
// Only render visible features
function renderVisibleFeatures() {
  const mapBounds = window.getMap().getBounds();

  Object.entries(window.featureLayers).forEach(([category, layers]) => {
    Object.entries(layers).forEach(([key, layer]) => {
      if (layer.getBounds && layer.getBounds().intersects(mapBounds)) {
        // Feature is visible, ensure it's rendered
        ensureFeatureRendered(category, key);
      }
    });
  });
}
```

## State Persistence

### **1. Local Storage**

#### **State Saving**

```javascript
// Save state to localStorage
function saveApplicationState() {
  const stateToSave = {
    emphasised: window.emphasised,
    activeListFilter: window.activeListFilter,
    sidebarCollapsed: getSidebarState(),
    lastViewedLocation: getMapCenter(),
  };

  try {
    localStorage.setItem('mapexp_state', JSON.stringify(stateToSave));
    console.log('Application state saved');
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}
```

#### **State Restoration**

```javascript
// Restore state from localStorage
function restoreApplicationState() {
  try {
    const savedState = localStorage.getItem('mapexp_state');
    if (savedState) {
      const state = JSON.parse(savedState);

      // Restore state
      if (state.emphasised) {
        window.emphasised = { ...window.emphasised, ...state.emphasised };
      }

      if (state.activeListFilter) {
        window.activeListFilter = state.activeListFilter;
        updateSearchFilter(state.activeListFilter);
      }

      if (state.lastViewedLocation) {
        window.getMap().setView(state.lastViewedLocation);
      }

      console.log('Application state restored');
    }
  } catch (error) {
    console.error('Failed to restore state:', error);
  }
}
```

### **2. Session Persistence**

#### **Bulk Operation State**

```javascript
// Save bulk operation state
function saveBulkOperationState() {
  sessionStorage.setItem(
    'mapexp_bulk_operation',
    JSON.stringify({
      isBulkOperation: window.isBulkOperation,
      pendingLabels: window.pendingLabels,
    })
  );
}

// Restore bulk operation state
function restoreBulkOperationState() {
  try {
    const saved = sessionStorage.getItem('mapexp_bulk_operation');
    if (saved) {
      const state = JSON.parse(saved);
      window.isBulkOperation = state.isBulkOperation;
      window.pendingLabels = state.pendingLabels || [];

      if (window.isBulkOperation && window.pendingLabels.length > 0) {
        // Resume bulk operation
        window.processDeferredLabels();
      }
    }
  } catch (error) {
    console.error('Failed to restore bulk operation state:', error);
  }
}
```

## Debugging & Troubleshooting

### **1. State Inspection**

#### **Console Debugging**

```javascript
// Inspect current state
console.log('Current state:', {
  featureLayers: window.featureLayers,
  namesByCategory: window.namesByCategory,
  emphasised: window.emphasised,
  activeListFilter: window.activeListFilter,
});

// Check specific category
console.log('SES state:', {
  layers: Object.keys(window.featureLayers.ses),
  names: window.namesByCategory.ses,
  emphasised: window.emphasised.ses,
});
```

#### **State Validation**

```javascript
// Validate state consistency
function validateState() {
  const errors = [];

  // Check for orphaned layers
  Object.entries(window.featureLayers).forEach(([category, layers]) => {
    Object.keys(layers).forEach((key) => {
      if (!window.nameToKey[category][key]) {
        errors.push(`Orphaned layer: ${category}.${key}`);
      }
    });
  });

  // Check for missing names
  Object.entries(window.namesByCategory).forEach(([category, names]) => {
    names.forEach((name) => {
      if (!window.nameToKey[category][name]) {
        errors.push(`Missing key for name: ${category}.${name}`);
      }
    });
  });

  if (errors.length > 0) {
    console.error('State validation errors:', errors);
    return false;
  }

  return true;
}
```

### **2. Event Debugging**

#### **Event Monitoring**

```javascript
// Monitor all state change events
window.addEventListener('stateChange', (event) => {
  console.log('State change:', event.detail);
});

// Monitor specific events
document.addEventListener('feature:selected', (event) => {
  console.log('Feature selected:', event.detail);
});

// Monitor component events
document.addEventListener('component:stateChange', (event) => {
  console.log('Component state change:', event.detail);
});
```

#### **Event Tracing**

```javascript
// Enable event tracing
function enableEventTracing() {
  const originalEmit = EventBus.prototype.emit;

  EventBus.prototype.emit = function (event, data) {
    console.log(`Event emitted: ${event}`, data);
    return originalEmit.call(this, event, data);
  };
}

// Disable event tracing
function disableEventTracing() {
  // Restore original emit method
}
```

### **3. Performance Monitoring**

#### **State Update Timing**

```javascript
// Monitor state update performance
function monitorStateUpdates() {
  const startTime = performance.now();

  // Perform state update
  updateFeatureState();

  const endTime = performance.now();
  console.log(`State update took: ${endTime - startTime}ms`);
}

// Monitor bulk operations
function monitorBulkOperation() {
  const startTime = performance.now();

  window.beginBulkOperation();
  // ... perform operations
  window.endBulkOperation();

  const endTime = performance.now();
  console.log(`Bulk operation took: ${endTime - startTime}ms`);
}
```

#### **Memory Usage**

```javascript
// Monitor memory usage
function monitorMemoryUsage() {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB',
    });
  }
}
```

## Best Practices

### **1. State Management**

- **Single Source of Truth**: Use centralized state management
- **Immutable Updates**: Don't directly modify state objects
- **Bulk Operations**: Group related state changes for performance
- **State Validation**: Validate state consistency regularly
- **Error Boundaries**: Handle state errors gracefully

### **2. Performance**

- **Batch Processing**: Use bulk operations for multiple changes
- **Lazy Loading**: Load data progressively
- **Memory Management**: Clean up unused references
- **Debouncing**: Debounce frequent state updates
- **Throttling**: Throttle high-frequency events

### **3. Debugging**

- **State Logging**: Log important state changes
- **Event Monitoring**: Monitor event flow
- **Performance Tracking**: Track operation timing
- **Memory Monitoring**: Monitor memory usage
- **State Validation**: Validate state consistency

### **4. Maintenance**

- **State Cleanup**: Regular cleanup of unused state
- **Event Cleanup**: Remove event listeners properly
- **Memory Leaks**: Prevent memory leaks in state objects
- **State Migration**: Plan for state structure changes
- **Backward Compatibility**: Maintain legacy state support

## Related Documentation

- **[Architecture Overview](overview.md)** - System architecture and design
- **[Component Architecture](components.md)** - Component patterns and lifecycle
- **[Development Setup](../development/setup.md)** - Development environment setup
- **[Testing Framework](../templates/testing-template.md)** - Testing procedures
- **[Performance Baselines](../templates/performance-baselines.md)** - Performance measurement

## Quick Reference

### **Essential State Operations**

```javascript
// Legacy state
window.featureLayers.ses[key] = layer; // Add layer
window.emphasised.ses[key] = true; // Emphasize feature
window.namesByCategory.ses.push(name); // Add name
window.beginBulkOperation(); // Start bulk operation
window.endBulkOperation(); // End bulk operation

// Modern state
stateManager.state.property = value; // Update state
stateManager.watch('property', callback); // Watch changes
stateManager.computed('name', getter); // Add computed property
stateManager.use(middleware); // Add middleware
```

### **Event Patterns**

```javascript
// Emit events
this.emit('state:changed', { property, value });
this.emit('feature:selected', { category, key });

// Listen to events
this.on('state:changed', handleStateChange);
this.on('feature:selected', handleFeatureSelection);
```

### **Debugging Commands**

```javascript
// State inspection
console.log(window.featureLayers);
console.log(window.emphasised);
validateState();

// Event monitoring
enableEventTracing();
monitorMemoryUsage();
```

## Data Validation & Integrity

### **1. Input Validation Patterns**

#### **GeoJSON Structure Validation**

```javascript
// Comprehensive GeoJSON validation
function validateGeoJSONStructure(data) {
  const errors = [];

  // Basic structure checks
  if (!data || typeof data !== 'object') {
    errors.push('Data must be a valid object');
    return errors;
  }

  if (data.type !== 'FeatureCollection') {
    errors.push('Data must be a FeatureCollection');
    return errors;
  }

  if (!Array.isArray(data.features)) {
    errors.push('Features must be an array');
    return errors;
  }

  // Feature validation
  data.features.forEach((feature, index) => {
    if (feature.type !== 'Feature') {
      errors.push(`Feature ${index} must have type 'Feature'`);
    }

    if (!feature.geometry || typeof feature.geometry !== 'object') {
      errors.push(`Feature ${index} must have valid geometry`);
    }

    if (!feature.properties || typeof feature.properties !== 'object') {
      errors.push(`Feature ${index} must have properties object`);
    }
  });

  return errors;
}
```

#### **Coordinate Validation**

```javascript
// Validate coordinate data integrity
function validateCoordinates(coordinates, featureIndex = 0) {
  const errors = [];

  if (!Array.isArray(coordinates)) {
    errors.push(`Feature ${featureIndex}: Coordinates must be an array`);
    return errors;
  }

  coordinates.forEach((coord, coordIndex) => {
    if (!Array.isArray(coord) || coord.length < 2) {
      errors.push(`Feature ${featureIndex}: Coordinate ${coordIndex} must have at least 2 values`);
      return;
    }

    const [lng, lat] = coord;

    // Longitude validation (-180 to 180)
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push(`Feature ${featureIndex}: Invalid longitude ${lng} at coordinate ${coordIndex}`);
    }

    // Latitude validation (-90 to 90)
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      errors.push(`Feature ${featureIndex}: Invalid latitude ${lat} at coordinate ${coordIndex}`);
    }
  });

  return errors;
}
```

### **2. Data Integrity Checks**

#### **Cross-Reference Validation**

```javascript
// Validate data consistency across state objects
function validateDataConsistency() {
  const errors = [];

  // Check feature layers consistency
  Object.entries(window.featureLayers).forEach(([category, layers]) => {
    const layerKeys = Object.keys(layers);
    const nameKeys = Object.keys(window.nameToKey[category] || {});

    // Check for mismatched keys
    const orphanedLayers = layerKeys.filter((key) => !nameKeys.includes(key));
    const orphanedNames = nameKeys.filter((key) => !layerKeys.includes(key));

    if (orphanedLayers.length > 0) {
      errors.push(`${category}: Orphaned layers: ${orphanedLayers.join(', ')}`);
    }

    if (orphanedNames.length > 0) {
      errors.push(`${category}: Orphaned names: ${orphanedNames.join(', ')}`);
    }
  });

  // Check emphasis state consistency
  Object.entries(window.emphasised).forEach(([category, emphasis]) => {
    const emphasisKeys = Object.keys(emphasis);
    const layerKeys = Object.keys(window.featureLayers[category] || {});

    const invalidEmphasis = emphasisKeys.filter((key) => !layerKeys.includes(key));
    if (invalidEmphasis.length > 0) {
      errors.push(`${category}: Invalid emphasis keys: ${invalidEmphasis.join(', ')}`);
    }
  });

  return errors;
}
```

## Cache Management

### **1. Cache Invalidation Strategies**

#### **Time-Based Invalidation**

```javascript
// Cache with expiration times
class TimedCache {
  constructor(defaultTTL = 300000) {
    // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
```

### **2. Memory Pressure Handling**

#### **Adaptive Cache Sizing**

```javascript
// Cache that adapts to memory pressure
class AdaptiveCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessCounts = new Map();
  }

  set(key, value) {
    // Check memory pressure
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, value);
    this.accessCounts.set(key, 0);
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      // Increment access count
      const count = this.accessCounts.get(key) || 0;
      this.accessCounts.set(key, count + 1);
    }
    return value;
  }

  // Evict least frequently used items
  evictLeastUsed() {
    let minCount = Infinity;
    let minKey = null;

    for (const [key, count] of this.accessCounts.entries()) {
      if (count < minCount) {
        minCount = count;
        minKey = key;
      }
    }

    if (minKey) {
      this.cache.delete(minKey);
      this.accessCounts.delete(minKey);
    }
  }

  // Clear cache when memory pressure is high
  clearOnMemoryPressure() {
    if (
      performance.memory &&
      performance.memory.usedJSHeapSize > performance.memory.jsHeapSizeLimit * 0.8
    ) {
      this.cache.clear();
      this.accessCounts.clear();
      console.warn('Cache cleared due to high memory usage');
    }
  }
}
```

---

_This data flow and state management system provides the foundation for consistent, performant, and maintainable application behavior. Follow these patterns to ensure proper state management and optimal performance._
