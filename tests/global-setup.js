/**
 * Global Setup for Multi-Server Playwright Tests
 * Runs once before all tests
 * Note: Playwright's webServer array handles multiple server startup automatically
 */

async function globalSetup(config) {
  console.log('🚀 Starting Multi-Server ES6 Module Validation Tests');
  console.log('📊 Configuration:', {
    workers: config.workers,
    projects: config.projects?.map(p => `${p.name} (${p.use?.baseURL})`) || [],
    servers: config.webServer?.length || 0
  });
  
  // Playwright's webServer array will handle multiple server startup
  // Servers will be started on ports 8001-8004 for different test categories
  console.log('✅ Multi-server setup will be managed by Playwright webServer array');
  console.log('🌐 Servers: Unit(8001), E2E(8002), Debug(8003), Performance(8004)');
}

export default globalSetup;
