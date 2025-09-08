/**
 * Global Setup for Playwright Tests
 * Runs once before all tests
 */

async function globalSetup(config) {
  console.log('🚀 Starting ES6 Module Validation Tests');
  console.log('📊 Configuration:', {
    baseURL: config.use?.baseURL || 'http://localhost:8000',
    workers: config.workers,
    projects: config.projects?.map(p => p.name) || []
  });
  
  // Wait for the server to be ready
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(config.use?.baseURL || 'http://localhost:8000', { waitUntil: 'networkidle' });
    console.log('✅ Development server is ready');
  } catch (error) {
    console.error('❌ Failed to connect to development server:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
