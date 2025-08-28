/**
 * @module modules/EventBus
 * Event system for component communication in WeeWoo Map Friend
 * Provides publish/subscribe pattern for loose coupling between components
 */

/**
 * @class EventBus
 * Simple event emitter implementation for component communication
 * Supports event namespacing, once listeners, and listener removal
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.maxListeners = 50; // Prevent memory leaks
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name (supports namespacing with ':')
   * @param {Function} listener - Event handler function
   * @param {Object} options - Listener options
   * @param {boolean} options.once - Remove listener after first call
   * @param {number} options.priority - Higher priority listeners called first
   * @returns {Function} Unsubscribe function
   */
  on(event, listener, options = {}) {
    if (typeof listener !== 'function') {
      throw new Error('EventBus: Listener must be a function');
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listeners = this.events.get(event);
    
    // Check max listeners limit
    if (listeners.length >= this.maxListeners) {
      console.warn(`EventBus: Maximum listeners (${this.maxListeners}) reached for event '${event}'`);
    }
    
    const listenerConfig = {
      fn: listener,
      once: options.once || false,
      priority: options.priority || 0,
      id: Symbol('listener')
    };
    
    // Insert based on priority (higher priority first)
    const insertIndex = listeners.findIndex(l => l.priority < listenerConfig.priority);
    if (insertIndex === -1) {
      listeners.push(listenerConfig);
    } else {
      listeners.splice(insertIndex, 0, listenerConfig);
    }
    
    // Return unsubscribe function
    return () => this.off(event, listenerConfig.id);
  }
  
  /**
   * Add a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event handler function
   * @param {Object} options - Listener options
   * @returns {Function} Unsubscribe function
   */
  once(event, listener, options = {}) {
    return this.on(event, listener, { ...options, once: true });
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function|Symbol} listener - Listener function or ID
   */
  off(event, listener) {
    if (!this.events.has(event)) {
      return;
    }
    
    const listeners = this.events.get(event);
    
    // Remove by function reference or ID
    const index = listeners.findIndex(l => 
      l.fn === listener || l.id === listener
    );
    
    if (index !== -1) {
      listeners.splice(index, 1);
      
      // Clean up empty event arrays
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    }
  }
  
  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @param {Object} options - Emission options
   * @param {boolean} options.async - Emit asynchronously
   * @returns {Promise<any[]>|any[]} Results from listeners
   */
  emit(event, data, options = {}) {
    if (!this.events.has(event)) {
      return options.async ? Promise.resolve([]) : [];
    }
    
    const listeners = this.events.get(event).slice(); // Copy to avoid mutation during iteration
    const results = [];
    const toRemove = [];
    
    // Synchronous emission
    if (!options.async) {
      for (const listenerConfig of listeners) {
        try {
          const result = listenerConfig.fn(data, event);
          results.push(result);
          
          // Mark once listeners for removal
          if (listenerConfig.once) {
            toRemove.push(listenerConfig.id);
          }
        } catch (error) {
          console.error(`EventBus: Error in listener for '${event}':`, error);
        }
      }
      
      // Remove once listeners
      toRemove.forEach(id => this.off(event, id));
      
      return results;
    }
    
    // Asynchronous emission
    return Promise.all(
      listeners.map(async (listenerConfig) => {
        try {
          const result = await listenerConfig.fn(data, event);
          
          // Mark once listeners for removal
          if (listenerConfig.once) {
            toRemove.push(listenerConfig.id);
          }
          
          return result;
        } catch (error) {
          console.error(`EventBus: Error in async listener for '${event}':`, error);
          return null;
        }
      })
    ).then(results => {
      // Remove once listeners after all promises resolve
      toRemove.forEach(id => this.off(event, id));
      return results;
    });
  }
  
  /**
   * Emit event asynchronously
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @returns {Promise<any[]>} Results from listeners
   */
  emitAsync(event, data) {
    return this.emit(event, data, { async: true });
  }
  
  /**
   * Remove all listeners for an event, or all events if no event specified
   * @param {string} [event] - Event name (optional)
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
  
  /**
   * Get all event names that have listeners
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
  
  /**
   * Check if event has listeners
   * @param {string} event - Event name
   * @returns {boolean} True if event has listeners
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
  
  /**
   * Set maximum number of listeners per event
   * @param {number} max - Maximum number of listeners
   */
  setMaxListeners(max) {
    this.maxListeners = Math.max(1, max);
  }
  
  /**
   * Create a namespaced event emitter
   * Events will be prefixed with the namespace
   * @param {string} namespace - Namespace prefix
   * @returns {Object} Namespaced event methods
   */
  namespace(namespace) {
    const prefix = `${namespace}:`;
    
    return {
      on: (event, listener, options) => this.on(prefix + event, listener, options),
      once: (event, listener, options) => this.once(prefix + event, listener, options),
      off: (event, listener) => this.off(prefix + event, listener),
      emit: (event, data, options) => this.emit(prefix + event, data, options),
      emitAsync: (event, data) => this.emitAsync(prefix + event, data)
    };
  }
}

// Global event bus instance for application-wide communication
const globalEventBus = new EventBus();

/**
 * @module modules/StateManager
 * Centralized state management for WeeWoo Map Friend application
 * Replaces window globals with a reactive state system
 */


/**
 * @class StateManager
 * @extends EventBus
 * Manages application state with reactivity and persistence
 */
class StateManager extends EventBus {
  constructor() {
    super();
    
    // Internal state storage
    this._state = {};
    this._computed = new Map();
    this._watchers = new Map();
    this._middleware = [];
    
    // Create reactive proxy
    this.state = new Proxy(this._state, {
      get: (target, property) => {
        // Return computed value if available
        if (this._computed.has(property)) {
          return this._computed.get(property).getter();
        }
        return target[property];
      },
      
      set: (target, property, value) => {
        const oldValue = target[property];
        
        // Run middleware
        for (const middleware of this._middleware) {
          const result = middleware(property, value, oldValue);
          if (result !== undefined) {
            value = result;
          }
        }
        
        // Only update if value actually changed
        if (oldValue !== value) {
          target[property] = value;
          
          // Emit state change event
          this.emit('stateChange', { 
            property, 
            value, 
            oldValue, 
            state: this._state 
          });
          
          // Emit property-specific event
          this.emit(`state:${property}`, { value, oldValue });
          
          // Run watchers
          if (this._watchers.has(property)) {
            const watchers = this._watchers.get(property);
            watchers.forEach(watcher => {
              try {
                watcher(value, oldValue);
              } catch (error) {
                console.error(`StateManager: Error in watcher for '${property}':`, error);
              }
            });
          }
          
          // Update dependent computed properties
          this._updateComputedProperties(property);
        }
        
        return true;
      },
      
      deleteProperty: (target, property) => {
        if (property in target) {
          const oldValue = target[property];
          delete target[property];
          
          this.emit('stateChange', { 
            property, 
            value: undefined, 
            oldValue, 
            state: this._state,
            action: 'delete'
          });
          
          this.emit(`state:${property}`, { value: undefined, oldValue });
        }
        return true;
      }
    });
    
    // Initialize with legacy state from window globals
    this._migrateLegacyState();
  }
  
  /**
   * Migrate existing window globals to state management
   * @private
   */
  _migrateLegacyState() {
    // Migrate existing global state
    if (typeof window !== 'undefined') {
      const legacyGlobals = [
        'map', 'featureLayers', 'layerNames', 'emphasized', 
        'pendingLabels', 'markersLayer', 'categoryMeta', 'outlineColors'
      ];
      
      legacyGlobals.forEach(globalName => {
        if (window[globalName] !== undefined) {
          this._state[globalName] = window[globalName];
        }
      });
      
      // Initialize empty structures if they don't exist
      this._state.featureLayers = this._state.featureLayers || {};
      this._state.layerNames = this._state.layerNames || {};
      this._state.emphasized = this._state.emphasized || {};
      this._state.pendingLabels = this._state.pendingLabels || [];
    }
  }
  
  /**
   * Add middleware for state changes
   * @param {Function} middleware - Middleware function (property, newValue, oldValue) => newValue
   */
  addMiddleware(middleware) {
    if (typeof middleware === 'function') {
      this._middleware.push(middleware);
    }
  }
  
  /**
   * Remove middleware
   * @param {Function} middleware - Middleware function to remove
   */
  removeMiddleware(middleware) {
    const index = this._middleware.indexOf(middleware);
    if (index !== -1) {
      this._middleware.splice(index, 1);
    }
  }
  
  /**
   * Watch for changes to a specific property
   * @param {string} property - Property name to watch
   * @param {Function} callback - Callback function (newValue, oldValue) => void
   * @returns {Function} Unwatch function
   */
  watch(property, callback) {
    if (!this._watchers.has(property)) {
      this._watchers.set(property, []);
    }
    
    this._watchers.get(property).push(callback);
    
    // Return unwatch function
    return () => {
      const watchers = this._watchers.get(property);
      if (watchers) {
        const index = watchers.indexOf(callback);
        if (index !== -1) {
          watchers.splice(index, 1);
        }
        
        // Clean up empty watcher arrays
        if (watchers.length === 0) {
          this._watchers.delete(property);
        }
      }
    };
  }
  
  /**
   * Define computed property that depends on other state
   * @param {string} name - Computed property name
   * @param {Function} getter - Function that computes the value
   * @param {string[]} dependencies - Array of state properties this depends on
   */
  computed(name, getter, dependencies = []) {
    this._computed.set(name, {
      getter,
      dependencies,
      cached: null,
      dirty: true
    });
    
    // Watch dependencies and mark as dirty when they change
    dependencies.forEach(dep => {
      this.watch(dep, () => {
        const computed = this._computed.get(name);
        if (computed) {
          computed.dirty = true;
          this.emit(`computed:${name}`, { name, value: computed.getter() });
        }
      });
    });
  }
  
  /**
   * Update computed properties when dependencies change
   * @private
   * @param {string} changedProperty - Property that changed
   */
  _updateComputedProperties(changedProperty) {
    this._computed.forEach((computed, name) => {
      if (computed.dependencies.includes(changedProperty)) {
        computed.dirty = true;
        this.emit(`computed:${name}`, { name, value: computed.getter() });
      }
    });
  }
  
  /**
   * Get current state value
   * @param {string} path - Property path (supports nested: 'user.name')
   * @param {any} defaultValue - Default value if property doesn't exist
   * @returns {any} Property value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this._state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  /**
   * Set state value
   * @param {string|Object} path - Property path or object of key-value pairs
   * @param {any} value - Value to set (ignored if path is object)
   */
  set(path, value) {
    if (typeof path === 'object') {
      // Batch update
      Object.entries(path).forEach(([key, val]) => {
        this.state[key] = val;
      });
    } else {
      // Single property update
      const keys = path.split('.');
      let current = this._state;
      
      // Navigate to parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set final property
      const finalKey = keys[keys.length - 1];
      current[finalKey] = value;
      
      // Trigger reactivity manually for nested properties
      this.emit('stateChange', { 
        property: path, 
        value, 
        oldValue: undefined, 
        state: this._state 
      });
    }
  }
  
  /**
   * Reset state to initial values
   * @param {string[]} [properties] - Specific properties to reset (optional)
   */
  reset(properties) {
    if (properties) {
      properties.forEach(prop => {
        delete this.state[prop];
      });
    } else {
      // Clear all state
      Object.keys(this._state).forEach(key => {
        delete this.state[key];
      });
      
      // Re-initialize with defaults
      this._migrateLegacyState();
    }
    
    this.emit('stateReset', { properties });
  }
  
  /**
   * Persist state to localStorage
   * @param {string} key - Storage key
   * @param {string[]} [properties] - Specific properties to persist (optional)
   */
  persist(key = 'weewoo-map-state', properties) {
    try {
      const dataToStore = properties 
        ? properties.reduce((acc, prop) => {
            if (prop in this._state) {
              acc[prop] = this._state[prop];
            }
            return acc;
          }, {})
        : this._state;
      
      localStorage.setItem(key, JSON.stringify(dataToStore));
      this.emit('statePersisted', { key, data: dataToStore });
    } catch (error) {
      console.error('StateManager: Failed to persist state:', error);
    }
  }
  
  /**
   * Restore state from localStorage
   * @param {string} key - Storage key
   * @param {boolean} merge - Whether to merge with current state (default: true)
   */
  restore(key = 'weewoo-map-state', merge = true) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        
        if (merge) {
          Object.entries(data).forEach(([prop, value]) => {
            this.state[prop] = value;
          });
        } else {
          this.reset();
          Object.entries(data).forEach(([prop, value]) => {
            this.state[prop] = value;
          });
        }
        
        this.emit('stateRestored', { key, data });
      }
    } catch (error) {
      console.error('StateManager: Failed to restore state:', error);
    }
  }
  
  /**
   * Get a snapshot of current state
   * @param {string[]} [properties] - Specific properties to include (optional)
   * @returns {Object} State snapshot
   */
  getSnapshot(properties) {
    if (properties) {
      return properties.reduce((acc, prop) => {
        if (prop in this._state) {
          acc[prop] = this._state[prop];
        }
        return acc;
      }, {});
    }
    
    return { ...this._state };
  }
}

// Create global state manager instance
const stateManager = new StateManager();

// Export convenient access to state
stateManager.state;

/**
 * @module modules/Router
 * Simple client-side router for documentation navigation
 * Handles hash-based routing for documentation pages
 */


/**
 * @class Router
 * @extends EventBus
 * Handles client-side routing for the documentation system
 */
class Router extends EventBus {
  constructor() {
    super();
    
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = 'intro';
    this.basePath = '#docs/';
    
    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    
    // Set up event listeners
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('popstate', this.handlePopState);
  }
  
  /**
   * Register a route
   * @param {string} path - Route path (without #docs/ prefix)
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      options: {
        title: options.title || path,
        description: options.description || '',
        requiresAuth: options.requiresAuth || false,
        ...options
      }
    });
  }
  
  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {Object} options - Navigation options
   * @param {boolean} options.replace - Replace current history entry
   * @param {Object} options.state - State object for history
   */
  navigate(path, options = {}) {
    const fullPath = this.basePath + path;
    
    if (options.replace) {
      window.history.replaceState(options.state || null, '', fullPath);
    } else {
      window.history.pushState(options.state || null, '', fullPath);
    }
    
    this.handleRoute(path);
  }
  
  /**
   * Handle route changes
   * @param {string} path - Route path
   * @private
   */
  async handleRoute(path) {
    const route = this.routes.get(path);
    
    if (!route) {
      // Try default route or show error
      if (path !== this.defaultRoute && this.routes.has(this.defaultRoute)) {
        this.navigate(this.defaultRoute, { replace: true });
        return;
      } else {
        this.emit('route:notFound', { path });
        return;
      }
    }
    
    // Check route requirements
    if (route.options.requiresAuth && !this.isAuthenticated()) {
      this.emit('route:unauthorized', { path, route });
      return;
    }
    
    const oldRoute = this.currentRoute;
    this.currentRoute = path;
    
    // Emit route change events
    this.emit('route:beforeChange', { from: oldRoute, to: path, route });
    
    try {
      // Execute route handler
      await route.handler(path, route.options);
      
      // Update document title if specified
      if (route.options.title) {
        document.title = `${route.options.title} - WeeWoo Map Friend Documentation`;
      }
      
      this.emit('route:changed', { from: oldRoute, to: path, route });
      
    } catch (error) {
      console.error('Router: Error handling route:', error);
      this.emit('route:error', { path, route, error });
    }
  }
  
  /**
   * Handle hash change events
   * @param {HashChangeEvent} _event - Hash change event
   * @private
   */
  handleHashChange(_event) {
    const path = this.getPathFromHash();
    if (path) {
      this.handleRoute(path);
    }
  }
  
  /**
   * Handle popstate events (back/forward buttons)
   * @param {PopStateEvent} _event - Popstate event
   * @private
   */
  handlePopState(_event) {
    const path = this.getPathFromHash();
    if (path) {
      this.handleRoute(path);
    }
  }
  
  /**
   * Extract route path from current hash
   * @returns {string|null} Route path or null if not a docs route
   * @private
   */
  getPathFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith(this.basePath)) {
      return hash.substring(this.basePath.length) || this.defaultRoute;
    }
    return null;
  }
  
  /**
   * Get current route path
   * @returns {string|null} Current route path
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
  
  /**
   * Check if user is authenticated (placeholder for future use)
   * @returns {boolean} Always true for now
   * @private
   */
  isAuthenticated() {
    return true; // No auth required currently
  }
  
  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
  
  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * Replace current route
   * @param {string} path - New route path
   */
  replace(path) {
    this.navigate(path, { replace: true });
  }
  
  /**
   * Initialize router and handle current route
   */
  init() {
    const path = this.getPathFromHash() || this.defaultRoute;
    this.handleRoute(path);
  }
  
  /**
   * Destroy router and clean up event listeners
   */
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('popstate', this.handlePopState);
    this.removeAllListeners();
  }
}

/**
 * Documentation router instance
 * Pre-configured for documentation navigation
 */
class DocsRouter extends Router {
  constructor() {
    super();
    
    // Register default documentation routes
    this.registerDefaultRoutes();
  }
  
  /**
   * Register default documentation routes
   * @private
   */
  registerDefaultRoutes() {
    const docPages = [
      { path: 'intro', title: 'Welcome', file: 'intro.md' },
      { path: 'usage', title: 'Using the App', file: 'usage.md' },
      { path: 'adding-layers', title: 'Adding Layers', file: 'adding-layers.md' },
      { path: 'layers', title: 'Layers & Categories', file: 'layers.md' },
      { path: 'troubleshooting', title: 'Troubleshooting', file: 'troubleshooting.md' }
    ];
    
    docPages.forEach(({ path, title, file }) => {
      this.register(path, async (_routePath) => {
        await this.loadDocumentation(file, title);
      }, { title });
    });
  }
  
