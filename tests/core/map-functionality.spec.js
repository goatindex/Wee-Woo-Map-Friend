/**
 * @fileoverview Core Workflows Integration Tests
 * Tests the main user workflows and application flows end-to-end
 * 
 * Core Workflows Tested:
 * 1. Application Bootstrap & Initialization
 * 2. Map Integration & Functionality
 * 3. Search & Activation Workflow
 * 4. Active List Management (Emphasize, Labels, Weather)
 * 5. Data Loading & Layer Management
 * 6. Reset & State Management
 * 7. Error Recovery & Resilience
 * 
 * 📚 Documentation:
 * - Testing Framework: project_docs/development/testing-playwright.md
 * - Build Process: project_docs/development/build-automation.md
 * 
 * 🔧 Build Process:
 * Tests automatically run `npm run build:js` before execution to ensure
 * decorators are properly transformed from TypeScript to browser-compatible JavaScript.
 */

import { test, expect } from '@playwright/test';

test.describe('Core Workflows Integration', () => {
  let page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console errors for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });
    
    // Capture network failures
    page.on('response', response => {
      if (!response.ok()) {
        console.warn(`Network Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test.describe('1. Application Bootstrap & Initialization', () => {
    test('should complete full application initialization', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Allow for full initialization

      const initStatus = await page.evaluate(() => {
        return {
          // Core modules
          applicationBootstrap: typeof window.applicationBootstrap !== 'undefined',
          stateManager: typeof window.stateManager !== 'undefined',
          globalEventBus: typeof window.globalEventBus !== 'undefined',
          
          // Map system
          mapManager: typeof window.MapManager !== 'undefined',
          layerManager: typeof window.LayerManager !== 'undefined',
          mapReady: window.stateManager?.get('mapReady') || false,
          
          // UI managers
          activeListManager: typeof window.ActiveListManager !== 'undefined',
          searchManager: typeof window.SearchManager !== 'undefined',
          collapsibleManager: typeof window.CollapsibleManager !== 'undefined',
          
          // Data system
          polygonLoader: typeof window.PolygonLoader !== 'undefined',
          dataOrchestrator: typeof window.DataLoadingOrchestrator !== 'undefined',
          
          // Map instance
          mapExists: typeof window.map !== 'undefined' && window.map !== null,
          
          // Bootstrap state
          bootstrapInitialized: window.applicationBootstrap?.initialized || false
        };
      });

      // Verify core system is initialized
      expect(initStatus.applicationBootstrap).toBe(true);
      expect(initStatus.stateManager).toBe(true);
      expect(initStatus.globalEventBus).toBe(true);
      expect(initStatus.bootstrapInitialized).toBe(true);
      
      // Verify map system
      expect(initStatus.mapManager).toBe(true);
      expect(initStatus.layerManager).toBe(true);
      expect(initStatus.mapExists).toBe(true);
      expect(initStatus.mapReady).toBe(true);
      
      // Verify UI managers
      expect(initStatus.activeListManager).toBe(true);
      expect(initStatus.searchManager).toBe(true);
      expect(initStatus.collapsibleManager).toBe(true);
      
      // Verify data system
      expect(initStatus.polygonLoader).toBe(true);
      expect(initStatus.dataOrchestrator).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock a network failure during initialization
      await page.route('**/geojson/ses.geojson', route => route.abort());
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const errorHandling = await page.evaluate(() => {
        return {
          // App should still be functional despite data loading errors
          appFunctional: typeof window.map !== 'undefined' && window.map !== null,
          stateManagerWorking: typeof window.stateManager !== 'undefined',
          uiManagersWorking: typeof window.ActiveListManager !== 'undefined' && 
                           typeof window.SearchManager !== 'undefined',
          
          // Error should be logged but not crash the app
          consoleErrors: window.consoleErrors || []
        };
      });

      expect(errorHandling.appFunctional).toBe(true);
      expect(errorHandling.stateManagerWorking).toBe(true);
      expect(errorHandling.uiManagersWorking).toBe(true);
    });
  });

  test.describe('2. Map Integration & Functionality', () => {
    test('should initialize map with ES6 modules', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow for map initialization

      const mapStatus = await page.evaluate(() => {
        return {
          mapExists: typeof window.map !== 'undefined' && window.map !== null,
          mapManagerExists: typeof window.MapManager !== 'undefined',
          layerManagerExists: typeof window.LayerManager !== 'undefined',
          stateManagerReady: window.stateManager && window.stateManager.get('mapReady')
        };
      });

      expect(mapStatus.mapExists).toBe(true);
      expect(mapStatus.mapManagerExists).toBe(true);
      expect(mapStatus.layerManagerExists).toBe(true);
      expect(mapStatus.stateManagerReady).toBe(true);
    });

    test('should load map layers through ES6 modules', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const layerStatus = await page.evaluate(() => {
        if (!window.stateManager) return { available: false };
        
        const featureLayers = window.stateManager.get('featureLayers');
        const namesByCategory = window.stateManager.get('namesByCategory');
        
        return {
          available: true,
          hasFeatureLayers: !!featureLayers,
          hasNamesByCategory: !!namesByCategory,
          layerCategories: featureLayers ? Object.keys(featureLayers) : [],
          nameCategories: namesByCategory ? Object.keys(namesByCategory) : []
        };
      });

      expect(layerStatus.available).toBe(true);
      expect(layerStatus.hasFeatureLayers).toBe(true);
      expect(layerStatus.hasNamesByCategory).toBe(true);
      expect(layerStatus.layerCategories).toContain('ses');
      expect(layerStatus.layerCategories).toContain('lga');
      expect(layerStatus.layerCategories).toContain('cfa');
      expect(layerStatus.layerCategories).toContain('ambulance');
    });

    test('should handle map interactions through ES6 modules', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Test that map interactions work
      const interactionStatus = await page.evaluate(() => {
        if (!window.map || !window.stateManager) return { available: false };
        
        try {
          // Test map zoom functionality - just verify methods work
          const initialZoom = window.map.getZoom();
          const maxZoom = window.map.getMaxZoom();
          const minZoom = window.map.getMinZoom();
          
          // Test that zoom methods are available and functional
          const canZoom = typeof window.map.setZoom === 'function' && 
                         typeof window.map.getZoom === 'function' &&
                         typeof window.map.getMaxZoom === 'function' &&
                         typeof window.map.getMinZoom === 'function';
          
          // Test map center
          const center = window.map.getCenter();
          
          return {
            available: true,
            canZoom: canZoom,
            hasCenter: !!center,
            zoom: initialZoom,
            maxZoom: maxZoom,
            minZoom: minZoom,
            center: center ? { lat: center.lat, lng: center.lng } : null
          };
        } catch (error) {
          return {
            available: true,
            error: error.message
          };
        }
      });

      expect(interactionStatus.available).toBe(true);
      expect(interactionStatus.canZoom).toBe(true);
      expect(interactionStatus.hasCenter).toBe(true);
    });
  });

  test.describe('3. Search & Activation Workflow', () => {
    test('should complete search-to-activation workflow', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      // Test search functionality
      const searchWorkflow = await page.evaluate(async () => {
        try {
          // Find search input
          const searchInput = document.querySelector('#searchInput');
          if (!searchInput) return { success: false, error: 'Search input not found' };

          // Perform search
          searchInput.value = 'Melbourne';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Wait for search results
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if results appeared
          const resultsContainer = document.querySelector('.search-results');
          const hasResults = resultsContainer && resultsContainer.children.length > 0;
          
          if (!hasResults) {
            return { success: false, error: 'No search results found' };
          }

          // Click on first result
          const firstResult = resultsContainer.children[0];
          const category = firstResult.getAttribute('data-cat');
          const key = firstResult.getAttribute('data-key');
          
          firstResult.click();
          
          // Wait for activation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if item was activated
          const targetCheckbox = document.getElementById(`${category}_${key}`);
          const isActivated = targetCheckbox && targetCheckbox.checked;
          
          // Check if item appears in active list
          const activeList = document.querySelector('#activeList');
          const inActiveList = activeList && activeList.textContent.includes(key);
          
          return {
            success: true,
            hasResults,
            isActivated,
            inActiveList,
            category,
            key
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(searchWorkflow.success).toBe(true);
      expect(searchWorkflow.hasResults).toBe(true);
      expect(searchWorkflow.isActivated).toBe(true);
      expect(searchWorkflow.inActiveList).toBe(true);
    });

    test('should handle search with no results gracefully', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const noResultsHandling = await page.evaluate(async () => {
        try {
          const searchInput = document.querySelector('#searchInput');
          if (!searchInput) return { success: false, error: 'Search input not found' };

          // Search for something that won't exist
          searchInput.value = 'nonexistentlocation12345';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const resultsContainer = document.querySelector('.search-results');
          const hasNoResults = !resultsContainer || resultsContainer.children.length === 0;
          
          return {
            success: true,
            hasNoResults,
            searchInputValue: searchInput.value
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(noResultsHandling.success).toBe(true);
      expect(noResultsHandling.hasNoResults).toBe(true);
    });
  });

  test.describe('4. Active List Management Workflow', () => {
    test('should complete emphasize workflow', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const emphasizeWorkflow = await page.evaluate(async () => {
        try {
          // First, activate an item
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (!sesCheckbox) return { success: false, error: 'No SES items found' };
          
          sesCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if item appears in active list
          const activeList = document.querySelector('#activeList');
          if (!activeList) return { success: false, error: 'Active list not found' };
          
          const activeItem = activeList.querySelector('.active-item');
          if (!activeItem) return { success: false, error: 'No active items found' };
          
          // Find emphasize checkbox
          const emphasizeCheckbox = activeItem.querySelector('input[type="checkbox"][data-action="emphasise"]');
          if (!emphasizeCheckbox) return { success: false, error: 'Emphasize checkbox not found' };
          
          // Toggle emphasize
          emphasizeCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const isEmphasized = emphasizeCheckbox.checked;
          
          return {
            success: true,
            itemActivated: sesCheckbox.checked,
            inActiveList: !!activeItem,
            emphasizeCheckboxFound: !!emphasizeCheckbox,
            isEmphasized
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(emphasizeWorkflow.success).toBe(true);
      expect(emphasizeWorkflow.itemActivated).toBe(true);
      expect(emphasizeWorkflow.inActiveList).toBe(true);
      expect(emphasizeWorkflow.emphasizeCheckboxFound).toBe(true);
      expect(emphasizeWorkflow.isEmphasized).toBe(true);
    });

    test('should complete labels workflow', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const labelsWorkflow = await page.evaluate(async () => {
        try {
          // Activate an item
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (!sesCheckbox) return { success: false, error: 'No SES items found' };
          
          sesCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find active item
          const activeList = document.querySelector('#activeList');
          const activeItem = activeList?.querySelector('.active-item');
          if (!activeItem) return { success: false, error: 'No active items found' };
          
          // Find labels checkbox
          const labelsCheckbox = activeItem.querySelector('input[type="checkbox"][data-action="labels"]');
          if (!labelsCheckbox) return { success: false, error: 'Labels checkbox not found' };
          
          // Toggle labels
          labelsCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const labelsEnabled = labelsCheckbox.checked;
          
          return {
            success: true,
            itemActivated: sesCheckbox.checked,
            inActiveList: !!activeItem,
            labelsCheckboxFound: !!labelsCheckbox,
            labelsEnabled
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(labelsWorkflow.success).toBe(true);
      expect(labelsWorkflow.itemActivated).toBe(true);
      expect(labelsWorkflow.inActiveList).toBe(true);
      expect(labelsWorkflow.labelsCheckboxFound).toBe(true);
      expect(labelsWorkflow.labelsEnabled).toBe(true);
    });

    test('should complete weather workflow', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const weatherWorkflow = await page.evaluate(async () => {
        try {
          // Activate an item
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (!sesCheckbox) return { success: false, error: 'No SES items found' };
          
          sesCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find active item
          const activeList = document.querySelector('#activeList');
          const activeItem = activeList?.querySelector('.active-item');
          if (!activeItem) return { success: false, error: 'No active items found' };
          
          // Find weather checkbox
          const weatherCheckbox = activeItem.querySelector('input[type="checkbox"][data-action="weather"]');
          if (!weatherCheckbox) return { success: false, error: 'Weather checkbox not found' };
          
          // Toggle weather
          weatherCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for weather API call
          
          const weatherEnabled = weatherCheckbox.checked;
          
          // Check if weather box appeared
          const weatherBox = document.querySelector('#weatherBox');
          const weatherBoxVisible = weatherBox && !weatherBox.classList.contains('hidden');
          
          return {
            success: true,
            itemActivated: sesCheckbox.checked,
            inActiveList: !!activeItem,
            weatherCheckboxFound: !!weatherCheckbox,
            weatherEnabled,
            weatherBoxVisible
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(weatherWorkflow.success).toBe(true);
      expect(weatherWorkflow.itemActivated).toBe(true);
      expect(weatherWorkflow.inActiveList).toBe(true);
      expect(weatherWorkflow.weatherCheckboxFound).toBe(true);
      expect(weatherWorkflow.weatherEnabled).toBe(true);
      // Weather box visibility depends on API availability, so we don't assert it
    });
  });

  test.describe('5. Data Loading & Layer Management', () => {
    test('should load initial data categories', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(8000); // Allow for data loading

      const dataLoadingStatus = await page.evaluate(() => {
        return {
          // Check if data orchestrator is working
          orchestratorExists: typeof window.DataLoadingOrchestrator !== 'undefined',
          
          // Check loaded categories
          sesLoaded: document.querySelector('input[id^="ses_"]') !== null,
          lgaLoaded: document.querySelector('input[id^="lga_"]') !== null,
          cfaLoaded: document.querySelector('input[id^="cfa_"]') !== null,
          
          // Check if map has layers
          mapHasLayers: window.map && typeof window.map.eachLayer === 'function',
          
          // Check state manager
          stateManagerWorking: window.stateManager && typeof window.stateManager.get === 'function'
        };
      });

      expect(dataLoadingStatus.orchestratorExists).toBe(true);
      expect(dataLoadingStatus.sesLoaded).toBe(true);
      expect(dataLoadingStatus.lgaLoaded).toBe(true);
      expect(dataLoadingStatus.cfaLoaded).toBe(true);
      expect(dataLoadingStatus.mapHasLayers).toBe(true);
      expect(dataLoadingStatus.stateManagerWorking).toBe(true);
    });

    test('should handle layer visibility toggles', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const layerToggleWorkflow = await page.evaluate(async () => {
        try {
          // Find a category checkbox
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (!sesCheckbox) return { success: false, error: 'No SES items found' };
          
          const initialChecked = sesCheckbox.checked;
          
          // Toggle the checkbox
          sesCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const afterToggleChecked = sesCheckbox.checked;
          const toggled = initialChecked !== afterToggleChecked;
          
          return {
            success: true,
            initialChecked,
            afterToggleChecked,
            toggled
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(layerToggleWorkflow.success).toBe(true);
      expect(layerToggleWorkflow.toggled).toBe(true);
    });
  });

  test.describe('6. Reset & State Management', () => {
    test('should complete reset workflow', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const resetWorkflow = await page.evaluate(async () => {
        try {
          // First, activate some items and make changes
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (sesCheckbox) {
            sesCheckbox.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const lgaCheckbox = document.querySelector('input[id^="lga_"]');
          if (lgaCheckbox) {
            lgaCheckbox.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Check initial state
          const initialActiveItems = document.querySelectorAll('#activeList .active-item').length;
          const initialSearchValue = document.querySelector('#searchInput')?.value || '';
          
          // Find and click reset button
          const resetButton = document.querySelector('button[title*="Reset"], button[aria-label*="Reset"], .reset-button');
          if (!resetButton) return { success: false, error: 'Reset button not found' };
          
          resetButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check reset state
          const afterResetActiveItems = document.querySelectorAll('#activeList .active-item').length;
          const afterResetSearchValue = document.querySelector('#searchInput')?.value || '';
          
          return {
            success: true,
            initialActiveItems,
            afterResetActiveItems,
            initialSearchValue,
            afterResetSearchValue,
            resetButtonFound: !!resetButton
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(resetWorkflow.success).toBe(true);
      expect(resetWorkflow.resetButtonFound).toBe(true);
      expect(resetWorkflow.afterResetActiveItems).toBe(0);
      expect(resetWorkflow.afterResetSearchValue).toBe('');
    });
  });

  test.describe('7. Error Recovery & Resilience', () => {
    test('should handle network failures gracefully', async () => {
      // Block some non-critical requests
      await page.route('**/geojson/frv.geojson', route => route.abort());
      await page.route('**/geojson/police.geojson', route => route.abort());
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const resilienceTest = await page.evaluate(() => {
        return {
          // App should still be functional
          mapWorking: window.map && typeof window.map.getCenter === 'function',
          stateManagerWorking: window.stateManager && typeof window.stateManager.get === 'function',
          uiWorking: document.querySelector('#sidebar') !== null,
          
          // Core data should still be available
          sesAvailable: document.querySelector('input[id^="ses_"]') !== null,
          lgaAvailable: document.querySelector('input[id^="lga_"]') !== null,
          
          // Search should work
          searchWorking: document.querySelector('#searchInput') !== null
        };
      });

      expect(resilienceTest.mapWorking).toBe(true);
      expect(resilienceTest.stateManagerWorking).toBe(true);
      expect(resilienceTest.uiWorking).toBe(true);
      expect(resilienceTest.sesAvailable).toBe(true);
      expect(resilienceTest.lgaAvailable).toBe(true);
      expect(resilienceTest.searchWorking).toBe(true);
    });

    test('should maintain state consistency during errors', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const stateConsistencyTest = await page.evaluate(async () => {
        try {
          // Activate an item
          const sesCheckbox = document.querySelector('input[id^="ses_"]');
          if (!sesCheckbox) return { success: false, error: 'No SES items found' };
          
          sesCheckbox.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check state manager consistency
          const stateManager = window.stateManager;
          const activeFeatures = stateManager.get('activeFeatures') || {};
          const sesActive = Object.keys(activeFeatures.ses || {}).length > 0;
          
          // Check UI consistency
          const activeListItems = document.querySelectorAll('#activeList .active-item').length;
          const checkboxChecked = sesCheckbox.checked;
          
          return {
            success: true,
            stateManagerConsistent: sesActive,
            uiConsistent: activeListItems > 0 && checkboxChecked,
            activeListItems,
            checkboxChecked
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      expect(stateConsistencyTest.success).toBe(true);
      expect(stateConsistencyTest.stateManagerConsistent).toBe(true);
      expect(stateConsistencyTest.uiConsistent).toBe(true);
    });
  });
});
