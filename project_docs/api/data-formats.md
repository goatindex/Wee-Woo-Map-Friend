# Data Formats & Schemas

> **Comprehensive data structure reference for WeeWoo Map Friend APIs**

## 📋 Overview

WeeWoo Map Friend uses standardized data formats for emergency services data, state management, and configuration. This document covers GeoJSON specifications, state object schemas, and configuration structures.

## 🗺️ GeoJSON Data Formats

### **Emergency Services GeoJSON Structure**

All emergency services data follows GeoJSON specification with service-specific properties:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon|Point",
        "coordinates": [[...]] | [lon, lat]
      },
      "properties": {
        "service_specific_name_field": "Display Name",
        "additional_properties": "..."
      }
    }
  ]
}
```

### **SES (State Emergency Service) Data**

**File**: `geojson/ses.geojson` (27MB)  
**Type**: Polygon features  
**Purpose**: SES response zone boundaries

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[144.123, -37.456], [144.234, -37.567], ...]]
  },
  "properties": {
    "RESPONSE_ZONE_NAME": "Ballarat",
    "REGION": "Grampians",
    "STATUS": "Active"
  }
}
```

**Key Properties:**
- `RESPONSE_ZONE_NAME` - Primary display name (configured in `categoryMeta.ses.nameProp`)
- `REGION` - SES administrative region
- `STATUS` - Operational status

### **CFA (Country Fire Authority) Data**

**File**: `geojson/cfa.geojson` (39MB)  
**Type**: Polygon features  
**Purpose**: CFA brigade response areas

```json
{
  "type": "Feature", 
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...coordinates...]]]
  },
  "properties": {
    "BRIG_NAME": "Ballarat Fire Brigade",
    "BRIG_NO": "B123",
    "DISTRICT": "Ballarat"
  }
}
```

**Key Properties:**
- `BRIG_NAME` - Brigade name (primary identifier)
- `BRIG_NO` - Brigade number
- `DISTRICT` - Administrative district

### **LGA (Local Government Area) Data**

**File**: `geojson/LGAs.geojson` (31MB)  
**Type**: Polygon features  
**Purpose**: Municipal boundaries

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon", 
    "coordinates": [[[...large_polygon_coordinates...]]]
  },
  "properties": {
    "LGA_NAME": "City of Melbourne",
    "LGA_CODE": "24650",
    "STATE": "VIC"
  }
}
```

**Key Properties:**
- `LGA_NAME` - Council/municipality name
- `LGA_CODE` - Unique LGA identifier
- `STATE` - State/territory code

### **Ambulance Victoria Data**

**File**: `geojson/ambulance.geojson` (1.7MB)  
**Type**: Point features  
**Purpose**: Ambulance station locations

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [144.9631, -37.8136]
  },
  "properties": {
    "facility_name": "Melbourne Ambulance Station",
    "facility_state": "Victoria",
    "facility_lat": -37.8136,
    "facility_long": 144.9631
  }
}
```

**Key Properties:**
- `facility_name` - Station name (primary identifier)
- `facility_state` - Filtered to "Victoria" only
- `facility_lat`, `facility_long` - Coordinates (validated)

### **Police Station Data**

**File**: `geojson/police.geojson` (295KB)  
**Type**: Point features  
**Purpose**: Victoria Police station locations

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [144.9631, -37.8136]
  },
  "properties": {
    "place_name": "Melbourne Police Station",
    "address": "123 Collins Street",
    "suburb": "Melbourne"
  }
}
```

**Key Properties:**
- `place_name` - Station name (primary identifier)
- `address` - Street address
- `suburb` - Suburb/locality

### **FRV (Fire Rescue Victoria) Data**

**File**: `geojson/frv.geojson` (1.7MB)  
**Type**: Polygon features  
**Purpose**: FRV coverage zones

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...coordinates...]]]
  },
  "properties": {
    "AGENCY": "Fire Rescue Victoria",
    "STATION": "South Melbourne",
    "COVERAGE_TYPE": "Primary"
  }
}
```

**Key Properties:**
- `AGENCY` - Service agency name
- `STATION` - Station identifier
- `COVERAGE_TYPE` - Coverage classification

