/**
 * @module modules/DataLoadingOrchestrator
 * Central orchestration system for data loading operations
 * Provides robust, future-proof data loading with error handling and performance optimization
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class DataLoadingOrchestrator
 * Orchestrates all data loading operations with robust error handling and performance optimization
 */
export class DataLoadingOrchestrator {
  constructor() {
    this.initialized = false;
    this.loadingPhase = 'idle';
    this.loadedCategories = new Set();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();
    this.errorRecovery = new Map();
    this.polygonLoader = null;
    
    // Data loading configuration
    this.loadingConfig = {
      priorities: {
        'ses': 'high',
        'lga': 'high', 
        'cfa': 'medium',
        'frv': 'low',
        'ambulance': 'medium',
        'police': 'low'
      },
      urls: {
        'ses': 'geojson/ses.geojson',
        'lga': 'geojson/LGAs.geojson',
        'cfa': 'geojson/cfa.geojson',
        'frv': 'geojson/frv.geojson',
        'ambulance': 'geojson/ambulance.geojson',
        'police': 'geojson/police.geojson'
      },
      fallbackUrls: {
        // Future: Add fallback URLs for critical data
      },
      batchSizes: {
        'high': 3,    // Load 3 high-priority items in parallel
        'medium': 2,  // Load 2 medium-priority items in parallel
        'low': 1      // Load 1 low-priority item at a time
      }
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.loadInitialData = this.loadInitialData.bind(this);
    this.loadCategory = this.loadCategory.bind(this);
    this.loadCategoriesInParallel = this.loadCategoriesInParallel.bind(this);
    this.handleLoadingError = this.handleLoadingError.bind(this);
    this.retryFailedLoad = this.retryFailedLoad.bind(this);
    this.getLoadingStatus = this.getLoadingStatus.bind(this);
    this.getPerformanceMetrics = this.getPerformanceMetrics.bind(this);
    
    console.log('🎼 DataLoadingOrchestrator: Orchestration system initialized');
  }
  
  /**
   * Initialize the data loading orchestrator
   */
  async init() {
    if (this.initialized) {
      console.warn('DataLoadingOrchestrator: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 DataLoadingOrchestrator: Starting initialization...');
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up ongoing data management
      this.setupDataManagement();
      
      this.initialized = true;
      console.log('✅ DataLoadingOrchestrator: Initialization complete');
      
      // Emit ready event
      globalEventBus.emit('dataOrchestrator:ready', { orchestrator: this });
      
    } catch (error) {
      console.error('🚨 DataLoadingOrchestrator: Initialization failed:', error);
      this.handleLoadingError('initialization', error);
      throw error;
    }
  }
  
  /**
   * Wait for required dependencies to be ready
   */
  async waitForDependencies() {
    console.log('⏳ DataLoadingOrchestrator: Waiting for dependencies...');
    
    // Wait for polygon loader to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!this.polygonLoader && attempts < maxAttempts) {
      // Try to get polygon loader from state manager
      const polygonLoaderModule = stateManager.get('polygonLoader');
      if (polygonLoaderModule) {
        this.polygonLoader = polygonLoaderModule;
        console.log('✅ DataLoadingOrchestrator: PolygonLoader found in state manager');
        console.log('🔍 DataLoadingOrchestrator: PolygonLoader type:', typeof this.polygonLoader);
        console.log('🔍 DataLoadingOrchestrator: PolygonLoader has loadCategory:', typeof this.polygonLoader.loadCategory);
        console.log('🔍 DataLoadingOrchestrator: PolygonLoader keys:', Object.keys(this.polygonLoader));
        break;
      }
      
      // Wait 100ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.polygonLoader) {
      // Try to import PolygonLoader directly as fallback
      try {
        console.log('🔄 DataLoadingOrchestrator: Trying direct import of PolygonLoader...');
        const { polygonLoader } = await import('./PolygonLoader.js');
        if (polygonLoader) {
          this.polygonLoader = polygonLoader;
          console.log('✅ DataLoadingOrchestrator: PolygonLoader imported directly');
        } else {
          throw new Error('PolygonLoader not found in module');
        }
      } catch (error) {
        console.error('❌ DataLoadingOrchestrator: Failed to import PolygonLoader directly:', error);
        throw new Error('DataLoadingOrchestrator: PolygonLoader not available after timeout and direct import failed');
      }
    }
    
    console.log('✅ DataLoadingOrchestrator: Dependencies ready');
  }
  
