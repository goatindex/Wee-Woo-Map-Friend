# API Usage Examples

> **Practical code examples for all WeeWoo Map Friend APIs**

## 📋 Overview

This document provides ready-to-use code examples for integrating with WeeWoo Map Friend APIs. All examples include error handling and follow best practices.

## 🗺️ Emergency Services Data Loading

### **Loading Polygon Categories (SES, CFA, LGA, FRV)**

```javascript
/**
 * Load and display SES response zones
 */
const loadSESData = async () => {
  try {
    await window.loadPolygonCategory('ses', 'geojson/ses.geojson');
    console.log(`Loaded ${window.namesByCategory.ses.length} SES zones`);
    
    // Access loaded data
    window.namesByCategory.ses.forEach(zoneName => {
      const key = window.nameToKey.ses[zoneName];
      const layers = window.featureLayers.ses[key];
      console.log(`SES Zone: ${zoneName}, Layers: ${layers.length}`);
    });
  } catch (error) {
    console.error('Failed to load SES data:', error);
    window.showSidebarError('SES data unavailable. Please try again.');
  }
};

/**
 * Load multiple polygon categories in sequence
 */
const loadAllPolygonData = async () => {
  const categories = [
    { name: 'ses', file: 'geojson/ses.geojson' },
    { name: 'lga', file: 'geojson/LGAs.geojson' },
    { name: 'cfa', file: 'geojson/cfa.geojson' },
    { name: 'frv', file: 'geojson/frv.geojson' }
  ];
  
  for (const category of categories) {
    try {
      console.log(`Loading ${category.name}...`);
      await window.loadPolygonCategory(category.name, category.file);
      console.log(`✓ ${category.name} loaded successfully`);
    } catch (error) {
      console.error(`✗ Failed to load ${category.name}:`, error);
    }
  }
};
```

### **Loading Point Categories (Ambulance, Police)**

```javascript
/**
 * Load ambulance stations with filtering
 */
const loadAmbulanceStations = async () => {
  try {
    await window.loadAmbulance();
    
    // Filter to Melbourne metro area only
    const melbourneStations = window.namesByCategory.ambulance.filter(name =>
      name.toLowerCase().includes('melbourne') ||
      name.toLowerCase().includes('richmond') ||
      name.toLowerCase().includes('fitzroy')
    );
    
    console.log(`Found ${melbourneStations.length} Melbourne ambulance stations`);
    
    // Automatically show Melbourne stations
    melbourneStations.forEach(stationName => {
      const key = window.nameToKey.ambulance[stationName];
      window.showAmbulanceMarker(key);
    });
  } catch (error) {
    console.error('Failed to load ambulance data:', error);
  }
};

/**
 * Load police stations and filter by suburb
 */
const loadPoliceBySuburb = async (targetSuburb) => {
  try {
    await window.loadPolice();
    
    // Access police data for filtering
    const policeData = window.getPoliceFeatures ? await window.getPoliceFeatures() : [];
    
    const suburbStations = policeData.filter(feature =>
      feature.properties.suburb?.toLowerCase() === targetSuburb.toLowerCase()
    );
    
    console.log(`Found ${suburbStations.length} police stations in ${targetSuburb}`);
    
    // Show filtered stations
    suburbStations.forEach(station => {
      const name = station.properties.place_name;
      const key = window.nameToKey.police[name];
      if (key) {
        window.showPoliceMarker(key);
      }
    });
  } catch (error) {
    console.error('Failed to load police data:', error);
  }
};
```

## ⚡ Layer Management & Visualization

### **Show/Hide Layers Programmatically**

