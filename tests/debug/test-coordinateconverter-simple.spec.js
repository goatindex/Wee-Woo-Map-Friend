import { test, expect } from '@playwright/test';

test('should test CoordinateConverter DI migration', async ({ page }) => {
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

  // Test if CoordinateConverter can be resolved from DI container
  const coordinateConverterResolved = await page.evaluate(() => {
    try {
      const container = window.DependencyContainer.getContainer();
      const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
      return {
        success: true,
        hasLogger: !!coordinateConverter.logger,
        hasConvertMethod: typeof coordinateConverter.convertMGA94ToLatLon === 'function'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('CoordinateConverter resolution result:', coordinateConverterResolved);

  // Test if CoordinateConverter can perform a conversion
  const conversionTest = await page.evaluate(() => {
    try {
      const container = window.DependencyContainer.getContainer();
      const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
      
      // Test conversion with known coordinates
      const result = coordinateConverter.convertMGA94ToLatLon(500000, 6000000);
      return {
        success: true,
        result: result,
        hasValidResult: Array.isArray(result) && result.length === 2
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('Conversion test result:', conversionTest);

  // Check for any error messages
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  console.log('Error messages:', errorMessages);

  // The test should pass if we can resolve the CoordinateConverter
  expect(coordinateConverterResolved.success).toBe(true);
  expect(coordinateConverterResolved.hasLogger).toBe(true);
  expect(coordinateConverterResolved.hasConvertMethod).toBe(true);
});

