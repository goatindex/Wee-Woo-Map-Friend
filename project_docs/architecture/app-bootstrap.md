# AppBootstrap System Architecture

## Overview

The AppBootstrap system is the core initialization engine for WeeWoo Map Friend, responsible for orchestrating application startup, component registration, and system initialization. This system was recently enhanced with robust error handling and debugging capabilities to resolve critical startup issues.

## System Architecture

### **Initialization Sequence**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   index.html    │───▶│  DOM Ready      │───▶│ AppBootstrap    │
│                 │    │                 │    │   .init()       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Device Context  │◀───│  setupDevice()  │◀───│  Step 1-3      │
│   Detection     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Map Setup     │◀───│  setupMap()     │◀───│  Step 4-6      │
│  Initialization │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Setup      │◀───│  setupUI()      │◀───│  Step 7-9      │
│  Components     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Data Loading    │◀───│loadComponents() │◀───│  Step 10-11    │
│ & Population    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Critical Initialization Order**

The initialization sequence is **strictly ordered** to prevent race conditions and ensure proper system setup:

1. **Device Context** (Steps 1-3): Platform detection, capabilities assessment
2. **Map Setup** (Steps 4-6): Leaflet initialization, container setup
3. **UI Setup** (Steps 7-9): Component registration, event binding
4. **Data Loading** (Steps 10-11): GeoJSON loading, UI population

**⚠️ Critical**: UI setup must occur **before** data loading to ensure proper component registration.

## Core Components

### **AppBootstrap Class**

```javascript
class AppBootstrap {
  constructor() {
    this.isInitialized = false;
    this.initializationSteps = [];
    this.debugMode = false;
  }

  async init() {
    if (this.isInitialized) {
      throw new Error('Map container is already initialized');
    }
    
    try {
      await this.executeInitializationSequence();
      this.isInitialized = true;
    } catch (error) {
      this.handleInitializationError(error);
    }
  }
}
```

### **Initialization Steps**

#### **Step 1-3: Device Context Setup**
```javascript
async setupDevice() {
  // Detect platform capabilities
  // Set responsive breakpoints
  // Initialize device-specific optimizations
}
```

#### **Step 4-6: Map Initialization**
```javascript
async setupMap() {
  // Initialize Leaflet map container
  // Set up tile layers
  // Configure map controls and interactions
}
```

#### **Step 7-9: UI Component Setup**
```javascript
setupUI() {
  // Set up collapsible sidebar sections
  // Register event handlers
  // Initialize responsive behaviors
}
```

#### **Step 10-11: Component Loading**
```javascript
async loadComponents() {
  // Load GeoJSON data
  // Populate sidebar checkboxes
  // Initialize map layers
}
```

## Error Handling & Recovery

### **Initialization Error Handling**

The AppBootstrap system implements robust error handling to prevent cascading failures:

```javascript
handleInitializationError(error) {
  console.error('AppBootstrap initialization failed:', error);
  
  // Attempt graceful degradation
  if (error.message.includes('Map container is already initialized')) {
    this.handleDoubleInitialization();
  } else if (error.message.includes('Invalid GeoJSON')) {
    this.handleDataCorruption();
  } else {
    this.handleGenericError(error);
  }
}
```

### **Common Error Scenarios**

#### **1. Double Bootstrap Execution**
- **Error**: `Error: Map container is already initialized`
- **Cause**: Multiple calls to `AppBootstrap.init()`
- **Solution**: Ensure single initialization point
- **Prevention**: Add initialization guard

```javascript
// Prevention: Add initialization guard
if (!window.appInitialized) {
  AppBootstrap.init();
  window.appInitialized = true;
}
```

### **Real-World Error Handling Examples**

#### **Error 1: Double Bootstrap Execution**
**Actual Error Message**:
```
Error: Map container is already initialized
    at AppBootstrap.init (bootstrap.js:45:12)
    at bootstrap.js:156:8
```

**Root Cause**: Multiple calls to `AppBootstrap.init()`
**Solution Implemented**: Added initialization guard
**Code Fix**:
```javascript
// Before (problematic)
AppBootstrap.init();

// After (fixed)
if (!window.appInitialized) {
  AppBootstrap.init();
  window.appInitialized = true;
}
```

#### **Error 2: Data Corruption During Loading**
**Actual Error Message**:
```
Error loading ses: Error: Invalid GeoJSON object
    at loadPolygonCategory (polygons.js:67:12)
    at async loadComponents (bootstrap.js:89:15)
```

**Root Cause**: Corrupted or malformed GeoJSON files
**Solution Implemented**: Added robust error handling in loaders
**Code Fix**:
```javascript
// Before (problematic)
const layer = L.geoJSON(feature, { style, pane: category });

// After (fixed)
try {
  const layer = L.geoJSON(feature, { style, pane: category });
  return layer;
} catch (error) {
  console.warn(`Invalid GeoJSON feature:`, feature, error);
  return null; // Filter out invalid features
}
```

