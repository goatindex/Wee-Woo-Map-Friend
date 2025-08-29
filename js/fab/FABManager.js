/**
 * FABManager - Unified FAB management system
 * Handles registration, creation, destruction, and lookup of FAB instances
 */

// Enhanced logging for FABManager - defined before class to avoid reference errors
const FABManagerLogger = {
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

class FABManager {
  constructor() {
    this.instances = new Map();
    this.types = new Map();
  }

  register(type, FABClass) {
    FABManagerLogger.log('Register', 'Registering FAB type', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      FABClassType: typeof FABClass
    });
    this.types.set(type, FABClass);
    FABManagerLogger.log('Register', 'FAB type registered successfully', {
      type: type,
      totalTypes: this.types.size
    });
  }

  create(type, config = {}) {
    FABManagerLogger.log('Create', 'Creating FAB instance', {
      type: type,
      config: config,
      existingInstances: this.instances.size,
      registeredTypes: Array.from(this.types.keys())
    });
    
    const id = config.id || type;
    if (this.instances.has(id)) {
      FABManagerLogger.log('Create', 'Returning existing FAB instance', { id: id });
      return this.instances.get(id);
    }
    
    const FABClass = this.types.get(type);
    if (!FABClass) {
      const error = `FAB type '${type}' not registered`;
      FABManagerLogger.log('Create', 'FAB type not found', {
        type: type,
        availableTypes: Array.from(this.types.keys())
      });
      throw new Error(error);
    }
    
    FABManagerLogger.log('Create', 'Instantiating FAB class', {
      type: type,
      FABClass: FABClass.name || 'Anonymous',
      id: id
    });
    
    const instance = new FABClass(config);
    instance.init();
    this.instances.set(id, instance);
    
    FABManagerLogger.log('Create', 'FAB instance created successfully', {
      type: type,
      id: id,
      totalInstances: this.instances.size,
      instance: instance
    });
    
    return instance;
  }

  getInstance(id) {
    return this.instances.get(id) || null;
  }

  destroy(id) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.destroy();
      this.instances.delete(id);
    }
  }

  destroyAll() {
    for (const [id, instance] of this.instances.entries()) {
      instance.destroy();
      this.instances.delete(id);
    }
  }
}

window.FABManager = new FABManager();
console.log('FABManager loaded successfully - version 20250101_004');
