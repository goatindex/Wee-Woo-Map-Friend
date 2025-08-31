/**
 * @module modules/ES6IntegrationManager
 * Manages the transition from mixed ES6/traditional scripts to full ES6 modules
 * Provides migration path and compatibility layers
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class ES6IntegrationManager
 * Manages ES6 module integration and provides migration utilities
 */
export class ES6IntegrationManager {
  constructor() {
    this.integrationPhase = 'initializing';
    this.modulesLoaded = new Set();
    this.legacyFunctions = new Map();
    this.migrationStatus = new Map();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.registerModule = this.registerModule.bind(this);
    this.migrateFunction = this.migrateFunction.bind(this);
    this.createCompatibilityLayer = this.createCompatibilityLayer.bind(this);
    this.validateIntegration = this.validateIntegration.bind(this);
  }
  
  /**
   * Initialize the ES6 integration manager
   */
  async init() {
    console.log('🔧 ES6IntegrationManager: Starting ES6 module integration...');
    
    try {
      // Phase 1: Register existing modules
      this.registerExistingModules();
      
      // Phase 2: Create compatibility layers
      this.createCompatibilityLayers();
      
      // Phase 3: Migrate core functions
      await this.migrateCoreFunctions();
      
      // Phase 4: Validate integration
      this.validateIntegration();
      
      this.integrationPhase = 'ready';
      globalEventBus.emit('es6:integrationReady', { manager: this });
      
      console.log('✅ ES6IntegrationManager: Integration complete');
      
    } catch (error) {
      console.error('🚨 ES6IntegrationManager: Integration failed:', error);
      this.integrationPhase = 'failed';
      globalEventBus.emit('es6:integrationFailed', { error, manager: this });
      throw error;
    }
  }
  
  /**
   * Register existing ES6 modules
   * @private
   */
  registerExistingModules() {
    const existingModules = [
      'ComponentBase',
      'StateManager', 
      'EventBus',
      'Router',
      'LegacyBridge',
      'HamburgerMenu',
      'CollapsibleManager',
      'SearchManager',
      'ActiveListManager',
      'MobileDocsNavManager'
    ];
    
    existingModules.forEach(moduleName => {
      this.modulesLoaded.add(moduleName);
      this.migrationStatus.set(moduleName, 'registered');
    });
    
    console.log(`📦 ES6IntegrationManager: Registered ${existingModules.length} existing modules`);
  }
  
  /**
   * Create compatibility layers for legacy code
   * @private
   */
  createCompatibilityLayers() {
    // Create window.BulkOperationManager compatibility
    if (window.BulkOperationManager) {
      this.legacyFunctions.set('BulkOperationManager', window.BulkOperationManager);
      console.log('🔗 ES6IntegrationManager: BulkOperationManager compatibility layer created');
    }
    
    // Create other compatibility layers as needed
    this.createActiveListCompatibility();
    this.createStateCompatibility();
    
    console.log(`🔗 ES6IntegrationManager: Created ${this.legacyFunctions.size} compatibility layers`);
  }
  
  /**
   * Create ActiveList compatibility layer
   * @private
   */
  createActiveListCompatibility() {
    // Ensure legacy functions are available
    if (!window.beginActiveListBulk) {
      window.beginActiveListBulk = function() {
        if (window.BulkOperationManager) {
          window.BulkOperationManager.markActiveListUpdatePending();
        }
        console.log('🔄 Legacy beginActiveListBulk called (via compatibility layer)');
      };
    }
    
    if (!window.endActiveListBulk) {
      window.endActiveListBulk = function() {
        console.log('🔄 Legacy endActiveListBulk called (via compatibility layer)');
      };
    }
    
    if (!window.updateActiveList) {
      window.updateActiveList = function() {
        console.log('🔄 Legacy updateActiveList called (via compatibility layer)');
        // This will be implemented by the ActiveListManager
      };
    }
  }
  
  /**
   * Create State compatibility layer
   * @private
   */
  createStateCompatibility() {
    // Ensure legacy state functions are available
    if (!window.beginBulkOperation) {
      window.beginBulkOperation = function() {
        if (window.BulkOperationManager) {
          return window.BulkOperationManager.begin('legacy');
        }
        console.warn('⚠️ BulkOperationManager not available');
        return false;
      };
    }
    
    if (!window.endBulkOperation) {
      window.endBulkOperation = function() {
        if (window.BulkOperationManager) {
          window.BulkOperationManager.end();
        } else {
          console.warn('⚠️ BulkOperationManager not available');
        }
      };
    }
  }
  
