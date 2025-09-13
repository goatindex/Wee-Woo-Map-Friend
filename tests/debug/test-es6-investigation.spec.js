import { test, expect } from '@playwright/test';

test.describe('ES6-ONLY MODE Investigation', () => {
  test('Phase 1: Capture all console errors and network issues', async ({ page }) => {
    const consoleMessages = [];
    const networkErrors = [];
    const jsErrors = [];
    
    // Capture console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Capture network errors
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Navigate to the page
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);
    
    // Get page title and basic info
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      hasWindow: typeof window !== 'undefined',
      windowKeys: Object.keys(window).filter(key => !key.startsWith('_')),
      hasDependencyContainer: typeof window.DependencyContainer !== 'undefined',
      hasTYPES: typeof window.TYPES !== 'undefined',
      hasApplicationBootstrap: typeof window.applicationBootstrap !== 'undefined',
      documentReadyState: document.readyState,
      scriptsLoaded: Array.from(document.scripts).map(script => ({
        src: script.src,
        type: script.type,
        loaded: script.readyState === 'complete' || script.readyState === 'loaded'
      }))
    }));
    
    // Check if main.js loaded successfully
    const mainJsStatus = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const mainScript = scripts.find(script => script.src && script.src.includes('main.js'));
      return {
        found: !!mainScript,
        src: mainScript?.src,
        type: mainScript?.type,
        readyState: mainScript?.readyState,
        loaded: mainScript?.readyState === 'complete' || mainScript?.readyState === 'loaded'
      };
    });
    
    // Check if ApplicationBootstrap is accessible
    const appBootstrapStatus = await page.evaluate(() => {
      try {
        // Try to access the module
        const module = window.applicationBootstrap;
        return {
          exists: typeof module !== 'undefined',
          type: typeof module,
          isFunction: typeof module === 'function',
          isObject: typeof module === 'object',
          hasInit: module && typeof module.init === 'function',
          error: null
        };
      } catch (error) {
        return {
          exists: false,
          type: 'undefined',
          isFunction: false,
          isObject: false,
          hasInit: false,
          error: error.message
        };
      }
    });
    
    // Check for ES6 module errors specifically
    const es6ModuleErrors = consoleMessages.filter(msg => 
      msg.text.includes('Failed to load module') ||
      msg.text.includes('import') ||
      msg.text.includes('module') ||
      msg.text.includes('ES6') ||
      msg.text.includes('bootstrap')
    );
    
    // Check for ApplicationBootstrap related errors
    const appBootstrapErrors = consoleMessages.filter(msg => 
      msg.text.includes('ApplicationBootstrap') ||
      msg.text.includes('applicationBootstrap') ||
      msg.text.includes('bootstrap')
    );
    
    // Output results
    console.log('\n🔍 PHASE 1 INVESTIGATION RESULTS');
    console.log('================================');
    
    console.log('\n📄 Page Info:');
    console.log(JSON.stringify(pageInfo, null, 2));
    
    console.log('\n📜 Main.js Status:');
    console.log(JSON.stringify(mainJsStatus, null, 2));
    
    console.log('\n🚀 ApplicationBootstrap Status:');
    console.log(JSON.stringify(appBootstrapStatus, null, 2));
    
    console.log('\n❌ JavaScript Errors:');
    jsErrors.forEach((error, index) => {
      console.log(`\nError ${index + 1}:`);
      console.log(`  Message: ${error.message}`);
      console.log(`  Stack: ${error.stack}`);
      console.log(`  Timestamp: ${error.timestamp}`);
    });
    
    console.log('\n🌐 Network Errors:');
    networkErrors.forEach((error, index) => {
      console.log(`\nNetwork Error ${index + 1}:`);
      console.log(`  URL: ${error.url}`);
      console.log(`  Status: ${error.status} ${error.statusText}`);
    });
    
    console.log('\n📝 All Console Messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`\nConsole ${index + 1} [${msg.type}]: ${msg.text}`);
    });
    
    console.log('\n🔧 ES6 Module Related Messages:');
    es6ModuleErrors.forEach((msg, index) => {
      console.log(`\nES6 Message ${index + 1} [${msg.type}]: ${msg.text}`);
    });
    
    console.log('\n🚀 ApplicationBootstrap Related Messages:');
    appBootstrapErrors.forEach((msg, index) => {
      console.log(`\nBootstrap Message ${index + 1} [${msg.type}]: ${msg.text}`);
    });
    
    // Return structured data for analysis
    return {
      pageInfo,
      mainJsStatus,
      appBootstrapStatus,
      jsErrors,
      networkErrors,
      consoleMessages,
      es6ModuleErrors,
      appBootstrapErrors
    };
  });
});


