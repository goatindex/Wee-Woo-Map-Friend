# Data Loading Architecture

## Overview

The data loading architecture in WeeWoo Map Friend is responsible for fetching, processing, and integrating GeoJSON data from multiple sources into the application. This system handles coordinate conversion, data validation, error handling, and dynamic UI population. Recent enhancements include robust error handling for corrupted data and improved coordinate conversion logic.

## System Architecture

### **Data Loading Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│  Loader System  │───▶│  Data Processing │
│                 │    │                 │    │                 │
│ • SES GeoJSON   │    │ • PolygonLoader │    │ • Validation    │
│ • LGA GeoJSON   │    │ • PointLoader   │    │ • Conversion    │
│ • CFA GeoJSON   │    │ • ErrorHandler  │    │ • Filtering     │
│ • Police Data   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Population │◀───│  State Updates  │◀───│  Processed Data │
│                 │    │                 │    │                 │
│ • Sidebar Lists │    │ • FeatureLayers │    │ • Clean Features │
│ • Checkboxes    │    │ • NamesByCategory│    │ • Valid Coords  │
│ • Map Layers    │    │ • NameToKey     │    │ • Error Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Loader Categories**

#### **1. Polygon Loaders**
- **SES Response Areas**: Emergency service boundaries
- **LGA Boundaries**: Local government area polygons
- **CFA Response Areas**: Fire authority coverage areas
- **FRV Areas**: Fire Rescue Victoria boundaries

#### **2. Point Loaders**
- **Ambulance Stations**: Medical emergency response points
- **Police Stations**: Law enforcement locations
- **CFA Stations**: Fire station locations

## Core Components

### **PolygonLoader System**

The PolygonLoader is the primary data loading component for polygonal features:

```javascript
window.loadPolygonCategory = async (category, meta) => {
  try {
    // Fetch GeoJSON data
    const response = await fetch(meta.url);
    const geojson = await response.json();
    
    // Process and validate features
    const processedFeatures = processFeatures(geojson.features, category);
    
    // Create map layers
    const layers = createMapLayers(processedFeatures, category);
    
    // Update application state
    updateApplicationState(category, processedFeatures, layers);
    
  } catch (error) {
    handleLoadingError(category, error);
  }
};
```

### **Feature Processing Pipeline**

#### **1. Data Validation**
```javascript
function validateFeature(feature) {
  // Check feature structure
  if (!feature || !feature.geometry || !feature.properties) {
    return { valid: false, reason: 'Invalid feature structure' };
  }
  
  // Validate geometry
  if (!feature.geometry.coordinates || feature.geometry.coordinates.length === 0) {
    return { valid: false, reason: 'Missing coordinates' };
  }
  
  return { valid: true };
}
```

#### **2. Coordinate Conversion**
```javascript
function processFeatureCoordinates(feature, category) {
  if (feature.geometry.type === 'Point' && category !== 'ambulance') {
    const coords = feature.geometry.coordinates;
    
    // Check if coordinates need conversion (MGA94 to lat/lng)
    if (coords.length >= 2 && coords[0] > 1000) {
      try {
        const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
        feature.geometry.coordinates = [latLng.lng, latLng.lat];
        return true;
      } catch (error) {
        console.warn(`Failed to convert coordinates for feature:`, error);
        return false;
      }
    }
  }
  return false;
}
```

#### **3. Feature Filtering**
```javascript
function filterValidFeatures(features) {
  return features
    .map(feature => {
      try {
        // Attempt to create Leaflet layer
        const layer = L.geoJSON(feature, { style, pane: category });
        return layer;
      } catch (error) {
        console.warn(`Invalid GeoJSON feature:`, feature, error);
        return null; // Filter out invalid features
      }
    })
    .filter(layer => layer !== null); // Remove null layers
}
```

## Coordinate System Management

### **Coordinate System Types**

#### **1. Geographic Coordinates (WGS84)**
- **Format**: [longitude, latitude]
- **Range**: Longitude: -180 to +180, Latitude: -90 to +90
- **Usage**: Standard web mapping, Leaflet.js compatibility
- **Example**: [143.8, -37.5] (Melbourne, Australia)

