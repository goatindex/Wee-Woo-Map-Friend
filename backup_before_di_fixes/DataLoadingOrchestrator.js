/**
 * @module modules/DataLoadingOrchestrator
 * Central orchestration system for data loading operations
 * Provides robust, future-proof data loading with error handling and performance optimization
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';

/**
 * @class DataLoadingOrchestrator
 * Orchestrates all data loading operations with robust error handling and performance optimization
 */
@injectable()
export class DataLoadingOrchestrator {
  constructor(
    @inject(TYPES.EventBus) private eventBus,
    @inject(TYPES.StateManager) private stateManager,
    @inject(TYPES.ConfigurationManager) private configurationManager,
    @inject(TYPES.StructuredLogger) private logger
  ) {
    this.initialized = false;
    this.loadingPhase = 'idle';
    this.loadedCategories = new Set();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();
    this.errorRecovery = new Map();
    this.polygonLoader = null;
    
    // Create module-specific logger
    this.moduleLogger = 
    
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
        // URLs will be set dynamically based on environment
        'ses': '',
        'lga': '',
        'cfa': '',
        'frv': '',
        'ambulance': '',
        'police': ''
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
    
    this.moduleLogger.info('Orchestration system initialized');
  }
  
  /**
   * Initialize data URLs based on environment configuration
   */
  async initializeDataUrls() {
    try {
      const { environmentConfig } = await import('/dist/modules/EnvironmentConfig.js');
      const dataPaths = environmentConfig.getDataPaths();
      
      // Update URLs with environment-specific paths
      this.loadingConfig.urls = {
        'ses': dataPaths.ses,
        'lga': dataPaths.lga,
        'cfa': dataPaths.cfa,
        'frv': dataPaths.frv,
        'ambulance': dataPaths.ambulance,
        'police': dataPaths.police
      };
      
      this.moduleLogger.info('Data URLs initialized', {
        operation: 'initializeDataUrls',
        urls: this.loadingConfig.urls,
        environment: environmentConfig.getEnvironment()
      });
    } catch (error) {
      this.moduleLogger.error('Failed to initialize data URLs', {
        operation: 'initializeDataUrls',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Initialize the data loading orchestrator
   */
  async init() {
    if (this.initialized) {
      this.moduleLogger.warn('Already initialized', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }
    
    const timer = this.moduleLogger.time('orchestrator-initialization');
    try {
      // Initialize data URLs based on environment
      await this.initializeDataUrls();
      
      this.moduleLogger.info('Starting initialization', {
        operation: 'init',
        config: this.loadingConfig,
        categories: Object.keys(this.loadingConfig.urls)
      });
      
      // Wait for dependencies
      await this.waitForDependencies();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up ongoing data management
      this.setupDataManagement();
      
      this.initialized = true;
      timer.end({
        success: true,
        categories: Object.keys(this.loadingConfig.urls),
        loadedCategories: Array.from(this.loadedCategories)
      });
      this.moduleLogger.info('Initialization complete', {
        operation: 'init',
        categories: Object.keys(this.loadingConfig.urls),
        loadedCategories: Array.from(this.loadedCategories),
        duration: `${timer.duration.toFixed(2)}ms`
      });
      
      // Emit ready event
      globalEventBus.emit('dataOrchestrator:ready', { orchestrator: this });
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        categories: Object.keys(this.loadingConfig.urls)
      });
      this.moduleLogger.error('Initialization failed', { 
        operation: 'init',
        error: error.message,
        stack: error.stack,
        categories: Object.keys(this.loadingConfig.urls)
      });
      this.handleLoadingError('initialization', error);
      throw error;
    }
  }
  
  /**
   * Wait for required dependencies to be ready
   */
  async waitForDependencies() {
    this.moduleLogger.debug('Waiting for dependencies...');
    
    // Wait for polygon loader to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!this.polygonLoader && attempts < maxAttempts) {
      // Try to get polygon loader from state manager
      const polygonLoaderModule = stateManager.get('polygonLoader');
      if (polygonLoaderModule) {
        this.polygonLoader = polygonLoaderModule;
        this.moduleLogger.info('PolygonLoader found in state manager');
        break;
      }
      
      // Wait 100ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.polygonLoader) {
      // Try to import PolygonLoader directly as fallback
      try {
        this.moduleLogger.debug('Trying direct import of PolygonLoader...');
        const { polygonLoader } = await import('/dist/modules/PolygonLoader.js');
        if (polygonLoader) {
          this.polygonLoader = polygonLoader;
          this.moduleLogger.info('PolygonLoader imported directly');
        } else {
          throw new Error('PolygonLoader not found in module');
        }
      } catch (error) {
        this.moduleLogger.error('Failed to import PolygonLoader directly', { 
          error: error.message,
          stack: error.stack 
        });
        throw new Error('DataLoadingOrchestrator: PolygonLoader not available after timeout and direct import failed');
      }
    }
    
    this.moduleLogger.info('Dependencies ready');
  }
  
  /**
   * Load initial data with priority-based orchestration
   */
  async loadInitialData() {
    const timer = this.moduleLogger.time('initial-data-loading');
    this.moduleLogger.info('Starting initial data loading', {
      operation: 'loadInitialData',
      phase: 'initial',
      totalCategories: Object.keys(this.loadingConfig.urls).length
    });
    
    this.loadingPhase = 'initial';
    
    // Group categories by priority
    const categoriesByPriority = this.groupCategoriesByPriority();
    
    // Load high priority first (blocking)
    if (categoriesByPriority.high.length > 0) {
      this.moduleLogger.info('Loading high-priority data', { 
        operation: 'loadInitialData',
        priority: 'high',
        categories: categoriesByPriority.high,
        count: categoriesByPriority.high.length
      });
      await this.loadCategoriesInParallel(categoriesByPriority.high, 'high');
    }
    
    // Load medium priority (non-blocking)
    if (categoriesByPriority.medium.length > 0) {
      this.moduleLogger.info('Loading medium-priority data', { 
        operation: 'loadInitialData',
        priority: 'medium',
        categories: categoriesByPriority.medium,
        count: categoriesByPriority.medium.length
      });
      this.loadCategoriesInParallel(categoriesByPriority.medium, 'medium');
    }
    
    // Load low priority (background)
    if (categoriesByPriority.low.length > 0) {
      this.moduleLogger.info('Loading low-priority data', { 
        operation: 'loadInitialData',
        priority: 'low',
        categories: categoriesByPriority.low,
        count: categoriesByPriority.low.length,
        delay: '500ms'
      });
      setTimeout(() => {
        this.loadCategoriesInParallel(categoriesByPriority.low, 'low');
      }, 500); // Delay low priority loading
    }
    
    this.loadingPhase = 'complete';
    timer.end({
      success: true,
      highPriority: categoriesByPriority.high.length,
      mediumPriority: categoriesByPriority.medium.length,
      lowPriority: categoriesByPriority.low.length
    });
    this.moduleLogger.info('Initial data loading orchestrated', {
      operation: 'loadInitialData',
      phase: 'complete',
      highPriority: categoriesByPriority.high.length,
      mediumPriority: categoriesByPriority.medium.length,
      lowPriority: categoriesByPriority.low.length,
      duration: `${timer.duration.toFixed(2)}ms`
    });
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
      
      this.moduleLogger.debug(`Loading ${priority} priority batch`, { 
        operation: 'loadCategoriesInParallel',
        priority,
        batch,
        batchSize: batch.length,
        totalCategories: categories.length,
        batchIndex: Math.floor(i / batchSize) + 1,
        totalBatches: Math.ceil(categories.length / batchSize)
      });
      
      // Load batch in parallel
      const batchPromises = batch.map(category => this.loadCategory(category));
      
      try {
        const results = await Promise.allSettled(batchPromises);
        
        // Process results
        results.forEach((result, index) => {
          const category = batch[index];
          if (result.status === 'fulfilled') {
            this.moduleLogger.info(`${category} loaded successfully`, {
              operation: 'batchLoadResult',
              category,
              priority,
              batchIndex: Math.floor(i / batchSize) + 1,
              status: 'fulfilled'
            });
            this.loadedCategories.add(category);
          } else {
            this.moduleLogger.error(`${category} failed to load`, { 
              operation: 'batchLoadResult',
              category,
              priority,
              batchIndex: Math.floor(i / batchSize) + 1,
              status: 'rejected',
              error: result.reason.message,
              stack: result.reason.stack 
            });
            this.handleLoadingError(category, result.reason);
          }
        });
        
        // Small delay between batches for performance
        if (i + batchSize < categories.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        this.moduleLogger.error('Batch loading failed', { 
          operation: 'loadCategoriesInParallel',
          priority,
          batch,
          batchSize: batch.length,
          batchIndex: Math.floor(i / batchSize) + 1,
          error: error.message,
          stack: error.stack
        });
        batch.forEach(category => this.handleLoadingError(category, error));
      }
    }
  }
  
  /**
   * Load a single category with error handling and performance tracking
   */
  async loadCategory(category) {
    if (this.loadedCategories.has(category)) {
      this.moduleLogger.warn(`${category} already loaded`);
      return;
    }
    
    if (this.loadingPromises.has(category)) {
      this.moduleLogger.warn(`${category} already loading`);
      return this.loadingPromises.get(category);
    }
    
    const url = this.loadingConfig.urls[category];
    if (!url) {
      throw new Error(`DataLoadingOrchestrator: No URL configured for category ${category}`);
    }
    
    this.moduleLogger.debug(`Loading ${category} from ${url}`, {
      operation: 'loadCategory',
      category,
      url,
      priority: this.loadingConfig.priorities[category]
    });
    
    // Start StructuredLogger performance tracking
    const timer = this.moduleLogger.time('category-load');
    
    // Create loading promise
    const loadingPromise = this.executeCategoryLoad(category, url);
    this.loadingPromises.set(category, loadingPromise);
    
    try {
      const result = await loadingPromise;
      
      // End timer with success metrics
      timer.end({
        success: true,
        category,
        priority: this.loadingConfig.priorities[category],
        url
      });
      
      this.loadedCategories.add(category);
      this.loadingPromises.delete(category);
      
      // Emit success event
      globalEventBus.emit('dataOrchestrator:categoryLoaded', { 
        category, 
        duration: timer.duration, 
        orchestrator: this 
      });
      
      this.moduleLogger.info(`${category} loaded successfully`, { 
        operation: 'loadCategory',
        category,
        priority: this.loadingConfig.priorities[category],
        duration: `${timer.duration.toFixed(2)}ms`,
        url
      });
      return result;
      
    } catch (error) {
      // End timer with failure metrics
      timer.end({
        success: false,
        category,
        priority: this.loadingConfig.priorities[category],
        error: error.message,
        url
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
        this.moduleLogger.warn(`Primary URL failed for ${category}, trying fallback`, { 
          operation: 'executeCategoryLoad',
          category,
          primaryUrl: url,
          fallbackUrl,
          error: error.message
        });
        return await this.polygonLoader.loadCategory(category, fallbackUrl);
      }
      throw error;
    }
  }
  
  /**
   * Handle loading errors with recovery strategies
   */
  handleLoadingError(category, error) {
    this.moduleLogger.error(`Error loading ${category}`, { 
      category,
      error: error.message,
      stack: error.stack 
    });
    
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
      this.moduleLogger.info(`Retrying high-priority ${category}`, {
        operation: 'handleLoadingError',
        category,
        priority,
        retryDelay: '1000ms',
        retryCount: this.errorRecovery.get(category)?.retryCount || 0
      });
      setTimeout(() => this.retryFailedLoad(category), 1000);
    } else if (priority === 'medium') {
      // Medium priority: retry with delay
      this.moduleLogger.info(`Retrying medium-priority ${category} in 5s`, {
        operation: 'handleLoadingError',
        category,
        priority,
        retryDelay: '5000ms',
        retryCount: this.errorRecovery.get(category)?.retryCount || 0
      });
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
      this.moduleLogger.error(`Max retries exceeded for ${category}`, { 
        operation: 'retryFailedLoad',
        category,
        retryCount: errorInfo.retryCount,
        maxRetries,
        priority: this.loadingConfig.priorities[category]
      });
      return;
    }
    
    this.moduleLogger.info(`Retry ${errorInfo.retryCount}/${maxRetries} for ${category}`, {
      operation: 'retryFailedLoad',
      category,
      retryCount: errorInfo.retryCount,
      maxRetries,
      priority: this.loadingConfig.priorities[category]
    });
    
    try {
      await this.loadCategory(category);
    } catch (error) {
      this.moduleLogger.error(`Retry failed for ${category}`, { 
        operation: 'retryFailedLoad',
        category,
        retryCount: errorInfo.retryCount,
        maxRetries,
        priority: this.loadingConfig.priorities[category],
        error: error.message,
        stack: error.stack 
      });
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
    
    this.moduleLogger.info('Data management setup complete');
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
    this.moduleLogger.info('Starting legacy preloading sequence...');
    
    // Show loading spinner
    this.showLoadingSpinner();
    
    // Define preload order (matching legacy preloader.js)
    const preloadOrder = [
      { name: 'SES Areas', category: 'ses', url: this.loadingConfig.urls.ses },
      { name: 'SES Facilities', category: 'sesFacilities', loader: () => window.loadSesFacilities() },
      { name: 'SES Units', category: 'sesUnits', loader: () => window.loadSesUnits() },
      { name: 'LGA Areas', category: 'lga', url: this.loadingConfig.urls.lga },
      { name: 'CFA Areas', category: 'cfa', url: this.loadingConfig.urls.cfa },
      { name: 'CFA Facilities', category: 'cfaFacilities', loader: () => window.loadCfaFacilities() },
      { name: 'Ambulance Stations', category: 'ambulance', url: this.loadingConfig.urls.ambulance },
      { name: 'FRV Boundaries', category: 'frv', url: this.loadingConfig.urls.frv }
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
        
        this.moduleLogger.info(`${name} loaded successfully`);
        
        // Small delay between items (matching legacy behavior)
        if (i < preloadOrder.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        this.moduleLogger.error(`Failed to load ${name}`, { 
          name,
          category,
          error: error.message,
          stack: error.stack 
        });
        // Continue with next item even if one fails
      }
    }
    
    // Hide loading spinner
    this.hideLoadingSpinner();
    
    this.moduleLogger.info('Legacy preloading sequence complete');
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
// Legacy function stub - use DI container instead
export const dataLoadingOrchestrator = () => {
  throw new Error('Legacy function not available. Use DI container to get DataLoadingOrchestrator instance.');
};

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details

