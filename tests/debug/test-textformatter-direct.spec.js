import { test, expect } from '@playwright/test';

test('should test TextFormatter functionality directly', async ({ page }) => {
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

  // Test TextFormatter functionality directly by importing the module
  const textFormatterTest = await page.evaluate(async () => {
    try {
      // Import TextFormatter directly
      const { TextFormatter } = await import('/dist/modules/TextFormatter.js');
      
      // Create a mock event bus and state manager for testing
      const mockEventBus = {
        on: () => {},
        emit: () => {}
      };
      
      const mockStateManager = {
        get: () => null,
        set: () => {}
      };
      
      // Create TextFormatter instance
      const textFormatter = new TextFormatter(mockEventBus, mockStateManager);
      
      // Test title case conversion
      const titleCaseResult = textFormatter.toTitleCase('hello world');
      
      // Test LGA name formatting
      const lgaResult = textFormatter.formatLgaName('CITY OF MELBOURNE');
      
      // Test SES name formatting
      const sesResult = textFormatter.formatSesName('SES UNIT NAME');
      
      return {
        success: true,
        titleCaseResult: titleCaseResult,
        lgaResult: lgaResult,
        sesResult: sesResult,
        hasValidResults: titleCaseResult === 'Hello World' && 
                        lgaResult.includes('Melbourne') && 
                        sesResult.includes('SES')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  });

  console.log('TextFormatter direct test result:', textFormatterTest);

  // Check for any error messages
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  console.log('Error messages:', errorMessages);

  // The test should pass if TextFormatter works correctly
  expect(textFormatterTest.success).toBe(true);
  expect(textFormatterTest.hasValidResults).toBe(true);
});