  /**
   * Load initial data with priority-based orchestration
   */
  async loadInitialData() {
    console.log('🎼 DataLoadingOrchestrator: Starting initial data loading...');
    
    this.loadingPhase = 'initial';
    
    // Group categories by priority
    const categoriesByPriority = this.groupCategoriesByPriority();
    
    // Load high priority first (blocking)
    if (categoriesByPriority.high.length > 0) {
      console.log('🚀 DataLoadingOrchestrator: Loading high-priority data...');
      await this.loadCategoriesInParallel(categoriesByPriority.high, 'high');
    }
    
    // Load medium priority (non-blocking)
    if (categoriesByPriority.medium.length > 0) {
      console.log('⚡ DataLoadingOrchestrator: Loading medium-priority data...');
      this.loadCategoriesInParallel(categoriesByPriority.medium, 'medium');
    }
    
    // Load low priority (background)
    if (categoriesByPriority.low.length > 0) {
      console.log('🐌 DataLoadingOrchestrator: Loading low-priority data...');
      setTimeout(() => {
        this.loadCategoriesInParallel(categoriesByPriority.low, 'low');
      }, 500); // Delay low priority loading
    }
    
    this.loadingPhase = 'complete';
    console.log('✅ DataLoadingOrchestrator: Initial data loading orchestrated');
  }
  
  /**
   * Group categories by priority
   */
  groupCategoriesByPriority() {
    const groups = { high: [], medium: [], low: [] };
    
    Object.keys(this.loadingConfig.priorities).forEach(category => {
      const priority = this.loadingConfig.priorities[category];
      if (groups[priority]) {
        groups[priority].push(category);
      }
    });
    
    return groups;
  }
  
