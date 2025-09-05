/**
 * @module modules/DependencyRegistry
 * Dependency injection registry for ES6 modules
 * Eliminates global dependencies and enables proper testing
 */

import { logger } from './StructuredLogger.js';

/**
 * @class DependencyRegistry
 * Central registry for managing module dependencies
 */
export class DependencyRegistry {
  constructor() {
    this.dependencies = new Map();
    this.initialized = new Set();
    this.initializationOrder = [];
    this.logger = logger.createChild({ module: 'DependencyRegistry' });
    
    this.logger.info('Dependency registry initialized');
  }

  /**
   * Register a dependency with the registry
   * @param {string} name - Name of the dependency
   * @param {Function} factory - Factory function to create the dependency
   * @param {Array<string>} dependencies - Array of dependency names this depends on
   * @param {Object} options - Additional options
   */
  register(name, factory, dependencies = [], options = {}) {
    if (this.dependencies.has(name)) {
      this.logger.warn(`Dependency ${name} already registered, overwriting`);
    }

    this.dependencies.set(name, {
      factory,
      dependencies,
      options: {
        singleton: true,
        lazy: false,
        ...options
      },
      instance: null,
      initialized: false
    });

    this.logger.debug(`Registered dependency: ${name}`, { 
      dependencies: dependencies.length,
      options 
    });
  }

  /**
   * Get a dependency instance
   * @param {string} name - Name of the dependency
   * @returns {*} The dependency instance
   */
  get(name) {
    const dependency = this.dependencies.get(name);
    
    if (!dependency) {
      throw new Error(`Dependency '${name}' not registered`);
    }

    // Return existing instance if singleton and already created
    if (dependency.options.singleton && dependency.instance) {
      return dependency.instance;
    }

    // Create new instance
    return this.createInstance(name);
  }

  /**
   * Create an instance of a dependency
   * @param {string} name - Name of the dependency
   * @returns {*} The created instance
   */
  createInstance(name) {
    const dependency = this.dependencies.get(name);
    
    if (!dependency) {
      throw new Error(`Dependency '${name}' not registered`);
    }

    // Resolve dependencies
    const resolvedDependencies = dependency.dependencies.map(depName => {
      return this.get(depName);
    });

    // Create instance using factory
    const instance = dependency.factory(...resolvedDependencies);

    // Store instance if singleton
    if (dependency.options.singleton) {
      dependency.instance = instance;
    }

    this.logger.debug(`Created instance of dependency: ${name}`);
    return instance;
  }

  /**
   * Initialize a dependency and its dependencies
   * @param {string} name - Name of the dependency
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize(name) {
    if (this.initialized.has(name)) {
      return this.get(name);
    }

    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency '${name}' not registered`);
    }

    this.logger.debug(`Initializing dependency: ${name}`);

    // Initialize dependencies first
    for (const depName of dependency.dependencies) {
      await this.initialize(depName);
    }

    // Get or create instance
    const instance = this.get(name);

    // Initialize if the instance has an init method
    if (instance && typeof instance.init === 'function' && !dependency.initialized) {
      await instance.init();
      dependency.initialized = true;
      this.initialized.add(name);
      this.initializationOrder.push(name);
      
      this.logger.info(`Initialized dependency: ${name}`);
    } else if (instance) {
      this.initialized.add(name);
      this.initializationOrder.push(name);
      this.logger.debug(`Dependency already initialized: ${name}`);
    }

    return instance;
  }

  /**
   * Initialize all registered dependencies in dependency order
   * @returns {Promise} Promise that resolves when all dependencies are initialized
   */
  async initializeAll() {
    this.logger.info('Initializing all dependencies...');
    
    const dependencyNames = Array.from(this.dependencies.keys());
    const results = await Promise.allSettled(
      dependencyNames.map(name => this.initialize(name))
    );

    const failures = results
      .map((result, index) => ({ name: dependencyNames[index], result }))
      .filter(({ result }) => result.status === 'rejected');

    if (failures.length > 0) {
      this.logger.error('Some dependencies failed to initialize', {
        failures: failures.map(({ name, result }) => ({
          name,
          error: result.reason.message
        }))
      });
      
      // Don't throw - allow partial initialization
    }

    this.logger.info(`Dependency initialization complete`, {
      total: dependencyNames.length,
      successful: dependencyNames.length - failures.length,
      failed: failures.length,
      order: this.initializationOrder
    });

    return {
      successful: dependencyNames.length - failures.length,
      failed: failures.length,
      failures: failures.map(({ name, result }) => ({ name, error: result.reason }))
    };
  }

  /**
   * Check if a dependency is registered
   * @param {string} name - Name of the dependency
   * @returns {boolean} True if registered
   */
  has(name) {
    return this.dependencies.has(name);
  }

  /**
   * Get all registered dependency names
   * @returns {Array<string>} Array of dependency names
   */
  getRegisteredDependencies() {
    return Array.from(this.dependencies.keys());
  }

  /**
   * Get dependency information
   * @param {string} name - Name of the dependency
   * @returns {Object} Dependency information
   */
  getDependencyInfo(name) {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      return null;
    }

    return {
      name,
      dependencies: dependency.dependencies,
      options: dependency.options,
      initialized: dependency.initialized,
      hasInstance: !!dependency.instance
    };
  }

  /**
   * Clear all dependencies (useful for testing)
   */
  clear() {
    this.dependencies.clear();
    this.initialized.clear();
    this.initializationOrder = [];
    this.logger.info('Dependency registry cleared');
  }

  /**
   * Get initialization order
   * @returns {Array<string>} Array of dependency names in initialization order
   */
  getInitializationOrder() {
    return [...this.initializationOrder];
  }

  /**
   * Validate dependency graph for circular dependencies
   * @returns {Object} Validation result
   */
  validateDependencyGraph() {
    const visited = new Set();
    const recursionStack = new Set();
    const circularDependencies = [];

    const visit = (name, path = []) => {
      if (recursionStack.has(name)) {
        const cycle = path.slice(path.indexOf(name));
        cycle.push(name);
        circularDependencies.push(cycle);
        return;
      }

      if (visited.has(name)) {
        return;
      }

      visited.add(name);
      recursionStack.add(name);

      const dependency = this.dependencies.get(name);
      if (dependency) {
        for (const depName of dependency.dependencies) {
          visit(depName, [...path, name]);
        }
      }

      recursionStack.delete(name);
    };

    for (const name of this.dependencies.keys()) {
      if (!visited.has(name)) {
        visit(name);
      }
    }

    return {
      isValid: circularDependencies.length === 0,
      circularDependencies
    };
  }
}

// Create singleton instance
export const dependencyRegistry = new DependencyRegistry();

// Export for global access
if (typeof window !== 'undefined') {
  window.DependencyRegistry = dependencyRegistry;
}
