/**
 * @fileoverview Playwright Test File
 * 
 * 📚 Documentation:
 * - Testing Framework: project_docs/development/testing-playwright.md
 * - Build Process: project_docs/development/build-automation.md
 * 
 * 🔧 Build Process:
 * Tests automatically run `npm run build:js` before execution to ensure
 * decorators are properly transformed from TypeScript to browser-compatible JavaScript.
 */

import { test, expect } from '@playwright/test';

test.describe('Event System Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for event bus to be available
    await page.waitForFunction(() => typeof window.globalEventBus !== 'undefined', { timeout: 10000 });
  });

  test('should initialize event bus correctly', async ({ page }) => {
    const eventBusInfo = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      return {
        isInitialized: eventBus !== null && eventBus !== undefined,
        hasEmitMethod: typeof eventBus.emit === 'function',
        hasOnMethod: typeof eventBus.on === 'function',
        hasOffMethod: typeof eventBus.off === 'function',
        hasOnceMethod: typeof eventBus.once === 'function'
      };
    });
    
    expect(eventBusInfo.isInitialized).toBe(true);
    expect(eventBusInfo.hasEmitMethod).toBe(true);
    expect(eventBusInfo.hasOnMethod).toBe(true);
    expect(eventBusInfo.hasOffMethod).toBe(true);
    expect(eventBusInfo.hasOnceMethod).toBe(true);
  });

  test('should handle basic event emission and listening', async ({ page }) => {
    const eventTest = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      let eventReceived = false;
      let eventData = null;
      
      // Set up event listener
      eventBus.on('testEvent', (data) => {
        eventReceived = true;
        eventData = data;
      });
      
      // Emit event
      eventBus.emit('testEvent', { message: 'Hello World', timestamp: Date.now() });
      
      return {
        eventReceived,
        eventData,
        hasCorrectMessage: eventData && eventData.message === 'Hello World'
      };
    });
    
    expect(eventTest.eventReceived).toBe(true);
    expect(eventTest.hasCorrectMessage).toBe(true);
    expect(eventTest.eventData).toHaveProperty('message', 'Hello World');
    expect(eventTest.eventData).toHaveProperty('timestamp');
  });

  test('should handle multiple event listeners', async ({ page }) => {
    const multipleListenersTest = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      let listener1Called = false;
      let listener2Called = false;
      let listener3Called = false;
      
      // Set up multiple listeners for the same event
      eventBus.on('multiEvent', () => { listener1Called = true; });
      eventBus.on('multiEvent', () => { listener2Called = true; });
      eventBus.on('multiEvent', () => { listener3Called = true; });
      
      // Emit event
      eventBus.emit('multiEvent');
      
      return {
        listener1Called,
        listener2Called,
        listener3Called,
        allListenersCalled: listener1Called && listener2Called && listener3Called
      };
    });
    
    expect(multipleListenersTest.listener1Called).toBe(true);
    expect(multipleListenersTest.listener2Called).toBe(true);
    expect(multipleListenersTest.listener3Called).toBe(true);
    expect(multipleListenersTest.allListenersCalled).toBe(true);
  });

  test('should handle event listener removal', async ({ page }) => {
    const listenerRemovalTest = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      let listener1Called = false;
      let listener2Called = false;
      
      // Set up listeners
      const listener1 = () => { listener1Called = true; };
      const listener2 = () => { listener2Called = true; };
      
      eventBus.on('removalEvent', listener1);
      eventBus.on('removalEvent', listener2);
      
      // Remove first listener
      eventBus.off('removalEvent', listener1);
      
      // Emit event
      eventBus.emit('removalEvent');
      
      return {
        listener1Called,
        listener2Called,
        onlyListener2Called: !listener1Called && listener2Called
      };
    });
    
    expect(listenerRemovalTest.listener1Called).toBe(false);
    expect(listenerRemovalTest.listener2Called).toBe(true);
    expect(listenerRemovalTest.onlyListener2Called).toBe(true);
  });

  test('should handle once listeners', async ({ page }) => {
    const onceListenerTest = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      let callCount = 0;
      
      // Set up once listener
      eventBus.once('onceEvent', () => { callCount++; });
      
      // Emit event multiple times
      eventBus.emit('onceEvent');
      eventBus.emit('onceEvent');
      eventBus.emit('onceEvent');
      
      return {
        callCount,
        calledOnlyOnce: callCount === 1
      };
    });
    
    expect(onceListenerTest.callCount).toBe(1);
    expect(onceListenerTest.calledOnlyOnce).toBe(true);
  });

  test('should handle event data passing', async ({ page }) => {
    const dataPassingTest = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      let receivedData = null;
      
      // Set up listener
      eventBus.on('dataEvent', (data) => {
        receivedData = data;
      });
      
      // Emit event with complex data
      const testData = {
        id: 123,
        name: 'Test Event',
        payload: {
          coordinates: { lat: -37.8136, lng: 144.9631 },
          metadata: { source: 'unit-test', timestamp: Date.now() }
        }
      };
      
      eventBus.emit('dataEvent', testData);
      
      return {
        receivedData,
        hasCorrectId: receivedData && receivedData.id === 123,
        hasCorrectName: receivedData && receivedData.name === 'Test Event',
        hasPayload: receivedData && receivedData.payload,
        hasCoordinates: receivedData && receivedData.payload && receivedData.payload.coordinates
      };
    });
    
    expect(dataPassingTest.hasCorrectId).toBe(true);
    expect(dataPassingTest.hasCorrectName).toBe(true);
    expect(dataPassingTest.hasPayload).toBe(true);
    expect(dataPassingTest.hasCoordinates).toBe(true);
    expect(dataPassingTest.receivedData.payload.coordinates).toEqual({
      lat: -37.8136,
      lng: 144.9631
    });
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    const errorHandling = await page.evaluate(() => {
      const eventBus = window.globalEventBus;
      
      try {
        // Test invalid operations
        eventBus.emit(null); // Should not throw
        eventBus.on(null, () => {}); // Should not throw
        eventBus.off('nonexistent', () => {}); // Should not throw
        
        return {
          handlesInvalidEmit: true,
          handlesInvalidOn: true,
          handlesInvalidOff: true,
          noErrorsThrown: true
        };
      } catch (error) {
        return {
          errorCaught: true,
          errorMessage: error.message
        };
      }
    });
    
    expect(errorHandling.handlesInvalidEmit).toBe(true);
    expect(errorHandling.handlesInvalidOn).toBe(true);
    expect(errorHandling.handlesInvalidOff).toBe(true);
    expect(errorHandling.noErrorsThrown).toBe(true);
  });
});



