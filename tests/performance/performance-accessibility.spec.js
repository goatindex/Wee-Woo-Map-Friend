/**
 * @fileoverview Phase 4: Performance and Accessibility Tests
 * Validates real-world user experience metrics and compliance with accessibility standards
 * Tests performance under load and accessibility features
 */

import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility Tests', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting Performance and Accessibility Tests');
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should load application within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for ES6 module initialization
    
    const loadTime = Date.now() - startTime;
    
    // Expect load time to be under 10 seconds
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Application load time: ${loadTime}ms`);
  });

  test('should initialize ES6 modules within acceptable time', async ({ page }) => {
    await page.goto('/');
    
    const initTimes = await page.evaluate(() => {
      const times = {};
      
      // Measure ES6Bootstrap initialization
      if (window.ES6Bootstrap && window.ES6Bootstrap.initStartTime) {
        times.es6Bootstrap = performance.now() - window.ES6Bootstrap.initStartTime;
      }
      
      // Measure StateManager initialization
      const stateManagerStart = performance.now();
      if (window.stateManager) {
        window.stateManager.set('perfTest', 'value');
        times.stateManager = performance.now() - stateManagerStart;
      }
      
      // Measure EventBus initialization
      const eventBusStart = performance.now();
      if (window.globalEventBus) {
        window.globalEventBus.emit('perfTest', {});
        times.eventBus = performance.now() - eventBusStart;
      }
      
      return times;
    });
    
    // Expect ES6Bootstrap to initialize within 5 seconds
    if (initTimes.es6Bootstrap) {
      expect(initTimes.es6Bootstrap).toBeLessThan(5000);
      console.log(`ES6Bootstrap init time: ${initTimes.es6Bootstrap}ms`);
    }
    
    // Expect StateManager operations to be fast
    if (initTimes.stateManager) {
      expect(initTimes.stateManager).toBeLessThan(100);
      console.log(`StateManager operation time: ${initTimes.stateManager}ms`);
    }
    
    // Expect EventBus operations to be fast
    if (initTimes.eventBus) {
      expect(initTimes.eventBus).toBeLessThan(100);
      console.log(`EventBus operation time: ${initTimes.eventBus}ms`);
    }
  });

  test('should handle map interactions with good performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const interactionTimes = await page.evaluate(() => {
      if (!window.map) return { available: false };
      
      const times = {};
      
      // Measure zoom performance
      const zoomStart = performance.now();
      const initialZoom = window.map.getZoom();
      window.map.setZoom(initialZoom + 1);
      times.zoom = performance.now() - zoomStart;
      
      // Measure pan performance
      const panStart = performance.now();
      const center = window.map.getCenter();
      window.map.panTo([center.lat + 0.01, center.lng + 0.01]);
      times.pan = performance.now() - panStart;
      
      // Measure layer toggle performance
      const layerStart = performance.now();
      if (window.stateManager) {
        const currentLayers = window.stateManager.get('featureLayers');
        window.stateManager.set('featureLayers', currentLayers);
      }
      times.layerToggle = performance.now() - layerStart;
      
      return times;
    });
    
    expect(interactionTimes.available).toBe(true);
    
    // Expect zoom to be fast
    expect(interactionTimes.zoom).toBeLessThan(200);
    console.log(`Map zoom time: ${interactionTimes.zoom}ms`);
    
    // Expect pan to be fast
    expect(interactionTimes.pan).toBeLessThan(200);
    console.log(`Map pan time: ${interactionTimes.pan}ms`);
    
    // Expect layer operations to be fast
    expect(interactionTimes.layerToggle).toBeLessThan(100);
    console.log(`Layer toggle time: ${interactionTimes.layerToggle}ms`);
  });

  test('should handle sidebar interactions with good performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const sidebarTimes = await page.evaluate(() => {
      const times = {};
      
      // Measure collapsible toggle performance
      const toggleStart = performance.now();
      const sesHeader = document.querySelector('#sesHeader');
      if (sesHeader) {
        sesHeader.click();
      }
      times.collapsibleToggle = performance.now() - toggleStart;
      
      // Measure search performance
      const searchStart = performance.now();
      const searchInput = document.querySelector('#searchInput');
      if (searchInput) {
        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input'));
      }
      times.search = performance.now() - searchStart;
      
      // Measure checkbox toggle performance
      const checkboxStart = performance.now();
      const checkboxes = document.querySelectorAll('#sesList input[type="checkbox"]');
      if (checkboxes.length > 0) {
        checkboxes[0].click();
      }
      times.checkboxToggle = performance.now() - checkboxStart;
      
      return times;
    });
    
    // Expect collapsible toggle to be fast
    expect(sidebarTimes.collapsibleToggle).toBeLessThan(200);
    console.log(`Collapsible toggle time: ${sidebarTimes.collapsibleToggle}ms`);
    
    // Expect search to be fast
    expect(sidebarTimes.search).toBeLessThan(100);
    console.log(`Search time: ${sidebarTimes.search}ms`);
    
    // Expect checkbox toggle to be fast
    expect(sidebarTimes.checkboxToggle).toBeLessThan(100);
    console.log(`Checkbox toggle time: ${sidebarTimes.checkboxToggle}ms`);
  });

  test('should not have memory leaks in ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (!initialMemory) {
      console.log('Memory API not available, skipping memory leak test');
      return;
    }
    
    // Perform some operations to test for memory leaks
    await page.evaluate(() => {
      // Simulate user interactions
      for (let i = 0; i < 10; i++) {
        if (window.stateManager) {
          window.stateManager.set(`testKey${i}`, `testValue${i}`);
        }
        if (window.globalEventBus) {
          window.globalEventBus.emit('test-event', { iteration: i });
        }
      }
    });
    
    // Wait a bit for garbage collection
    await page.waitForTimeout(2000);
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    // Check that memory usage hasn't increased dramatically
    const memoryIncrease = finalMemory.used - initialMemory.used;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
    
    console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
    
    // Allow for some memory increase but not excessive
    expect(memoryIncreasePercent).toBeLessThan(50);
  });

  test('should meet performance budgets', async ({ page }) => {
      
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
  });

  test('should handle resource loading efficiently', async ({ page }) => {
      
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
  });

  test('should maintain performance under load', async ({ page }) => {
      
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
      
  });

  test('should provide keyboard navigation', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should provide keyboard navigation';
    const suiteName = 'performance-accessibility';
    
    try {
      
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
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      throw error;
    }
  });

  test('should have proper form labels and controls', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should have proper form labels and controls';
    const suiteName = 'performance-accessibility';
    
    try {
      
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
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      throw error;
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should have semantic HTML structure';
    const suiteName = 'performance-accessibility';
    
    try {
      
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
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      throw error;
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    const testStartTime = Date.now();
    const testName = 'should handle memory usage efficiently';
    const suiteName = 'performance-accessibility';
    
    try {
      
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
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      throw error;
    }
  });
});
