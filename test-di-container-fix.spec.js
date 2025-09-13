import { test, expect } from '@playwright/test';

test.describe('DI Container Fix Validation', () => {
  test('should verify DI container initialization works after MobileComponentAdapter binding fix', async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });

    // Navigate to the page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for bootstrap to complete
    await page.waitForTimeout(5000);
    
    // Check DI container status
    const containerStatus = await page.evaluate(() => {
      return {
        // Check if dependencyContainer exists
        dependencyContainerExists: typeof window.dependencyContainer !== 'undefined',
        
        // Check container status if it exists
        containerStatus: window.dependencyContainer ? window.dependencyContainer.getStatus() : null,
        
        // Check what services are bound
        availableServices: window.dependencyContainer ? window.dependencyContainer.getAvailableServices() : null,
        
        // Check specific service bindings
        unifiedErrorHandlerBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('UnifiedErrorHandler') : false,
        eventBusBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('EventBus') : false,
        baseServiceBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('BaseService') : false,
        platformServiceBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('PlatformService') : false,
        mobileComponentAdapterBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('MobileComponentAdapter') : false,
        
        // Check for any remaining MobileComponentAdapter errors
        hasMobileComponentAdapterErrors: window.consoleErrors ? window.consoleErrors.some(err => 
          err.includes('MobileComponentAdapter') || err.includes('No matching bindings found') || err.includes('Service not bound in container')
        ) : false,
        
        // Check if global modules are now available
        globalModules: {
          stateManager: typeof window.stateManager,
          globalEventBus: typeof window.globalEventBus,
          utilityManager: typeof window.UtilityManager
        }
      };
    });

    console.log('DI Container Fix Validation Results:', JSON.stringify(containerStatus, null, 2));
    
    // Test assertions
    expect(containerStatus.dependencyContainerExists).toBe(true);
    expect(containerStatus.unifiedErrorHandlerBound).toBe(true);
    expect(containerStatus.eventBusBound).toBe(true);
    expect(containerStatus.platformServiceBound).toBe(true);
    expect(containerStatus.mobileComponentAdapterBound).toBe(true);
    expect(containerStatus.hasMobileComponentAdapterErrors).toBe(false);
    
    // Check if container status shows successful initialization
    if (containerStatus.containerStatus) {
      expect(containerStatus.containerStatus.initialized).toBe(true);
      expect(containerStatus.containerStatus.boundServices).toBeGreaterThan(10); // Should have all essential services
    }
    
    // Check if global modules are now available (this would indicate Phase 16 ran)
    expect(containerStatus.globalModules.stateManager).not.toBe('undefined');
    expect(containerStatus.globalModules.globalEventBus).not.toBe('undefined');
  });
});