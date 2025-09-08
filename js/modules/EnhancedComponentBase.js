/**
 * @module modules/EnhancedComponentBase
 * Enhanced base class for all UI components in the WeeWoo Map Friend application
 * Integrates with the new component communication system and provides advanced lifecycle management
 *
 * @fileoverview Enhanced component base class for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { IEventBus, IStateManager } from './DependencyContainer.js';
import { BaseService } from './BaseService.js';
import { logger } from './StructuredLogger.js';
import { errorBoundary } from './ErrorBoundary.js';
import { Component, ComponentStatus } from './ComponentCommunication.js';
import { ARIAService } from './ARIAService.js';

/**
 * @interface IEnhancedComponent
 * Defines the interface for enhanced components.
 */
export interface IEnhancedComponent extends Component {
  container: HTMLElement;
  options: Record<string, any>;
  state: Record<string, any>;
  isInitialized: boolean;
  isDestroyed: boolean;
  render(): Promise<void>;
  attachEvents(): void;
  onStateChange(oldState: Record<string, any>, newState: Record<string, any>): Promise<void>;
  show(): void;
  hide(): void;
  toggle(): boolean;
  isVisible(): boolean;
  find(selector: string): HTMLElement | null;
  findAll(selector: string): NodeList;
  addClass(className: string): void;
  removeClass(className: string): void;
  toggleClass(className: string): boolean;
  update(newState?: Record<string, any>): Promise<void>;
  refresh(): Promise<void>;
  destroy(): void;
}

/**
 * @class EnhancedComponentBase
 * @extends BaseService
 * @implements {IEnhancedComponent}
 * Enhanced base class that all UI components should extend
 * Provides standardized lifecycle, event handling, state management, and communication
 */
@injectable()
export class EnhancedComponentBase extends BaseService implements IEnhancedComponent {
  // Component identification
  public id: string;
  public name: string;
  public type: string;
  public status: ComponentStatus;
  public dependencies: string[] = [];
  public events: Set<string> = new Set();

  // Component state
  public container: HTMLElement;
  public options: Record<string, any>;
  public state: Record<string, any> = {};
  public isInitialized: boolean = false;
  public isDestroyed: boolean = false;

  // Event handlers storage
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private boundMethods: Map<string, Function> = new Map();