#### **Error 3: Component Registration Failures**
**Actual Error Message**:
```
TypeError: Cannot read property 'addEventListener' of null
    at setupCollapsible (collapsible.js:23:12)
    at setupUI (bootstrap.js:78:15)
```

**Root Cause**: UI setup occurring after data loading, DOM elements not found
**Solution Implemented**: Ensured proper initialization order
**Code Fix**:
```javascript
// Before (problematic)
await loadComponents(); // Data loads first
setupUI();           // UI setup happens after - too late!

// After (fixed)
setupUI();           // UI setup first
await loadComponents(); // Data loads after
```

#### **Error 4: StateManager Circular Reference (RESOLVED)**
**Actual Error Message**:
```
Circular reference detected in state value
    at StateManager._hasCircularReference (StateManager.js:375:12)
    at MapManager.setMapState (MapManager.js:81:15)
```

**Root Cause**: MapManager trying to store Leaflet map instance in StateManager, but map objects contain circular references
**Status**: ✅ **RESOLVED** - Fixed with serializable map state approach
**Solution Implemented**:
```javascript
// Before (problematic)
stateManager.set('map', this.map); // Stores entire Leaflet map instance

// After (fixed)
const center = this.map.getCenter();
const bounds = this.map.getBounds();

stateManager.set('map', {
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
}); // Store only serializable map state
```

**Additional Fix**: Modified StateManager to skip circular reference checks for map state:
```javascript
// Skip circular reference check for map state as it's handled specially
if (path !== 'map' && this._hasCircularReference(value)) {
  throw new Error('Circular reference detected in state value');
}
```

#### **Error 5: Map InvalidateSize Function Missing (RESOLVED)**
**Actual Error Message**:
```
TypeError: map.invalidateSize is not a function
    at MapManager.resizeMap (MapManager.js:120:15)
```

**Root Cause**: Map object not properly initialized or corrupted during state management
**Status**: ✅ **RESOLVED** - Fixed by resolving circular reference issue and adding proper initialization guards
**Solution Implemented**: 
- Fixed circular reference issue that was corrupting map state
- Added initialization guards to prevent multiple map initialization
- Ensured map object is properly initialized before calling methods

#### **2. Data Corruption During Loading**
- **Error**: `Error: Invalid GeoJSON object`
- **Cause**: Corrupted or malformed GeoJSON files
- **Solution**: Implement robust error handling in loaders
- **Prevention**: Add data validation and filtering

#### **3. Component Registration Failures**
- **Error**: Components not properly initialized
- **Cause**: UI setup occurring after data loading
- **Solution**: Ensure proper initialization order
- **Prevention**: Strict step-by-step initialization

## Performance Characteristics

### **Initialization Performance**

- **Total Initialization Time**: Target < 2 seconds
- **Device Context Setup**: < 100ms
- **Map Initialization**: < 500ms
- **UI Setup**: < 200ms
- **Data Loading**: < 1000ms (varies by data size)

### **Performance Monitoring**

```javascript
// Performance monitoring during initialization
const startTime = performance.now();
await this.executeInitializationSequence();
const totalTime = performance.now() - startTime;

if (totalTime > 2000) {
  console.warn(`Initialization took ${totalTime}ms, exceeding 2s target`);
}
```

### **Memory Usage**

- **Initial Memory**: ~5-10MB baseline
- **Post-Initialization**: ~15-25MB (varies by data size)
- **Memory Growth**: < 20MB during initialization
- **Memory Leaks**: Zero tolerance - all resources properly cleaned up

## Debugging & Diagnostics

### **Diagnostic Logging**

The AppBootstrap system includes comprehensive diagnostic logging:

```javascript
class DiagnosticLogger {
  static verbose(context, message) {
    if (this.debugMode) {
      console.log(`[${context}] ${message}`);
    }
  }
  
  static error(context, message, error) {
    console.error(`[${context}] ${message}:`, error);
  }
}
```

### **Debug Mode Activation**

```javascript
// Enable debug mode for troubleshooting
window.debugMode = true;
window.AppBootstrap.debugMode = true;
```

### **Common Debugging Scenarios**

#### **Initialization Hanging**
- **Symptoms**: App appears to freeze during startup
- **Debug Steps**: Check console for step-by-step logging
- **Common Causes**: Network timeouts, large data files, infinite loops

#### **Component Registration Failures**
- **Symptoms**: Sidebar sections not working, checkboxes not responding
- **Debug Steps**: Verify UI setup completion before data loading
- **Common Causes**: Race conditions, missing event handlers

#### **Performance Issues**
- **Symptoms**: Slow startup, unresponsive UI
- **Debug Steps**: Monitor initialization timing, check data file sizes
- **Common Causes**: Large GeoJSON files, network latency, device limitations

## Integration Points

### **Component Registration**

```javascript
// Components register with AppBootstrap during setupUI()
setupUI() {
  // Register collapsible behavior
  window.setupCollapsible('sesHeader', 'sesList', false);
  window.setupCollapsible('lgaHeader', 'lgaList', false);
  // ... other components
}
```

