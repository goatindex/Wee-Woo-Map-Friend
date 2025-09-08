/**
 * @fileoverview ES6 Module Loading Validation Tests
 * Tests that all ES6 modules load correctly in the browser
 */

import { test, expect } from '@playwright/test';

test.describe('ES6 Module Loading Validation', () => {
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    // Clear console arrays
    consoleErrors = [];
    consoleWarnings = [];

    // Monitor console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        });
      }
    });

    // Monitor page errors
    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });
  });

  test('should load all ES6 modules without errors', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for async module loading

    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      !error.text.includes('favicon') && // Ignore favicon errors
      !error.text.includes('404') && // Ignore 404 errors for non-critical resources
      !error.text.includes('CORS') // Ignore CORS warnings
    );

    expect(criticalErrors).toHaveLength(0);
    
    if (criticalErrors.length > 0) {
      console.log('Critical Errors Found:', criticalErrors);
    }
  });

  test('should have all required ES6 modules available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that core ES6 modules are available
    const moduleChecks = await page.evaluate(() => {
      const results = {};
      
      // Check ES6Bootstrap
      results.ES6Bootstrap = typeof window.ES6Bootstrap !== 'undefined';
      
      // Check StateManager
      results.StateManager = typeof window.StateManager !== 'undefined';
      results.stateManager = typeof window.stateManager !== 'undefined';
      
      // Check EventBus
      results.EventBus = typeof window.EventBus !== 'undefined';
      results.globalEventBus = typeof window.globalEventBus !== 'undefined';
      
      // Check other core modules
      results.UIManager = typeof window.UIManager !== 'undefined';
      results.MapManager = typeof window.MapManager !== 'undefined';
      results.LayerManager = typeof window.LayerManager !== 'undefined';
      results.ActiveListManager = typeof window.ActiveListManager !== 'undefined';
      
      return results;
    });

    // Verify all modules are available
    expect(moduleChecks.ES6Bootstrap).toBe(true);
    expect(moduleChecks.StateManager).toBe(true);
    expect(moduleChecks.stateManager).toBe(true);
    expect(moduleChecks.EventBus).toBe(true);
    expect(moduleChecks.globalEventBus).toBe(true);
    expect(moduleChecks.UIManager).toBe(true);
    expect(moduleChecks.MapManager).toBe(true);
    expect(moduleChecks.LayerManager).toBe(true);
    expect(moduleChecks.ActiveListManager).toBe(true);
  });

  test('should initialize ES6Bootstrap correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow for bootstrap initialization

    const bootstrapStatus = await page.evaluate(() => {
      return {
        initialized: window.ES6Bootstrap && window.ES6Bootstrap.initialized,
        migrationPhase: window.ES6Bootstrap && window.ES6Bootstrap.migrationPhase,
        hasLegacyBootstrap: window.ES6Bootstrap && window.ES6Bootstrap.legacyBootstrap !== null
      };
    });

    expect(bootstrapStatus.initialized).toBe(true);
    expect(bootstrapStatus.migrationPhase).toBe('complete');
  });

  test('should have working StateManager', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const stateManagerStatus = await page.evaluate(() => {
      if (!window.stateManager) return { available: false };
      
      try {
        // Test basic state operations
        window.stateManager.set('testKey', 'testValue');
        const value = window.stateManager.get('testKey');
        
        return {
          available: true,
          canSet: true,
          canGet: true,
          testValue: value
        };
      } catch (error) {
        return {
          available: true,
          error: error.message
        };
      }
    });

    expect(stateManagerStatus.available).toBe(true);
    expect(stateManagerStatus.canSet).toBe(true);
    expect(stateManagerStatus.canGet).toBe(true);
    expect(stateManagerStatus.testValue).toBe('testValue');
  });

  test('should have working globalEventBus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const eventBusStatus = await page.evaluate(() => {
      if (!window.globalEventBus) return { available: false };
      
      try {
        let eventReceived = false;
        
        // Test event system
        window.globalEventBus.on('test-event', () => {
          eventReceived = true;
        });
        
        window.globalEventBus.emit('test-event', { data: 'test' });
        
        return {
          available: true,
          canEmit: true,
          canListen: true,
          eventReceived: eventReceived
        };
      } catch (error) {
        return {
          available: true,
          error: error.message
        };
      }
    });

    expect(eventBusStatus.available).toBe(true);
    expect(eventBusStatus.canEmit).toBe(true);
    expect(eventBusStatus.canListen).toBe(true);
    expect(eventBusStatus.eventReceived).toBe(true);
  });

  test('should have no module import/export errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for specific module-related errors
    const moduleErrors = consoleErrors.filter(error => 
      error.text.includes('import') ||
      error.text.includes('export') ||
      error.text.includes('module') ||
      error.text.includes('ES6') ||
      error.text.includes('SyntaxError') ||
      error.text.includes('ReferenceError')
    );

    expect(moduleErrors).toHaveLength(0);
    
    if (moduleErrors.length > 0) {
      console.log('Module Errors Found:', moduleErrors);
    }
  });

  test.afterEach(async ({ page }) => {
    // Log any warnings for review
    if (consoleWarnings.length > 0) {
      console.log('Console Warnings:', consoleWarnings);
    }
  });
});


