# Native Mobile Features API

> **Capacitor-powered native app features with graceful web fallbacks**

## 📋 Overview

WeeWoo Map Friend provides comprehensive native mobile app features through the Capacitor framework. All native features include graceful web fallbacks, ensuring consistent functionality across web browsers and native mobile apps.

### **Feature Availability**

| Feature | iOS App | Android App | Web Browser | Fallback |
|---------|---------|-------------|-------------|----------|
| **Enhanced Geolocation** | ✅ Native GPS | ✅ Native GPS | ✅ Web API | ✅ |
| **Haptic Feedback** | ✅ Native | ✅ Native | ✅ Vibration API | ✅ |
| **Status Bar Control** | ✅ Native | ✅ Native | ❌ N/A | ✅ |
| **Device Information** | ✅ Native | ✅ Native | ✅ User Agent | ✅ |
| **Network Status** | ✅ Native | ✅ Native | ✅ Navigator | ✅ |
| **App State Management** | ✅ Native | ✅ Native | ✅ Visibility API | ✅ |
| **Background Processing** | ✅ Native | ✅ Native | ✅ Web Workers | ✅ |

## 🔧 Core API

### **NativeFeatures Manager**

Central API for all native functionality:

```javascript
// Check if running in native app
const isNative = window.NativeFeatures.isNativeApp();
console.log(`Running in: ${isNative ? 'native app' : 'web browser'}`);

// Check specific feature availability
const hasHaptics = window.NativeFeatures.hasFeature('haptics');
const hasGeolocation = window.NativeFeatures.hasFeature('geolocation');
```

### **Initialization and Events**

```javascript
// Native features are auto-initialized, but you can listen for ready event
window.addEventListener('nativeFeaturesReady', (event) => {
  const { isNative, deviceInfo, availableFeatures } = event.detail;
  
  console.log('Native features ready:', {
    isNative,
    deviceInfo,
    availableFeatures
  });
  
  // Enable native-specific UI features
  if (isNative) {
    setupNativeAppBehaviors();
  }
});

// Listen for app state changes
window.addEventListener('nativeAppStateChange', (event) => {
  const { isActive, source } = event.detail;
  console.log(`App ${isActive ? 'activated' : 'backgrounded'} (${source})`);
  
  if (!isActive) {
    // App went to background - pause heavy operations
    pauseMapUpdates();
  } else {
    // App returned to foreground - resume operations
    resumeMapUpdates();
  }
});

// Handle native back button (Android)
window.addEventListener('nativeBackButton', (event) => {
  console.log('Native back button pressed');
  
  // Custom back button handling
  if (sidebarIsOpen()) {
    closeSidebar();
    event.preventDefault();
  } else if (modalIsOpen()) {
    closeModal();
    event.preventDefault();
  }
  // If nothing to close, let the app minimize
});
```

## 📍 Enhanced Geolocation

### **Current Position**

High-accuracy positioning with native GPS access:

```javascript
/**
 * Get current position with enhanced native features
 */
const getCurrentPosition = async (options = {}) => {
  try {
    const position = await window.NativeFeatures.getCurrentPosition({
      enableHighAccuracy: true,    // Use GPS for best accuracy
      timeout: 15000,              // 15 second timeout
      maximumAge: 300000,          // 5 minute cache
      ...options
    });
    
    console.log('Position obtained:', {
      coordinates: [position.latitude, position.longitude],
      accuracy: `${Math.round(position.accuracy)}m`,
      source: position.source,     // 'native' or 'web'
      timestamp: new Date(position.timestamp)
    });
    
    return position;
  } catch (error) {
    console.error('Geolocation failed:', error);
    throw error;
  }
};

// Usage examples
try {
  // High accuracy for precise location
  const precise = await getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 20000
  });
  
  // Fast location for general use
  const fast = await getCurrentPosition({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 600000  // Accept 10-minute-old position
  });
} catch (error) {
  console.log('Using fallback location');
}
```

