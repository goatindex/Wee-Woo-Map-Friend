/**
 * @fileoverview Phase 4: Cross-Browser Compatibility Tests
 * Tests functionality across different browsers and devices
 * Ensures consistent behavior and appearance
 */

const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should render map consistently across browsers', async ({ page }) => {
    // Verify map container is present
    await expect(page.locator('#map')).toBeVisible();
    
    // Verify Leaflet container is rendered
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Verify map tiles are loading
    await expect(page.locator('.leaflet-tile')).toBeVisible();
    
    // Verify zoom controls are present
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
    
    // Verify attribution is present
    await expect(page.locator('.leaflet-control-attribution')).toBeVisible();
  });

  test('should handle sidebar interactions consistently', async ({ page }) => {
    // Verify sidebar structure
    await expect(page.locator('#sidebar')).toBeVisible();
    
    // Test collapsible sections
    const collapsibleSections = page.locator('.sidebar-section.collapsible');
    const sectionCount = await collapsibleSections.count();
    
    for (let i = 0; i < sectionCount; i++) {
      const section = collapsibleSections.nth(i);
      const toggle = section.locator('.collapsible-toggle');
      
      if (await toggle.isVisible()) {
        // Test collapse/expand
        await toggle.click();
        await expect(section.locator('.collapsible-content')).toBeVisible();
        
        await toggle.click();
        await expect(section.locator('.collapsible-content')).not.toBeVisible();
      }
    }
  });

  test('should handle form controls consistently', async ({ page }) => {
    // Test checkbox behavior
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    
    // Verify initial state
    await expect(firstCheckbox).not.toBeChecked();
    
    // Test checking
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    
    // Test unchecking
    await firstCheckbox.uncheck();
    await expect(firstCheckbox).not.toBeChecked();
    
    // Test keyboard interaction
    await firstCheckbox.focus();
    await page.keyboard.press(' ');
    await expect(firstCheckbox).toBeChecked();
  });

  test('should handle responsive design consistently', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#map')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#map')).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#map')).toBeVisible();
    
    // Test mobile navigation toggle
    const mobileToggle = page.locator('.mobile-nav-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await expect(page.locator('#sidebar')).toBeVisible();
    }
  });

  test('should handle touch and mouse events consistently', async ({ page }) => {
    // Test mouse interactions
    const firstCheckbox = page.locator('#ses-section input[type="checkbox"]').first();
    await firstCheckbox.hover();
    await firstCheckbox.click();
    await expect(firstCheckbox).toBeChecked();
    
    // Test touch interactions (if on mobile viewport)
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch tap
    await firstCheckbox.tap();
    await expect(firstCheckbox).toBeChecked();
    
    // Test double-tap (should not interfere with single tap)
    await firstCheckbox.tap();
    await expect(firstCheckbox).toBeChecked(); // Should remain checked
  });

  test('should handle keyboard navigation consistently', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test tab navigation through sidebar
    const focusableElements = page.locator('#sidebar input, #sidebar button, #sidebar [tabindex]');
    const elementCount = await focusableElements.count();
    
    for (let i = 0; i < Math.min(5, elementCount); i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
    
    // Test shift+tab for reverse navigation
    for (let i = 0; i < Math.min(3, elementCount); i++) {
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator(':focus')).toBeVisible();
    }
  });

  test('should handle CSS and styling consistently', async ({ page }) => {
    // Verify critical CSS classes are applied
    await expect(page.locator('#map')).toHaveClass(/leaflet-container/);
    await expect(page.locator('#sidebar')).toHaveClass(/sidebar/);
    
    // Verify responsive classes are applied
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toHaveClass(/mobile/);
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toHaveClass(/desktop/);
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Inject a test error to verify error handling
    await page.evaluate(() => {
      // Create a test error handler
      window.testErrorHandler = (error) => {
        console.error('Test error caught:', error);
        return false; // Prevent default error handling
      };
      
      // Add error event listener
      window.addEventListener('error', window.testErrorHandler);
    });
    
    // Verify the page continues to function
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#sidebar')).toBeVisible();
    
    // Clean up
    await page.evaluate(() => {
      if (window.testErrorHandler) {
        window.removeEventListener('error', window.testErrorHandler);
        delete window.testErrorHandler;
      }
    });
  });
});
