/**
 * @fileoverview Phase 4: Performance and Accessibility Tests
 * Validates real-world user experience metrics and compliance with accessibility standards
 * Tests performance under load and accessibility features
 */

const { test, expect } = require('@playwright/test');
const { progressTracker } = require('./progress-tracker');

test.describe('Performance and Accessibility Tests', () => {
  test.beforeAll(async () => {
    progressTracker.startPhase('Performance and Accessibility Tests');
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should meet performance budgets', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should meet performance budgets';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Measure page load performance
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      // Performance budgets (in milliseconds) - Adjusted for realistic expectations
      const budgets = {
        domContentLoaded: 5000,    // 5 seconds - more realistic for complex apps
        loadComplete: 8000,        // 8 seconds - accounts for data loading
        firstPaint: 4000,          // 4 seconds - accounts for map rendering delays
        firstContentfulPaint: 5000 // 5 seconds - accounts for map tiles
      };
      
      // Verify performance meets budgets
      expect(performanceMetrics.domContentLoaded).toBeLessThan(budgets.domContentLoaded);
      expect(performanceMetrics.loadComplete).toBeLessThan(budgets.loadComplete);
      expect(performanceMetrics.firstPaint).toBeLessThan(budgets.firstPaint);
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(budgets.firstContentfulPaint);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle resource loading efficiently', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle resource loading efficiently';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Measure resource loading
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const totalResources = resources.length;
        const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
        
        return {
          totalResources,
          totalResourceSize: totalSize,
          averageResourceSize: totalSize / totalResources
        };
      });
      
      // Resource budgets
      const maxResources = 50;        // Maximum number of resources
      const maxTotalSize = 5 * 1024 * 1024; // 5MB total
      const maxAverageSize = 100 * 1024;     // 100KB average
      
      // Verify resource efficiency
      expect(resourceMetrics.totalResources).toBeLessThan(maxResources);
      expect(resourceMetrics.totalResourceSize).toBeLessThan(maxTotalSize);
      expect(resourceMetrics.averageResourceSize).toBeLessThan(maxAverageSize);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should maintain performance under load', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should maintain performance under load';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Measure initial performance
      const initialMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        };
      });
      
      // Simulate load by activating multiple layers
      const startTime = Date.now();
      
      // Activate multiple SES layers
      const sesCheckboxes = page.locator('#sesList input[type="checkbox"]');
      const checkboxCount = await sesCheckboxes.count();
      
      for (let i = 0; i < Math.min(10, checkboxCount); i++) {
        await sesCheckboxes.nth(i).check();
        // Small delay to simulate real user interaction
        await page.waitForTimeout(100);
      }
      
      const loadTime = Date.now() - startTime;
      
      // Verify load performance is reasonable
      expect(loadTime).toBeLessThan(5000); // 5 seconds max for 10 layers
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should provide keyboard navigation', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should provide keyboard navigation';
    const suiteName = 'performance-accessibility';
    
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
      
      // Test spacebar activation
      const focusedElement = page.locator(':focus');
      if (await focusedElement.getAttribute('type') === 'checkbox') {
        await page.keyboard.press(' ');
        await expect(focusedElement).toBeChecked();
      }
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should have proper form labels and controls', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should have proper form labels and controls';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Check that checkboxes have associated labels
      const checkboxes = page.locator('#sesList input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      for (let i = 0; i < Math.min(5, checkboxCount); i++) {
        const checkbox = checkboxes.nth(i);
        const label = page.locator(`label:has(input[type="checkbox"]:nth-child(${i + 1}))`);
        
        // Verify label exists and is associated
        await expect(label).toBeVisible();
      }
      
      // Check search input has placeholder
      const searchInput = page.locator('#globalSidebarSearch');
      await expect(searchInput).toHaveAttribute('placeholder');
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should have semantic HTML structure';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Verify main content areas
      await expect(page.locator('#map')).toBeVisible();
      await expect(page.locator('#layerMenu')).toBeVisible();
      
      // Check heading hierarchy
      const headers = page.locator('h1, h2, h3, h4, h5, h6');
      const headerCount = await headers.count();
      
      // Should have headers for structure
      expect(headerCount).toBeGreaterThan(0);
      
      // Verify sidebar structure
      const sidebarHeaders = page.locator('#layerMenu h4');
      const sidebarHeaderCount = await sidebarHeaders.count();
      
      // Should have section headers
      expect(sidebarHeaderCount).toBeGreaterThan(0);
      
      const duration = Date.now() - testStartTime;
      progressTracker.testPassed(testName, suiteName, duration);
      
    } catch (error) {
      const duration = Date.now() - testStartTime;
      progressTracker.testFailed(testName, suiteName, error, duration);
      throw error;
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle memory usage efficiently';
    const suiteName = 'performance-accessibility';
    
    try {
      progressTracker.testStarted(testName, suiteName);
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (initialMemory) {
        // Simulate some user interactions
        const sesCheckboxes = page.locator('#sesList input[type="checkbox"]');
        const checkboxCount = await sesCheckboxes.count();
        
        // Activate a few layers
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await sesCheckboxes.nth(i).check();
        }
        
        // Wait for any memory allocations
        await page.waitForTimeout(1000);
        
        // Get memory usage after interactions
        const finalMemory = await page.evaluate(() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize
            };
          }
          return null;
        });
        
        if (finalMemory) {
          // Memory usage should not increase dramatically
          const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          const maxIncrease = 10 * 1024 * 1024; // 10MB max increase
          
          expect(memoryIncrease).toBeLessThan(maxIncrease);
        }
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
