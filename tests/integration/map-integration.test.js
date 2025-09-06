/**
 * @fileoverview Map Integration Tests
 * Tests ES6 module integration with map functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Map Integration with ES6 Modules', () => {
  test('should initialize map with ES6 modules', async ({ page }) => {
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

  test('should load map layers through ES6 modules', async ({ page }) => {
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

  test('should handle map interactions through ES6 modules', async ({ page }) => {
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
