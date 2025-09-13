/**
 * Enhanced EventBus - Advanced event system with middleware and typed events
 * Implements event-driven architecture with error handling and performance monitoring
 * 
 * @fileoverview Enhanced event bus system for the WeeWoo Map Friend application
 * @version 2.0.0
 * @author WeeWoo Map Friend Team
 */

import { logger } from './StructuredLogger.js';
import { errorBoundary } from './ErrorBoundary.js';
import { UnifiedErrorHandler } from './UnifiedErrorHandler.js';
import { TYPES } from './Types.js';

/**
 * Event types for type safety
 */
export const EventTypes = {
  // Application events
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  APP_BOOTSTRAP_ERROR: 'app:bootstrapError',
  
  // Map events
  MAP_INITIALIZED: 'map:initialized',
  MAP_LAYER_ADDED: 'map:layer:added',
  MAP_LAYER_REMOVED: 'map:layer:removed',
  MAP_CENTER_CHANGED: 'map:center:changed',
  MAP_ZOOM_CHANGED: 'map:zoom:changed',
  MAP_ERROR: 'map:error',
  
  // Sidebar events
  SIDEBAR_ITEM_SELECTED: 'sidebar:item:selected',
  SIDEBAR_ITEM_DESELECTED: 'sidebar:item:deselected',
  SIDEBAR_SECTION_TOGGLED: 'sidebar:section:toggled',
  SIDEBAR_SEARCH_CHANGED: 'sidebar:search:changed',
  SIDEBAR_ERROR: 'sidebar:error',
  
  // Data events
  DATA_LOADING_STARTED: 'data:loading:started',
  DATA_LOADING_COMPLETED: 'data:loading:completed',
  DATA_LOADING_ERROR: 'data:loading:error',
  DATA_CATEGORY_LOADED: 'data:category:loaded',
  DATA_CATEGORY_ERROR: 'data:category:error',
  
  // Search events
  SEARCH_QUERY_CHANGED: 'search:query:changed',
  SEARCH_RESULTS_UPDATED: 'search:results:updated',
  SEARCH_INDEX_UPDATED: 'search:index:updated',
  SEARCH_ERROR: 'search:error',
  
  // UI events
  UI_COMPONENT_READY: 'ui:component:ready',
  UI_COMPONENT_ERROR: 'ui:component:error',
  UI_MODAL_OPENED: 'ui:modal:opened',
  UI_MODAL_CLOSED: 'ui:modal:closed',
  
  // Error events
  ERROR_OCCURRED: 'error:occurred',
  ERROR_RECOVERED: 'error:recovered',
  ERROR_DEGRADATION: 'error:degradation'
};

/**
 * Event priority levels
 */
export const EventPriority = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Event listener options
 */
export class EventListenerOptions {
  constructor(options = {}) {
    this.priority = options.priority || EventPriority.NORMAL;
    this.once = options.once || false;
    this.async = options.async || false;
    this.context = options.context || null;
    this.filter = options.filter || null;
    this.timeout = options.timeout || 0;
  }
}

/**
 * Event metadata
 */
export class EventMetadata {
  constructor(options = {}) {
    this.timestamp = Date.now();
    this.id = options.id || this.generateId();
    this.source = options.source || 'unknown';
    this.priority = options.priority || EventPriority.NORMAL;
    this.correlationId = options.correlationId || null;
    this.tags = options.tags || [];
  }

  generateId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Event object with metadata and payload
 */
export class Event {
  constructor(type, payload = {}, metadata = {}) {
    this.type = type;
    this.payload = payload;
    this.metadata = new EventMetadata(metadata);
  }

  /**
   * Create a response event
   * @param {string} type - Response event type
   * @param {any} payload - Response payload
   * @returns {Event} Response event
   */
  createResponse(type, payload = {}) {
    return new Event(type, payload, {
      source: this.metadata.source,
      correlationId: this.metadata.id,
      priority: this.metadata.priority
    });
  }
}

/**
 * Event middleware interface
 */
export class EventMiddleware {
  /**
   * Process event before it's emitted
   * @param {Event} event - The event to process
   * @returns {Event} Processed event
   */
  beforeEmit(event) {
    return event;
  }