#### **2. Projected Coordinates (MGA94)**
- **Format**: [easting, northing]
- **Range**: Easting: 100,000 to 1,000,000, Northing: 5,000,000 to 10,000,000
- **Usage**: Australian mapping standards, high-precision local measurements
- **Example**: [500000, 6000000] (Victoria region)

### **Coordinate Conversion Logic**

```javascript
function shouldConvertCoordinates(coords, category, feature) {
  return feature.geometry.type === 'Point' && 
         category !== 'ambulance' && 
         coords.length >= 2 && 
         coords[0] > 1000; // MGA94 coordinates are typically > 1000
}

function convertMGA94ToLatLon(easting, northing) {
  // Use proj4js for coordinate transformation
  const proj4 = window.proj4;
  
  // MGA94 Zone 55 (Victoria, Australia)
  const sourceProj = '+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
  const targetProj = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
  
  const [lng, lat] = proj4(sourceProj, targetProj, [easting, northing]);
  
  return { lng, lat };
}
```

### **Conversion Error Handling**

```javascript
function safeCoordinateConversion(feature, category) {
  try {
    if (shouldConvertCoordinates(feature.geometry.coordinates, category, feature)) {
      const coords = feature.geometry.coordinates;
      const latLng = convertMGA94ToLatLon(coords[0], coords[1]);
      
      // Validate converted coordinates
      if (isValidLatLng(latLng.lat, latLng.lng)) {
        feature.geometry.coordinates = [latLng.lng, latLng.lat];
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn(`Coordinate conversion failed for ${category}:`, error);
    return false;
  }
}

function isValidLatLng(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
```

## Error Handling & Recovery

### **Error Classification**

#### **1. Data Source Errors**
- **Network Failures**: Fetch timeouts, connection errors
- **HTTP Errors**: 404, 500, authentication failures
- **CORS Issues**: Cross-origin resource sharing problems

#### **2. Data Format Errors**
- **Invalid JSON**: Malformed response data
- **Missing Properties**: Required feature properties not present
- **Geometry Errors**: Invalid coordinate data

#### **3. Processing Errors**
- **Coordinate Conversion Failures**: MGA94 to lat/lng conversion errors
- **Leaflet Layer Creation**: Invalid GeoJSON for Leaflet.js
- **Memory Issues**: Large dataset processing failures

### **Error Recovery Strategies**

#### **1. Graceful Degradation**
```javascript
async function loadWithFallback(category, primaryUrl, fallbackUrl) {
  try {
    return await loadFromUrl(primaryUrl);
  } catch (error) {
    console.warn(`Primary data source failed for ${category}:`, error);
    
    if (fallbackUrl) {
      try {
        console.log(`Attempting fallback data source for ${category}`);
        return await loadFromUrl(fallbackUrl);
      } catch (fallbackError) {
        console.error(`Fallback data source also failed for ${category}:`, fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}
```

#### **2. Partial Data Loading**
```javascript
function loadPartialData(features, category) {
  const validFeatures = [];
  const invalidFeatures = [];
  
  features.forEach(feature => {
    try {
      if (validateFeature(feature).valid) {
        validFeatures.push(feature);
      } else {
        invalidFeatures.push(feature);
      }
    } catch (error) {
      invalidFeatures.push(feature);
      console.warn(`Feature validation failed:`, error);
    }
  });
  
  // Log statistics
  console.log(`${category}: Loaded ${validFeatures.length}/${features.length} features`);
  
  if (invalidFeatures.length > 0) {
    console.warn(`${category}: ${invalidFeatures.length} invalid features skipped`);
  }
  
  return validFeatures;
}
```

#### **3. User Feedback**
```javascript
function showLoadingError(category, error) {
  const message = `Failed to load ${category} data: ${error.message}`;
  
  // Show user-friendly error message
  window.showSidebarError(message, 10000);
  
  // Log detailed error for debugging
  console.error(`Data loading error for ${category}:`, error);
  
  // Update UI to show loading failure
  updateLoadingStatus(category, 'error');
}
```

## Performance Optimization

### **Loading Performance Targets**

- **SES Data**: < 100ms (typically 50-80ms)
- **LGA Data**: < 120ms (typically 80-100ms)
- **CFA Data**: < 150ms (typically 100-130ms)
- **Police Data**: < 200ms (typically 150-180ms)
- **Total Loading**: < 500ms for all categories

