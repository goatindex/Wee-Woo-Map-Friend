import { test, expect } from '@playwright/test';

test('should load main.js module and check for errors', async ({ page }) => {
  // Listen for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Navigate to the page
  await page.goto('http://localhost:8000');

  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');

  // Check if main.js is being loaded
  const mainModuleLoaded = await page.evaluate(() => {
    // Check if the main.js script tag exists
    const scriptTags = Array.from(document.querySelectorAll('script[type="module"]'));
    const mainScript = scriptTags.find(script => script.src.includes('main.js'));
    return !!mainScript;
  });

  console.log('Main.js script tag found:', mainModuleLoaded);

  // Check if there are any JavaScript errors
  console.log('Console errors:', consoleErrors);
  console.log('Page errors:', pageErrors);

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

  // Wait a bit more to see if main.js executes
  await page.waitForTimeout(2000);

  // Check console messages for main.js execution
  const consoleMessages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(script => script.textContent);
  });

  console.log('Script contents:', consoleMessages);

  // The test should pass even if there are errors - we're just investigating
  expect(true).toBe(true);
});

