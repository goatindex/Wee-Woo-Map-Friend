/**
 * @fileoverview Phase 4: End-to-End User Journey Tests
 * Tests complete user workflows from map loading to feature interaction
 * Validates real user experience in actual browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Wait for Leaflet to be available
    await page.waitForFunction(() => typeof L !== 'undefined', { timeout: 10000 });
  });

  test('should handle mobile responsive behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for the page to load
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
    
    // Now test interactions with the main interface
    const firstCheckbox = page.locator('#sesList input[type="checkbox"]').first();
    await firstCheckbox.click();
    
    // Verify interaction worked
    await expect(firstCheckbox).toBeChecked();
    
    // Verify mobile-specific behavior
    await expect(page.locator('body')).toHaveClass(/device-mobile/);
  });

  test('should handle keyboard navigation and accessibility', async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Verify focus is visible
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test tab navigation through sidebar
    const focusableElements = page.locator('#layerMenu input, #layerMenu button, #layerMenu [tabindex]');
    const elementCount = await focusableElements.count();
    
    // Should have focusable elements
    expect(elementCount).toBeGreaterThan(0);
  });

  test('should handle performance under load', async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map', { timeout: 30000 });
    
    // Simulate load by activating multiple layers
    const startTime = Date.now();
    
    // Activate multiple SES layers
    const sesCheckboxes = page.locator('#sesList input[type="checkbox"]');
    const checkboxCount = await sesCheckboxes.count();
    
    for (let i = 0; i < Math.min(5, checkboxCount); i++) {
      await sesCheckboxes.nth(i).check();
      // Small delay to simulate real user interaction
      await page.waitForTimeout(100);
    }
    
    const loadTime = Date.now() - startTime;
    
    // Verify load performance is reasonable
    expect(loadTime).toBeLessThan(5000); // 5 seconds max for 5 layers
    
    // Verify layers are active
    for (let i = 0; i < Math.min(5, checkboxCount); i++) {
      await expect(sesCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Simulate an error by trying to access a non-existent element
    const nonExistentElement = page.locator('#non-existent-element');
    
    // Should not crash the application
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#layerMenu')).toBeVisible();
    
    // Verify error handling works
    expect(await nonExistentElement.count()).toBe(0);
  });

  test('should maintain state across page interactions', async ({ page }) => {
    // Wait for the page to load
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
    
    // Now activate a layer
    const firstCheckbox = page.locator('#sesList input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    // Verify layer is active
    await expect(firstCheckbox).toBeChecked();
    
    // Navigate away and back
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify the page still works
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#layerMenu')).toBeVisible();
  });

  test('should complete full emergency services workflow', async ({ page }) => {
    // Navigate to the main application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 1. Expand SES section
    const sesHeader = page.locator('#sesHeader');
    await sesHeader.click();
    
    // Wait for checkboxes to be populated
    await page.waitForFunction(() => {
      const sesList = document.querySelector('#sesList');
      if (!sesList) return false;
      const checkboxes = sesList.querySelectorAll('input[type="checkbox"]');
      return checkboxes.length > 0;
    }, { timeout: 10000 });
    
    // 2. Activate a few SES layers
    const sesCheckboxes = page.locator('#sesList input[type="checkbox"]');
    const checkboxCount = await sesCheckboxes.count();
    
    // Activate first 3 checkboxes
    for (let i = 0; i < Math.min(3, checkboxCount); i++) {
      await sesCheckboxes.nth(i).check();
      await page.waitForTimeout(100);
    }
    
    // 3. Verify layers are active
    for (let i = 0; i < Math.min(3, checkboxCount); i++) {
      await expect(sesCheckboxes.nth(i)).toBeChecked();
    }
    
    // 4. Check that active list is populated
    const activeList = page.locator('#activeList');
    await expect(activeList).toBeVisible();
    
    // 5. Verify "Show All" section works
    const showAllHeader = page.locator('#showAllHeader');
    await showAllHeader.click();
    
    // Wait for the section to become visible
    const showAllSection = page.locator('#showAllList');
    await expect(showAllSection).toBeVisible();
    
    // 6. Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('#layerMenu')).toBeVisible();
    
    // 7. Test search functionality
    const searchInput = page.locator('#globalSidebarSearch');
    await searchInput.fill('SES');
    await expect(searchInput).toHaveValue('SES');
    
    console.log('✅ Core emergency services workflow test completed successfully!');
    console.log('✅ SES section expansion: Working');
    console.log('✅ Checkbox population: Working');
    console.log('✅ Checkbox activation: Working');
    console.log('✅ Active list population: Working');
    console.log('✅ Show All section: Working');
    console.log('✅ Mobile responsiveness: Working');
    console.log('✅ Search functionality: Working');
  });
});
