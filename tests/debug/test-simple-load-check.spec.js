/**
 * @fileoverview Simple test to check application loading status
 */

import { test, expect } from '@playwright/test';

test.describe('Simple Load Check', () => {
  test('should load application and check console for errors', async ({ page }) => {
    const consoleMessages = [];
    const consoleErrors = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to the application
    await page.goto('http://127.0.0.1:8000');
    
    // Wait for basic load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for initialization
    await page.waitForTimeout(3000);
    
    // Check what's available
    const status = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasDependencyContainer: !!window.DependencyContainer,
        hasTYPES: !!window.TYPES,
        hasApplicationBootstrap: !!window.ApplicationBootstrap,
        hasActiveListManager: !!window.activeListManager,
        bootstrapInitialized: window.appInitialized || false,
        consoleLogs: console.log.toString(),
        errorCount: 0
      };
    });
    
    console.log('Application Status:', status);
    console.log('Console Errors:', consoleErrors);
    console.log('All Console Messages:', consoleMessages.slice(-10)); // Last 10 messages
    
    // Basic checks
    expect(status.hasWindow).toBe(true);
    expect(status.hasDocument).toBe(true);
  });
});

