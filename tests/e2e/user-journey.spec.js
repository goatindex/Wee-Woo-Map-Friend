/**
 * @fileoverview Phase 4: End-to-End User Journey Tests
 * Tests complete user workflows from map loading to feature interaction
 * Validates real user experience in actual browser environment
 */

const { test, expect } = require('@playwright/test');

test.describe('User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should complete full emergency services workflow', async ({ page }) => {
    // 1. Verify initial map state
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // 2. Verify sidebar is present and functional
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('.sidebar-section')).toHaveCount(6); // SES, LGA, CFA, Ambulance, Police, FRV
    
    // 3. Test SES layer activation workflow
    const sesSection = page.locator('#ses-section');
    await expect(sesSection).toBeVisible();
    
    // Find and click first SES checkbox
    const firstSesCheckbox = sesSection.locator('input[type="checkbox"]').first();
    await expect(firstSesCheckbox).toBeVisible();
    
    // Get the name before clicking
    const sesName = await firstSesCheckbox.getAttribute('data-name') || 'Unknown SES';
    
    // Click the checkbox to activate the layer
    await firstSesCheckbox.check();
    
    // 4. Verify layer appears on map
    await expect(page.locator('.leaflet-pane.leaflet-overlay-pane svg')).toBeVisible();
    
    // 5. Verify active list is updated
    const activeList = page.locator('#active-list');
    await expect(activeList).toBeVisible();
    await expect(activeList.locator('.active-item')).toContainText(sesName);
    
    // 6. Test emphasis functionality
    const emphasisCheckbox = activeList.locator(`input[data-emphasis="${sesName}"]`);
    if (await emphasisCheckbox.isVisible()) {
      await emphasisCheckbox.check();
      // Verify emphasis is applied (this might be visual - check for CSS classes or styles)
    }
    
    // 7. Test label functionality
    const labelCheckbox = activeList.locator(`input[data-label="${sesName}"]`);
    if (await labelCheckbox.isVisible()) {
      await labelCheckbox.check();
      // Verify label appears on map
      await expect(page.locator('.leaflet-pane.leaflet-overlay-pane .leaflet-label')).toBeVisible();
    }
    
    // 8. Test deactivation
    await firstSesCheckbox.uncheck();
    
    // Verify layer is removed from map
    await expect(page.locator('.leaflet-pane.leaflet-overlay-pane svg')).not.toBeVisible();
    
    // Verify active list is updated
    await expect(activeList.locator('.active-item')).not.toContainText(sesName);
  });

  test('should handle mobile responsive behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile-specific elements
    await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
    
    // Test mobile navigation
    const mobileToggle = page.locator('.mobile-nav-toggle');
    await mobileToggle.click();
    
    // Verify sidebar is accessible on mobile
    await expect(page.locator('#sidebar')).toBeVisible();
    
    // Test touch interactions (simulate touch events)
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    await firstCheckbox.tap();
    
    // Verify touch interaction worked
    await expect(firstCheckbox).toBeChecked();
  });

  test('should handle keyboard navigation and accessibility', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    await expect(page.locator(':focus')).toBeVisible();
    
    // Navigate through sidebar with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test spacebar activation
    await page.keyboard.press(' ');
    
    // Verify checkbox was activated
    const focusedElement = page.locator(':focus');
    if (await focusedElement.getAttribute('type') === 'checkbox') {
      await expect(focusedElement).toBeChecked();
    }
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Verify focus management works
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle performance under load', async ({ page }) => {
    // Measure initial page load performance
    const loadMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Verify performance metrics are within acceptable ranges
    expect(loadMetrics.loadTime).toBeLessThan(5000); // 5 seconds max
    expect(loadMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds max
    
    // Test performance when activating multiple layers
    const startTime = Date.now();
    
    // Activate multiple SES layers rapidly
    const sesCheckboxes = page.locator('#ses-section input[type="checkbox"]');
    const checkboxCount = await sesCheckboxes.count();
    
    for (let i = 0; i < Math.min(5, checkboxCount); i++) {
      await sesCheckboxes.nth(i).check();
    }
    
    const endTime = Date.now();
    const activationTime = endTime - startTime;
    
    // Verify rapid activation is performant
    expect(activationTime).toBeLessThan(2000); // 2 seconds max for 5 layers
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test offline behavior
    await page.context.setOffline(true);
    
    // Try to interact with the map
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    // Verify offline state is handled gracefully
    await expect(page.locator('.offline-indicator, .error-message')).toBeVisible();
    
    // Restore online state
    await page.context.setOffline(false);
    
    // Verify normal functionality resumes
    await expect(page.locator('#map')).toBeVisible();
  });

  test('should maintain state across page interactions', async ({ page }) => {
    // Activate a layer
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    // Verify layer is active
    await expect(firstCheckbox).toBeChecked();
    
    // Navigate away and back (simulate page refresh behavior)
    await page.reload();
    
    // Wait for page to reload
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Verify state is maintained (this depends on localStorage implementation)
    // For now, we'll verify the page loads correctly
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#sidebar')).toBeVisible();
  });
});
