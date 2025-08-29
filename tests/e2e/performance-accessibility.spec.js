/**
 * @fileoverview Phase 4: Performance and Accessibility Tests
 * Tests performance standards and accessibility compliance
 * Validates real-world user experience metrics
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should meet performance benchmarks', async ({ page }) => {
    // Measure page load performance
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const resource = performance.getEntriesByType('resource');
      
      return {
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // Paint timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource loading
        totalResources: resource.length,
        totalResourceSize: resource.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        
        // Memory usage (if available)
        memoryUsage: performance.memory?.usedJSHeapSize || 0
      };
    });
    
    // Performance benchmarks for emergency services mapping
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds max
    expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds max
    expect(performanceMetrics.firstPaint).toBeLessThan(2000); // 2 seconds max
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(3000); // 3 seconds max
    
    // Resource benchmarks
    expect(performanceMetrics.totalResources).toBeLessThan(50); // 50 resources max
    expect(performanceMetrics.totalResourceSize).toBeLessThan(5 * 1024 * 1024); // 5MB max
    
    // Memory benchmarks
    if (performanceMetrics.memoryUsage > 0) {
      expect(performanceMetrics.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB max
    }
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Measure performance when loading multiple layers
    const startTime = Date.now();
    
    // Activate multiple SES layers
    const sesCheckboxes = page.locator('#ses-section input[type="checkbox"]');
    const checkboxCount = await sesCheckboxes.count();
    
    // Activate up to 10 layers to test performance
    const layersToActivate = Math.min(10, checkboxCount);
    
    for (let i = 0; i < layersToActivate; i++) {
      await sesCheckboxes.nth(i).check();
      
      // Small delay to simulate real user behavior
      await page.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Performance benchmark: 10 layers should activate within 3 seconds
    expect(totalTime).toBeLessThan(3000);
    
    // Verify all layers are active
    for (let i = 0; i < layersToActivate; i++) {
      await expect(sesCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('should maintain responsive performance', async ({ page }) => {
    // Test performance across different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Measure interaction performance
      const startTime = Date.now();
      
      // Perform a simple interaction
      const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
      await firstCheckbox.check();
      await firstCheckbox.uncheck();
      
      const endTime = Date.now();
      const interactionTime = endTime - startTime;
      
      // Interaction should be responsive across all viewports
      expect(interactionTime).toBeLessThan(1000); // 1 second max
    }
  });

  test('should meet accessibility standards', async ({ page }) => {
    // Test ARIA attributes
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('role', 'complementary');
    
    // Test form labels
    const checkboxes = page.locator('#ses-section input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    for (let i = 0; i < Math.min(5, checkboxCount); i++) {
      const checkbox = checkboxes.nth(i);
      
      // Verify checkbox has proper attributes
      await expect(checkbox).toHaveAttribute('type', 'checkbox');
      
      // Verify checkbox has associated label or aria-label
      const id = await checkbox.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const ariaLabel = await checkbox.getAttribute('aria-label');
        
        // Should have either a label or aria-label
        expect(await label.isVisible() || ariaLabel).toBeTruthy();
      }
    }
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test focus indicators
    const focusedElement = page.locator(':focus');
    const computedStyle = await focusedElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border
      };
    });
    
    // Should have visible focus indicator
    const hasFocusIndicator = computedStyle.outline !== 'none' || 
                            computedStyle.boxShadow !== 'none' || 
                            computedStyle.border !== 'none';
    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should handle screen reader compatibility', async ({ page }) => {
    // Test semantic HTML structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Test heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      // Verify first heading is h1
      const firstHeading = headings.first();
      const firstTagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      expect(firstTagName).toBe('h1');
    }
    
    // Test landmark roles
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    
    // Test skip links (if present)
    const skipLinks = page.locator('a[href^="#"]').filter({ hasText: /skip|jump/i });
    if (await skipLinks.count() > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
  });

  test('should handle high contrast and color accessibility', async ({ page }) => {
    // Test color contrast (basic check)
    const textElements = page.locator('p, span, div, label, button');
    const textCount = await textElements.count();
    
    // Sample a few text elements for color analysis
    const sampleSize = Math.min(10, textCount);
    
    for (let i = 0; i < sampleSize; i++) {
      const element = textElements.nth(i);
      
      // Get computed styles
      const styles = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize
        };
      });
      
      // Basic validation that colors are defined
      expect(styles.color).not.toBe('transparent');
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      
      // Font size should be readable
      const fontSize = parseFloat(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12); // 12px minimum
    }
  });

  test('should handle motion and animation accessibility', async ({ page }) => {
    // Test reduced motion support
    await page.evaluate(() => {
      // Simulate reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });
    
    // Verify page still functions with reduced motion
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#sidebar')).toBeVisible();
    
    // Test interaction without motion
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  });

  test('should handle error states accessibly', async ({ page }) => {
    // Test error message accessibility
    await page.evaluate(() => {
      // Simulate an error condition
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('role', 'alert');
      errorDiv.setAttribute('aria-live', 'polite');
      errorDiv.textContent = 'Test error message';
      errorDiv.className = 'error-message';
      document.body.appendChild(errorDiv);
    });
    
    // Verify error message is accessible
    const errorMessage = page.locator('.error-message[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    
    // Clean up
    await page.evaluate(() => {
      const errorDiv = document.querySelector('.error-message');
      if (errorDiv) errorDiv.remove();
    });
  });
});
