import { test, expect } from '@playwright/test';

test('should test StructuredLogger DI migration', async ({ page }) => {
  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Navigate to the page
  await page.goto('http://localhost:8000');

  // Wait for DOM to be ready
  await page.waitForLoadState('domcontentloaded');

  // Wait a bit for the application to initialize
  await page.waitForTimeout(2000);

  // Test StructuredLogger functionality directly by importing the module
  const structuredLoggerTest = await page.evaluate(async () => {
    try {
      // Import StructuredLogger directly
      const { StructuredLogger } = await import('/dist/modules/StructuredLogger.js');
      
      // Create StructuredLogger instance
      const logger = new StructuredLogger();
      
      // Test basic logging functionality
      const infoResult = logger.info('Test info message', { test: true });
      const errorResult = logger.error('Test error message', { test: true });
      const warnResult = logger.warn('Test warn message', { test: true });
      const debugResult = logger.debug('Test debug message', { test: true });
      
      // Test createChild method
      const childLogger = logger.createChild({ module: 'TestModule' });
      const childInfoResult = childLogger.info('Test child message', { test: true });
      
      // Test log levels
      const currentLevel = logger.getCurrentLevel();
      const isLevelEnabled = logger.isLevelEnabled('INFO');
      
      return {
        success: true,
        hasInfo: typeof logger.info === 'function',
        hasError: typeof logger.error === 'function',
        hasWarn: typeof logger.warn === 'function',
        hasDebug: typeof logger.debug === 'function',
        hasCreateChild: typeof logger.createChild === 'function',
        hasGetCurrentLevel: typeof logger.getCurrentLevel === 'function',
        hasIsLevelEnabled: typeof logger.isLevelEnabled === 'function',
        currentLevel: currentLevel,
        isLevelEnabled: isLevelEnabled,
        hasValidMethods: typeof logger.info === 'function' && 
                         typeof logger.error === 'function' && 
                         typeof logger.warn === 'function' && 
                         typeof logger.debug === 'function' && 
                         typeof logger.createChild === 'function'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  });

  console.log('StructuredLogger direct test result:', structuredLoggerTest);

  // Test if DependencyContainer is available (secondary test)
  const diContainerAvailable = await page.evaluate(() => {
    return typeof window.DependencyContainer === 'object';
  });

  console.log('DependencyContainer available:', diContainerAvailable);

  // Test if StructuredLogger can be resolved from DI container (if available)
  const structuredLoggerDiTest = await page.evaluate(() => {
    try {
      if (typeof window.DependencyContainer === 'object' && typeof window.TYPES === 'object') {
        const container = window.DependencyContainer.getContainer();
        const logger = container.get(window.TYPES.StructuredLogger);
        return {
          success: true,
          hasLogger: !!logger,
          hasInfo: typeof logger.info === 'function',
          hasError: typeof logger.error === 'function',
          hasWarn: typeof logger.warn === 'function',
          hasDebug: typeof logger.debug === 'function',
          hasCreateChild: typeof logger.createChild === 'function'
        };
      } else {
        return {
          success: false,
          error: 'DI container not available'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('StructuredLogger DI test result:', structuredLoggerDiTest);

  // Check for any error messages
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  console.log('Error messages:', errorMessages);

  // The test should pass if StructuredLogger works correctly
  expect(structuredLoggerTest.success).toBe(true);
  expect(structuredLoggerTest.hasValidMethods).toBe(true);
  
  // If DI container is available, test DI resolution
  if (diContainerAvailable) {
    expect(structuredLoggerDiTest.success).toBe(true);
    expect(structuredLoggerDiTest.hasLogger).toBe(true);
    expect(structuredLoggerDiTest.hasInfo).toBe(true);
    expect(structuredLoggerDiTest.hasError).toBe(true);
    expect(structuredLoggerDiTest.hasWarn).toBe(true);
    expect(structuredLoggerDiTest.hasDebug).toBe(true);
    expect(structuredLoggerDiTest.hasCreateChild).toBe(true);
  }
});


