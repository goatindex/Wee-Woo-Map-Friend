/**
 * @module modules/app
 * Main application entry point for the modern ES module system
 * Orchestrates initialization and provides fallback to legacy system
 */

import { stateManager } from './StateManager.js';
import { docsRouter } from './Router.js';
import { globalEventBus } from './EventBus.js';
import { legacyBridge } from './LegacyBridge.js';
import { es6IntegrationManager } from './ES6IntegrationManager.js';
import { HamburgerMenu } from '../components/HamburgerMenu.js';
import { CollapsibleManager } from '../components/CollapsibleManager.js';
import { SearchManager } from '../components/SearchManager.js';
import { ActiveListManager } from '../components/ActiveListManager.js';
import { MobileDocsNavManager } from '../components/MobileDocsNavManager.js';

/**
 * @class App
 * Main application controller that orchestrates all systems
 * Integrates with legacy bootstrap while providing modern enhancements
 */
class App {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.version = '2.0.0-modern';
    this.initStartTime = performance.now();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.handleError = this.handleError.bind(this);
    this.fallbackToLegacy = this.fallbackToLegacy.bind(this);
    
    console.log(`🚀 WeeWoo Map Friend ${this.version} - Modern Module System Starting`);
  }
  
  /**
   * Initialize the modern application system
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      console.warn('App: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 App: Starting modern application initialization...');
      
      // Phase 1: Error handling and compatibility checks
      this.setupErrorHandling();
      
      // Phase 2: Check if we should proceed with modern system
      if (!this.checkModernCompatibility()) {
        throw new Error('Modern system compatibility check failed');
      }
      
      // Phase 3: Wait for DOM and basic dependencies
      await this.waitForDOM();
      await this.waitForLegacyDependencies();
      
      // Phase 4: Initialize ES6 module integration
      await this.initES6Integration();
      
      // Phase 5: Initialize modern components (non-conflicting)
      await this.initStateManager();
      await this.initLegacyBridge();
      
      // Phase 6: Initialize device context (from legacy)
      await this.initDeviceContext();
      
      // Phase 7: Set up modern enhancements
      await this.initModernComponents();
      
      // Phase 7: Set up global event listeners
      this.setupGlobalEvents();
      
      // Phase 8: Mark as initialized and emit event
      this.initialized = true;
      globalEventBus.emit('app:modernInitialized', { app: this });
      
      const initTime = performance.now() - this.initStartTime;
      console.log(`✅ App: Modern system initialization complete (${initTime.toFixed(2)}ms)`);
      
      // Phase 9: Let legacy system handle core map functionality
      console.log('🤝 App: Delegating core initialization to legacy bootstrap');
      
    } catch (error) {
      console.error('🚨 App: Modern system initialization failed:', error);
      this.handleError(error);
      
      // Attempt fallback to legacy system
      await this.fallbackToLegacy(error);
      throw error; // Re-throw to trigger index.html fallback
    }
  }
  
  /**
   * Initialize ES6 module integration
   * @returns {Promise<void>}
   * @private
   */
  async initES6Integration() {
    try {
      console.log('🔧 App: Initializing ES6 module integration...');
      
      // Initialize the ES6 integration manager
      await es6IntegrationManager.init();
      
      // Wait for integration to be ready
      if (!es6IntegrationManager.isReady()) {
        throw new Error('ES6 integration failed to initialize');
      }
      
      console.log('✅ App: ES6 module integration complete');
      
    } catch (error) {
      console.error('🚨 App: ES6 module integration failed:', error);
      throw error;
    }
  }
  
  /**
   * Check modern system compatibility
   * @returns {boolean} Whether modern system should proceed
   * @private
   */
  checkModernCompatibility() {
    try {
      // Check for required APIs
      const requiredAPIs = [
        'Promise',
        'Map',
        'Set',
        'fetch',
        'CustomEvent',
        'Proxy'
      ];
      
      for (const api of requiredAPIs) {
        if (!(api in window)) {
          console.warn(`App: Missing required API: ${api}`);
          return false;
        }
      }
      
      // Check for ES6 module support (already verified by reaching here)
      // Check for basic DOM APIs
      if (!document.querySelector || !document.addEventListener) {
        console.warn('App: Missing essential DOM APIs');
        return false;
      }
      
      console.log('✅ App: Modern compatibility check passed');
      return true;
      
    } catch (error) {
      console.warn('App: Compatibility check failed:', error);
      return false;
    }
  }
  
  /**
   * Set up global error handling with fallback mechanisms
   * @private
   */
  setupErrorHandling() {
    // Global unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 App: Unhandled promise rejection:', event.reason);
      globalEventBus.emit('app:error', { 
        type: 'unhandledRejection', 
        error: event.reason,
        critical: true
      });
      
      // Prevent default to avoid console spam
      event.preventDefault();
    });
    
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('🚨 App: JavaScript error:', event.error);
      globalEventBus.emit('app:error', { 
        type: 'javascriptError', 
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        critical: false
      });
    });
    
    // Track app-specific errors
    globalEventBus.on('app:error', ({ error, critical }) => {
      if (critical && !this.initialized) {
        console.error('🚨 App: Critical error during initialization, triggering fallback');
        this.fallbackToLegacy(error);
      }
    });
  }
  
  /**
   * Wait for DOM to be ready
   * @returns {Promise<void>}
   * @private
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Wait for critical legacy dependencies to be available
   * @returns {Promise<void>}
   * @private
   */
  async waitForLegacyDependencies() {
    console.log('⏳ App: Waiting for legacy dependencies...');
    
    const dependencies = [
      { name: 'L', global: 'L', timeout: 5000 },
      { name: 'DeviceContext', global: 'DeviceContext', timeout: 2000 },
      { name: 'AppBootstrap', global: 'AppBootstrap', timeout: 3000 }
    ];
    
    const promises = dependencies.map(dep => this.waitForGlobal(dep.global, dep.timeout, dep.name));
    
    try {
      await Promise.all(promises);
      console.log('✅ App: All legacy dependencies ready');
    } catch (error) {
      console.warn('⚠️ App: Some legacy dependencies not ready:', error.message);
      // Continue anyway - some dependencies are optional
    }
  }
  
  /**
   * Wait for a global variable to be available
   * @param {string} globalName - Name of global variable
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} friendlyName - Human-readable name for logging
   * @returns {Promise<any>} The global variable when available
   * @private
   */
  async waitForGlobal(globalName, timeout = 5000, friendlyName = globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      
      let attempts = 0;
      const maxAttempts = timeout / 100;
      
      const check = () => {
        if (window[globalName]) {
          console.log(`✅ App: ${friendlyName} ready`);
          resolve(window[globalName]);
        } else if (attempts++ >= maxAttempts) {
          reject(new Error(`Timeout waiting for ${friendlyName}`));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Initialize state management system
   * @private
   */
  async initStateManager() {
    console.log('📊 App: Initializing state manager...');
    
    try {
      // StateManager is initialized in constructor, no async init needed
      
      // Subscribe to important state changes
      stateManager.subscribe('error', (error) => {
        this.handleError(error);
      });
      
      // Set up computed properties that depend on legacy state
      stateManager.computed('isMapReady', () => {
        return !!window.map;
      }, ['map']);
      
      globalEventBus.emit('app:stateManagerReady', { stateManager });
      console.log('✅ App: State manager ready');
      
    } catch (error) {
      console.error('🚨 App: Failed to initialize state manager:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy bridge system
   * @private
   */
  async initLegacyBridge() {
    console.log('🌉 App: Initializing legacy bridge...');
    
    try {
      await legacyBridge.init();
      
      // Register for legacy system events
      this.setupLegacyIntegration();
      
      console.log('✅ App: Legacy bridge ready');
      
    } catch (error) {
      console.error('🚨 App: Failed to initialize legacy bridge:', error);
      // Bridge failure is not critical - continue without it
    }
  }
  
  /**
   * Set up integration with legacy system events
   * @private
   */
  setupLegacyIntegration() {
    // Listen for legacy bootstrap completion
    if (window.AppBootstrap) {
      // Hook into legacy initialization
      const originalInit = window.AppBootstrap.init;
      window.AppBootstrap.init = async function(...args) {
        console.log('🤝 App: Legacy bootstrap starting...');
        
        try {
          const result = await originalInit.apply(this, args);
          
          // After legacy init, set up modern enhancements
          globalEventBus.emit('app:legacyBootstrapComplete');
          console.log('✅ App: Legacy bootstrap complete, modern enhancements available');
          
          return result;
        } catch (error) {
          console.error('🚨 App: Legacy bootstrap failed:', error);
          globalEventBus.emit('app:legacyBootstrapError', { error });
          throw error;
        }
      };
    }
    
    // Listen for docs events
    window.addEventListener('docs-opened', (event) => {
      console.log('📚 App: Docs opened, setting up modern navigation');
      this.handleDocsOpened(event.detail);
    });
    
    // Listen for map events
    globalEventBus.on('app:legacyBootstrapComplete', () => {
      if (window.map) {
        stateManager.set('map', window.map);
        stateManager.set('mapReady', true);
        console.log('🗺️ App: Map integration complete');
      }
    });
  }
  
  /**
   * Initialize device context from legacy system
   * @private
   */
  async initDeviceContext() {
    console.log('📱 App: Initializing device context...');
    
    try {
      if (window.DeviceContext) {
        const context = window.DeviceContext.getContext();
        stateManager.set('deviceContext', context);
        console.log('✅ App: Device context initialized:', context);
      } else {
        // Fallback device detection
        const context = {
          isMobile: window.innerWidth <= 768,
          isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
          isDesktop: window.innerWidth > 1024,
          isTouch: 'ontouchstart' in window,
          userAgent: navigator.userAgent
        };
        stateManager.set('deviceContext', context);
        console.log('⚠️ App: Using fallback device context:', context);
      }
      
    } catch (error) {
      console.error('🚨 App: Device context initialization failed:', error);
    }
  }
  
  /**
   * Initialize modern components and enhancements
   * @private
   */
  async initModernComponents() {
    console.log('🎨 App: Initializing modern components...');
    
    try {
      // Initialize router for docs
      this.initRouter();
      
      // Initialize collapsible manager for sidebar
      await this.initCollapsibleManager();
      
      // Initialize search manager for global search
      await this.initSearchManager();
      
      // Initialize active list manager for "All Active" section
      await this.initActiveListManager();
      
      // Initialize mobile docs navigation manager
      await this.initMobileDocsNavManager();
      
      // Set up mobile enhancement handlers
      this.setupMobileEnhancements();
      
      globalEventBus.emit('app:modernComponentsReady');
      console.log('✅ App: Modern components ready');
      
    } catch (error) {
      console.error('🚨 App: Modern components initialization failed:', error);
      // Component failures are not critical - continue
    }
  }
  
  /**
   * Initialize routing system
   * @private
   */
  initRouter() {
    try {
      // Set up router event listeners
      docsRouter.on('docs:loaded', (data) => {
        globalEventBus.emit('app:docsLoaded', data);
      });
      
      docsRouter.on('docs:error', (data) => {
        console.error('📚 App: Docs loading error:', data);
      });
      
      // Initialize router
      docsRouter.init();
      
    } catch (error) {
      console.error('🚨 App: Router initialization failed:', error);
    }
  }
  
  /**
   * Initialize collapsible manager for sidebar sections
   * @private
   */
  async initCollapsibleManager() {
    try {
      const sidebarContainer = document.getElementById('layerMenu');
      if (!sidebarContainer) {
        console.warn('⚠️ App: No sidebar container found for CollapsibleManager');
        return;
      }

      const collapsibleManager = new CollapsibleManager(sidebarContainer, {
        autoCollapseOthers: true,
        persistState: true,
        animationDuration: 200,
        stickyHeaders: true
      });

      await collapsibleManager.init();
      
      this.registerComponent('collapsibleManager', collapsibleManager);
      console.log('📁 App: CollapsibleManager initialized');

    } catch (error) {
      console.error('🚨 App: CollapsibleManager initialization failed:', error);
      // Non-critical failure - continue without modern collapsible
    }
  }
  
  /**
   * Initialize search manager for global sidebar search
   * @private
   */
  async initSearchManager() {
    try {
      const searchContainer = document.querySelector('.search-container') || 
                             document.querySelector('#globalSidebarSearch')?.parentElement;
      
      if (!searchContainer) {
        console.warn('⚠️ App: No search container found for SearchManager');
        return;
      }

      const searchManager = new SearchManager(searchContainer, {
        debounceDelay: 300,
        maxResults: 10,
        highlightDuration: 2000,
        enableKeyboardNavigation: true
      });

      await searchManager.init();
      
      this.registerComponent('searchManager', searchManager);
      console.log('🔍 App: SearchManager initialized');

      // Set up integration with collapsible manager
      const collapsibleManager = this.getComponent('collapsibleManager');
      if (collapsibleManager) {
        // Listen for search results that need section expansion
        globalEventBus.on('search:selected', ({ category }) => {
          console.log(`🔍 App: Expanding section ${category} for search result`);
        });
      }

    } catch (error) {
      console.error('🚨 App: SearchManager initialization failed:', error);
      // Non-critical failure - continue without modern search
    }
  }
  
  /**
   * Initialize ActiveListManager with modern state synchronization
   * @private
   */
  initActiveListManager() {
    try {
      console.log('📋 App: Initializing ActiveListManager...');
      
      // Find the All Active section container
      const activeListContainer = document.querySelector('.collapsible-section[data-category="all-active"]');
      if (!activeListContainer) {
        console.warn('⚠️ App: All Active section container not found, skipping ActiveListManager');
        return;
      }

      // Initialize ActiveListManager with state coordination
      this.activeListManager = new ActiveListManager(activeListContainer, {
        stateManager: this.stateManager,
        eventBus: globalEventBus,
        weatherApiKey: 'your-api-key-here', // TODO: Configure in production
        enableWeather: true,
        enableBulkOperations: true,
        enableAccessibility: true
      });

      console.log('✅ App: ActiveListManager initialized successfully');

      // Listen for active list events and coordinate with other components
      globalEventBus.on('activeList:updated', (data) => {
        console.log(`📋 App: Active list updated with ${data.count} items`);
      });

      globalEventBus.on('activeList:weatherUpdated', (data) => {
        console.log(`🌤️ App: Weather updated for ${data.location}: ${data.condition}`);
      });

    } catch (error) {
      console.error('🚨 App: ActiveListManager initialization failed:', error);
      // Non-critical failure - continue without modern active list management
    }
  }
  
  /**
   * Initialize MobileDocsNavManager for enhanced mobile documentation navigation
   * @private
   */
  initMobileDocsNavManager() {
    try {
      console.log('📱 App: Initializing MobileDocsNavManager...');
      
      // Find the docs content container
      const docsContainer = document.querySelector('.docs-content') || document.body;
      
      // Initialize MobileDocsNavManager with responsive behavior
      this.mobileDocsNavManager = new MobileDocsNavManager(docsContainer, {
        stateManager: this.stateManager,
        eventBus: globalEventBus,
        mobileBreakpoint: 768,
        enableGestures: true,
        enableAccessibility: true,
        enableHaptics: true
      });

      console.log('✅ App: MobileDocsNavManager initialized successfully');

      // Listen for mobile navigation events
      globalEventBus.on('mobileDocsNav:navigationClick', (data) => {
        console.log(`📱 App: Mobile docs navigation to ${data.docSlug}: ${data.title}`);
      });

      globalEventBus.on('mobileDocsNav:mobileStateChanged', (data) => {
        console.log(`📱 App: Mobile state changed: ${data.isMobile} (${data.width}px)`);
      });

    } catch (error) {
      console.error('🚨 App: MobileDocsNavManager initialization failed:', error);
      // Non-critical failure - continue without modern mobile docs navigation
    }
  }
  
  /**
   * Set up mobile-specific enhancements
   * @private
   */
  setupMobileEnhancements() {
    // Listen for docs opening to set up mobile navigation
    globalEventBus.on('app:docsLoaded', () => {
      this.setupMobileDocumentationMenu();
    });
    
    // Also listen for direct docs-opened events
    window.addEventListener('docs-opened', () => {
      setTimeout(() => this.setupMobileDocumentationMenu(), 100);
    });
  }
  
  /**
   * Handle docs opened event
   * @param {Object} detail - Event detail
   * @private
   */
  handleDocsOpened(detail) {
    console.log('📚 App: Handling docs opened:', detail);
    
    const deviceContext = stateManager.get('deviceContext');
    if (deviceContext && deviceContext.isMobile) {
      this.setupMobileDocumentationMenu();
    }
  }
  
  /**
   * Set up mobile documentation hamburger menu
   * @private
   */
  async setupMobileDocumentationMenu() {
    const deviceContext = stateManager.get('deviceContext');
    if (!deviceContext || !deviceContext.isMobile) {
      return; // Only for mobile
    }
    
    try {
      // Check if already created
      if (this.components.has('mobileDocsMenu')) {
        console.log('🍔 App: Mobile docs menu already exists');
        return;
      }
      
      const docsContent = document.querySelector('.docs-content');
      if (!docsContent) {
        console.log('⚠️ App: No docs content found for mobile menu');
        return;
      }
      
      console.log('🍔 App: Creating mobile documentation menu...');
      
      // Extract navigation items from existing TOC
      const navItems = this.extractDocumentationNavItems();
      if (navItems.length === 0) {
        console.log('⚠️ App: No navigation items found');
        return;
      }
      
      // Create container for hamburger menu
      const menuContainer = document.createElement('div');
      menuContainer.className = 'modern-mobile-docs-menu';
      menuContainer.style.cssText = `
        margin-bottom: 1rem;
        position: relative;
        z-index: 100;
      `;
      
      // Insert at top of docs content
      docsContent.insertBefore(menuContainer, docsContent.firstElementChild);
      
      // Create hamburger menu
      const hamburgerMenu = await HamburgerMenu.create(menuContainer, {
        position: 'top-left',
        items: navItems,
        menuTitle: '📚 Documentation',
        closeOnSelect: true,
        backgroundColor: '#1976d2',
        buttonSize: '44px'
      });
      
      // Store component
      this.components.set('mobileDocsMenu', hamburgerMenu);
      
      // Register with legacy bridge if available
      if (legacyBridge) {
        legacyBridge.registerModernComponent('MobileDocsMenu', hamburgerMenu, {
          updateNavigation: () => {
            const items = this.extractDocumentationNavItems();
            hamburgerMenu.updateItems(items);
          }
        });
      }
      
      // Remove legacy mobile nav to avoid conflicts
      this.removeLegacyMobileNav();
      
      // Set up event handlers
      hamburgerMenu.on('hamburger:itemClick', ({ item }) => {
        console.log(`📖 App: Navigating to ${item.label}`);
        
        // Haptic feedback if available
        if (window.NativeFeatures && window.NativeFeatures.hapticFeedback) {
          window.NativeFeatures.hapticFeedback('light');
        }
      });
      
      console.log('✅ App: Mobile documentation menu created successfully');
      
    } catch (error) {
      console.error('🚨 App: Failed to create mobile docs menu:', error);
    }
  }
  
  /**
   * Extract documentation navigation items from existing TOC
   * @returns {Array} Navigation items
   * @private
   */
  extractDocumentationNavItems() {
    const items = [];
    const tocLinks = document.querySelectorAll('.docs-toc a[data-doc]');
    
    tocLinks.forEach((link) => {
      const docSlug = link.getAttribute('data-doc');
      const label = link.textContent.trim();
      const isActive = link.classList.contains('active');
      
      items.push({
        id: docSlug,
        label: label,
        href: link.href,
        active: isActive,
        action: () => {
          // Use existing legacy navigation
          link.click();
        }
      });
    });
    
    console.log(`🔗 App: Extracted ${items.length} documentation navigation items`);
    return items;
  }
  
  /**
   * Remove legacy mobile navigation elements
   * @private
   */
  removeLegacyMobileNav() {
    // Remove legacy mobile menu elements
    const legacyMenus = document.querySelectorAll('.docs-mobile-menu-container');
    legacyMenus.forEach(menu => {
      console.log('🗑️ App: Removing legacy mobile menu element');
      menu.remove();
    });
    
    // Disable legacy mobile nav system if available
    if (window.MobileDocsNav && window.MobileDocsNav.removeMobileElements) {
      window.MobileDocsNav.removeMobileElements();
    }
  }
  
  /**
   * Set up global event listeners
   * @private
   */
  setupGlobalEvents() {
    // Handle window resize with throttling
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const context = window.DeviceContext ? window.DeviceContext.getContext() : null;
        if (context) {
          stateManager.set('deviceContext', context);
        }
        globalEventBus.emit('app:resize', { 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
      }, 250);
    });
    
    // Handle visibility change for PWA lifecycle
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      stateManager.set('appVisible', isVisible);
      globalEventBus.emit('app:visibilityChange', { visible: isVisible });
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }
  
  /**
   * Handle application errors
   * @param {Error} error - Error to handle
   * @private
   */
  handleError(error) {
    console.error('🚨 App: Handling error:', error);
    
    // Store error in state
    stateManager.set('lastError', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Emit error event
    globalEventBus.emit('app:error', { error });
    
    // Show user-friendly error if UI is available
    if (window.ErrorUI) {
      window.ErrorUI.showError('Application Error', error.message);
    }
  }
  
  /**
   * Fallback to legacy system when modern system fails
   * @param {Error} error - The error that caused the fallback
   * @private
   */
  async fallbackToLegacy(error) {
    console.warn('🔄 App: Falling back to legacy system due to:', error.message);
    
    try {
      // Mark modern system as disabled
      window.useModernSystem = false;
      
      // Destroy any partially initialized modern components
      this.destroy();
      
      // Load legacy bootstrap if not already loaded
      if (!window.AppBootstrap) {
        const script = document.createElement('script');
        script.src = 'js/bootstrap.js';
        script.onload = () => {
          console.log('✅ App: Legacy system loaded as fallback');
        };
        script.onerror = () => {
          console.error('🚨 App: Failed to load legacy system fallback');
        };
        document.head.appendChild(script);
      } else {
        // Legacy is already loaded, just initialize it
        console.log('🤝 App: Legacy system already available, using as fallback');
      }
      
    } catch (fallbackError) {
      console.error('🚨 App: Fallback to legacy also failed:', fallbackError);
    }
  }
  
  /**
   * Get application state
   * @returns {Object} Current application state
   */
  getState() {
    // Fallback for test environment where stateManager might not be initialized
    if (stateManager && typeof stateManager.getState === 'function') {
      return stateManager.getState();
    }
    return {}; // Return empty state object for testing
  }
  
  /**
   * Get component by name
   * @param {string} name - Component name
   * @returns {Object|null} Component instance
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }
  
  /**
   * Register a component
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   */
  registerComponent(name, component) {
    this.components.set(name, component);
    globalEventBus.emit('app:componentRegistered', { name, component });
  }
  
  /**
   * Check if the modern system is initialized and ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Destroy the application and clean up resources
   */
  destroy() {
    if (!this.initialized) {
      return;
    }
    
    console.log('🔄 App: Shutting down modern system...');
    
    // Destroy all components
    this.components.forEach((component, name) => {
      try {
        if (component.destroy) {
          component.destroy();
        }
      } catch (error) {
        console.error(`🚨 App: Error destroying component ${name}:`, error);
      }
    });
    
    this.components.clear();
    
    // Clean up router
    if (docsRouter) {
      docsRouter.destroy();
    }
    
    // Clean up state manager
    if (stateManager) {
      stateManager.removeAllListeners();
    }
    
    // Clean up global event bus
    if (globalEventBus) {
      globalEventBus.removeAllListeners();
    }
    
    this.initialized = false;
    
    console.log('✅ App: Modern system shutdown complete');
  }
}

// Create and export app instance
export const app = new App();

// Auto-initialize only if not in test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  try {
    app.init().catch((error) => {
      console.error('🚨 Modern system initialization failed completely:', error);
      // The error handling in init() should have already triggered fallback
    });
  } catch (error) {
    console.error('🚨 Modern system failed to start:', error);
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ModernApp = app;
}

console.log('🚀 WeeWoo Map Friend: Modern ES module system loaded');