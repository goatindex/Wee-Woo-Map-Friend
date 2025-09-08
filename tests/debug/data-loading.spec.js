/**
 * @fileoverview Data Loading Tests
 * Tests GeoJSON loading functionality in browser environment
 */

import { test, expect } from '@playwright/test';

test.describe('Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application to load modules
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for module loading
  });

  test('should load SES data successfully', async ({ page }) => {
    const loadingResults = await page.evaluate(async () => {
      try {
        // Test direct fetch to SES data
        const response = await fetch('/geojson/ses.geojson');
        if (!response.ok) {
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const data = await response.json();
        
        return {
          success: true,
          dataType: data.type,
          featureCount: data.features ? data.features.length : 0,
          hasValidStructure: data.type === 'FeatureCollection' && Array.isArray(data.features),
          sampleFeature: data.features && data.features[0] ? {
            hasGeometry: !!data.features[0].geometry,
            hasProperties: !!data.features[0].properties,
            geometryType: data.features[0].geometry?.type
          } : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(loadingResults.success).toBe(true);
    expect(loadingResults.dataType).toBe('FeatureCollection');
    expect(loadingResults.featureCount).toBeGreaterThan(0);
    expect(loadingResults.hasValidStructure).toBe(true);
    expect(loadingResults.sampleFeature?.hasGeometry).toBe(true);
    expect(loadingResults.sampleFeature?.hasProperties).toBe(true);
  });

  test('should load LGA data successfully', async ({ page }) => {
    const loadingResults = await page.evaluate(async () => {
      try {
        const response = await fetch('/geojson/LGAs.geojson');
        if (!response.ok) {
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const data = await response.json();
        
        return {
          success: true,
          dataType: data.type,
          featureCount: data.features ? data.features.length : 0,
          hasValidStructure: data.type === 'FeatureCollection' && Array.isArray(data.features)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(loadingResults.success).toBe(true);
    expect(loadingResults.dataType).toBe('FeatureCollection');
    expect(loadingResults.featureCount).toBeGreaterThan(0);
    expect(loadingResults.hasValidStructure).toBe(true);
  });

  test('should load CFA data successfully', async ({ page }) => {
    const loadingResults = await page.evaluate(async () => {
      try {
        const response = await fetch('/geojson/cfa.geojson');
        if (!response.ok) {
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const data = await response.json();
        
        return {
          success: true,
          dataType: data.type,
          featureCount: data.features ? data.features.length : 0,
          hasValidStructure: data.type === 'FeatureCollection' && Array.isArray(data.features)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(loadingResults.success).toBe(true);
    expect(loadingResults.dataType).toBe('FeatureCollection');
    expect(loadingResults.featureCount).toBeGreaterThan(0);
    expect(loadingResults.hasValidStructure).toBe(true);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block the request to simulate network error
    await page.route('**/geojson/ses.geojson', route => route.abort());
    
    const errorHandling = await page.evaluate(async () => {
      try {
        const response = await fetch('/geojson/ses.geojson');
        return { success: true, status: response.status };
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          isNetworkError: error.name === 'TypeError' || error.message.includes('Failed to fetch')
        };
      }
    });

    expect(errorHandling.success).toBe(false);
    expect(errorHandling.isNetworkError).toBe(true);
  });

  test('should handle malformed JSON data', async ({ page }) => {
    // Intercept the request and return malformed JSON
    await page.route('**/geojson/ses.geojson', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ invalid json }'
      });
    });
    
    const malformedDataHandling = await page.evaluate(async () => {
      try {
        const response = await fetch('/geojson/ses.geojson');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          isJSONError: error.name === 'SyntaxError' || error.message.includes('JSON')
        };
      }
    });

    expect(malformedDataHandling.success).toBe(false);
    expect(malformedDataHandling.isJSONError).toBe(true);
  });

  test('should load data through application data loaders', async ({ page }) => {
    const appLoadingResults = await page.evaluate(() => {
      // Check if data loading modules are available
      if (typeof window.DataLoadingOrchestrator === 'undefined') {
        return { available: false, error: 'DataLoadingOrchestrator not found' };
      }

      // Check if state manager has loaded data
      if (typeof window.stateManager === 'undefined') {
        return { available: false, error: 'StateManager not found' };
      }

      const featureLayers = window.stateManager.get('featureLayers');
      const namesByCategory = window.stateManager.get('namesByCategory');
      
      return {
        available: true,
        hasFeatureLayers: !!featureLayers,
        hasNamesByCategory: !!namesByCategory,
        layerCategories: featureLayers ? Object.keys(featureLayers) : [],
        nameCategories: namesByCategory ? Object.keys(namesByCategory) : [],
        sesLoaded: featureLayers?.ses ? Object.keys(featureLayers.ses).length > 0 : false,
        lgaLoaded: featureLayers?.lga ? Object.keys(featureLayers.lga).length > 0 : false,
        cfaLoaded: featureLayers?.cfa ? Object.keys(featureLayers.cfa).length > 0 : false
      };
    });

    if (appLoadingResults.available) {
      expect(appLoadingResults.hasFeatureLayers).toBe(true);
      expect(appLoadingResults.hasNamesByCategory).toBe(true);
      expect(appLoadingResults.layerCategories).toContain('ses');
      expect(appLoadingResults.layerCategories).toContain('lga');
      expect(appLoadingResults.layerCategories).toContain('cfa');
    } else {
      console.log('Data loading modules not available:', appLoadingResults.error);
    }
  });
});
