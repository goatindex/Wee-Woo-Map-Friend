/**
 * @module modules/ComponentLifecycleManager
 * Component lifecycle management system for WeeWoo Map Friend
 * Manages component initialization, dependencies, health monitoring, and cleanup
 *
 * @fileoverview Component lifecycle management service for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { IEventBus } from './DependencyContainer.js';
import { BaseService } from './BaseService.js';
import { logger } from './StructuredLogger.js';
import { errorBoundary } from './ErrorBoundary.js';
import { Component, ComponentStatus } from './ComponentCommunication.js';

/**
 * @interface IComponentLifecycleManager
 * Defines the interface for the ComponentLifecycleManager service.
 */
export interface IComponentLifecycleManager {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  registerComponent(component: Component): void;
  unregisterComponent(componentId: string): void;
  initializeComponent(componentId: string): Promise<void>;
  initializeAllComponents(): Promise<void>;
  destroyComponent(componentId: string): Promise<void>;
  destroyAllComponents(): Promise<void>;
  getComponentHealth(componentId: string): 'healthy' | 'degraded' | 'unhealthy' | null;
  getAllComponentHealth(): Map<string, 'healthy' | 'degraded' | 'unhealthy'>;
  getDependencyChain(componentId: string): string[];
  validateDependencies(componentId: string): { valid: boolean; missing: string[]; circular: string[] };
  startHealthMonitoring(): void;
  stopHealthMonitoring(): void;
  getLifecycleStatus(): LifecycleStatus;
}

/**
 * @interface LifecycleStatus
 * Represents the overall lifecycle status of all components.
 */
export interface LifecycleStatus {
  totalComponents: number;
  initializedComponents: number;
  readyComponents: number;
  errorComponents: number;
  destroyedComponents: number;
  healthyComponents: number;
  degradedComponents: number;
  unhealthyComponents: number;
  initializationInProgress: boolean;
  healthMonitoringActive: boolean;
  lastHealthCheck: number;
}

/**
 * @class ComponentLifecycleManager
 * @implements {IComponentLifecycleManager}
 * Manages the complete lifecycle of components including initialization, health monitoring, and cleanup.
 */
