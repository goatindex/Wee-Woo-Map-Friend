import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';
import { logger } from './StructuredLogger.js';

/**
 * @typedef {Object} LoadingPriority
 * @property {string} critical - Critical data that must load first
 * @property {string} important - Important data that loads after critical
 * @property {string} secondary - Secondary data that loads in background
 * @property {string} onDemand - Data that loads only when requested
 */

/**
 * @typedef {Object} LoadingStrategy
 * @property {string} name - Strategy name
 * @property {Function} shouldLoad - Function to determine if data should load
 * @property {Function} getPriority - Function to get loading priority
 * @property {Object} options - Strategy-specific options
 */

/**
 * @typedef {Object} LoadingProgress
 * @property {string} phase - Current loading phase
 * @property {number} completed - Number of completed loads
 * @property {number} total - Total number of loads
 * @property {number} percentage - Completion percentage
 * @property {Object} details - Phase-specific details
 */

/**
 * @class ProgressiveDataLoader
 * Implements progressive data loading with priority-based loading,
 * background loading, and on-demand loading strategies.
 */
@injectable()
export class ProgressiveDataLoader extends BaseService {
  private loadingPhases: Map<string, string[]> = new Map();
  private loadingStrategies: Map<string, LoadingStrategy> = new Map();
  private loadingQueue: Map<string, any> = new Map();
  private loadingProgress: Map<string, LoadingProgress> = new Map();
  private subscribers: Map<string, Set<Function>> = new Map();
  private loadingState: Map<string, string> = new Map();
  private statistics: any = {
    totalLoads: 0,
    criticalLoads: 0,
    backgroundLoads: 0,
    onDemandLoads: 0,
    averageLoadTime: 0,
    loadFailures: 0
  };

  constructor(
    // @inject(TYPES.DataService) private dataService: any, // Archived - not currently used
    @inject(TYPES.ConfigService) private configService: any,
    @inject(TYPES.EventBus) private eventBus: any
  ) {
    super();
  }

