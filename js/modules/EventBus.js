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
export class EventBus {
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
export const globalEventBus = new EventBus();

/**
 * Convenience functions for global event bus
 */
export const on = (event, listener, options) => globalEventBus.on(event, listener, options);
export const once = (event, listener, options) => globalEventBus.once(event, listener, options);
export const off = (event, listener) => globalEventBus.off(event, listener);
export const emit = (event, data, options) => globalEventBus.emit(event, data, options);
export const emitAsync = (event, data) => globalEventBus.emitAsync(event, data);