```javascript
/**
 * Toggle layer visibility with state management
 */
const toggleLayer = (category, displayName, visible) => {
  const key = window.nameToKey[category][displayName];
  const map = window.getMap();
  
  if (!key || !window.featureLayers[category][key]) {
    console.warn(`Layer not found: ${category}/${displayName}`);
    return;
  }
  
  const layers = window.featureLayers[category][key];
  const layerArray = Array.isArray(layers) ? layers : [layers];
  
  layerArray.forEach(layer => {
    if (visible) {
      layer.addTo(map);
      // Add labels for polygon layers
      if (window.categoryMeta[category].type === 'polygon') {
        window.ensureLabel(category, key, displayName, false, layer);
      }
    } else {
      map.removeLayer(layer);
      // Remove labels and emphasis
      window.emphasised[category][key] = false;
      if (window.nameLabelMarkers[category][key]) {
        map.removeLayer(window.nameLabelMarkers[category][key]);
        window.nameLabelMarkers[category][key] = null;
      }
    }
  });
  
  // Update UI checkbox
  const checkbox = document.getElementById(`${category}_${key}_checkbox`);
  if (checkbox) {
    checkbox.checked = visible;
  }
  
  // Update active list
  window.updateActiveList();
};

/**
 * Bulk layer operations with performance optimization
 */
const toggleAllLayers = async (category, visible) => {
  const items = window.namesByCategory[category] || [];
  
  if (items.length === 0) {
    console.warn(`No items loaded for category: ${category}`);
    return;
  }
  
  console.log(`${visible ? 'Showing' : 'Hiding'} ${items.length} ${category} items`);
  
  // Begin bulk operation for performance
  window.beginBulkOperation();
  window.beginActiveListBulk();
  
  try {
    const batchSize = 20;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      batch.forEach(displayName => {
        toggleLayer(category, displayName, visible);
      });
      
      // Yield control after each batch
      if (i + batchSize < items.length) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }
  } finally {
    // End bulk operations
    window.endBulkOperation();
    window.endActiveListBulk();
  }
};
```

### **Layer Emphasis and Highlighting**

```javascript
/**
 * Emphasize specific features on the map
 */
const emphasizeFeature = (category, displayName, emphasize = true) => {
  const key = window.nameToKey[category][displayName];
  
  if (!key) {
    console.warn(`Feature not found: ${category}/${displayName}`);
    return;
  }
  
  // Update emphasis state
  window.emphasised[category][key] = emphasize;
  
  // Apply visual emphasis based on category type
  if (window.categoryMeta[category].type === 'polygon') {
    const layers = window.featureLayers[category][key];
    if (Array.isArray(layers)) {
      layers.forEach(layer => {
        if (emphasize) {
          layer.setStyle({
            weight: 6,
            color: '#FFD700', // Gold highlight
            fillOpacity: 0.4
          });
        } else {
          // Reset to default style
          const defaultStyle = window.categoryMeta[category].styleFn();
          layer.setStyle(defaultStyle);
        }
      });
    }
  } else {
    // Point features (ambulance, police)
    const marker = window.featureLayers[category][key];
    if (marker && marker.getElement) {
      const element = marker.getElement();
      if (emphasize) {
        element.classList.add(`${category}-emph`);
      } else {
        element.classList.remove(`${category}-emph`);
      }
    }
  }
  
  // Update active list UI
  window.updateActiveList();
};

/**
 * Batch emphasize features in a region
 */
const emphasizeRegion = async (category, regionFilter) => {
  const allFeatures = window.namesByCategory[category] || [];
  const regionFeatures = allFeatures.filter(name => 
    name.toLowerCase().includes(regionFilter.toLowerCase())
  );
  
  console.log(`Emphasizing ${regionFeatures.length} ${category} features in ${regionFilter}`);
  
  // Clear existing emphasis
  allFeatures.forEach(name => emphasizeFeature(category, name, false));
  
  // Emphasize region features
  regionFeatures.forEach(name => emphasizeFeature(category, name, true));
};
```

## 🌦️ Weather API Integration

### **Basic Weather Fetching**

```javascript
/**
 * Fetch weather data with provider fallback
 */
const getWeatherData = async (lat, lon, provider = 'willyweather') => {
  const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5000'
    : '';
  
  const makeUrl = (provider) => 
    `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(provider)}`;
  
  try {
    // Try primary provider
    const response = await fetch(makeUrl(provider));
    if (!response.ok) throw new Error(`Weather API error ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`${provider} failed, trying fallback:`, error);
    
    // Fallback to Open-Meteo if WillyWeather fails
    if (provider === 'willyweather') {
      const fallbackResponse = await fetch(makeUrl('open-meteo'));
      if (!fallbackResponse.ok) throw new Error(`Fallback weather API error ${fallbackResponse.status}`);
      return await fallbackResponse.json();
    }
    
    throw error;
  }
};

/**
 * Weather integration with map features
 */
