# WeeWoo Map Friend - API Reference

> **Comprehensive API documentation for the WeeWoo Map Friend emergency services mapping application**

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [API Categories](#api-categories)
- [Authentication & Security](#authentication--security)
- [Performance & Rate Limits](#performance--rate-limits)
- [Error Handling](#error-handling)
- [Examples & Usage](#examples--usage)

## 🚀 Quick Start

WeeWoo Map Friend provides multiple API layers for different use cases:

### **Frontend APIs** (JavaScript)
```javascript
// Emergency Services Data Loading
await window.loadPolygonCategory('ses', 'geojson/ses.geojson');
await window.loadAmbulance();

// Map Layer Management  
window.featureLayers.ses['response_zone_key'].forEach(layer => layer.addTo(map));

// Native Features (Mobile Apps)
const position = await window.NativeFeatures.getCurrentPosition();
await window.NativeFeatures.hapticFeedback('success');
```

### **Backend APIs** (HTTP)
```javascript
// Weather Integration
const weather = await fetch('/api/weather?lat=-37.8136&lon=144.9631&days=7');

// Health Check
const health = await fetch('/health');
```

### **Service Worker APIs** (PWA)
```javascript
// Offline Support
navigator.serviceWorker.register('/sw.js');

// Cache Management
caches.open('weewoo-static-v1.0').then(cache => /* ... */);
```

## 📋 API Categories

### **1. Emergency Services Data API**
📍 **[Data Formats Documentation](data-formats.md)**

Load and manage Victoria emergency service boundaries:
- **SES Response Zones** - State Emergency Service coverage areas
- **CFA Brigades** - Country Fire Authority response territories  
- **LGA Boundaries** - Local Government Area boundaries
- **Ambulance Stations** - Victoria Ambulance service points
- **Police Stations** - Victoria Police station locations
- **FRV Areas** - Fire Rescue Victoria coverage zones

```javascript
// Load polygon-based services (SES, CFA, LGA, FRV)
await window.loadPolygonCategory(category, geoJsonUrl);

// Load point-based services (Ambulance, Police) 
await window.loadAmbulance();
await window.loadPolice();
```

### **2. Map Layer Management API**
🗺️ **[Examples Documentation](examples.md)**

Control map layer visibility, emphasis, and labeling:

```javascript
// Layer State Management
window.featureLayers[category][key] // Access layer objects
window.emphasised[category][key] = true // Highlight features
window.nameLabelMarkers[category][key] // Access labels

// Bulk Operations
window.beginBulkOperation();
// ... perform multiple layer changes ...
window.endBulkOperation(); // Process deferred labels
```

### **3. Weather Integration API**
🌦️ **[Backend Endpoints Documentation](endpoints.md)**

Multi-provider weather forecasting with automatic fallback:

```http
GET /api/weather?lat={latitude}&lon={longitude}&days={days}&provider={provider}
```

Supports WillyWeather, Open-Meteo, and mock data providers.

### **4. Native Mobile API**
📱 **[Native Features Documentation](native-api.md)**

Capacitor-powered native app features with web fallbacks:

```javascript
// Enhanced Geolocation
const position = await window.NativeFeatures.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000
});

// Haptic Feedback
await window.NativeFeatures.hapticFeedback('success');

// Device Information
const deviceInfo = await window.NativeFeatures.getDeviceInfo();
```

### **5. Progressive Web App API**
💾 **[PWA & Offline Documentation](pwa-api.md)**

Service Worker-powered offline functionality:

- **Cache-First Strategy** - Static assets (HTML, CSS, JS)
- **Stale-While-Revalidate** - GeoJSON data files
- **Network-First** - Dynamic content with cache fallback
- **Background Sync** - Automatic cache updates

### **6. State Management API**
⚡ **[Data Formats Documentation](data-formats.md)**

Centralized application state management:

```javascript
// Feature Layer Storage
window.featureLayers: {
  ses: {}, lga: {}, cfa: {}, 
  ambulance: {}, police: {}, frv: {}
}

// UI State Management
window.namesByCategory // Sorted display names
window.nameToKey // Display name to internal key mapping
window.emphasised // Visual emphasis state
window.nameLabelMarkers // Label visibility state
```

## 🔐 Authentication & Security

📚 **[Authentication Documentation](authentication.md)**

- **API Key Protection** - Backend proxy prevents frontend exposure
- **CORS Configuration** - Restricted origins for backend services
- **Input Sanitization** - All user inputs validated and escaped
- **HTTPS Required** - PWA and geolocation features require secure context

## ⚡ Performance & Rate Limits

📊 **[Rate Limits & Performance Documentation](rate-limits.md)**

### **Performance Targets**
- **Layer Rendering**: < 100ms (95% of operations)
- **User Interactions**: < 50ms (95% of interactions)  
- **First Contentful Paint**: < 1.8s (90% of users)
- **Time to Interactive**: < 3.8s (90% of users)

### **Rate Limiting**
- **Nominatim Geocoding**: 1 request/second (development scripts only)
- **WillyWeather API**: Provider-specific limits
- **GeoJSON Loading**: Client-side caching with stale-while-revalidate

## 🚨 Error Handling

📋 **[Error Handling Documentation](error-handling.md)**

Comprehensive error handling patterns across all API layers:

```javascript
// Graceful Degradation
try {
  await window.loadPolygonCategory('ses', 'geojson/ses.geojson');
} catch (error) {
  window.showSidebarError('Failed to load SES data. Please try again.');
  console.error('SES loading error:', error);
}

// Weather API Fallback
if (weatherProvider === 'willyweather' && error) {
  // Automatic fallback to Open-Meteo
  await fetch('/api/weather?provider=open-meteo&...');
}
```

## 💡 Examples & Usage

📝 **[Comprehensive Examples Documentation](examples.md)**

Ready-to-use code examples for all API categories:

- **Layer Loading** - Complete implementation examples
- **State Management** - Best practices for bulk operations
- **Weather Integration** - Error handling and provider fallback
- **Native Features** - Progressive enhancement patterns
- **Performance Optimization** - Async batching and caching strategies

## 🔗 Related Documentation

- **[Architecture Overview](../architecture/README.md)** - System design and data flow
- **[Development Guide](../development/README.md)** - Setup and contribution guidelines
- **[Performance Baselines](../performance/baselines.md)** - Optimization targets and monitoring

## 📖 API Reference Index

| Document | Description | Use Cases |
|----------|-------------|-----------|
| **[endpoints.md](endpoints.md)** | Backend HTTP API reference | Weather data, health checks |
| **[data-formats.md](data-formats.md)** | Data structures and schemas | GeoJSON processing, state management |
| **[examples.md](examples.md)** | Practical usage examples | Implementation guidance |
| **[authentication.md](authentication.md)** | Security and access control | Production deployment |
| **[rate-limits.md](rate-limits.md)** | Performance constraints | Optimization and monitoring |
| **[error-handling.md](error-handling.md)** | Error patterns and recovery | Robust application development |
| **[pwa-api.md](pwa-api.md)** | Service Worker and offline | PWA implementation |
| **[native-api.md](native-api.md)** | Mobile app features | Capacitor integration |
| **[geocoding.md](geocoding.md)** | Address search utilities | Data preparation and enhancement |

---

**Need help?** Check our [troubleshooting guide](../development/troubleshooting.md) or [open an issue](https://github.com/goatindex/mapexp.github.io/issues).