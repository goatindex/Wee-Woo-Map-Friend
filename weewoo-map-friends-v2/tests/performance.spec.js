import { test, expect } from '@playwright/test';

test.describe('Performance Requirements', () => {
  test('Bundle size is under 500KB', async ({ page }) => {
    const response = await page.goto('/');
    const contentLength = response.headers()['content-length'];
    
    if (contentLength) {
      expect(parseInt(contentLength)).toBeLessThan(500 * 1024);
    }
  });
  
  test('Memory usage is under 50MB', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    const memoryUsage = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);
  });
  
  test('First Contentful Paint is under 1.5 seconds', async ({ page }) => {
    await page.goto('/');
    
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    expect(fcp).toBeLessThan(1500);
  });
  
  test('Largest Contentful Paint is under 2.5 seconds', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1];
          if (lcpEntry) {
            resolve(lcpEntry.startTime);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500);
  });
  
  test('Cumulative Layout Shift is under 0.1', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
    
    expect(cls).toBeLessThan(0.1);
  });
  
  test('Time to Interactive is under 3 seconds', async ({ page }) => {
    await page.goto('/');
    
    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const ttiEntry = entries.find(entry => entry.name === 'time-to-interactive');
          if (ttiEntry) {
            resolve(ttiEntry.startTime);
          }
        });
        observer.observe({ entryTypes: ['measure'] });
        
        // Fallback: measure when map is interactive
        setTimeout(() => {
          const mapElement = document.querySelector('[data-testid="map-container"]');
          if (mapElement) {
            resolve(performance.now());
          }
        }, 3000);
      });
    });
    
    expect(tti).toBeLessThan(3000);
  });
  
  test('Network requests are optimized', async ({ page }) => {
    const requests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check for unnecessary requests
    const jsRequests = requests.filter(req => req.resourceType === 'script');
    const cssRequests = requests.filter(req => req.resourceType === 'stylesheet');
    
    // Should have minimal JS and CSS requests
    expect(jsRequests.length).toBeLessThan(10);
    expect(cssRequests.length).toBeLessThan(5);
    
    // Check for large requests
    const largeRequests = requests.filter(req => {
      const response = page.request.get(req.url);
      return response && response.headers()['content-length'] > 100000; // 100KB
    });
    
    expect(largeRequests.length).toBeLessThan(3);
  });
  
  test('Map rendering performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Measure map rendering time
    const renderTime = await page.evaluate(() => {
      const start = performance.now();
      
      // Trigger map operations
      const mapElement = document.querySelector('[data-testid="map-container"]');
      if (mapElement) {
        // Simulate map interactions
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
      
      return performance.now() - start;
    });
    
    expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  });
  
  test('Memory usage stays stable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Perform various operations
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="zoom-in"]');
      await page.waitForTimeout(100);
      await page.click('[data-testid="zoom-out"]');
      await page.waitForTimeout(100);
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Memory usage should not increase significantly
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
  });
});

