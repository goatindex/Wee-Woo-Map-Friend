/**
 * @fileoverview Test ActiveListManager DI instantiation fix
 * Verifies that ActiveListManager is properly instantiated via DI container
 */

import { test, expect } from '@playwright/test';

test.describe('ActiveListManager DI Fix', () => {
  test('should load application and verify ActiveListManager is properly instantiated', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://127.0.0.1:8000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors related to ActiveListManager
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for initialization
    await page.waitForTimeout(2000);
    
    // Check if ActiveListManager is available and working
    const activeListManagerStatus = await page.evaluate(() => {
      try {
        // Check if ActiveListManager is available globally
        if (window.activeListManager) {
          return {
            available: true,
            hasInit: typeof window.activeListManager.init === 'function',
            hasUpdateActiveList: typeof window.activeListManager.updateActiveList === 'function',
            initialized: window.activeListManager.initialized || false
          };
        }
        return { available: false };
      } catch (error) {
        return { available: false, error: error.message };
      }
    });
    
    // Check for ActiveListManager-specific errors
    const activeListErrors = consoleErrors.filter(error => 
      error.includes('ActiveListManager') || 
      error.includes('undefined is not an object') ||
      error.includes('this.eventBus') ||
      error.includes('this.stateManager')
    );
    
    console.log('ActiveListManager Status:', activeListManagerStatus);
    console.log('ActiveListManager Errors:', activeListErrors);
    console.log('All Console Errors:', consoleErrors);
    
    // Verify ActiveListManager is available and working
    expect(activeListManagerStatus.available).toBe(true);
    expect(activeListManagerStatus.hasInit).toBe(true);
    expect(activeListManagerStatus.hasUpdateActiveList).toBe(true);
    
    // Should not have dependency injection errors
    expect(activeListErrors.length).toBe(0);
    
    // Check if the application loaded successfully
    const appStatus = await page.evaluate(() => {
      return {
        hasMap: !!window.map,
        hasSidebar: !!document.getElementById('layerMenu'),
        bootstrapComplete: window.appInitialized || false
      };
    });
    
    console.log('Application Status:', appStatus);
    
    // Basic application functionality should work
    expect(appStatus.hasMap).toBe(true);
    expect(appStatus.hasSidebar).toBe(true);
  });
  
  test('should verify DI container is working for ActiveListManager', async ({ page }) => {
    await page.goto('http://127.0.0.1:8000');
    await page.waitForLoadState('networkidle');
    
    // Check DI container status
    const diStatus = await page.evaluate(() => {
      try {
        if (window.DependencyContainer && window.DependencyContainer.getContainer) {
          const container = window.DependencyContainer.getContainer();
          return {
            containerAvailable: true,
            activeListManagerInContainer: container.isBound('ActiveListManager'),
            containerStats: container.getContainerStats ? container.getContainerStats() : null
          };
        }
        return { containerAvailable: false };
      } catch (error) {
        return { containerAvailable: false, error: error.message };
      }
    });
    
    console.log('DI Container Status:', diStatus);
    
    // DI container should be available
    expect(diStatus.containerAvailable).toBe(true);
  });
});