  /**
   * Load and display documentation content
   * @param {string} filename - Markdown filename
   * @param {string} title - Page title
   * @private
   */
  async loadDocumentation(filename, title) {
    try {
      this.emit('docs:loading', { filename, title });
      
      const response = await fetch(`docs/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }
      
      const content = await response.text();
      const parsedContent = this.parseMarkdown(content);
      
      // Update content
      const contentEl = document.getElementById('docsContent');
      if (contentEl) {
        contentEl.innerHTML = parsedContent;
      }
      
      // Update navigation highlighting
      this.updateNavigation();
      
      this.emit('docs:loaded', { filename, title, content: parsedContent });
      
    } catch (error) {
      console.error('DocsRouter: Failed to load documentation:', error);
      this.emit('docs:error', { filename, title, error });
      
      // Show error content
      const contentEl = document.getElementById('docsContent');
      if (contentEl) {
        contentEl.innerHTML = `
          <h2>Error Loading Documentation</h2>
          <p>Failed to load ${filename}. Please try again later.</p>
          <p class="error-details">${error.message}</p>
        `;
      }
    }
  }
  
  /**
   * Update navigation highlighting
   * @private
   */
  updateNavigation() {
    // Remove active class from all nav links
    document.querySelectorAll('.docs-toc a[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentLink = document.querySelector(`.docs-toc a[data-doc="${this.currentRoute}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
    
    // Update mobile menu links too
    document.querySelectorAll('.docs-menu-link[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    const currentMobileLink = document.querySelector(`.docs-menu-link[data-doc="${this.currentRoute}"]`);
    if (currentMobileLink) {
      currentMobileLink.classList.add('active');
    }
  }
  
  /**
   * Basic markdown parser
   * @param {string} content - Markdown content
   * @returns {string} HTML content
   * @private
   */
  parseMarkdown(content) {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><h([1-6])>/gim, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/gim, '</h$1>');
  }
}

// Create global router instances
new Router();
const docsRouter = new DocsRouter();

/**
 * @module modules/LegacyBridge
 * Bridge between modern ES module system and legacy window-based system
 * Provides backward compatibility and progressive migration capabilities
 */

/**
 * @class LegacyBridge
 * Facilitates communication between modern and legacy systems
 */
class LegacyBridge {
  constructor() {
    this.modernComponents = new Map();
    this.legacyAdapters = new Map();
    this.migrationStatus = new Map();
    
    console.log('🌉 LegacyBridge: Initializing bridge system');
  }
  
  /**
   * Initialize the bridge system
   * @returns {Promise<void>}
   */
  async init() {
    // Expose bridge to window for legacy access
    window.LegacyBridge = this;
    
    // Set up legacy event listeners
    this.setupLegacyEventHandlers();
    
    // Initialize component migration tracking
    this.initializeMigrationTracking();
    
    console.log('🌉 LegacyBridge: Bridge initialized');
  }
  
  /**
   * Register a modern component for legacy compatibility
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   * @param {Object} legacyInterface - Legacy interface adapter
   */
  registerModernComponent(name, component, legacyInterface = {}) {
    this.modernComponents.set(name, component);
    
    // Create legacy interface
    const adapter = {
      component,
      legacyInterface,
      modernMethods: this.extractPublicMethods(component),
      legacyMethods: legacyInterface
    };
    
    this.legacyAdapters.set(name, adapter);
    
    // Expose to window for legacy access
    window[name] = this.createLegacyWrapper(adapter);
    
    console.log(`🌉 LegacyBridge: Registered modern component '${name}' with legacy interface`);
  }
  
  /**
   * Create a legacy-compatible wrapper for a modern component
   * @param {Object} adapter - Component adapter
   * @returns {Object} Legacy wrapper
   */
  createLegacyWrapper(adapter) {
    const { component, legacyInterface, modernMethods } = adapter;
    
    const wrapper = {
      // Expose modern component reference
      _modernComponent: component,
      
      // Legacy initialization method
      init: legacyInterface.init || (() => {
        console.log('🌉 LegacyBridge: Legacy init called for modern component');
        return component.init ? component.init() : Promise.resolve();
      }),
      
      // Legacy destroy method
      destroy: legacyInterface.destroy || (() => {
        console.log('🌉 LegacyBridge: Legacy destroy called for modern component');
        return component.destroy ? component.destroy() : undefined;
      })
    };
    
    // Add modern methods to wrapper
    Object.keys(modernMethods).forEach(methodName => {
      if (!wrapper[methodName]) {
        wrapper[methodName] = modernMethods[methodName].bind(component);
      }
    });
    
    // Add custom legacy methods
    Object.keys(legacyInterface).forEach(methodName => {
      wrapper[methodName] = legacyInterface[methodName].bind(component);
    });
    
    return wrapper;
  }
  
  /**
   * Extract public methods from a component
   * @param {Object} component - Component instance
   * @returns {Object} Public methods
   */
  extractPublicMethods(component) {
    const methods = {};
    const proto = Object.getPrototypeOf(component);
    
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (name !== 'constructor' && 
          typeof component[name] === 'function' && 
          !name.startsWith('_') && 
          !name.startsWith('handle')) {
        methods[name] = component[name];
      }
    });
    
    return methods;
  }
  
  /**
   * Migrate a legacy component to modern system
   * @param {string} legacyName - Legacy component name
   * @param {Function} ModernComponent - Modern component class
   * @param {Object} migrationConfig - Migration configuration
   * @returns {Promise<Object>} Modern component instance
   */
  async migrateComponent(legacyName, ModernComponent, migrationConfig = {}) {
    console.log(`🔄 LegacyBridge: Starting migration of '${legacyName}' to modern system`);
    
    // Check if legacy component exists
    const legacyComponent = window[legacyName];
    if (!legacyComponent) {
      console.warn(`🚨 LegacyBridge: Legacy component '${legacyName}' not found`);
      return null;
    }
    
    // Extract legacy state and configuration
    const legacyState = this.extractLegacyState(legacyComponent, migrationConfig);
    
    // Create modern component with migrated state
    const modernComponent = await this.createModernComponent(
      ModernComponent, 
      legacyState, 
      migrationConfig
    );
    
    // Set up bidirectional communication
    this.setupBidirectionalSync(legacyComponent, modernComponent, migrationConfig);
    
    // Mark migration as complete
    this.migrationStatus.set(legacyName, {
      legacy: legacyComponent,
      modern: modernComponent,
      migrated: true,
      timestamp: new Date()
    });
    
    console.log(`✅ LegacyBridge: Successfully migrated '${legacyName}' to modern system`);
    
    return modernComponent;
  }
  
  /**
   * Extract state from legacy component
   * @param {Object} legacyComponent - Legacy component
   * @param {Object} config - Migration configuration
   * @returns {Object} Extracted state
   */
  extractLegacyState(legacyComponent, config) {
    const state = {};
    
    // Extract common properties
    const commonProps = ['options', 'settings', 'config', 'state', 'isOpen', 'isActive'];
    commonProps.forEach(prop => {
      if (legacyComponent[prop] !== undefined) {
        state[prop] = legacyComponent[prop];
      }
    });
    
    // Extract custom properties defined in migration config
    if (config.stateMapping) {
      Object.keys(config.stateMapping).forEach(legacyProp => {
        const modernProp = config.stateMapping[legacyProp];
        if (legacyComponent[legacyProp] !== undefined) {
          state[modernProp] = legacyComponent[legacyProp];
        }
      });
    }
    
    console.log(`🔍 LegacyBridge: Extracted state from legacy component:`, state);
    
    return state;
  }
  
  /**
   * Create modern component with migrated state
   * @param {Function} ModernComponent - Modern component class
   * @param {Object} legacyState - Extracted legacy state
   * @param {Object} config - Migration configuration
   * @returns {Promise<Object>} Modern component instance
   */
  async createModernComponent(ModernComponent, legacyState, config) {
    // Find or create container
    const container = config.container || 
                     document.querySelector(config.containerSelector) ||
                     document.createElement('div');
    
    // Merge legacy state with modern options
    const modernOptions = {
      ...legacyState.options,
      ...legacyState.settings,
      ...legacyState.config,
      ...config.modernOptions,
      autoInit: false // We'll initialize manually
    };
    
    // Create modern component
    const modernComponent = new ModernComponent(container, modernOptions);
    
    // Apply migrated state
    if (legacyState.state) {
      modernComponent.state = { ...modernComponent.state, ...legacyState.state };
    }
    
    // Initialize component
    await modernComponent.init();
    
    return modernComponent;
  }
  
  /**
   * Setup bidirectional synchronization between legacy and modern components
   * @param {Object} legacyComponent - Legacy component
   * @param {Object} modernComponent - Modern component
   * @param {Object} config - Migration configuration
   */
  setupBidirectionalSync(legacyComponent, modernComponent, config) {
    // Sync modern events to legacy
    if (config.eventMapping) {
      Object.keys(config.eventMapping).forEach(modernEvent => {
        const legacyEvent = config.eventMapping[modernEvent];
        
        modernComponent.on(modernEvent, (data) => {
          console.log(`🔄 LegacyBridge: Syncing modern event '${modernEvent}' to legacy '${legacyEvent}'`);
          
          // Trigger legacy event
          if (legacyComponent[legacyEvent]) {
            legacyComponent[legacyEvent](data);
          }
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent(legacyEvent, { detail: data }));
        });
      });
    }
    
    // Sync state changes
    modernComponent.on('component:stateChange', ({ newState }) => {
      if (config.stateSync && legacyComponent.updateState) {
        legacyComponent.updateState(newState);
      }
    });
  }
  
  /**
   * Setup legacy event handlers
   */
  setupLegacyEventHandlers() {
    // Listen for docs events
    window.addEventListener('docs-opened', (event) => {
      console.log('🌉 LegacyBridge: Docs opened event detected');
      this.handleDocsOpened(event);
    });
    
    window.addEventListener('docs-closed', (event) => {
      console.log('🌉 LegacyBridge: Docs closed event detected');
      this.handleDocsClosed(event);
    });
    
    // Listen for mobile navigation events
    window.addEventListener('mobile-nav-initialized', (event) => {
      console.log('🌉 LegacyBridge: Mobile nav initialized');
      this.handleMobileNavInitialized(event);
    });
  }
  
  /**
   * Handle docs opened event
   * @param {Event} event - Docs opened event
   */
  handleDocsOpened(event) {
    // Notify modern components
    const modernComponents = Array.from(this.modernComponents.values());
    modernComponents.forEach(component => {
      if (component.onDocsOpened) {
        component.onDocsOpened(event);
      }
    });
  }
  
  /**
   * Handle docs closed event
   * @param {Event} event - Docs closed event
   */
  handleDocsClosed(event) {
    // Notify modern components
    const modernComponents = Array.from(this.modernComponents.values());
    modernComponents.forEach(component => {
      if (component.onDocsClosed) {
        component.onDocsClosed(event);
      }
    });
  }
  
  /**
   * Handle mobile navigation initialized
   * @param {Event} event - Mobile nav event
   */
  handleMobileNavInitialized(event) {
    // Check if we should replace with modern hamburger menu
    const shouldReplace = this.shouldReplaceMobileNav();
    
    if (shouldReplace) {
      this.replaceLegacyMobileNav();
    }
  }
  
  /**
   * Check if legacy mobile nav should be replaced
   * @returns {boolean} Whether to replace legacy nav
   */
  shouldReplaceMobileNav() {
    // Check for modern hamburger menu component
    const modernHamburger = this.modernComponents.get('HamburgerMenu');
    
    // Check device capabilities
    const supportsModernFeatures = window.CSS && CSS.supports && CSS.supports('(--custom: property)');
    
    // Check user preference (could be from localStorage)
    const userPreference = localStorage.getItem('useModernNav') !== 'false';
    
    return modernHamburger && supportsModernFeatures && userPreference;
  }
  
  /**
   * Replace legacy mobile navigation with modern component
   */
  async replaceLegacyMobileNav() {
    console.log('🔄 LegacyBridge: Replacing legacy mobile nav with modern HamburgerMenu');
    
    try {
      // Get modern hamburger menu component
      const HamburgerMenu = (await Promise.resolve().then(function () { return HamburgerMenu$1; })).HamburgerMenu;
      
      // Extract legacy navigation items
      const legacyNavItems = this.extractLegacyNavItems();
      
      // Find documentation container
      const docsContent = document.querySelector('.docs-content');
      if (!docsContent) {
        console.warn('🚨 LegacyBridge: No docs content container found');
        return;
      }
      
      // Create modern hamburger menu
      const modernHamburger = await HamburgerMenu.create(docsContent, {
        position: 'top-left',
        items: legacyNavItems,
        menuTitle: '📚 Documentation',
        closeOnSelect: true
      });
      
      // Remove legacy mobile navigation
      this.removeLegacyMobileNav();
      
      // Register modern component
      this.registerModernComponent('ModernMobileNav', modernHamburger, {
        // Legacy interface methods
        setupDocsNavigation: () => modernHamburger.updateItems(this.extractLegacyNavItems()),
        highlightCurrentPage: (slug) => modernHamburger.setActiveItem(slug),
        onDocsOpen: () => modernHamburger.updateItems(this.extractLegacyNavItems())
      });
      
      console.log('✅ LegacyBridge: Successfully replaced legacy mobile nav with modern HamburgerMenu');
      
    } catch (error) {
      console.error('🚨 LegacyBridge: Failed to replace legacy mobile nav:', error);
    }
  }
  
  /**
   * Extract navigation items from legacy system
   * @returns {Array} Navigation items
   */
  extractLegacyNavItems() {
    const items = [];
    const tocLinks = document.querySelectorAll('.docs-toc a[data-doc]');
    
    tocLinks.forEach((link, index) => {
      items.push({
        id: link.getAttribute('data-doc'),
        label: link.textContent.trim(),
        href: link.href,
        active: link.classList.contains('active'),
        action: () => {
          // Trigger legacy navigation
          link.click();
          
          // Haptic feedback
          if (window.NativeFeatures) {
            window.NativeFeatures.hapticFeedback('light');
          }
        }
      });
    });
    
    console.log(`🔗 LegacyBridge: Extracted ${items.length} navigation items`);
    
    return items;
  }
  
  /**
   * Remove legacy mobile navigation elements
   */
  removeLegacyMobileNav() {
    // Remove legacy hamburger menu
    const legacyMenus = document.querySelectorAll('.docs-mobile-menu-container');
    legacyMenus.forEach(menu => menu.remove());
    
    // Disable legacy mobile nav
    if (window.MobileDocsNav) {
      window.MobileDocsNav.removeMobileElements();
    }
    
    console.log('🗑️ LegacyBridge: Removed legacy mobile navigation elements');
  }
  
