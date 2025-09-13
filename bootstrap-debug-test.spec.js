import { test, expect } from '@playwright/test';

test.describe('Bootstrap Debug Analysis', () => {
  test('should analyze bootstrap process step by step', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // Navigate to the page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for bootstrap to complete
    await page.waitForTimeout(5000);
    
    // Check what's available on the window object
    const windowState = await page.evaluate(() => {
      return {
        // Check for global modules
        stateManager: typeof window.stateManager,
        globalEventBus: typeof window.globalEventBus,
        utilityManager: typeof window.UtilityManager,
        
        // Check if bootstrap completed
        bootstrapComplete: typeof window.bootstrapComplete,
        
        // Check for any errors
        consoleErrors: window.consoleErrors || [],
        
        // Check if modules are loaded but not exposed
        modulesLoaded: {
          StateManager: typeof window.StateManager,
          EventBus: typeof window.EventBus,
          ApplicationBootstrap: typeof window.ApplicationBootstrap
        }
      };
    });

    console.log('Window State Analysis:', JSON.stringify(windowState, null, 2));
    
    // The test will pass regardless, we just want to see the state
    expect(windowState).toBeDefined();
  });
});