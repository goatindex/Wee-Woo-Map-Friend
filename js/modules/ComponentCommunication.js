/**
 * @module modules/ComponentCommunication
 * Enhanced component communication system for WeeWoo Map Friend
 * Implements event-driven communication patterns, lifecycle management, and error boundaries
 *
 * @fileoverview Component communication service for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES, BaseService, IEventBus } from './DependencyContainer.js';
import { logger } from './StructuredLogger.js';
import { errorBoundary } from './ErrorBoundary.js';

/**
 * @typedef {Object} ComponentStatus
 * @property {string} id - Component ID
 * @property {string} name - Component name
 * @property {string} type - Component type
 * @property {'initializing'|'ready'|'error'|'destroyed'} status - Current status
 * @property {'healthy'|'degraded'|'unhealthy'} health - Health status
 * @property {string[]} dependencies - Component dependencies
 * @property {string[]} events - Available events
 * @property {number} lastActivity - Last activity timestamp
 * @property {number} errorCount - Error count
 * @property {string} [lastError] - Last error message
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} Component
 * @property {string} id - Component ID
 * @property {string} name - Component name
 * @property {string} type - Component type
 * @property {ComponentStatus} status - Component status
 * @property {string[]} dependencies - Component dependencies
 * @property {Set<string>} events - Available events
 * @property {Function} emit - Emit event function
 * @property {Function} on - Subscribe to event function
 * @property {Function} off - Unsubscribe from event function
 * @property {Function} initialize - Initialize function
 * @property {Function} cleanup - Cleanup function
 * @property {Function} getStatus - Get status function
 * @property {Function} isReady - Check if ready function
 * @property {Function} isHealthy - Check if healthy function
 */

/**
 * @class ComponentCommunication
 * Manages component communication, lifecycle, and error handling.
 */