const addWeatherToFeature = async (category, displayName) => {
  try {
    // Get feature centroid for weather lookup
    const key = window.nameToKey[category][displayName];
    const layers = window.featureLayers[category][key];
    
    if (!layers) {
      throw new Error('Feature not loaded');
    }
    
    // Calculate centroid (simplified)
    let lat, lon;
    if (window.categoryMeta[category].type === 'polygon') {
      const bounds = layers[0].getBounds();
      lat = bounds.getCenter().lat;
      lon = bounds.getCenter().lng;
    } else {
      const latlng = layers.getLatLng();
      lat = latlng.lat;
      lon = latlng.lng;
    }
    
    // Fetch weather data
    const weatherData = await getWeatherData(lat, lon);
    
    // Display weather in popup or sidebar
    console.log(`Weather for ${displayName}:`, weatherData.forecast[0]);
    
    return weatherData;
  } catch (error) {
    console.error(`Failed to get weather for ${displayName}:`, error);
    throw error;
  }
};
```

### **Weather Dashboard Integration**

```javascript
/**
 * Create weather dashboard for active features
 */
const createWeatherDashboard = async () => {
  const activeFeatures = [];
  
  // Collect all active features across categories
  Object.keys(window.featureLayers).forEach(category => {
    Object.keys(window.featureLayers[category]).forEach(key => {
      const layers = window.featureLayers[category][key];
      const map = window.getMap();
      
      // Check if layer is currently on map
      if (Array.isArray(layers)) {
        if (layers.some(layer => map.hasLayer(layer))) {
          const displayName = Object.keys(window.nameToKey[category])
            .find(name => window.nameToKey[category][name] === key);
          activeFeatures.push({ category, key, displayName });
        }
      } else if (layers && map.hasLayer(layers)) {
        const displayName = Object.keys(window.nameToKey[category])
          .find(name => window.nameToKey[category][name] === key);
        activeFeatures.push({ category, key, displayName });
      }
    });
  });
  
  console.log(`Creating weather dashboard for ${activeFeatures.length} active features`);
  
  // Fetch weather for each active feature
  const weatherPromises = activeFeatures.slice(0, 5) // Limit to 5 to avoid rate limits
    .map(feature => 
      addWeatherToFeature(feature.category, feature.displayName)
        .then(weather => ({ ...feature, weather }))
        .catch(error => ({ ...feature, error: error.message }))
    );
  
  const results = await Promise.all(weatherPromises);
  
  // Display results
  results.forEach(result => {
    if (result.weather) {
      console.log(`${result.displayName}: ${result.weather.forecast[0].summary}`);
    } else {
      console.warn(`${result.displayName}: Weather unavailable (${result.error})`);
    }
  });
  
  return results;
};
```

## 📱 Native Features Integration

### **Enhanced Geolocation**

```javascript
/**
 * Get user location with native features
 */
const getUserLocation = async (options = {}) => {
  try {
    const position = await window.NativeFeatures.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
      ...options
    });
    
    console.log(`Location obtained (${position.source}):`, {
      lat: position.latitude,
      lon: position.longitude,
      accuracy: `${Math.round(position.accuracy)}m`
    });
    
    return position;
  } catch (error) {
    console.error('Geolocation failed:', error);
    
    // Fallback to map center or default location
    const map = window.getMap();
    const center = map.getCenter();
    return {
      latitude: center.lat,
      longitude: center.lng,
      accuracy: null,
      source: 'fallback'
    };
  }
};

/**
 * Find nearest emergency services to user location
 */
const findNearestServices = async (serviceType = 'ambulance') => {
  try {
    // Get user location
    const userPos = await getUserLocation();
    
    // Calculate distances to all services of this type
    const services = window.namesByCategory[serviceType] || [];
    const distances = [];
    
    for (const serviceName of services) {
      const key = window.nameToKey[serviceType][serviceName];
      const layer = window.featureLayers[serviceType][key];
      
      if (layer) {
        let serviceLat, serviceLon;
        
        if (window.categoryMeta[serviceType].type === 'point') {
          const latlng = layer.getLatLng();
          serviceLat = latlng.lat;
          serviceLon = latlng.lng;
        } else {
          const bounds = layer.getBounds();
          const center = bounds.getCenter();
          serviceLat = center.lat;
          serviceLon = center.lng;
        }
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          userPos.latitude, userPos.longitude,
          serviceLat, serviceLon
        );
        
        distances.push({
          name: serviceName,
          key,
          distance: distance,
          lat: serviceLat,
          lon: serviceLon
        });
      }
    }
    
    // Sort by distance and return top 5
    const nearest = distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    console.log(`Nearest ${serviceType} services:`, nearest);
    
    // Emphasize nearest services on map
    nearest.forEach(service => {
      emphasizeFeature(serviceType, service.name, true);
    });
    
    return nearest;
  } catch (error) {
    console.error('Failed to find nearest services:', error);
    return [];
  }
};

/**
 * Haversine distance calculation
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

### **Haptic Feedback Integration**

```javascript
/**
 * Add haptic feedback to map interactions
 */
