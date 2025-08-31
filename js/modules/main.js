/**
 * @module modules/main
 * Main ES6 entry point for the application
 * Replaces legacy script loading with modern ES6 module system
 */

import { es6Bootstrap } from './ES6Bootstrap.js';
import { globalEventBus } from './EventBus.js';
import { migrationDashboard } from './MigrationDashboard.js';

/**
 * Main application entry point
 */
async function main() {
  console.log('🚀 WeeWoo Map Friend: ES6 Module System Starting');
  
  try {
    // Initialize the ES6 bootstrap system
    await es6Bootstrap.init();
    
    console.log('✅ ES6 Module System: Bootstrap complete');
    
    // Emit ready event
    globalEventBus.emit('app:es6ready', { bootstrap: es6Bootstrap });
    
    // Show migration dashboard for monitoring
    if (window.location.search.includes('debug=true') || window.location.hash.includes('debug')) {
      migrationDashboard.show();
    }
    
  } catch (error) {
    console.error('🚨 ES6 Module System: Failed to start:', error);
    
    // Emit error event
    globalEventBus.emit('app:es6error', { error });
    
    // The bootstrap system should have already fallen back to legacy
    console.log('🔄 ES6 Module System: Continuing with legacy fallback');
  }
}

// Auto-initialize when this module is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
}

// Export for testing and manual initialization
export { main, es6Bootstrap };
