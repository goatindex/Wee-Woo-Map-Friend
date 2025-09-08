/**
 * @fileoverview Sidebar Integration Tests
 * Tests ES6 module integration with sidebar functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Sidebar Integration with ES6 Modules', () => {
  test('should initialize sidebar with ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const sidebarStatus = await page.evaluate(() => {
      return {
        sidebarExists: !!document.querySelector('#sidebar'),
        uiManagerExists: typeof window.UIManager !== 'undefined',
        collapsibleManagerExists: typeof window.CollapsibleManager !== 'undefined',
        searchManagerExists: typeof window.SearchManager !== 'undefined',
        activeListManagerExists: typeof window.ActiveListManager !== 'undefined'
      };
    });

    expect(sidebarStatus.sidebarExists).toBe(true);
    expect(sidebarStatus.uiManagerExists).toBe(true);
    expect(sidebarStatus.collapsibleManagerExists).toBe(true);
    expect(sidebarStatus.searchManagerExists).toBe(true);
    expect(sidebarStatus.activeListManagerExists).toBe(true);
  });

  test('should handle collapsible sections through ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test collapsible functionality
    const collapsibleStatus = await page.evaluate(() => {
      const sesHeader = document.querySelector('#sesHeader');
      const sesList = document.querySelector('#sesList');
      
      if (!sesHeader || !sesList) return { available: false };
      
      const initialDisplay = sesList.style.display;
      
      // Click to toggle
      sesHeader.click();
      
      const afterClickDisplay = sesList.style.display;
      
      return {
        available: true,
        hasHeader: !!sesHeader,
        hasList: !!sesList,
        canToggle: initialDisplay !== afterClickDisplay,
        initialDisplay: initialDisplay,
        afterClickDisplay: afterClickDisplay
      };
    });

    expect(collapsibleStatus.available).toBe(true);
    expect(collapsibleStatus.hasHeader).toBe(true);
    expect(collapsibleStatus.hasList).toBe(true);
    expect(collapsibleStatus.canToggle).toBe(true);
  });

  test('should handle search functionality through ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const searchStatus = await page.evaluate(() => {
      const searchInput = document.querySelector('#searchInput');
      
      if (!searchInput) return { available: false };
      
      try {
        // Test search input
        searchInput.value = 'test search';
        searchInput.dispatchEvent(new Event('input'));
        
        return {
          available: true,
          hasSearchInput: !!searchInput,
          canSetValue: searchInput.value === 'test search',
          searchManagerWorking: typeof window.SearchManager !== 'undefined'
        };
      } catch (error) {
        return {
          available: true,
          error: error.message
        };
      }
    });

    expect(searchStatus.available).toBe(true);
    expect(searchStatus.hasSearchInput).toBe(true);
    expect(searchStatus.canSetValue).toBe(true);
    expect(searchStatus.searchManagerWorking).toBe(true);
  });

  test('should handle active list through ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const activeListStatus = await page.evaluate(() => {
      const activeList = document.querySelector('#activeList');
      
      if (!activeList) return { available: false };
      
      return {
        available: true,
        hasActiveList: !!activeList,
        activeListManagerWorking: typeof window.ActiveListManager !== 'undefined',
        stateManagerHasActiveList: window.stateManager && window.stateManager.get('activeListFilter') !== undefined
      };
    });

    expect(activeListStatus.available).toBe(true);
    expect(activeListStatus.hasActiveList).toBe(true);
    expect(activeListStatus.activeListManagerWorking).toBe(true);
    expect(activeListStatus.stateManagerHasActiveList).toBe(true);
  });

  test('should handle checkbox interactions through ES6 modules', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // First expand a section to make checkboxes visible
    await page.click('#sesHeader');
    await page.waitForTimeout(1000);

    const checkboxStatus = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('#sesList input[type="checkbox"]');
      
      if (checkboxes.length === 0) return { available: false };
      
      const firstCheckbox = checkboxes[0];
      const initialChecked = firstCheckbox.checked;
      
      // Toggle checkbox
      firstCheckbox.click();
      const afterClickChecked = firstCheckbox.checked;
      
      return {
        available: true,
        hasCheckboxes: checkboxes.length > 0,
        canToggle: initialChecked !== afterClickChecked,
        checkboxCount: checkboxes.length
      };
    });

    expect(checkboxStatus.available).toBe(true);
    expect(checkboxStatus.hasCheckboxes).toBe(true);
    expect(checkboxStatus.canToggle).toBe(true);
    expect(checkboxStatus.checkboxCount).toBeGreaterThan(0);
  });
});