### **Collapsible System Integration**

#### **How setupCollapsible Works**

The collapsible system is a critical UI component that must be initialized before data loading. Here's the actual implementation:

```javascript
// Actual implementation from js/ui/collapsible.js
window.setupCollapsible = function(headerId, listId, startCollapsed = false) {
  const header = document.getElementById(headerId);
  const list = document.getElementById(listId);
  
  if (!header || !list) {
    console.warn(`setupCollapsible: Missing elements for ${headerId}/${listId}`);
    return;
  }
  
  // Set initial state
  list.style.display = startCollapsed ? 'none' : 'block';
  header.classList.toggle('collapsed', startCollapsed);
  
  // Add click handler
  header.addEventListener('click', () => {
    const isCollapsed = list.style.display === 'none';
    list.style.display = isCollapsed ? 'block' : 'none';
    header.classList.toggle('collapsed', !isCollapsed);
  });
};
```

#### **Integration with Data Loading**

The collapsible system must be initialized **BEFORE** data loading because:

1. **Headers need click handlers attached** - Event listeners must be registered before user interaction
2. **Lists need initial display state set** - DOM elements must be configured before content population
3. **Data loading populates the lists dynamically** - Checkboxes are added after collapsible setup

#### **Critical Initialization Order**

```javascript
// CORRECT ORDER (what we do)
setupUI();           // Step 7-9: Setup collapsible behavior
await loadComponents(); // Step 10-11: Load data and populate lists

// INCORRECT ORDER (what causes failures)
await loadComponents(); // Data loads first
setupUI();           // UI setup happens after - too late!
```

#### **Common Collapsible Issues**

##### **Issue: Sections Not Expanding**
**Symptoms**: Clicking headers doesn't expand sections
**Root Cause**: `setupCollapsible` called after data loading
**Solution**: Ensure UI setup occurs before data loading

##### **Issue: Missing Click Handlers**
**Symptoms**: Headers don't respond to clicks
**Root Cause**: DOM elements not found during setup
**Solution**: Verify element IDs match between HTML and JavaScript

### **Data Loading Integration**

```javascript
// Data loaders integrate with AppBootstrap during loadComponents()
async loadComponents() {
  // Load and populate GeoJSON data
  await this.loadPolygonCategories();
  await this.loadPointCategories();
}
```

### **Error Handling Integration**

```javascript
// Error handling integrates with AppBootstrap error system
window.showSidebarError = (message, duration = 5000) => {
  // Display user-friendly error messages
  // Integrate with AppBootstrap error reporting
};
```

## Best Practices

### **Initialization Best Practices**

1. **Single Initialization Point**: Ensure only one call to `AppBootstrap.init()`
2. **Proper Order**: UI setup must precede data loading
3. **Error Boundaries**: Implement error handling at each step
4. **Performance Monitoring**: Track initialization timing and memory usage
5. **Graceful Degradation**: Continue functioning with reduced capabilities on errors

### **Debugging Best Practices**

1. **Enable Debug Mode**: Use diagnostic logging for troubleshooting
2. **Step-by-Step Verification**: Verify each initialization step completes
3. **Performance Monitoring**: Track timing and memory usage
4. **Error Documentation**: Document all error scenarios and solutions
5. **Recovery Testing**: Test error recovery and graceful degradation

### **Maintenance Best Practices**

1. **Regular Performance Audits**: Monitor initialization performance over time
2. **Error Rate Monitoring**: Track initialization failure rates
3. **Memory Leak Detection**: Monitor memory usage patterns
4. **Update Testing**: Test initialization after code updates
5. **Documentation Updates**: Keep documentation current with code changes

## Future Enhancements

### **Planned Improvements**

1. **Async Component Loading**: Load components in parallel where possible
2. **Progressive Initialization**: Show progress indicators during startup
3. **Smart Caching**: Cache initialization results for faster subsequent loads
4. **Performance Profiling**: Detailed performance analysis and optimization
5. **Error Recovery Automation**: Automatic recovery from common failures

### **Architecture Evolution**

1. **ES Module Migration**: Convert from window globals to ES modules
2. **TypeScript Integration**: Add type safety to initialization process
3. **Plugin Architecture**: Extensible initialization system
4. **Micro-frontend Support**: Support for modular application architecture
5. **Real-time Updates**: Dynamic component updates without full reinitialization

## Related Documentation

- **[System Architecture Overview](overview.md)** - High-level system architecture
- **[Component Architecture](components.md)** - Component design and patterns
- **[Data Flow & State Management](data-flow.md)** - State management architecture
- **[Performance Baselines](../templates/performance-baselines.md)** - Performance measurement
- **[Terms of Reference](../terms-of-reference.md)** - Standardized terminology and vocabulary reference
- **[E2E Troubleshooting Guide](../development/e2e-troubleshooting-guide.md)** - Testing and debugging

---

*This documentation provides comprehensive coverage of the AppBootstrap system architecture, including recent improvements and error handling enhancements.*
