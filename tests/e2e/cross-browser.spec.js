/**
 * @fileoverview Phase 4: Cross-Browser Compatibility Tests
 * Ensures consistent application behavior and appearance across various platforms
 * Tests responsive design, touch interactions, and browser-specific features
 */

const { test, expect } = require('@playwright/test');
const { progressTracker } = require('./progress-tracker');

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeAll(async () => {
    progressTracker.startPhase('Cross-Browser Compatibility Tests');
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should render correctly on desktop viewport', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should render correctly on desktop viewport';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Verify desktop-specific layout
      await expect(page.locator('#map')).toBeVisible();
      await expect(page.locator('#layerMenu')).toBeVisible();
      
      // Check that sidebar is expanded by default on desktop
      const collapsibleLists = page.locator('.collapsible-list');
      const visibleLists = await collapsibleLists.filter({ hasText: /./ }).count();
      
      // At least some lists should be visible on desktop
      expect(visibleLists).toBeGreaterThan(0);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle mobile viewport correctly', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle mobile viewport correctly';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify mobile-specific behavior
      await expect(page.locator('#map')).toBeVisible();
      await expect(page.locator('#layerMenu')).toBeVisible();
      
      // Check that body has mobile class
      await expect(page.locator('body')).toHaveClass(/device-mobile-small|device-mobile-large/);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle tablet viewport correctly', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle tablet viewport correctly';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify tablet layout
      await expect(page.locator('#map')).toBeVisible();
      await expect(page.locator('#layerMenu')).toBeVisible();
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle touch interactions on mobile';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test touch interaction with checkboxes
      const firstCheckbox = page.locator('#sesList input[type="checkbox"]').first();
      await firstCheckbox.click();
      
      // Verify touch interaction worked
      await expect(firstCheckbox).toBeChecked();
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle keyboard navigation consistently', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle keyboard navigation consistently';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Focus on first interactive element
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test tab navigation through sidebar
      const focusableElements = page.locator('#layerMenu input, #layerMenu button, #layerMenu [tabindex]');
      const elementCount = await focusableElements.count();
      
      // Should have focusable elements
      expect(elementCount).toBeGreaterThan(0);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle collapsible sections consistently', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle collapsible sections consistently';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Wait for the page to fully load and data to be populated
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Find a collapsible section header
      const header = page.locator('h4[id$="Header"]').first();
      await expect(header).toBeVisible();
      
      // Get the header ID before clicking
      const headerId = await header.getAttribute('id');
      const listId = headerId.replace('Header', 'List');
      const list = page.locator(`#${listId}`);
      
      // Click to toggle
      await header.click();
      
      // Wait for animation and data loading
      await page.waitForTimeout(1000);
      
      // Use a more robust approach - check if the list becomes visible
      // and has content (either checkboxes or is expanded)
      await page.waitForFunction((listId) => {
        const listElement = document.querySelector(`#${listId}`);
        if (!listElement) return false;
        
        // Check if the list is visible (not hidden)
        if (listElement.style.display === 'none') return false;
        
        // Check if it has content (checkboxes) or is in expanded state
        const checkboxes = listElement.querySelectorAll('input[type="checkbox"]');
        const hasContent = checkboxes.length > 0;
        const isExpanded = !listElement.classList.contains('collapsed');
        
        return hasContent || isExpanded;
      }, listId, { timeout: 20000 });
      
      // The list should be visible after clicking the header
      await expect(list).toBeVisible();
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle responsive breakpoints correctly', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle responsive breakpoints correctly';
    const suiteName = 'cross-browser';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Test multiple viewport sizes
      const viewports = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop-small' },
        { width: 1920, height: 1080, name: 'desktop-large' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Verify basic elements are always visible
        await expect(page.locator('#map')).toBeVisible();
        await expect(page.locator('#layerMenu')).toBeVisible();
        
        // Wait for layout to settle
        await page.waitForTimeout(100);
      }
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });
});
