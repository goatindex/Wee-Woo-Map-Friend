# Performance & Rate Limits

> **Performance constraints, optimization guidelines, and usage limits**

## 📋 Overview

WeeWoo Map Friend implements comprehensive performance optimization and rate limiting strategies to ensure optimal user experience across all devices and network conditions. This document covers performance baselines, optimization techniques, and usage constraints.

### **Performance Categories**

| Category | Target | Measurement | Status |
|----------|---------|-------------|--------|
| **Load Performance** | < 3.8s TTI | Navigation Timing API | ✅ Monitored |
| **Runtime Performance** | > 55 FPS | Performance Observer | ✅ Monitored |
| **Memory Usage** | < 150MB | Memory API | ✅ Monitored |
| **Network Efficiency** | Smart caching | Service Worker | ✅ Active |
| **Device Optimization** | Cross-platform | Device Context API | ✅ Active |

## ⚡ Performance Baselines

### **Load Performance Targets**

Based on the [Performance Baselines document](../performance/baselines.md):

```javascript
// Performance targets from baselines.md
const performanceTargets = {
  // Core Web Vitals
  firstContentfulPaint: { target: 1800, acceptable: 3000, poor: 3000 }, // ms
  largestContentfulPaint: { target: 2500, acceptable: 4000, poor: 4000 }, // ms
  firstInputDelay: { target: 100, acceptable: 300, poor: 300 }, // ms
  cumulativeLayoutShift: { target: 0.1, acceptable: 0.25, poor: 0.25 }, // score
  timeToInteractive: { target: 3800, acceptable: 7300, poor: 7300 }, // ms

  // Application-specific targets
  layerRendering: { target: 100, acceptable: 300, poor: 300 }, // ms
  userInteraction: { target: 50, acceptable: 150, poor: 150 }, // ms
  stateUpdates: { target: 16, acceptable: 50, poor: 50 }, // ms
  componentInit: { target: 200, acceptable: 500, poor: 500 } // ms
};
```

### **Current Performance Baselines**

```javascript
// Actual measured baselines from production
const currentBaselines = {
  loadPerformance: {
    firstContentfulPaint: 1200, // 1.2s
    largestContentfulPaint: 2100, // 2.1s  
    firstInputDelay: 45, // 45ms
    cumulativeLayoutShift: 0.08, // 0.08
    timeToInteractive: 3200, // 3.2s
    totalLoadTime: 4500 // 4.5s
  },
  
  runtimePerformance: {
    layerRendering: {
      ses: 85, // 85ms
      lga: 120, // 120ms (complex geometries)
      cfa: 95, // 95ms
      ambulance: 45, // 45ms (point data)
      police: 50 // 50ms (point data)
    },
    userInteraction: {
      click: 25, // 25ms
      hover: 15, // 15ms
      drag: 35, // 35ms
      zoom: 80 // 80ms
    }
  }
};
```

## 🎯 Rate Limiting & Constraints

### **Backend API Rate Limits**

#### **Weather API**

