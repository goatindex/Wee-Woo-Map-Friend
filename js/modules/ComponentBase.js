/**
 * @module modules/ComponentBase
 * Base class for all UI components in the WeeWoo Map Friend application
 * Provides common functionality for lifecycle management, event handling, and state management
 */

import { EventBus } from './EventBus.js';

/**
 * @class ComponentBase
 * @extends EventBus
 * Base class that all UI components should extend
 * Provides standardized lifecycle, event handling, and state management
 */
export class ComponentBase extends EventBus {
  /**
   * @param {HTMLElement|string} container - DOM element or selector where component will be rendered
   * @param {Object} options - Configuration options for the component
   */
  constructor(container, options = {}) {
    super();
    
    // Set up container
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!this.container) {
      throw new Error(`ComponentBase: Container not found - ${container}`);
    }
    
    // Merge options with defaults
    this.options = { ...this.defaultOptions, ...options };
    
    // Component state
    this.state = {};
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Bind methods to maintain context
    this.destroy = this.destroy.bind(this);
    this.render = this.render.bind(this);
    this.update = this.update.bind(this);
    
    // Add component reference to container
    this.container._component = this;
    
    console.log(`ComponentBase: ${this.constructor.name} created`);
  }
  
  /**
   * Default options for the component - override in subclasses
   * @returns {Object} Default configuration options
   */
  get defaultOptions() {
    return {
      autoInit: true,
      className: 'component',
      enableLogging: true
    };
  }
  
  /**
   * Register an event listener (wrapper to only pass data, not event name)
   * @param {string} event - Event name  
   * @param {Function} handler - Event handler
   * @param {Object} options - Listener options
   * @returns {Symbol} Listener ID for removal
   */
  on(event, handler, options = {}) {
    // Wrap handler to only pass data, not eventName
    const wrappedHandler = (data, eventName) => handler(data);
    return super.on(event, wrappedHandler, options);
  }
  
  /**
   * Initialize the component
   * Called automatically if autoInit is true, or manually
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized || this.isDestroyed) {
      return;
    }
    
    try {
      this.log('Initializing component');
      
      // Pre-initialization hook
      await this.beforeInit();
      
      // Create DOM structure
      await this.render();
      
      // Attach event listeners
      this.attachEvents();
      
      // Post-initialization hook
      await this.afterInit();
      
      this.isInitialized = true;
      this.emit('component:initialized', { component: this });
      
      this.log('Component initialized successfully');
      
    } catch (error) {
      console.error(`ComponentBase: Failed to initialize ${this.constructor.name}:`, error);
      this.emit('component:error', { component: this, error });
      throw error;
    }
  }
  
  /**
   * Hook called before initialization
   * Override in subclasses for pre-init setup
   * @returns {Promise<void>}
   */
  async beforeInit() {
    // Override in subclasses
  }
  
  /**
   * Hook called after initialization
   * Override in subclasses for post-init setup
   * @returns {Promise<void>}
   */
  async afterInit() {
    // Override in subclasses
  }
  
  /**
   * Render the component's DOM structure
   * Must be implemented by subclasses
   * @returns {Promise<void>}
   */
  async render() {
    throw new Error(`ComponentBase: render() method must be implemented in ${this.constructor.name}`);
  }
  
  /**
   * Attach event listeners
   * Override in subclasses to add component-specific events
   */
  attachEvents() {
    // Override in subclasses
  }
  
  /**
   * Update the component with new data or state
   * @param {Object} newState - New state to merge with current state
   * @returns {Promise<void>}
   */
  async update(newState = {}) {
    if (this.isDestroyed) {
      return;
    }
    
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    this.emit('component:stateChange', { 
      component: this, 
      oldState, 
      newState: this.state 
    });
    
    // Re-render if needed
    await this.onStateChange(oldState, this.state);
  }
  
  /**
   * Handle state changes
   * Override in subclasses to respond to state updates
   * @param {Object} _oldState - Previous state
   * @param {Object} _newState - Current state
   * @returns {Promise<void>}
   */
  async onStateChange(_oldState, _newState) {
    // Override in subclasses
  }
  
  /**
   * Show the component
   */
  show() {
    if (this.container) {
      this.container.hidden = false;
      this.container.style.display = '';
      this.emit('component:shown', { component: this });
    }
  }
  
  /**
   * Hide the component
   */
  hide() {
    if (this.container) {
      this.container.hidden = true;
      this.emit('component:hidden', { component: this });
    }
  }
  
  /**
   * Toggle component visibility
   * @returns {boolean} New visibility state
   */
  toggle() {
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
  isVisible() {
    return this.container && !this.container.hidden;
  }
  
  /**
   * Find elements within the component
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} First matching element
   */
  find(selector) {
    return this.container ? this.container.querySelector(selector) : null;
  }
  
  /**
   * Find all elements within the component
   * @param {string} selector - CSS selector
   * @returns {NodeList} All matching elements
   */
  findAll(selector) {
    return this.container ? this.container.querySelectorAll(selector) : [];
  }
  
  /**
   * Add CSS class to container
   * @param {string} className - Class name to add
   */
  addClass(className) {
    if (this.container) {
      this.container.classList.add(className);
    }
  }
  
  /**
   * Remove CSS class from container
   * @param {string} className - Class name to remove
   */
  removeClass(className) {
    if (this.container) {
      this.container.classList.remove(className);
    }
  }
  
  /**
   * Toggle CSS class on container
   * @param {string} className - Class name to toggle
   * @returns {boolean} New class state
   */
  toggleClass(className) {
    if (this.container) {
      return this.container.classList.toggle(className);
    }
    return false;
  }
  
  /**
   * Log message if logging is enabled
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  log(message, ...args) {
    if (this.options.enableLogging) {
      console.log(`[${this.constructor.name}]`, message, ...args);
    }
  }
  
  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }
    
    this.log('Destroying component');
    
    // Remove event listeners
    this.removeAllListeners();
    
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
    
    this.emit('component:destroyed', { component: this });
    
    this.log('Component destroyed');
  }
  
  /**
   * Static method to create and initialize a component
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Component options
   * @returns {Promise<ComponentBase>} Initialized component instance
   */
  static async create(container, options = {}) {
    const component = new this(container, options);
    
    if (options.autoInit !== false) {
      await component.init();
    }
    
    return component;
  }
  
  /**
   * Static method to find component instance from DOM element
   * @param {HTMLElement} element - DOM element
   * @returns {ComponentBase|null} Component instance if found
   */
  static fromElement(element) {
    return element && element._component ? element._component : null;
  }
}
