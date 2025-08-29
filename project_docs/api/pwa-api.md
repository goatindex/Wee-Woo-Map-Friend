# Progressive Web App API

> **Service Worker, offline functionality, and PWA features**

## 📋 Overview

WeeWoo Map Friend implements comprehensive Progressive Web App (PWA) capabilities through a sophisticated service worker system. This provides offline functionality, performance optimization, and native app-like experiences across all platforms.

### **PWA Features**

| Feature | Status | Description |
|---------|--------|-------------|
| **Service Worker** | ✅ Active | Multi-strategy caching and offline support |
| **Web App Manifest** | ✅ Active | Installable app with native app appearance |
| **Offline Support** | ✅ Active | Core functionality available without internet |
| **Background Sync** | ✅ Active | Automatic cache updates when connectivity returns |
| **Install Prompt** | ✅ Active | Native "Add to Home Screen" functionality |
| **Update Notifications** | ✅ Active | Automatic prompts for new versions |
| **Push Notifications** | 🚧 Future | Emergency alerts and updates |

## 🔧 Service Worker Architecture

### **Cache Strategy Overview**

WeeWoo Map Friend uses a three-tier caching strategy optimized for different content types:

```javascript
// Cache Names and Versions
const STATIC_CACHE = 'weewoo-static-v1.0';    // App shell and core assets
const RUNTIME_CACHE = 'weewoo-runtime-v1.0';  // Dynamic data and API responses
const EXTERNAL_CACHE = 'weewoo-external-v1.0'; // CDN resources
```

### **Caching Strategies**

#### **1. Cache-First Strategy** (Static Assets)

For app shell, CSS, JavaScript, and other static resources:

```javascript
// Static assets cached on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/bootstrap.js',
  '/js/state.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/device.js',
  '/manifest.json'
];

// Cache-first implementation
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse; // Serve from cache immediately
  }
  
  // Fallback to network and cache response
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}
```

#### **2. Stale-While-Revalidate Strategy** (Data Files)

For GeoJSON files and data that changes occasionally:

```javascript
// Data assets with SWR strategy
const DATA_ASSETS = [
  '/geojson/ambulance.geojson',
  '/geojson/cfa.geojson',
  '/geojson/frv.geojson',
  '/geojson/LGAs.geojson',
  '/geojson/police.geojson',
  '/geojson/ses.geojson',
  '/geojson/sesbld.geojson'
];

// Stale-while-revalidate implementation
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(console.warn);
  
  // Return cached version immediately if available
  return cachedResponse || await fetchPromise;
}
```

#### **3. Network-First Strategy** (Dynamic Content)

For weather API and other dynamic content:

```javascript
// Network-first with cache fallback
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}
```

## 💾 Offline Functionality

### **Offline Detection**