  /**
   * Process event after it's emitted
   * @param {Event} event - The event that was emitted
   * @param {Array} listeners - List of listeners that were called
   */
  afterEmit(event, listeners) {
    // Default implementation - do nothing
  }

  /**
   * Process event before listener is called
   * @param {Event} event - The event
   * @param {Function} listener - The listener function
   * @returns {Event} Processed event
   */
  beforeListener(event, listener) {
    return event;
  }

  /**
   * Process event after listener is called
   * @param {Event} event - The event
   * @param {Function} listener - The listener function
   * @param {any} result - Listener result
   * @param {Error} error - Error if listener failed
   */
  afterListener(event, listener, result, error) {
    // Default implementation - do nothing
  }
}

/**
 * Logging middleware for event monitoring
 */
export class LoggingMiddleware extends EventMiddleware {
  constructor() {
    super();
    this.logger = logger.createChild({ module: 'EventBusLogging' });
  }

  beforeEmit(event) {
    this.logger.debug('Event emitted', {
      type: event.type,
      source: event.metadata.source,
      priority: event.metadata.priority,
      payload: this.sanitizePayload(event.payload)
    });
    return event;
  }

  afterEmit(event, listeners) {
    this.logger.debug('Event processed', {
      type: event.type,
      listenersCalled: listeners.length,
      timestamp: event.metadata.timestamp
    });
  }

  beforeListener(event, listener) {
    this.logger.trace('Listener called', {
      eventType: event.type,
      listenerName: listener.name || 'anonymous'
    });
    return event;
  }

  afterListener(event, listener, result, error) {
    if (error) {
      this.logger.error('Listener error', {
        eventType: event.type,
        listenerName: listener.name || 'anonymous',
        error: error.message
      });
    } else {
      this.logger.trace('Listener completed', {
        eventType: event.type,
        listenerName: listener.name || 'anonymous'
      });
    }
  }

  sanitizePayload(payload) {
    // Remove sensitive data from payload for logging
    const sanitized = { ...payload };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }
}

/**
 * Error handling middleware
 */
export class ErrorHandlingMiddleware extends EventMiddleware {
  constructor(container = null) {
    super();
    this.logger = logger.createChild({ module: 'EventBusErrorHandling' });
    // Use DI injection if container is available, otherwise fall back to direct instantiation
    if (container) {
      this.unifiedErrorHandler = container.get(TYPES.UnifiedErrorHandler);
    } else {
      this.unifiedErrorHandler = new UnifiedErrorHandler();
    }
  }

  beforeListener(event, listener) {
    return event;
  }

  async afterListener(event, listener, result, error) {
    if (error) {
      // Use UnifiedErrorHandler for error processing
      await this.unifiedErrorHandler.handleError(error, {
        component: 'EventBus',
        operation: 'event_listener',
        userId: null,
        sessionId: null,
        metadata: {
          eventType: event.type,
          listenerName: listener.name || 'anonymous',
          originalEvent: event.type
        }
      });

      // Emit error event for backward compatibility
      const errorEvent = new Event(EventTypes.ERROR_OCCURRED, {
        originalEvent: event.type,
        listener: listener.name || 'anonymous',
        error: error.message
      }, {
        source: 'EventBus',
        priority: EventPriority.HIGH
      });

      // Emit error event asynchronously to avoid recursion
      setTimeout(() => {
        if (typeof globalEventBus !== 'undefined') {
          globalEventBus.emit(errorEvent);
        }
      }, 0);
    }
  }
}

/**
 * Performance monitoring middleware
 */
export class PerformanceMiddleware extends EventMiddleware {
  constructor() {
    super();
    this.logger = logger.createChild({ module: 'EventBusPerformance' });
    this.metrics = new Map();
  }

  beforeEmit(event) {
    event.metadata.startTime = performance.now();
    return event;
  }