```javascript
// Weather API rate limiting
const weatherAPILimits = {
  // Per-user limits (IP-based)
  perUser: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000
  },
  
  // Provider-specific limits
  providers: {
    willyweather: {
      requestsPerSecond: 1,
      requestsPerDay: 10000, // Based on plan
      timeout: 5000 // 5 second timeout
    },
    openMeteo: {
      requestsPerSecond: 10,
      requestsPerDay: 10000, // Free tier
      timeout: 3000 // 3 second timeout
    },
    mock: {
      unlimited: true,
      timeout: 100 // Instant response
    }
  },
  
  // Caching to reduce API calls
  caching: {
    ttl: 300, // 5 minutes
    strategy: 'stale-while-revalidate'
  }
};

// Implementation example
class WeatherRateLimiter {
  constructor() {
    this.requests = new Map(); // IP -> request timestamps
    this.cache = new Map(); // Location -> cached response
  }
  
  async checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];
    
    // Clean old requests (older than 1 minute)
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < 60000
    );
    
    if (validRequests.length >= weatherAPILimits.perUser.requestsPerMinute) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(ip, validRequests);
    
    return true;
  }
  
  getCacheKey(lat, lon, provider) {
    return `${Math.round(lat * 100)}:${Math.round(lon * 100)}:${provider}`;
  }
  
  async getWeatherWithRateLimit(ip, lat, lon, provider) {
    // Check rate limit
    await this.checkRateLimit(ip);
    
    // Check cache
    const cacheKey = this.getCacheKey(lat, lon, provider);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < weatherAPILimits.caching.ttl * 1000) {
      return { ...cached.data, fromCache: true };
    }
    
    // Fetch from provider
    const data = await this.fetchFromProvider(lat, lon, provider);
    
    // Cache response
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

### **Frontend Rate Limiting**

#### **Data Loading Constraints**

```javascript
// Frontend performance constraints
const frontendLimits = {
  // Bulk operation batch sizes (optimized per category)
  batchSizes: {
    ses: 15,      // Moderate batch for SES polygons
    lga: 8,       // Small batch for complex LGA geometries
    cfa: 12,      // Moderate batch for CFA polygons
    frv: 5,       // Small batch for FRV areas
    ambulance: 20, // Large batch for point data
    police: 20    // Large batch for point data
  },
  
  // Yield delays for UI responsiveness
  yieldDelays: {
    small: 8,   // ≤8 items
    medium: 12, // 9-12 items
    large: 16   // >12 items
  },
  
  // Label creation batch sizes (very conservative for complex geometries)
  labelBatches: {
    lga: 1,      // Process LGA labels one at a time
    cfa: 8,      // Larger batches for pre-calculated coordinates
    ses: 8,      // Larger batches for pre-calculated coordinates
    ambulance: 10,
    police: 10
  },
  
  // Memory management
  memoryLimits: {
    maxActiveFeatures: 1000,  // Total features on map
    maxConcurrentRequests: 6, // Parallel network requests
    garbageCollectionInterval: 300000 // 5 minutes
  }
};

