/**
 * @fileoverview Basic Load Test
 * Tests if the application loads at all
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Load Test', () => {
  test('should load the page and show console logs', async ({ page }) => {
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('http://localhost:8000');
    
    // Wait a bit for any initialization
    await page.waitForTimeout(2000);
    
    // Check what's available
    const result = await page.evaluate(() => {
      return {
        title: document.title,
        hasWindow: typeof window !== 'undefined',
        windowKeys: Object.keys(window).slice(0, 10), // First 10 keys
        hasDependencyContainer: !!window.DependencyContainer,
        hasTYPES: !!window.TYPES,
        hasApplicationBootstrap: !!window.ApplicationBootstrap
      };
    });
    
    console.log('Page result:', result);
    console.log('Console messages:', consoleMessages.slice(0, 10)); // First 10 messages
    
    expect(result.title).toBeDefined();
    expect(result.hasWindow).toBe(true);
  });
});

