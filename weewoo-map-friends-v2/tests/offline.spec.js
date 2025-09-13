import { test, expect } from '@playwright/test';

test.describe('Offline Functionality', () => {
  test('Map works offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Simulate offline
    await context.setOffline(true);
    
    // Verify map still works
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Test map interactions
    const zoomIn = page.locator('[data-testid="zoom-in"]');
    await zoomIn.click();
    
    // Test layer controls
    const layerControls = page.locator('[data-testid="layer-control"]');
    if (await layerControls.count() > 0) {
      await layerControls.first().click();
    }
  });
  
  test('Cached data is available offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Refresh page
    await page.reload();
    
    // Verify cached data is still available
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Check if emergency boundaries are still visible
    const boundaries = await page.locator('[data-testid="emergency-boundary"]').count();
    expect(boundaries).toBeGreaterThan(0);
  });
  
  test('PWA service worker is active', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    
    expect(swRegistration).toBeTruthy();
  });
  
  test('Offline indicator shows when offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Check for offline indicator
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    await expect(offlineIndicator).toBeVisible();
  });
  
  test('Map tiles are cached', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Wait for tiles to load
    await page.waitForTimeout(3000);
    
    // Go offline
    await context.setOffline(true);
    
    // Pan the map to test cached tiles
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(500, 400);
    await page.mouse.up();
    
    // Verify map still renders
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });
  
  test('Search works with cached data', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Test search with cached data
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Melbourne');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Verify search results are shown
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
  });
});