  /**
   * Initialize migration tracking
   */
  initializeMigrationTracking() {
    // Track which components have been migrated
    this.migrationStatus.set('tracking', {
      totalComponents: 0,
      migratedComponents: 0,
      pendingMigrations: []
    });
    
    // Periodically report migration status
    setInterval(() => {
      this.reportMigrationStatus();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Report current migration status
   */
  reportMigrationStatus() {
    const migrated = Array.from(this.migrationStatus.entries())
                          .filter(([key, status]) => key !== 'tracking' && status.migrated);
    
    if (migrated.length > 0) {
      console.log(`📊 LegacyBridge: Migration Status - ${migrated.length} components migrated:`, 
                  migrated.map(([name]) => name));
    }
  }
  
  /**
   * Get migration status for a component
   * @param {string} componentName - Component name
   * @returns {Object|null} Migration status
   */
  getMigrationStatus(componentName) {
    return this.migrationStatus.get(componentName) || null;
  }
  
  /**
   * Check if a component has been migrated
   * @param {string} componentName - Component name
   * @returns {boolean} Whether component is migrated
   */
  isMigrated(componentName) {
    const status = this.getMigrationStatus(componentName);
    return status && status.migrated;
  }
}

// Export singleton instance
const legacyBridge = new LegacyBridge();

/**
 * @module modules/ComponentBase
 * Base class for all UI components in the WeeWoo Map Friend application
 * Provides common functionality for lifecycle management, event handling, and state management
 */


/**
 * @class ComponentBase
 * @extends EventBus
 * Base class that all UI components should extend
 * Provides standardized lifecycle, event handling, and state management
 */
class ComponentBase extends EventBus {
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

/**
 * @module components/HamburgerMenu
 * Reusable hamburger menu component for navigation
 * Provides animated hamburger button with dropdown menu functionality
 */


/**
 * @class HamburgerMenu
 * @extends ComponentBase
 * Animated hamburger menu component with dropdown navigation
 */
class HamburgerMenu extends ComponentBase {
  /**
   * Static factory method to create and initialize a HamburgerMenu
   * @param {HTMLElement|string} container - Container element or selector
   * @param {HamburgerMenuOptions} options - Menu configuration options
   * @returns {Promise<HamburgerMenu>} Initialized HamburgerMenu instance
   */
  static async create(container, options = {}) {
    const menu = new HamburgerMenu(container, { ...options, autoInit: false });
    await menu.init();
    return menu;
  }

  /**
   * @param {HTMLElement|string} container - Container element or selector
   * @param {HamburgerMenuOptions} options - Menu configuration options
   */
  constructor(container, options = {}) {
    super(container, options);
    
    this.isOpen = false;
    this.menuItems = this.options.items || [];
    
    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    
    // Auto-initialize if enabled
    if (this.options.autoInit !== false) {
      this.init().catch(console.error);
    }
  }
  
  /**
   * Default options for hamburger menu
   * @returns {HamburgerMenuOptions} Default configuration
   */
  get defaultOptions() {
    return {
      ...super.defaultOptions,
      className: 'hamburger-menu',
      menuTitle: 'Navigation',
      items: [],
      closeOnSelect: true,
      animation: 'slide',
      position: 'top-right',
      buttonSize: '48px',
      iconColor: '#ffffff',
      backgroundColor: '#2196F3',
      dropdownMinWidth: '280px',
      enableKeyboard: true
    };
  }
  
  /**
   * Render the hamburger menu structure
   * @returns {Promise<void>}
   */
  async render() {
    this.container.innerHTML = `
      <div class="hamburger-menu-container" data-position="${this.options.position}">
        <button 
          class="hamburger-button" 
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="hamburger-dropdown"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div 
          id="hamburger-dropdown"
          class="hamburger-dropdown hidden position-${this.options.position}" 
          role="menu" 
          aria-labelledby="hamburger-button"
        >
          <div class="hamburger-menu-header">
            <h3 class="hamburger-menu-title">${this.options.menuTitle}</h3>
          </div>
          <div class="hamburger-menu-items">
            ${this.renderMenuItems()}
          </div>
        </div>
      </div>
    `;
    
    // Cache DOM references
    this.button = this.find('.hamburger-button');
    this.dropdown = this.find('.hamburger-dropdown');
    this.menuContainer = this.find('.hamburger-menu-container');
    
    // Apply styles
    this.applyStyles();
  }
  
  /**
   * Render menu items HTML
   * @returns {string} Menu items HTML
   * @private
   */
  renderMenuItems() {
    return this.menuItems.map((item, index) => `
      <a 
        href="${item.href || '#'}" 
        class="hamburger-item ${item.active ? 'active' : ''}"
        data-item-id="${item.id || index}"
        role="menuitem"
        tabindex="-1"
        ${item.href ? '' : 'data-no-href="true"'}
      >
        ${item.icon ? `<span class="menu-item-icon">${item.icon}</span>` : ''}
        <span class="menu-item-text">${item.label || item.text}</span>
      </a>
    `).join('');
  }
  
  /**
   * Apply dynamic styles to the component
   * @private
   */
  applyStyles() {
    const styles = `
      .hamburger-menu-container {
        position: relative;
        display: inline-block;
      }
      
      .hamburger-button {
        width: ${this.options.buttonSize};
        height: ${this.options.buttonSize};
        background: linear-gradient(135deg, ${this.options.backgroundColor}, ${this.adjustBrightness(this.options.backgroundColor, -20)});
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 1000;
      }
      
      .hamburger-button:hover {
        background: linear-gradient(135deg, ${this.adjustBrightness(this.options.backgroundColor, -10)}, ${this.adjustBrightness(this.options.backgroundColor, -30)});
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .hamburger-button:active {
        transform: translateY(0);
      }
      
      .hamburger-line {
        width: 20px;
        height: 2px;
        background-color: ${this.options.iconColor};
        margin: 2px 0;
        transition: all 0.3s ease;
        border-radius: 1px;
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(2) {
        opacity: 0;
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
      
      .hamburger-dropdown {
        position: absolute;
        top: calc(${this.options.buttonSize} + 8px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 1px solid #E0E0E0;
        min-width: ${this.options.dropdownMinWidth};
        max-width: 90vw;
        z-index: 999;
        overflow: hidden;
        animation: slideDown 0.3s ease;
      }
      
      .hamburger-menu-container[data-position="top-right"] .hamburger-dropdown {
        right: 0;
      }
      
      .hamburger-menu-container[data-position="top-left"] .hamburger-dropdown {
        left: 0;
      }
      
      .hamburger-menu-container[data-position="bottom-left"] .hamburger-dropdown {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        left: 0;
      }
      
      .hamburger-menu-container[data-position="bottom-right"] .hamburger-dropdown {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        right: 0;
      }
      
      .hamburger-menu-container[data-position="left"] .hamburger-dropdown {
        left: 0;
      }
      
      .hamburger-menu-container[data-position="right"] .hamburger-dropdown {
        right: 0;
      }
      
      .hamburger-dropdown.position-bottom-left {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        left: 0;
      }
      
      .hamburger-dropdown.hidden {
        display: none;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .hamburger-menu-header {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 16px 20px;
        border-bottom: 1px solid #E0E0E0;
      }
      
      .hamburger-menu-title {
        margin: 0;
        font-size: 1.1em;
        color: #333;
        font-weight: 600;
      }
      
      .hamburger-menu-items {
        max-height: 60vh;
        overflow-y: auto;
        padding: 8px 0;
      }
      
      .hamburger-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #333;
        text-decoration: none;
        transition: all 0.2s ease;
        border-bottom: 1px solid #f5f5f5;
        font-size: 1.1em;
      }
      
      .hamburger-item:last-child {
        border-bottom: none;
      }
      
      .hamburger-item:hover {
        background-color: #f8f9fa;
        color: ${this.options.backgroundColor};
        transform: translateX(4px);
      }
      
      .hamburger-item.active {
        background-color: ${this.adjustBrightness(this.options.backgroundColor, 90)};
        color: ${this.options.backgroundColor};
        font-weight: 600;
      }
      
      .menu-item-icon {
        margin-right: 12px;
        font-size: 1.2em;
      }
      
      .menu-item-text {
        flex: 1;
      }
    `;
    
    // Inject styles
    let styleEl = document.getElementById('hamburger-menu-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'hamburger-menu-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = styles;
  }
  
  /**
   * Attach event listeners
   */
  attachEvents() {
    if (this.button) {
      this.button.addEventListener('click', this.toggle);
    }
    
    if (this.dropdown) {
      this.dropdown.addEventListener('click', this.handleItemClick);
    }
    
    // Keyboard support on individual items
    if (this.options.enableKeyboard) {
      document.addEventListener('keydown', this.handleKeyDown);
      
      // Add keyboard listeners to each menu item
      const items = this.findAll('.hamburger-item');
      items.forEach(item => {
        item.addEventListener('keydown', this.handleKeyDown);
      });
    }
    
    // Click outside to close
    document.addEventListener('click', this.handleClickOutside);
  }
  
  /**
   * Handle menu toggle
   * @param {Event} event - Click event
   */
  toggle(event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * Open the menu
   */
  open() {
    if (this.isOpen) {
      return;
    }
    
    this.isOpen = true;
    this.button.classList.add('active');
    this.dropdown.classList.remove('hidden');
    this.dropdown.classList.add('show');
    this.button.setAttribute('aria-expanded', 'true');
    this.button.setAttribute('aria-label', 'Close navigation menu');
    
    // Focus first menu item for accessibility
    const firstItem = this.dropdown.querySelector('.hamburger-item');
    if (firstItem) {
      firstItem.focus();
    }
    
    // Haptic feedback if available
    if (this.options.hapticFeedback && window.NativeFeatures) {
      window.NativeFeatures.hapticFeedback('light');
    }
    
    this.emit('hamburger:open', this);
  }
  
  /**
   * Close the menu
   */
  close() {
    if (!this.isOpen) {
      return;
    }
    
    this.isOpen = false;
    this.button.classList.remove('active');
    this.dropdown.classList.add('hidden');
    this.dropdown.classList.remove('show');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-label', 'Open navigation menu');
    
    this.emit('hamburger:close', this);
  }
  
  /**
   * Handle clicks outside the menu
   * @param {Event} event - Click event
   * @private
   */
  handleClickOutside(event) {
    if (this.isOpen && !this.container.contains(event.target)) {
      this.close();
    }
  }
  
  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyDown(event) {
    if (!this.isOpen) {
      return;
    }
    
    switch (event.key) {
      case 'Escape':
        this.close();
        this.button.focus();
        event.preventDefault();
        break;
        
      case 'ArrowDown':
        this.focusNextItem();
        event.preventDefault();
        break;
        
      case 'ArrowUp':
        this.focusPreviousItem();
        event.preventDefault();
        break;
        
      case 'Enter':
        if (document.activeElement.classList.contains('hamburger-item')) {
          document.activeElement.click();
          event.preventDefault();
        }
        break;
    }
  }
  
  /**
   * Handle menu item clicks
   * @param {Event} event - Click event
   * @private
   */
  handleItemClick(event) {
    const item = event.target.closest('.hamburger-item');
    if (!item) {
      return;
    }
    
    const itemId = item.dataset.itemId;
    const menuItem = this.menuItems.find(mi => (mi.id || this.menuItems.indexOf(mi).toString()) === itemId);
    
    if (menuItem) {
      // Execute custom action if available
      if (menuItem.action && typeof menuItem.action === 'function') {
        event.preventDefault();
        menuItem.action(menuItem, event);
      }
      
      // Emit item selection event
      this.emit('hamburger:itemClick', { 
        item: menuItem, 
        element: item,
        hamburger: this
      });
      
      // Close menu if configured to do so
      if (this.options.closeOnSelect) {
        this.close();
      }
    }
  }
  
  /**
   * Focus next menu item
   * @private
   */
  focusNextItem() {
    const items = Array.from(this.dropdown.querySelectorAll('.hamburger-item'));
    const current = document.activeElement;
    const currentIndex = items.indexOf(current);
    const nextIndex = (currentIndex + 1) % items.length;
    items[nextIndex].focus();
  }
  
  /**
   * Focus previous menu item
   * @private
   */
  focusPreviousItem() {
    const items = Array.from(this.dropdown.querySelectorAll('.hamburger-item'));
    const current = document.activeElement;
    const currentIndex = items.indexOf(current);
    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[prevIndex].focus();
  }
  
  /**
   * Update menu items
   * @param {Array<MenuItem>} items - New menu items
   */
  updateItems(items) {
    this.menuItems = items;
    
    const itemsContainer = this.find('.hamburger-menu-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = this.renderMenuItems();
      
      // Reattach keyboard listeners to new items
      if (this.options.enableKeyboard) {
        const menuItems = this.findAll('.hamburger-item');
        menuItems.forEach(item => {
          item.addEventListener('keydown', this.handleKeyDown);
        });
      }
    }
    
    this.emit('hamburger:itemsUpdated', { items });
  }
  
  /**
   * Set active menu item
   * @param {string} itemId - ID of item to set as active
   */
  setActiveItem(itemId) {
    // Remove active class from all items
    this.findAll('.hamburger-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to specified item
    const activeItem = this.find(`[data-item-id="${itemId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    // Update internal state
    this.menuItems.forEach(item => {
      item.active = (item.id || this.menuItems.indexOf(item).toString()) === itemId;
    });
    
    this.emit('hamburger:activeItemChanged', { itemId });
  }
  
  /**
   * Add a new menu item
   * @param {Object} item - Menu item to add
   */
  addItem(item) {
    this.menuItems.push(item);
    this.updateItems(this.menuItems);
  }
  
  /**
   * Remove menu item by index
   * @param {number} index - Index of item to remove
   */
  removeItem(index) {
    if (index >= 0 && index < this.menuItems.length) {
      this.menuItems.splice(index, 1);
      this.updateItems(this.menuItems);
    }
  }
  
  /**
   * Clear all menu items
   */
  clearItems() {
    this.menuItems = [];
    this.options.items = [];
    this.updateItems(this.menuItems);
  }
  
  /**
   * Utility function to adjust color brightness
   * @param {string} color - Hex color
   * @param {number} percent - Brightness adjustment percentage
   * @returns {string} Adjusted color
   * @private
   */
  adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Close menu if open
    this.close();
    
    // Call parent destroy
    super.destroy();
  }
}

var HamburgerMenu$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  HamburgerMenu: HamburgerMenu
});

/**
 * @fileoverview Modern CollapsibleManager Component
 * Manages sidebar section expand/collapse behavior with sticky headers and smooth animations.
 * Replaces legacy js/ui/collapsible.js with modern architecture.
 */


/**
 * @class CollapsibleManager
 * @extends ComponentBase
 * 
 * Modern collapsible section manager with:
 * - Sticky header positioning
 * - Smooth animations
 * - State persistence
 * - Event-driven updates
 * - Accessibility support
 */
class CollapsibleManager extends ComponentBase {
  /**
   * Create CollapsibleManager instance
   * @param {HTMLElement} container - Container element (typically sidebar)
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      // Default options
      autoCollapseOthers: true,
      persistState: true,
      animationDuration: 200,
      stickyHeaders: true,
      // User options override defaults
      ...options
    });

    /**
     * @type {Map<string, CollapsibleSection>}
     * @private
     */
    this.sections = new Map();

    /**
     * @type {string|null}
     * @private
     */
    this.expandedSection = null;

    /**
     * @type {boolean}
     * @private
     */
    this.isAnimating = false;

    // Bind methods to this instance
    this.handleHeaderClick = this.handleHeaderClick.bind(this);
    this.updateStickyClasses = this.updateStickyClasses.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  /**
   * Initialize the collapsible manager
   */
  async init() {
    console.log('🔧 CollapsibleManager: Initializing modern collapsible system');

    try {
      // Set up global event listeners
      this.setupEventListeners();

      // Discover existing collapsible sections
      await this.discoverSections();

      // Restore persisted state
      if (this.options.persistState) {
        this.restoreState();
      }

      // Set up state management
      this.setupStateManagement();

      // Initialize accessibility
      this.initializeAccessibility();

      // Apply initial sticky classes
      this.updateStickyClasses();

      this.isInitialized = true;
      console.log('✅ CollapsibleManager: Modern collapsible system initialized');

    } catch (error) {
      console.error('🚨 CollapsibleManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Discover existing collapsible sections in the DOM
   * @private
   */
  async discoverSections() {
    const headers = this.container.querySelectorAll('h4[id$="Header"]');
    
    for (const header of headers) {
      const headerId = header.id;
      const sectionName = headerId.replace('Header', '');
      const listId = sectionName + 'List';
      const list = document.getElementById(listId);

      if (list) {
        const section = new CollapsibleSection(header, list, {
          name: sectionName,
          manager: this
        });

        this.sections.set(sectionName, section);
        console.log(`📁 CollapsibleManager: Discovered section '${sectionName}'`);
      } else {
        console.warn(`⚠️ CollapsibleManager: No list found for header '${headerId}'`);
      }
    }

    console.log(`📊 CollapsibleManager: Discovered ${this.sections.size} collapsible sections`);
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for section state changes
    globalEventBus.on('collapsible:sectionToggled', this.handleStateChange);
    globalEventBus.on('collapsible:sectionExpanded', this.handleStateChange);
    globalEventBus.on('collapsible:sectionCollapsed', this.handleStateChange);

    // Listen for data updates that might affect sections
    globalEventBus.on('data:layerAdded', this.updateStickyClasses);
    globalEventBus.on('data:layerRemoved', this.updateStickyClasses);
    globalEventBus.on('ui:activeListUpdated', this.updateStickyClasses);
  }

  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager (skip if not available in test environment)
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('collapsibleManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });

      // Watch for state changes
      if (typeof stateManager.subscribe === 'function') {
        stateManager.subscribe('ui.collapsible', (state) => {
          this.applyState(state);
        });
      }
    }
  }

  /**
   * Initialize accessibility features
   * @private
   */
  initializeAccessibility() {
    this.sections.forEach((section) => {
      section.initializeAccessibility();
    });
  }

  /**
   * Handle header click events
   * @param {Event} event - Click event
   * @private
   */
  handleHeaderClick(event) {
    if (this.isAnimating) return;

    const header = event.currentTarget;
    const sectionName = this.getSectionNameFromHeader(header);
    const section = this.sections.get(sectionName);

    if (!section) {
      console.warn(`⚠️ CollapsibleManager: Unknown section '${sectionName}'`);
      return;
    }

    this.toggleSection(sectionName);
  }

  /**
   * Toggle a section's expanded/collapsed state
   * @param {string} sectionName - Section to toggle
   */
  toggleSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section) {
      console.warn(`⚠️ CollapsibleManager: Unknown section '${sectionName}'`);
      return;
    }

    const wasExpanded = section.isExpanded();

    if (wasExpanded) {
      this.collapseSection(sectionName);
    } else {
      this.expandSection(sectionName);
    }
  }

  /**
   * Expand a specific section
   * @param {string} sectionName - Section to expand
   */
  async expandSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section || section.isExpanded()) return;

    this.isAnimating = true;

    try {
      // Auto-collapse others if enabled
      if (this.options.autoCollapseOthers && sectionName !== 'active') {
        await this.collapseOthers(sectionName);
      }

      // Expand the target section
      await section.expand();
      this.expandedSection = sectionName;

      // Update sticky classes
      this.updateStickyClasses();

      // Persist state
      if (this.options.persistState) {
        this.saveState();
      }

      // Emit events
      globalEventBus.emit('collapsible:sectionExpanded', { section: sectionName });
      globalEventBus.emit('collapsible:stateChanged', this.getState());

    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Collapse a specific section
   * @param {string} sectionName - Section to collapse
   */
  async collapseSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section || !section.isExpanded()) return;

    this.isAnimating = true;

    try {
      await section.collapse();
      
      if (this.expandedSection === sectionName) {
        this.expandedSection = null;
      }

      // Update sticky classes
      this.updateStickyClasses();

      // Persist state
      if (this.options.persistState) {
        this.saveState();
      }

      // Emit events
      globalEventBus.emit('collapsible:sectionCollapsed', { section: sectionName });
      globalEventBus.emit('collapsible:stateChanged', this.getState());

    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Collapse all sections except the specified one
   * @param {string} exceptSection - Section to keep expanded
   * @private
   */
  async collapseOthers(exceptSection) {
    const collapsePromises = [];

    this.sections.forEach((section, name) => {
      if (name !== exceptSection && name !== 'active' && section.isExpanded()) {
        collapsePromises.push(section.collapse());
      }
    });

    await Promise.all(collapsePromises);
  }

  /**
   * Update sticky header classes based on expanded section
   * @private
   */
  updateStickyClasses() {
    if (!this.options.stickyHeaders) return;

    // Use setTimeout to ensure DOM updates are complete
    setTimeout(() => {
      const headers = Array.from(this.container.querySelectorAll('h4[id$="Header"]'));
      const expandedIndex = headers.findIndex(h => !h.classList.contains('collapsed'));

      headers.forEach((header, index) => {
        header.classList.remove('sticky-top', 'sticky-bottom');
        
        if (expandedIndex === -1) return; // No sections expanded
        
        if (index < expandedIndex) {
          header.classList.add('sticky-top');
        } else if (index > expandedIndex) {
          header.classList.add('sticky-bottom');
        }
      });
    }, 0);
  }

  /**
   * Handle state change events
   * @param {Object} eventData - Event data
   * @private
   */
  handleStateChange(eventData) {
    // Debounce rapid state changes
    clearTimeout(this.stateChangeTimeout);
    this.stateChangeTimeout = setTimeout(() => {
      this.updateStickyClasses();
    }, 50);
  }

  /**
   * Get section name from header element
   * @param {HTMLElement} header - Header element
   * @returns {string} Section name
   * @private
   */
  getSectionNameFromHeader(header) {
    return header.id.replace('Header', '');
  }

  /**
   * Get current state of all sections
   * @returns {Object} Current state
   */
  getState() {
    const state = {
      expandedSection: this.expandedSection,
      sections: {}
    };

    this.sections.forEach((section, name) => {
      state.sections[name] = {
        expanded: section.isExpanded(),
        visible: section.isVisible()
      };
    });

    return state;
  }

  /**
   * Apply state to all sections
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (!state) return;

    this.expandedSection = state.expandedSection || null;

    if (state.sections) {
      Object.entries(state.sections).forEach(([name, sectionState]) => {
        const section = this.sections.get(name);
        if (section) {
          if (sectionState.expanded) {
            section.expand();
          } else {
            section.collapse();
          }
        }
      });
    }

    this.updateStickyClasses();
  }

  /**
   * Save current state to localStorage
   * @private
   */
  saveState() {
    if (!this.options.persistState) return;

    try {
      const state = this.getState();
      localStorage.setItem('collapsibleManager.state', JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ CollapsibleManager: Failed to save state:', error);
    }
  }

  /**
   * Restore state from localStorage
   * @private
   */
  restoreState() {
    if (!this.options.persistState) return;

    try {
      const savedState = localStorage.getItem('collapsibleManager.state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.applyState(state);
      }
    } catch (error) {
      console.warn('⚠️ CollapsibleManager: Failed to restore state:', error);
    }
  }

  /**
   * Get a specific section
   * @param {string} name - Section name
   * @returns {CollapsibleSection|null} Section instance
   */
  getSection(name) {
    return this.sections.get(name) || null;
  }

  /**
   * Check if a section is expanded
   * @param {string} name - Section name
   * @returns {boolean} Whether section is expanded
   */
  isSectionExpanded(name) {
    const section = this.sections.get(name);
    return section ? section.isExpanded() : false;
  }

  /**
   * Destroy the collapsible manager
   */
  destroy() {
    // Remove event listeners
    globalEventBus.off('collapsible:sectionToggled', this.handleStateChange);
    globalEventBus.off('collapsible:sectionExpanded', this.handleStateChange);
    globalEventBus.off('collapsible:sectionCollapsed', this.handleStateChange);
    globalEventBus.off('data:layerAdded', this.updateStickyClasses);
    globalEventBus.off('data:layerRemoved', this.updateStickyClasses);
    globalEventBus.off('ui:activeListUpdated', this.updateStickyClasses);

    // Destroy all sections
    this.sections.forEach(section => section.destroy());
    this.sections.clear();

    // Clear timeouts
    clearTimeout(this.stateChangeTimeout);

    super.destroy();
  }
}

/**
 * @class CollapsibleSection
 * Represents a single collapsible section
 */
class CollapsibleSection {
  /**
   * Create CollapsibleSection instance
   * @param {HTMLElement} header - Header element
   * @param {HTMLElement} list - List element
   * @param {Object} options - Configuration options
   */
  constructor(header, list, options = {}) {
    this.header = header;
    this.list = list;
    this.options = options;
    this.name = options.name;
    this.manager = options.manager;

    // Bind methods to this instance
    this.handleClick = this.handleClick.bind(this);
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for this section
   * @private
   */
  setupEventListeners() {
    this.header.addEventListener('click', this.handleClick);
  }

  /**
   * Handle header click
   * @param {Event} event - Click event
   * @private
   */
  handleClick(event) {
    event.preventDefault();
    this.manager.toggleSection(this.name);
  }

  /**
   * Initialize accessibility features
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.header.setAttribute('role', 'button');
    this.header.setAttribute('aria-expanded', this.isExpanded() ? 'true' : 'false');
    this.header.setAttribute('aria-controls', this.list.id);
    this.header.setAttribute('tabindex', '0');

    this.list.setAttribute('role', 'region');
    this.list.setAttribute('aria-labelledby', this.header.id);

    // Keyboard support
    this.header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleClick(event);
      }
    });
  }

  /**
   * Check if section is expanded
   * @returns {boolean} Whether section is expanded
   */
  isExpanded() {
    return !this.header.classList.contains('collapsed');
  }

  /**
   * Check if section is visible
   * @returns {boolean} Whether section is visible
   */
  isVisible() {
    return this.list.style.display !== 'none';
  }

  /**
   * Expand the section with animation
   * @returns {Promise<void>} Animation completion promise
   */
  async expand() {
    if (this.isExpanded()) return;

    this.header.classList.remove('collapsed');
    this.header.setAttribute('aria-expanded', 'true');
    
    // Animate expansion
    await this.animateExpansion();

    globalEventBus.emit('collapsible:sectionToggled', { 
      section: this.name, 
      expanded: true 
    });
  }

  /**
   * Collapse the section with animation
   * @returns {Promise<void>} Animation completion promise
   */
  async collapse() {
    if (!this.isExpanded()) return;

    // Animate collapse first
    await this.animateCollapse();

    this.header.classList.add('collapsed');
    this.header.setAttribute('aria-expanded', 'false');

    globalEventBus.emit('collapsible:sectionToggled', { 
      section: this.name, 
      expanded: false 
    });
  }

  /**
   * Animate section expansion
   * @returns {Promise<void>} Animation completion promise
   * @private
   */
  async animateExpansion() {
    return new Promise(resolve => {
      this.list.style.display = '';
      
      // Use requestAnimationFrame for smooth animation
      requestAnimationFrame(() => {
        this.list.style.transition = `all ${this.manager.options.animationDuration}ms ease-out`;
        this.list.style.opacity = '1';
        this.list.style.transform = 'translateY(0)';
        
        setTimeout(resolve, this.manager.options.animationDuration);
      });
    });
  }

  /**
   * Animate section collapse
   * @returns {Promise<void>} Animation completion promise
   * @private
   */
  async animateCollapse() {
    return new Promise(resolve => {
      this.list.style.transition = `all ${this.manager.options.animationDuration}ms ease-in`;
      this.list.style.opacity = '0';
      this.list.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        this.list.style.display = 'none';
        this.list.style.transition = '';
        this.list.style.opacity = '';
        this.list.style.transform = '';
        resolve();
      }, this.manager.options.animationDuration);
    });
  }

  /**
   * Destroy the section
   */
  destroy() {
    this.header.removeEventListener('click', this.handleClick);
    
    // Remove ARIA attributes
    this.header.removeAttribute('role');
    this.header.removeAttribute('aria-expanded');
    this.header.removeAttribute('aria-controls');
    this.header.removeAttribute('tabindex');
    
    this.list.removeAttribute('role');
    this.list.removeAttribute('aria-labelledby');
  }
}

/**
 * @fileoverview Modern SearchManager Component
 * Manages global sidebar search functionality with dropdown results and smooth interactions.
 * Replaces legacy js/ui/search.js with modern architecture.
 */


/**
 * @class SearchManager
 * @extends ComponentBase
 * 
 * Modern search manager for global sidebar search with:
 * - Debounced input handling for performance
 * - Intelligent result filtering and highlighting
 * - Seamless integration with CollapsibleManager
 * - Keyboard navigation and accessibility
 * - State persistence and event-driven updates
 */
class SearchManager extends ComponentBase {
  /**
   * Create SearchManager instance
   * @param {HTMLElement} container - Search container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      // Default options
      debounceDelay: 120,
      maxResults: 20,
      minSearchLength: 1,
      highlightDuration: 1200,
      dropdownBlurDelay: 200,
      // User options override defaults
      ...options
    });

    /**
     * @type {HTMLInputElement|null}
     * @private
     */
    this.searchInput = null;

    /**
     * @type {HTMLElement|null}
     * @private
     */
    this.dropdown = null;

    /**
     * @type {number|null}
     * @private
     */
    this.debounceTimer = null;

    /**
     * @type {Array<Object>}
     * @private
     */
    this.searchData = [];

    /**
     * @type {string}
     * @private
     */
    this.currentQuery = '';

    /**
     * @type {number}
     * @private
     */
    this.selectedIndex = -1;

    // Bind methods to this instance
    this.handleInput = this.handleInput.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    this.performSearch = this.performSearch.bind(this);
    this.updateSearchData = this.updateSearchData.bind(this);
  }

  /**
   * Initialize the search manager
   */
  async init() {
    console.log('🔍 SearchManager: Initializing modern search system');

    try {
      // Find search elements
      this.findSearchElements();

      // Set up event listeners
      this.setupEventListeners();

      // Load initial search data
      await this.loadSearchData();

      // Set up state management
      this.setupStateManagement();

      // Initialize accessibility
      this.initializeAccessibility();

      this.isInitialized = true;
      console.log('✅ SearchManager: Modern search system initialized');

    } catch (error) {
      console.error('🚨 SearchManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Find and validate search DOM elements
   * @private
   */
  findSearchElements() {
    this.searchInput = this.container.querySelector('#globalSidebarSearch') || 
                     this.container.querySelector('.search-box') ||
                     document.getElementById('globalSidebarSearch');

    this.dropdown = this.container.querySelector('#sidebarSearchDropdown') ||
                   this.container.querySelector('.sidebar-search-dropdown') ||
                   document.getElementById('sidebarSearchDropdown');

    if (!this.searchInput) {
      throw new Error('SearchManager: Search input element not found');
    }

    if (!this.dropdown) {
      throw new Error('SearchManager: Search dropdown element not found');
    }

    console.log('🔍 SearchManager: Found search elements');
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', this.handleInput);
    this.searchInput.addEventListener('keydown', this.handleKeyDown);
    this.searchInput.addEventListener('blur', this.handleBlur);

    // Dropdown events
    this.dropdown.addEventListener('click', this.handleDropdownClick);

    // Global events
    globalEventBus.on('data:layersLoaded', this.updateSearchData);
    globalEventBus.on('data:layerAdded', this.updateSearchData);
    globalEventBus.on('data:layerRemoved', this.updateSearchData);
    globalEventBus.on('search:clear', this.clearSearch.bind(this));
    globalEventBus.on('search:focus', this.focusSearch.bind(this));

    console.log('👂 SearchManager: Event listeners attached');
  }

  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager (skip if not available in test environment)
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('searchManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });

      // Watch for state changes
      if (typeof stateManager.subscribe === 'function') {
        stateManager.subscribe('ui.search', (state) => {
          this.applyState(state);
        });
      }
    }
  }

  /**
   * Initialize accessibility features
   * @private
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.searchInput.setAttribute('role', 'combobox');
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.setAttribute('aria-haspopup', 'listbox');
    this.searchInput.setAttribute('aria-autocomplete', 'list');
    this.searchInput.setAttribute('aria-controls', this.dropdown.id);

    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-label', 'Search results');

    // Add labels if missing
    if (!this.searchInput.getAttribute('aria-label') && !this.searchInput.getAttribute('aria-labelledby')) {
      this.searchInput.setAttribute('aria-label', 'Search all layers');
    }
  }

  /**
   * Load search data from global state
   * @private
   */
  async loadSearchData() {
    try {
      // Check for legacy global data
      if (window.namesByCategory && window.nameToKey) {
        this.buildSearchDataFromLegacy();
      } else {
        // Wait for data to be loaded
        globalEventBus.once('data:layersLoaded', () => {
          this.buildSearchDataFromLegacy();
        });
      }

      console.log(`📊 SearchManager: Loaded ${this.searchData.length} search entries`);

    } catch (error) {
      console.error('🚨 SearchManager: Failed to load search data:', error);
      this.searchData = [];
    }
  }

  /**
   * Build search data from legacy global variables
   * @private
   */
  buildSearchDataFromLegacy() {
    this.searchData = [];

    if (!window.namesByCategory || !window.nameToKey) {
      console.warn('⚠️ SearchManager: Legacy search data not available');
      return;
    }

    Object.entries(window.namesByCategory).forEach(([category, names]) => {
      if (!Array.isArray(names)) return;

      names.forEach(name => {
        if (!name || typeof name !== 'string') return;

        // Find key in a case-insensitive way
        let key = window.nameToKey[category]?.[name];
        if (!key) {
          // Try to find key by lowercasing all keys
          const lowerName = name.toLowerCase();
          for (const k in window.nameToKey[category] || {}) {
            if (k.toLowerCase() === lowerName) {
              key = window.nameToKey[category][k];
              break;
            }
          }
        }

        if (key) {
          this.searchData.push({
            category,
            name,
            key,
            searchText: name.toLowerCase(),
            sidebarId: `${category}_${key}`
          });
        }
      });
    });

    console.log(`📊 SearchManager: Built search data with ${this.searchData.length} entries`);
  }

  /**
   * Handle search input events
   * @param {Event} event - Input event
   * @private
   */
  handleInput(event) {
    const query = event.target.value.trim();
    this.currentQuery = query;

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    if (query.length < this.options.minSearchLength) {
      this.hideDropdown();
      return;
    }

    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, this.options.debounceDelay);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyDown(event) {
    if (!this.isDropdownVisible()) return;

    const items = this.dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection(items);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
          this.selectResult(items[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  /**
   * Handle search input blur
   * @param {Event} event - Blur event
   * @private
   */
  handleBlur(event) {
    // Delay hiding to allow dropdown clicks
    setTimeout(() => {
      this.hideDropdown();
    }, this.options.dropdownBlurDelay);
  }

  /**
   * Handle dropdown click events
   * @param {Event} event - Click event
   * @private
   */
  handleDropdownClick(event) {
    const item = event.target.closest('.dropdown-item');
    if (item && !item.classList.contains('no-results')) {
      this.selectResult(item);
    }
  }

  /**
   * Perform search with the given query
   * @param {string} query - Search query
   * @private
   */
  performSearch(query) {
    const lowerQuery = query.toLowerCase();
    
    const results = this.searchData
      .filter(item => item.searchText.includes(lowerQuery))
      .slice(0, this.options.maxResults);

    this.displayResults(results, query);
    
    // Emit search event
    globalEventBus.emit('search:performed', { 
      query, 
      results: results.length,
      timestamp: new Date()
    });

    console.log(`🔍 SearchManager: Found ${results.length} results for "${query}"`);
  }

  /**
   * Display search results in dropdown
   * @param {Array<Object>} results - Search results
   * @param {string} query - Original query
   * @private
   */
  displayResults(results, query) {
    if (results.length === 0) {
      this.dropdown.innerHTML = '<div class="dropdown-item no-results">No matches found</div>';
    } else {
      this.dropdown.innerHTML = results.map(result => 
        this.createResultHTML(result, query)
      ).join('');
    }

    this.showDropdown();
    this.selectedIndex = -1;
  }

  /**
   * Create HTML for a search result item
   * @param {Object} result - Search result
   * @param {string} query - Search query for highlighting
   * @returns {string} HTML string
   * @private
   */
  createResultHTML(result, query) {
    // Get color for category
    const baseColor = this.getCategoryColor(result.category);
    const highlightedName = this.highlightQuery(result.name, query);
    
    return `
      <div class="dropdown-item" data-cat="${result.category}" data-key="${result.key}" data-sidebar-id="${result.sidebarId}">
        <span class="name" style="color:${baseColor}">${highlightedName}</span>
        <span class="category" style="color:#888;font-size:0.9em;">(${result.category.toUpperCase()})</span>
      </div>
    `;
  }

  /**
   * Get color for a category
   * @param {string} category - Category name
   * @returns {string} Color value
   * @private
   */
  getCategoryColor(category) {
    if (window.outlineColors && window.outlineColors[category]) {
      const base = window.outlineColors[category];
      const factor = window.labelColorAdjust?.[category] ?? 1.0;
      return window.adjustHexColor ? window.adjustHexColor(base, factor) : base;
    }
    return '#333';
  }

  /**
   * Highlight query text in result name
   * @param {string} name - Result name
   * @param {string} query - Search query
   * @returns {string} Name with highlighted query
   * @private
   */
  highlightQuery(name, query) {
    if (!query) return name;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return name.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Update keyboard selection highlighting
   * @param {NodeList} items - Dropdown items
   * @private
   */
  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Update ARIA attributes
    this.searchInput.setAttribute('aria-activedescendant', 
      this.selectedIndex >= 0 ? `search-result-${this.selectedIndex}` : '');
  }

  /**
   * Select a search result
   * @param {HTMLElement} item - Selected dropdown item
   * @private
   */
  selectResult(item) {
    const category = item.getAttribute('data-cat');
    const key = item.getAttribute('data-key');
    const sidebarId = item.getAttribute('data-sidebar-id');

    this.activateSearchResult(category, key, sidebarId);
    this.hideDropdown();
    this.clearSearch();

    // Emit selection event
    globalEventBus.emit('search:selected', { category, key, sidebarId });
  }

  /**
   * Activate the selected search result
   * @param {string} category - Result category
   * @param {string} key - Result key
   * @param {string} sidebarId - Sidebar element ID
   * @private
   */
  activateSearchResult(category, key, sidebarId) {
    const element = document.getElementById(sidebarId);
    if (!element) {
      console.warn(`⚠️ SearchManager: Element not found: ${sidebarId}`);
      return;
    }

    // Expand the section if collapsed (integrate with CollapsibleManager)
    this.expandSection(category);

    // Find and activate checkbox
    const { checkbox, container } = this.findCheckboxAndContainer(element);
    
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Scroll to and highlight the result
    if (container) {
      this.scrollToAndHighlight(container);
    }
  }

  /**
   * Expand the section containing the search result
   * @param {string} category - Category to expand
   * @private
   */
  expandSection(category) {
    const headerId = `${category}Header`;
    const header = document.getElementById(headerId);
    
    if (header && header.classList.contains('collapsed')) {
      // Try to use modern CollapsibleManager first
      const collapsibleManager = stateManager.get('components.collapsibleManager');
      if (collapsibleManager && typeof collapsibleManager.expandSection === 'function') {
        collapsibleManager.expandSection(category);
      } else {
        // Fallback to direct header click
        header.click();
      }
    }
  }

  /**
   * Find checkbox and container elements
   * @param {HTMLElement} element - Target element
   * @returns {Object} Object with checkbox and container
   * @private
   */
  findCheckboxAndContainer(element) {
    let checkbox = null;
    let container = null;

    if (element.tagName === 'INPUT') {
      checkbox = element;
      container = element.closest('.sidebar-list-row') || element.parentElement || element;
    } else {
      checkbox = element.querySelector('input[type="checkbox"]');
      container = element;
    }

    return { checkbox, container };
  }

  /**
   * Scroll to and highlight a container
   * @param {HTMLElement} container - Container to highlight
   * @private
   */
  scrollToAndHighlight(container) {
    if (container.scrollIntoView) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      container.classList.add('search-highlight');
      setTimeout(() => {
        container.classList.remove('search-highlight');
      }, this.options.highlightDuration);
    }
  }

  /**
   * Show the dropdown
   * @private
   */
  showDropdown() {
    this.dropdown.classList.add('active');
    this.dropdown.style.display = 'block';
    this.searchInput.setAttribute('aria-expanded', 'true');
  }

  /**
   * Hide the dropdown
   * @private
   */
  hideDropdown() {
    this.dropdown.classList.remove('active');
    this.dropdown.style.display = 'none';
    this.dropdown.innerHTML = '';
    this.selectedIndex = -1;
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.removeAttribute('aria-activedescendant');
  }

  /**
   * Check if dropdown is visible
   * @returns {boolean} Whether dropdown is visible
   * @private
   */
  isDropdownVisible() {
    return this.dropdown.classList.contains('active');
  }

  /**
   * Clear the search input and hide dropdown
   */
  clearSearch() {
    this.searchInput.value = '';
    this.currentQuery = '';
    this.hideDropdown();
    clearTimeout(this.debounceTimer);
  }

  /**
   * Focus the search input
   */
  focusSearch() {
    this.searchInput.focus();
  }

  /**
   * Update search data when layers change
   * @private
   */
  updateSearchData() {
    // Debounce rapid updates
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      this.buildSearchDataFromLegacy();
    }, 100);
  }

  /**
   * Get current search state
   * @returns {Object} Current state
   */
  getState() {
    return {
      query: this.currentQuery,
      isDropdownVisible: this.isDropdownVisible(),
      selectedIndex: this.selectedIndex,
      searchDataCount: this.searchData.length
    };
  }

  /**
   * Apply state to search manager
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (!state) return;

    if (state.query !== undefined) {
      this.searchInput.value = state.query;
      this.currentQuery = state.query;
    }

    if (state.isDropdownVisible && state.query) {
      this.performSearch(state.query);
    }
  }

  /**
   * Destroy the search manager
   */
  destroy() {
    // Clear timers
    clearTimeout(this.debounceTimer);
    clearTimeout(this.updateTimer);

    // Remove event listeners
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleInput);
      this.searchInput.removeEventListener('keydown', this.handleKeyDown);
      this.searchInput.removeEventListener('blur', this.handleBlur);
    }

    if (this.dropdown) {
      this.dropdown.removeEventListener('click', this.handleDropdownClick);
    }

    // Remove global event listeners
    globalEventBus.off('data:layersLoaded', this.updateSearchData);
    globalEventBus.off('data:layerAdded', this.updateSearchData);
    globalEventBus.off('data:layerRemoved', this.updateSearchData);

    // Clear search data
    this.searchData = [];

    super.destroy();
  }
}

/**
 * @fileoverview Modern ActiveListManager Component
 * Manages the "All Active" sidebar section with enhanced UI controls and performance.
 */


/**
 * @class ActiveListManager
 * Modern replacement for legacy js/ui/activeList.js
 * Manages the dynamic "All Active" section with bulk operations, enhanced controls, and performance optimizations
 */
class ActiveListManager extends ComponentBase {
  /**
   * @param {HTMLElement} container - Container element for the active list
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      enableBulkOperations: true,
      enableWeatherIntegration: true,
      enableEmphasis: true,
      enableLabels: true,
      autoCollapse: true,
      animationDuration: 200,
      weatherBoxPosition: 'bottom-left',
      maxWeatherBoxHeight: '60vh',
      bulkUpdateDelay: 50,
      ...options
    });
    
    // State management
    this.activeItems = new Map(); // category -> Set of active keys
    this.bulkUpdateActive = false;
    this.bulkUpdatePending = false;
    this.bulkUpdateTimer = null;
    
    // DOM elements (will be found during init)
    this.activeList = null;
    this.headerElement = null;
    this.weatherBox = null;
    
    // Weather state
    this.currentWeatherLocation = null;
    this.weatherProvider = 'willyweather';
    
    // Categories to monitor
    this.categories = ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv'];
    
    // Bound methods
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleEmphasisChange = this.handleEmphasisChange.bind(this);
    this.handleLabelChange = this.handleLabelChange.bind(this);
    this.handleWeatherChange = this.handleWeatherChange.bind(this);
    this.updateActiveList = this.updateActiveList.bind(this);
    this.handleCategoryDataUpdate = this.handleCategoryDataUpdate.bind(this);
    
    console.log('🎯 ActiveListManager: Initialized with container', container.id);
  }
  
  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('🎯 ActiveListManager: Initializing...');
      
      // Find DOM elements
      this.findDOMElements();
      
      // Set up accessibility
      this.initializeAccessibility();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up state management
      this.setupStateManagement();
      
      // Create weather box if enabled
      if (this.options.enableWeatherIntegration) {
        this.createWeatherBox();
      }
      
      // Load weather provider preference
      this.loadWeatherPreferences();
      
      // Sync with existing checkboxes
      this.syncWithExistingCheckboxes();
      
      // Initial render
      this.updateActiveList();
      
      this.isInitialized = true;
      globalEventBus.emit('activeList:initialized', { manager: this });
      
      console.log('✅ ActiveListManager: Initialization complete');
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Find required DOM elements
   * @private
   */
  findDOMElements() {
    // Find active list container
    this.activeList = document.getElementById('activeList');
    if (!this.activeList) {
      throw new Error('Active list element not found');
    }
    
    // Find header element
    this.headerElement = document.getElementById('activeHeader');
    if (!this.headerElement) {
      console.warn('⚠️ ActiveListManager: Active header element not found');
    }
    
    console.log('📋 ActiveListManager: DOM elements found');
  }
  
  /**
   * Set up accessibility features
   * @private
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.activeList.setAttribute('role', 'list');
    this.activeList.setAttribute('aria-label', 'Active layers list');
    
    if (this.headerElement) {
      this.headerElement.setAttribute('aria-expanded', 'true');
      this.headerElement.setAttribute('aria-controls', this.activeList.id);
    }
    
    console.log('♿ ActiveListManager: Accessibility features initialized');
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Global events for data updates
    globalEventBus.on('data:layersLoaded', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerAdded', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerRemoved', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerToggled', this.updateActiveList);
    
    // Search integration
    globalEventBus.on('search:selected', ({ category, key }) => {
      // When search selects an item, update the active list
      setTimeout(() => this.updateActiveList(), 100);
    });
    
    // Collapsible integration
    globalEventBus.on('collapsible:expanded', ({ id }) => {
      if (id === 'activeHeader') {
        this.handleSectionExpanded();
      }
    });
    
    // State management events
    globalEventBus.on('state:changed', ({ key, value }) => {
      if (key === 'ui.activeList') {
        this.applyState(value);
      }
    });
    
    console.log('👂 ActiveListManager: Event listeners attached');
  }
  
  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('activeListManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });
    }
  }
  
  /**
   * Create weather box for 7-day forecasts
   * @private
   */
  createWeatherBox() {
    this.weatherBox = document.getElementById('weatherBox');
    
    if (!this.weatherBox) {
      this.weatherBox = document.createElement('div');
      this.weatherBox.id = 'weatherBox';
      this.weatherBox.className = 'weather-box modern-weather-box';
      
      // Position and styling
      const positions = {
        'bottom-left': { left: '20px', bottom: '20px' },
        'bottom-right': { right: '20px', bottom: '20px' },
        'top-left': { left: '20px', top: '20px' },
        'top-right': { right: '20px', top: '20px' }
      };
      
      const pos = positions[this.options.weatherBoxPosition] || positions['bottom-left'];
      
      Object.assign(this.weatherBox.style, {
        position: 'fixed',
        ...pos,
        width: '320px',
        maxHeight: this.options.maxWeatherBoxHeight,
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: '9999',
        padding: '16px',
        display: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      });
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✖';
      closeBtn.className = 'weather-close-btn';
      closeBtn.title = 'Close weather box';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: 'pointer',
        color: '#666',
        padding: '4px'
      });
      closeBtn.addEventListener('click', () => {
        this.hideWeatherBox();
      });
      
      this.weatherBox.appendChild(closeBtn);
      document.body.appendChild(this.weatherBox);
    }
    
    console.log('🌦️ ActiveListManager: Weather box created');
  }
  
  /**
   * Load weather provider preference from localStorage
   * @private
   */
  loadWeatherPreferences() {
    if (typeof localStorage !== 'undefined') {
      this.weatherProvider = localStorage.getItem('weatherProvider') || 'willyweather';
    }
  }
  
  /**
   * Sync with existing category checkboxes
   * @private
   */
  syncWithExistingCheckboxes() {
    this.categories.forEach(category => {
      this.setupCategorySync(category);
    });
    
    console.log('🔄 ActiveListManager: Synced with existing checkboxes');
  }
  
  /**
   * Set up synchronization with a category's checkboxes
   * @param {string} category - Category name
   * @private
   */
  setupCategorySync(category) {
    if (!window.namesByCategory?.[category] || !window.nameToKey?.[category]) {
      return;
    }
    
    if (!this.activeItems.has(category)) {
      this.activeItems.set(category, new Set());
    }
    
    const activeSet = this.activeItems.get(category);
    
    window.namesByCategory[category].forEach(name => {
      const key = window.nameToKey[category][name];
      const checkbox = this.getCategoryCheckbox(category, key);
      
      if (checkbox && !checkbox._modernBound) {
        checkbox._modernBound = true;
        checkbox.addEventListener('change', this.handleCheckboxChange);
        
        // Initialize active state
        if (checkbox.checked) {
          activeSet.add(key);
        }
      }
    });
  }
  
  /**
   * Safely get the actual checkbox element for a given category/key
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @returns {HTMLInputElement|null}
   * @private
   */
  getCategoryCheckbox(category, key) {
    const id = `${category}_${key}`;
    const el = document.getElementById(id);
    
    if (!el) {
      return document.querySelector(`input#${id}`);
    }
    
    if (el.tagName === 'INPUT') {
      return el;
    }
    
    const inside = el.querySelector('input[type="checkbox"]');
    if (inside) {
      return inside;
    }
    
    return document.querySelector(`input#${id}`);
  }
  
  /**
   * Handle checkbox change events
   * @param {Event} event - Change event
   * @private
   */
  handleCheckboxChange(event) {
    const checkbox = event.target;
    const id = checkbox.id;
    
    if (!id) return;
    
    // Parse category and key from id
    const parts = id.split('_');
    if (parts.length < 2) return;
    
    const category = parts[0];
    const key = parts.slice(1).join('_');
    
    if (!this.activeItems.has(category)) {
      this.activeItems.set(category, new Set());
    }
    
    const activeSet = this.activeItems.get(category);
    
    if (checkbox.checked) {
      activeSet.add(key);
    } else {
      activeSet.delete(key);
    }
    
    // Update the active list
    this.scheduleUpdate();
    
    // Emit event
    globalEventBus.emit('activeList:itemToggled', {
      category,
      key,
      active: checkbox.checked,
      total: activeSet.size
    });
  }
  
  /**
   * Schedule an update with optional bulk processing
   * @private
   */
  scheduleUpdate() {
    if (this.bulkUpdateActive) {
      this.bulkUpdatePending = true;
      return;
    }
    
    // Debounce rapid updates
    clearTimeout(this.bulkUpdateTimer);
    this.bulkUpdateTimer = setTimeout(() => {
      this.updateActiveList();
    }, this.options.bulkUpdateDelay);
  }
  
  /**
   * Begin bulk update mode to avoid repeated rebuilding
   */
  beginBulkUpdate() {
    this.bulkUpdateActive = true;
    console.log('📦 ActiveListManager: Bulk update mode enabled');
  }
  
  /**
   * End bulk update mode and apply pending changes
   */
  endBulkUpdate() {
    this.bulkUpdateActive = false;
    const pending = this.bulkUpdatePending;
    this.bulkUpdatePending = false;
    
    if (pending) {
      this.updateActiveList();
    }
    
    console.log('📦 ActiveListManager: Bulk update mode disabled');
  }
  
  /**
   * Update the active list UI
   */
  updateActiveList() {
    if (this.bulkUpdateActive) {
      this.bulkUpdatePending = true;
      return;
    }
    
    if (!this.activeList) return;
    
    try {
      // Clear existing content
      this.activeList.innerHTML = '';
      
      // Create header row
      this.createHeaderRow();
      
      // Add items for each category
      let totalItems = 0;
      this.categories.forEach(category => {
        totalItems += this.addCategoryItems(category);
      });
      
      // Handle empty state
      this.handleEmptyState(totalItems);
      
      // Emit update event
      globalEventBus.emit('activeList:updated', {
        totalItems,
        categories: Array.from(this.activeItems.keys()),
        manager: this
      });
      
      console.log(`📋 ActiveListManager: Updated with ${totalItems} active items`);
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Update failed:', error);
    }
  }
  
  /**
   * Create the header row with column labels
   * @private
   */
  createHeaderRow() {
    const headerRow = document.createElement('div');
    headerRow.className = 'active-list-header';
    headerRow.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-weight: bold;
      font-size: 0.9em;
      color: #666;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    `;
    
    // Spacer for remove button
    const spacer = document.createElement('span');
    spacer.style.width = '32px';
    headerRow.appendChild(spacer);
    
    // Name header
    const nameHeader = document.createElement('span');
    nameHeader.textContent = 'Name';
    nameHeader.className = 'active-list-name-header';
    nameHeader.style.cssText = 'flex: 1; text-align: left;';
    headerRow.appendChild(nameHeader);
    
    // Feature headers
    const features = [
      { text: '📢', title: 'Emphasise', enabled: this.options.enableEmphasis },
      { text: '🏷️', title: 'Show Name', enabled: this.options.enableLabels },
      { text: '🌦️', title: '7-day weather', enabled: this.options.enableWeatherIntegration }
    ];
    
    features.forEach(feature => {
      if (!feature.enabled) return;
      
      const header = document.createElement('span');
      header.textContent = feature.text;
      header.title = feature.title;
      header.className = 'active-list-icon-header';
      header.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        font-weight: bold;
        cursor: help;
      `;
      headerRow.appendChild(header);
    });
    
    this.activeList.appendChild(headerRow);
  }
  
  /**
   * Add items for a specific category
   * @param {string} category - Category name
   * @returns {number} Number of items added
   * @private
   */
  addCategoryItems(category) {
    if (!window.namesByCategory?.[category] || !window.featureLayers?.[category]) {
      return 0;
    }
    
    const activeSet = this.activeItems.get(category) || new Set();
    let itemCount = 0;
    
    window.namesByCategory[category].forEach(name => {
      const key = window.nameToKey[category][name];
      const checkbox = this.getCategoryCheckbox(category, key);
      
      if (!checkbox || !checkbox.checked || !activeSet.has(key)) {
        return; // Only show checked/active items
      }
      
      const row = this.createItemRow(category, key, name);
      this.activeList.appendChild(row);
      itemCount++;
    });
    
    return itemCount;
  }
  
  /**
   * Create a row for an active item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @returns {HTMLElement} Row element
   * @private
   */
  createItemRow(category, key, name) {
    const row = document.createElement('div');
    row.className = 'active-list-row';
    row.setAttribute('role', 'listitem');
    row.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 2px;
      padding: 4px 2px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effect
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = '';
    });
    
    // Set coordinate data for weather (polygons only)
    this.setRowCoordinates(row, category, key);
    
    // Create row contents
    this.addRemoveButton(row, category, key);
    this.addNameLabel(row, category, name);
    
    if (this.options.enableEmphasis) {
      this.addEmphasisToggle(row, category, key);
    }
    
    if (this.options.enableLabels) {
      this.addLabelToggle(row, category, key, name);
    }
    
    if (this.options.enableWeatherIntegration) {
      this.addWeatherToggle(row, category, key);
    }
    
    return row;
  }
  
  /**
   * Set coordinate data on row for weather functionality
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  setRowCoordinates(row, category, key) {
    const meta = window.categoryMeta?.[category];
    if (meta?.type === 'polygon' && window.featureLayers?.[category]?.[key]) {
      const layer = window.featureLayers[category][key][0];
      if (layer && layer.getBounds) {
        const center = layer.getBounds().getCenter();
        row.dataset.lat = center.lat;
        row.dataset.lon = center.lng;
      }
    }
  }
  
  /**
   * Add remove button to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addRemoveButton(row, category, key) {
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✖';
    removeBtn.title = 'Remove from active';
    removeBtn.className = 'active-list-remove-btn';
    removeBtn.style.cssText = `
      color: #d32f2f;
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      width: 32px;
      margin: 0 2px 0 0;
      padding: 2px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effect
    removeBtn.addEventListener('mouseenter', () => {
      removeBtn.style.backgroundColor = 'rgba(211, 47, 47, 0.1)';
    });
    removeBtn.addEventListener('mouseleave', () => {
      removeBtn.style.backgroundColor = '';
    });
    
    removeBtn.addEventListener('click', () => {
      this.removeActiveItem(category, key);
    });
    
    row.appendChild(removeBtn);
  }
  
  /**
   * Add name label to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} name - Display name
   * @private
   */
  addNameLabel(row, category, name) {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'active-list-name';
    
    // Format name based on category
    const displayName = this.formatDisplayName(category, name);
    nameSpan.textContent = displayName;
    nameSpan.title = displayName;
    
    nameSpan.style.cssText = `
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 8px;
    `;
    
    // Set color to match category
    const baseColor = window.outlineColors?.[category] || '#333';
    const factor = window.labelColorAdjust?.[category] ?? 1.0;
    if (window.adjustHexColor) {
      nameSpan.style.color = window.adjustHexColor(baseColor, factor);
    } else {
      nameSpan.style.color = baseColor;
    }
    
    row.appendChild(nameSpan);
  }
  
  /**
   * Format display name based on category
   * @param {string} category - Category name
   * @param {string} name - Raw name
   * @returns {string} Formatted name
   * @private
   */
  formatDisplayName(category, name) {
    if (category === 'ambulance' && window.formatAmbulanceName) {
      return window.formatAmbulanceName(name);
    }
    if (category === 'police' && window.formatPoliceName) {
      return window.formatPoliceName(name);
    }
    return name;
  }
  
  /**
   * Add emphasis toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addEmphasisToggle(row, category, key) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Emphasise');
    
    // Set initial state
    checkbox.checked = !!(window.emphasised?.[category]?.[key]);
    
    checkbox.addEventListener('change', (e) => {
      this.handleEmphasisChange(category, key, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  
  /**
   * Add label toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @private
   */
  addLabelToggle(row, category, key, name) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Show Name');
    
    // Default: checked when first added
    checkbox.checked = true;
    
    checkbox.addEventListener('change', (e) => {
      this.handleLabelChange(category, key, name, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
    
    // Show label initially if checked
    if (checkbox.checked) {
      this.showLabel(category, key, name);
    }
  }
  
  /**
   * Add weather toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addWeatherToggle(row, category, key) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Show 7-day weather');
    checkbox.className = 'sevenSevenCheckbox';
    
    checkbox.addEventListener('change', (e) => {
      this.handleWeatherChange(row, category, key, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  
  /**
   * Create a toggle cell container
   * @returns {HTMLElement} Cell element
   * @private
   */
  createToggleCell() {
    const cell = document.createElement('span');
    cell.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
    `;
    return cell;
  }
  
  /**
   * Create a toggle checkbox
   * @param {string} title - Tooltip title
   * @returns {HTMLInputElement} Checkbox element
   * @private
   */
  createToggleCheckbox(title) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.title = title;
    checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      margin: 0;
      cursor: pointer;
    `;
    return checkbox;
  }
  
  /**
   * Handle emphasis toggle change
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {boolean} enabled - Whether emphasis is enabled
   * @private
   */
  handleEmphasisChange(category, key, enabled) {
    if (window.setEmphasis) {
      const isPoint = window.categoryMeta?.[category]?.type === 'point';
      window.setEmphasis(category, key, enabled, isPoint);
    }
    
    globalEventBus.emit('activeList:emphasisChanged', {
      category,
      key,
      enabled
    });
  }
  
  /**
   * Handle label toggle change
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @param {boolean} enabled - Whether label is enabled
   * @private
   */
  handleLabelChange(category, key, name, enabled) {
    if (enabled) {
      this.showLabel(category, key, name);
    } else {
      this.hideLabel(category, key);
    }
    
    globalEventBus.emit('activeList:labelChanged', {
      category,
      key,
      name,
      enabled
    });
  }
  
  /**
   * Show label for an item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @private
   */
  showLabel(category, key, name) {
    if (!window.ensureLabel) return;
    
    const meta = window.categoryMeta?.[category];
    const isPoint = meta?.type === 'point';
    
    let layerOrMarker = null;
    if (isPoint) {
      layerOrMarker = window.featureLayers?.[category]?.[key];
    } else {
      layerOrMarker = window.featureLayers?.[category]?.[key]?.[0];
    }
    
    if (layerOrMarker) {
      window.ensureLabel(category, key, name, isPoint, layerOrMarker);
    }
  }
  
  /**
   * Hide label for an item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  hideLabel(category, key) {
    if (window.removeLabel) {
      window.removeLabel(category, key);
    }
  }
  
  /**
   * Handle weather toggle change
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {boolean} enabled - Whether weather is enabled
   * @private
   */
  async handleWeatherChange(row, category, key, enabled) {
    if (enabled) {
      // Clear other weather checkboxes (only one at a time)
      document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
        if (cb !== row.querySelector('.sevenSevenCheckbox')) {
          cb.checked = false;
        }
      });
      
      const lat = row.dataset.lat;
      const lon = row.dataset.lon;
      const meta = window.categoryMeta?.[category];
      
      if (lat && lon && meta?.type === 'polygon') {
        await this.showWeatherForLocation(lat, lon);
      } else {
        this.hideWeatherBox();
      }
    } else {
      this.hideWeatherBox();
    }
    
    globalEventBus.emit('activeList:weatherChanged', {
      category,
      key,
      enabled,
      coordinates: enabled ? { lat: row.dataset.lat, lon: row.dataset.lon } : null
    });
  }
  
  /**
   * Show weather data for a location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @private
   */
  async showWeatherForLocation(lat, lon) {
    if (!this.weatherBox) return;
    
    // Show loading state
    this.weatherBox.innerHTML = `
      <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
      <div style="display: flex; gap: 8px; align-items: center; margin-top: 24px;">
        <span>Loading weather…</span>
        <span class="spinner" style="width: 12px; height: 12px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite;"></span>
      </div>
    `;
    this.weatherBox.style.display = 'block';
    
    // Re-attach close button event
    this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
      this.hideWeatherBox();
    });
    
    try {
      const weatherData = await this.fetchWeatherData(lat, lon);
      this.renderWeatherBox(weatherData);
      this.currentWeatherLocation = { lat, lon };
    } catch (error) {
      console.error('🚨 ActiveListManager: Weather fetch failed:', error);
      this.weatherBox.innerHTML = `
        <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
        <div style="color: red; margin-top: 24px;">Error loading weather data.</div>
      `;
      
      // Re-attach close button event
      this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
        this.hideWeatherBox();
      });
    }
  }
  
  /**
   * Fetch weather data from backend
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Weather data
   * @private
   */
  async fetchWeatherData(lat, lon) {
    const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:5000'
      : '';
    
    const makeUrl = (provider) => 
      `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(provider)}`;
    
    let data;
    try {
      const res = await fetch(makeUrl(this.weatherProvider));
      if (!res.ok) throw new Error(`Weather API error ${res.status}`);
      data = await res.json();
    } catch (e) {
      // Fallback: if WillyWeather fails, try Open-Meteo
      if (this.weatherProvider === 'willyweather') {
        const res2 = await fetch(makeUrl('open-meteo'));
        if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
        data = await res2.json();
      } else {
        throw e;
      }
    }
    
    // Normalize data structure
    const days = (data.forecast || []).map((d, i) => ({
      date: `Day ${i + 1}`,
      summary: d.summary ?? '—',
      tempMin: d.tempMin,
      tempMax: d.tempMax
    }));
    
    return {
      forecastData: { days },
      historyData: { days: [] }
    };
  }
  
  /**
   * Render weather data in the weather box
   * @param {Object} weatherData - Weather data object
   * @private
   */
  renderWeatherBox(weatherData) {
    if (!this.weatherBox) return;
    
    let html = `
      <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">7-Day Weather Forecast</h3>
    `;
    
    if (weatherData.forecastData.days.length > 0) {
      html += '<ul style="margin: 0; padding: 0; list-style: none;">';
      weatherData.forecastData.days.forEach(day => {
        const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
        const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
        html += `<li style="padding: 4px 0; border-bottom: 1px solid #eee;">${day.date}: ${day.summary}${tmin}${tmax}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p style="color: #666;">No forecast data available.</p>';
    }
    
    if (weatherData.historyData.days.length > 0) {
      html += '<h3 style="margin: 16px 0 8px 0; font-size: 16px; color: #333;">Past 7 Days</h3>';
      html += '<ul style="margin: 0; padding: 0; list-style: none;">';
      weatherData.historyData.days.forEach(day => {
        html += `<li style="padding: 4px 0; border-bottom: 1px solid #eee;">${day.date}: ${day.summary}</li>`;
      });
      html += '</ul>';
    }
    
    this.weatherBox.innerHTML = html;
    
    // Re-attach close button event
    this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
      this.hideWeatherBox();
    });
    
    this.weatherBox.style.display = 'block';
  }
  
  /**
   * Hide the weather box
   * @private
   */
  hideWeatherBox() {
    if (this.weatherBox) {
      this.weatherBox.style.display = 'none';
      this.currentWeatherLocation = null;
    }
    
    // Uncheck all weather checkboxes
    document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
      cb.checked = false;
    });
  }
  
  /**
   * Remove an active item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  removeActiveItem(category, key) {
    const checkbox = this.getCategoryCheckbox(category, key);
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update our internal state
    const activeSet = this.activeItems.get(category);
    if (activeSet) {
      activeSet.delete(key);
    }
    
    // Update the list
    this.updateActiveList();
    
    globalEventBus.emit('activeList:itemRemoved', { category, key });
  }
  
  /**
   * Handle empty state
   * @param {number} totalItems - Total number of items
   * @private
   */
  handleEmptyState(totalItems) {
    if (totalItems === 0) {
      // Remove header to reduce visual noise
      this.activeList.innerHTML = '';
      
      if (this.headerElement && this.options.autoCollapse) {
        this.headerElement.classList.add('collapsed');
        this.activeList.style.display = 'none';
      }
    } else {
      // Ensure section is expanded
      if (this.headerElement) {
        this.headerElement.classList.remove('collapsed');
        this.activeList.style.display = '';
      }
    }
  }
  
  /**
   * Handle category data updates
   * @private
   */
  handleCategoryDataUpdate() {
    // Re-sync with checkboxes after data updates
    setTimeout(() => {
      this.syncWithExistingCheckboxes();
      this.updateActiveList();
    }, 100);
  }
  
  /**
   * Handle section expanded event
   * @private
   */
  handleSectionExpanded() {
    // Update list when section is expanded
    this.updateActiveList();
  }
  
  /**
   * Get current component state
   * @returns {Object} Current state
   */
  getState() {
    const activeItemsState = {};
    
    // Ensure all categories are represented
    this.categories.forEach(category => {
      const activeSet = this.activeItems.get(category);
      activeItemsState[category] = activeSet ? Array.from(activeSet) : [];
    });
    
    return {
      activeItems: activeItemsState,
      weatherProvider: this.weatherProvider,
      currentWeatherLocation: this.currentWeatherLocation,
      bulkUpdateActive: this.bulkUpdateActive
    };
  }
  
  /**
   * Apply state to component
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (state.activeItems) {
      this.activeItems.clear();
      Object.entries(state.activeItems).forEach(([category, keys]) => {
        this.activeItems.set(category, new Set(keys));
      });
    }
    
    if (state.weatherProvider) {
      this.weatherProvider = state.weatherProvider;
    }
    
    if (state.currentWeatherLocation) {
      this.currentWeatherLocation = state.currentWeatherLocation;
    }
    
    if (typeof state.bulkUpdateActive === 'boolean') {
      this.bulkUpdateActive = state.bulkUpdateActive;
    }
    
    this.updateActiveList();
  }
  
  /**
   * Get all active items across categories
   * @returns {Array} Array of {category, key, name} objects
   */
  getAllActiveItems() {
    const items = [];
    
    this.activeItems.forEach((activeSet, category) => {
      if (!window.namesByCategory?.[category]) return;
      
      activeSet.forEach(key => {
        const name = Object.keys(window.nameToKey[category] || {}).find(
          n => window.nameToKey[category][n] === key
        );
        
        if (name) {
          items.push({ category, key, name });
        }
      });
    });
    
    return items;
  }
  
  /**
   * Clear all active items
   */
  clearAllActive() {
    this.beginBulkUpdate();
    
    try {
      this.activeItems.forEach((activeSet, category) => {
        activeSet.forEach(key => {
          const checkbox = this.getCategoryCheckbox(category, key);
          if (checkbox) {
            checkbox.checked = false;
          }
        });
        activeSet.clear();
      });
      
      globalEventBus.emit('activeList:cleared');
    } finally {
      this.endBulkUpdate();
    }
  }
  
  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (!this.isInitialized) return;
    
    console.log('🔄 ActiveListManager: Destroying...');
    
    // Clear timers
    clearTimeout(this.bulkUpdateTimer);
    
    // Remove event listeners
    globalEventBus.off('data:layersLoaded', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerAdded', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerRemoved', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerToggled', this.updateActiveList);
    
    // Clean up checkbox listeners
    this.categories.forEach(category => {
      if (!window.namesByCategory?.[category]) return;
      
      window.namesByCategory[category].forEach(name => {
        const key = window.nameToKey[category][name];
        const checkbox = this.getCategoryCheckbox(category, key);
        
        if (checkbox && checkbox._modernBound) {
          checkbox.removeEventListener('change', this.handleCheckboxChange);
          checkbox._modernBound = false;
        }
      });
    });
    
    // Remove weather box
    if (this.weatherBox && this.weatherBox.parentNode) {
      this.weatherBox.parentNode.removeChild(this.weatherBox);
    }
    
    // Clear state
    this.activeItems.clear();
    this.currentWeatherLocation = null;
    
    // Clean up DOM references
    this.activeList = null;
    this.headerElement = null;
    this.weatherBox = null;
    
    this.isInitialized = false;
    
    console.log('✅ ActiveListManager: Destroyed');
  }
}

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.ActiveListManager = ActiveListManager;
  
  // Legacy functions for backward compatibility
  window.beginActiveListBulk = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.beginBulkUpdate();
    }
  };
  
  window.endActiveListBulk = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.endBulkUpdate();
    }
  };
  
  window.updateActiveList = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.updateActiveList();
    }
  };
}

console.log('🎯 ActiveListManager: Module loaded');

/**
 * @fileoverview MobileDocsNavManager - Modern mobile documentation navigation component
 * @description Provides enhanced mobile navigation for documentation with hamburger menu,
 * touch gestures, accessibility support, and seamless responsive behavior
 * @module components/MobileDocsNavManager
 */


/**
 * Modern mobile documentation navigation manager
 * Replaces legacy js/ui/mobileDocsNav.js with enhanced features
 */
class MobileDocsNavManager extends ComponentBase {
  /**
   * Initialize MobileDocsNavManager
   * @param {HTMLElement} container - Container element for mobile navigation
   * @param {Object} options - Configuration options
   * @param {StateManager} options.stateManager - State management system
   * @param {EventBus} options.eventBus - Event communication system
   * @param {number} [options.mobileBreakpoint=768] - Mobile breakpoint in pixels
   * @param {boolean} [options.enableGestures=true] - Enable touch gesture support
   * @param {boolean} [options.enableAccessibility=true] - Enable accessibility features
   * @param {boolean} [options.enableHaptics=true] - Enable haptic feedback
   */
  constructor(container, options = {}) {
    super(container, options);
    
    this.name = 'MobileDocsNavManager';
    this.stateManager = options.stateManager;
    this.eventBus = options.eventBus;
    
    // Configuration
    this.mobileBreakpoint = options.mobileBreakpoint || 768;
    this.enableGestures = options.enableGestures !== false;
    this.enableAccessibility = options.enableAccessibility !== false;
    this.enableHaptics = options.enableHaptics !== false;
    
    // State
    this.isInitialized = false;
    this.isMobile = false;
    this.isMenuOpen = false;
    this.currentDoc = null;
    this.navItems = [];
    this.resizeObserver = null;
    
    // DOM elements
    this.docsContent = null;
    this.docsToc = null;
    this.hamburgerContainer = null;
    this.hamburgerButton = null;
    this.dropdownMenu = null;
    this.menuLinks = null;
    
    // Event handlers (bound for cleanup)
    this.boundHandlers = {
      resize: this.handleResize.bind(this),
      documentClick: this.handleDocumentClick.bind(this),
      keydown: this.handleKeydown.bind(this),
      hamburgerClick: this.handleHamburgerClick.bind(this),
      linkClick: this.handleLinkClick.bind(this),
      docsOpened: this.handleDocsOpened.bind(this),
      docsClosed: this.handleDocsClosed.bind(this)
    };
    
    // Touch gesture support
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.swipeThreshold = 100; // pixels
    this.swipeTimeThreshold = 300; // milliseconds
  }
  
  /**
   * Initialize the mobile documentation navigation manager
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      console.warn(`${this.name}: Already initialized`);
      return;
    }
    
    try {
      console.log(`📱 ${this.name}: Initializing mobile documentation navigation...`);
      
      // Find DOM elements
      this.findDOMElements();
      
      // Check mobile state
      this.updateMobileState();
      
      // Extract navigation items
      this.extractNavigationItems();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initial render
      this.render();
      
      // Set up accessibility
      if (this.enableAccessibility) {
        this.setupAccessibility();
      }
      
      // Set up touch gestures
      if (this.enableGestures) {
        this.setupGestures();
      }
      
      // Set up resize observer for performance
      this.setupResizeObserver();
      
      // Expose global functions for legacy compatibility
      this.exposeGlobalFunctions();
      
      this.isInitialized = true;
      
      // Emit initialization event
      this.eventBus?.emit('mobileDocsNav:initialized', {
        component: this.name,
        isMobile: this.isMobile,
        navItems: this.navItems.length
      });
      
      console.log(`✅ ${this.name}: Initialized successfully (${this.navItems.length} nav items)`);
      
    } catch (error) {
      console.error(`🚨 ${this.name}: Initialization failed:`, error);
      throw error;
    }
  }
  
  /**
   * Find required DOM elements
   * @private
   */
  findDOMElements() {
    // Find docs content container
    this.docsContent = document.querySelector('.docs-content');
    if (!this.docsContent) {
      console.warn(`${this.name}: Docs content container not found`);
    }
    
    // Find table of contents
    this.docsToc = document.querySelector('.docs-toc');
    if (!this.docsToc) {
      console.warn(`${this.name}: Documentation TOC not found`);
    }
    
    console.log(`${this.name}: Found DOM elements - Content: ${!!this.docsContent}, TOC: ${!!this.docsToc}`);
  }
  
  /**
   * Extract navigation items from existing TOC
   * @private
   */
  extractNavigationItems() {
    this.navItems = [];
    
    if (!this.docsToc) {
      console.warn(`${this.name}: No TOC found, cannot extract navigation items`);
      return;
    }
    
    // Find all navigation links
    const tocLinks = this.docsToc.querySelectorAll('a[data-doc]');
    
    tocLinks.forEach(link => {
      const docSlug = link.getAttribute('data-doc');
      const title = link.textContent.trim();
      const href = link.href;
      const isActive = link.classList.contains('active');
      
      if (docSlug && title) {
        this.navItems.push({
          slug: docSlug,
          title: title,
          href: href,
          isActive: isActive,
          element: link
        });
      }
    });
    
    // Update current document
    const activeItem = this.navItems.find(item => item.isActive);
    if (activeItem) {
      this.currentDoc = activeItem.slug;
    }
    
    console.log(`${this.name}: Extracted ${this.navItems.length} navigation items`);
    
    // Emit navigation items extracted event
    this.eventBus?.emit('mobileDocsNav:navItemsExtracted', {
      items: this.navItems,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Update mobile state based on viewport
   * @private
   */
  updateMobileState() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= this.mobileBreakpoint;
    
    if (wasMobile !== this.isMobile) {
      console.log(`${this.name}: Mobile state changed: ${this.isMobile} (width: ${window.innerWidth}px)`);
      
      // Emit mobile state change event
      this.eventBus?.emit('mobileDocsNav:mobileStateChanged', {
        isMobile: this.isMobile,
        width: window.innerWidth,
        breakpoint: this.mobileBreakpoint
      });
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.boundHandlers.resize, { passive: true });
    
    // Document click for closing menu
    document.addEventListener('click', this.boundHandlers.documentClick);
    
    // Keyboard navigation
    document.addEventListener('keydown', this.boundHandlers.keydown);
    
    // Docs events
    window.addEventListener('docs-opened', this.boundHandlers.docsOpened);
    window.addEventListener('docs-closed', this.boundHandlers.docsClosed);
    
    // EventBus events
    if (this.eventBus) {
      this.eventBus.on('docs:loaded', this.boundHandlers.docsOpened);
      this.eventBus.on('docs:closed', this.boundHandlers.docsClosed);
    }
    
    console.log(`${this.name}: Event listeners set up`);
  }
  
  /**
   * Set up resize observer for performance
   * @private
   */
  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === document.documentElement) {
            this.handleResize();
            break;
          }
        }
      });
      
      this.resizeObserver.observe(document.documentElement);
      console.log(`${this.name}: ResizeObserver set up`);
    }
  }
  
  /**
   * Set up accessibility features
   * @private
   */
  setupAccessibility() {
    if (!this.hamburgerButton) return;
    
    // ARIA attributes
    this.hamburgerButton.setAttribute('role', 'button');
    this.hamburgerButton.setAttribute('aria-haspopup', 'true');
    this.hamburgerButton.setAttribute('aria-expanded', 'false');
    this.hamburgerButton.setAttribute('aria-label', 'Open documentation navigation menu');
    
    if (this.dropdownMenu) {
      this.dropdownMenu.setAttribute('role', 'menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'true');
      
      // Set up menu item accessibility
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach((link, index) => {
        link.setAttribute('role', 'menuitem');
        link.setAttribute('tabindex', this.isMenuOpen ? '0' : '-1');
      });
    }
    
    console.log(`${this.name}: Accessibility features set up`);
  }
  
  /**
   * Set up touch gesture support
   * @private
   */
  setupGestures() {
    if (!this.dropdownMenu) return;
    
    // Swipe down to close menu
    this.dropdownMenu.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }, { passive: true });
    
    this.dropdownMenu.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaY = touchEndY - this.touchStartY;
      const deltaTime = touchEndTime - this.touchStartTime;
      
      // Swipe down gesture
      if (deltaY > this.swipeThreshold && deltaTime < this.swipeTimeThreshold) {
        this.closeMenu();
      }
    }, { passive: true });
    
    console.log(`${this.name}: Touch gestures set up`);
  }
  
  /**
   * Render the mobile navigation interface
   * @private
   */
  render() {
    if (!this.docsContent) {
      console.log(`${this.name}: No docs content found, skipping render`);
      return;
    }
    
    // Remove existing mobile navigation
    this.cleanup();
    
    if (!this.isMobile) {
      console.log(`${this.name}: Not mobile, skipping mobile navigation render`);
      return;
    }
    
    if (this.navItems.length === 0) {
      console.log(`${this.name}: No navigation items, skipping render`);
      return;
    }
    
    // Create hamburger navigation
    this.createHamburgerNavigation();
    
    console.log(`${this.name}: Mobile navigation rendered`);
    
    // Emit render event
    this.eventBus?.emit('mobileDocsNav:rendered', {
      isMobile: this.isMobile,
      navItems: this.navItems.length
    });
  }
  
  /**
   * Create hamburger-style navigation
   * @private
   */
  createHamburgerNavigation() {
    // Find insertion point (first h1 in docs content)
    const pageTitle = this.docsContent.querySelector('h1');
    if (!pageTitle) {
      console.warn(`${this.name}: No page title found for hamburger insertion`);
      return;
    }
    
    // Create container
    this.hamburgerContainer = document.createElement('div');
    this.hamburgerContainer.className = 'mobile-docs-nav-container';
    
    // Create hamburger button
    this.hamburgerButton = document.createElement('button');
    this.hamburgerButton.className = 'mobile-docs-hamburger-btn';
    this.hamburgerButton.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-text">Navigation</span>
    `;
    
    // Create dropdown menu
    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = 'mobile-docs-dropdown-menu hidden';
    
    // Create menu header
    const menuHeader = document.createElement('div');
    menuHeader.className = 'mobile-docs-menu-header';
    menuHeader.innerHTML = '<h3>📚 Documentation</h3>';
    
    // Create menu links container
    this.menuLinks = document.createElement('div');
    this.menuLinks.className = 'mobile-docs-menu-links';
    
    // Add navigation links
    this.navItems.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.className = 'mobile-docs-menu-link';
      link.setAttribute('data-doc', item.slug);
      link.textContent = item.title;
      
      if (item.isActive) {
        link.classList.add('active');
      }
      
      // Add click handler
      link.addEventListener('click', this.boundHandlers.linkClick);
      
      this.menuLinks.appendChild(link);
    });
    
    // Assemble dropdown
    this.dropdownMenu.appendChild(menuHeader);
    this.dropdownMenu.appendChild(this.menuLinks);
    
    // Assemble container
    this.hamburgerContainer.appendChild(this.hamburgerButton);
    this.hamburgerContainer.appendChild(this.dropdownMenu);
    
    // Insert before page title
    pageTitle.parentNode.insertBefore(this.hamburgerContainer, pageTitle);
    
    // Set up button click handler
    this.hamburgerButton.addEventListener('click', this.boundHandlers.hamburgerClick);
    
    // Set up accessibility
    if (this.enableAccessibility) {
      this.setupAccessibility();
    }
    
    // Set up gestures
    if (this.enableGestures) {
      this.setupGestures();
    }
    
    console.log(`${this.name}: Hamburger navigation created`);
  }
  
  /**
   * Toggle the dropdown menu
   */
  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
  
  /**
   * Open the dropdown menu
   */
  openMenu() {
    if (this.isMenuOpen || !this.dropdownMenu || !this.hamburgerButton) return;
    
    console.log(`${this.name}: Opening menu`);
    
    this.isMenuOpen = true;
    
    // Update DOM
    this.dropdownMenu.classList.remove('hidden');
    this.hamburgerButton.classList.add('active');
    
    // Update accessibility
    if (this.enableAccessibility) {
      this.hamburgerButton.setAttribute('aria-expanded', 'true');
      this.hamburgerButton.setAttribute('aria-label', 'Close documentation navigation menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'false');
      
      // Enable menu item tabbing
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        link.setAttribute('tabindex', '0');
      });
    }
    
    // Haptic feedback
    if (this.enableHaptics && window.NativeFeatures?.hapticFeedback) {
      window.NativeFeatures.hapticFeedback('light');
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:menuOpened', {
      navItems: this.navItems.length
    });
    
    // Focus first menu item for keyboard users
    const firstLink = this.dropdownMenu.querySelector('.mobile-docs-menu-link');
    if (firstLink && document.activeElement === this.hamburgerButton) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }
  
  /**
   * Close the dropdown menu
   */
  closeMenu() {
    if (!this.isMenuOpen || !this.dropdownMenu || !this.hamburgerButton) return;
    
    console.log(`${this.name}: Closing menu`);
    
    this.isMenuOpen = false;
    
    // Update DOM
    this.dropdownMenu.classList.add('hidden');
    this.hamburgerButton.classList.remove('active');
    
    // Update accessibility
    if (this.enableAccessibility) {
      this.hamburgerButton.setAttribute('aria-expanded', 'false');
      this.hamburgerButton.setAttribute('aria-label', 'Open documentation navigation menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'true');
      
      // Disable menu item tabbing
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        link.setAttribute('tabindex', '-1');
      });
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:menuClosed', {});
  }
  
  /**
   * Update active navigation item
   * @param {string} docSlug - Document slug to mark as active
   */
  updateActiveItem(docSlug) {
    if (this.currentDoc === docSlug) return;
    
    console.log(`${this.name}: Updating active item to: ${docSlug}`);
    
    this.currentDoc = docSlug;
    
    // Update navigation items
    this.navItems.forEach(item => {
      item.isActive = item.slug === docSlug;
    });
    
    // Update menu links if they exist
    if (this.menuLinks) {
      const menuLinks = this.menuLinks.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        const linkSlug = link.getAttribute('data-doc');
        if (linkSlug === docSlug) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:activeItemChanged', {
      docSlug: docSlug,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Refresh navigation items from TOC
   */
  refreshNavigation() {
    console.log(`${this.name}: Refreshing navigation`);
    
    // Re-extract navigation items
    this.extractNavigationItems();
    
    // Re-render if mobile
    if (this.isMobile) {
      this.render();
    }
    
    // Emit refresh event
    this.eventBus?.emit('mobileDocsNav:refreshed', {
      navItems: this.navItems.length,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    const oldMobile = this.isMobile;
    this.updateMobileState();
    
    // Re-render if mobile state changed
    if (oldMobile !== this.isMobile) {
      this.render();
    }
  }
  
  /**
   * Handle document click (for closing menu)
   * @private
   */
  handleDocumentClick(event) {
    if (!this.isMenuOpen || !this.hamburgerContainer) return;
    
    // Close menu if clicking outside
    if (!this.hamburgerContainer.contains(event.target)) {
      this.closeMenu();
    }
  }
  
  /**
   * Handle keyboard navigation
   * @private
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'Escape':
        if (this.isMenuOpen) {
          event.preventDefault();
          this.closeMenu();
          // Return focus to hamburger button
          if (this.hamburgerButton) {
            this.hamburgerButton.focus();
          }
        }
        break;
        
      case 'ArrowDown':
        if (this.isMenuOpen && this.dropdownMenu?.contains(document.activeElement)) {
          event.preventDefault();
          this.focusNextMenuItem();
        }
        break;
        
      case 'ArrowUp':
        if (this.isMenuOpen && this.dropdownMenu?.contains(document.activeElement)) {
          event.preventDefault();
          this.focusPreviousMenuItem();
        }
        break;
        
      case 'Enter':
      case ' ':
        if (document.activeElement === this.hamburgerButton) {
          event.preventDefault();
          this.toggleMenu();
        }
        break;
    }
  }
  
  /**
   * Focus next menu item
   * @private
   */
  focusNextMenuItem() {
    const menuLinks = Array.from(this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link'));
    const currentIndex = menuLinks.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % menuLinks.length;
    menuLinks[nextIndex]?.focus();
  }
  
  /**
   * Focus previous menu item
   * @private
   */
  focusPreviousMenuItem() {
    const menuLinks = Array.from(this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link'));
    const currentIndex = menuLinks.indexOf(document.activeElement);
    const prevIndex = currentIndex <= 0 ? menuLinks.length - 1 : currentIndex - 1;
    menuLinks[prevIndex]?.focus();
  }
  
  /**
   * Handle hamburger button click
   * @private
   */
  handleHamburgerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu();
  }
  
  /**
   * Handle navigation link click
   * @private
   */
  handleLinkClick(event) {
    const link = event.target;
    const docSlug = link.getAttribute('data-doc');
    
    if (docSlug) {
      // Update active item
      this.updateActiveItem(docSlug);
      
      // Close menu
      this.closeMenu();
      
      // Haptic feedback
      if (this.enableHaptics && window.NativeFeatures?.hapticFeedback) {
        window.NativeFeatures.hapticFeedback('light');
      }
      
      // Emit navigation event
      this.eventBus?.emit('mobileDocsNav:navigationClick', {
        docSlug: docSlug,
        title: link.textContent.trim()
      });
    }
  }
  
  /**
   * Handle docs opened event
   * @private
   */
  handleDocsOpened(event) {
    console.log(`${this.name}: Docs opened, refreshing navigation`);
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      this.findDOMElements();
      this.refreshNavigation();
    }, 100);
  }
  
  /**
   * Handle docs closed event
   * @private
   */
  handleDocsClosed(event) {
    console.log(`${this.name}: Docs closed, cleaning up mobile navigation`);
    this.cleanup();
  }
  
  /**
   * Expose global functions for legacy compatibility
   * @private
   */
  exposeGlobalFunctions() {
    // Expose manager instance globally
    window.MobileDocsNavManager = this;
    
    // Legacy API compatibility
    window.MobileDocsNav = {
      init: () => this.init(),
      setupDocsNavigation: () => this.refreshNavigation(),
      onDocsOpen: () => this.handleDocsOpened(),
      highlightCurrentPage: (slug) => this.updateActiveItem(slug),
      removeMobileElements: () => this.cleanup()
    };
    
    console.log(`${this.name}: Global functions exposed for legacy compatibility`);
  }
  
  /**
   * Get current state
   * @returns {Object} Current component state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isMobile: this.isMobile,
      isMenuOpen: this.isMenuOpen,
      currentDoc: this.currentDoc,
      navItems: this.navItems.map(item => ({
        slug: item.slug,
        title: item.title,
        isActive: item.isActive
      })),
      mobileBreakpoint: this.mobileBreakpoint
    };
  }
  
  /**
   * Apply state configuration
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (state.currentDoc && state.currentDoc !== this.currentDoc) {
      this.updateActiveItem(state.currentDoc);
    }
    
    if (state.isMenuOpen !== undefined && state.isMenuOpen !== this.isMenuOpen) {
      if (state.isMenuOpen) {
        this.openMenu();
      } else {
        this.closeMenu();
      }
    }
  }
  
  /**
   * Clean up mobile navigation elements
   */
  cleanup() {
    // Close menu if open
    if (this.isMenuOpen) {
      this.closeMenu();
    }
    
    // Remove hamburger navigation
    if (this.hamburgerContainer) {
      this.hamburgerContainer.remove();
      this.hamburgerContainer = null;
      this.hamburgerButton = null;
      this.dropdownMenu = null;
      this.menuLinks = null;
    }
    
    // Remove any other mobile navigation elements
    const mobileElements = document.querySelectorAll('.mobile-docs-nav-container, .docs-mobile-menu-container, .mobile-nav-hint, .docs-toc-toggle');
    mobileElements.forEach(element => element.remove());
    
    console.log(`${this.name}: Mobile navigation cleaned up`);
  }
  
  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (!this.isInitialized) return;
    
    console.log(`${this.name}: Destroying component...`);
    
    // Clean up mobile navigation
    this.cleanup();
    
    // Remove event listeners
    window.removeEventListener('resize', this.boundHandlers.resize);
    document.removeEventListener('click', this.boundHandlers.documentClick);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('docs-opened', this.boundHandlers.docsOpened);
    window.removeEventListener('docs-closed', this.boundHandlers.docsClosed);
    
    // Clean up EventBus listeners
    if (this.eventBus) {
      this.eventBus.off('docs:loaded', this.boundHandlers.docsOpened);
      this.eventBus.off('docs:closed', this.boundHandlers.docsClosed);
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Reset state
    this.isInitialized = false;
    this.navItems = [];
    this.currentDoc = null;
    
    // Remove global functions
    if (window.MobileDocsNavManager === this) {
      delete window.MobileDocsNavManager;
    }
    if (window.MobileDocsNav) {
      delete window.MobileDocsNav;
    }
    
    // Emit destroy event
    this.eventBus?.emit('mobileDocsNav:destroyed', {
      component: this.name
    });
    
    console.log(`${this.name}: Component destroyed`);
  }
}

/**
 * @module modules/app
 * Main application entry point for the modern ES module system
 * Orchestrates initialization and provides fallback to legacy system
 */


/**
 * @class App
 * Main application controller that orchestrates all systems
 * Integrates with legacy bootstrap while providing modern enhancements
 */
class App {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.version = '2.0.0-modern';
    this.initStartTime = performance.now();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.handleError = this.handleError.bind(this);
    this.fallbackToLegacy = this.fallbackToLegacy.bind(this);
    
    console.log(`🚀 WeeWoo Map Friend ${this.version} - Modern Module System Starting`);
  }
  
  /**
   * Initialize the modern application system
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      console.warn('App: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 App: Starting modern application initialization...');
      
      // Phase 1: Error handling and compatibility checks
      this.setupErrorHandling();
      
      // Phase 2: Check if we should proceed with modern system
      if (!this.checkModernCompatibility()) {
        throw new Error('Modern system compatibility check failed');
      }
      
      // Phase 3: Wait for DOM and basic dependencies
      await this.waitForDOM();
      await this.waitForLegacyDependencies();
      
      // Phase 4: Initialize modern components (non-conflicting)
      await this.initStateManager();
      await this.initLegacyBridge();
      
      // Phase 5: Initialize device context (from legacy)
      await this.initDeviceContext();
      
      // Phase 6: Set up modern enhancements
      await this.initModernComponents();
      
      // Phase 7: Set up global event listeners
      this.setupGlobalEvents();
      
      // Phase 8: Mark as initialized and emit event
      this.initialized = true;
      globalEventBus.emit('app:modernInitialized', { app: this });
      
      const initTime = performance.now() - this.initStartTime;
      console.log(`✅ App: Modern system initialization complete (${initTime.toFixed(2)}ms)`);
      
      // Phase 9: Let legacy system handle core map functionality
      console.log('🤝 App: Delegating core initialization to legacy bootstrap');
      
    } catch (error) {
      console.error('🚨 App: Modern system initialization failed:', error);
      this.handleError(error);
      
      // Attempt fallback to legacy system
      await this.fallbackToLegacy(error);
      throw error; // Re-throw to trigger index.html fallback
    }
  }
  
  /**
   * Check modern system compatibility
   * @returns {boolean} Whether modern system should proceed
   * @private
   */
  checkModernCompatibility() {
    try {
      // Check for required APIs
      const requiredAPIs = [
        'Promise',
        'Map',
        'Set',
        'fetch',
        'CustomEvent',
        'Proxy'
      ];
      
      for (const api of requiredAPIs) {
        if (!(api in window)) {
          console.warn(`App: Missing required API: ${api}`);
          return false;
        }
      }
      
      // Check for ES6 module support (already verified by reaching here)
      // Check for basic DOM APIs
      if (!document.querySelector || !document.addEventListener) {
        console.warn('App: Missing essential DOM APIs');
        return false;
      }
      
      console.log('✅ App: Modern compatibility check passed');
      return true;
      
    } catch (error) {
      console.warn('App: Compatibility check failed:', error);
      return false;
    }
  }
  
  /**
   * Set up global error handling with fallback mechanisms
   * @private
   */
  setupErrorHandling() {
    // Global unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 App: Unhandled promise rejection:', event.reason);
      globalEventBus.emit('app:error', { 
        type: 'unhandledRejection', 
        error: event.reason,
        critical: true
      });
      
      // Prevent default to avoid console spam
      event.preventDefault();
    });
    
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('🚨 App: JavaScript error:', event.error);
      globalEventBus.emit('app:error', { 
        type: 'javascriptError', 
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        critical: false
      });
    });
    
    // Track app-specific errors
    globalEventBus.on('app:error', ({ error, critical }) => {
      if (critical && !this.initialized) {
        console.error('🚨 App: Critical error during initialization, triggering fallback');
        this.fallbackToLegacy(error);
      }
    });
  }
  
  /**
   * Wait for DOM to be ready
   * @returns {Promise<void>}
   * @private
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Wait for critical legacy dependencies to be available
   * @returns {Promise<void>}
   * @private
   */
  async waitForLegacyDependencies() {
    console.log('⏳ App: Waiting for legacy dependencies...');
    
    const dependencies = [
      { name: 'L', global: 'L', timeout: 5000 },
      { name: 'DeviceContext', global: 'DeviceContext', timeout: 2000 },
      { name: 'AppBootstrap', global: 'AppBootstrap', timeout: 3000 }
    ];
    
    const promises = dependencies.map(dep => this.waitForGlobal(dep.global, dep.timeout, dep.name));
    
    try {
      await Promise.all(promises);
      console.log('✅ App: All legacy dependencies ready');
    } catch (error) {
      console.warn('⚠️ App: Some legacy dependencies not ready:', error.message);
      // Continue anyway - some dependencies are optional
    }
  }
  
  /**
   * Wait for a global variable to be available
   * @param {string} globalName - Name of global variable
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} friendlyName - Human-readable name for logging
   * @returns {Promise<any>} The global variable when available
   * @private
   */
  async waitForGlobal(globalName, timeout = 5000, friendlyName = globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      
      let attempts = 0;
      const maxAttempts = timeout / 100;
      
      const check = () => {
        if (window[globalName]) {
          console.log(`✅ App: ${friendlyName} ready`);
          resolve(window[globalName]);
        } else if (attempts++ >= maxAttempts) {
          reject(new Error(`Timeout waiting for ${friendlyName}`));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Initialize state management system
   * @private
   */
  async initStateManager() {
    console.log('📊 App: Initializing state manager...');
    
    try {
      // StateManager is initialized in constructor, no async init needed
      
      // Subscribe to important state changes
      stateManager.subscribe('error', (error) => {
        this.handleError(error);
      });
      
      // Set up computed properties that depend on legacy state
      stateManager.computed('isMapReady', () => {
        return !!window.map;
      }, ['map']);
      
      globalEventBus.emit('app:stateManagerReady', { stateManager });
      console.log('✅ App: State manager ready');
      
    } catch (error) {
      console.error('🚨 App: Failed to initialize state manager:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy bridge system
   * @private
   */
  async initLegacyBridge() {
    console.log('🌉 App: Initializing legacy bridge...');
    
    try {
      await legacyBridge.init();
      
      // Register for legacy system events
      this.setupLegacyIntegration();
      
      console.log('✅ App: Legacy bridge ready');
      
    } catch (error) {
      console.error('🚨 App: Failed to initialize legacy bridge:', error);
      // Bridge failure is not critical - continue without it
    }
  }
  
  /**
   * Set up integration with legacy system events
   * @private
   */
  setupLegacyIntegration() {
    // Listen for legacy bootstrap completion
    if (window.AppBootstrap) {
      // Hook into legacy initialization
      const originalInit = window.AppBootstrap.init;
      window.AppBootstrap.init = async function(...args) {
        console.log('🤝 App: Legacy bootstrap starting...');
        
        try {
          const result = await originalInit.apply(this, args);
          
          // After legacy init, set up modern enhancements
          globalEventBus.emit('app:legacyBootstrapComplete');
          console.log('✅ App: Legacy bootstrap complete, modern enhancements available');
          
          return result;
        } catch (error) {
          console.error('🚨 App: Legacy bootstrap failed:', error);
          globalEventBus.emit('app:legacyBootstrapError', { error });
          throw error;
        }
      };
    }
    
    // Listen for docs events
    window.addEventListener('docs-opened', (event) => {
      console.log('📚 App: Docs opened, setting up modern navigation');
      this.handleDocsOpened(event.detail);
    });
    
    // Listen for map events
    globalEventBus.on('app:legacyBootstrapComplete', () => {
      if (window.map) {
        stateManager.set('map', window.map);
        stateManager.set('mapReady', true);
        console.log('🗺️ App: Map integration complete');
      }
    });
  }
  
  /**
   * Initialize device context from legacy system
   * @private
   */
  async initDeviceContext() {
    console.log('📱 App: Initializing device context...');
    
    try {
      if (window.DeviceContext) {
        const context = window.DeviceContext.getContext();
        stateManager.set('deviceContext', context);
        console.log('✅ App: Device context initialized:', context);
      } else {
        // Fallback device detection
        const context = {
          isMobile: window.innerWidth <= 768,
          isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
          isDesktop: window.innerWidth > 1024,
          isTouch: 'ontouchstart' in window,
          userAgent: navigator.userAgent
        };
        stateManager.set('deviceContext', context);
        console.log('⚠️ App: Using fallback device context:', context);
      }
      
    } catch (error) {
      console.error('🚨 App: Device context initialization failed:', error);
    }
  }
  
  /**
   * Initialize modern components and enhancements
   * @private
   */
  async initModernComponents() {
    console.log('🎨 App: Initializing modern components...');
    
    try {
      // Initialize router for docs
      this.initRouter();
      
      // Initialize collapsible manager for sidebar
      await this.initCollapsibleManager();
      
      // Initialize search manager for global search
      await this.initSearchManager();
      
      // Initialize active list manager for "All Active" section
      await this.initActiveListManager();
      
      // Initialize mobile docs navigation manager
      await this.initMobileDocsNavManager();
      
      // Set up mobile enhancement handlers
      this.setupMobileEnhancements();
      
      globalEventBus.emit('app:modernComponentsReady');
      console.log('✅ App: Modern components ready');
      
    } catch (error) {
      console.error('🚨 App: Modern components initialization failed:', error);
      // Component failures are not critical - continue
    }
  }
  
  /**
   * Initialize routing system
   * @private
   */
  initRouter() {
    try {
      // Set up router event listeners
      docsRouter.on('docs:loaded', (data) => {
        globalEventBus.emit('app:docsLoaded', data);
      });
      
      docsRouter.on('docs:error', (data) => {
        console.error('📚 App: Docs loading error:', data);
      });
      
      // Initialize router
      docsRouter.init();
      
    } catch (error) {
      console.error('🚨 App: Router initialization failed:', error);
    }
  }
  
  /**
   * Initialize collapsible manager for sidebar sections
   * @private
   */
  async initCollapsibleManager() {
    try {
      const sidebarContainer = document.getElementById('layerMenu');
      if (!sidebarContainer) {
        console.warn('⚠️ App: No sidebar container found for CollapsibleManager');
        return;
      }

      const collapsibleManager = new CollapsibleManager(sidebarContainer, {
        autoCollapseOthers: true,
        persistState: true,
        animationDuration: 200,
        stickyHeaders: true
      });

      await collapsibleManager.init();
      
      this.registerComponent('collapsibleManager', collapsibleManager);
      console.log('📁 App: CollapsibleManager initialized');

    } catch (error) {
      console.error('🚨 App: CollapsibleManager initialization failed:', error);
      // Non-critical failure - continue without modern collapsible
    }
  }
  
  /**
   * Initialize search manager for global sidebar search
   * @private
   */
  async initSearchManager() {
    try {
      const searchContainer = document.querySelector('.search-container') || 
                             document.querySelector('#globalSidebarSearch')?.parentElement;
      
      if (!searchContainer) {
        console.warn('⚠️ App: No search container found for SearchManager');
        return;
      }

      const searchManager = new SearchManager(searchContainer, {
        debounceDelay: 300,
        maxResults: 10,
        highlightDuration: 2000,
        enableKeyboardNavigation: true
      });

      await searchManager.init();
      
      this.registerComponent('searchManager', searchManager);
      console.log('🔍 App: SearchManager initialized');

      // Set up integration with collapsible manager
      const collapsibleManager = this.getComponent('collapsibleManager');
      if (collapsibleManager) {
        // Listen for search results that need section expansion
        globalEventBus.on('search:selected', ({ category }) => {
          console.log(`🔍 App: Expanding section ${category} for search result`);
        });
      }

    } catch (error) {
      console.error('🚨 App: SearchManager initialization failed:', error);
      // Non-critical failure - continue without modern search
    }
  }
  
  /**
   * Initialize ActiveListManager with modern state synchronization
   * @private
   */
  initActiveListManager() {
    try {
      console.log('📋 App: Initializing ActiveListManager...');
      
      // Find the All Active section container
      const activeListContainer = document.querySelector('.collapsible-section[data-category="all-active"]');
      if (!activeListContainer) {
        console.warn('⚠️ App: All Active section container not found, skipping ActiveListManager');
        return;
      }

      // Initialize ActiveListManager with state coordination
      this.activeListManager = new ActiveListManager(activeListContainer, {
        stateManager: this.stateManager,
        eventBus: globalEventBus,
        weatherApiKey: 'your-api-key-here', // TODO: Configure in production
        enableWeather: true,
        enableBulkOperations: true,
        enableAccessibility: true
      });

      console.log('✅ App: ActiveListManager initialized successfully');

      // Listen for active list events and coordinate with other components
      globalEventBus.on('activeList:updated', (data) => {
        console.log(`📋 App: Active list updated with ${data.count} items`);
      });

      globalEventBus.on('activeList:weatherUpdated', (data) => {
        console.log(`🌤️ App: Weather updated for ${data.location}: ${data.condition}`);
      });

    } catch (error) {
      console.error('🚨 App: ActiveListManager initialization failed:', error);
      // Non-critical failure - continue without modern active list management
    }
  }
  
  /**
   * Initialize MobileDocsNavManager for enhanced mobile documentation navigation
   * @private
   */
  initMobileDocsNavManager() {
    try {
      console.log('📱 App: Initializing MobileDocsNavManager...');
      
      // Find the docs content container
      const docsContainer = document.querySelector('.docs-content') || document.body;
      
      // Initialize MobileDocsNavManager with responsive behavior
      this.mobileDocsNavManager = new MobileDocsNavManager(docsContainer, {
        stateManager: this.stateManager,
        eventBus: globalEventBus,
        mobileBreakpoint: 768,
        enableGestures: true,
        enableAccessibility: true,
        enableHaptics: true
      });

      console.log('✅ App: MobileDocsNavManager initialized successfully');

      // Listen for mobile navigation events
      globalEventBus.on('mobileDocsNav:navigationClick', (data) => {
        console.log(`📱 App: Mobile docs navigation to ${data.docSlug}: ${data.title}`);
      });

      globalEventBus.on('mobileDocsNav:mobileStateChanged', (data) => {
        console.log(`📱 App: Mobile state changed: ${data.isMobile} (${data.width}px)`);
      });

    } catch (error) {
      console.error('🚨 App: MobileDocsNavManager initialization failed:', error);
      // Non-critical failure - continue without modern mobile docs navigation
    }
  }
  
  /**
   * Set up mobile-specific enhancements
   * @private
   */
  setupMobileEnhancements() {
    // Listen for docs opening to set up mobile navigation
    globalEventBus.on('app:docsLoaded', () => {
      this.setupMobileDocumentationMenu();
    });
    
    // Also listen for direct docs-opened events
    window.addEventListener('docs-opened', () => {
      setTimeout(() => this.setupMobileDocumentationMenu(), 100);
    });
  }
  
  /**
   * Handle docs opened event
   * @param {Object} detail - Event detail
   * @private
   */
  handleDocsOpened(detail) {
    console.log('📚 App: Handling docs opened:', detail);
    
    const deviceContext = stateManager.get('deviceContext');
    if (deviceContext && deviceContext.isMobile) {
      this.setupMobileDocumentationMenu();
    }
  }
  
  /**
   * Set up mobile documentation hamburger menu
   * @private
   */
  async setupMobileDocumentationMenu() {
    const deviceContext = stateManager.get('deviceContext');
    if (!deviceContext || !deviceContext.isMobile) {
      return; // Only for mobile
    }
    
    try {
      // Check if already created
      if (this.components.has('mobileDocsMenu')) {
        console.log('🍔 App: Mobile docs menu already exists');
        return;
      }
      
      const docsContent = document.querySelector('.docs-content');
      if (!docsContent) {
        console.log('⚠️ App: No docs content found for mobile menu');
        return;
      }
      
      console.log('🍔 App: Creating mobile documentation menu...');
      
      // Extract navigation items from existing TOC
      const navItems = this.extractDocumentationNavItems();
      if (navItems.length === 0) {
        console.log('⚠️ App: No navigation items found');
        return;
      }
      
      // Create container for hamburger menu
      const menuContainer = document.createElement('div');
      menuContainer.className = 'modern-mobile-docs-menu';
      menuContainer.style.cssText = `
        margin-bottom: 1rem;
        position: relative;
        z-index: 100;
      `;
      
      // Insert at top of docs content
      docsContent.insertBefore(menuContainer, docsContent.firstElementChild);
      
      // Create hamburger menu
      const hamburgerMenu = await HamburgerMenu.create(menuContainer, {
        position: 'top-left',
        items: navItems,
        menuTitle: '📚 Documentation',
        closeOnSelect: true,
        backgroundColor: '#1976d2',
        buttonSize: '44px'
      });
      
      // Store component
      this.components.set('mobileDocsMenu', hamburgerMenu);
      
      // Register with legacy bridge if available
      if (legacyBridge) {
        legacyBridge.registerModernComponent('MobileDocsMenu', hamburgerMenu, {
          updateNavigation: () => {
            const items = this.extractDocumentationNavItems();
            hamburgerMenu.updateItems(items);
          }
        });
      }
      
      // Remove legacy mobile nav to avoid conflicts
      this.removeLegacyMobileNav();
      
      // Set up event handlers
      hamburgerMenu.on('hamburger:itemClick', ({ item }) => {
        console.log(`📖 App: Navigating to ${item.label}`);
        
        // Haptic feedback if available
        if (window.NativeFeatures && window.NativeFeatures.hapticFeedback) {
          window.NativeFeatures.hapticFeedback('light');
        }
      });
      
      console.log('✅ App: Mobile documentation menu created successfully');
      
    } catch (error) {
      console.error('🚨 App: Failed to create mobile docs menu:', error);
    }
  }
  
  /**
   * Extract documentation navigation items from existing TOC
   * @returns {Array} Navigation items
   * @private
   */
  extractDocumentationNavItems() {
    const items = [];
    const tocLinks = document.querySelectorAll('.docs-toc a[data-doc]');
    
    tocLinks.forEach((link) => {
      const docSlug = link.getAttribute('data-doc');
      const label = link.textContent.trim();
      const isActive = link.classList.contains('active');
      
      items.push({
        id: docSlug,
        label: label,
        href: link.href,
        active: isActive,
        action: () => {
          // Use existing legacy navigation
          link.click();
        }
      });
    });
    
    console.log(`🔗 App: Extracted ${items.length} documentation navigation items`);
    return items;
  }
  
  /**
   * Remove legacy mobile navigation elements
   * @private
   */
  removeLegacyMobileNav() {
    // Remove legacy mobile menu elements
    const legacyMenus = document.querySelectorAll('.docs-mobile-menu-container');
    legacyMenus.forEach(menu => {
      console.log('🗑️ App: Removing legacy mobile menu element');
      menu.remove();
    });
    
    // Disable legacy mobile nav system if available
    if (window.MobileDocsNav && window.MobileDocsNav.removeMobileElements) {
      window.MobileDocsNav.removeMobileElements();
    }
  }
  
  /**
   * Set up global event listeners
   * @private
   */
  setupGlobalEvents() {
    // Handle window resize with throttling
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const context = window.DeviceContext ? window.DeviceContext.getContext() : null;
        if (context) {
          stateManager.set('deviceContext', context);
        }
        globalEventBus.emit('app:resize', { 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
      }, 250);
    });
    
    // Handle visibility change for PWA lifecycle
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      stateManager.set('appVisible', isVisible);
      globalEventBus.emit('app:visibilityChange', { visible: isVisible });
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }
  
  /**
   * Handle application errors
   * @param {Error} error - Error to handle
   * @private
   */
  handleError(error) {
    console.error('🚨 App: Handling error:', error);
    
    // Store error in state
    stateManager.set('lastError', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Emit error event
    globalEventBus.emit('app:error', { error });
    
    // Show user-friendly error if UI is available
    if (window.ErrorUI) {
      window.ErrorUI.showError('Application Error', error.message);
    }
  }
  
  /**
   * Fallback to legacy system when modern system fails
   * @param {Error} error - The error that caused the fallback
   * @private
   */
  async fallbackToLegacy(error) {
    console.warn('🔄 App: Falling back to legacy system due to:', error.message);
    
    try {
      // Mark modern system as disabled
      window.useModernSystem = false;
      
      // Destroy any partially initialized modern components
      this.destroy();
      
      // Load legacy bootstrap if not already loaded
      if (!window.AppBootstrap) {
        const script = document.createElement('script');
        script.src = 'js/bootstrap.js';
        script.onload = () => {
          console.log('✅ App: Legacy system loaded as fallback');
        };
        script.onerror = () => {
          console.error('🚨 App: Failed to load legacy system fallback');
        };
        document.head.appendChild(script);
      } else {
        // Legacy is already loaded, just initialize it
        console.log('🤝 App: Legacy system already available, using as fallback');
      }
      
    } catch (fallbackError) {
      console.error('🚨 App: Fallback to legacy also failed:', fallbackError);
    }
  }
  
  /**
   * Get application state
   * @returns {Object} Current application state
   */
  getState() {
    // Fallback for test environment where stateManager might not be initialized
    if (stateManager && typeof stateManager.getState === 'function') {
      return stateManager.getState();
    }
    return {}; // Return empty state object for testing
  }
  
  /**
   * Get component by name
   * @param {string} name - Component name
   * @returns {Object|null} Component instance
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }
  
  /**
   * Register a component
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   */
  registerComponent(name, component) {
    this.components.set(name, component);
    globalEventBus.emit('app:componentRegistered', { name, component });
  }
  
  /**
   * Check if the modern system is initialized and ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Destroy the application and clean up resources
   */
  destroy() {
    if (!this.initialized) {
      return;
    }
    
    console.log('🔄 App: Shutting down modern system...');
    
    // Destroy all components
    this.components.forEach((component, name) => {
      try {
        if (component.destroy) {
          component.destroy();
        }
      } catch (error) {
        console.error(`🚨 App: Error destroying component ${name}:`, error);
      }
    });
    
    this.components.clear();
    
    // Clean up router
    if (docsRouter) {
      docsRouter.destroy();
    }
    
    // Clean up state manager
    if (stateManager) {
      stateManager.removeAllListeners();
    }
    
    // Clean up global event bus
    if (globalEventBus) {
      globalEventBus.removeAllListeners();
    }
    
    this.initialized = false;
    
    console.log('✅ App: Modern system shutdown complete');
  }
}

// Create and export app instance
const app = new App();

// Auto-initialize only if not in test environment
{
  try {
    app.init().catch((error) => {
      console.error('🚨 Modern system initialization failed completely:', error);
      // The error handling in init() should have already triggered fallback
    });
  } catch (error) {
    console.error('🚨 Modern system failed to start:', error);
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ModernApp = app;
}

console.log('🚀 WeeWoo Map Friend: Modern ES module system loaded');

export { app };
