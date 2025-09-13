/**
 * @fileoverview Playwright Test File
 * 
 * 📚 Documentation:
 * - Testing Framework: project_docs/development/testing-playwright.md
 * - Build Process: project_docs/development/build-automation.md
 * 
 * 🔧 Build Process:
 * Tests automatically run `npm run build:js` before execution to ensure
 * decorators are properly transformed from TypeScript to browser-compatible JavaScript.
 */

import { test, expect } from '@playwright/test';

test.describe('Console Error Monitoring', () => {
  let consoleMessages = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    // Clear message arrays
    consoleMessages = [];
    pageErrors = [];

    // Monitor all console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      });
    });

    // Monitor page errors
    page.on('pageerror', error => {
      pageErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });

    // Monitor unhandled promise rejections
    page.on('unhandledrejection', error => {
      pageErrors.push({
        type: 'unhandledrejection',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });
  });

  test('should categorize console messages by type', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Categorize messages
    const categorizedMessages = {
      errors: consoleMessages.filter(msg => msg.type === 'error'),
      warnings: consoleMessages.filter(msg => msg.type === 'warning'),
      info: consoleMessages.filter(msg => msg.type === 'info'),
      log: consoleMessages.filter(msg => msg.type === 'log'),
      debug: consoleMessages.filter(msg => msg.type === 'debug')
    };

    // Log summary
    console.log('Console Message Summary:');
    Object.entries(categorizedMessages).forEach(([type, messages]) => {
      console.log(`  ${type}: ${messages.length} messages`);
    });

    // Check for critical errors
    const criticalErrors = categorizedMessages.errors.filter(error => 
      !error.text.includes('favicon') && // Ignore favicon errors
      !error.text.includes('404') && // Ignore 404 errors for non-critical resources
      !error.text.includes('CORS') && // Ignore CORS warnings
      !error.text.includes('Mixed Content') // Ignore mixed content warnings
    );

    expect(criticalErrors).toHaveLength(0);
    
    if (criticalErrors.length > 0) {
      console.log('Critical Errors Found:', criticalErrors);
    }
  });

  test('should identify ES6 module specific errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for ES6 module specific errors
    const es6Errors = consoleMessages.filter(msg => 
      msg.text.includes('import') ||
      msg.text.includes('export') ||
      msg.text.includes('module') ||
      msg.text.includes('ES6') ||
      msg.text.includes('SyntaxError') ||
      msg.text.includes('ReferenceError') ||
      msg.text.includes('TypeError')
    );

    const es6PageErrors = pageErrors.filter(error =>
      error.message.includes('import') ||
      error.message.includes('export') ||
      error.message.includes('module') ||
      error.message.includes('ES6')
    );

    const allEs6Errors = [...es6Errors, ...es6PageErrors];

    expect(allEs6Errors).toHaveLength(0);
    
    if (allEs6Errors.length > 0) {
      console.log('ES6 Module Errors Found:', allEs6Errors);
    }
  });

  test('should identify StateManager specific errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for StateManager specific errors
    const stateManagerErrors = consoleMessages.filter(msg => 
      msg.text.includes('StateManager') ||
      msg.text.includes('stateManager') ||
      msg.text.includes('state') ||
      msg.text.includes('reactive')
    );

    const stateManagerPageErrors = pageErrors.filter(error =>
      error.message.includes('StateManager') ||
      error.message.includes('stateManager') ||
      error.message.includes('state')
    );

    const allStateManagerErrors = [...stateManagerErrors, ...stateManagerPageErrors];

    // Filter out non-error messages
    const actualErrors = allStateManagerErrors.filter(error => 
      error.type === 'error' || error.type === 'pageerror'
    );

    expect(actualErrors).toHaveLength(0);
    
    if (actualErrors.length > 0) {
      console.log('StateManager Errors Found:', actualErrors);
    }
  });

  test('should identify EventBus specific errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for EventBus specific errors
    const eventBusErrors = consoleMessages.filter(msg => 
      msg.text.includes('EventBus') ||
      msg.text.includes('globalEventBus') ||
      msg.text.includes('event') ||
      msg.text.includes('emit') ||
      msg.text.includes('listener')
    );

    const eventBusPageErrors = pageErrors.filter(error =>
      error.message.includes('EventBus') ||
      error.message.includes('globalEventBus') ||
      error.message.includes('event')
    );

    const allEventBusErrors = [...eventBusErrors, ...eventBusPageErrors];

    // Filter out non-error messages
    const actualErrors = allEventBusErrors.filter(error => 
      error.type === 'error' || error.type === 'pageerror'
    );

    expect(actualErrors).toHaveLength(0);
    
    if (actualErrors.length > 0) {
      console.log('EventBus Errors Found:', actualErrors);
    }
  });

  test('should identify map integration errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for map integration errors
    const mapErrors = consoleMessages.filter(msg => 
      msg.text.includes('map') ||
      msg.text.includes('leaflet') ||
      msg.text.includes('L.') ||
      msg.text.includes('tile') ||
      msg.text.includes('layer')
    );

    const mapPageErrors = pageErrors.filter(error =>
      error.message.includes('map') ||
      error.message.includes('leaflet') ||
      error.message.includes('L.')
    );

    const allMapErrors = [...mapErrors, ...mapPageErrors];

    // Filter out non-error messages and common warnings
    const actualErrors = allMapErrors.filter(error => 
      (error.type === 'error' || error.type === 'pageerror') &&
      !error.text.includes('favicon') &&
      !error.text.includes('404')
    );

    expect(actualErrors).toHaveLength(0);
    
    if (actualErrors.length > 0) {
      console.log('Map Integration Errors Found:', actualErrors);
    }
  });

  test('should identify UI integration errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for UI integration errors
    const uiErrors = consoleMessages.filter(msg => 
      msg.text.includes('sidebar') ||
      msg.text.includes('collapsible') ||
      msg.text.includes('search') ||
      msg.text.includes('checkbox') ||
      msg.text.includes('UIManager') ||
      msg.text.includes('CollapsibleManager') ||
      msg.text.includes('SearchManager')
    );

    const uiPageErrors = pageErrors.filter(error =>
      error.message.includes('sidebar') ||
      error.message.includes('collapsible') ||
      error.message.includes('search') ||
      error.message.includes('UIManager')
    );

    const allUiErrors = [...uiErrors, ...uiPageErrors];

    // Filter out non-error messages
    const actualErrors = allUiErrors.filter(error => 
      error.type === 'error' || error.type === 'pageerror'
    );

    expect(actualErrors).toHaveLength(0);
    
    if (actualErrors.length > 0) {
      console.log('UI Integration Errors Found:', actualErrors);
    }
  });

  test('should provide error summary report', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Generate comprehensive error report
    const errorReport = {
      totalConsoleMessages: consoleMessages.length,
      totalPageErrors: pageErrors.length,
      errorBreakdown: {
        errors: consoleMessages.filter(msg => msg.type === 'error').length,
        warnings: consoleMessages.filter(msg => msg.type === 'warning').length,
        info: consoleMessages.filter(msg => msg.type === 'info').length,
        log: consoleMessages.filter(msg => msg.type === 'log').length,
        debug: consoleMessages.filter(msg => msg.type === 'debug').length
      },
      criticalErrors: consoleMessages.filter(msg => 
        msg.type === 'error' && 
        !msg.text.includes('favicon') && 
        !msg.text.includes('404') &&
        !msg.text.includes('CORS')
      ),
      pageErrors: pageErrors,
      timestamp: new Date().toISOString()
    };

    console.log('=== ERROR MONITORING REPORT ===');
    console.log(`Total Console Messages: ${errorReport.totalConsoleMessages}`);
    console.log(`Total Page Errors: ${errorReport.totalPageErrors}`);
    console.log('Error Breakdown:', errorReport.errorBreakdown);
    
    if (errorReport.criticalErrors.length > 0) {
      console.log('Critical Errors:', errorReport.criticalErrors);
    }
    
    if (errorReport.pageErrors.length > 0) {
      console.log('Page Errors:', errorReport.pageErrors);
    }

    // Save report to file (for CI/CD integration)
    await page.evaluate((report) => {
      if (typeof window !== 'undefined') {
        window.errorReport = report;
      }
    }, errorReport);

    // Expect no critical errors
    expect(errorReport.criticalErrors).toHaveLength(0);
    expect(errorReport.pageErrors).toHaveLength(0);
  });
});


