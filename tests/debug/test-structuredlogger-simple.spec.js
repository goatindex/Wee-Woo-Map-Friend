import { test, expect } from '@playwright/test';

test('should test StructuredLogger functionality without BaseService', async ({ page }) => {
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

  // Test StructuredLogger functionality by creating a simple instance
  const structuredLoggerTest = await page.evaluate(async () => {
    try {
      // Import StructuredLogger directly
      const { StructuredLogger } = await import('/dist/modules/StructuredLogger.js');
      
      // Create StructuredLogger instance with minimal config to avoid BaseService issues
      const logger = new StructuredLogger({ enableConsole: false, enableTestTransport: false });
      
      // Test basic logging functionality
      const infoResult = logger.info('Test info message', { test: true });
      const errorResult = logger.error('Test error message', { test: true });
      const warnResult = logger.warn('Test warn message', { test: true });
      const debugResult = logger.debug('Test debug message', { test: true });
      
      // Test log levels
      const currentLevel = logger.getLevel();
      const shouldLog = logger.shouldLog('INFO');
      
      // Test if methods exist
      const hasInfo = typeof logger.info === 'function';
      const hasError = typeof logger.error === 'function';
      const hasWarn = typeof logger.warn === 'function';
      const hasDebug = typeof logger.debug === 'function';
      const hasGetLevel = typeof logger.getLevel === 'function';
      const hasShouldLog = typeof logger.shouldLog === 'function';
      const hasCreateChild = typeof logger.createChild === 'function';
      
      return {
        success: true,
        hasInfo,
        hasError,
        hasWarn,
        hasDebug,
        hasGetLevel,
        hasShouldLog,
        hasCreateChild,
        currentLevel,
        shouldLog,
        hasValidMethods: hasInfo && hasError && hasWarn && hasDebug && hasGetLevel && hasShouldLog && hasCreateChild
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  });

  console.log('StructuredLogger simple test result:', structuredLoggerTest);

  // Check for any error messages
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  console.log('Error messages:', errorMessages);

  // The test should pass if StructuredLogger works correctly
  expect(structuredLoggerTest.success).toBe(true);
  expect(structuredLoggerTest.hasValidMethods).toBe(true);
});