  /**
   * Load multiple categories in parallel with priority-based batching
   */
  async loadCategoriesInParallel(categories, priority) {
    const batchSize = this.loadingConfig.batchSizes[priority] || 1;
    
    // Process in batches
    for (let i = 0; i < categories.length; i += batchSize) {
      const batch = categories.slice(i, i + batchSize);
      
      console.log(`📦 DataLoadingOrchestrator: Loading ${priority} priority batch:`, batch);
      
      // Load batch in parallel
      const batchPromises = batch.map(category => this.loadCategory(category));
      
      try {
        const results = await Promise.allSettled(batchPromises);
        
        // Process results
        results.forEach((result, index) => {
          const category = batch[index];
          if (result.status === 'fulfilled') {
            console.log(`✅ DataLoadingOrchestrator: ${category} loaded successfully`);
            this.loadedCategories.add(category);
          } else {
            console.error(`❌ DataLoadingOrchestrator: ${category} failed to load:`, result.reason);
            this.handleLoadingError(category, result.reason);
          }
        });
        
        // Small delay between batches for performance
        if (i + batchSize < categories.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.error(`🚨 DataLoadingOrchestrator: Batch loading failed:`, error);
        batch.forEach(category => this.handleLoadingError(category, error));
      }
    }
  }
  
  /**
   * Load a single category with error handling and performance tracking
   */
  async loadCategory(category) {
    if (this.loadedCategories.has(category)) {
      console.warn(`DataLoadingOrchestrator: ${category} already loaded`);
      return;
    }
    
    if (this.loadingPromises.has(category)) {
      console.warn(`DataLoadingOrchestrator: ${category} already loading`);
      return this.loadingPromises.get(category);
    }
    
    const url = this.loadingConfig.urls[category];
    if (!url) {
      throw new Error(`DataLoadingOrchestrator: No URL configured for category ${category}`);
    }
    
    console.log(`🔧 DataLoadingOrchestrator: Loading ${category} from ${url}`);
    
    // Start performance tracking
    const startTime = performance.now();
    this.performanceMetrics.set(category, { start: startTime });
    
    // Create loading promise
    const loadingPromise = this.executeCategoryLoad(category, url);
    this.loadingPromises.set(category, loadingPromise);
    
    try {
      const result = await loadingPromise;
      
      // Record success metrics
      const duration = performance.now() - startTime;
      this.performanceMetrics.set(category, { 
        start: startTime, 
        end: performance.now(), 
        duration: duration,
        success: true 
      });
      
      this.loadedCategories.add(category);
      this.loadingPromises.delete(category);
      
      // Emit success event
      globalEventBus.emit('dataOrchestrator:categoryLoaded', { 
        category, 
        duration, 
        orchestrator: this 
      });
      
      console.log(`✅ DataLoadingOrchestrator: ${category} loaded in ${duration.toFixed(2)}ms`);
      return result;
      
    } catch (error) {
      // Record failure metrics
      const duration = performance.now() - startTime;
      this.performanceMetrics.set(category, { 
        start: startTime, 
        end: performance.now(), 
        duration: duration,
        success: false,
        error: error.message 
      });
      
      this.loadingPromises.delete(category);
      this.handleLoadingError(category, error);
      throw error;
    }
  }
  
  /**
   * Execute the actual category loading
   */
  async executeCategoryLoad(category, url) {
    if (!this.polygonLoader) {
      throw new Error('DataLoadingOrchestrator: PolygonLoader not available');
    }
    
    // Try primary URL first
    try {
      return await this.polygonLoader.loadCategory(category, url);
    } catch (error) {
      // Try fallback URL if available
      const fallbackUrl = this.loadingConfig.fallbackUrls[category];
      if (fallbackUrl) {
        console.warn(`DataLoadingOrchestrator: Primary URL failed for ${category}, trying fallback`);
        return await this.polygonLoader.loadCategory(category, fallbackUrl);
      }
      throw error;
    }
  }
  
  /**
   * Handle loading errors with recovery strategies
   */
  handleLoadingError(category, error) {
    console.error(`🚨 DataLoadingOrchestrator: Error loading ${category}:`, error);
    
    // Record error for recovery
    this.errorRecovery.set(category, {
      error: error.message,
      timestamp: Date.now(),
      retryCount: (this.errorRecovery.get(category)?.retryCount || 0) + 1
    });
    
    // Emit error event
    globalEventBus.emit('dataOrchestrator:categoryError', { 
      category, 
      error, 
      orchestrator: this 
    });
    
    // Determine recovery strategy based on priority
    const priority = this.loadingConfig.priorities[category];
    if (priority === 'high') {
      // High priority: retry immediately
      console.log(`🔄 DataLoadingOrchestrator: Retrying high-priority ${category}...`);
      setTimeout(() => this.retryFailedLoad(category), 1000);
    } else if (priority === 'medium') {
      // Medium priority: retry with delay
      console.log(`🔄 DataLoadingOrchestrator: Retrying medium-priority ${category} in 5s...`);
      setTimeout(() => this.retryFailedLoad(category), 5000);
    }
    // Low priority: no automatic retry
  }
  
  /**
   * Retry failed load with exponential backoff
   */
  async retryFailedLoad(category) {
    const errorInfo = this.errorRecovery.get(category);
    if (!errorInfo) return;
    
    const maxRetries = 3;
    if (errorInfo.retryCount > maxRetries) {
      console.error(`❌ DataLoadingOrchestrator: Max retries exceeded for ${category}`);
      return;
    }
    
    console.log(`🔄 DataLoadingOrchestrator: Retry ${errorInfo.retryCount}/${maxRetries} for ${category}`);
    
    try {
      await this.loadCategory(category);
    } catch (error) {
      console.error(`❌ DataLoadingOrchestrator: Retry failed for ${category}:`, error);
    }
  }
  
  /**
   * Set up ongoing data management
   */
  setupDataManagement() {
    // Listen for data loading requests
    globalEventBus.on('dataOrchestrator:loadCategory', ({ category, url }) => {
      this.loadCategory(category, url);
    });
    
    // Listen for retry requests
    globalEventBus.on('dataOrchestrator:retryCategory', ({ category }) => {
      this.retryFailedLoad(category);
    });
    
    console.log('✅ DataLoadingOrchestrator: Data management setup complete');
  }
  
  /**
   * Get current loading status
   */
  getLoadingStatus() {
    return {
      phase: this.loadingPhase,
      loadedCategories: Array.from(this.loadedCategories),
      loadingCategories: Array.from(this.loadingPromises.keys()),
      errorCategories: Array.from(this.errorRecovery.keys()),
      totalCategories: Object.keys(this.loadingConfig.priorities).length
    };
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {};
    this.performanceMetrics.forEach((data, category) => {
      metrics[category] = {
        duration: data.duration,
        success: data.success,
        error: data.error
      };
    });
    return metrics;
  }
  
  /**
   * Legacy preloader functionality - maintains backward compatibility
   */
  async startPreloading() {
    console.log('🔄 DataLoadingOrchestrator: Starting legacy preloading sequence...');
    
    // Show loading spinner
    this.showLoadingSpinner();
    
    // Define preload order (matching legacy preloader.js)
    const preloadOrder = [
      { name: 'SES Areas', category: 'ses', url: 'geojson/ses.geojson' },
      { name: 'SES Facilities', category: 'sesFacilities', loader: () => window.loadSesFacilities() },
      { name: 'SES Units', category: 'sesUnits', loader: () => window.loadSesUnits() },
      { name: 'LGA Areas', category: 'lga', url: 'geojson/LGAs.geojson' },
      { name: 'CFA Areas', category: 'cfa', url: 'geojson/cfa.geojson' },
      { name: 'CFA Facilities', category: 'cfaFacilities', loader: () => window.loadCfaFacilities() },
      { name: 'Ambulance Stations', category: 'ambulance', url: 'geojson/ambulance.geojson' },
      { name: 'FRV Boundaries', category: 'frv', url: 'geojson/frv.geojson' }
    ];
    
    // Load each item in sequence with progress updates
    for (let i = 0; i < preloadOrder.length; i++) {
      const { name, category, url, loader } = preloadOrder[i];
      
      try {
        // Update spinner text
        this.updateLoadingSpinner(`Loading ${name}...`);
        
        if (loader) {
          // Use legacy loader function
          await loader();
        } else if (url) {
          // Use orchestrator to load category
          await this.loadCategory(category);
        }
        
        console.log(`✅ DataLoadingOrchestrator: ${name} loaded successfully`);
        
        // Small delay between items (matching legacy behavior)
        if (i < preloadOrder.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.error(`❌ DataLoadingOrchestrator: Failed to load ${name}:`, error);
        // Continue with next item even if one fails
      }
    }
    
    // Hide loading spinner
    this.hideLoadingSpinner();
    
    console.log('✅ DataLoadingOrchestrator: Legacy preloading sequence complete');
  }
  
  /**
   * Show loading spinner (legacy compatibility)
   */
  showLoadingSpinner() {
    // Remove existing spinner if any
    this.hideLoadingSpinner();
    
    // Create spinner element
    const spinner = document.createElement('div');
    spinner.id = 'preload-spinner';
    spinner.innerText = 'Loading map data...';
    spinner.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #fff;
      padding: 8px;
      border-radius: 4px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
      font-size: 14px;
      border: 1px solid #ddd;
    `;
    
    document.body.appendChild(spinner);
  }
  
  /**
   * Update loading spinner text
   */
  updateLoadingSpinner(text) {
    const spinner = document.getElementById('preload-spinner');
    if (spinner) {
      spinner.innerText = text;
    }
  }
  
  /**
   * Hide loading spinner (legacy compatibility)
   */
  hideLoadingSpinner() {
    const spinner = document.getElementById('preload-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
  
  /**
   * Check if orchestrator is ready
   */
  isReady() {
    return this.initialized && this.loadingPhase === 'complete';
  }
}

// Export singleton instance
export const dataLoadingOrchestrator = new DataLoadingOrchestrator();

// Export for global access
if (typeof window !== 'undefined') {
  window.DataLoadingOrchestrator = DataLoadingOrchestrator;
  window.dataLoadingOrchestrator = dataLoadingOrchestrator;
  
  // Legacy compatibility layer - proxy old preloader functions to new ES6 system
  console.log('🔧 DataLoadingOrchestrator: Setting up legacy compatibility layer');
  
  // Legacy preloader functions
  window.startPreloading = () => {
    console.log('🔄 Legacy startPreloading() called - delegating to DataLoadingOrchestrator');
    return dataLoadingOrchestrator.startPreloading();
  };
  
  // Legacy loading functions (if they exist)
  if (typeof window.loadPolygonCategory === 'function') {
    const originalLoadPolygonCategory = window.loadPolygonCategory;
    window.loadPolygonCategory = (category, url) => {
      console.log(`🔄 Legacy loadPolygonCategory(${category}, ${url}) called - delegating to DataLoadingOrchestrator`);
      return dataLoadingOrchestrator.loadCategory(category);
    };
  }
  
  console.log('✅ DataLoadingOrchestrator: Legacy compatibility layer active');
}