## ⚡ State Management Schemas

### **Feature Layers Structure**

Central storage for all loaded map layers:

```typescript
interface FeatureLayersMap {
  ses: LayerBucket;
  lga: LayerBucket;
  cfa: LayerBucket;
  ambulance: LayerBucket;
  police: LayerBucket;
  frv: LayerBucket;
}

interface LayerBucket {
  [key: string]: L.Layer[] | L.Marker | null;
}
```

**Usage Example:**
```javascript
// Access SES layers
window.featureLayers.ses['ballarat'] // Array of Leaflet layers
window.featureLayers.ambulance['melbourne_station'] // Single marker

// Check if layer is loaded
if (window.featureLayers.cfa['brigadeKey']) {
  console.log('CFA brigade loaded');
}
```

### **Names and Key Mapping**

Display name management and search functionality:

```typescript
interface NamesByCategoryMap {
  ses: string[];
  lga: string[];
  cfa: string[];
  ambulance: string[];
  police: string[];
  frv: string[];
}

interface NameToKeyMap {
  [category: string]: {
    [displayName: string]: string; // Display name -> internal key
  };
}
```

**Usage Example:**
```javascript
// Get sorted display names
window.namesByCategory.ses // ["Ballarat", "Bendigo", ...]

// Convert display name to internal key
const key = window.nameToKey.ses["Ballarat"]; // "ballarat"

// Search functionality
const filtered = window.namesByCategory.ses.filter(name => 
  name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### **Visual State Management**

Track emphasis and label visibility:

```typescript
interface EmphasisedMap {
  [category: string]: {
    [key: string]: boolean;
  };
}

interface NameLabelMarkersMap {
  [category: string]: {
    [key: string]: L.Marker | null;
  };
}
```

**Usage Example:**
```javascript
// Set feature emphasis
window.emphasised.ses['ballarat'] = true;

// Manage labels
window.nameLabelMarkers.cfa['brigade_key'] = labelMarker;

// Check visual state
if (window.emphasised.ambulance[key]) {
  console.log('Ambulance station is emphasized');
}
```

## 🔧 Configuration Schemas

### **Category Metadata**

Defines behavior and properties for each emergency service category:

```typescript
interface CategoryMeta {
  type: 'polygon' | 'point';
  nameProp: string;
  styleFn: ((feature?: any) => L.PathOptions) | null;
  defaultOn: () => boolean;
  listId: string;
  toggleAllId: string;
}
```

**Complete Configuration:**
```javascript
window.categoryMeta = {
  ses: {
    type: 'polygon',
    nameProp: 'RESPONSE_ZONE_NAME',
    styleFn: sesStyle, // Orange styling
    defaultOn: () => false,
    listId: 'sesList',
    toggleAllId: 'toggleAllSES'
  },
  lga: {
    type: 'polygon', 
    nameProp: 'LGA_NAME',
    styleFn: lgaStyle, // Blue dashed styling
    defaultOn: () => false,
    listId: 'lgaList',
    toggleAllId: 'toggleAllLGAs'
  },
  cfa: {
    type: 'polygon',
    nameProp: 'BRIG_NAME', 
    styleFn: cfaStyle, // Red styling
    defaultOn: () => false,
    listId: 'cfaList',
    toggleAllId: 'toggleAllCFA'
  },
  ambulance: {
    type: 'point',
    nameProp: 'facility_name',
    styleFn: null, // Uses custom icon
    defaultOn: () => false,
    listId: 'ambulanceList',
    toggleAllId: 'toggleAllAmbulance'
  },
  police: {
    type: 'point',
    nameProp: 'place_name',
    styleFn: null, // Uses custom icon
    defaultOn: () => false,
    listId: 'policeList', 
    toggleAllId: 'toggleAllPolice'
  },
  frv: {
    type: 'polygon',
    nameProp: 'AGENCY',
    styleFn: frvStyle, // Crimson styling
    defaultOn: () => false,
    listId: 'frvList',
    toggleAllId: 'toggleAllFRV'
  }
};
```

### **Style Configuration**

Visual styling for map features:

```javascript
// Outline colors per category
window.outlineColors = {
  ses: '#cc7a00',      // Orange
  lga: 'black',        // Black
  cfa: '#FF0000',      // Red
  ambulance: '#d32f2f', // Dark red
  police: '#145088',   // Blue
  frv: '#DC143C'       // Crimson
};

