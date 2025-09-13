/**
 * @module modules/main
 * Main ES6 entry point for the application
 * Replaces legacy script loading with modern ES6 module system
 */

import { applicationBootstrap } from './ApplicationBootstrap.js';
import { migrationDashboard } from './MigrationDashboard.js';

/**
 * Main application entry point with unified bootstrap system
 */
async function main() {
  console.log('🚀 WeeWoo Map Friend: Unified Application Bootstrap Starting');
  console.log('📍 Main.js: Single entry point confirmed - no duplicate initialization');
  
  // Debug: Check what applicationBootstrap is
  console.log('🔍 DEBUG: applicationBootstrap type:', typeof applicationBootstrap);
  console.log('🔍 DEBUG: applicationBootstrap value:', applicationBootstrap);
  
  try {
    // Initialize the unified application bootstrap system
    console.log('📍 Main.js: Calling applicationBootstrap.init()...');
    await applicationBootstrap.init();
    
    console.log('Unified Application Bootstrap: Bootstrap complete'); // Keep for user-facing confirmation
    console.log('📍 Main.js: Single initialization path successful');
    
    // Emit ready event using DI-resolved EventBus
    if (window.DependencyContainer && window.DependencyContainer.get) {
      const eventBus = window.DependencyContainer.get(window.TYPES.EventBus);
      if (eventBus) {
        eventBus.emit('app:es6ready', { bootstrap: applicationBootstrap });
        console.log('📍 Main.js: ES6 ready event emitted');
      } else {
        console.warn('📍 Main.js: EventBus not available from DI container');
      }
    } else {
      console.warn('📍 Main.js: DependencyContainer not available');
    }
    
    // Show migration dashboard for monitoring
    if (window.location.search.includes('debug=true') || window.location.hash.includes('debug')) {
      migrationDashboard.show();
      console.log('Debug dashboard enabled'); // Keep for user-facing debug info
    }
    
  } catch (error) {
    console.error('🚨 Unified Application Bootstrap: Failed to start:', error);
    console.error('📍 Main.js: Error in single entry point:', error);
    
    // Emit error event using DI-resolved EventBus
    if (window.DependencyContainer && window.DependencyContainer.get) {
      const eventBus = window.DependencyContainer.get(window.TYPES.EventBus);
      if (eventBus) {
        eventBus.emit('app:es6error', { error });
      }
    }
    
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
  
  // Set up cleanup on page unload
  window.addEventListener('beforeunload', async () => {
    try {
      if (window.applicationBootstrap && typeof window.applicationBootstrap.cleanup === 'function') {
        await window.applicationBootstrap.cleanup({ 
          reason: 'page-unload',
          preserveState: false 
        });
      }
    } catch (error) {
      console.error('Cleanup failed during page unload:', error);
    }
  });
  
  // Set up cleanup on page hide (for mobile apps)
  window.addEventListener('pagehide', async () => {
    try {
      if (window.applicationBootstrap && typeof window.applicationBootstrap.cleanup === 'function') {
        await window.applicationBootstrap.cleanup({ 
          reason: 'page-hide',
          preserveState: true 
        });
      }
    } catch (error) {
      console.error('Cleanup failed during page hide:', error);
    }
  });
}

// Export for testing and manual initialization
export { main, applicationBootstrap };
