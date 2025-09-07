/**
 * EnhancedEventBus Test Suite
 * Comprehensive tests for the enhanced event system
 */

import { 
  EnhancedEventBus,
  EventTypes,
  EventPriority,
  EventListenerOptions,
  EventMetadata,
  Event,
  LoggingMiddleware,
  ErrorHandlingMiddleware,
  PerformanceMiddleware,
  EventListener
} from '../js/modules/EnhancedEventBus.js';

describe('EnhancedEventBus System', () => {
  let eventBus;
  let mockLogger;

  beforeEach(() => {
    // Mock the logger
    mockLogger = {
      createChild: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn()
      })),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn()
    };

    // Mock the global logger
    jest.doMock('../js/modules/StructuredLogger.js', () => ({
      logger: mockLogger
    }));

    eventBus = new EnhancedEventBus();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Class', () => {
    test('should create event with type and payload', () => {
      const event = new Event('test:event', { data: 'test' });
      
      expect(event.type).toBe('test:event');
      expect(event.payload).toEqual({ data: 'test' });
      expect(event.metadata).toBeInstanceOf(EventMetadata);
      expect(event.metadata.timestamp).toBeInstanceOf(Number);
    });

    test('should create event with custom metadata', () => {
      const metadata = { source: 'test', priority: EventPriority.HIGH };
      const event = new Event('test:event', { data: 'test' }, metadata);
      
      expect(event.metadata.source).toBe('test');
      expect(event.metadata.priority).toBe(EventPriority.HIGH);
    });

    test('should create response event', () => {
      const originalEvent = new Event('test:request', { id: 1 });
      const responseEvent = originalEvent.createResponse('test:response', { result: 'success' });
      
      expect(responseEvent.type).toBe('test:response');
      expect(responseEvent.payload).toEqual({ result: 'success' });
      expect(responseEvent.metadata.correlationId).toBe(originalEvent.metadata.id);
    });
  });

  describe('EventMetadata Class', () => {
    test('should create metadata with default values', () => {
      const metadata = new EventMetadata();
      
      expect(metadata.timestamp).toBeInstanceOf(Number);
      expect(metadata.id).toMatch(/^event_\d+_[a-z0-9]+$/);
      expect(metadata.source).toBe('unknown');
      expect(metadata.priority).toBe(EventPriority.NORMAL);
      expect(metadata.correlationId).toBeNull();
      expect(metadata.tags).toEqual([]);
    });

    test('should create metadata with custom values', () => {
      const options = {
        source: 'TestComponent',
        priority: EventPriority.HIGH,
        correlationId: 'corr123',
        tags: ['test', 'debug']
      };
      const metadata = new EventMetadata(options);
      
      expect(metadata.source).toBe('TestComponent');
      expect(metadata.priority).toBe(EventPriority.HIGH);
      expect(metadata.correlationId).toBe('corr123');
      expect(metadata.tags).toEqual(['test', 'debug']);
    });
  });

  describe('EventListenerOptions Class', () => {
    test('should create options with default values', () => {
      const options = new EventListenerOptions();
      
      expect(options.priority).toBe(EventPriority.NORMAL);
      expect(options.once).toBe(false);
      expect(options.async).toBe(false);
      expect(options.context).toBeNull();
      expect(options.filter).toBeNull();
      expect(options.timeout).toBe(0);
    });

    test('should create options with custom values', () => {
      const options = new EventListenerOptions({
        priority: EventPriority.HIGH,
        once: true,
        async: true,
        context: 'test',
        filter: () => true,
        timeout: 5000
      });
      
      expect(options.priority).toBe(EventPriority.HIGH);
      expect(options.once).toBe(true);
      expect(options.async).toBe(true);
      expect(options.context).toBe('test');
      expect(options.filter).toBeInstanceOf(Function);
      expect(options.timeout).toBe(5000);
    });
  });

  describe('EventListener Class', () => {
    test('should create listener with handler and options', () => {
      const handler = jest.fn();
      const options = { priority: EventPriority.HIGH };
      const listener = new EventListener('test:event', handler, options);
      
      expect(listener.eventType).toBe('test:event');
      expect(listener.handler).toBe(handler);
      expect(listener.options.priority).toBe(EventPriority.HIGH);
      expect(listener.id).toMatch(/^listener_\d+_[a-z0-9]+$/);
      expect(listener.callCount).toBe(0);
      expect(listener.lastCalled).toBeNull();
    });

    test('should call handler and track metrics', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      const listener = new EventListener('test:event', handler);
      const event = new Event('test:event', { data: 'test' });
      
      const result = await listener.call(event);
      
      expect(result).toBe('result');
      expect(handler).toHaveBeenCalledWith(event);
      expect(listener.callCount).toBe(1);
      expect(listener.lastCalled).toBeInstanceOf(Number);
    });

    test('should apply filter before calling handler', async () => {
      const handler = jest.fn();
      const filter = jest.fn().mockReturnValue(false);
      const listener = new EventListener('test:event', handler, { filter });
      const event = new Event('test:event', { data: 'test' });
      
      const result = await listener.call(event);
      
      expect(result).toBeNull();
      expect(filter).toHaveBeenCalledWith(event);
      expect(handler).not.toHaveBeenCalled();
    });

    test('should track timeout violations', async () => {
      const handler = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const listener = new EventListener('test:event', handler, { timeout: 50 });
      const event = new Event('test:event', { data: 'test' });
      
      await expect(listener.call(event)).rejects.toThrow('Listener timeout after');
    });

    test('should mark for removal after once call', () => {
      const handler = jest.fn();
      const listener = new EventListener('test:event', handler, { once: true });
      
      expect(listener.shouldRemove()).toBe(false);
      
      // Simulate call
      listener.callCount = 1;
      
      expect(listener.shouldRemove()).toBe(true);
    });
  });

  describe('EnhancedEventBus Basic Functionality', () => {
    test('should add and call event listeners', async () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'test:event',
        payload: { data: 'test' }
      }));
    });

    test('should remove event listeners', () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.on('test:event', handler);
      
      unsubscribe();
      
      eventBus.emit('test:event', { data: 'test' });
      
      expect(handler).not.toHaveBeenCalled();
    });

    test('should handle once listeners', async () => {
      const handler = jest.fn();
      eventBus.once('test:event', handler);
      
      await eventBus.emit('test:event', { data: 'test1' });
      await eventBus.emit('test:event', { data: 'test2' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('should sort listeners by priority', async () => {
      const callOrder = [];
      const highPriorityHandler = jest.fn(() => callOrder.push('high'));
      const normalPriorityHandler = jest.fn(() => callOrder.push('normal'));
      const lowPriorityHandler = jest.fn(() => callOrder.push('low'));
      
      eventBus.on('test:event', normalPriorityHandler, { priority: EventPriority.NORMAL });
      eventBus.on('test:event', lowPriorityHandler, { priority: EventPriority.LOW });
      eventBus.on('test:event', highPriorityHandler, { priority: EventPriority.HIGH });
      
      await eventBus.emit('test:event', { data: 'test' });
      
      expect(callOrder).toEqual(['high', 'normal', 'low']);
    });

    test('should handle async listeners', async () => {
      const asyncHandler = jest.fn().mockResolvedValue('async result');
      eventBus.on('test:event', asyncHandler, { async: true });
      
      const results = await eventBus.emit('test:event', { data: 'test' });
      
      expect(results).toEqual(['async result']);
    });

    test('should return listener results', async () => {
      const handler1 = jest.fn().mockReturnValue('result1');
      const handler2 = jest.fn().mockReturnValue('result2');
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      const results = await eventBus.emit('test:event', { data: 'test' });
      
      expect(results).toEqual(['result1', 'result2']);
    });
  });

  describe('Event Middleware', () => {
    test('should apply logging middleware', async () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Event emitted', expect.any(Object));
      expect(mockLogger.debug).toHaveBeenCalledWith('Event processed', expect.any(Object));
    });

    test('should apply error handling middleware', async () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      eventBus.on('test:event', errorHandler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      expect(mockLogger.error).toHaveBeenCalledWith('Event listener error', expect.any(Object));
    });

    test('should apply performance middleware', async () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      const metrics = eventBus.getMetrics();
      expect(metrics).toHaveProperty('test:event.emit_duration');
      expect(metrics).toHaveProperty('test:event.listener_count');
    });
  });

  describe('Error Handling', () => {
    test('should handle listener errors gracefully', async () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();
      
      eventBus.on('test:event', errorHandler);
      eventBus.on('test:event', normalHandler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      expect(normalHandler).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Event listener error', expect.any(Object));
    });

    test('should re-throw errors for critical events', async () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Critical error');
      });
      
      eventBus.on('test:event', errorHandler);
      
      const criticalEvent = new Event('test:event', { data: 'test' }, {
        priority: EventPriority.CRITICAL
      });
      
      await expect(eventBus.emit(criticalEvent)).rejects.toThrow('Critical error');
    });
  });

  describe('Event Bus Management', () => {
    test('should get listener count', () => {
      expect(eventBus.getListenerCount('test:event')).toBe(0);
      
      eventBus.on('test:event', jest.fn());
      eventBus.on('test:event', jest.fn());
      
      expect(eventBus.getListenerCount('test:event')).toBe(2);
    });

    test('should get event types', () => {
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event2', jest.fn());
      
      const eventTypes = eventBus.getEventTypes();
      expect(eventTypes).toContain('test:event1');
      expect(eventTypes).toContain('test:event2');
    });

    test('should remove all listeners for event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      
      eventBus.removeAllListeners('test:event');
      
      expect(eventBus.getListenerCount('test:event')).toBe(0);
    });

    test('should remove all listeners', () => {
      eventBus.on('test:event1', jest.fn());
      eventBus.on('test:event2', jest.fn());
      
      eventBus.removeAllListeners();
      
      expect(eventBus.getEventTypes()).toHaveLength(0);
    });
  });

  describe('Event Namespacing', () => {
    test('should create namespaced event bus', () => {
      const namespaced = eventBus.namespace('test');
      
      expect(namespaced.on).toBeInstanceOf(Function);
      expect(namespaced.emit).toBeInstanceOf(Function);
    });

    test('should handle namespaced events', async () => {
      const handler = jest.fn();
      const namespaced = eventBus.namespace('test');
      
      namespaced.on('event', handler);
      await namespaced.emit('event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'test:event',
        payload: { data: 'test' }
      }));
    });
  });

  describe('Synchronous Emission', () => {
    test('should emit events synchronously', () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      const results = eventBus.emitSync('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics', async () => {
      const handler = jest.fn();
      eventBus.on('test:event', handler);
      
      await eventBus.emit('test:event', { data: 'test' });
      
      const metrics = eventBus.getMetrics();
      expect(metrics).toHaveProperty('test:event.emit_duration');
      expect(metrics).toHaveProperty('test:event.listener_count');
      expect(metrics).toHaveProperty('test:event.listener_duration');
    });
  });

  describe('Event Types Constants', () => {
    test('should have all required event types', () => {
      expect(EventTypes.APP_READY).toBe('app:ready');
      expect(EventTypes.MAP_INITIALIZED).toBe('map:initialized');
      expect(EventTypes.SIDEBAR_ITEM_SELECTED).toBe('sidebar:item:selected');
      expect(EventTypes.DATA_LOADING_STARTED).toBe('data:loading:started');
      expect(EventTypes.SEARCH_QUERY_CHANGED).toBe('search:query:changed');
      expect(EventTypes.ERROR_OCCURRED).toBe('error:occurred');
    });
  });

  describe('Event Priority Constants', () => {
    test('should have correct priority values', () => {
      expect(EventPriority.LOW).toBe(1);
      expect(EventPriority.NORMAL).toBe(2);
      expect(EventPriority.HIGH).toBe(3);
      expect(EventPriority.CRITICAL).toBe(4);
    });
  });
});
