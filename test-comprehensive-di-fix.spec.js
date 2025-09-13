import { test, expect } from '@playwright/test';

test.describe('Comprehensive DI Container Fix Validation', () => {
  test('should verify all services are bound correctly after comprehensive fix', async ({ page }) => {
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
        
        // Check specific service bindings - all services that should be bound
        coreServices: {
          logger: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('Logger') : false,
          eventBus: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('EventBus') : false,
          errorBoundary: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ErrorBoundary') : false,
          unifiedErrorHandler: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('UnifiedErrorHandler') : false,
        },
        
        configServices: {
          configService: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ConfigService') : false,
          environmentService: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('EnvironmentService') : false,
        },
        
        dataServices: {
          dataValidator: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('DataValidator') : false,
          progressiveDataLoader: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ProgressiveDataLoader') : false,
        },
        
        componentServices: {
          componentCommunication: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ComponentCommunication') : false,
          componentLifecycleManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ComponentLifecycleManager') : false,
          componentErrorBoundary: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ComponentErrorBoundary') : false,
          componentMemoryManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ComponentMemoryManager') : false,
          ariaService: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ARIAService') : false,
        },
        
        mapServices: {
          refactoredMapManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('RefactoredMapManager') : false,
          refactoredSidebarManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('RefactoredSidebarManager') : false,
          refactoredSearchManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('RefactoredSearchManager') : false,
        },
        
        platformServices: {
          platformService: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('PlatformService') : false,
          mobileComponentAdapter: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('MobileComponentAdapter') : false,
          mobileUIOptimizer: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('MobileUIOptimizer') : false,
        },
        
        errorHandlingServices: {
          circuitBreakerStrategy: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('CircuitBreakerStrategy') : false,
          retryStrategy: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('RetryStrategy') : false,
          fallbackStrategy: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('FallbackStrategy') : false,
          healthCheckService: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('HealthCheckService') : false,
          errorContext: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('ErrorContext') : false,
        },
        
        stateManagement: {
          stateManager: window.dependencyContainer ? window.dependencyContainer.getContainer().isBound('StateManager') : false,
        },
        
        // Check for any remaining service binding errors
        hasServiceBindingErrors: window.consoleErrors ? window.consoleErrors.some(err => 
          err.includes('Service not bound in container') || 
          err.includes('No matching bindings found') || 
          err.includes('Missing required @injectable')
        ) : false,
        
        // Check if global modules are now available
        globalModules: {
          stateManager: typeof window.stateManager,
          globalEventBus: typeof window.globalEventBus,
          utilityManager: typeof window.UtilityManager
        }
      };
    });

    console.log('Comprehensive DI Container Fix Validation Results:', JSON.stringify(containerStatus, null, 2));
    
    // Test assertions - DI container should exist
    expect(containerStatus.dependencyContainerExists).toBe(true);
    
    // Test assertions - all core services should be bound
    expect(containerStatus.coreServices.logger).toBe(true);
    expect(containerStatus.coreServices.eventBus).toBe(true);
    expect(containerStatus.coreServices.errorBoundary).toBe(true);
    expect(containerStatus.coreServices.unifiedErrorHandler).toBe(true);
    
    // Test assertions - all config services should be bound
    expect(containerStatus.configServices.configService).toBe(true);
    expect(containerStatus.configServices.environmentService).toBe(true);
    
    // Test assertions - all data services should be bound
    expect(containerStatus.dataServices.dataValidator).toBe(true);
    expect(containerStatus.dataServices.progressiveDataLoader).toBe(true);
    
    // Test assertions - all component services should be bound
    expect(containerStatus.componentServices.componentCommunication).toBe(true);
    expect(containerStatus.componentServices.componentLifecycleManager).toBe(true);
    expect(containerStatus.componentServices.componentErrorBoundary).toBe(true);
    expect(containerStatus.componentServices.componentMemoryManager).toBe(true);
    expect(containerStatus.componentServices.ariaService).toBe(true);
    
    // Test assertions - all map services should be bound
    expect(containerStatus.mapServices.refactoredMapManager).toBe(true);
    expect(containerStatus.mapServices.refactoredSidebarManager).toBe(true);
    expect(containerStatus.mapServices.refactoredSearchManager).toBe(true);
    
    // Test assertions - all platform services should be bound
    expect(containerStatus.platformServices.platformService).toBe(true);
    expect(containerStatus.platformServices.mobileComponentAdapter).toBe(true);
    expect(containerStatus.platformServices.mobileUIOptimizer).toBe(true);
    
    // Test assertions - all error handling services should be bound
    expect(containerStatus.errorHandlingServices.circuitBreakerStrategy).toBe(true);
    expect(containerStatus.errorHandlingServices.retryStrategy).toBe(true);
    expect(containerStatus.errorHandlingServices.fallbackStrategy).toBe(true);
    expect(containerStatus.errorHandlingServices.healthCheckService).toBe(true);
    expect(containerStatus.errorHandlingServices.errorContext).toBe(true);
    
    // Test assertions - state management should be bound
    expect(containerStatus.stateManagement.stateManager).toBe(true);
    
    // Test assertions - no service binding errors
    expect(containerStatus.hasServiceBindingErrors).toBe(false);
    
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


