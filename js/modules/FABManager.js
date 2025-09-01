/**
 * @module modules/FABManager
 * Modern ES6-based FAB (Floating Action Button) management for WeeWoo Map Friend
 * Handles registration, creation, destruction, and lookup of FAB instances
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class FABManager
 * Manages floating action button system with enhanced functionality
 */
export class FABManager {
  constructor() {
    this.initialized = false;
    this.instances = new Map();
    this.types = new Map();
    this.fabContainer = null;
    this.fabLogger = this.createLogger();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.register = this.register.bind(this);
    this.create = this.create.bind(this);
    this.getInstance = this.getInstance.bind(this);
    this.destroy = this.destroy.bind(this);
    this.destroyAll = this.destroyAll.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('🔘 FABManager: FAB management system initialized');
  }
  
  /**
   * Initialize the FAB manager
   */
  async init() {
    if (this.initialized) {
      console.warn('FABManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 FABManager: Starting initialization...');
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Initialize FAB container
      this.initializeFABContainer();
      
      // Register default FAB types
      this.registerDefaultTypes();
      
      this.initialized = true;
      console.log('✅ FABManager: FAB management system ready');
      
    } catch (error) {
      console.error('🚨 FABManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Create enhanced logger for FAB operations
   */
  createLogger() {
    return {
      log(component, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `🔍 [${timestamp}] [FABManager] [${component}]`;
        if (data) {
          console.log(`${prefix}: ${message}`, data);
        } else {
          console.log(`${prefix}: ${message}`);
        }
      }
    };
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for FAB creation requests
    globalEventBus.on('fab:create', ({ type, config }) => {
      this.create(type, config);
    });
    
    // Listen for FAB destruction requests
    globalEventBus.on('fab:destroy', ({ id }) => {
      this.destroy(id);
    });
    
    // Listen for FAB state changes
    globalEventBus.on('fab:stateChange', ({ id, state }) => {
      const instance = this.getInstance(id);
      if (instance && instance.updateState) {
        instance.updateState(state);
      }
    });
  }
  
  /**
   * Initialize FAB container
   */
  initializeFABContainer() {
    // Look for existing FAB container or create one
    this.fabContainer = document.getElementById('fab-container') || 
                       document.querySelector('.fab-container') ||
                       this.createFABContainer();
    
    if (this.fabContainer) {
      console.log('FABManager: FAB container initialized');
    } else {
      console.warn('FABManager: No FAB container found or created');
    }
  }
  
  /**
   * Create FAB container if it doesn't exist
   */
  createFABContainer() {
    const container = document.createElement('div');
    container.id = 'fab-container';
    container.className = 'fab-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    document.body.appendChild(container);
    console.log('FABManager: Created new FAB container');
    return container;
  }
  
  /**
   * Register default FAB types
   */
  registerDefaultTypes() {
    // Register base FAB class
    if (window.BaseFAB) {
      this.register('base', window.BaseFAB);
    }
    
    // Register specific FAB types
    if (window.DocsFAB) {
      this.register('docs', window.DocsFAB);
    }
    
    if (window.SidebarToggleFAB) {
      this.register('sidebarToggle', window.SidebarToggleFAB);
    }
    
    console.log('FABManager: Default FAB types registered');
  }
  
  /**
   * Register a new FAB type
   */
  register(type, FABClass) {
    this.fabLogger.log('Register', 'Registering FAB type', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      FABClassType: typeof FABClass
    });
    
    this.types.set(type, FABClass);
    
    this.fabLogger.log('Register', 'FAB type registered successfully', {
      type: type,
      totalTypes: this.types.size
    });
    
    // Emit registration event
    globalEventBus.emit('fab:typeRegistered', { type, FABClass });
  }
  
  /**
   * Create a new FAB instance
   */
  create(type, config = {}) {
    this.fabLogger.log('Create', 'Creating FAB instance', {
      type: type,
      config: config,
      existingInstances: this.instances.size,
      registeredTypes: Array.from(this.types.keys())
    });
    
    const id = config.id || `${type}_${Date.now()}`;
    
    // Check if instance already exists
    if (this.instances.has(id)) {
      this.fabLogger.log('Create', 'Returning existing FAB instance', { id: id });
      return this.instances.get(id);
    }
    
    // Get FAB class
    const FABClass = this.types.get(type);
    if (!FABClass) {
      const error = `FAB type '${type}' not registered`;
      this.fabLogger.log('Create', 'FAB type not found', {
        type: type,
        availableTypes: Array.from(this.types.keys())
      });
      throw new Error(error);
    }
    
    this.fabLogger.log('Create', 'Instantiating FAB class', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      id: id
    });
    
    try {
      // Create instance with enhanced config
      const enhancedConfig = {
        ...config,
        id: id,
        container: this.fabContainer,
        manager: this
      };
      
      const instance = new FABClass(enhancedConfig);
      
      // Initialize if init method exists
      if (typeof instance.init === 'function') {
        instance.init();
      }
      
      // Store instance
      this.instances.set(id, instance);
      
      this.fabLogger.log('Create', 'FAB instance created successfully', {
        type: type,
        id: id,
        totalInstances: this.instances.size
      });
      
      // Emit creation event
      globalEventBus.emit('fab:instanceCreated', { id, type, instance });
      
      return instance;
      
    } catch (error) {
      this.fabLogger.log('Create', 'FAB instance creation failed', {
        type: type,
        id: id,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get FAB instance by ID
   */
  getInstance(id) {
    return this.instances.get(id) || null;
  }
  
  /**
   * Get all FAB instances
   */
  getAllInstances() {
    return Array.from(this.instances.values());
  }
  
  /**
   * Get FAB instances by type
   */
  getInstancesByType(type) {
    return Array.from(this.instances.values()).filter(instance => 
      instance.type === type || instance.constructor.name.toLowerCase().includes(type.toLowerCase())
    );
  }
  
  /**
   * Destroy a specific FAB instance
   */
  destroy(id) {
    const instance = this.instances.get(id);
    if (instance) {
      this.fabLogger.log('Destroy', 'Destroying FAB instance', { id: id });
      
      try {
        // Call destroy method if it exists
        if (typeof instance.destroy === 'function') {
          instance.destroy();
        }
        
        // Remove from instances map
        this.instances.delete(id);
        
        this.fabLogger.log('Destroy', 'FAB instance destroyed successfully', { id: id });
        
        // Emit destruction event
        globalEventBus.emit('fab:instanceDestroyed', { id });
        
      } catch (error) {
        console.error('FABManager: Error destroying FAB instance:', error);
      }
    }
  }
  
  /**
   * Destroy all FAB instances
   */
  destroyAll() {
    this.fabLogger.log('DestroyAll', 'Destroying all FAB instances', {
      totalInstances: this.instances.size
    });
    
    for (const [id, instance] of this.instances.entries()) {
      try {
        if (typeof instance.destroy === 'function') {
          instance.destroy();
        }
      } catch (error) {
        console.error('FABManager: Error destroying FAB instance:', error);
      }
    }
    
    this.instances.clear();
    
    this.fabLogger.log('DestroyAll', 'All FAB instances destroyed');
    
    // Emit destruction event
    globalEventBus.emit('fab:allInstancesDestroyed');
  }
  
  /**
   * Show all FAB instances
   */
  showAll() {
    this.instances.forEach(instance => {
      if (typeof instance.show === 'function') {
        instance.show();
      }
    });
  }
  
  /**
   * Hide all FAB instances
   */
  hideAll() {
    this.instances.forEach(instance => {
      if (typeof instance.hide === 'function') {
        instance.hide();
      }
    });
  }
  
  /**
   * Update FAB positions based on device context
   */
  updatePositions() {
    const deviceContext = stateManager.get('deviceContext');
    if (!deviceContext) return;
    
    this.instances.forEach(instance => {
      if (typeof instance.updatePosition === 'function') {
        instance.updatePosition(deviceContext);
      }
    });
  }
  
  /**
   * Get FAB manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalTypes: this.types.size,
      totalInstances: this.instances.size,
      fabContainer: !!this.fabContainer,
      registeredTypes: Array.from(this.types.keys()),
      instanceIds: Array.from(this.instances.keys())
    };
  }
  
  /**
   * Check if FAB manager is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Export singleton instance
export const fabManager = new FABManager();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.FABManager = fabManager;
}
