# API Endpoints

Detailed API endpoint reference for WeeWoo Map Friend, covering backend services, frontend configuration, and data management.

## 📋 **Table of Contents**

- [Backend Endpoints](#backend-endpoints)
- [Frontend Configuration](#frontend-configuration)
- [Data Loading Patterns](#data-loading-patterns)
- [UI Control APIs](#ui-control-apis)
- [Error Handling](#error-handling)
- [Caching Strategies](#caching-strategies)

## 🔧 **Backend Endpoints**

### **Health Check**

Simple health monitoring endpoint for system status.

```http
GET /health
```

**Response**: `200 OK`

```json
{
  "status": "ok"
}
```

**Use Cases**:
- System monitoring and health checks
- Load balancer health verification
- Deployment verification

---

### **Weather Service**

7-day weather forecast with support for multiple providers.

```http
GET /api/weather?lat={latitude}&lon={longitude}&days={days}&provider={provider}
```

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | number | ✅ | - | Latitude (-90 to 90) |
| `lon` | number | ✅ | - | Longitude (-180 to 180) |
| `days` | number | ❌ | 7 | Forecast days (1-7) |
| `provider` | string | ❌ | mock | Provider: `mock`, `open-meteo`, `willyweather` |

**Response**: `200 OK`

```json
{
  "location": {
    "lat": -37.8136,
    "lon": 144.9631
  },
  "days": 7,
  "forecast": [
    {
      "day": 1,
      "summary": "Partly cloudy",
      "tempMin": 12,
      "tempMax": 22
    },
    {
      "day": 2,
      "summary": "Clear sky",
      "tempMin": 10,
      "tempMax": 25
    }
  ]
}
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| `400 Bad Request` | Invalid parameters | Missing or invalid lat/lon values |
| `404 Not Found` | Location not found | Coordinates outside supported range |
| `502 Bad Gateway` | Upstream error | External weather service failure |
| `504 Gateway Timeout` | Request timeout | External service response timeout |

**Example Usage**:

```javascript
// Fetch weather for Melbourne
const response = await fetch('/api/weather?lat=-37.8136&lon=144.9631&days=3&provider=willyweather');
const weather = await response.json();

if (response.ok) {
  console.log(`Today: ${weather.forecast[0].summary}`);
} else {
  console.error('Weather fetch failed:', weather);
}
```

---

## 🎨 **Frontend Configuration**

### **Category Metadata**

Global configuration for map layers and categories.

```javascript
window.categoryMeta = {
  ses: {
    type: 'polygon',
    nameProp: 'RESPONSE_ZONE_NAME',
    styleFn: sesStyle,
    defaultOn: () => false,
    listId: 'sesList',
    toggleAllId: 'toggleAllSES'
  },
  lga: {
    type: 'polygon',
    nameProp: 'LGA_NAME',
    styleFn: lgaStyle,
    defaultOn: () => false,
    listId: 'lgaList',
    toggleAllId: 'toggleAllLGAs'
  },
  cfa: {
    type: 'polygon',
    nameProp: 'BRIG_NAME',
    styleFn: cfaStyle,
    defaultOn: () => false,
    listId: 'cfaList',
    toggleAllId: 'toggleAllCFA'
  },
  ambulance: {
    type: 'point',
    nameProp: 'facility_name',
    styleFn: null,
    defaultOn: () => false,
    listId: 'ambulanceList',
    toggleAllId: 'toggleAllAmbulance'
  },
  police: {
    type: 'point',
    nameProp: 'place_name',
    styleFn: null,
    defaultOn: () => false,
    listId: 'policeList',
    toggleAllId: 'toggleAllPolice'
  },
  frv: {
    type: 'polygon',
    nameProp: 'AGENCY',
    styleFn: frvStyle,
    defaultOn: () => false,
    listId: 'frvList',
    toggleAllId: 'toggleAllFRV'
  }
};
```

**Configuration Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Geometry type: `'polygon'` or `'point'` |
| `nameProp` | string | GeoJSON property for display names |
| `styleFn` | function | Leaflet styling function (null for defaults) |
| `defaultOn` | function | Whether category is enabled by default |
| `listId` | string | DOM ID for category list container |
| `toggleAllId` | string | DOM ID for category group checkbox |

---

### **Styling Configuration**

Visual styling and color configuration for map layers.

```javascript
// Outline colors for each category
window.outlineColors = {
  ses: '#cc7a00',      // Orange
  lga: 'black',        // Black
  cfa: '#FF0000',      // Red
  ambulance: '#d32f2f', // Dark red
  police: '#145088',   // Blue
  frv: '#DC143C'       // Crimson
};

// Base opacity for fill colors
window.baseOpacities = {
  ses: 0.2,
  lga: 0.1,
  cfa: 0.1,
  frv: 0.1
};

// Color adjustment factors
window.labelColorAdjust = {
  ses: 0.85,    // Darker
  lga: 1.0,     // No change
  cfa: 1.0,     // No change
  ambulance: 1.0,
  police: 1.0,
  frv: 1.0
};
```

**Style Functions**:

```javascript
// SES (State Emergency Service) styling
window.sesStyle = function() {
  return {
    color: '#FF9900',
    weight: 3,
    fillColor: 'orange',
    fillOpacity: 0.2
  };
};

// LGA (Local Government Area) styling
window.lgaStyle = function() {
  return {
    color: '#001A70',
    weight: 1.5,
    fillColor: '#0082CA',
    fillOpacity: 0.1,
    dashArray: '8 8'
  };
};

// CFA (Country Fire Authority) styling
window.cfaStyle = function() {
  return {
    color: 'red',
    weight: 2,
    fillColor: 'red',
    fillOpacity: 0.1
  };
};
```

---

## 📊 **Data Loading Patterns**

### **GeoJSON Loading**

Data loading follows a modular pattern with specialized loaders for each category.

```javascript
// Example: Loading SES boundaries
import { loadSESBoundaries } from './loaders/ses.js';

const sesData = await loadSESBoundaries();
if (sesData.success) {
  // Add to map
  map.addLayer(sesData.layer);
} else {
  console.error('Failed to load SES data:', sesData.error);
}
```

**Loading Process**:

1. **Preloader**: Initialize data structures and UI elements
2. **Loader Modules**: Category-specific data loading
3. **Processing**: GeoJSON parsing and validation
4. **Rendering**: Leaflet layer creation and styling
5. **UI Updates**: Sidebar population and controls

**Error Handling**:

```javascript
// Standard loading response format
{
  success: boolean,
  data?: any,
  error?: string,
  layer?: L.Layer,
  count?: number
}
```

---

## 🎛️ **UI Control APIs**

### **Sidebar Management**

Dynamic sidebar population and category management.

```javascript
// Toggle category visibility
function toggleCategory(category, enabled) {
  const layer = getCategoryLayer(category);
  if (enabled) {
    map.addLayer(layer);
    showCategoryInSidebar(category);
  } else {
    map.removeLayer(layer);
    hideCategoryInSidebar(category);
  }
}

// Update sidebar content
function updateSidebar(category, data) {
  const container = document.getElementById(window.categoryMeta[category].listId);
  if (container) {
    container.innerHTML = generateCategoryList(data);
  }
}
```

### **Responsive Behavior**

Device-specific optimizations and responsive controls.

```javascript
// Device context detection
const deviceContext = getDeviceContext();

// Responsive breakpoints
const breakpoints = {
  mobileSmall: 480,
  mobileLarge: 768,
  tablet: 1024,
  desktop: 1200
};

// Adaptive touch targets
const touchTargetSize = deviceContext.isTouch ? 44 : 34;
```

---

## ⚠️ **Error Handling**

### **Backend Error Responses**

All backend endpoints return consistent error formats.

```json
{
  "error": "error_type",
  "message": "Human-readable error description",
  "details": {
    "parameter": "Additional error context",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

### **Frontend Error Handling**

Graceful degradation and user feedback for failures.

```javascript
// Data loading error handling
try {
  const data = await loadCategoryData(category);
  if (data.success) {
    displayData(data);
  } else {
    showErrorMessage(`Failed to load ${category}: ${data.error}`);
  }
} catch (error) {
  console.error('Unexpected error:', error);
  showErrorMessage('An unexpected error occurred. Please try again.');
}
```

---

## 🚀 **Caching Strategies**

### **Backend Caching**

In-memory caching with TTL for weather data.

```javascript
// Cache configuration
const CACHE_TTL_SECONDS = 300; // 5 minutes
const cache = new Map();

// Cache operations
function cacheGet(key) {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function cacheSet(key, data, ttl = CACHE_TTL_SECONDS) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttl * 1000)
  });
}
```

### **Frontend Caching**

Service Worker caching for offline support and performance.

```javascript
// Cache strategies
const cacheStrategies = {
  // Static assets: HTML, CSS, JS, manifest
  static: 'cache-first',
  
  // Data files: GeoJSON, JSON data
  data: 'stale-while-revalidate',
  
  // Dynamic content: API responses
  dynamic: 'network-first',
  
  // External resources: Third-party services
  external: 'cache-with-fallback'
};
```

---

## 🔗 **Related Documentation**

- **[API Overview](README.md)**: General API information and navigation
- **[Integration Guide](integration.md)**: Third-party services and data sources
- **[Architecture Overview](../architecture/overview.md)**: System design patterns
- **[Performance Baselines](../performance/baselines.md)**: Performance optimization

---

**This endpoints documentation provides comprehensive coverage of all available API endpoints, configuration options, and usage patterns for WeeWoo Map Friend.**

_Created: 2025-01-01_  
_Purpose: Detailed API endpoint reference_  
_Maintenance: Update when new endpoints or configuration options are added_
