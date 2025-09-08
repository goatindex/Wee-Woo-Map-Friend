/**
 * @fileoverview UI Components Tests
 * Tests component interactions and event system in browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application to load modules
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for module loading
  });

  test('should initialize UI components correctly', async ({ page }) => {
    const uiInitialization = await page.evaluate(() => {
      // Check if UI managers are available
      const managers = {
        uiManager: typeof window.UIManager !== 'undefined',
        collapsibleManager: typeof window.CollapsibleManager !== 'undefined',
        searchManager: typeof window.SearchManager !== 'undefined',
        activeListManager: typeof window.ActiveListManager !== 'undefined'
      };

      // Check if DOM elements exist
      const elements = {
        sidebar: !!document.querySelector('#sidebar'),
        map: !!document.querySelector('#map'),
        searchInput: !!document.querySelector('#searchInput'),
        sesList: !!document.querySelector('#sesList'),
        activeList: !!document.querySelector('#activeList')
      };

      return {
        managers,
        elements,
        allManagersAvailable: Object.values(managers).every(Boolean),
        allElementsPresent: Object.values(elements).every(Boolean)
      };
    });

    expect(uiInitialization.allManagersAvailable).toBe(true);
    expect(uiInitialization.allElementsPresent).toBe(true);
  });

  test('should handle collapsible sections', async ({ page }) => {
    const collapsibleFunctionality = await page.evaluate(() => {
      const sesHeader = document.querySelector('#sesHeader');
      const sesList = document.querySelector('#sesList');
      
      if (!sesHeader || !sesList) {
        return { available: false, error: 'Required elements not found' };
      }

      // Test initial state
      const initialState = {
        headerExists: !!sesHeader,
        listExists: !!sesList,
        listVisible: sesList.style.display !== 'none'
      };

      // Simulate click on header
      sesHeader.click();
      
      // Check state after click
      const afterClickState = {
        listVisible: sesList.style.display !== 'none'
      };

      return {
        available: true,
        initialState,
        afterClickState,
        toggleWorked: initialState.listVisible !== afterClickState.listVisible
      };
    });

    expect(collapsibleFunctionality.available).toBe(true);
    expect(collapsibleFunctionality.toggleWorked).toBe(true);
  });

  test('should handle search functionality', async ({ page }) => {
    const searchFunctionality = await page.evaluate(() => {
      const searchInput = document.querySelector('#searchInput');
      
      if (!searchInput) {
        return { available: false, error: 'Search input not found' };
      }

      // Test setting search value
      const testValue = 'test search';
      searchInput.value = testValue;
      searchInput.dispatchEvent(new Event('input'));
      
      return {
        available: true,
        inputExists: !!searchInput,
        canSetValue: searchInput.value === testValue,
        inputType: searchInput.type,
        placeholder: searchInput.placeholder
      };
    });

    expect(searchFunctionality.available).toBe(true);
    expect(searchFunctionality.inputExists).toBe(true);
    expect(searchFunctionality.canSetValue).toBe(true);
    expect(searchFunctionality.inputType).toBe('text');
  });

  test('should handle checkbox interactions', async ({ page }) => {
    const checkboxFunctionality = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('#sesList input[type="checkbox"]');
      
      if (checkboxes.length === 0) {
        return { available: false, error: 'No checkboxes found' };
      }

      const firstCheckbox = checkboxes[0];
      const initialChecked = firstCheckbox.checked;
      
      // Toggle checkbox
      firstCheckbox.click();
      const afterToggleChecked = firstCheckbox.checked;
      
      return {
        available: true,
        checkboxCount: checkboxes.length,
        canToggle: initialChecked !== afterToggleChecked,
        firstCheckboxId: firstCheckbox.id,
        firstCheckboxName: firstCheckbox.name
      };
    });

    expect(checkboxFunctionality.available).toBe(true);
    expect(checkboxFunctionality.checkboxCount).toBeGreaterThan(0);
    expect(checkboxFunctionality.canToggle).toBe(true);
  });

  test('should handle event system', async ({ page }) => {
    const eventSystem = await page.evaluate(() => {
      // Check if event bus is available
      if (typeof window.globalEventBus === 'undefined') {
        return { available: false, error: 'EventBus not found' };
      }

      let eventReceived = false;
      let eventData = null;

      // Set up event listener
      window.globalEventBus.on('test-event', (data) => {
        eventReceived = true;
        eventData = data;
      });

      // Emit test event
      window.globalEventBus.emit('test-event', { test: 'data' });

      return {
        available: true,
        eventBusExists: !!window.globalEventBus,
        canEmitEvents: true,
        eventReceived,
        eventData
      };
    });

    expect(eventSystem.available).toBe(true);
    expect(eventSystem.eventBusExists).toBe(true);
    expect(eventSystem.eventReceived).toBe(true);
    expect(eventSystem.eventData).toEqual({ test: 'data' });
  });

  test('should handle component lifecycle', async ({ page }) => {
    const componentLifecycle = await page.evaluate(() => {
      // Check if component base classes are available
      const componentClasses = {
        ComponentBase: typeof window.ComponentBase !== 'undefined',
        EnhancedComponentBase: typeof window.EnhancedComponentBase !== 'undefined'
      };

      // Test component creation
      let componentCreated = false;
      let componentDestroyed = false;

      try {
        if (window.ComponentBase) {
          const testComponent = new window.ComponentBase({
            element: document.createElement('div'),
            logger: console
          });
          
          componentCreated = true;
          
          // Test component methods
          const hasInit = typeof testComponent.init === 'function';
          const hasDestroy = typeof testComponent.destroy === 'function';
          
          if (hasDestroy) {
            testComponent.destroy();
            componentDestroyed = true;
          }
        }
      } catch (error) {
        return {
          available: false,
          error: error.message,
          componentClasses
        };
      }

      return {
        available: true,
        componentClasses,
        componentCreated,
        componentDestroyed,
        allClassesAvailable: Object.values(componentClasses).every(Boolean)
      };
    });

    expect(componentLifecycle.available).toBe(true);
    if (componentLifecycle.componentClasses.ComponentBase) {
      expect(componentLifecycle.componentCreated).toBe(true);
    }
  });

  test('should handle responsive behavior', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileBehavior = await page.evaluate(() => {
      const sidebar = document.querySelector('#sidebar');
      const map = document.querySelector('#map');
      
      return {
        sidebarExists: !!sidebar,
        mapExists: !!map,
        sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
        mapVisible: map ? window.getComputedStyle(map).display !== 'none' : false
      };
    });

    expect(mobileBehavior.sidebarExists).toBe(true);
    expect(mobileBehavior.mapExists).toBe(true);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const desktopBehavior = await page.evaluate(() => {
      const sidebar = document.querySelector('#sidebar');
      const map = document.querySelector('#map');
      
      return {
        sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
        mapVisible: map ? window.getComputedStyle(map).display !== 'none' : false
      };
    });

    expect(desktopBehavior.sidebarVisible).toBe(true);
    expect(desktopBehavior.mapVisible).toBe(true);
  });
});
