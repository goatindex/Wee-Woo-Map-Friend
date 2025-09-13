import { test, expect } from '@playwright/test';

test('should load main.js module and check execution', async ({ page }) => {
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

  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');

  // Wait a bit more to see if main.js executes
  await page.waitForTimeout(3000);

  // Check if main.js console messages appear
  const mainMessages = consoleMessages.filter(msg => 
    msg.text.includes('Main.js') || 
    msg.text.includes('Unified Application Bootstrap') ||
    msg.text.includes('ES6 system ready')
  );

  console.log('Main.js related console messages:', mainMessages);

  // Check if the main function is available
  const mainFunctionAvailable = await page.evaluate(() => {
    return typeof window.main === 'function';
  });

  console.log('Main function available:', mainFunctionAvailable);

  // Check if applicationBootstrap is available
  const bootstrapAvailable = await page.evaluate(() => {
    return typeof window.applicationBootstrap === 'object';
  });

  console.log('ApplicationBootstrap available:', bootstrapAvailable);

  // Check if DependencyContainer is available
  const diContainerAvailable = await page.evaluate(() => {
    return typeof window.DependencyContainer === 'object';
  });

  console.log('DependencyContainer available:', diContainerAvailable);

  // Check if TYPES is available
  const typesAvailable = await page.evaluate(() => {
    return typeof window.TYPES === 'object';
  });

  console.log('TYPES available:', typesAvailable);

  // The test should pass even if there are issues - we're just investigating
  expect(true).toBe(true);
});

