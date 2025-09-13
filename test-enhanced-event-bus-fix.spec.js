import { test, expect } from '@playwright/test';

test.describe('Enhanced EventBus Scope Fix Validation', () => {
  test('should verify DI container initialization works after enhancedEventBus scope fix', async ({ page }) => {
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
        
        // Check if enhancedEventBus is accessible as class property
        enhancedEventBusAccessible: window.dependencyContainer ? 
          (typeof window.dependencyContainer.enhancedEventBus !== 'undefined') : false,
        
        // Check for any remaining variable reference errors
        hasVariableReferenceErrors: window.consoleErrors ? window.consoleErrors.some(err => 
          err.includes('Can\'t find variable: enhancedEventBus') || 
          err.includes('enhancedEventBus is not defined')
        ) : false,
        
        // Check if global modules are now available (this would indicate Phase 16 ran)
        globalModules: {
          stateManager: typeof window.stateManager,
          globalEventBus: typeof window.globalEventBus,
          utilityManager: typeof window.UtilityManager
        },
        
        // Check bootstrap phase completion
        bootstrapPhases: {
          phase1: window.bootstrapPhase1 ? 'completed' : 'not completed',
          phase15: window.bootstrapPhase15 ? 'completed' : 'not completed', 
          phase2: window.bootstrapPhase2 ? 'completed' : 'not completed',
          phase16: window.bootstrapPhase16 ? 'completed' : 'not completed'
        }
      };
    });

    console.log('Enhanced EventBus Scope Fix Validation Results:', JSON.stringify(containerStatus, null, 2));
    
    // Test assertions - DI container should exist
    expect(containerStatus.dependencyContainerExists).toBe(true);
    
    // Test assertions - enhancedEventBus should be accessible as class property
    expect(containerStatus.enhancedEventBusAccessible).toBe(true);
    
    // Test assertions - no variable reference errors
    expect(containerStatus.hasVariableReferenceErrors).toBe(false);
    
    // Check if container status shows successful initialization
    if (containerStatus.containerStatus) {
      expect(containerStatus.containerStatus.initialized).toBe(true);
      expect(containerStatus.containerStatus.boundServices).toBeGreaterThan(25); // Should have all services now
    }
    
    // Check if global modules are now available (this would indicate Phase 16 ran)
    expect(containerStatus.globalModules.stateManager).not.toBe('undefined');
    expect(containerStatus.globalModules.globalEventBus).not.toBe('undefined');
  });
});


