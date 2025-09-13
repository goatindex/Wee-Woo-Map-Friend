import { test, expect } from '@playwright/test';

test('should test TextFormatter DI migration', async ({ page }) => {
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

  // Test if DependencyContainer is available
  const diContainerAvailable = await page.evaluate(() => {
    return typeof window.DependencyContainer === 'object';
  });

  console.log('DependencyContainer available:', diContainerAvailable);

  // Test if TYPES is available
  const typesAvailable = await page.evaluate(() => {
    return typeof window.TYPES === 'object';
  });

  console.log('TYPES available:', typesAvailable);

  // Test if TextFormatter can be resolved from DI container
  const textFormatterResolved = await page.evaluate(() => {
    try {
      const container = window.DependencyContainer.getContainer();
      const textFormatter = container.get(window.TYPES.TextFormatter);
      return {
        success: true,
        hasEventBus: !!textFormatter.eventBus,
        hasStateManager: !!textFormatter.stateManager,
        hasLogger: !!textFormatter.logger,
        hasFormatLgaName: typeof textFormatter.formatLgaName === 'function',
        hasToTitleCase: typeof textFormatter.toTitleCase === 'function'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('TextFormatter resolution result:', textFormatterResolved);

  // Test if TextFormatter can perform text formatting
  const formattingTest = await page.evaluate(() => {
    try {
      const container = window.DependencyContainer.getContainer();
      const textFormatter = container.get(window.TYPES.TextFormatter);
      
      // Test title case conversion
      const titleCaseResult = textFormatter.toTitleCase('hello world');
      
      // Test LGA name formatting
      const lgaResult = textFormatter.formatLgaName('CITY OF MELBOURNE');
      
      return {
        success: true,
        titleCaseResult: titleCaseResult,
        lgaResult: lgaResult,
        hasValidResults: titleCaseResult === 'Hello World' && lgaResult.includes('Melbourne')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('Formatting test result:', formattingTest);

  // Check for any error messages
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  console.log('Error messages:', errorMessages);

  // The test should pass if we can resolve the TextFormatter
  expect(textFormatterResolved.success).toBe(true);
  expect(textFormatterResolved.hasEventBus).toBe(true);
  expect(textFormatterResolved.hasStateManager).toBe(true);
  expect(textFormatterResolved.hasLogger).toBe(true);
  expect(textFormatterResolved.hasFormatLgaName).toBe(true);
  expect(textFormatterResolved.hasToTitleCase).toBe(true);
});


