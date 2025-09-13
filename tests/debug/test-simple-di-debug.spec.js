/**
 * @fileoverview Simple DI Debug Test
 * Tests if DependencyContainer is available on window object
 */

import { test, expect } from '@playwright/test';

test.describe('Simple DI Debug', () => {
  test('should have DependencyContainer on window object', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for the application to initialize
    await page.waitForFunction(() => {
      return window.DependencyContainer && window.TYPES;
    }, { timeout: 10000 });
    
    // Check what's available on window
    const result = await page.evaluate(() => {
      return {
        hasDependencyContainer: !!window.DependencyContainer,
        hasTYPES: !!window.TYPES,
        hasAppBootstrap: !!window.AppBootstrap,
        hasApplicationBootstrap: !!window.ApplicationBootstrap,
        windowKeys: Object.keys(window).filter(key => key.includes('Dependency') || key.includes('TYPES') || key.includes('Bootstrap'))
      };
    });
    
    console.log('Debug result:', result);
    
    expect(result.hasDependencyContainer).toBe(true);
    expect(result.hasTYPES).toBe(true);
  });
});