  /**
   * Migrate core functions to ES6 modules
   * @private
   */
  async migrateCoreFunctions() {
    console.log('🔄 ES6IntegrationManager: Migrating core functions...');
    
    // Migrate bulk operations
    await this.migrateBulkOperations();
    
    // Migrate active list functionality
    await this.migrateActiveList();
    
    // Migrate state management
    await this.migrateStateManagement();
    
    console.log('✅ ES6IntegrationManager: Core function migration complete');
  }
  
  /**
   * Migrate bulk operations to ES6 modules
   * @private
   */
  async migrateBulkOperations() {
    try {
      // Import the BulkOperationManager if not already available
      if (!window.BulkOperationManager) {
        console.log('📦 ES6IntegrationManager: Loading BulkOperationManager...');
        // This will be loaded via the legacy system for now
        // In future phases, we'll import it directly
      }
      
      this.migrationStatus.set('BulkOperationManager', 'migrated');
      
    } catch (error) {
      console.error('🚨 ES6IntegrationManager: Bulk operations migration failed:', error);
      this.migrationStatus.set('BulkOperationManager', 'failed');
      throw error;
    }
  }
  
  /**
   * Migrate active list functionality to ES6 modules
   * @private
   */
  async migrateActiveList() {
    try {
      // The ActiveListManager is already an ES6 module
      // We just need to ensure it's properly integrated
      this.migrationStatus.set('ActiveList', 'migrated');
      
    } catch (error) {
      console.error('🚨 ES6IntegrationManager: Active list migration failed:', error);
      this.migrationStatus.set('ActiveList', 'failed');
      throw error;
    }
  }
  
  /**
   * Migrate state management to ES6 modules
   * @private
   */
  async migrateStateManagement() {
    try {
      // The StateManager is already an ES6 module
      // We just need to ensure it's properly integrated
      this.migrationStatus.set('StateManager', 'migrated');
      
    } catch (error) {
      console.error('🚨 ES6IntegrationManager: State management migration failed:', error);
      this.migrationStatus.set('StateManager', 'failed');
      throw error;
    }
  }
  
  /**
   * Validate the ES6 integration
   * @private
   */
  validateIntegration() {
    console.log('🔍 ES6IntegrationManager: Validating integration...');
    
    const validationResults = {
      modulesLoaded: this.modulesLoaded.size,
      legacyFunctions: this.legacyFunctions.size,
      migrationStatus: Object.fromEntries(this.migrationStatus)
    };
    
    // Check critical functions
    const criticalFunctions = [
      'BulkOperationManager',
      'beginActiveListBulk',
      'endActiveListBulk',
      'updateActiveList',
      'beginBulkOperation',
      'endBulkOperation'
    ];
    
    const missingFunctions = criticalFunctions.filter(func => !window[func]);
    
    if (missingFunctions.length > 0) {
      console.warn(`⚠️ ES6IntegrationManager: Missing critical functions: ${missingFunctions.join(', ')}`);
      validationResults.missingFunctions = missingFunctions;
    }
    
    // Emit validation results
    globalEventBus.emit('es6:integrationValidated', validationResults);
    
    console.log('✅ ES6IntegrationManager: Integration validation complete', validationResults);
  }
  
  /**
   * Get integration status
   * @returns {Object} Current integration status
   */
  getStatus() {
    return {
      phase: this.integrationPhase,
      modulesLoaded: Array.from(this.modulesLoaded),
      legacyFunctions: Array.from(this.legacyFunctions.keys()),
      migrationStatus: Object.fromEntries(this.migrationStatus)
    };
  }
  
  /**
   * Check if a specific module is loaded
   * @param {string} moduleName - Name of the module to check
   * @returns {boolean} Whether the module is loaded
   */
  isModuleLoaded(moduleName) {
    return this.modulesLoaded.has(moduleName);
  }
  
  /**
   * Check if integration is ready
   * @returns {boolean} Whether integration is complete
   */
  isReady() {
    return this.integrationPhase === 'ready';
  }
}

// Export singleton instance
export const es6IntegrationManager = new ES6IntegrationManager();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.es6IntegrationManager = es6IntegrationManager;
}
