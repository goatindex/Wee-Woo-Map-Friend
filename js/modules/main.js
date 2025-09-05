/**
 * @module modules/main
 * Main ES6 entry point for the application
 * Replaces legacy script loading with modern ES6 module system
 */

import { applicationBootstrap } from './ApplicationBootstrap.js';
import { globalEventBus } from './EventBus.js';
import { migrationDashboard } from './MigrationDashboard.js';

/**
 * Main application entry point with unified bootstrap system
 */
async function main() {
  console.log('🚀 WeeWoo Map Friend: Unified Application Bootstrap Starting');
  
  try {
    // Initialize the unified application bootstrap system
    await applicationBootstrap.init();
    
    console.log('✅ Unified Application Bootstrap: Bootstrap complete');
    
    // Emit ready event
    globalEventBus.emit('app:es6ready', { bootstrap: applicationBootstrap });
    
    // Show migration dashboard for monitoring
    if (window.location.search.includes('debug=true') || window.location.hash.includes('debug')) {
      migrationDashboard.show();
    }
    
  } catch (error) {
    console.error('🚨 Unified Application Bootstrap: Failed to start:', error);
    
    // Emit error event
    globalEventBus.emit('app:es6error', { error });
    
    // The bootstrap system should have already handled the error
    console.log('🔄 Unified Application Bootstrap: Error handled by bootstrap');
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
export { main, applicationBootstrap };