/**\n * Optimized bulk operation implementation\n */\nclass BulkOperationManager {\n  constructor() {\n    this.isRunning = false;\n    this.queue = [];\n  }\n  \n  async processBulkOperation(category, items, operation) {\n    if (this.isRunning) {\n      throw new Error('Bulk operation already in progress');\n    }\n    \n    this.isRunning = true;\n    \n    try {\n      window.beginBulkOperation();\n      window.beginActiveListBulk();\n      \n      const batchSize = frontendLimits.batchSizes[category] || 10;\n      const yieldDelay = this.getYieldDelay(batchSize);\n      \n      for (let i = 0; i < items.length; i += batchSize) {\n        const batch = items.slice(i, i + batchSize);\n        \n        // Process current batch\n        batch.forEach(item => operation(item));\n        \n        // Yield control after each batch (except last)\n        if (i + batchSize < items.length) {\n          await this.yieldControl(yieldDelay);\n          \n          // Check if user cancelled operation\n          if (this.shouldCancel()) {\n            console.log('Bulk operation cancelled by user');\n            break;\n          }\n        }\n      }\n    } finally {\n      window.endBulkOperation();\n      window.endActiveListBulk();\n      this.isRunning = false;\n    }\n  }\n  \n  getYieldDelay(batchSize) {\n    if (batchSize <= 8) return frontendLimits.yieldDelays.small;\n    if (batchSize <= 12) return frontendLimits.yieldDelays.medium;\n    return frontendLimits.yieldDelays.large;\n  }\n  \n  async yieldControl(delay) {\n    return new Promise(resolve => {\n      requestAnimationFrame(() => {\n        setTimeout(resolve, delay);\n      });\n    });\n  }\n  \n  shouldCancel() {\n    // Check for cancellation signals\n    return document.hidden || !navigator.onLine;\n  }\n}\n```\n\n### **Geocoding Rate Limits**\n\n#### **Nominatim (Development/Scripts Only)**\n\n```python\n# Geocoding rate limits for data preparation scripts\nclass NominatimRateLimiter:\n    def __init__(self):\n        self.last_request = 0\n        self.requests_per_second = 1  # Nominatim limit\n        self.user_agent = \"WeeWoo-Map-Friend/1.0 (development@example.com)\"\n    \n    async def geocode_with_rate_limit(self, address, suburb):\n        # Enforce rate limit\n        now = time.time()\n        time_since_last = now - self.last_request\n        \n        if time_since_last < 1.0:  # Less than 1 second\n            sleep_time = 1.0 - time_since_last\n            await asyncio.sleep(sleep_time)\n        \n        # Make request\n        url = \"https://nominatim.openstreetmap.org/search\"\n        params = {\n            'q': f\"{address}, {suburb}, Victoria, Australia\",\n            'format': 'json',\n            'limit': 1,\n            'countrycodes': 'au'\n        }\n        \n        headers = {\n            'User-Agent': self.user_agent\n        }\n        \n        self.last_request = time.time()\n        \n        try:\n            response = await httpx.get(url, params=params, headers=headers, timeout=10)\n            return response.json()\n        except Exception as e:\n            print(f\"Geocoding failed for {address}: {e}\")\n            return None\n```\n\n## 📊 Performance Monitoring\n\n### **Real-Time Performance Tracking**\n\n```javascript\n/**\n * Performance monitoring system\n */\nclass PerformanceMonitor {\n  constructor() {\n    this.metrics = {\n      loadTimes: [],\n      renderTimes: {},\n      interactionTimes: [],\n      memoryUsage: []\n    };\n    \n    this.setupObservers();\n  }\n  \n  setupObservers() {\n    // Core Web Vitals monitoring\n    if ('PerformanceObserver' in window) {\n      this.observeLCP();\n      this.observeFID();\n      this.observeCLS();\n    }\n    \n    // Custom performance metrics\n    this.observeLayerRendering();\n    this.observeMemoryUsage();\n  }\n  \n  observeLCP() {\n    new PerformanceObserver((list) => {\n      const entries = list.getEntries();\n      const lastEntry = entries[entries.length - 1];\n      \n      this.recordMetric('largestContentfulPaint', lastEntry.startTime);\n      \n      if (lastEntry.startTime > performanceTargets.largestContentfulPaint.target) {\n        console.warn(`LCP too slow: ${lastEntry.startTime.toFixed(2)}ms`);\n      }\n    }).observe({ entryTypes: ['largest-contentful-paint'] });\n  }\n  \n  observeFID() {\n    new PerformanceObserver((list) => {\n      const entries = list.getEntries();\n      const firstEntry = entries[0];\n      const fid = firstEntry.processingStart - firstEntry.startTime;\n      \n      this.recordMetric('firstInputDelay', fid);\n      \n      if (fid > performanceTargets.firstInputDelay.target) {\n        console.warn(`FID too slow: ${fid.toFixed(2)}ms`);\n      }\n    }).observe({ entryTypes: ['first-input'] });\n  }\n  \n  observeLayerRendering() {\n    // Wrap layer loading functions with performance monitoring\n    const originalLoadPolygon = window.loadPolygonCategory;\n    \n    window.loadPolygonCategory = async (category, url) => {\n      const startTime = performance.now();\n      \n      try {\n        const result = await originalLoadPolygon(category, url);\n        const endTime = performance.now();\n        const duration = endTime - startTime;\n        \n        this.recordMetric('layerRendering', duration, category);\n        \n        const target = performanceTargets.layerRendering.target;\n        if (duration > target) {\n          console.warn(`${category} rendering slow: ${duration.toFixed(2)}ms`);\n        }\n        \n        return result;\n      } catch (error) {\n        const endTime = performance.now();\n        const duration = endTime - startTime;\n        \n        this.recordMetric('layerRenderingError', duration, category);\n        throw error;\n      }\n    };\n  }\n  \n  observeMemoryUsage() {\n    if ('memory' in performance) {\n      setInterval(() => {\n        const memInfo = performance.memory;\n        \n        this.recordMetric('memoryUsage', {\n          used: memInfo.usedJSHeapSize,\n          total: memInfo.totalJSHeapSize,\n          limit: memInfo.jsHeapSizeLimit\n        });\n        \n        // Warn if memory usage is high\n        const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;\n        if (usagePercent > 80) {\n          console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);\n          this.triggerGarbageCollection();\n        }\n      }, 30000); // Check every 30 seconds\n    }\n  }\n  \n  recordMetric(type, value, category = null) {\n    const timestamp = Date.now();\n    \n    if (!this.metrics[type]) {\n      this.metrics[type] = [];\n    }\n    \n    this.metrics[type].push({\n      value,\n      category,\n      timestamp\n    });\n    \n    // Keep only last 100 measurements\n    if (this.metrics[type].length > 100) {\n      this.metrics[type] = this.metrics[type].slice(-100);\n    }\n  }\n  \n  getPerformanceReport() {\n    const report = {};\n    \n    Object.keys(this.metrics).forEach(type => {\n      const measurements = this.metrics[type];\n      if (measurements.length === 0) return;\n      \n      const values = measurements.map(m => \n        typeof m.value === 'object' ? m.value.used || m.value : m.value\n      );\n      \n      report[type] = {\n        count: measurements.length,\n        average: values.reduce((a, b) => a + b, 0) / values.length,\n        min: Math.min(...values),\n        max: Math.max(...values),\n        latest: values[values.length - 1]\n      };\n    });\n    \n    return report;\n  }\n  \n  triggerGarbageCollection() {\n    // Clean up unused layers\n    if (typeof window.cleanupUnusedLayers === 'function') {\n      window.cleanupUnusedLayers();\n    }\n    \n    // Force garbage collection if available\n    if (window.gc) {\n      window.gc();\n    }\n  }\n}\n\n// Initialize performance monitoring\nconst performanceMonitor = new PerformanceMonitor();\nwindow.performanceMonitor = performanceMonitor;\n```\n\n### **Performance Budget Enforcement**\n\n```javascript\n/**\n * Performance budget system\n */\nclass PerformanceBudget {\n  constructor() {\n    this.budgets = {\n      initialLoad: 3800,      // Time to Interactive budget\n      layerRender: 300,       // Per-layer rendering budget\n      userInteraction: 150,   // User interaction response budget\n      memoryUsage: 150 * 1024 * 1024, // 150MB memory budget\n      networkRequests: 6      // Concurrent request budget\n    };\n    \n    this.violations = [];\n    this.activeRequests = 0;\n  }\n  \n  checkBudget(metric, value, context = {}) {\n    const budget = this.budgets[metric];\n    if (!budget) return true;\n    \n    const exceeded = value > budget;\n    \n    if (exceeded) {\n      this.recordViolation(metric, value, budget, context);\n    }\n    \n    return !exceeded;\n  }\n  \n  recordViolation(metric, actual, budget, context) {\n    const violation = {\n      metric,\n      actual,\n      budget,\n      exceeded: actual - budget,\n      percentage: ((actual / budget) * 100).toFixed(1),\n      context,\n      timestamp: Date.now()\n    };\n    \n    this.violations.push(violation);\n    \n    console.warn(`Performance budget exceeded:`, {\n      metric,\n      actual: `${actual.toFixed(2)}ms`,\n      budget: `${budget}ms`,\n      exceeded: `${violation.exceeded.toFixed(2)}ms (${violation.percentage}%)`\n    });\n    \n    // Auto-optimization for certain violations\n    this.autoOptimize(metric, violation);\n    \n    // Keep only last 50 violations\n    if (this.violations.length > 50) {\n      this.violations = this.violations.slice(-50);\n    }\n  }\n  \n  autoOptimize(metric, violation) {\n    switch (metric) {\n      case 'memoryUsage':\n        console.log('Auto-optimization: Triggering garbage collection');\n        performanceMonitor.triggerGarbageCollection();\n        break;\n        \n      case 'layerRender':\n        if (violation.context.category === 'lga') {\n          console.log('Auto-optimization: Reducing LGA batch size');\n          frontendLimits.batchSizes.lga = Math.max(1, frontendLimits.batchSizes.lga - 1);\n        }\n        break;\n        \n      case 'userInteraction':\n        console.log('Auto-optimization: Deferring non-critical updates');\n        this.deferNonCriticalUpdates();\n        break;\n    }\n  }\n  \n  deferNonCriticalUpdates() {\n    // Defer label updates during user interaction\n    if (window.isBulkOperation) return;\n    \n    window.beginBulkOperation();\n    setTimeout(() => {\n      window.endBulkOperation();\n    }, 100);\n  }\n  \n  trackNetworkRequest() {\n    this.activeRequests++;\n    \n    if (!this.checkBudget('networkRequests', this.activeRequests)) {\n      console.warn('Too many concurrent network requests');\n    }\n    \n    return () => {\n      this.activeRequests--;\n    };\n  }\n  \n  getViolationReport() {\n    const report = {\n      totalViolations: this.violations.length,\n      recentViolations: this.violations.slice(-10),\n      violationsByMetric: {}\n    };\n    \n    // Group violations by metric\n    this.violations.forEach(violation => {\n      const metric = violation.metric;\n      if (!report.violationsByMetric[metric]) {\n        report.violationsByMetric[metric] = {\n          count: 0,\n          avgExceeded: 0,\n          maxExceeded: 0\n        };\n      }\n      \n      const metricReport = report.violationsByMetric[metric];\n      metricReport.count++;\n      metricReport.avgExceeded = \n        (metricReport.avgExceeded * (metricReport.count - 1) + violation.exceeded) / metricReport.count;\n      metricReport.maxExceeded = Math.max(metricReport.maxExceeded, violation.exceeded);\n    });\n    \n    return report;\n  }\n}\n\n// Initialize performance budget\nconst performanceBudget = new PerformanceBudget();\nwindow.performanceBudget = performanceBudget;\n```\n\n## 🔧 Optimization Strategies\n\n### **Progressive Loading**\n\n```javascript\n/**\n * Progressive data loading based on performance\n */\nclass ProgressiveLoader {\n  constructor() {\n    this.loadingStrategy = this.determineLoadingStrategy();\n    this.loadQueue = [];\n    this.isLoading = false;\n  }\n  \n  determineLoadingStrategy() {\n    const deviceContext = window.getDeviceContext ? window.getDeviceContext() : {};\n    const connectionSpeed = this.estimateConnectionSpeed();\n    \n    if (deviceContext.isMobile && connectionSpeed === 'slow') {\n      return 'minimal'; // Load only essential data\n    } else if (connectionSpeed === 'fast' && !deviceContext.isMobile) {\n      return 'aggressive'; // Load everything quickly\n    } else {\n      return 'progressive'; // Load in priority order\n    }\n  }\n  \n  estimateConnectionSpeed() {\n    if ('connection' in navigator) {\n      const connection = navigator.connection;\n      const effectiveType = connection.effectiveType;\n      \n      if (effectiveType === '4g') return 'fast';\n      if (effectiveType === '3g') return 'medium';\n      return 'slow';\n    }\n    \n    return 'unknown';\n  }\n  \n  async loadDataProgressively() {\n    const strategies = {\n      minimal: [\n        { category: 'ambulance', priority: 1 },\n        { category: 'police', priority: 2 }\n      ],\n      progressive: [\n        { category: 'ambulance', priority: 1 },\n        { category: 'police', priority: 2 },\n        { category: 'ses', priority: 3 },\n        { category: 'lga', priority: 4 },\n        { category: 'cfa', priority: 5 },\n        { category: 'frv', priority: 6 }\n      ],\n      aggressive: [\n        { category: 'ambulance', priority: 1 },\n        { category: 'police', priority: 1 },\n        { category: 'ses', priority: 1 },\n        { category: 'lga', priority: 2 },\n        { category: 'cfa', priority: 2 },\n        { category: 'frv', priority: 2 }\n      ]\n    };\n    \n    const loadPlan = strategies[this.loadingStrategy];\n    const priorityGroups = this.groupByPriority(loadPlan);\n    \n    for (const [priority, categories] of priorityGroups) {\n      console.log(`Loading priority ${priority} categories:`, categories.map(c => c.category));\n      \n      // Load categories in priority group (potentially in parallel)\n      if (this.loadingStrategy === 'aggressive') {\n        await this.loadCategoriesParallel(categories);\n      } else {\n        await this.loadCategoriesSequential(categories);\n      }\n      \n      // Check performance budget between priority groups\n      const report = performanceMonitor.getPerformanceReport();\n      if (report.memoryUsage && report.memoryUsage.latest > performanceBudget.budgets.memoryUsage) {\n        console.warn('Memory budget exceeded, switching to minimal loading');\n        this.loadingStrategy = 'minimal';\n        break;\n      }\n    }\n  }\n  \n  groupByPriority(loadPlan) {\n    const groups = new Map();\n    \n    loadPlan.forEach(item => {\n      if (!groups.has(item.priority)) {\n        groups.set(item.priority, []);\n      }\n      groups.get(item.priority).push(item);\n    });\n    \n    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);\n  }\n  \n  async loadCategoriesParallel(categories) {\n    const promises = categories.map(({ category }) => this.loadCategory(category));\n    await Promise.allSettled(promises);\n  }\n  \n  async loadCategoriesSequential(categories) {\n    for (const { category } of categories) {\n      await this.loadCategory(category);\n      \n      // Small delay between categories for responsiveness\n      await new Promise(resolve => setTimeout(resolve, 50));\n    }\n  }\n  \n  async loadCategory(category) {\n    const startTime = performance.now();\n    \n    try {\n      if (category === 'ambulance') {\n        await window.loadAmbulance();\n      } else if (category === 'police') {\n        await window.loadPolice();\n      } else {\n        await window.loadPolygonCategory(category, `geojson/${category}.geojson`);\n      }\n      \n      const duration = performance.now() - startTime;\n      console.log(`✓ Loaded ${category} in ${duration.toFixed(2)}ms`);\n      \n    } catch (error) {\n      const duration = performance.now() - startTime;\n      console.error(`✗ Failed to load ${category} after ${duration.toFixed(2)}ms:`, error);\n    }\n  }\n}\n\n// Initialize progressive loader\nconst progressiveLoader = new ProgressiveLoader();\nwindow.progressiveLoader = progressiveLoader;\n```\n\n## 📱 Device-Specific Optimizations\n\n### **Mobile Performance**\n\n```javascript\n/**\n * Mobile-specific optimizations\n */\nconst MobileOptimizations = {\n  // Reduce batch sizes for mobile devices\n  adjustBatchSizes() {\n    const deviceContext = window.getDeviceContext();\n    \n    if (deviceContext.isMobile) {\n      // Reduce batch sizes by 50% for mobile\n      Object.keys(frontendLimits.batchSizes).forEach(category => {\n        frontendLimits.batchSizes[category] = Math.max(1, \n          Math.floor(frontendLimits.batchSizes[category] * 0.5)\n        );\n      });\n      \n      console.log('Mobile optimizations: Reduced batch sizes');\n    }\n  },\n  \n  // Optimize memory usage for mobile\n  enableMemoryOptimizations() {\n    if ('memory' in performance) {\n      const memLimit = performance.memory.jsHeapSizeLimit;\n      \n      // Adjust memory budget based on device capacity\n      if (memLimit < 100 * 1024 * 1024) { // Less than 100MB\n        performanceBudget.budgets.memoryUsage = 50 * 1024 * 1024; // 50MB budget\n        \n        // More aggressive garbage collection\n        setInterval(() => {\n          performanceMonitor.triggerGarbageCollection();\n        }, 60000); // Every minute\n        \n        console.log('Mobile optimizations: Enabled aggressive memory management');\n      }\n    }\n  },\n  \n  // Reduce visual effects for performance\n  optimizeVisualEffects() {\n    const deviceContext = window.getDeviceContext();\n    \n    if (deviceContext.isMobile || deviceContext.isLowEnd) {\n      // Disable complex animations\n      document.body.classList.add('reduced-motion');\n      \n      // Simplify map rendering\n      const map = window.getMap();\n      if (map) {\n        map.options.preferCanvas = true;\n        map.options.zoomAnimation = false;\n        map.options.markerZoomAnimation = false;\n      }\n      \n      console.log('Mobile optimizations: Reduced visual effects');\n    }\n  }\n};\n\n// Apply mobile optimizations\nif (document.readyState === 'loading') {\n  document.addEventListener('DOMContentLoaded', () => {\n    MobileOptimizations.adjustBatchSizes();\n    MobileOptimizations.enableMemoryOptimizations();\n    MobileOptimizations.optimizeVisualEffects();\n  });\n} else {\n  MobileOptimizations.adjustBatchSizes();\n  MobileOptimizations.enableMemoryOptimizations();\n  MobileOptimizations.optimizeVisualEffects();\n}\n```\n\n## 🔗 Related Documentation\n\n- **[Performance Baselines](../performance/baselines.md)** - Detailed performance targets and measurement procedures\n- **[API Examples](examples.md)** - Performance-optimized code examples\n- **[Authentication](authentication.md)** - Security-related performance considerations\n- **[Error Handling](error-handling.md)** - Performance-aware error recovery\n\n---\n\n**Next**: Learn about [comprehensive error handling patterns](error-handling.md) for robust application development.