  /**
   * Initialize the progressive data loader
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await super.initialize();
    this.setupLoadingPhases();
    this.setupLoadingStrategies();
    this.setupEventHandlers();
    this.logger.info('Progressive data loader initialized');
  }

  /**
   * Start progressive data loading
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  async startProgressiveLoading(options: any = {}): Promise<void> {
    const timer = this.logger.time('progressive-loading');
    const startTime = performance.now();
    
    try {
      this.logger.info('Starting progressive data loading', { options });
      
      // Emit loading started event
      this.eventBus.emit('data.loading.started', {
        timestamp: Date.now(),
        options
      });
      
      // Load critical data first
      await this.loadCriticalData(options);
      
      // Load important data
      await this.loadImportantData(options);
      
      // Start background loading for secondary data
      this.startBackgroundLoading(options);
      
      // Update statistics
      this.updateStatistics(performance.now() - startTime);
      
      timer.end({ 
        totalTime: performance.now() - startTime,
        criticalLoaded: this.loadingState.get('critical') === 'completed',
        importantLoaded: this.loadingState.get('important') === 'completed'
      });
      
      this.logger.info('Progressive data loading completed', {
        totalTime: performance.now() - startTime
      });
      
    } catch (error) {
      timer.end({ 
        error: error.message, 
        success: false 
      });
      
      this.logger.error('Progressive data loading failed', { 
        error: error.message,
        stack: error.stack
      });
      
      // Emit loading error event
      this.eventBus.emit('data.loading.error', {
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Load data on demand
   * @param {string} category - Data category
   * @param {Object} options - Loading options
   * @returns {Promise<any[]>} Loaded data
   */
  async loadOnDemand(category: string, options: any = {}): Promise<any[]> {
    const timer = this.logger.time('on-demand-load');
    const startTime = performance.now();
    
    try {
      this.logger.info('Loading data on demand', { category, options });
      
      // Check if data is already loaded
      // const cached = this.dataService.getCachedData(category); // Archived - DataService not available
      // if (cached) {
      //   this.logger.debug('On-demand data already cached', { category });
      //   return cached;
      // }
      
      // Load data
      // const data = await // this.dataService // Archived - DataService not available.loadData(category, { // Archived - DataService not available
      //   validate: true,
      //   sanitize: true,
      //   cache: true,
      //   ...options
      // });
      
      // TODO: Implement direct data loading or use existing loaders
      this.logger.warn('ProgressiveDataLoader: DataService archived, using fallback', { category });
      const data = []; // Placeholder - implement actual data loading
      
      // Update statistics
      this.statistics.onDemandLoads++;
      this.statistics.totalLoads++;
      this.updateLoadTime(performance.now() - startTime);
      
      // Emit on-demand load event
      this.eventBus.emit('data.loaded.onDemand', {
        category,
        count: data.length,
        loadTime: performance.now() - startTime
      });
      
      timer.end({ 
        category, 
        count: data.length,
        loadTime: performance.now() - startTime
      });
      
      this.logger.info('On-demand data loaded', { 
        category, 
        count: data.length,
        loadTime: performance.now() - startTime
      });
      
      return data;
      
    } catch (error) {
      this.statistics.loadFailures++;
      
      timer.end({ 
        category, 
        error: error.message, 
        success: false 
      });
      
      this.logger.error('On-demand data loading failed', { 
        category, 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Get loading progress for a phase
   * @param {string} phase - Loading phase
   * @returns {LoadingProgress | null} Loading progress or null
   */
  getLoadingProgress(phase: string): LoadingProgress | null {
    return this.loadingProgress.get(phase) || null;
  }

  /**
   * Get overall loading progress
   * @returns {LoadingProgress} Overall loading progress
   */
  getOverallProgress(): LoadingProgress {
    const phases = Array.from(this.loadingProgress.values());
    const totalCompleted = phases.reduce((sum, phase) => sum + phase.completed, 0);
    const totalTotal = phases.reduce((sum, phase) => sum + phase.total, 0);
    
    return {
      phase: 'overall',
      completed: totalCompleted,
      total: totalTotal,
      percentage: totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 100,
      details: {
        phases: phases.length,
        completedPhases: phases.filter(p => p.percentage === 100).length
      }
    };
  }

  /**
   * Subscribe to loading progress updates
   * @param {string} phase - Loading phase (or 'all' for all phases)
   * @param {Function} callback - Progress callback
   * @returns {Function} Unsubscribe function
   */
  subscribeToProgress(phase: string, callback: Function): Function {
    if (!this.subscribers.has(phase)) {
      this.subscribers.set(phase, new Set());
    }
    
    this.subscribers.get(phase)!.add(callback);
    
    this.logger.debug('Subscribed to progress updates', { phase });
    
    return () => {
      const phaseSubscribers = this.subscribers.get(phase);
      if (phaseSubscribers) {
        phaseSubscribers.delete(callback);
        this.logger.debug('Unsubscribed from progress updates', { phase });
      }
    };
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStatistics(): any {
    return { ...this.statistics };
  }

  /**
   * Reset loading statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalLoads: 0,
      criticalLoads: 0,
      backgroundLoads: 0,
      onDemandLoads: 0,
      averageLoadTime: 0,
      loadFailures: 0
    };
    this.logger.info('Loading statistics reset');
  }

  /**
   * Load critical data first
   * @private
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  private async loadCriticalData(options: any): Promise<void> {
    this.logger.info('Loading critical data');
    
    const criticalCategories = this.loadingPhases.get('critical') || [];
    this.loadingState.set('critical', 'loading');
    
    // Initialize progress tracking
    this.loadingProgress.set('critical', {
      phase: 'critical',
      completed: 0,
      total: criticalCategories.length,
      percentage: 0,
      details: { categories: criticalCategories }
    });
    
    try {
      // Load critical data in parallel
      const promises = criticalCategories.map(async (category) => {
        try {
          // const data = await this.dataService.loadData(category, { // Archived - DataService not available
          //   validate: true,
          //   sanitize: true,
          //   cache: true,
          //   ...options
          // });
          
          // TODO: Implement direct data loading or use existing loaders
          this.logger.warn('ProgressiveDataLoader: DataService archived, using fallback', { category });
          const data = []; // Placeholder - implement actual data loading
          
          this.statistics.criticalLoads++;
          this.updatePhaseProgress('critical', 1);
          
          this.logger.debug('Critical data loaded', { 
            category, 
            count: data.length 
          });
          
          return data;
        } catch (error) {
          this.logger.error('Critical data loading failed', { 
            category, 
            error: error.message 
          });
          throw error;
        }
      });
      
      await Promise.all(promises);
      
      this.loadingState.set('critical', 'completed');
      this.loadingProgress.get('critical')!.percentage = 100;
      
      this.logger.info('Critical data loading completed');
      
      // Emit critical data loaded event
      this.eventBus.emit('data.loaded.critical', {
        categories: criticalCategories,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.loadingState.set('critical', 'failed');
      this.logger.error('Critical data loading failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Load important data after critical data
   * @private
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  private async loadImportantData(options: any): Promise<void> {
    this.logger.info('Loading important data');
    
    const importantCategories = this.loadingPhases.get('important') || [];
    this.loadingState.set('important', 'loading');
    
    // Initialize progress tracking
    this.loadingProgress.set('important', {
      phase: 'important',
      completed: 0,
      total: importantCategories.length,
      percentage: 0,
      details: { categories: importantCategories }
    });
    
    try {
      // Load important data in parallel
      const promises = importantCategories.map(async (category) => {
        try {
          // const data = await this.dataService.loadData(category, { // Archived - DataService not available
          //   validate: true,
          //   sanitize: true,
          //   cache: true,
          //   ...options
          // });
          
          // TODO: Implement direct data loading or use existing loaders
          this.logger.warn('ProgressiveDataLoader: DataService archived, using fallback', { category });
          const data = []; // Placeholder - implement actual data loading
          
          this.updatePhaseProgress('important', 1);
          
          this.logger.debug('Important data loaded', { 
            category, 
            count: data.length 
          });
          
          return data;
        } catch (error) {
          this.logger.error('Important data loading failed', { 
            category, 
            error: error.message 
          });
          // Don't throw error for important data failures
          return [];
        }
      });
      
      await Promise.all(promises);
      
      this.loadingState.set('important', 'completed');
      this.loadingProgress.get('important')!.percentage = 100;
      
      this.logger.info('Important data loading completed');
      
      // Emit important data loaded event
      this.eventBus.emit('data.loaded.important', {
        categories: importantCategories,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.loadingState.set('important', 'failed');
      this.logger.error('Important data loading failed', { error: error.message });
      // Don't throw error for important data failures
    }
  }

  /**
   * Start background loading for secondary data
   * @private
   * @param {Object} options - Loading options
   * @returns {void}
   */
  private startBackgroundLoading(options: any): void {
    this.logger.info('Starting background loading');
    
    const secondaryCategories = this.loadingPhases.get('secondary') || [];
    this.loadingState.set('secondary', 'loading');
    
    // Initialize progress tracking
    this.loadingProgress.set('secondary', {
      phase: 'secondary',
      completed: 0,
      total: secondaryCategories.length,
      percentage: 0,
      details: { categories: secondaryCategories }
    });
    
    // Load secondary data in background (don't await)
    this.loadSecondaryData(secondaryCategories, options).catch(error => {
      this.logger.error('Background loading failed', { error: error.message });
      this.loadingState.set('secondary', 'failed');
    });
  }

  /**
   * Load secondary data in background
   * @private
   * @param {string[]} categories - Categories to load
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  private async loadSecondaryData(categories: string[], options: any): Promise<void> {
    try {
      // Load secondary data with delay between loads to avoid overwhelming the system
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        
        try {
          // const data = await this.dataService.loadData(category, { // Archived - DataService not available
          //   validate: true,
          //   sanitize: true,
          //   cache: true,
          //   ...options
          // });
          
          // TODO: Implement direct data loading or use existing loaders
          this.logger.warn('ProgressiveDataLoader: DataService archived, using fallback', { category });
          const data = []; // Placeholder - implement actual data loading
          
          this.statistics.backgroundLoads++;
          this.updatePhaseProgress('secondary', 1);
          
          this.logger.debug('Secondary data loaded', { 
            category, 
            count: data.length 
          });
          
          // Small delay between loads
          if (i < categories.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          this.logger.error('Secondary data loading failed', { 
            category, 
            error: error.message 
          });
          // Continue with other categories
        }
      }
      
      this.loadingState.set('secondary', 'completed');
      this.loadingProgress.get('secondary')!.percentage = 100;
      
      this.logger.info('Background loading completed');
      
      // Emit background loading completed event
      this.eventBus.emit('data.loaded.background', {
        categories,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.loadingState.set('secondary', 'failed');
      this.logger.error('Background loading failed', { error: error.message });
    }
  }

  /**
   * Update phase progress
   * @private
   * @param {string} phase - Loading phase
   * @param {number} increment - Progress increment
   */
  private updatePhaseProgress(phase: string, increment: number): void {
    const progress = this.loadingProgress.get(phase);
    if (progress) {
      progress.completed += increment;
      progress.percentage = Math.round((progress.completed / progress.total) * 100);
      
      // Notify subscribers
      this.notifyProgressSubscribers(phase, progress);
      
      // Notify overall progress subscribers
      this.notifyProgressSubscribers('all', this.getOverallProgress());
    }
  }

  /**
   * Notify progress subscribers
   * @private
   * @param {string} phase - Loading phase
   * @param {LoadingProgress} progress - Progress information
   */
  private notifyProgressSubscribers(phase: string, progress: LoadingProgress): void {
    const phaseSubscribers = this.subscribers.get(phase);
    if (phaseSubscribers) {
      phaseSubscribers.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          this.logger.error('Progress callback error', { 
            phase, 
            error: error.message 
          });
        }
      });
    }
    
    // Emit global progress event
    this.eventBus.emit('data.loading.progress', {
      phase,
      progress
    });
  }

  /**
   * Update loading statistics
   * @private
   * @param {number} loadTime - Load time in milliseconds
   */
  private updateStatistics(loadTime: number): void {
    this.statistics.totalLoads++;
    this.statistics.averageLoadTime = 
      (this.statistics.averageLoadTime * (this.statistics.totalLoads - 1) + loadTime) / 
      this.statistics.totalLoads;
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
   * Setup loading phases
   * @private
   */
  private setupLoadingPhases(): void {
    // Critical data - must load first for basic functionality
    this.loadingPhases.set('critical', ['ses']);
    
    // Important data - loads after critical for enhanced functionality
    this.loadingPhases.set('important', ['lga', 'cfa']);
    
    // Secondary data - loads in background for additional features
    this.loadingPhases.set('secondary', ['ambulance']);
    
    // On-demand data - loads only when requested
    this.loadingPhases.set('onDemand', []);
    
    this.logger.info('Loading phases configured', {
      critical: this.loadingPhases.get('critical'),
      important: this.loadingPhases.get('important'),
      secondary: this.loadingPhases.get('secondary')
    });
  }

  /**
   * Setup loading strategies
   * @private
   */
  private setupLoadingStrategies(): void {
    // Critical data strategy
    this.loadingStrategies.set('critical', {
      name: 'critical',
      shouldLoad: () => true,
      getPriority: () => 1,
      options: { timeout: 10000, retries: 3 }
    });
    
    // Important data strategy
    this.loadingStrategies.set('important', {
      name: 'important',
      shouldLoad: () => this.loadingState.get('critical') === 'completed',
      getPriority: () => 2,
      options: { timeout: 15000, retries: 2 }
    });
    
    // Secondary data strategy
    this.loadingStrategies.set('secondary', {
      name: 'secondary',
      shouldLoad: () => this.loadingState.get('important') === 'completed',
      getPriority: () => 3,
      options: { timeout: 30000, retries: 1 }
    });
    
    // On-demand data strategy
    this.loadingStrategies.set('onDemand', {
      name: 'onDemand',
      shouldLoad: () => true,
      getPriority: () => 4,
      options: { timeout: 5000, retries: 1 }
    });
    
    this.logger.info('Loading strategies configured');
  }

  /**
   * Setup event handlers
   * @private
   */
  private setupEventHandlers(): void {
    // Listen for data loading requests
    this.eventBus.on('data.loading.request', (event) => {
      this.handleLoadingRequest(event.payload);
    });
    
    // Listen for data loading progress requests
    this.eventBus.on('data.loading.progress.request', (event) => {
      this.handleProgressRequest(event.payload);
    });
  }

  /**
   * Handle loading request events
   * @private
   * @param {Object} payload - Event payload
   */
  private async handleLoadingRequest(payload: any): Promise<void> {
    try {
      const { category, options } = payload;
      
      if (!category) {
        this.logger.warn('Invalid loading request', { payload });
        return;
      }
      
      const data = await this.loadOnDemand(category, options);
      
      // Emit loading result
      this.eventBus.emit('data.loading.result', {
        requestId: payload.requestId,
        category,
        data
      });
      
    } catch (error) {
      this.logger.error('Loading request handling failed', { 
        error: error.message,
        payload 
      });
    }
  }

  /**
   * Handle progress request events
   * @private
   * @param {Object} payload - Event payload
   */
  private handleProgressRequest(payload: any): void {
    try {
      const { phase } = payload;
      
      let progress;
      if (phase === 'all' || !phase) {
        progress = this.getOverallProgress();
      } else {
        progress = this.getLoadingProgress(phase);
      }
      
      // Emit progress result
      this.eventBus.emit('data.loading.progress.result', {
        requestId: payload.requestId,
        phase: phase || 'all',
        progress
      });
      
    } catch (error) {
      this.logger.error('Progress request handling failed', { 
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
    this.loadingPhases.clear();
    this.loadingStrategies.clear();
    this.loadingQueue.clear();
    this.loadingProgress.clear();
    this.subscribers.clear();
    this.loadingState.clear();
    
    await super.cleanup();
    this.logger.info('Progressive data loader cleaned up');
  }
}