const setupHapticFeedback = () => {
  const map = window.getMap();
  
  // Haptic feedback on layer toggle
  const originalToggleLayer = window.toggleLayer || toggleLayer;
  window.toggleLayer = async (category, displayName, visible) => {
    // Provide haptic feedback
    if (visible) {
      await window.NativeFeatures.hapticFeedback('light');
    } else {
      await window.NativeFeatures.hapticFeedback('medium');
    }
    
    return originalToggleLayer(category, displayName, visible);
  };
  
  // Haptic feedback on feature emphasis
  const originalEmphasizeFeature = emphasizeFeature;
  window.emphasizeFeature = async (category, displayName, emphasize) => {
    if (emphasize) {
      await window.NativeFeatures.hapticFeedback('success');
    }
    
    return originalEmphasizeFeature(category, displayName, emphasize);
  };
  
  // Haptic feedback on geolocation success
  const originalGetUserLocation = getUserLocation;
  window.getUserLocation = async (options) => {
    try {
      const result = await originalGetUserLocation(options);
      if (result.source !== 'fallback') {
        await window.NativeFeatures.hapticFeedback('success');
      }
      return result;
    } catch (error) {
      await window.NativeFeatures.hapticFeedback('error');
      throw error;
    }
  };
};
```

## 💾 Service Worker & Offline Support

### **Cache Management**

```javascript
/**
 * Check cache status and update
 */
const checkCacheStatus = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log('Service Worker not registered');
      return;
    }
    
    // Check cache sizes
    const cacheNames = await caches.keys();
    const cacheSizes = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return { name, entries: keys.length };
      })
    );
    
    console.log('Cache status:', cacheSizes);
    return cacheSizes;
  } catch (error) {
    console.error('Failed to check cache status:', error);
  }
};

/**
 * Preload critical data for offline use
 */
const preloadCriticalData = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not available for preloading');
    return;
  }
  
  const criticalData = [
    'geojson/ambulance.geojson',
    'geojson/police.geojson',
    'geojson/ses.geojson'
  ];
  
  try {
    const cache = await caches.open('weewoo-runtime-v1.0');
    
    console.log('Preloading critical data...');
    await Promise.all(
      criticalData.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log(`✓ Cached ${url}`);
          }
        } catch (error) {
          console.warn(`✗ Failed to cache ${url}:`, error);
        }
      })
    );
    
    console.log('Critical data preloading complete');
  } catch (error) {
    console.error('Failed to preload critical data:', error);
  }
};
```

### **Offline Detection and Handling**

```javascript
/**
 * Handle offline/online state changes
 */
const setupOfflineHandling = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log(`App is ${isOnline ? 'online' : 'offline'}`);
    
    // Update UI to show offline status
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = isOnline ? 'none' : 'block';
    }
    
    // Disable weather features when offline
    if (!isOnline) {
      console.log('Disabling weather features (offline)');
      // Hide weather buttons/controls
    } else {
      console.log('Re-enabling weather features (online)');
      // Show weather buttons/controls
    }
  };
  
  // Set up event listeners
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial status check
  updateOnlineStatus();
};

/**
 * Graceful degradation for offline mode
 */
const loadDataWithOfflineFallback = async (category, url) => {
  try {
    // Try loading normally
    await window.loadPolygonCategory(category, url);
  } catch (error) {
    console.warn(`Failed to load ${category} from network, checking cache...`);
    
    // Try loading from cache
    try {
      const cache = await caches.open('weewoo-runtime-v1.0');
      const cachedResponse = await cache.match(url);
      
      if (cachedResponse) {
        const data = await cachedResponse.json();
        console.log(`✓ Loaded ${category} from cache`);
        
        // Process cached data manually
        // (Simplified version of loadPolygonCategory logic)
        data.features.forEach(feature => {
          const rawName = feature.properties[window.categoryMeta[category].nameProp];
          if (rawName) {
            const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            const key = cleanName.toLowerCase().replace(/\s+/g, '_');
            
            if (!window.featureLayers[category][key]) {
              window.featureLayers[category][key] = [];
            }
            window.featureLayers[category][key].push(feature);
          }
        });
        
        // Update UI
        window.updateActiveList();
      } else {
        throw new Error('No cached data available');
      }
    } catch (cacheError) {
      console.error(`Failed to load ${category} from cache:`, cacheError);
      window.showSidebarError(`${category} data unavailable offline. Please connect to internet.`);
    }
  }
};
```

## 🔧 Performance Optimization Examples

### **Batch Operations**

```javascript
/**
 * Optimized bulk layer loading
 */
