/**
 * @fileoverview Modern FABManager Component
 * Unified FAB management system for registration, creation, destruction, and lookup of FAB instances
 */

import { logger } from './StructuredLogger.js';

/**
 * @class FABManager
 * Unified FAB management system
 * Handles registration, creation, destruction, and lookup of FAB instances
 */
export class FABManager {
  /**
   * Create FABManager instance
   */
  constructor() {
    this.instances = new Map();
    this.types = new Map();
    
    // Create logger instance
    this.logger = logger.createChild({ 
      module: 'FABManager'
    });
    
    this.logger.info('FABManager instance created');
  }

  /**
   * Register a FAB type
   * @param {string} type - FAB type identifier
   * @param {Class} FABClass - FAB class constructor
   */
  register(type, FABClass) {
    this.logger.info('Registering FAB type', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      FABClassType: typeof FABClass
    });
    
    this.types.set(type, FABClass);
    
    this.logger.info('FAB type registered successfully', {
      type: type,
      totalTypes: this.types.size
    });
  }

  /**
   * Create a FAB instance
   * @param {string} type - FAB type identifier
   * @param {Object} config - Configuration options
   * @returns {Promise<BaseFAB>} FAB instance
   */
  async create(type, config = {}) {
    this.logger.info('Creating FAB instance', {
      type: type,
      config: config,
      existingInstances: this.instances.size,
      registeredTypes: Array.from(this.types.keys())
    });
    
    const id = config.id || type;
    
    // Return existing instance if found
    if (this.instances.has(id)) {
      this.logger.info('Returning existing FAB instance', { id: id });
      return this.instances.get(id);
    }
    
    // Get FAB class
    const FABClass = this.types.get(type);
    if (!FABClass) {
      const error = `FAB type '${type}' not registered`;
      this.logger.error('FAB type not found', {
        type: type,
        availableTypes: Array.from(this.types.keys())
      });
      throw new Error(error);
    }
    
    this.logger.info('Instantiating FAB class', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      id: id
    });
    
    try {
      // Create and initialize instance with computed ID
      const instanceConfig = { ...config, id: id };
      const instance = new FABClass(instanceConfig);
      await instance.init();
      this.instances.set(id, instance);
      
      this.logger.info('FAB instance created successfully', {
        type: type,
        id: id,
        totalInstances: this.instances.size
      });
      
      return instance;
      
    } catch (error) {
      this.logger.error('Failed to create FAB instance', {
        type: type,
        id: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get a FAB instance by ID
   * @param {string} id - FAB instance ID
   * @returns {BaseFAB|null} FAB instance or null
   */
  getInstance(id) {
    const instance = this.instances.get(id);
    
    this.logger.debug('Getting FAB instance', {
      id: id,
      found: !!instance
    });
    
    return instance || null;
  }

  /**
   * Get all FAB instances
   * @returns {Map} Map of all FAB instances
   */
  getAllInstances() {
    this.logger.debug('Getting all FAB instances', {
      count: this.instances.size
    });
    
    return new Map(this.instances);
  }

  /**
   * Get all registered FAB types
   * @returns {Array<string>} Array of registered type names
   */
  getRegisteredTypes() {
    const types = Array.from(this.types.keys());
    
    this.logger.debug('Getting registered FAB types', {
      types: types,
      count: types.length
    });
    
    return types;
  }

  /**
   * Check if a FAB type is registered
   * @param {string} type - FAB type identifier
   * @returns {boolean} Whether type is registered
   */
  isTypeRegistered(type) {
    const isRegistered = this.types.has(type);
    
    this.logger.debug('Checking if FAB type is registered', {
      type: type,
      isRegistered: isRegistered
    });
    
    return isRegistered;
  }

  /**
   * Check if a FAB instance exists
   * @param {string} id - FAB instance ID
   * @returns {boolean} Whether instance exists
   */
  hasInstance(id) {
    const hasInstance = this.instances.has(id);
    
    this.logger.debug('Checking if FAB instance exists', {
      id: id,
      hasInstance: hasInstance
    });
    
    return hasInstance;
  }

  /**
   * Destroy a specific FAB instance
   * @param {string} id - FAB instance ID
   * @returns {boolean} Whether instance was destroyed
   */
  destroy(id) {
    const instance = this.instances.get(id);
    
    if (instance) {
      this.logger.info('Destroying FAB instance', {
        id: id,
        type: instance.constructor.name
      });
      
      instance.destroy();
      this.instances.delete(id);
      
      this.logger.info('FAB instance destroyed successfully', {
        id: id,
        remainingInstances: this.instances.size
      });
      
      return true;
    } else {
      this.logger.warn('FAB instance not found for destruction', {
        id: id
      });
      return false;
    }
  }

  /**
   * Destroy all FAB instances
   * @returns {number} Number of instances destroyed
   */
  destroyAll() {
    const instanceCount = this.instances.size;
    
    this.logger.info('Destroying all FAB instances', {
      count: instanceCount
    });
    
    for (const [id, instance] of this.instances.entries()) {
      this.logger.debug('Destroying FAB instance', {
        id: id,
        type: instance.constructor.name
      });
      
      instance.destroy();
      this.instances.delete(id);
    }
    
    this.logger.info('All FAB instances destroyed', {
      destroyedCount: instanceCount
    });
    
    return instanceCount;
  }

  /**
   * Get manager statistics
   * @returns {Object} Manager statistics
   */
  getStats() {
    const stats = {
      registeredTypes: this.types.size,
      activeInstances: this.instances.size,
      types: Array.from(this.types.keys()),
      instances: Array.from(this.instances.keys())
    };
    
    this.logger.debug('FABManager statistics', stats);
    
    return stats;
  }

  /**
   * Clear all registrations and instances
   */
  clear() {
    this.logger.info('Clearing FABManager', {
      types: this.types.size,
      instances: this.instances.size
    });
    
    this.destroyAll();
    this.types.clear();
    
    this.logger.info('FABManager cleared');
  }
}

// Create singleton instance
export const fabManager = new FABManager();

// Export for legacy compatibility
// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details

// Module loaded - using StructuredLogger for initialization logging