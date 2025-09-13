import { test, expect } from '@playwright/test';

test.describe('Critical Path - Emergency Services', () => {
  test('Map loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('Emergency boundaries are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check for emergency service boundaries
    const boundaries = await page.locator('[data-testid="emergency-boundary"]').count();
    expect(boundaries).toBeGreaterThan(0);
  });
  
  test('Map controls are functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Test zoom controls
    const zoomIn = page.locator('[data-testid="zoom-in"]');
    const zoomOut = page.locator('[data-testid="zoom-out"]');
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
    
    // Test zoom functionality
    await zoomIn.click();
    await zoomOut.click();
  });
  
  test('Sidebar is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check sidebar toggle
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    await expect(sidebarToggle).toBeVisible();
    
    // Test sidebar toggle
    await sidebarToggle.click();
    
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
  });
  
  test('Layer controls work', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check layer controls
    const layerControls = page.locator('[data-testid="layer-control"]');
    const layerCount = await layerControls.count();
    
    expect(layerCount).toBeGreaterThan(0);
    
    // Test layer toggle
    if (layerCount > 0) {
      await layerControls.first().click();
    }
  });
  
  test('Search functionality works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check search input
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Test search
    await searchInput.fill('Melbourne');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
  });
  
  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Check mobile-specific elements
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
  });
});

