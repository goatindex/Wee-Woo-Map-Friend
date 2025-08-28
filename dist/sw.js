/**
 * WeeWoo Map Friend Service Worker
 * Provides offline support and performance optimization through caching
 */

const CACHE_NAME = 'weewoo-map-v1.0';
const STATIC_CACHE = 'weewoo-static-v1.0';
const RUNTIME_CACHE = 'weewoo-runtime-v1.0';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/bootstrap.js',
  '/js/state.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/device.js',
  '/js/utils/coordConvert.js',
  '/js/utils/errorUI.js',
  '/js/labels.js',
  '/js/emphasise.js',
  '/js/polygonPlus.js',
  '/js/ui/collapsible.js',
  '/js/ui/search.js',
  '/js/ui/activeList.js',
  '/js/preloader.js',
  '/manifest.json'
];

// External resources (cache but don't fail if unavailable)
const EXTERNAL_RESOURCES = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js',
  'https://cdn.jsdelivr.net/npm/proj4@2.9.2/dist/proj4.min.js'
];

// Data files that change less frequently
const DATA_ASSETS = [
  '/geojson/ambulance.geojson',
  '/geojson/cfa.geojson',
  '/geojson/frv.geojson',
  '/geojson/LGAs.geojson',
  '/geojson/police.geojson',
  '/geojson/ses.geojson',
  '/geojson/sesbld.geojson',
  '/cfabld.json',
  '/cfabld_with_coords.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache external resources (don't fail if unavailable)
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching external resources');
        return Promise.allSettled(
          EXTERNAL_RESOURCES.map(url => 
            cache.add(url).catch(err => 
              console.warn('Failed to cache external resource:', url, err)
            )
          )
        );
      }),
      
      // Cache data assets
      caches.open(RUNTIME_CACHE).then(cache => {
        console.log('Service Worker: Caching data assets');
        return Promise.allSettled(
          DATA_ASSETS.map(url => 
            cache.add(url).catch(err => 
              console.warn('Failed to cache data asset:', url, err)
            )
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content with fallback strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests to backend API (let them go to network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Skip requests to other origins (except CDN resources)
  if (url.origin !== location.origin && !isAllowedExternalResource(url)) {
    return;
  }
  
  event.respondWith(handleFetchRequest(request));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  // Strategy 1: Cache-first for static assets
  if (isStaticAsset(url)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // Strategy 2: Stale-while-revalidate for data files
  if (isDataAsset(url)) {
    return staleWhileRevalidate(request, RUNTIME_CACHE);
  }
  
  // Strategy 3: Network-first for dynamic content
  return networkFirst(request, RUNTIME_CACHE);
}

/**
 * Cache-first strategy: Check cache first, fallback to network
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Cache-first failed for:', request.url, error);
    
    // Try to return any cached version as last resort
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.destination === 'document') {
      return createOfflineResponse();
    }
    
    throw error;
  }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network-first failed for:', request.url, error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale-while-revalidate: Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('Background fetch failed for:', request.url, error);
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    console.error('Stale-while-revalidate failed for:', request.url, error);
    throw error;
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  const pathname = url.pathname;
  return pathname.endsWith('.html') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.js') ||
         pathname.endsWith('.json') ||
         pathname === '/' ||
         STATIC_ASSETS.includes(pathname);
}

/**
 * Check if URL is a data asset
 */
function isDataAsset(url) {
  const pathname = url.pathname;
  return pathname.endsWith('.geojson') ||
         pathname.includes('/geojson/') ||
         DATA_ASSETS.includes(pathname);
}

/**
 * Check if external resource is allowed for caching
 */
function isAllowedExternalResource(url) {
  return EXTERNAL_RESOURCES.some(resource => url.href.startsWith(resource.split('?')[0]));
}

/**
 * Create offline response for HTML requests
 */
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>WeeWoo Map Friend - Offline</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .offline-message { max-width: 500px; margin: 0 auto; }
        .emoji { font-size: 3em; margin-bottom: 20px; }
        button { background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
        button:hover { background: #1565c0; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <div class="emoji">📡❌</div>
        <h1>You're Offline</h1>
        <p>WeeWoo Map Friend requires an internet connection for full functionality.</p>
        <p>Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync for future updates
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'background-update') {
    event.waitUntil(updateCaches());
  }
});

/**
 * Update caches in background
 */
async function updateCaches() {
  try {
    console.log('Service Worker: Updating caches in background');
    
    const cache = await caches.open(RUNTIME_CACHE);
    
    // Update data assets
    await Promise.allSettled(
      DATA_ASSETS.map(url => 
        fetch(url).then(response => {
          if (response.ok) {
            return cache.put(url, response);
          }
        }).catch(error => 
          console.warn('Background update failed for:', url, error)
        )
      )
    );
    
    console.log('Service Worker: Background cache update complete');
  } catch (error) {
    console.error('Service Worker: Background cache update failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Script loaded');
