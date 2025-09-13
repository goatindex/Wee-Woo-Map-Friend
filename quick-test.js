// Quick test using Playwright MCP for smoother testing
// This demonstrates how to use Playwright MCP for interactive testing

const { chromium } = require('playwright');

async function quickTest() {
  console.log('🚀 Starting quick test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:8000...');
    await page.goto('http://localhost:8000');
    
    // Wait for the map to load
    console.log('🗺️ Waiting for map to load...');
    await page.waitForSelector('#map', { timeout: 10000 });
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'quick-test-screenshot.png' });
    
    // Check if sidebar is present
    const sidebar = await page.$('#sidebar');
    if (sidebar) {
      console.log('✅ Sidebar found');
    } else {
      console.log('❌ Sidebar not found');
    }
    
    // Check for any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('⚠️ Console errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No console errors');
    }
    
    console.log('✅ Quick test completed successfully!');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();