// Fill opacity per category
window.baseOpacities = {
  ses: 0.2,
  lga: 0.1, 
  cfa: 0.1,
  frv: 0.1
};

// Color adjustment factors
window.labelColorAdjust = {
  ses: 0.85,   // Slightly darker labels
  lga: 1.0,    // No adjustment
  cfa: 1.0,
  ambulance: 1.0,
  police: 1.0,
  frv: 1.0
};
```

### **Styling Functions**

Leaflet path options for each service type:

```javascript
// SES orange styling
window.sesStyle = function() {
  return {
    color: '#FF9900',
    weight: 3,
    fillColor: 'orange', 
    fillOpacity: 0.2
  };
};

// LGA blue dashed styling
window.lgaStyle = function() {
  return {
    color: '#001A70',
    weight: 1.5,
    fillColor: '#0082CA',
    fillOpacity: 0.1,
    dashArray: '8 8'
  };
};

// CFA red styling
window.cfaStyle = function() {
  return {
    color: 'red',
    weight: 2,
    fillColor: 'red',
    fillOpacity: 0.1
  };
};

// FRV crimson styling  
window.frvStyle = function() {
  return {
    color: 'crimson',
    weight: 2,
    fillColor: 'crimson',
    fillOpacity: 0.1
  };
};
```

## 📡 Weather API Data Format

### **Request Format**

```typescript
interface WeatherRequest {
  lat: number;        // -90 to 90
  lon: number;        // -180 to 180  
  days?: number;      // 1-7, default 7
  provider?: string;  // 'mock' | 'open-meteo' | 'willyweather'
}
```

### **Response Format**

```typescript
interface WeatherResponse {
  location: {
    lat: number;
    lon: number;
  };
  days: number;
  forecast: WeatherDay[];
}

interface WeatherDay {
  day: number;
  summary: string;
  tempMin: number;
  tempMax: number;
}
```

**Example Response:**
```json
{
  "location": { "lat": -37.8136, "lon": 144.9631 },
  "days": 7,
  "forecast": [
    {
      "day": 1,
      "summary": "Partly cloudy with light winds",
      "tempMin": 12,
      "tempMax": 22
    },
    {
      "day": 2, 
      "summary": "Overcast with possible showers",
      "tempMin": 14,
      "tempMax": 19
    }
  ]
}
```

## 🚀 Native Features Data Format

### **Position Data**

Enhanced geolocation with native/web source indication:

```typescript
interface PositionData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  source: 'native' | 'web';
}
```

### **Device Information**

```typescript
interface DeviceInfo {
  model: string;
  platform: string;
  operatingSystem: 'ios' | 'android' | 'web';
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  webViewVersion: string;
  source: 'native' | 'web';
}
```

### **Network Status**

```typescript
interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'unknown';
  source: 'native' | 'web';
}
```

## 🔄 Coordinate System Handling

### **Projection Conversion**

Some data sources use MGA94/UTM coordinates which require conversion:

```javascript
// Check for MGA94 coordinates (large values > 1000)
if (coords.length >= 2 && coords[0] > 1000) {
  // Convert MGA94/UTM to lat/lng
  const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
  feature.geometry.coordinates = [latLng.lng, latLng.lat];
}
```

### **GeoJSON Coordinate Order**

**Important**: GeoJSON uses `[longitude, latitude]` order:

```json
{
  "type": "Point",
  "coordinates": [144.9631, -37.8136]
}
```

**Not** `[latitude, longitude]` like many APIs.

## 🔗 Related Documentation

- **[API Overview](README.md)** - Complete API reference index
- **[Examples](examples.md)** - Practical usage examples for all data formats
- **[Error Handling](error-handling.md)** - Data validation and error recovery
- **[Performance](rate-limits.md)** - Optimization for large datasets

---

**Next**: Learn about [practical usage examples](examples.md) for implementing these data formats.