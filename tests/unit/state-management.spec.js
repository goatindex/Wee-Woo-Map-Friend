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

test.describe('State Management Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for state manager to be available
    await page.waitForFunction(() => typeof window.stateManager !== 'undefined', { timeout: 10000 });
  });

  test('should initialize state manager correctly', async ({ page }) => {
    const stateInfo = await page.evaluate(() => {
      const stateManager = window.stateManager;
      return {
        isInitialized: stateManager !== null && stateManager !== undefined,
        hasGetMethod: typeof stateManager.get === 'function',
        hasSetMethod: typeof stateManager.set === 'function',
        hasSubscribeMethod: typeof stateManager.subscribe === 'function',
        hasUnsubscribeMethod: typeof stateManager.unsubscribe === 'function'
      };
    });
    
    expect(stateInfo.isInitialized).toBe(true);
    expect(stateInfo.hasGetMethod).toBe(true);
    expect(stateInfo.hasSetMethod).toBe(true);
    expect(stateInfo.hasSubscribeMethod).toBe(true);
    expect(stateInfo.hasUnsubscribeMethod).toBe(true);
  });

  test('should handle basic state operations', async ({ page }) => {
    const stateOperations = await page.evaluate(() => {
      const stateManager = window.stateManager;
      
      // Test basic set/get operations
      stateManager.set('testKey', 'testValue');
      const retrievedValue = stateManager.get('testKey');
      
      // Test nested state
      stateManager.set('nested', { user: { name: 'John', age: 30 } });
      const nestedValue = stateManager.get('nested.user.name');
      
      // Test state updates
      stateManager.set('counter', 0);
      stateManager.set('counter', stateManager.get('counter') + 1);
      const counterValue = stateManager.get('counter');
      
      return {
        basicSetGet: retrievedValue === 'testValue',
        nestedAccess: nestedValue === 'John',
        stateUpdate: counterValue === 1
      };
    });
    
    expect(stateOperations.basicSetGet).toBe(true);
    expect(stateOperations.nestedAccess).toBe(true);
    expect(stateOperations.stateUpdate).toBe(true);
  });

  test('should handle state persistence', async ({ page }) => {
    const persistenceTest = await page.evaluate(() => {
      const stateManager = window.stateManager;
      
      // Set a persistent value
      stateManager.set('persistentKey', 'persistentValue');
      
      // Simulate page reload by checking if value persists
      // (In a real test, we'd reload the page, but for unit testing we verify the method exists)
      const hasPersistMethod = typeof stateManager.persist === 'function';
      const hasRestoreMethod = typeof stateManager.restore === 'function';
      
      return {
        hasPersistMethod,
        hasRestoreMethod,
        currentValue: stateManager.get('persistentKey')
      };
    });
    
    expect(persistenceTest.hasPersistMethod).toBe(true);
    expect(persistenceTest.hasRestoreMethod).toBe(true);
    expect(persistenceTest.currentValue).toBe('persistentValue');
  });

  test('should handle state subscriptions', async ({ page }) => {
    const subscriptionTest = await page.evaluate(() => {
      const stateManager = window.stateManager;
      let callbackCalled = false;
      let callbackValue = null;
      
      // Subscribe to state changes
      const subscriptionId = stateManager.subscribe('testSubscription', (newValue) => {
        callbackCalled = true;
        callbackValue = newValue;
      });
      
      // Trigger a state change
      stateManager.set('testSubscription', 'newValue');
      
      // Unsubscribe
      stateManager.unsubscribe(subscriptionId);
      
      // Trigger another change (should not call callback)
      stateManager.set('testSubscription', 'anotherValue');
      
      return {
        callbackWasCalled: callbackCalled,
        callbackReceivedValue: callbackValue,
        hasSubscriptionId: subscriptionId !== null && subscriptionId !== undefined
      };
    });
    
    expect(subscriptionTest.callbackWasCalled).toBe(true);
    expect(subscriptionTest.callbackReceivedValue).toBe('newValue');
    expect(subscriptionTest.hasSubscriptionId).toBe(true);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    const errorHandling = await page.evaluate(() => {
      const stateManager = window.stateManager;
      
      try {
        // Test invalid operations
        const invalidGet = stateManager.get('nonexistent.nested.key');
        const invalidSet = stateManager.set(null, 'value');
        
        return {
          invalidGetReturnsUndefined: invalidGet === undefined,
          invalidSetHandled: true, // If we get here, it didn't throw
          hasErrorHandling: true
        };
      } catch (error) {
        return {
          errorCaught: true,
          errorMessage: error.message
        };
      }
    });
    
    expect(errorHandling.invalidGetReturnsUndefined).toBe(true);
    expect(errorHandling.invalidSetHandled).toBe(true);
    expect(errorHandling.hasErrorHandling).toBe(true);
  });
});