const loadAllDataOptimized = async () => {
  const startTime = performance.now();
  
  // Load in order of priority and size
  const loadSequence = [
    { category: 'ambulance', loader: () => window.loadAmbulance() },
    { category: 'police', loader: () => window.loadPolice() },
    { category: 'ses', loader: () => window.loadPolygonCategory('ses', 'geojson/ses.geojson') },
    { category: 'lga', loader: () => window.loadPolygonCategory('lga', 'geojson/LGAs.geojson') },
    { category: 'cfa', loader: () => window.loadPolygonCategory('cfa', 'geojson/cfa.geojson') },
    { category: 'frv', loader: () => window.loadPolygonCategory('frv', 'geojson/frv.geojson') }
  ];
  
  const results = [];
  
  for (const { category, loader } of loadSequence) {
    try {
      const categoryStart = performance.now();
      await loader();
      const categoryTime = performance.now() - categoryStart;
      
      results.push({
        category,
        success: true,
        loadTime: categoryTime,
        features: window.namesByCategory[category]?.length || 0
      });
      
      console.log(`✓ ${category}: ${categoryTime.toFixed(2)}ms (${results[results.length-1].features} features)`);
      
      // Yield control between large datasets
      if (categoryTime > 1000) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      results.push({
        category,
        success: false,
        error: error.message
      });
      console.error(`✗ ${category} failed:`, error);
    }
  }
  
  const totalTime = performance.now() - startTime;
  console.log(`Total loading time: ${totalTime.toFixed(2)}ms`);
  
  return results;
};

/**
 * Memory-efficient layer management
 */
const cleanupUnusedLayers = () => {
  const map = window.getMap();
  let cleaned = 0;
  
  Object.keys(window.featureLayers).forEach(category => {
    Object.keys(window.featureLayers[category]).forEach(key => {
      const layers = window.featureLayers[category][key];
      
      if (Array.isArray(layers)) {
        const activeLayers = layers.filter(layer => map.hasLayer(layer));
        if (activeLayers.length === 0) {
          // Remove from memory if not on map
          delete window.featureLayers[category][key];
          cleaned++;
        }
      } else if (layers && !map.hasLayer(layers)) {
        delete window.featureLayers[category][key];
        cleaned++;
      }
    });
  });
  
  console.log(`Cleaned up ${cleaned} unused layers`);
  
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
};
```

## 🔗 Integration Examples

### **Complete Application Initialization**

```javascript
/**
 * Complete app initialization with all APIs
 */
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing WeeWoo Map Friend...');
    
    // 1. Initialize map and basic components
    if (typeof window.AppBootstrap !== 'undefined') {
      await window.AppBootstrap.init();
    }
    
    // 2. Set up native features (mobile apps)
    if (window.NativeFeatures) {
      await window.NativeFeatures.init();
      setupHapticFeedback();
    }
    
    // 3. Set up offline handling
    setupOfflineHandling();
    
    // 4. Preload critical data
    await preloadCriticalData();
    
    // 5. Load emergency services data
    const loadResults = await loadAllDataOptimized();
    
    // 6. Set up location services
    try {
      const userLocation = await getUserLocation({ timeout: 5000 });
      console.log('✓ User location obtained');
      
      // Find nearest services
      await findNearestServices('ambulance');
    } catch (error) {
      console.log('ℹ User location not available, using default view');
    }
    
    // 7. Check backend connectivity
    try {
      const health = await fetch('/health');
      if (health.ok) {
        console.log('✓ Backend services available');
      }
    } catch (error) {
      console.log('ℹ Backend services not available (offline mode)');
    }
    
    console.log('✅ App initialization complete');
    
    return {
      success: true,
      loadResults,
      features: {
        nativeApp: !!window.NativeFeatures?.isNativeApp(),
        serviceWorker: 'serviceWorker' in navigator,
        geolocation: !!navigator.geolocation,
        haptics: window.NativeFeatures?.hasFeature('haptics')
      }
    };
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Show user-friendly error
    window.showSidebarError('Failed to initialize app. Please refresh the page.');
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
```

---

## 🔗 Related Documentation

- **[API Overview](README.md)** - Complete API reference
- **[Data Formats](data-formats.md)** - Schema specifications
- **[Error Handling](error-handling.md)** - Robust error patterns
- **[Performance](rate-limits.md)** - Optimization guidelines

**Next**: Learn about [authentication and security](authentication.md) for production deployment.