### **Position Watching**

Continuous location tracking:

```javascript
/**
 * Watch position changes with native features
 */
const setupLocationTracking = () => {
  const watchId = window.NativeFeatures.watchPosition(
    (position) => {
      console.log('Position update:', {
        coordinates: [position.latitude, position.longitude],
        accuracy: position.accuracy,
        speed: position.speed,
        heading: position.heading,
        source: position.source
      });
      
      // Update map center
      const map = window.getMap();
      map.setView([position.latitude, position.longitude], 
                  map.getZoom());
      
      // Update user marker
      updateUserLocationMarker(position);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
  
  // Store watch ID for cleanup
  return watchId;
};

// Stop watching
const stopLocationTracking = (watchId) => {
  if (window.NativeFeatures.isNativeApp()) {
    // Native apps use Capacitor's clearWatch
    navigator.geolocation.clearWatch(watchId);
  } else {
    // Web browsers use standard API
    navigator.geolocation.clearWatch(watchId);
  }
};
```

### **Location Integration with Emergency Services**

```javascript
/**
 * Find user's current emergency service coverage
 */
const findCurrentCoverage = async () => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position;
    
    const coverage = {
      ses: null,
      cfa: null,
      lga: null,
      ambulance: null,
      police: null
    };
    
    // Check which emergency service areas contain the user's location
    // This requires Turf.js for point-in-polygon testing
    if (typeof turf !== 'undefined') {\n      const userPoint = turf.point([longitude, latitude]);\n      \n      // Check SES coverage\n      Object.keys(window.featureLayers.ses).forEach(key => {\n        const layers = window.featureLayers.ses[key];\n        if (Array.isArray(layers)) {\n          layers.forEach(layer => {\n            const geoJson = layer.toGeoJSON();\n            if (turf.booleanPointInPolygon(userPoint, geoJson)) {\n              const displayName = Object.keys(window.nameToKey.ses)\n                .find(name => window.nameToKey.ses[name] === key);\n              coverage.ses = displayName;\n            }\n          });\n        }\n      });\n      \n      // Similar checks for other services...\n    }\n    \n    console.log('User coverage:', coverage);\n    return coverage;\n  } catch (error) {\n    console.error('Failed to determine coverage:', error);\n    return null;\n  }\n};\n```\n\n## 📳 Haptic Feedback\n\n### **Basic Haptic Patterns**\n\n```javascript\n/**\n * Provide haptic feedback for user interactions\n */\nconst hapticExamples = {\n  // Light tap for minor interactions\n  async lightTap() {\n    await window.NativeFeatures.hapticFeedback('light');\n  },\n  \n  // Medium impact for standard interactions\n  async standardTap() {\n    await window.NativeFeatures.hapticFeedback('medium');\n  },\n  \n  // Heavy impact for important actions\n  async heavyTap() {\n    await window.NativeFeatures.hapticFeedback('heavy');\n  },\n  \n  // Success notification\n  async success() {\n    await window.NativeFeatures.hapticFeedback('success');\n  },\n  \n  // Warning notification\n  async warning() {\n    await window.NativeFeatures.hapticFeedback('warning');\n  },\n  \n  // Error notification\n  async error() {\n    await window.NativeFeatures.hapticFeedback('error');\n  }\n};\n\n// Usage in UI interactions\ndocument.addEventListener('click', async (event) => {\n  if (event.target.type === 'checkbox') {\n    await hapticExamples.lightTap();\n  } else if (event.target.classList.contains('btn-primary')) {\n    await hapticExamples.standardTap();\n  }\n});\n```\n\n### **Map Interaction Haptics**\n\n```javascript\n/**\n * Add haptic feedback to map interactions\n */\nconst setupMapHaptics = () => {\n  const map = window.getMap();\n  \n  // Haptic feedback on layer toggle\n  map.on('layeradd', async () => {\n    await window.NativeFeatures.hapticFeedback('light');\n  });\n  \n  map.on('layerremove', async () => {\n    await window.NativeFeatures.hapticFeedback('medium');\n  });\n  \n  // Haptic feedback on map clicks\n  map.on('click', async () => {\n    await window.NativeFeatures.hapticFeedback('light');\n  });\n  \n  // Haptic feedback on zoom\n  let zoomTimeout;\n  map.on('zoom', () => {\n    clearTimeout(zoomTimeout);\n    zoomTimeout = setTimeout(async () => {\n      await window.NativeFeatures.hapticFeedback('light');\n    }, 100);\n  });\n};\n```\n\n## 📱 Status Bar Management\n\n### **Status Bar Configuration**\n\n```javascript\n/**\n * Configure status bar for different app states\n */\nconst statusBarModes = {\n  // Light content on dark background\n  async darkMode() {\n    await window.NativeFeatures.setStatusBar({\n      style: 'dark',\n      backgroundColor: '#1976d2',\n      overlay: false\n    });\n  },\n  \n  // Dark content on light background\n  async lightMode() {\n    await window.NativeFeatures.setStatusBar({\n      style: 'light', \n      backgroundColor: '#ffffff',\n      overlay: false\n    });\n  },\n  \n  // Transparent overlay for fullscreen map\n  async mapMode() {\n    await window.NativeFeatures.setStatusBar({\n      style: 'dark',\n      overlay: true\n    });\n  }\n};\n\n// Dynamic status bar based on theme\nconst updateStatusBarForTheme = async (isDarkTheme) => {\n  if (isDarkTheme) {\n    await statusBarModes.darkMode();\n  } else {\n    await statusBarModes.lightMode();\n  }\n};\n\n// Status bar for different screens\nconst updateStatusBarForScreen = async (screenType) => {\n  switch (screenType) {\n    case 'map':\n      await statusBarModes.mapMode();\n      break;\n    case 'sidebar':\n      await statusBarModes.lightMode();\n      break;\n    default:\n      await statusBarModes.darkMode();\n  }\n};\n```\n\n## 🔌 Network Status\n\n### **Network Monitoring**\n\n```javascript\n/**\n * Monitor network status and adapt app behavior\n */\nconst setupNetworkMonitoring = async () => {\n  // Get initial network status\n  const initialStatus = await window.NativeFeatures.getNetworkStatus();\n  console.log('Initial network status:', initialStatus);\n  \n  updateUIForNetworkStatus(initialStatus);\n  \n  // Listen for network changes (native apps)\n  if (window.NativeFeatures.isNativeApp()) {\n    // Capacitor provides network status events\n    window.addEventListener('capacitor:networkStatusChange', (event) => {\n      const { connected, connectionType } = event.detail;\n      console.log(`Network changed: ${connected ? 'online' : 'offline'} (${connectionType})`);\n      \n      updateUIForNetworkStatus({ connected, connectionType, source: 'native' });\n    });\n  } else {\n    // Web browsers use online/offline events\n    window.addEventListener('online', () => {\n      updateUIForNetworkStatus({ connected: true, connectionType: 'unknown', source: 'web' });\n    });\n    \n    window.addEventListener('offline', () => {\n      updateUIForNetworkStatus({ connected: false, connectionType: 'none', source: 'web' });\n    });\n  }\n};\n\nconst updateUIForNetworkStatus = (status) => {\n  const { connected, connectionType } = status;\n  \n  // Update UI indicators\n  const networkIndicator = document.getElementById('network-status');\n  if (networkIndicator) {\n    networkIndicator.textContent = connected \n      ? `Online (${connectionType})` \n      : 'Offline';\n    networkIndicator.className = connected ? 'status-online' : 'status-offline';\n  }\n  \n  // Disable/enable network-dependent features\n  const weatherButtons = document.querySelectorAll('.weather-btn');\n  weatherButtons.forEach(btn => {\n    btn.disabled = !connected;\n    btn.title = connected \n      ? 'Get weather data' \n      : 'Weather unavailable offline';\n  });\n  \n  // Show offline banner\n  const offlineBanner = document.getElementById('offline-banner');\n  if (offlineBanner) {\n    offlineBanner.style.display = connected ? 'none' : 'block';\n  }\n};\n```\n\n## 📱 Device Information\n\n### **Device Detection and Adaptation**\n\n```javascript\n/**\n * Get device information and adapt UI\n */\nconst setupDeviceAdaptation = async () => {\n  const deviceInfo = await window.NativeFeatures.getDeviceInfo();\n  console.log('Device information:', deviceInfo);\n  \n  // Adapt UI based on device\n  adaptUIForDevice(deviceInfo);\n  \n  return deviceInfo;\n};\n\nconst adaptUIForDevice = (deviceInfo) => {\n  const { platform, operatingSystem, model, isVirtual } = deviceInfo;\n  \n  // Add platform-specific CSS classes\n  document.body.classList.add(`platform-${platform.toLowerCase()}`);\n  document.body.classList.add(`os-${operatingSystem.toLowerCase()}`);\n  \n  if (isVirtual) {\n    document.body.classList.add('device-simulator');\n  }\n  \n  // Platform-specific adaptations\n  switch (operatingSystem) {\n    case 'ios':\n      // iOS-specific UI adjustments\n      setupIOSSpecificFeatures();\n      break;\n      \n    case 'android':\n      // Android-specific UI adjustments\n      setupAndroidSpecificFeatures();\n      break;\n      \n    default:\n      // Web browser fallbacks\n      setupWebSpecificFeatures();\n  }\n  \n  // Screen size adaptations\n  if (model && model.includes('iPad')) {\n    document.body.classList.add('device-tablet');\n    // Tablet-specific UI\n    enableTabletLayout();\n  }\n};\n\nconst setupIOSSpecificFeatures = () => {\n  // Safe area handling for notched devices\n  const style = document.createElement('style');\n  style.textContent = `\n    .safe-area-top { padding-top: env(safe-area-inset-top); }\n    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }\n    .safe-area-left { padding-left: env(safe-area-inset-left); }\n    .safe-area-right { padding-right: env(safe-area-inset-right); }\n  `;\n  document.head.appendChild(style);\n  \n  // iOS-specific haptic patterns\n  console.log('Enabled iOS-specific features');\n};\n\nconst setupAndroidSpecificFeatures = () => {\n  // Android back button handling\n  console.log('Enabled Android-specific features');\n  \n  // Material Design adaptations\n  document.body.classList.add('material-design');\n};\n\nconst setupWebSpecificFeatures = () => {\n  // Progressive Web App features\n  console.log('Enabled web-specific features');\n  \n  // Install prompt handling\n  setupPWAInstallPrompt();\n};\n```\n\n## 🔄 App State Management\n\n### **Background/Foreground Handling**\n\n```javascript\n/**\n * Handle app state changes efficiently\n */\nconst setupAppStateManagement = () => {\n  let appState = 'active';\n  let backgroundTime = null;\n  \n  window.addEventListener('nativeAppStateChange', (event) => {\n    const { isActive } = event.detail;\n    const newState = isActive ? 'active' : 'background';\n    \n    if (newState !== appState) {\n      handleAppStateChange(appState, newState);\n      appState = newState;\n    }\n  });\n  \n  const handleAppStateChange = (oldState, newState) => {\n    console.log(`App state: ${oldState} → ${newState}`);\n    \n    if (newState === 'background') {\n      backgroundTime = Date.now();\n      \n      // Pause heavy operations\n      pauseMapUpdates();\n      pauseLocationTracking();\n      pauseWeatherUpdates();\n      \n      console.log('App backgrounded - paused operations');\n    } else if (newState === 'active') {\n      const backgroundDuration = backgroundTime \n        ? Date.now() - backgroundTime \n        : 0;\n      \n      console.log(`App foregrounded after ${backgroundDuration}ms`);\n      \n      // Resume operations\n      resumeMapUpdates();\n      resumeLocationTracking();\n      \n      // Check if data needs refreshing (after 5+ minutes)\n      if (backgroundDuration > 5 * 60 * 1000) {\n        console.log('App was backgrounded for >5min, refreshing data');\n        refreshAppData();\n      } else {\n        resumeWeatherUpdates();\n      }\n      \n      backgroundTime = null;\n    }\n  };\n};\n\n// Operation management functions\nlet mapUpdateInterval;\nlet locationWatchId;\nlet weatherUpdateInterval;\n\nconst pauseMapUpdates = () => {\n  if (mapUpdateInterval) {\n    clearInterval(mapUpdateInterval);\n    mapUpdateInterval = null;\n  }\n};\n\nconst resumeMapUpdates = () => {\n  if (!mapUpdateInterval) {\n    mapUpdateInterval = setInterval(updateMapLayers, 30000);\n  }\n};\n\nconst pauseLocationTracking = () => {\n  if (locationWatchId) {\n    navigator.geolocation.clearWatch(locationWatchId);\n    locationWatchId = null;\n  }\n};\n\nconst resumeLocationTracking = () => {\n  if (!locationWatchId) {\n    locationWatchId = window.NativeFeatures.watchPosition(handleLocationUpdate);\n  }\n};\n\nconst pauseWeatherUpdates = () => {\n  if (weatherUpdateInterval) {\n    clearInterval(weatherUpdateInterval);\n    weatherUpdateInterval = null;\n  }\n};\n\nconst resumeWeatherUpdates = () => {\n  if (!weatherUpdateInterval) {\n    weatherUpdateInterval = setInterval(updateWeatherData, 10 * 60 * 1000); // 10 minutes\n  }\n};\n\nconst refreshAppData = async () => {\n  try {\n    // Check for app updates\n    if ('serviceWorker' in navigator) {\n      const registration = await navigator.serviceWorker.getRegistration();\n      if (registration) {\n        registration.update();\n      }\n    }\n    \n    // Refresh critical data\n    await updateWeatherData();\n    \n    console.log('App data refreshed');\n  } catch (error) {\n    console.error('Failed to refresh app data:', error);\n  }\n};\n```\n\n## 🔄 Integration Examples\n\n### **Complete Native Features Setup**\n\n```javascript\n/**\n * Initialize all native features\n */\nconst initializeNativeFeatures = async () => {\n  try {\n    console.log('🔧 Initializing native features...');\n    \n    // 1. Initialize core native features\n    const initResult = await window.NativeFeatures.init();\n    console.log('✅ Native features initialized:', initResult);\n    \n    // 2. Set up device adaptation\n    await setupDeviceAdaptation();\n    \n    // 3. Set up network monitoring\n    await setupNetworkMonitoring();\n    \n    // 4. Set up app state management\n    setupAppStateManagement();\n    \n    // 5. Set up map haptics\n    setupMapHaptics();\n    \n    // 6. Configure status bar\n    await statusBarModes.darkMode();\n    \n    console.log('🎉 Native features setup complete');\n    \n    return {\n      success: true,\n      features: initResult.availableFeatures,\n      isNative: initResult.isNative\n    };\n  } catch (error) {\n    console.error('❌ Native features setup failed:', error);\n    \n    return {\n      success: false,\n      error: error.message,\n      isNative: false\n    };\n  }\n};\n\n// Auto-initialize native features\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', initializeNativeFeatures);\n} else {\n  initializeNativeFeatures();\n}\n```\n\n## 🔗 Related Documentation\n\n- **[API Overview](README.md)** - Complete API reference\n- **[Examples](examples.md)** - Integration examples with native features\n- **[PWA API](pwa-api.md)** - Service Worker and offline functionality\n- **[Error Handling](error-handling.md)** - Robust error patterns\n\n---\n\n**Next**: Learn about [Progressive Web App features](pwa-api.md) and offline functionality.