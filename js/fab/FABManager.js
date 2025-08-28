/**
 * FABManager - Unified FAB management system
 * Handles registration, creation, destruction, and lookup of FAB instances
 */
class FABManager {
  constructor() {
    this.instances = new Map();
    this.types = new Map();
  }

  register(type, FABClass) {
    this.types.set(type, FABClass);
  }

  create(type, config = {}) {
    const id = config.id || type;
    if (this.instances.has(id)) {
      return this.instances.get(id);
    }
    const FABClass = this.types.get(type);
    if (!FABClass) {
      throw new Error(`FAB type '${type}' not registered`);
    }
    const instance = new FABClass(config);
    instance.init();
    this.instances.set(id, instance);
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
export default FABManager;