  afterEmit(event, listeners) {
    const duration = performance.now() - event.metadata.startTime;
    
    this.recordMetric(event.type, 'emit_duration', duration);
    this.recordMetric(event.type, 'listener_count', listeners.length);

    if (duration > 100) { // Log slow events
      this.logger.warn('Slow event processing', {
        eventType: event.type,
        duration: duration,
        listenerCount: listeners.length
      });
    }
  }

  beforeListener(event, listener) {
    listener._startTime = performance.now();
    return event;
  }

  afterListener(event, listener, result, error) {
    const duration = performance.now() - listener._startTime;
    this.recordMetric(event.type, 'listener_duration', duration);

    if (duration > 50) { // Log slow listeners
      this.logger.warn('Slow event listener', {
        eventType: event.type,
        listenerName: listener.name || 'anonymous',
        duration: duration
      });
    }
  }

  recordMetric(eventType, metricName, value) {
    const key = `${eventType}.${metricName}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key).push(value);
  }

  getMetrics() {
    const result = {};
    for (const [key, values] of this.metrics) {
      result[key] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
    return result;
  }
}

/**
 * Event listener wrapper
 */
export class EventListener {
  constructor(eventType, handler, options = {}) {
    this.eventType = eventType;
    this.handler = handler;
    this.options = new EventListenerOptions(options);
    this.id = this.generateId();
    this.callCount = 0;
    this.lastCalled = null;
  }

  generateId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async call(event) {
    const startTime = performance.now();
    this.callCount++;
    this.lastCalled = Date.now();

    try {
      // Apply filter if provided
      if (this.options.filter && !this.options.filter(event)) {
        return null;
      }

      // Call handler
      let result;
      if (this.options.async) {
        result = await this.handler(event);
      } else {
        result = this.handler(event);
      }

      // Check timeout
      if (this.options.timeout > 0) {
        const duration = performance.now() - startTime;
        if (duration > this.options.timeout) {
          throw new Error(`Listener timeout after ${duration}ms`);
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  shouldRemove() {
    return this.options.once && this.callCount > 0;
  }
}

/**
 * Enhanced EventBus with middleware and typed events
 */
export class EnhancedEventBus {
  constructor(options = {}, container = null) {
    this.listeners = new Map();
    this.middleware = [];
    this.maxListeners = options.maxListeners || 100;
    this.enableMetrics = options.enableMetrics !== false;
    this.logger = logger.createChild({ module: 'EnhancedEventBus' });
    this.container = container;

    // Add default middleware
    this.addMiddleware(new LoggingMiddleware());
    this.addMiddleware(new ErrorHandlingMiddleware(container));
    
    if (this.enableMetrics) {
      this.addMiddleware(new PerformanceMiddleware());
    }

    this.logger.info('Enhanced EventBus initialized', {
      maxListeners: this.maxListeners,
      enableMetrics: this.enableMetrics
    });
  }

  /**
   * Add middleware to the event bus
   * @param {EventMiddleware} middleware - Middleware instance
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
    this.logger.debug('Middleware added', {
      middlewareName: middleware.constructor.name
    });
  }

  /**
   * Remove middleware from the event bus
   * @param {EventMiddleware} middleware - Middleware instance to remove
   */
  removeMiddleware(middleware) {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
      this.logger.debug('Middleware removed', {
        middlewareName: middleware.constructor.name
      });
    }
  }

  /**
   * Add event listener
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {EventListenerOptions|Object} options - Listener options
   * @returns {Function} Unsubscribe function
   */
  on(eventType, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    const listener = new EventListener(eventType, handler, options);
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType);
    
    // Check listener limit
    if (listeners.length >= this.maxListeners) {
      this.logger.warn('Maximum listeners exceeded', {
        eventType,
        currentCount: listeners.length,
        maxListeners: this.maxListeners
      });
    }

    listeners.push(listener);
    
    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.options.priority - a.options.priority);

    this.logger.debug('Event listener added', {
      eventType,
      listenerId: listener.id,
      priority: listener.options.priority,
      totalListeners: listeners.length
    });

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Add one-time event listener
   * @param {string} eventType - Event type to listen for
   * @param {Function} handler - Event handler function
   * @param {EventListenerOptions|Object} options - Listener options
   * @returns {Function} Unsubscribe function
   */
  once(eventType, handler, options = {}) {
    return this.on(eventType, handler, { ...options, once: true });
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {EventListener|Function} listener - Listener to remove
   */
  off(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    const listeners = this.listeners.get(eventType);
    const index = listeners.findIndex(l => 
      l === listener || l.handler === listener
    );

    if (index > -1) {
      const removedListener = listeners.splice(index, 1)[0];
      this.logger.debug('Event listener removed', {
        eventType,
        listenerId: removedListener.id
      });
    }
  }

  /**
   * Emit event
   * @param {string|Event} eventTypeOrEvent - Event type or Event object
   * @param {any} payload - Event payload
   * @param {Object} metadata - Event metadata
   * @returns {Promise<Array>} Array of listener results
   */
  async emit(eventTypeOrEvent, payload = {}, metadata = {}) {
    // Input validation and error reporting
    const validationResult = this.validateEmitInput(eventTypeOrEvent, payload, metadata);
    if (!validationResult.valid) {
      this.logger.error('Invalid emit input', {
        error: validationResult.error,
        eventType: typeof eventTypeOrEvent === 'string' ? eventTypeOrEvent : 'Event object',
        payload: this.sanitizePayload(payload),
        metadata: this.sanitizeMetadata(metadata),
        recommendation: validationResult.recommendation
      });
      
      // Emit error event for external monitoring
      this.emitErrorEvent('validation_error', {
        operation: 'emit',
        message: validationResult.error,
        context: { eventType: eventTypeOrEvent, payload, metadata },
        severity: 'error',
        recoverable: false
      });
      
      return [];
    }

    const event = eventTypeOrEvent instanceof Event 
      ? eventTypeOrEvent 
      : new Event(eventTypeOrEvent, payload, metadata);

    // Apply beforeEmit middleware
    let processedEvent = event;
    for (const middleware of this.middleware) {
      try {
        processedEvent = middleware.beforeEmit(processedEvent);
      } catch (error) {
        this.logger.error('Middleware beforeEmit error', {
          eventType: processedEvent.type,
          middleware: middleware.constructor.name,
          error: error.message,
          stack: error.stack
        });
        
        this.emitErrorEvent('middleware_error', {
          operation: 'beforeEmit',
          eventType: processedEvent.type,
          middleware: middleware.constructor.name,
          message: error.message,
          context: { eventType: processedEvent.type },
          severity: 'error',
          recoverable: true
        });
        
        // Continue with original event if middleware fails
        processedEvent = event;
      }
    }

    const listeners = this.listeners.get(processedEvent.type) || [];
    const results = [];
    const listenersToRemove = [];

    this.logger.debug('Emitting event', {
      type: processedEvent.type,
      listenerCount: listeners.length,
      source: processedEvent.metadata.source
    });

    // Call listeners
    for (const listener of listeners) {
      try {
        // Apply beforeListener middleware
        let listenerEvent = processedEvent;
        for (const middleware of this.middleware) {
          listenerEvent = middleware.beforeListener(listenerEvent, listener.handler);
        }

        // Call listener
        const result = await listener.call(listenerEvent);
        results.push(result);

        // Apply afterListener middleware
        for (const middleware of this.middleware) {
          middleware.afterListener(listenerEvent, listener.handler, result, null);
        }

        // Mark for removal if once listener
        if (listener.shouldRemove()) {
          listenersToRemove.push(listener);
        }

      } catch (error) {
        // Enhanced error reporting with context
        this.logger.error('Event listener error', {
          eventType: processedEvent.type,
          listenerId: listener.id,
          listenerName: listener.handler.name || 'anonymous',
          error: error.message,
          stack: error.stack,
          eventPayload: this.sanitizePayload(processedEvent.payload),
          eventMetadata: this.sanitizeMetadata(processedEvent.metadata),
          listenerOptions: listener.options
        });

        // Emit error event for external monitoring
        this.emitErrorEvent('listener_error', {
          operation: 'listener_execution',
          eventType: processedEvent.type,
          listenerId: listener.id,
          listenerName: listener.handler.name || 'anonymous',
          message: error.message,
          context: { 
            eventType: processedEvent.type,
            listenerId: listener.id,
            eventPayload: this.sanitizePayload(processedEvent.payload)
          },
          severity: processedEvent.metadata.priority >= EventPriority.CRITICAL ? 'error' : 'warning',
          recoverable: processedEvent.metadata.priority < EventPriority.CRITICAL
        });

        // Apply afterListener middleware with error
        for (const middleware of this.middleware) {
          try {
            middleware.afterListener(processedEvent, listener.handler, null, error);
          } catch (middlewareError) {
            this.logger.error('Middleware afterListener error', {
              eventType: processedEvent.type,
              middleware: middleware.constructor.name,
              originalError: error.message,
              middlewareError: middlewareError.message
            });
          }
        }

        // Re-throw error for critical events
        if (processedEvent.metadata.priority >= EventPriority.CRITICAL) {
          throw error;
        }
      }
    }

    // Remove once listeners
    for (const listener of listenersToRemove) {
      this.off(processedEvent.type, listener);
    }

    // Apply afterEmit middleware
    for (const middleware of this.middleware) {
      middleware.afterEmit(processedEvent, listeners);
    }

    return results;
  }

  /**
   * Emit event synchronously
   * @param {string|Event} eventTypeOrEvent - Event type or Event object
   * @param {any} payload - Event payload
   * @param {Object} metadata - Event metadata
   * @returns {Array} Array of listener results
   */
  emitSync(eventTypeOrEvent, payload = {}, metadata = {}) {
    const event = eventTypeOrEvent instanceof Event 
      ? eventTypeOrEvent 
      : new Event(eventTypeOrEvent, payload, metadata);

    const listeners = this.listeners.get(event.type) || [];
    const results = [];
    const listenersToRemove = [];

    // Call listeners synchronously
    for (const listener of listeners) {
      try {
        const result = listener.handler(event);
        results.push(result);

        if (listener.shouldRemove()) {
          listenersToRemove.push(listener);
        }

      } catch (error) {
        this.logger.error('Event listener error (sync)', {
          eventType: event.type,
          listenerId: listener.id,
          error: error.message
        });

        if (event.metadata.priority >= EventPriority.CRITICAL) {
          throw error;
        }
      }
    }

    // Remove once listeners
    for (const listener of listenersToRemove) {
      this.off(event.type, listener);
    }

    return results;
  }

  /**
   * Get listener count for event type
   * @param {string} eventType - Event type
   * @returns {number} Listener count
   */
  getListenerCount(eventType) {
    return this.listeners.get(eventType)?.length || 0;
  }

  /**
   * Get all event types with listeners
   * @returns {Array<string>} Array of event types
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners for event type
   * @param {string} eventType - Event type
   */
  removeAllListeners(eventType) {
    if (this.listeners.has(eventType)) {
      this.listeners.delete(eventType);
      this.logger.debug('All listeners removed', { eventType });
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
    this.logger.debug('All listeners removed');
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const performanceMiddleware = this.middleware.find(m => m instanceof PerformanceMiddleware);
    return performanceMiddleware ? performanceMiddleware.getMetrics() : {};
  }

  /**
   * Create event namespace
   * @param {string} namespace - Namespace prefix
   * @returns {Object} Namespaced event bus methods
   */
  /**
   * Validate emit input parameters
   * @param {string|Event} eventTypeOrEvent - Event type or Event object
   * @param {any} payload - Event payload
   * @param {Object} metadata - Event metadata
   * @returns {Object} Validation result
   */
  validateEmitInput(eventTypeOrEvent, payload, metadata) {
    // Validate event type
    if (eventTypeOrEvent === null || eventTypeOrEvent === undefined) {
      return {
        valid: false,
        error: 'Event type cannot be null or undefined',
        recommendation: 'Provide a valid event type string or Event object'
      };
    }

    if (typeof eventTypeOrEvent === 'string' && eventTypeOrEvent.trim() === '') {
      return {
        valid: false,
        error: 'Event type cannot be empty string',
        recommendation: 'Provide a non-empty event type string'
      };
    }

    // Validate payload
    if (payload !== null && payload !== undefined) {
      try {
        JSON.stringify(payload);
      } catch (error) {
        if (error.message.includes('circular')) {
          return {
            valid: false,
            error: 'Payload contains circular references',
            recommendation: 'Remove circular references from payload before emitting'
          };
        }
      }
    }

    // Validate metadata
    if (metadata !== null && metadata !== undefined && typeof metadata !== 'object') {
      return {
        valid: false,
        error: 'Metadata must be an object',
        recommendation: 'Provide metadata as an object or null/undefined'
      };
    }

    return { valid: true };
  }

  /**
   * Emit error event for external monitoring
   * @param {string} errorType - Type of error
   * @param {Object} errorData - Error data
   */
  emitErrorEvent(errorType, errorData) {
    try {
      // Emit to internal error monitoring
      this.emit('eventbus:error', {
        type: errorType,
        ...errorData,
        timestamp: Date.now(),
        source: 'EnhancedEventBus'
      });
    } catch (error) {
      // Fallback to console if event emission fails
      console.error('Failed to emit error event:', error);
    }
  }

  /**
   * Sanitize payload for logging
   * @param {any} payload - Payload to sanitize
   * @returns {any} Sanitized payload
   */
  sanitizePayload(payload) {
    if (payload === null || payload === undefined) {
      return payload;
    }

    try {
      const sanitized = { ...payload };
      // Remove sensitive data
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      return sanitized;
    } catch (error) {
      return '[Circular Reference]';
    }
  }

  /**
   * Sanitize metadata for logging
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   */
  sanitizeMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      return metadata;
    }

    try {
      const sanitized = { ...metadata };
      // Remove sensitive data
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      return sanitized;
    } catch (error) {
      return '[Circular Reference]';
    }
  }

  /**
   * Get event bus statistics for monitoring
   * @returns {Object} Event bus statistics
   */
  getEventBusStats() {
    const totalListeners = Array.from(this.listeners.values())
      .reduce((total, listeners) => total + listeners.length, 0);
    
    const eventTypes = Array.from(this.listeners.keys());
    
    return {
      totalListeners,
      eventTypes: eventTypes.length,
      middlewareCount: this.middleware.length,
      eventTypesList: eventTypes,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of event bus
   * @returns {number} Estimated memory usage in bytes
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    // Estimate listener memory usage
    for (const listeners of this.listeners.values()) {
      for (const listener of listeners) {
        totalSize += JSON.stringify(listener).length;
      }
    }
    
    // Estimate middleware memory usage
    for (const middleware of this.middleware) {
      totalSize += JSON.stringify(middleware).length;
    }
    
    return totalSize;
  }

  namespace(namespace) {
    return {
      on: (eventType, handler, options) => this.on(`${namespace}:${eventType}`, handler, options),
      once: (eventType, handler, options) => this.once(`${namespace}:${eventType}`, handler, options),
      off: (eventType, listener) => this.off(`${namespace}:${eventType}`, listener),
      emit: (eventType, payload, metadata) => this.emit(`${namespace}:${eventType}`, payload, metadata),
      emitSync: (eventType, payload, metadata) => this.emitSync(`${namespace}:${eventType}`, payload, metadata)
    };
  }
}

// Export singleton instance
export const enhancedEventBus = new EnhancedEventBus();

// Export convenience functions
export const on = (eventType, handler, options) => enhancedEventBus.on(eventType, handler, options);
export const once = (eventType, handler, options) => enhancedEventBus.once(eventType, handler, options);
export const off = (eventType, listener) => enhancedEventBus.off(eventType, listener);
export const emit = (eventType, payload, metadata) => enhancedEventBus.emit(eventType, payload, metadata);
export const emitSync = (eventType, payload, metadata) => enhancedEventBus.emitSync(eventType, payload, metadata);