@injectable()
export class ComponentCommunication extends BaseService {
  constructor(
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.ErrorBoundary) errorBoundary,
    @inject(TYPES.ComponentErrorRecoveryService) errorRecoveryService,
    @inject(TYPES.ComponentMemoryManager) memoryManager
  ) {
    super();
    this.eventBus = eventBus;
    this.errorBoundary = errorBoundary;
    this.errorRecoveryService = errorRecoveryService;
    this.memoryManager = memoryManager;
    this.components = new Map();
    this.componentStatuses = new Map();
    this.eventSubscriptions = new Map();
    this.dependencyGraph = new Map();
    this.initializationQueue = [];
    this.isInitializing = false;
    this.logger = logger.createChild({ module: 'ComponentCommunication' });
  }

  /**
   * Initializes the ComponentCommunication service.
   * @returns {Promise<void>}
   */
  async initialize() {
    await super.initialize();
    this.logger.info('ComponentCommunication initialized');
  }

  /**
   * Registers a component with the communication system.
   * @param {Component} component - The component to register.
   */
  registerComponent(component) {
    if (this.components.has(component.id)) {
      this.logger.warn('Component already registered', { componentId: component.id });
      return;
    }

    try {
      // Register component
      this.components.set(component.id, component);
      
      // Initialize component status
      const status = {
        id: component.id,
        name: component.name,
        type: component.type,
        status: 'initializing',
        health: 'healthy',
        dependencies: component.dependencies || [],
        events: Array.from(component.events || new Set()),
        lastActivity: Date.now(),
        errorCount: 0,
        metadata: {}
      };
      this.componentStatuses.set(component.id, status);

      // Update dependency graph
      this.updateDependencyGraph(component.id, component.dependencies || []);

      // Add to initialization queue
      this.initializationQueue.push(component.id);

      // Start initialization if not already in progress
      if (!this.isInitializing) {
        this.processInitializationQueue();
      }

      this.logger.info('Component registered', {
        componentId: component.id,
        componentName: component.name,
        componentType: component.type,
        dependencies: component.dependencies || [],
        totalComponents: this.components.size
      });

      // Emit component registered event
      this.eventBus.emit('component:registered', {
        componentId: component.id,
        component: component,
        totalComponents: this.components.size
      });

    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.registerComponent', componentId: component.id });
      this.logger.error('Failed to register component', { componentId: component.id, error: error.message });
    }
  }

  /**
   * Unregisters a component from the communication system.
   * @param {string} componentId - The ID of the component to unregister.
   */
  unregisterComponent(componentId) {
    if (!this.components.has(componentId)) {
      this.logger.warn('Component not found for unregistration', { componentId });
      return;
    }

    try {
      const component = this.components.get(componentId);
      
      // Clean up component
      component.cleanup().catch(error => {
        this.errorBoundary.catch(error, { context: 'ComponentCommunication.unregisterComponent.cleanup', componentId });
      });

      // Remove from maps
      this.components.delete(componentId);
      this.componentStatuses.delete(componentId);
      this.eventSubscriptions.delete(componentId);
      this.dependencyGraph.delete(componentId);

      // Remove from initialization queue
      const queueIndex = this.initializationQueue.indexOf(componentId);
      if (queueIndex > -1) {
        this.initializationQueue.splice(queueIndex, 1);
      }

      this.logger.info('Component unregistered', {
        componentId,
        componentName: component.name,
        totalComponents: this.components.size
      });

      // Emit component unregistered event
      this.eventBus.emit('component:unregistered', {
        componentId,
        totalComponents: this.components.size
      });

    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.unregisterComponent', componentId });
      this.logger.error('Failed to unregister component', { componentId, error: error.message });
    }
  }

  /**
   * Gets a component by ID.
   * @param {string} componentId - The component ID.
   * @returns {Component | null} The component or null if not found.
   */
  getComponent(componentId) {
    return this.components.get(componentId) || null;
  }

  /**
   * Gets all registered components.
   * @returns {Map<string, Component>} Map of component ID to component.
   */
  getAllComponents() {
    return new Map(this.components);
  }

  /**
   * Emits an event to a specific component.
   * @param {string} componentId - The target component ID.
   * @param {string} event - The event name.
   * @param {any} [data] - Optional event data.
   * @returns {boolean} True if the event was emitted successfully.
   */
  emitToComponent(componentId, event, data) {
    const component = this.components.get(componentId);
    if (!component) {
      this.logger.warn('Component not found for event emission', { componentId, event });
      return false;
    }

    try {
      component.emit(event, data);
      this.updateComponentActivity(componentId);
      this.logger.debug('Event emitted to component', { componentId, event, hasData: !!data });
      return true;
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.emitToComponent', componentId, event });
      this.logger.error('Failed to emit event to component', { componentId, event, error: error.message });
      return false;
    }
  }

  /**
   * Broadcasts an event to all components.
   * @param {string} event - The event name.
   * @param {any} [data] - Optional event data.
   */
  broadcastEvent(event, data) {
    this.logger.debug('Broadcasting event to all components', { event, componentCount: this.components.size });
    
    this.components.forEach((component, componentId) => {
      try {
        component.emit(event, data);
        this.updateComponentActivity(componentId);
      } catch (error) {
        this.errorBoundary.catch(error, { context: 'ComponentCommunication.broadcastEvent', componentId, event });
        this.logger.error('Failed to broadcast event to component', { componentId, event, error: error.message });
      }
    });

    // Also emit on the global event bus
    this.eventBus.emit(event, data);
  }

  /**
   * Subscribes to events from a specific component.
   * @param {string} componentId - The component ID to subscribe to.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler.
   * @returns {Function} Unsubscribe function.
   */
  subscribeToComponent(componentId, event, handler) {
    const component = this.components.get(componentId);
    if (!component) {
      this.logger.warn('Component not found for subscription', { componentId, event });
      return () => {}; // Return no-op unsubscribe function
    }

    try {
      // Subscribe to component events
      const unsubscribe = component.on(event, handler);

      // Track subscription
      if (!this.eventSubscriptions.has(componentId)) {
        this.eventSubscriptions.set(componentId, new Map());
      }
      const componentSubscriptions = this.eventSubscriptions.get(componentId);
      if (!componentSubscriptions.has(event)) {
        componentSubscriptions.set(event, new Set());
      }
      componentSubscriptions.get(event).add(handler);

      this.logger.debug('Subscribed to component event', { componentId, event });
      
      return () => {
        unsubscribe();
        const subscriptions = this.eventSubscriptions.get(componentId);
        if (subscriptions && subscriptions.has(event)) {
          subscriptions.get(event).delete(handler);
        }
      };
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.subscribeToComponent', componentId, event });
      this.logger.error('Failed to subscribe to component event', { componentId, event, error: error.message });
      return () => {}; // Return no-op unsubscribe function
    }
  }

  /**
   * Gets the status of a specific component.
   * @param {string} componentId - The component ID.
   * @returns {ComponentStatus | null} The component status or null if not found.
   */
  getComponentStatus(componentId) {
    return this.componentStatuses.get(componentId) || null;
  }

  /**
   * Gets the status of all components.
   * @returns {Map<string, ComponentStatus>} Map of component ID to status.
   */
  getAllComponentStatuses() {
    return new Map(this.componentStatuses);
  }

  /**
   * Processes the component initialization queue.
   * @private
   */
  async processInitializationQueue() {
    if (this.isInitializing || this.initializationQueue.length === 0) {
      return;
    }

    this.isInitializing = true;
    this.logger.info('Processing component initialization queue', { queueLength: this.initializationQueue.length });

    try {
      // Sort components by dependency order
      const sortedComponents = this.topologicalSort(this.initializationQueue);
      
      // Initialize components in dependency order
      for (const componentId of sortedComponents) {
        await this.initializeComponent(componentId);
      }

      this.initializationQueue = [];
      this.logger.info('Component initialization queue processed', { 
        initializedCount: sortedComponents.length,
        totalComponents: this.components.size
      });

    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.processInitializationQueue' });
      this.logger.error('Failed to process initialization queue', { error: error.message });
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initializes a single component.
   * @private
   * @param {string} componentId - The component ID to initialize.
   */
  async initializeComponent(componentId) {
    const component = this.components.get(componentId);
    if (!component) {
      this.logger.warn('Component not found for initialization', { componentId });
      return;
    }

    const status = this.componentStatuses.get(componentId);
    if (!status) {
      this.logger.warn('Component status not found for initialization', { componentId });
      return;
    }

    try {
      this.logger.info('Initializing component', { componentId, componentName: component.name });
      
      // Update status to initializing
      status.status = 'initializing';
      status.lastActivity = Date.now();

      // Initialize component
      await component.initialize();

      // Update status to ready
      status.status = 'ready';
      status.health = 'healthy';
      status.lastActivity = Date.now();

      this.logger.info('Component initialized successfully', { 
        componentId, 
        componentName: component.name,
        isReady: component.isReady(),
        isHealthy: component.isHealthy()
      });

      // Emit component ready event
      this.eventBus.emit('component:ready', {
        componentId,
        component: component,
        status: status
      });

    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.initializeComponent', componentId });
      
      // Update status to error
      status.status = 'error';
      status.health = 'unhealthy';
      status.errorCount++;
      status.lastError = error.message;
      status.lastActivity = Date.now();

      this.logger.error('Component initialization failed', { 
        componentId, 
        componentName: component.name,
        error: error.message,
        errorCount: status.errorCount
      });

      // Emit component error event
      this.eventBus.emit('component:error', {
        componentId,
        component: component,
        error: error,
        status: status
      });
    }
  }

  /**
   * Updates the dependency graph for a component.
   * @private
   * @param {string} componentId - The component ID.
   * @param {string[]} dependencies - The component dependencies.
   */
  updateDependencyGraph(componentId, dependencies) {
    this.dependencyGraph.set(componentId, new Set(dependencies));
  }

  /**
   * Performs topological sort of components based on dependencies.
   * @private
   * @param {string[]} componentIds - The component IDs to sort.
   * @returns {string[]} Sorted component IDs.
   */
  topologicalSort(componentIds) {
    const visited = new Set();
    const visiting = new Set();
    const result = [];

    const visit = (componentId) => {
      if (visiting.has(componentId)) {
        throw new Error(`Circular dependency detected involving component: ${componentId}`);
      }
      if (visited.has(componentId)) {
        return;
      }

      visiting.add(componentId);
      const dependencies = this.dependencyGraph.get(componentId) || new Set();
      
      for (const depId of dependencies) {
        if (componentIds.includes(depId)) {
          visit(depId);
        }
      }
      
      visiting.delete(componentId);
      visited.add(componentId);
      result.push(componentId);
    };

    for (const componentId of componentIds) {
      if (!visited.has(componentId)) {
        visit(componentId);
      }
    }

    return result;
  }

  /**
   * Updates component activity timestamp.
   * @private
   * @param {string} componentId - The component ID.
   */
  updateComponentActivity(componentId) {
    const status = this.componentStatuses.get(componentId);
    if (status) {
      status.lastActivity = Date.now();
    }
  }

  /**
   * Adds event middleware for filtering and processing events.
   * @param {Function} middleware - The middleware function.
   */
  addEventMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      this.logger.warn('Event middleware must be a function');
      return;
    }

    if (!this.eventMiddleware) {
      this.eventMiddleware = [];
    }

    this.eventMiddleware.push(middleware);
    this.logger.debug('Event middleware added', { middlewareCount: this.eventMiddleware.length });
  }

  /**
   * Removes event middleware.
   * @param {Function} middleware - The middleware function to remove.
   */
  removeEventMiddleware(middleware) {
    if (!this.eventMiddleware) {
      return;
    }

    const index = this.eventMiddleware.indexOf(middleware);
    if (index > -1) {
      this.eventMiddleware.splice(index, 1);
      this.logger.debug('Event middleware removed', { middlewareCount: this.eventMiddleware.length });
    }
  }

  /**
   * Processes an event through middleware pipeline.
   * @private
   * @param {string} eventType - The event type.
   * @param {any} eventData - The event data.
   * @returns {any} Processed event data.
   */
  processEventThroughMiddleware(eventType, eventData) {
    if (!this.eventMiddleware || this.eventMiddleware.length === 0) {
      return eventData;
    }

    let processedData = eventData;
    
    for (const middleware of this.eventMiddleware) {
      try {
        processedData = middleware(eventType, processedData);
        if (processedData === null || processedData === undefined) {
          this.logger.debug('Event filtered out by middleware', { eventType });
          return null; // Event filtered out
        }
      } catch (error) {
        this.errorBoundary.catch(error, { context: 'ComponentCommunication.processEventThroughMiddleware', eventType });
        this.logger.error('Event middleware error', { eventType, error: error.message });
        return null; // Filter out event on middleware error
      }
    }

    return processedData;
  }

  /**
   * Emits an event with middleware processing.
   * @param {string} eventType - The event type.
   * @param {any} eventData - The event data.
   * @param {Object} [options] - Event options.
   * @param {boolean} [options.broadcast=false] - Whether to broadcast to all components.
   * @param {string[]} [options.targetComponents] - Specific component IDs to target.
   * @param {boolean} [options.skipMiddleware=false] - Skip middleware processing.
   */
  emitEvent(eventType, eventData, options = {}) {
    const { broadcast = false, targetComponents = [], skipMiddleware = false } = options;

    // Process through middleware unless skipped
    let processedData = eventData;
    if (!skipMiddleware) {
      processedData = this.processEventThroughMiddleware(eventType, eventData);
      if (processedData === null) {
        return; // Event was filtered out
      }
    }

    this.logger.debug('Emitting event', { 
      eventType, 
      broadcast, 
      targetCount: targetComponents.length,
      hasData: !!processedData
    });

    if (broadcast) {
      this.broadcastEvent(eventType, processedData);
    } else if (targetComponents.length > 0) {
      targetComponents.forEach(componentId => {
        this.emitToComponent(componentId, eventType, processedData);
      });
    } else {
      // Emit to global event bus
      this.eventBus.emit(eventType, processedData);
    }
  }

  /**
   * Subscribes to events with filtering support.
   * @param {string} eventType - The event type to subscribe to.
   * @param {Function} handler - The event handler.
   * @param {Object} [options] - Subscription options.
   * @param {Function} [options.filter] - Event filter function.
   * @param {number} [options.maxCalls] - Maximum number of times to call handler.
   * @returns {Function} Unsubscribe function.
   */
  subscribeToEvent(eventType, handler, options = {}) {
    const { filter, maxCalls } = options;
    let callCount = 0;

    const wrappedHandler = (eventData) => {
      // Check max calls limit
      if (maxCalls && callCount >= maxCalls) {
        this.logger.debug('Event handler reached max calls limit', { eventType, maxCalls });
        return;
      }

      // Apply filter if provided
      if (filter && !filter(eventData)) {
        this.logger.debug('Event filtered out by subscription filter', { eventType });
        return;
      }

      try {
        handler(eventData);
        callCount++;
      } catch (error) {
        this.errorBoundary.catch(error, { context: 'ComponentCommunication.subscribeToEvent', eventType });
        this.logger.error('Event handler error', { eventType, error: error.message });
      }
    };

    // Subscribe to global event bus
    const unsubscribe = this.eventBus.on(eventType, wrappedHandler);

    this.logger.debug('Subscribed to event', { eventType, hasFilter: !!filter, maxCalls });

    return unsubscribe;
  }

  /**
   * Gets components by type.
   * @param {string} type - The component type.
   * @returns {Component[]} Array of components of the specified type.
   */
  getComponentsByType(type) {
    const components = [];
    this.components.forEach(component => {
      if (component.type === type) {
        components.push(component);
      }
    });
    return components;
  }

  /**
   * Gets components by status.
   * @param {string} status - The component status.
   * @returns {Component[]} Array of components with the specified status.
   */
  getComponentsByStatus(status) {
    const components = [];
    this.components.forEach(component => {
      const componentStatus = this.componentStatuses.get(component.id);
      if (componentStatus && componentStatus.status === status) {
        components.push(component);
      }
    });
    return components;
  }

  /**
   * Gets components by health status.
   * @param {string} health - The component health status.
   * @returns {Component[]} Array of components with the specified health status.
   */
  getComponentsByHealth(health) {
    const components = [];
    this.components.forEach(component => {
      const componentStatus = this.componentStatuses.get(component.id);
      if (componentStatus && componentStatus.health === health) {
        components.push(component);
      }
    });
    return components;
  }

  /**
   * Gets component dependency chain.
   * @param {string} componentId - The component ID.
   * @returns {string[]} Array of component IDs in dependency order.
   */
  getComponentDependencyChain(componentId) {
    const visited = new Set();
    const result = [];

    const visit = (id) => {
      if (visited.has(id)) {
        return;
      }

      visited.add(id);
      const dependencies = this.dependencyGraph.get(id) || new Set();
      
      for (const depId of dependencies) {
        if (this.components.has(depId)) {
          visit(depId);
        }
      }
      
      result.push(id);
    };

    visit(componentId);
    return result;
  }

  /**
   * Gets components that depend on a specific component.
   * @param {string} componentId - The component ID.
   * @returns {string[]} Array of component IDs that depend on the specified component.
   */
  getDependentComponents(componentId) {
    const dependents = [];
    
    this.dependencyGraph.forEach((dependencies, id) => {
      if (dependencies.has(componentId)) {
        dependents.push(id);
      }
    });

    return dependents;
  }

  /**
   * Restarts a component.
   * @param {string} componentId - The component ID to restart.
   * @returns {Promise<boolean>} True if restart was successful.
   */
  async restartComponent(componentId) {
    const component = this.components.get(componentId);
    if (!component) {
      this.logger.warn('Component not found for restart', { componentId });
      return false;
    }

    try {
      this.logger.info('Restarting component', { componentId, componentName: component.name });

      // Cleanup component
      await component.cleanup();

      // Reset status
      const status = this.componentStatuses.get(componentId);
      if (status) {
        status.status = 'initializing';
        status.health = 'healthy';
        status.errorCount = 0;
        status.lastError = null;
        status.lastActivity = Date.now();
      }

      // Reinitialize component
      await this.initializeComponent(componentId);

      this.logger.info('Component restarted successfully', { componentId });
      return true;

    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.restartComponent', componentId });
      this.logger.error('Component restart failed', { componentId, error: error.message });
      return false;
    }
  }

  /**
   * Gets system health summary.
   * @returns {Object} System health information.
   */
  getSystemHealth() {
    const totalComponents = this.components.size;
    const statusCounts = { initializing: 0, ready: 0, error: 0, destroyed: 0 };
    const healthCounts = { healthy: 0, degraded: 0, unhealthy: 0 };
    let totalErrors = 0;

    this.componentStatuses.forEach(status => {
      statusCounts[status.status] = (statusCounts[status.status] || 0) + 1;
      healthCounts[status.health] = (healthCounts[status.health] || 0) + 1;
      totalErrors += status.errorCount;
    });

    const overallHealth = totalComponents === 0 ? 'unknown' :
                         healthCounts.unhealthy > 0 ? 'unhealthy' :
                         healthCounts.degraded > 0 ? 'degraded' : 'healthy';

    return {
      totalComponents,
      statusCounts,
      healthCounts,
      totalErrors,
      overallHealth,
      isInitializing: this.isInitializing,
      queueLength: this.initializationQueue.length,
      memoryStats: this.memoryManager.getMemoryStats()
    };
  }





  /**
   * Cleans up the ComponentCommunication service.
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.logger.info('Cleaning up ComponentCommunication');

    try {
      // Clean up all components
      const cleanupPromises = Array.from(this.components.values()).map(component => 
        component.cleanup().catch(error => {
          this.errorBoundary.catch(error, { context: 'ComponentCommunication.cleanup.component', componentId: component.id });
        })
      );

      await Promise.allSettled(cleanupPromises);

      // Clear all maps and references
      this.components.clear();
      this.componentStatuses.clear();
      this.eventSubscriptions.clear();
      this.dependencyGraph.clear();
      this.initializationQueue = [];
      this.isInitializing = false;

      // Clear middleware
      if (this.eventMiddleware) {
        this.eventMiddleware = [];
      }

      this.logger.info('ComponentCommunication cleanup completed');
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentCommunication.cleanup' });
      this.logger.error('ComponentCommunication cleanup failed', { error: error.message });
    } finally {
      await super.cleanup();
    }
  }
}

// Export a singleton instance for direct use where DI is not yet fully integrated
export const componentCommunication = new ComponentCommunication(
  // These will be injected properly when used with DI container
  null, // eventBus
  errorBoundary,
  null, // errorRecoveryService
  null  // memoryManager
);