```javascript
/**
 * Check offline status with service worker integration
 */
window.isOffline = function() {
  return !navigator.onLine;
};

/**
 * Enhanced offline detection with connectivity testing
 */
const checkConnectivity = async () => {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Test connectivity with a small request
    const response = await fetch('/health', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Usage in data loading
window.loadPolygonCategory = async function(category, url) {
  try {
    if (window.isOffline()) {
      window.showSidebarError(`You are offline. ${category} data cannot be loaded.`);
      return;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${category}: ${response.status}`);
    
    // Process data...
  } catch (error) {
    console.error(`Error loading ${category}:`, error);
    
    // Try to load from cache
    const cachedData = await loadFromCache(url);
    if (cachedData) {
      console.log(`Loaded ${category} from cache`);
      // Process cached data...
    } else {
      window.showSidebarError(`Failed to load ${category} data. Please try again.`);
    }
  }
};\n```\n\n### **Offline Graceful Degradation**\n\n```javascript\n/**\n * Load data with offline fallback\n */\nconst loadFromCache = async (url) => {\n  try {\n    const cache = await caches.open('weewoo-runtime-v1.0');\n    const cachedResponse = await cache.match(url);\n    \n    if (cachedResponse) {\n      return await cachedResponse.json();\n    }\n  } catch (error) {\n    console.warn('Cache access failed:', error);\n  }\n  \n  return null;\n};\n\n/**\n * Offline-aware feature loading\n */\nconst loadEmergencyServicesOffline = async () => {\n  const services = ['ambulance', 'police', 'ses'];\n  const results = [];\n  \n  for (const service of services) {\n    try {\n      if (navigator.onLine) {\n        // Try network first\n        await window[`load${service.charAt(0).toUpperCase() + service.slice(1)}`]();\n        results.push({ service, status: 'loaded', source: 'network' });\n      } else {\n        // Load from cache\n        const cachedData = await loadFromCache(`geojson/${service}.geojson`);\n        if (cachedData) {\n          // Process cached data manually\n          processCachedServiceData(service, cachedData);\n          results.push({ service, status: 'loaded', source: 'cache' });\n        } else {\n          results.push({ service, status: 'unavailable', source: 'none' });\n        }\n      }\n    } catch (error) {\n      console.error(`Failed to load ${service}:`, error);\n      results.push({ service, status: 'error', error: error.message });\n    }\n  }\n  \n  return results;\n};\n\nconst processCachedServiceData = (service, data) => {\n  // Simplified version of the normal loading process\n  const meta = window.categoryMeta[service];\n  \n  data.features.forEach(feature => {\n    const rawName = feature.properties[meta.nameProp];\n    if (rawName) {\n      const cleanName = rawName.replace(/[^a-zA-Z0-9\\s]/g, '').trim();\n      const key = cleanName.toLowerCase().replace(/\\s+/g, '_');\n      \n      if (!window.featureLayers[service][key]) {\n        window.featureLayers[service][key] = [];\n      }\n      \n      // Create simplified layer for cached data\n      const layer = L.geoJSON(feature);\n      window.featureLayers[service][key].push(layer);\n    }\n  });\n  \n  // Update UI\n  window.updateActiveList();\n};\n```\n\n### **Offline UI Indicators**\n\n```javascript\n/**\n * Set up offline UI indicators\n */\nconst setupOfflineUI = () => {\n  // Create offline banner\n  const offlineBanner = document.createElement('div');\n  offlineBanner.id = 'offline-banner';\n  offlineBanner.className = 'offline-banner';\n  offlineBanner.innerHTML = `\n    <div class=\"offline-content\">\n      <span class=\"offline-icon\">📡❌</span>\n      <span class=\"offline-text\">You're offline</span>\n      <button class=\"offline-retry\" onclick=\"location.reload()\">Retry</button>\n    </div>\n  `;\n  offlineBanner.style.display = 'none';\n  document.body.appendChild(offlineBanner);\n  \n  // Create offline indicator for sidebar\n  const sidebarStatus = document.createElement('div');\n  sidebarStatus.id = 'network-status';\n  sidebarStatus.className = 'network-status';\n  \n  const sidebar = document.querySelector('.sidebar');\n  if (sidebar) {\n    sidebar.appendChild(sidebarStatus);\n  }\n  \n  // Update UI based on online status\n  const updateOfflineUI = () => {\n    const isOnline = navigator.onLine;\n    \n    offlineBanner.style.display = isOnline ? 'none' : 'block';\n    sidebarStatus.textContent = isOnline ? 'Online' : 'Offline';\n    sidebarStatus.className = `network-status ${\n      isOnline ? 'status-online' : 'status-offline'\n    }`;\n    \n    // Disable weather features when offline\n    const weatherButtons = document.querySelectorAll('.weather-btn');\n    weatherButtons.forEach(btn => {\n      btn.disabled = !isOnline;\n      btn.title = isOnline \n        ? 'Get weather forecast' \n        : 'Weather unavailable offline';\n    });\n  };\n  \n  // Listen for connectivity changes\n  window.addEventListener('online', updateOfflineUI);\n  window.addEventListener('offline', updateOfflineUI);\n  \n  // Initial state\n  updateOfflineUI();\n};\n```\n\n## 🔄 Background Sync\n\n### **Automatic Cache Updates**\n\n```javascript\n// Service worker background sync\nself.addEventListener('sync', event => {\n  if (event.tag === 'background-update') {\n    event.waitUntil(updateCaches());\n  }\n});\n\n/**\n * Update caches in background\n */\nasync function updateCaches() {\n  try {\n    console.log('Service Worker: Updating caches in background');\n    \n    const cache = await caches.open('weewoo-runtime-v1.0');\n    \n    // Update data assets\n    const updatePromises = [\n      '/geojson/ambulance.geojson',\n      '/geojson/police.geojson',\n      '/geojson/ses.geojson'\n    ].map(url => \n      fetch(url).then(response => {\n        if (response.ok) {\n          return cache.put(url, response);\n        }\n      }).catch(error => \n        console.warn('Background update failed for:', url, error)\n      )\n    );\n    \n    await Promise.allSettled(updatePromises);\n    console.log('Service Worker: Background cache update complete');\n  } catch (error) {\n    console.error('Service Worker: Background cache update failed:', error);\n  }\n}\n\n// Trigger background sync from main thread\nconst requestBackgroundSync = async () => {\n  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {\n    try {\n      const registration = await navigator.serviceWorker.ready;\n      await registration.sync.register('background-update');\n      console.log('Background sync requested');\n    } catch (error) {\n      console.warn('Background sync registration failed:', error);\n      // Fallback to immediate update\n      updateCacheManually();\n    }\n  }\n};\n\nconst updateCacheManually = async () => {\n  try {\n    const cache = await caches.open('weewoo-runtime-v1.0');\n    \n    const criticalUrls = [\n      '/geojson/ambulance.geojson',\n      '/geojson/police.geojson'\n    ];\n    \n    await Promise.all(\n      criticalUrls.map(url => \n        fetch(url).then(response => {\n          if (response.ok) {\n            cache.put(url, response.clone());\n          }\n        })\n      )\n    );\n    \n    console.log('Manual cache update complete');\n  } catch (error) {\n    console.error('Manual cache update failed:', error);\n  }\n};\n```\n\n## 📱 Install Prompt\n\n### **PWA Installation**\n\n```javascript\n/**\n * Handle PWA install prompt\n */\nconst setupPWAInstallPrompt = () => {\n  let deferredPrompt;\n  \n  // Listen for beforeinstallprompt event\n  window.addEventListener('beforeinstallprompt', (e) => {\n    console.log('PWA install prompt available');\n    \n    // Prevent Chrome 67 and earlier from automatically showing the prompt\n    e.preventDefault();\n    \n    // Stash the event so it can be triggered later\n    deferredPrompt = e;\n    \n    // Show custom install button\n    showInstallButton();\n  });\n  \n  // Handle install button click\n  const installApp = async () => {\n    if (!deferredPrompt) {\n      console.log('No install prompt available');\n      return;\n    }\n    \n    // Show the prompt\n    deferredPrompt.prompt();\n    \n    // Wait for the user to respond to the prompt\n    const { outcome } = await deferredPrompt.userChoice;\n    console.log(`User ${outcome} the install prompt`);\n    \n    if (outcome === 'accepted') {\n      console.log('PWA installed successfully');\n      // Provide haptic feedback\n      if (window.NativeFeatures) {\n        await window.NativeFeatures.hapticFeedback('success');\n      }\n    }\n    \n    // Clear the deferredPrompt\n    deferredPrompt = null;\n    hideInstallButton();\n  };\n  \n  // Listen for app installed event\n  window.addEventListener('appinstalled', (evt) => {\n    console.log('PWA was installed');\n    hideInstallButton();\n    \n    // Track installation\n    if (typeof gtag !== 'undefined') {\n      gtag('event', 'pwa_install', {\n        event_category: 'engagement',\n        event_label: 'PWA Installation'\n      });\n    }\n  });\n  \n  const showInstallButton = () => {\n    let installButton = document.getElementById('pwa-install-btn');\n    \n    if (!installButton) {\n      installButton = document.createElement('button');\n      installButton.id = 'pwa-install-btn';\n      installButton.className = 'btn btn-primary pwa-install-btn';\n      installButton.innerHTML = '📱 Install App';\n      installButton.onclick = installApp;\n      \n      // Add to header or sidebar\n      const header = document.querySelector('.header') || document.body;\n      header.appendChild(installButton);\n    }\n    \n    installButton.style.display = 'block';\n  };\n  \n  const hideInstallButton = () => {\n    const installButton = document.getElementById('pwa-install-btn');\n    if (installButton) {\n      installButton.style.display = 'none';\n    }\n  };\n  \n  // Check if app is already installed\n  if (window.matchMedia('(display-mode: standalone)').matches) {\n    console.log('PWA is already installed');\n    hideInstallButton();\n  }\n};\n```\n\n## 🔄 Service Worker Updates\n\n### **Update Notifications**\n\n```javascript\n/**\n * Handle service worker updates\n */\nconst setupServiceWorkerUpdates = () => {\n  if (!('serviceWorker' in navigator)) {\n    console.log('Service Worker not supported');\n    return;\n  }\n  \n  navigator.serviceWorker.register('/sw.js').then(registration => {\n    console.log('Service Worker registered');\n    \n    // Check for updates\n    registration.addEventListener('updatefound', () => {\n      const newWorker = registration.installing;\n      \n      newWorker.addEventListener('statechange', () => {\n        if (newWorker.state === 'installed') {\n          if (navigator.serviceWorker.controller) {\n            // New update available\n            showUpdateAvailable();\n          } else {\n            // First install\n            console.log('Service Worker installed for first time');\n          }\n        }\n      });\n    });\n  }).catch(error => {\n    console.error('Service Worker registration failed:', error);\n  });\n  \n  // Listen for controller change (new SW activated)\n  navigator.serviceWorker.addEventListener('controllerchange', () => {\n    console.log('New Service Worker activated');\n    window.location.reload();\n  });\n  \n  const showUpdateAvailable = () => {\n    // Create update notification\n    const updateBanner = document.createElement('div');\n    updateBanner.className = 'update-banner';\n    updateBanner.innerHTML = `\n      <div class=\"update-content\">\n        <span class=\"update-icon\">🔄</span>\n        <span class=\"update-text\">New version available!</span>\n        <button class=\"update-btn\" onclick=\"applyUpdate()\">Update</button>\n        <button class=\"update-dismiss\" onclick=\"dismissUpdate()\">×</button>\n      </div>\n    `;\n    \n    document.body.appendChild(updateBanner);\n    \n    // Auto-dismiss after 10 seconds\n    setTimeout(() => {\n      if (updateBanner.parentNode) {\n        updateBanner.parentNode.removeChild(updateBanner);\n      }\n    }, 10000);\n  };\n  \n  window.applyUpdate = async () => {\n    try {\n      const registration = await navigator.serviceWorker.getRegistration();\n      if (registration && registration.waiting) {\n        // Tell the waiting SW to skip waiting\n        registration.waiting.postMessage({ type: 'SKIP_WAITING' });\n      }\n    } catch (error) {\n      console.error('Failed to apply update:', error);\n      window.location.reload();\n    }\n  };\n  \n  window.dismissUpdate = () => {\n    const updateBanner = document.querySelector('.update-banner');\n    if (updateBanner) {\n      updateBanner.remove();\n    }\n  };\n};\n```\n\n## 📊 Cache Management\n\n### **Cache Inspection and Cleanup**\n\n```javascript\n/**\n * Cache management utilities\n */\nconst CacheManager = {\n  /**\n   * Get cache statistics\n   */\n  async getStats() {\n    if (!('caches' in window)) {\n      return { supported: false };\n    }\n    \n    try {\n      const cacheNames = await caches.keys();\n      const stats = [];\n      \n      for (const name of cacheNames) {\n        const cache = await caches.open(name);\n        const keys = await cache.keys();\n        \n        let totalSize = 0;\n        for (const request of keys) {\n          const response = await cache.match(request);\n          if (response) {\n            const blob = await response.blob();\n            totalSize += blob.size;\n          }\n        }\n        \n        stats.push({\n          name,\n          entries: keys.length,\n          size: totalSize,\n          sizeFormatted: formatBytes(totalSize)\n        });\n      }\n      \n      return {\n        supported: true,\n        caches: stats,\n        totalSize: stats.reduce((sum, cache) => sum + cache.size, 0)\n      };\n    } catch (error) {\n      console.error('Failed to get cache stats:', error);\n      return { supported: true, error: error.message };\n    }\n  },\n  \n  /**\n   * Clear specific cache\n   */\n  async clearCache(cacheName) {\n    try {\n      const deleted = await caches.delete(cacheName);\n      console.log(`Cache '${cacheName}' ${deleted ? 'deleted' : 'not found'}`);\n      return deleted;\n    } catch (error) {\n      console.error(`Failed to clear cache '${cacheName}':`, error);\n      return false;\n    }\n  },\n  \n  /**\n   * Clear all caches\n   */\n  async clearAllCaches() {\n    try {\n      const cacheNames = await caches.keys();\n      const deletePromises = cacheNames.map(name => caches.delete(name));\n      const results = await Promise.all(deletePromises);\n      \n      console.log(`Cleared ${results.filter(Boolean).length}/${results.length} caches`);\n      return results;\n    } catch (error) {\n      console.error('Failed to clear all caches:', error);\n      return [];\n    }\n  },\n  \n  /**\n   * Preload critical resources\n   */\n  async preloadCritical() {\n    try {\n      const cache = await caches.open('weewoo-runtime-v1.0');\n      \n      const criticalResources = [\n        '/geojson/ambulance.geojson',\n        '/geojson/police.geojson'\n      ];\n      \n      const preloadPromises = criticalResources.map(async (url) => {\n        try {\n          const response = await fetch(url);\n          if (response.ok) {\n            await cache.put(url, response);\n            console.log(`✓ Preloaded: ${url}`);\n          }\n        } catch (error) {\n          console.warn(`✗ Failed to preload: ${url}`, error);\n        }\n      });\n      \n      await Promise.all(preloadPromises);\n      console.log('Critical resource preloading complete');\n    } catch (error) {\n      console.error('Failed to preload critical resources:', error);\n    }\n  }\n};\n\nconst formatBytes = (bytes) => {\n  if (bytes === 0) return '0 Bytes';\n  const k = 1024;\n  const sizes = ['Bytes', 'KB', 'MB', 'GB'];\n  const i = Math.floor(Math.log(bytes) / Math.log(k));\n  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];\n};\n\n// Debug utilities\nwindow.CacheManager = CacheManager;\n\n// Usage examples\n// CacheManager.getStats().then(console.log);\n// CacheManager.clearCache('weewoo-runtime-v1.0');\n// CacheManager.preloadCritical();\n```\n\n## 🔧 Integration Examples\n\n### **Complete PWA Setup**\n\n```javascript\n/**\n * Initialize all PWA features\n */\nconst initializePWA = async () => {\n  try {\n    console.log('🔧 Initializing PWA features...');\n    \n    // 1. Set up service worker\n    setupServiceWorkerUpdates();\n    \n    // 2. Set up install prompt\n    setupPWAInstallPrompt();\n    \n    // 3. Set up offline UI\n    setupOfflineUI();\n    \n    // 4. Preload critical data\n    await CacheManager.preloadCritical();\n    \n    // 5. Set up background sync\n    await requestBackgroundSync();\n    \n    // 6. Get cache statistics\n    const cacheStats = await CacheManager.getStats();\n    console.log('Cache statistics:', cacheStats);\n    \n    console.log('✅ PWA features initialized');\n    \n    return {\n      success: true,\n      features: {\n        serviceWorker: 'serviceWorker' in navigator,\n        caches: cacheStats.supported,\n        backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,\n        installPrompt: true\n      },\n      cacheStats\n    };\n  } catch (error) {\n    console.error('❌ PWA initialization failed:', error);\n    \n    return {\n      success: false,\n      error: error.message\n    };\n  }\n};\n\n// Auto-initialize PWA features\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', initializePWA);\n} else {\n  initializePWA();\n}\n```\n\n## 📱 Manifest Configuration\n\n### **Web App Manifest**\n\nThe `/manifest.json` file configures PWA appearance and behavior:\n\n```json\n{\n  \"name\": \"WeeWoo Map Friend\",\n  \"short_name\": \"WeeWoo Map\",\n  \"description\": \"Emergency services mapping for Victoria, Australia\",\n  \"start_url\": \"/\",\n  \"display\": \"standalone\",\n  \"theme_color\": \"#1976d2\",\n  \"background_color\": \"#ffffff\",\n  \"orientation\": \"any\",\n  \"scope\": \"/\",\n  \"icons\": [\n    {\n      \"src\": \"icons/icon-192x192.png\",\n      \"sizes\": \"192x192\",\n      \"type\": \"image/png\",\n      \"purpose\": \"maskable any\"\n    },\n    {\n      \"src\": \"icons/icon-512x512.png\",\n      \"sizes\": \"512x512\",\n      \"type\": \"image/png\",\n      \"purpose\": \"maskable any\"\n    }\n  ],\n  \"categories\": [\"maps\", \"navigation\", \"emergency\"],\n  \"lang\": \"en-AU\",\n  \"dir\": \"ltr\"\n}\n```\n\n## 🔗 Related Documentation\n\n- **[API Overview](README.md)** - Complete API reference\n- **[Native Features](native-api.md)** - Mobile app integration\n- **[Examples](examples.md)** - PWA integration examples\n- **[Performance](rate-limits.md)** - Optimization guidelines\n\n---\n\n**Next**: Learn about [error handling patterns](error-handling.md) and robust application development.