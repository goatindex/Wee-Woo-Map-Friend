import { test, expect } from '@playwright/test';

test.describe('DI Container Debug Analysis', () => {
  test('should debug DI container initialization failure', async ({ page }) => {
    // Enable console logging
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
    await page.waitForTimeout(3000);
    
    // Check what's happening with the DI container
    const containerStatus = await page.evaluate(() => {
      return {
        // Check if dependencyContainer exists
        dependencyContainerExists: typeof window.dependencyContainer !== 'undefined',
        
        // Check container status
        containerStatus: window.dependencyContainer ? window.dependencyContainer.getStatus() : null,
        
        // Check what services are bound
        availableServices: window.dependencyContainer ? window.dependencyContainer.getAvailableServices() : null,
        
        // Check specific service bindings
        unifiedErrorHandlerBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('UnifiedErrorHandler') : false,
        platformServiceBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('PlatformService') : false,
        mobileComponentAdapterBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('MobileComponentAdapter') : false,
        mobileUIOptimizerBound: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('MobileUIOptimizer') : false,
        
        // Check for any errors
        consoleErrors: window.consoleErrors || []
      };
    });

    console.log('DI Container Debug Analysis:', JSON.stringify(containerStatus, null, 2));
    
    // The test will pass regardless, we just want to see the status
    expect(containerStatus).toBeDefined();
  });
});


