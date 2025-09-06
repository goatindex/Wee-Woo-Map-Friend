/**
 * @fileoverview Performance Monitoring Tests
 * Tests application performance with ES6 modules
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Monitoring with ES6 Modules', () => {
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
});