@injectable()
export class ComponentLifecycleManager extends BaseService implements IComponentLifecycleManager {
  private components: Map<string, Component> = new Map();
  private componentStatuses: Map<string, ComponentStatus> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();
  private initializationQueue: string[] = [];
  private isInitializing: boolean = false;
  private healthMonitoringInterval: number | null = null;
  private healthCheckInterval: number = 30000; // 30 seconds
  private lastHealthCheck: number = 0;

  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.ErrorBoundary) private errorBoundary: typeof errorBoundary
  ) {
    super();
    this.logger = logger.createChild({ module: 'ComponentLifecycleManager' });
  }

  /**
   * Initializes the ComponentLifecycleManager service.
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await super.initialize();
    this.logger.info('ComponentLifecycleManager initialized');
  }

  /**
   * Registers a component with the lifecycle manager.
   * @param {Component} component - The component to register.
   */
  registerComponent(component: Component): void {
    if (this.components.has(component.id)) {
      this.logger.warn('Component already registered', { componentId: component.id });
      return;
    }

    try {
      // Register component
      this.components.set(component.id, component);
      
      // Initialize component status
      const status: ComponentStatus = {
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

      // Update dependency graphs
      this.updateDependencyGraphs(component.id, component.dependencies || []);

      // Add to initialization queue
      this.initializationQueue.push(component.id);

      this.logger.info('Component registered with lifecycle manager', {
        componentId: component.id,
        componentName: component.name,
        componentType: component.type,
        dependencies: component.dependencies || [],
        totalComponents: this.components.size
      });

      // Emit component registered event
      this.eventBus.emit('lifecycle:component:registered', {
        componentId: component.id,
        component: component,
        totalComponents: this.components.size
      });

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.registerComponent', 
        componentId: component.id 
      });
      this.logger.error('Failed to register component with lifecycle manager', { 
        componentId: component.id, 
        error: error.message 
      });
    }
  }

  /**
   * Unregisters a component from the lifecycle manager.
   * @param {string} componentId - The ID of the component to unregister.
   */
  unregisterComponent(componentId: string): void {
    if (!this.components.has(componentId)) {
      this.logger.warn('Component not found for unregistration', { componentId });
      return;
    }

    try {
      const component = this.components.get(componentId)!;
      
      // Destroy component first
      this.destroyComponent(componentId).catch(error => {
        this.errorBoundary.catch(error, { 
          context: 'ComponentLifecycleManager.unregisterComponent.destroy', 
          componentId 
        });
      });

      // Remove from maps
      this.components.delete(componentId);
      this.componentStatuses.delete(componentId);
      this.dependencyGraph.delete(componentId);
      this.reverseDependencyGraph.delete(componentId);

      // Remove from initialization queue
      const queueIndex = this.initializationQueue.indexOf(componentId);
      if (queueIndex > -1) {
        this.initializationQueue.splice(queueIndex, 1);
      }

      this.logger.info('Component unregistered from lifecycle manager', {
        componentId,
        componentName: component.name,
        totalComponents: this.components.size
      });

      // Emit component unregistered event
      this.eventBus.emit('lifecycle:component:unregistered', {
        componentId,
        totalComponents: this.components.size
      });

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.unregisterComponent', 
        componentId 
      });
      this.logger.error('Failed to unregister component from lifecycle manager', { 
        componentId, 
        error: error.message 
      });
    }
  }

  /**
   * Initializes a specific component.
   * @param {string} componentId - The component ID to initialize.
   * @returns {Promise<void>}
   */
  async initializeComponent(componentId: string): Promise<void> {
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
      this.logger.info('Initializing component', { 
        componentId, 
        componentName: component.name 
      });
      
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
      this.eventBus.emit('lifecycle:component:ready', {
        componentId,
        component: component,
        status: status
      });

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.initializeComponent', 
        componentId 
      });
      
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
      this.eventBus.emit('lifecycle:component:error', {
        componentId,
        component: component,
        error: error,
        status: status
      });

      throw error;
    }
  }

  /**
   * Initializes all components in dependency order.
   * @returns {Promise<void>}
   */
  async initializeAllComponents(): Promise<void> {
    if (this.isInitializing) {
      this.logger.warn('Component initialization already in progress');
      return;
    }

    this.isInitializing = true;
    this.logger.info('Initializing all components', { 
      queueLength: this.initializationQueue.length,
      totalComponents: this.components.size
    });

    try {
      // Sort components by dependency order
      const sortedComponents = this.topologicalSort(this.initializationQueue);
      
      // Initialize components in dependency order
      for (const componentId of sortedComponents) {
        await this.initializeComponent(componentId);
      }

      this.initializationQueue = [];
      this.logger.info('All components initialized', { 
        initializedCount: sortedComponents.length,
        totalComponents: this.components.size
      });

      // Start health monitoring
      this.startHealthMonitoring();

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.initializeAllComponents' 
      });
      this.logger.error('Failed to initialize all components', { error: error.message });
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Destroys a specific component.
   * @param {string} componentId - The component ID to destroy.
   * @returns {Promise<void>}
   */
  async destroyComponent(componentId: string): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      this.logger.warn('Component not found for destruction', { componentId });
      return;
    }

    const status = this.componentStatuses.get(componentId);
    if (!status) {
      this.logger.warn('Component status not found for destruction', { componentId });
      return;
    }

    try {
      this.logger.info('Destroying component', { 
        componentId, 
        componentName: component.name 
      });
      
      // Update status to destroyed
      status.status = 'destroyed';
      status.lastActivity = Date.now();

      // Destroy component
      component.destroy();

      this.logger.info('Component destroyed successfully', { 
        componentId, 
        componentName: component.name
      });

      // Emit component destroyed event
      this.eventBus.emit('lifecycle:component:destroyed', {
        componentId,
        component: component,
        status: status
      });

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.destroyComponent', 
        componentId 
      });
      this.logger.error('Component destruction failed', { 
        componentId, 
        componentName: component.name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Destroys all components.
   * @returns {Promise<void>}
   */
  async destroyAllComponents(): Promise<void> {
    this.logger.info('Destroying all components', { totalComponents: this.components.size });

    try {
      // Stop health monitoring
      this.stopHealthMonitoring();

      // Destroy all components
      const destroyPromises = Array.from(this.components.keys()).map(componentId => 
        this.destroyComponent(componentId).catch(error => {
          this.errorBoundary.catch(error, { 
            context: 'ComponentLifecycleManager.destroyAllComponents', 
            componentId 
          });
        })
      );

      await Promise.allSettled(destroyPromises);

      this.logger.info('All components destroyed');

    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: 'ComponentLifecycleManager.destroyAllComponents' 
      });
      this.logger.error('Failed to destroy all components', { error: error.message });
      throw error;
    }
  }

  /**
   * Gets the health status of a specific component.
   * @param {string} componentId - The component ID.
   * @returns {'healthy' | 'degraded' | 'unhealthy' | null} The health status or null if not found.
   */
  getComponentHealth(componentId: string): 'healthy' | 'degraded' | 'unhealthy' | null {
    const status = this.componentStatuses.get(componentId);
    return status ? status.health : null;
  }

  /**
   * Gets the health status of all components.
   * @returns {Map<string, 'healthy' | 'degraded' | 'unhealthy'>} Map of component ID to health status.
   */
  getAllComponentHealth(): Map<string, 'healthy' | 'degraded' | 'unhealthy'> {
    const healthMap = new Map<string, 'healthy' | 'degraded' | 'unhealthy'>();
    
    this.componentStatuses.forEach((status, componentId) => {
      healthMap.set(componentId, status.health);
    });

    return healthMap;
  }

  /**
   * Gets the dependency chain for a component.
   * @param {string} componentId - The component ID.
   * @returns {string[]} Array of component IDs in dependency order.
   */
  getDependencyChain(componentId: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const dependencies = this.dependencyGraph.get(id) || new Set();
      for (const depId of dependencies) {
        visit(depId);
      }
      result.push(id);
    };

    visit(componentId);
    return result;
  }

  /**
   * Validates dependencies for a component.
   * @param {string} componentId - The component ID.
   * @returns {{ valid: boolean; missing: string[]; circular: string[] }} Validation result.
   */
  validateDependencies(componentId: string): { valid: boolean; missing: string[]; circular: string[] } {
    const missing: string[] = [];
    const circular: string[] = [];
    
    const dependencies = this.dependencyGraph.get(componentId) || new Set();
    
    // Check for missing dependencies
    for (const depId of dependencies) {
      if (!this.components.has(depId)) {
        missing.push(depId);
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const hasCircularDependency = (id: string): boolean => {
      if (visiting.has(id)) {
        circular.push(id);
        return true;
      }
      if (visited.has(id)) return false;
      
      visiting.add(id);
      const deps = this.dependencyGraph.get(id) || new Set();
      for (const depId of deps) {
        if (hasCircularDependency(depId)) {
          return true;
        }
      }
      visiting.delete(id);
      visited.add(id);
      return false;
    };

    hasCircularDependency(componentId);

    return {
      valid: missing.length === 0 && circular.length === 0,
      missing,
      circular
    };
  }

  /**
   * Starts health monitoring for all components.
   */
  startHealthMonitoring(): void {
    if (this.healthMonitoringInterval) {
      this.logger.warn('Health monitoring already active');
      return;
    }

    this.logger.info('Starting component health monitoring', { 
      interval: this.healthCheckInterval 
    });

    this.healthMonitoringInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stops health monitoring.
   */
  stopHealthMonitoring(): void {
    if (this.healthMonitoringInterval) {
      clearInterval(this.healthMonitoringInterval);
      this.healthMonitoringInterval = null;
      this.logger.info('Component health monitoring stopped');
    }
  }

  /**
   * Performs a health check on all components.
   * @private
   */
  private performHealthCheck(): void {
    this.lastHealthCheck = Date.now();
    const healthStatuses = new Map<string, 'healthy' | 'degraded' | 'unhealthy'>();
    
    this.components.forEach((component, componentId) => {
      try {
        const isHealthy = component.isHealthy();
        const isReady = component.isReady();
        
        let health: 'healthy' | 'degraded' | 'unhealthy';
        if (isHealthy && isReady) {
          health = 'healthy';
        } else if (isReady) {
          health = 'degraded';
        } else {
          health = 'unhealthy';
        }
        
        healthStatuses.set(componentId, health);
        
        // Update component status
        const status = this.componentStatuses.get(componentId);
        if (status) {
          status.health = health;
          status.lastActivity = Date.now();
        }
        
      } catch (error) {
        this.errorBoundary.catch(error, { 
          context: 'ComponentLifecycleManager.performHealthCheck', 
          componentId 
        });
        healthStatuses.set(componentId, 'unhealthy');
      }
    });

    this.logger.debug('Health check completed', { 
      totalComponents: this.components.size,
      healthyCount: Array.from(healthStatuses.values()).filter(h => h === 'healthy').length,
      degradedCount: Array.from(healthStatuses.values()).filter(h => h === 'degraded').length,
      unhealthyCount: Array.from(healthStatuses.values()).filter(h => h === 'unhealthy').length
    });

    // Emit health check event
    this.eventBus.emit('lifecycle:health:check', {
      healthStatuses: Object.fromEntries(healthStatuses),
      totalComponents: this.components.size,
      timestamp: this.lastHealthCheck
    });
  }

  /**
   * Gets the overall lifecycle status.
   * @returns {LifecycleStatus} Current lifecycle status.
   */
  getLifecycleStatus(): LifecycleStatus {
    const totalComponents = this.components.size;
    let initializedComponents = 0;
    let readyComponents = 0;
    let errorComponents = 0;
    let destroyedComponents = 0;
    let healthyComponents = 0;
    let degradedComponents = 0;
    let unhealthyComponents = 0;

    this.componentStatuses.forEach(status => {
      switch (status.status) {
        case 'initializing':
          initializedComponents++;
          break;
        case 'ready':
          readyComponents++;
          break;
        case 'error':
          errorComponents++;
          break;
        case 'destroyed':
          destroyedComponents++;
          break;
      }

      switch (status.health) {
        case 'healthy':
          healthyComponents++;
          break;
        case 'degraded':
          degradedComponents++;
          break;
        case 'unhealthy':
          unhealthyComponents++;
          break;
      }
    });

    return {
      totalComponents,
      initializedComponents,
      readyComponents,
      errorComponents,
      destroyedComponents,
      healthyComponents,
      degradedComponents,
      unhealthyComponents,
      initializationInProgress: this.isInitializing,
      healthMonitoringActive: this.healthMonitoringInterval !== null,
      lastHealthCheck: this.lastHealthCheck
    };
  }

  /**
   * Updates dependency graphs for a component.
   * @private
   * @param {string} componentId - The component ID.
   * @param {string[]} dependencies - The component dependencies.
   */
  private updateDependencyGraphs(componentId: string, dependencies: string[]): void {
    // Update forward dependency graph
    this.dependencyGraph.set(componentId, new Set(dependencies));
    
    // Update reverse dependency graph
    dependencies.forEach(depId => {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set());
      }
      this.reverseDependencyGraph.get(depId)!.add(componentId);
    });
  }

  /**
   * Performs topological sort of components based on dependencies.
   * @private
   * @param {string[]} componentIds - The component IDs to sort.
   * @returns {string[]} Sorted component IDs.
   */
  private topologicalSort(componentIds: string[]): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (componentId: string): void => {
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
   * Cleans up the ComponentLifecycleManager service.
   * @returns {Promise<void>}
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up ComponentLifecycleManager');

    try {
      // Stop health monitoring
      this.stopHealthMonitoring();

      // Destroy all components
      await this.destroyAllComponents();

      // Clear all maps
      this.components.clear();
      this.componentStatuses.clear();
      this.dependencyGraph.clear();
      this.reverseDependencyGraph.clear();
      this.initializationQueue = [];
      this.isInitializing = false;

      this.logger.info('ComponentLifecycleManager cleanup completed');
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ComponentLifecycleManager.cleanup' });
      this.logger.error('ComponentLifecycleManager cleanup failed', { error: error.message });
    } finally {
      await super.cleanup();
    }
  }
}

// Export a singleton instance for direct use where DI is not yet fully integrated
export const componentLifecycleManager = new ComponentLifecycleManager(
  // These will be injected properly when used with DI container
  null as any, // eventBus
  errorBoundary
);