### **Performance Monitoring**

```javascript
class DataLoadingMonitor {
  constructor() {
    this.loadingTimes = {};
    this.errorRates = {};
    this.dataSizes = {};
  }
  
  startLoading(category) {
    this.loadingTimes[category] = performance.now();
  }
  
  finishLoading(category, success = true) {
    if (this.loadingTimes[category]) {
      const duration = performance.now() - this.loadingTimes[category];
      
      // Track loading time
      if (!this.loadingTimes[category + '_history']) {
        this.loadingTimes[category + '_history'] = [];
      }
      this.loadingTimes[category + '_history'].push(duration);
      
      // Track error rates
      if (!this.errorRates[category]) {
        this.errorRates[category] = { total: 0, errors: 0 };
      }
      this.errorRates[category].total++;
      if (!success) this.errorRates[category].errors++;
      
      // Performance warnings
      if (duration > this.getPerformanceTarget(category)) {
        console.warn(`${category} loading took ${duration}ms, exceeding target`);
      }
    }
  }
  
  getPerformanceTarget(category) {
    const targets = {
      'ses': 100,
      'lga': 120,
      'cfa': 150,
      'police': 200
    };
    return targets[category] || 200;
  }
}
```

### **Optimization Strategies**

#### **1. Parallel Loading**
```javascript
async function loadAllCategories() {
  const categories = ['ses', 'lga', 'cfa', 'police', 'ambulance'];
  
  // Load all categories in parallel
  const loadingPromises = categories.map(category => 
    loadPolygonCategory(category, getCategoryMeta(category))
  );
  
  try {
    const results = await Promise.allSettled(loadingPromises);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`${categories[index]} loaded successfully`);
      } else {
        console.error(`${categories[index]} failed to load:`, result.reason);
      }
    });
    
  } catch (error) {
    console.error('Parallel loading failed:', error);
  }
}
```

#### **2. Progressive Loading**
```javascript
async function loadProgressively() {
  // Load critical data first
  await loadPolygonCategory('ses', getCategoryMeta('ses'));
  updateLoadingProgress(25);
  
  // Load secondary data
  await loadPolygonCategory('lga', getCategoryMeta('lga'));
  updateLoadingProgress(50);
  
  // Load additional data
  await loadPolygonCategory('cfa', getCategoryMeta('cfa'));
  updateLoadingProgress(75);
  
  // Load remaining data
  await loadPolygonCategory('police', getCategoryMeta('police'));
  updateLoadingProgress(100);
}
```

## Data Validation & Quality

### **GeoJSON Validation**

#### **1. Structure Validation**
```javascript
function validateGeoJSONStructure(geojson) {
  // Check top-level structure
  if (!geojson || typeof geojson !== 'object') {
    return { valid: false, reason: 'Invalid GeoJSON object' };
  }
  
  if (geojson.type !== 'FeatureCollection') {
    return { valid: false, reason: 'Expected FeatureCollection' };
  }
  
  if (!Array.isArray(geojson.features)) {
    return { valid: false, reason: 'Missing features array' };
  }
  
  return { valid: true };
}
```

#### **2. Feature Validation**
```javascript
function validateFeature(feature) {
  // Check feature structure
  if (!feature || typeof feature !== 'object') {
    return { valid: false, reason: 'Invalid feature object' };
  }
  
  if (feature.type !== 'Feature') {
    return { valid: false, reason: 'Expected Feature type' };
  }
  
  // Check geometry
  if (!feature.geometry || typeof feature.geometry !== 'object') {
    return { valid: false, reason: 'Missing or invalid geometry' };
  }
  
  // Check properties
  if (!feature.properties || typeof feature.properties !== 'object') {
    return { valid: false, reason: 'Missing or invalid properties' };
  }
  
  return { valid: true };
}
```

### **Data Quality Metrics**

#### **1. Completeness**
- **Required Properties**: All features have essential properties
- **Coordinate Coverage**: All features have valid coordinates
- **Category Assignment**: All features properly categorized

#### **2. Accuracy**
- **Coordinate Precision**: Appropriate precision for feature type
- **Boundary Consistency**: Polygon boundaries are closed and valid
- **Property Accuracy**: Feature properties match actual data