  constructor(
    container: HTMLElement | string,
    options: Record<string, any> = {},
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.StateManager) private stateManager: IStateManager,
    @inject(TYPES.ErrorBoundary) private errorBoundary: typeof errorBoundary,
    @inject(TYPES.ARIAService) private ariaService: ARIAService
  ) {
    super();
    
    // Set up container
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      throw new Error(`EnhancedComponentBase: Container not found - ${container}`);
    }
    
    // Generate unique ID if not provided
    this.id = options.id || `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = options.name || this.constructor.name;
    this.type = options.type || 'component';
    
    // Merge options with defaults
    this.options = { ...this.defaultOptions, ...options };
    
    // Initialize component status
    this.status = {
      id: this.id,
      name: this.name,
      type: this.type,
      status: 'initializing',
      health: 'healthy',
      dependencies: this.dependencies,
      events: Array.from(this.events),
      lastActivity: Date.now(),
      errorCount: 0,
      metadata: {}
    };

    // Create module-specific logger
    this.logger = logger.createChild({ 
      module: this.constructor.name,
      componentId: this.id 
    });
    
    // Bind methods to maintain context
    this.bindMethods();
    
    // Add component reference to container
    this.container._component = this;
    
    this.logger.info('Enhanced component created', {
      componentId: this.id,
      componentName: this.name,
      componentType: this.type,
      container: this.container.tagName,
      options: this.options
    });
  }

  /**
   * Default options for the component - override in subclasses
   * @returns {Object} Default configuration options
   */
  get defaultOptions() {
    return {
      autoInit: true,
      className: 'component',
      enableLogging: true,
      enableARIA: true,
      enableKeyboardNavigation: true,
      enableFocusManagement: true,
      enableErrorBoundary: true,
      enableStatePersistence: false,
      statePersistenceKey: null
    };
  }

  /**
   * Binds methods to maintain context
   * @private
   */
  private bindMethods(): void {
    const methods = [
      'init', 'render', 'attachEvents', 'update', 'onStateChange',
      'show', 'hide', 'toggle', 'isVisible', 'find', 'findAll',
      'addClass', 'removeClass', 'toggleClass', 'refresh', 'destroy',
      'emit', 'on', 'off', 'isReady', 'isHealthy', 'getStatus'
    ];

    methods.forEach(method => {
      if (typeof this[method] === 'function') {
        this.boundMethods.set(method, this[method].bind(this));
      }
    });
  }

  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) {
      this.logger.warn('Component already initialized or destroyed', {
        componentId: this.id,
        isInitialized: this.isInitialized,
        isDestroyed: this.isDestroyed
      });
      return;
    }
    
    const timer = this.logger.time(`component-init-${this.id}`);
    try {
      this.logger.info('Initializing enhanced component', {
        componentId: this.id,
        componentName: this.name,
        componentType: this.type
      });
      
      // Update status
      this.status.status = 'initializing';
      this.status.lastActivity = Date.now();
      
      // Pre-initialization hook
      await this.beforeInit();
      
      // Create DOM structure
      await this.render();
      
      // Attach event listeners
      this.attachEvents();
      
      // Set up ARIA attributes if enabled
      if (this.options.enableARIA) {
        this.setupARIA();
      }
      
      // Set up keyboard navigation if enabled
      if (this.options.enableKeyboardNavigation) {
        this.setupKeyboardNavigation();
      }
      
      // Set up focus management if enabled
      if (this.options.enableFocusManagement) {
        this.setupFocusManagement();
      }
      
      // Set up error boundary if enabled
      if (this.options.enableErrorBoundary) {
        this.setupErrorBoundary();
      }
      
      // Load persisted state if enabled
      if (this.options.enableStatePersistence && this.options.statePersistenceKey) {
        this.loadPersistedState();
      }
      
      // Post-initialization hook
      await this.afterInit();
      
      this.isInitialized = true;
      this.status.status = 'ready';
      this.status.health = 'healthy';
      this.status.lastActivity = Date.now();
      
      // Emit component initialized event
      this.emit('component:initialized', { 
        component: this,
        componentId: this.id,
        componentName: this.name
      });
      
      // Emit on global event bus
      this.eventBus.emit('component:initialized', {
        componentId: this.id,
        component: this,
        status: this.status
      });
      
      timer.end({
        success: true,
        componentId: this.id,
        componentName: this.name
      });
      
      this.logger.info('Enhanced component initialized successfully', {
        componentId: this.id,
        componentName: this.name,
        isReady: this.isReady(),
        isHealthy: this.isHealthy()
      });
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        componentId: this.id
      });
      
      this.status.status = 'error';
      this.status.health = 'unhealthy';
      this.status.errorCount++;
      this.status.lastError = error.message;
      this.status.lastActivity = Date.now();
      
      this.errorBoundary.catch(error, { 
        context: `EnhancedComponentBase.init:${this.id}`,
        componentId: this.id,
        componentName: this.name
      });
      
      this.logger.error('Enhanced component initialization failed', {
        componentId: this.id,
        componentName: this.name,
        error: error.message,
        stack: error.stack
      });
      
      // Emit component error event
      this.emit('component:error', { 
        component: this, 
        error,
        componentId: this.id
      });
      
      this.eventBus.emit('component:error', {
        componentId: this.id,
        component: this,
        error: error,
        status: this.status
      });
      
      throw error;
    }
  }

  /**
   * Hook called before initialization
   * Override in subclasses for pre-init setup
   * @returns {Promise<void>}
   */
  async beforeInit(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Hook called after initialization
   * Override in subclasses for post-init setup
   * @returns {Promise<void>}
   */
  async afterInit(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Render the component's DOM structure
   * Must be implemented by subclasses
   * @returns {Promise<void>}
   */
  async render(): Promise<void> {
    throw new Error(`EnhancedComponentBase: render() method must be implemented in ${this.constructor.name}`);
  }

  /**
   * Attach event listeners
   * Override in subclasses to add component-specific events
   */
  attachEvents(): void {
    // Override in subclasses
  }

  /**
   * Set up ARIA attributes for accessibility
   * @private
   */
  private setupARIA(): void {
    if (!this.container || !this.ariaService) return;

    // Set basic ARIA attributes
    this.container.setAttribute('role', this.options.role || 'region');
    this.container.setAttribute('aria-label', this.options.ariaLabel || this.name);
    
    if (this.options.ariaDescribedBy) {
      this.container.setAttribute('aria-describedby', this.options.ariaDescribedBy);
    }
    
    if (this.options.ariaLabelledBy) {
      this.container.setAttribute('aria-labelledby', this.options.ariaLabelledBy);
    }

    // Use ARIAService for advanced accessibility features
    if (this.options.ariaLive) {
      this.container.setAttribute('aria-live', this.options.ariaLive);
    }

    if (this.options.ariaAtomic) {
      this.container.setAttribute('aria-atomic', this.options.ariaAtomic);
    }

    // Announce component initialization
    this.ariaService.announce(`${this.name} component initialized`, 'polite');

    this.logger.debug('ARIA attributes set up', {
      componentId: this.id,
      role: this.container.getAttribute('role'),
      ariaLabel: this.container.getAttribute('aria-label')
    });
  }

  /**
   * Set up keyboard navigation
   * @private
   */
  private setupKeyboardNavigation(): void {
    if (!this.container) return;

    // Add keyboard event listener
    this.container.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // Make container focusable if it's not already
    if (!this.container.hasAttribute('tabindex')) {
      this.container.setAttribute('tabindex', '0');
    }

    this.logger.debug('Keyboard navigation set up', { componentId: this.id });
  }

  /**
   * Handle keyboard navigation
   * @private
   * @param {KeyboardEvent} event - The keyboard event
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    // Override in subclasses for specific keyboard handling
    // Default implementation handles basic navigation
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleActivation();
        break;
      case 'Escape':
        event.preventDefault();
        this.handleEscape();
        break;
    }
  }

  /**
   * Handle component activation (Enter/Space)
   * Override in subclasses
   * @protected
   */
  protected handleActivation(): void {
    this.emit('component:activated', { component: this });
  }

  /**
   * Handle escape key
   * Override in subclasses
   * @protected
   */
  protected handleEscape(): void {
    this.emit('component:escape', { component: this });
  }

  /**
   * Set up focus management
   * @private
   */
  private setupFocusManagement(): void {
    if (!this.container) return;

    // Track focus events
    this.container.addEventListener('focus', this.handleFocus.bind(this));
    this.container.addEventListener('blur', this.handleBlur.bind(this));
    this.container.addEventListener('focusin', this.handleFocusIn.bind(this));
    this.container.addEventListener('focusout', this.handleFocusOut.bind(this));

    this.logger.debug('Focus management set up', { componentId: this.id });
  }

  /**
   * Handle focus events
   * @private
   */
  private handleFocus(event: FocusEvent): void {
    this.emit('component:focused', { component: this, event });
  }

  /**
   * Handle blur events
   * @private
   */
  private handleBlur(event: FocusEvent): void {
    this.emit('component:blurred', { component: this, event });
  }

  /**
   * Handle focus in events
   * @private
   */
  private handleFocusIn(event: FocusEvent): void {
    this.emit('component:focusIn', { component: this, event });
  }

  /**
   * Handle focus out events
   * @private
   */
  private handleFocusOut(event: FocusEvent): void {
    this.emit('component:focusOut', { component: this, event });
  }

  /**
   * Set up error boundary
   * @private
   */
  private setupErrorBoundary(): void {
    // Wrap critical methods with error boundary
    const originalRender = this.render.bind(this);
    this.render = async () => {
      try {
        await originalRender();
      } catch (error) {
        this.errorBoundary.catch(error, { 
          context: `EnhancedComponentBase.render:${this.id}`,
          componentId: this.id
        });
        throw error;
      }
    };
  }

  /**
   * Load persisted state
   * @private
   */
  private loadPersistedState(): void {
    if (!this.options.statePersistenceKey) return;

    try {
      const persistedState = localStorage.getItem(this.options.statePersistenceKey);
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        this.state = { ...this.state, ...parsedState };
        this.logger.debug('Persisted state loaded', {
          componentId: this.id,
          stateKeys: Object.keys(parsedState)
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load persisted state', {
        componentId: this.id,
        error: error.message
      });
    }
  }

  /**
   * Save state to persistence
   * @private
   */
  private savePersistedState(): void {
    if (!this.options.statePersistenceKey) return;

    try {
      localStorage.setItem(this.options.statePersistenceKey, JSON.stringify(this.state));
      this.logger.debug('State persisted', {
        componentId: this.id,
        stateKeys: Object.keys(this.state)
      });
    } catch (error) {
      this.logger.warn('Failed to persist state', {
        componentId: this.id,
        error: error.message
      });
    }
  }

  /**
   * Update the component with new data or state
   * @param {Object} newState - New state to merge with current state
   * @returns {Promise<void>}
   */
  async update(newState: Record<string, any> = {}): Promise<void> {
    if (this.isDestroyed) {
      this.logger.warn('Cannot update destroyed component', { componentId: this.id });
      return;
    }
    
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Save persisted state if enabled
    if (this.options.enableStatePersistence) {
      this.savePersistedState();
    }
    
    this.status.lastActivity = Date.now();
    
    this.emit('component:stateChange', { 
      component: this, 
      oldState, 
      newState: this.state,
      componentId: this.id
    });
    
    // Re-render if needed
    await this.onStateChange(oldState, this.state);
  }

  /**
   * Handle state changes
   * Override in subclasses to respond to state updates
   * @param {Object} oldState - Previous state
   * @param {Object} newState - Current state
   * @returns {Promise<void>}
   */
  async onStateChange(oldState: Record<string, any>, newState: Record<string, any>): Promise<void> {
    // Override in subclasses
  }

  /**
   * Refresh the component
   * @returns {Promise<void>}
   */
  async refresh(): Promise<void> {
    if (this.isDestroyed) {
      this.logger.warn('Cannot refresh destroyed component', { componentId: this.id });
      return;
    }

    try {
      this.logger.info('Refreshing component', { componentId: this.id });
      
      // Re-render the component
      await this.render();
      
      // Re-attach events
      this.attachEvents();
      
      this.emit('component:refreshed', { component: this, componentId: this.id });
      
      this.logger.info('Component refreshed successfully', { componentId: this.id });
    } catch (error) {
      this.errorBoundary.catch(error, { 
        context: `EnhancedComponentBase.refresh:${this.id}`,
        componentId: this.id
      });
      this.logger.error('Component refresh failed', {
        componentId: this.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Show the component
   */
  show(): void {
    if (this.container) {
      this.container.hidden = false;
      this.container.style.display = '';
      this.emit('component:shown', { component: this, componentId: this.id });
    }
  }

  /**
   * Hide the component
   */
  hide(): void {
    if (this.container) {
      this.container.hidden = true;
      this.emit('component:hidden', { component: this, componentId: this.id });
    }
  }

  /**
   * Toggle component visibility
   * @returns {boolean} New visibility state
   */
  toggle(): boolean {
    const isVisible = !this.container.hidden;
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
    return !isVisible;
  }

  /**
   * Check if component is visible
   * @returns {boolean} True if component is visible
   */
  isVisible(): boolean {
    return this.container && !this.container.hidden;
  }

  /**
   * Find elements within the component
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} First matching element
   */
  find(selector: string): HTMLElement | null {
    return this.container ? this.container.querySelector(selector) : null;
  }

  /**
   * Find all elements within the component
   * @param {string} selector - CSS selector
   * @returns {NodeList} All matching elements
   */
  findAll(selector: string): NodeList {
    return this.container ? this.container.querySelectorAll(selector) : [];
  }

  /**
   * Add CSS class to container
   * @param {string} className - Class name to add
   */
  addClass(className: string): void {
    if (this.container) {
      this.container.classList.add(className);
    }
  }

  /**
   * Remove CSS class from container
   * @param {string} className - Class name to remove
   */
  removeClass(className: string): void {
    if (this.container) {
      this.container.classList.remove(className);
    }
  }

  /**
   * Toggle CSS class on container
   * @param {string} className - Class name to toggle
   * @returns {boolean} New class state
   */
  toggleClass(className: string): boolean {
    if (this.container) {
      return this.container.classList.toggle(className);
    }
    return false;
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event: string, data?: any): void {
    this.events.add(event);
    this.status.events = Array.from(this.events);
    this.status.lastActivity = Date.now();

    // Emit to local handlers
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.errorBoundary.catch(error, { 
            context: `EnhancedComponentBase.emit:${this.id}`,
            event,
            componentId: this.id
          });
        }
      });
    }

    // Emit to global event bus
    this.eventBus.emit(event, { ...data, componentId: this.id, component: this });
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event: string, handler: Function): Function {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    this.events.add(event);
    this.status.events = Array.from(this.events);

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} [handler] - Specific handler to remove
   */
  off(event: string, handler?: Function): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    } else {
      this.eventHandlers.delete(event);
    }
  }

  /**
   * Check if component is ready
   * @returns {boolean} True if component is ready
   */
  isReady(): boolean {
    return this.isInitialized && !this.isDestroyed;
  }

  /**
   * Check if component is healthy
   * @returns {boolean} True if component is healthy
   */
  isHealthy(): boolean {
    return this.isReady() && this.status.health === 'healthy';
  }

  /**
   * Get component status
   * @returns {ComponentStatus} Current component status
   */
  getStatus(): ComponentStatus {
    return { ...this.status };
  }

  /**
   * Destroy the component and clean up resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    
    this.logger.info('Destroying enhanced component', { componentId: this.id });
    
    // Update status
    this.status.status = 'destroyed';
    this.status.lastActivity = Date.now();
    
    // Remove event listeners
    this.eventHandlers.clear();
    
    // Clean up DOM
    if (this.container) {
      // Remove component reference
      delete this.container._component;
      
      // Clear container content if we created it
      if (this.options.clearOnDestroy !== false) {
        this.container.innerHTML = '';
      }
    }
    
    // Mark as destroyed
    this.isDestroyed = true;
    this.isInitialized = false;
    
    // Emit component destroyed event
    this.emit('component:destroyed', { component: this, componentId: this.id });
    
    this.eventBus.emit('component:destroyed', {
      componentId: this.id,
      component: this,
      status: this.status
    });
    
    this.logger.info('Enhanced component destroyed', { componentId: this.id });
  }

  /**
   * Static method to create and initialize a component
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Component options
   * @returns {Promise<EnhancedComponentBase>} Initialized component instance
   */
  static async create(container: HTMLElement | string, options: Record<string, any> = {}): Promise<EnhancedComponentBase> {
    // This would need to be implemented by subclasses
    throw new Error('EnhancedComponentBase.create() must be implemented by subclasses');
  }

  /**
   * Static method to find component instance from DOM element
   * @param {HTMLElement} element - DOM element
   * @returns {EnhancedComponentBase|null} Component instance if found
   */
  static fromElement(element: HTMLElement): EnhancedComponentBase | null {
    return element && element._component ? element._component : null;
  }
}
