import { injectable, inject } from 'inversify';
import { TYPES, BaseService, IDataService } from './DependencyContainer.js';
import { logger } from './StructuredLogger.js';
import { dataValidator } from './DataValidator.js';

/**
 * @typedef {Object} DataLoadOptions
 * @property {boolean} validate - Whether to validate data
 * @property {boolean} sanitize - Whether to sanitize data
 * @property {boolean} cache - Whether to use cache
 * @property {number} timeout - Request timeout in milliseconds
 * @property {Object} headers - Additional headers
 */

/**
 * @typedef {Object} DataLoadResult
 * @property {any[]} data - Loaded data
 * @property {boolean} fromCache - Whether data came from cache
 * @property {number} loadTime - Load time in milliseconds
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} DataProgress
 * @property {string} category - Data category
 * @property {number} loaded - Number of items loaded
 * @property {number} total - Total number of items
 * @property {number} percentage - Load percentage
 * @property {string} status - Current status
 */

/**
 * @class DataService
 * Comprehensive data service with cache-first loading, validation, 
 * progress tracking, and error handling.
 */
@injectable()
export class DataService extends BaseService implements IDataService {
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any[]>> = new Map();
  private subscribers: Map<string, Set<Function>> = new Map();
  private progressSubscribers: Map<string, Set<Function>> = new Map();
  private dataSchemas: Map<string, any> = new Map();
  private loadHistory: Map<string, any[]> = new Map();
  private statistics: any = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    validationErrors: 0,
    loadErrors: 0,
    averageLoadTime: 0
  };

  constructor(
    @inject(TYPES.ConfigService) private configService: any,
    @inject(TYPES.EventBus) private eventBus: any,
    @inject(TYPES.DataValidator) private validator: any
  ) {
    super();
  }

  /**
   * Initialize the data service
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await super.initialize();
    this.setupDataSchemas();
    this.setupEventHandlers();
    this.logger.info('Data service initialized');
  }

  /**
   * Load data for a specific category
   * @param {string} category - Data category
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<any[]>} Loaded data
   */
  async loadData(category: string, options: DataLoadOptions = {}): Promise<any[]> {
    const timer = this.logger.time('data-load');
    const startTime = performance.now();
    
    try {
      this.logger.info('Loading data', { category, options });
      
      // Set default options
      const loadOptions = {
        validate: true,
        sanitize: true,
        cache: true,
        timeout: 30000,
        headers: {},
        ...options
      };
      
      // Check cache first
      if (loadOptions.cache) {
        const cached = this.getCachedData(category);
        if (cached) {
          this.statistics.cacheHits++;
          this.statistics.totalLoads++;
          this.updateLoadTime(performance.now() - startTime);
          
          timer.end({ 
            category, 
            fromCache: true, 
            count: cached.length 
          });
          
          this.logger.info('Data loaded from cache', { 
            category, 
            count: cached.length 
          });
          
          return cached;
        }
      }
      
      this.statistics.cacheMisses++;
      
      // Check if already loading
      const existingPromise = this.loadingPromises.get(category);
      if (existingPromise) {
        this.logger.debug('Data loading already in progress', { category });
        return existingPromise;
      }
      
      // Load data from source
      const promise = this.loadDataFromSource(category, loadOptions);
      this.loadingPromises.set(category, promise);
      
      try {
        const data = await promise;
        
        // Validate data if requested
        if (loadOptions.validate) {
          const validationResult = await this.validateData(category, data);
          if (!validationResult.valid) {
            this.statistics.validationErrors++;
            this.logger.warn('Data validation failed', { 
              category, 
              errors: validationResult.errors 
            });
            
            // Emit validation failure event
            this.eventBus.emit('data.validation.failed', {
              category,
              errors: validationResult.errors,
              warnings: validationResult.warnings
            });
            
            // Continue with invalid data if it's not critical
            if (validationResult.errors.length > 0) {
              this.logger.warn('Using invalid data due to non-critical validation errors');
            }
          }
        }
        
        // Sanitize data if requested
        if (loadOptions.sanitize) {
          data.forEach((item, index) => {
            data[index] = this.validator.sanitizeData(item, {
              maxLength: this.configService.get('data.maxStringLength', 1000)
            });
          });
        }
        
        // Cache data
        if (loadOptions.cache) {
          this.cache.set(category, data);
        }
        
        // Update statistics
        this.statistics.totalLoads++;
        this.updateLoadTime(performance.now() - startTime);
        
        // Store in history
        this.loadHistory.set(category, data);
        
        // Notify subscribers
        this.notifySubscribers(category, data);
        
        // Emit load complete event
        this.eventBus.emit('data.loaded', {
          category,
          count: data.length,
          fromCache: false,
          loadTime: performance.now() - startTime
        });
        
        timer.end({ 
          category, 
          fromCache: false, 
          count: data.length,
          loadTime: performance.now() - startTime
        });
        
        this.logger.info('Data loaded successfully', { 
          category, 
          count: data.length,
          loadTime: performance.now() - startTime
        });
        
        return data;
        
      } finally {
        this.loadingPromises.delete(category);
      }
      
    } catch (error) {
      this.statistics.loadErrors++;
      this.loadingPromises.delete(category);
      
      timer.end({ 
        category, 
        error: error.message, 
        success: false 
      });
      
      this.logger.error('Data loading failed', { 
        category, 
        error: error.message,
        stack: error.stack
      });
      
      // Emit load error event
      this.eventBus.emit('data.load.error', {
        category,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw new Error(`Failed to load data for category '${category}': ${error.message}`);
    }
  }

  /**
   * Load multiple data categories in batch
   * @param {string[]} categories - Categories to load
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<Map<string, any[]>>} Loaded data by category
   */
  async loadDataBatch(categories: string[], options: DataLoadOptions = {}): Promise<Map<string, any[]>> {
    const timer = this.logger.time('data-batch-load');
    const startTime = performance.now();
    
    try {
      this.logger.info('Loading data batch', { 
        categories, 
        count: categories.length 
      });
      
      const results = new Map();
      const promises = categories.map(async (category) => {
        try {
          const data = await this.loadData(category, options);
          results.set(category, data);
        } catch (error) {
          this.logger.error('Batch load failed for category', { 
            category, 
            error: error.message 
          });
          results.set(category, []);
        }
      });
      
      await Promise.all(promises);
      
      timer.end({ 
        categories, 
        successCount: results.size,
        totalTime: performance.now() - startTime
      });
      
      this.logger.info('Data batch loaded', { 
        categories, 
        successCount: results.size,
        totalTime: performance.now() - startTime
      });
      
      return results;
      
    } catch (error) {
      timer.end({ 
        categories, 
        error: error.message, 
        success: false 
      });
      
      this.logger.error('Data batch loading failed', { 
        categories, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Get cached data for a category
   * @param {string} category - Data category
   * @returns {any[] | null} Cached data or null
   */
  getCachedData(category: string): any[] | null {
    const cached = this.cache.get(category);
    if (cached) {
      this.logger.debug('Cache hit', { category, count: cached.length });
    } else {
      this.logger.debug('Cache miss', { category });
    }
    return cached || null;
  }

  /**
   * Invalidate cache for a category
   * @param {string} category - Data category
   */
  invalidateCache(category: string): void {
    this.cache.delete(category);
    this.loadHistory.delete(category);
    this.logger.info('Cache invalidated', { category });
    
    // Emit cache invalidation event
    this.eventBus.emit('data.cache.invalidated', { category });
  }

  /**
   * Invalidate all caches
   */
  invalidateAllCaches(): void {
    this.cache.clear();
    this.loadHistory.clear();
    this.logger.info('All caches invalidated');
    
    // Emit cache invalidation event
    this.eventBus.emit('data.cache.invalidated.all');
  }

  /**
   * Subscribe to data updates for a category
   * @param {string} category - Data category
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToDataUpdates(category: string, callback: Function): Function {
    if (!this.subscribers.has(category)) {
      this.subscribers.set(category, new Set());
    }
    
    this.subscribers.get(category)!.add(callback);
    
    this.logger.debug('Subscribed to data updates', { category });
    
    return () => {
      const categorySubscribers = this.subscribers.get(category);
      if (categorySubscribers) {
        categorySubscribers.delete(callback);
        this.logger.debug('Unsubscribed from data updates', { category });
      }
    };
  }

  /**
   * Subscribe to data loading progress
   * @param {string} category - Data category
   * @param {Function} callback - Progress callback
   * @returns {Function} Unsubscribe function
   */
  subscribeToProgress(category: string, callback: Function): Function {
    if (!this.progressSubscribers.has(category)) {
      this.progressSubscribers.set(category, new Set());
    }
    
    this.progressSubscribers.get(category)!.add(callback);
    
    this.logger.debug('Subscribed to progress updates', { category });
    
    return () => {
      const categorySubscribers = this.progressSubscribers.get(category);
      if (categorySubscribers) {
        categorySubscribers.delete(callback);
        this.logger.debug('Unsubscribed from progress updates', { category });
      }
    };
  }

  /**
   * Get data loading statistics
   * @returns {Object} Statistics
   */
  getStatistics(): any {
    return { ...this.statistics };
  }

  /**
   * Get data load history for a category
   * @param {string} category - Data category
   * @returns {any[] | null} Load history or null
   */
  getLoadHistory(category: string): any[] | null {
    return this.loadHistory.get(category) || null;
  }

  /**
   * Register a data schema for validation
   * @param {string} category - Data category
   * @param {Object} schema - Validation schema
   */
  registerDataSchema(category: string, schema: any): void {
    this.dataSchemas.set(category, schema);
    this.logger.debug('Data schema registered', { category });
  }

  /**
   * Load data from source (API, file, etc.)
   * @private
   * @param {string} category - Data category
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<any[]>} Loaded data
   */
  private async loadDataFromSource(category: string, options: DataLoadOptions): Promise<any[]> {
    this.logger.info('Loading data from source', { category, options });
    
    // Emit progress start
    this.emitProgress(category, {
      category,
      loaded: 0,
      total: 0,
      percentage: 0,
      status: 'starting'
    });
    
    try {
      // Determine data source based on category
      const dataSource = this.getDataSource(category);
      
      let data;
      switch (dataSource.type) {
        case 'api':
          data = await this.loadFromAPI(dataSource.url, options);
          break;
        case 'file':
          data = await this.loadFromFile(dataSource.path, options);
          break;
        case 'mock':
          data = await this.loadFromMock(category, options);
          break;
        default:
          throw new Error(`Unknown data source type: ${dataSource.type}`);
      }
      
      // Emit progress complete
      this.emitProgress(category, {
        category,
        loaded: data.length,
        total: data.length,
        percentage: 100,
        status: 'complete'
      });
      
      return data;
      
    } catch (error) {
      // Emit progress error
      this.emitProgress(category, {
        category,
        loaded: 0,
        total: 0,
        percentage: 0,
        status: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Get data source configuration for a category
   * @private
   * @param {string} category - Data category
   * @returns {Object} Data source configuration
   */
  private getDataSource(category: string): any {
    const baseUrl = this.configService.get('api.baseUrl', '');
    const dataPath = this.configService.get('data.geojsonPath', '/geojson');
    
    const dataSources = {
      'ses': {
        type: 'file',
        path: `${dataPath}/ses.geojson`
      },
      'lga': {
        type: 'file',
        path: `${dataPath}/lga.geojson`
      },
      'cfa': {
        type: 'file',
        path: `${dataPath}/cfa.geojson`
      },
      'ambulance': {
        type: 'file',
        path: `${dataPath}/ambulance.geojson`
      }
    };
    
    return dataSources[category] || {
      type: 'mock',
      category
    };
  }

  /**
   * Load data from API
   * @private
   * @param {string} url - API URL
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<any[]>} Loaded data
   */
  private async loadFromAPI(url: string, options: DataLoadOptions): Promise<any[]> {
    this.logger.debug('Loading from API', { url, options });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Load data from file
   * @private
   * @param {string} path - File path
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<any[]>} Loaded data
   */
  private async loadFromFile(path: string, options: DataLoadOptions): Promise<any[]> {
    this.logger.debug('Loading from file', { path, options });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    try {
      const response = await fetch(path, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle GeoJSON FeatureCollection
      if (data.type === 'FeatureCollection' && data.features) {
        return data.features;
      }
      
      return Array.isArray(data) ? data : [data];
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Load mock data for testing/development
   * @private
   * @param {string} category - Data category
   * @param {DataLoadOptions} options - Load options
   * @returns {Promise<any[]>} Mock data
   */
  private async loadFromMock(category: string, options: DataLoadOptions): Promise<any[]> {
    this.logger.debug('Loading mock data', { category, options });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockData = {
      'ses': [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [144.9631, -37.8136] },
          properties: { name: 'SES Unit 1', type: 'emergency' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [145.0000, -37.8000] },
          properties: { name: 'SES Unit 2', type: 'emergency' }
        }
      ],
      'lga': [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[[144.9, -37.8], [145.0, -37.8], [145.0, -37.7], [144.9, -37.7], [144.9, -37.8]]] },
          properties: { name: 'Local Government Area 1', type: 'boundary' }
        }
      ],
      'cfa': [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [144.9500, -37.8500] },
          properties: { name: 'CFA Station 1', type: 'fire' }
        }
      ],
      'ambulance': [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [144.9800, -37.8200] },
          properties: { name: 'Ambulance Station 1', type: 'medical' }
        }
      ]
    };
    
    return mockData[category] || [];
  }

  /**
   * Validate data using the validator
   * @private
   * @param {string} category - Data category
   * @param {any[]} data - Data to validate
   * @returns {Promise<Object>} Validation result
   */
  private async validateData(category: string, data: any[]): Promise<any> {
    this.logger.debug('Validating data', { category, count: data.length });
    
    // Check if we have a schema for this category
    const schema = this.dataSchemas.get(category);
    if (schema) {
      return await this.validator.validateSchema(data, schema.name);
    }
    
    // Default to GeoJSON validation
    const geojson = {
      type: 'FeatureCollection',
      features: data
    };
    
    return await this.validator.validateGeoJSON(geojson);
  }

  /**
   * Notify subscribers of data updates
   * @private
   * @param {string} category - Data category
   * @param {any[]} data - Updated data
   */
  private notifySubscribers(category: string, data: any[]): void {
    const categorySubscribers = this.subscribers.get(category);
    if (categorySubscribers) {
      categorySubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error('Subscriber callback error', { 
            category, 
            error: error.message 
          });
        }
      });
    }
  }

  /**
   * Emit progress update
   * @private
   * @param {string} category - Data category
   * @param {DataProgress} progress - Progress information
   */
  private emitProgress(category: string, progress: DataProgress): void {
    const categorySubscribers = this.progressSubscribers.get(category);
    if (categorySubscribers) {
      categorySubscribers.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          this.logger.error('Progress callback error', { 
            category, 
            error: error.message 
          });
        }
      });
    }
    
    // Emit global progress event
    this.eventBus.emit('data.progress', {
      category,
      progress
    });
  }

  /**
   * Update load time statistics
   * @private
   * @param {number} loadTime - Load time in milliseconds
   */
  private updateLoadTime(loadTime: number): void {
    this.statistics.averageLoadTime = 
      (this.statistics.averageLoadTime * (this.statistics.totalLoads - 1) + loadTime) / 
      this.statistics.totalLoads;
  }

  /**
   * Setup data schemas for validation
   * @private
   */
  private setupDataSchemas(): void {
    // Register GeoJSON schema for all categories
    this.validator.registerSchema('geojson', {
      rules: new Map([
        ['required', {
          name: 'required',
          validator: (value) => ({ valid: value !== null && value !== undefined }),
          message: 'Value is required',
          level: 'error'
        }],
        ['array', {
          name: 'array',
          validator: (value) => ({ valid: Array.isArray(value) }),
          message: 'Value must be an array',
          level: 'error'
        }]
      ])
    });
    
    // Register schemas for specific categories
    this.registerDataSchema('ses', 'geojson');
    this.registerDataSchema('lga', 'geojson');
    this.registerDataSchema('cfa', 'geojson');
    this.registerDataSchema('ambulance', 'geojson');
  }

  /**
   * Setup event handlers
   * @private
   */
  private setupEventHandlers(): void {
    // Listen for data validation requests
    this.eventBus.on('data.validation.request', (event) => {
      this.handleValidationRequest(event.payload);
    });
    
    // Listen for cache invalidation requests
    this.eventBus.on('data.cache.invalidate', (event) => {
      const { category } = event.payload;
      if (category) {
        this.invalidateCache(category);
      } else {
        this.invalidateAllCaches();
      }
    });
  }

  /**
   * Handle validation request events
   * @private
   * @param {Object} payload - Event payload
   */
  private async handleValidationRequest(payload: any): Promise<void> {
    try {
      const { category, data, options } = payload;
      
      if (!category || !data) {
        this.logger.warn('Invalid validation request', { payload });
        return;
      }
      
      const result = await this.validateData(category, data);
      
      // Emit validation result
      this.eventBus.emit('data.validation.result', {
        requestId: payload.requestId,
        category,
        result
      });
      
    } catch (error) {
      this.logger.error('Validation request handling failed', { 
        error: error.message,
        payload 
      });
    }
  }

  /**
   * Cleanup the service
   * @returns {Promise<void>}
   */
  async cleanup(): Promise<void> {
    this.cache.clear();
    this.loadingPromises.clear();
    this.subscribers.clear();
    this.progressSubscribers.clear();
    this.dataSchemas.clear();
    this.loadHistory.clear();
    
    await super.cleanup();
    this.logger.info('Data service cleaned up');
  }
}
