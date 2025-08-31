/**
 * @fileoverview Phase 4: Cross-Browser Compatibility Tests
 * Ensures consistent application behavior and appearance across various platforms
 * Tests responsive design, touch interactions, and browser-specific features
 */

const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should render correctly on desktop viewport', async ({ page }) => {
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
  });

  test('should handle mobile viewport correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile-specific behavior
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#layerMenu')).toBeVisible();
    
    // Check that body has mobile class
    await expect(page.locator('body')).toHaveClass(/device-mobile-small|device-mobile-large/);
  });

  test('should handle tablet viewport correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verify tablet layout
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#layerMenu')).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // First, expand the SES section to make checkboxes visible
    const sesHeader = page.locator('#sesHeader');
    await sesHeader.click();
    
    // Wait for checkboxes to be populated
    await page.waitForFunction(() => {
      const sesList = document.querySelector('#sesList');
      if (!sesList) return false;
      const checkboxes = sesList.querySelectorAll('input[type="checkbox"]');
      return checkboxes.length > 0;
    }, { timeout: 10000 });
    
    // Now test touch interaction with checkboxes
    const firstCheckbox = page.locator('#sesList input[type="checkbox"]').first();
    await firstCheckbox.click();
    
    // Verify touch interaction worked
    await expect(firstCheckbox).toBeChecked();
  });

  test('should handle keyboard navigation consistently', async ({ page }) => {
    // Set desktop viewport for keyboard testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Focus on the search input
    const searchInput = page.locator('#globalSidebarSearch');
    await searchInput.focus();
    
    // Verify focus is on search input
    await expect(searchInput).toBeFocused();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Verify focus moved to next element
    await expect(searchInput).not.toBeFocused();
  });

  test('should handle collapsible sections consistently', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on SES header to expand/collapse
    const sesHeader = page.locator('#sesHeader');
    await sesHeader.click();
    
    // Wait for the list to become visible and populated
    const listId = 'sesList';
    await page.waitForFunction((listId) => {
      const listElement = document.querySelector(`#${listId}`);
      if (!listElement) return false;
      
      const checkboxes = listElement.querySelectorAll('input[type="checkbox"]');
      const isExpanded = listElement.style.display !== 'none';
      
      return (checkboxes.length > 0 || isExpanded);
    }, listId, { timeout: 20000 });
    
    // Verify the section is working
    const sesList = page.locator('#sesList');
    expect(await sesList.isVisible()).toBeTruthy();
  });

  test('should handle responsive breakpoints correctly', async ({ page }) => {
    // Test multiple viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verify core elements are always visible
      await expect(page.locator('#map')).toBeVisible();
      await expect(page.locator('#layerMenu')).toBeVisible();
      
      // Check responsive behavior
      if (viewport.width <= 768) {
        // Mobile/tablet should have mobile classes
        await expect(page.locator('body')).toHaveClass(/device-mobile/);
      } else {
        // Desktop should have desktop classes
        await expect(page.locator('body')).toHaveClass(/device-desktop/);
      }
    }
  });
});
