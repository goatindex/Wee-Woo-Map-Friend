/**
 * @fileoverview EventBus ES6 Module Tests
 * Tests the EventBus module functionality
 */

import { EventBus, globalEventBus } from './EventBus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('Event Registration', () => {
    test('should register event listeners', () => {
      const listener = jest.fn();
      const unsubscribe = eventBus.on('test-event', listener);

      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.hasListeners('test-event')).toBe(true);
    });

    test('should register one-time event listeners', () => {
      const listener = jest.fn();
      eventBus.once('test-event', listener);

      expect(eventBus.hasListeners('test-event')).toBe(true);
    });

    test('should handle multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);

      expect(eventBus.listenerCount('test-event')).toBe(2);
    });
  });

  describe('Event Emission', () => {
    test('should emit events to registered listeners', () => {
      const listener = jest.fn();
      eventBus.on('test-event', listener);

      eventBus.emit('test-event', { data: 'test' });

      expect(listener).toHaveBeenCalledWith({ data: 'test' }, 'test-event');
    });

    test('should emit events to multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);

      eventBus.emit('test-event', { data: 'test' });

      expect(listener1).toHaveBeenCalledWith({ data: 'test' }, 'test-event');
      expect(listener2).toHaveBeenCalledWith({ data: 'test' }, 'test-event');
    });

    test('should handle events with no listeners', () => {
      expect(() => {
        eventBus.emit('non-existent-event', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('Event Removal', () => {
    test('should remove event listeners', () => {
      const listener = jest.fn();
      eventBus.on('test-event', listener);

      eventBus.off('test-event', listener);

      expect(eventBus.hasListeners('test-event')).toBe(false);
    });

    test('should remove all listeners for an event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      eventBus.on('test-event', listener1);
      eventBus.on('test-event', listener2);

      eventBus.removeAllListeners('test-event');

      expect(eventBus.hasListeners('test-event')).toBe(false);
    });

    test('should remove all listeners when no event specified', () => {
      eventBus.on('event1', jest.fn());
      eventBus.on('event2', jest.fn());

      eventBus.removeAllListeners();

      expect(eventBus.eventNames()).toHaveLength(0);
    });
  });

  describe('One-time Listeners', () => {
    test('should remove one-time listeners after emission', () => {
      const listener = jest.fn();
      eventBus.once('test-event', listener);

      eventBus.emit('test-event', { data: 'test' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(eventBus.hasListeners('test-event')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      eventBus.on('test-event', errorListener);
      eventBus.on('test-event', normalListener);

      expect(() => {
        eventBus.emit('test-event', { data: 'test' });
      }).not.toThrow();

      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('Global Event Bus', () => {
    test('should have a global event bus instance', () => {
      expect(globalEventBus).toBeInstanceOf(EventBus);
    });

    test('should work with global event bus', () => {
      const listener = jest.fn();
      globalEventBus.on('global-test', listener);

      globalEventBus.emit('global-test', { data: 'global' });

      expect(listener).toHaveBeenCalledWith({ data: 'global' }, 'global-test');
    });
  });

  describe('Priority System', () => {
    test('should call higher priority listeners first', () => {
      const callOrder = [];
      const listener1 = jest.fn(() => callOrder.push(1));
      const listener2 = jest.fn(() => callOrder.push(2));
      const listener3 = jest.fn(() => callOrder.push(3));

      eventBus.on('test-event', listener1, { priority: 1 });
      eventBus.on('test-event', listener2, { priority: 3 });
      eventBus.on('test-event', listener3, { priority: 2 });

      eventBus.emit('test-event', {});

      expect(callOrder).toEqual([2, 3, 1]); // Higher priority first
    });
  });

  describe('Max Listeners', () => {
    test('should warn when max listeners reached', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Set low max listeners for testing
      eventBus.setMaxListeners(2);

      eventBus.on('test-event', jest.fn());
      eventBus.on('test-event', jest.fn());
      eventBus.on('test-event', jest.fn()); // Should trigger warning

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Maximum listeners')
      );

      consoleSpy.mockRestore();
    });
  });
});

