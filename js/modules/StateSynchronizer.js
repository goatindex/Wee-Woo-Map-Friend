/**
 * @module modules/StateSynchronizer
 * State synchronization system for ensuring UI consistency with loaded data
 * Provides robust state management between data loading and UI components
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class StateSynchronizer
 * Synchronizes state between loaded data and UI components
 */
export class StateSynchronizer {
  constructor() {
    this.initialized = false;
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncHistory = [];
    this.lastSyncTime = null;
    
    // Sync configuration
    this.syncConfig = {
      debounceDelay: 100, // ms
      maxSyncHistory: 50,
      retryAttempts: 3,
      retryDelay: 1000 // ms
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.syncCheckboxStates = this.syncCheckboxStates.bind(this);
    this.syncActiveList = this.syncActiveList.bind(this);
    this.syncToggleAllStates = this.syncToggleAllStates.bind(this);
    this.updateCategoryCheckboxes = this.updateCategoryCheckboxes.bind(this);
    this.handleSyncError = this.handleSyncError.bind(this);
    this.retrySync = this.retrySync.bind(this);
    this.getSyncStatus = this.getSyncStatus.bind(this);
    
    console.log('🔄 StateSynchronizer: State synchronization system initialized');
  }
  
  /**
   * Initialize the state synchronizer
   */
  async init() {
    if (this.initialized) {
      console.warn('StateSynchronizer: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 StateSynchronizer: Starting initialization...');
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up periodic sync
      this.setupPeriodicSync();
      
      this.initialized = true;
      console.log('✅ StateSynchronizer: Initialization complete');
      
      // Emit ready event
      globalEventBus.emit('stateSynchronizer:ready', { synchronizer: this });
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners for state changes
   */
  setupEventListeners() {
    // Listen for data loading events
    globalEventBus.on('dataOrchestrator:categoryLoaded', ({ category }) => {
      this.queueSync('categoryLoaded', { category });
    });
    
    globalEventBus.on('dataOrchestrator:categoryError', ({ category }) => {
      this.queueSync('categoryError', { category });
    });
    
    // Listen for state changes
    globalEventBus.on('state:featureLayersChanged', () => {
      this.queueSync('featureLayersChanged');
    });
    
    globalEventBus.on('state:namesByCategoryChanged', () => {
      this.queueSync('namesByCategoryChanged');
    });
    
    // Listen for UI events
    globalEventBus.on('ui:checkboxChanged', ({ category, key, checked }) => {
      this.queueSync('checkboxChanged', { category, key, checked });
    });
    
    globalEventBus.on('ui:toggleAllChanged', ({ category, checked }) => {
      this.queueSync('toggleAllChanged', { category, checked });
    });
    
    console.log('✅ StateSynchronizer: Event listeners setup complete');
  }
  
  /**
   * Set up periodic synchronization
   */
  setupPeriodicSync() {
    // Periodic sync every 5 seconds to catch any missed updates
    setInterval(() => {
      this.queueSync('periodic');
    }, 5000);
    
    console.log('✅ StateSynchronizer: Periodic sync setup complete');
  }
  
  /**
   * Queue a synchronization operation
   */
  queueSync(trigger, data = {}) {
    const syncOperation = {
      id: Date.now() + Math.random(),
      trigger,
      data,
      timestamp: Date.now(),
      attempts: 0
    };
    
    this.syncQueue.push(syncOperation);
    
    // Debounce sync operations
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.processSyncQueue();
    }, this.syncConfig.debounceDelay);
    
    console.log(`🔄 StateSynchronizer: Queued sync operation (${trigger})`);
  }
  
  /**
   * Process the synchronization queue
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    console.log(`🔄 StateSynchronizer: Processing ${this.syncQueue.length} sync operations`);
    
    try {
      // Process all queued operations
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift();
        await this.executeSyncOperation(operation);
      }
      
      this.lastSyncTime = Date.now();
      console.log('✅ StateSynchronizer: Sync queue processing complete');
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Sync queue processing failed:', error);
      this.handleSyncError(error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Execute a single synchronization operation
   */
  async executeSyncOperation(operation) {
    try {
      console.log(`🔄 StateSynchronizer: Executing sync (${operation.trigger})`);
      
      switch (operation.trigger) {
        case 'categoryLoaded':
        case 'categoryError':
        case 'featureLayersChanged':
        case 'namesByCategoryChanged':
          await this.syncCheckboxStates();
          await this.syncToggleAllStates();
          break;
          
        case 'checkboxChanged':
          await this.syncActiveList();
          break;
          
        case 'toggleAllChanged':
          await this.syncCategoryFromToggleAll(operation.data.category, operation.data.checked);
          break;
          
        case 'periodic':
          await this.syncCheckboxStates();
          await this.syncToggleAllStates();
          await this.syncActiveList();
          break;
          
        default:
          console.warn(`StateSynchronizer: Unknown sync trigger: ${operation.trigger}`);
      }
      
      // Record successful sync
      this.recordSyncHistory(operation, true);
      
    } catch (error) {
      console.error(`🚨 StateSynchronizer: Sync operation failed (${operation.trigger}):`, error);
      this.recordSyncHistory(operation, false, error);
      
      // Retry if not exceeded max attempts
      if (operation.attempts < this.syncConfig.retryAttempts) {
        operation.attempts++;
        this.syncQueue.push(operation);
        console.log(`🔄 StateSynchronizer: Retrying sync operation (${operation.trigger})`);
      }
    }
  }
  
  /**
   * Synchronize checkbox states with loaded data
   */
  async syncCheckboxStates() {
    console.log('🔄 StateSynchronizer: Synchronizing checkbox states...');
    
    try {
      // Get current state
      const featureLayers = stateManager.get('featureLayers', {});
      const namesByCategory = stateManager.get('namesByCategory', {});
      const categoryMeta = configurationManager.get('categoryMeta', {});
      
      // Sync each category
      Object.keys(featureLayers).forEach(category => {
        this.updateCategoryCheckboxes(category, featureLayers[category], namesByCategory[category], categoryMeta[category]);
      });
      
      console.log('✅ StateSynchronizer: Checkbox states synchronized');
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Checkbox sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Update checkboxes for a specific category
   */
  updateCategoryCheckboxes(category, layers, names, meta) {
    if (!meta) return;
    
    console.log(`🔄 StateSynchronizer: Updating ${category} checkboxes (${Object.keys(layers).length} items)`);
    
    // Update individual checkboxes
    Object.keys(layers).forEach(key => {
      const checkbox = document.getElementById(`${category}_${key}`);
      if (checkbox) {
        // Data is loaded, so checkbox should be checked
        if (!checkbox.checked) {
          checkbox.checked = true;
          console.log(`✅ StateSynchronizer: Checked ${category}_${key}`);
        }
      } else {
        console.warn(`⚠️ StateSynchronizer: Checkbox not found: ${category}_${key}`);
      }
    });
    
    // Update "Show All" checkbox
    const toggleAll = document.getElementById(meta.toggleAllId);
    if (toggleAll) {
      const hasLoadedData = Object.keys(layers).length > 0;
      if (toggleAll.checked !== hasLoadedData) {
        toggleAll.checked = hasLoadedData;
        console.log(`✅ StateSynchronizer: Updated ${category} toggle all: ${hasLoadedData}`);
      }
    } else {
      console.warn(`⚠️ StateSynchronizer: Toggle all not found: ${meta.toggleAllId}`);
    }
  }
  
  /**
   * Synchronize toggle all states
   */
  async syncToggleAllStates() {
    console.log('🔄 StateSynchronizer: Synchronizing toggle all states...');
    
    try {
      const featureLayers = stateManager.get('featureLayers', {});
      const categoryMeta = configurationManager.get('categoryMeta', {});
      
      Object.keys(featureLayers).forEach(category => {
        const meta = categoryMeta[category];
        if (!meta) return;
        
        const toggleAll = document.getElementById(meta.toggleAllId);
        if (toggleAll) {
          const hasLoadedData = Object.keys(featureLayers[category]).length > 0;
          if (toggleAll.checked !== hasLoadedData) {
            toggleAll.checked = hasLoadedData;
            console.log(`✅ StateSynchronizer: Synced ${category} toggle all: ${hasLoadedData}`);
          }
        }
      });
      
      console.log('✅ StateSynchronizer: Toggle all states synchronized');
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Toggle all sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Synchronize active list with current state
   */
  async syncActiveList() {
    console.log('🔄 StateSynchronizer: Synchronizing active list...');
    
    try {
      // Emit event to trigger active list update
      globalEventBus.emit('stateSynchronizer:updateActiveList');
      
      console.log('✅ StateSynchronizer: Active list sync triggered');
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Active list sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Synchronize category from toggle all change
   */
  async syncCategoryFromToggleAll(category, checked) {
    console.log(`🔄 StateSynchronizer: Syncing category ${category} from toggle all (${checked})`);
    
    try {
      const featureLayers = stateManager.get('featureLayers', {});
      const categoryLayers = featureLayers[category] || {};
      
      // Update all individual checkboxes in the category
      Object.keys(categoryLayers).forEach(key => {
        const checkbox = document.getElementById(`${category}_${key}`);
        if (checkbox && checkbox.checked !== checked) {
          checkbox.checked = checked;
          console.log(`✅ StateSynchronizer: Updated ${category}_${key}: ${checked}`);
        }
      });
      
      console.log(`✅ StateSynchronizer: Category ${category} synchronized from toggle all`);
      
    } catch (error) {
      console.error(`🚨 StateSynchronizer: Category sync failed for ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Handle synchronization errors
   */
  handleSyncError(error) {
    console.error('🚨 StateSynchronizer: Sync error:', error);
    
    // Emit error event
    globalEventBus.emit('stateSynchronizer:error', { error, synchronizer: this });
    
    // Schedule retry
    setTimeout(() => {
      this.retrySync();
    }, this.syncConfig.retryDelay);
  }
  
  /**
   * Retry failed synchronization
   */
  async retrySync() {
    console.log('🔄 StateSynchronizer: Retrying synchronization...');
    
    try {
      await this.syncCheckboxStates();
      await this.syncToggleAllStates();
      await this.syncActiveList();
      
      console.log('✅ StateSynchronizer: Retry successful');
      
    } catch (error) {
      console.error('🚨 StateSynchronizer: Retry failed:', error);
    }
  }
  
  /**
   * Record sync operation in history
   */
  recordSyncHistory(operation, success, error = null) {
    const historyEntry = {
      id: operation.id,
      trigger: operation.trigger,
      timestamp: Date.now(),
      success,
      error: error?.message,
      attempts: operation.attempts
    };
    
    this.syncHistory.push(historyEntry);
    
    // Limit history size
    if (this.syncHistory.length > this.syncConfig.maxSyncHistory) {
      this.syncHistory.shift();
    }
  }
  
  /**
   * Get current synchronization status
   */
  getSyncStatus() {
    return {
      initialized: this.initialized,
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      syncHistory: this.syncHistory.slice(-10), // Last 10 operations
      totalSyncs: this.syncHistory.length,
      successfulSyncs: this.syncHistory.filter(h => h.success).length,
      failedSyncs: this.syncHistory.filter(h => !h.success).length
    };
  }
  
  /**
   * Force immediate synchronization
   */
  async forceSync() {
    console.log('🔄 StateSynchronizer: Forcing immediate synchronization...');
    
    // Clear any pending sync operations
    this.syncQueue = [];
    clearTimeout(this.syncTimeout);
    
    // Execute immediate sync
    await this.syncCheckboxStates();
    await this.syncToggleAllStates();
    await this.syncActiveList();
    
    console.log('✅ StateSynchronizer: Force sync complete');
  }
  
  /**
   * Check if synchronizer is ready
   */
  isReady() {
    return this.initialized && !this.isSyncing;
  }
}

// Export singleton instance
export const stateSynchronizer = new StateSynchronizer();