#### **3. Performance**
- **File Size**: Optimized for web delivery
- **Feature Count**: Reasonable number of features per category
- **Rendering Speed**: Features render within performance targets

## Integration Points

### **UI Integration**

#### **1. Sidebar Population**
```javascript
function populateSidebar(category, features) {
  const container = document.getElementById(category + 'List');
  
  features.forEach(feature => {
    const checkbox = createFeatureCheckbox(feature, category);
    container.appendChild(checkbox);
  });
  
  // Update collapsible behavior
  updateCollapsibleBehavior(category);
}
```

#### **2. Map Layer Integration**
```javascript
function addFeaturesToMap(category, features) {
  const layers = features.map(feature => 
    L.geoJSON(feature, getFeatureStyle(category))
  );
  
  // Add to map
  layers.forEach(layer => {
    layer.addTo(window.map);
    window.featureLayers[category].push(layer);
  });
}
```

### **State Management Integration**

#### **1. Feature Registry**
```javascript
function updateFeatureRegistry(category, features) {
  // Update names by category
  window.namesByCategory[category] = features.map(f => 
    f.properties.name || f.properties.NAME || 'Unnamed Feature'
  );
  
  // Update name to key mapping
  window.nameToKey[category] = {};
  features.forEach(feature => {
    const name = feature.properties.name || feature.properties.NAME;
    const key = generateFeatureKey(name, category);
    window.nameToKey[category][name] = key;
  });
}
```

#### **2. Layer Management**
```javascript
function updateLayerRegistry(category, layers) {
  if (!window.featureLayers[category]) {
    window.featureLayers[category] = [];
  }
  
  // Add new layers
  window.featureLayers[category].push(...layers);
  
  // Update layer count
  console.log(`${category}: ${layers.length} layers added to registry`);
}
```

## Best Practices

### **Data Loading Best Practices**

1. **Error Handling**: Always implement try-catch blocks around data loading
2. **Validation**: Validate data structure before processing
3. **Performance Monitoring**: Track loading times and error rates
4. **User Feedback**: Provide clear feedback during loading and on errors
5. **Graceful Degradation**: Continue functioning with partial data

### **Coordinate System Best Practices**

1. **System Detection**: Automatically detect coordinate system type
2. **Conversion Safety**: Implement safe coordinate conversion with error handling
3. **Validation**: Validate converted coordinates before use
4. **Documentation**: Document coordinate system assumptions and conversions
5. **Testing**: Test coordinate conversion with known good data

### **Performance Best Practices**

1. **Parallel Loading**: Load multiple data sources in parallel where possible
2. **Progressive Loading**: Load critical data first, then secondary data
3. **Caching**: Implement appropriate caching strategies
4. **Monitoring**: Track performance metrics and alert on regressions
5. **Optimization**: Continuously optimize based on performance data

## Future Enhancements

### **Planned Improvements**

1. **Smart Caching**: Intelligent cache management with offline support
2. **Real-time Updates**: Live data updates without full reloads
3. **Data Compression**: Optimize data transfer and storage
4. **Advanced Validation**: More sophisticated data quality checks
5. **Performance Analytics**: Detailed performance analysis and optimization

### **Architecture Evolution**

1. **ES Module Migration**: Convert from window globals to ES modules
2. **TypeScript Integration**: Add type safety to data loading
3. **Plugin Architecture**: Extensible data source system
4. **Microservice Support**: Support for distributed data sources
5. **Real-time Streaming**: Support for streaming data updates

## Related Documentation

- **[AppBootstrap System](app-bootstrap.md)** - Application initialization architecture
- **[Component Architecture](components.md)** - UI component design and patterns
- **[Data Flow & State Management](data-flow.md)** - State management architecture
- **[Performance Baselines](../templates/performance-baselines.md)** - Performance measurement
- **[Terms of Reference](../terms-of-reference.md)** - Standardized terminology and vocabulary reference
- **[E2E Troubleshooting Guide](../development/e2e-troubleshooting-guide.md)** - Testing and debugging

---

*This documentation provides comprehensive coverage of the data loading architecture, including recent improvements in error handling and coordinate conversion.*
