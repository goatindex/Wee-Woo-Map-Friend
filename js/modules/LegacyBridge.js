/**
 * @module modules/LegacyBridge
 * Bridge between modern ES module system and legacy window-based system
 * Provides backward compatibility and progressive migration capabilities
 */

/**
 * @class LegacyBridge
 * Facilitates communication between modern and legacy systems
 */
export class LegacyBridge {
  constructor() {
    this.modernComponents = new Map();
    this.legacyAdapters = new Map();
    this.migrationStatus = new Map();
    
    console.log('🌉 LegacyBridge: Initializing bridge system');
  }
  
  /**
   * Initialize the bridge system
   * @returns {Promise<void>}
   */
  async init() {
    // Expose bridge to window for legacy access
    window.LegacyBridge = this;
    
    // Set up legacy event listeners
    this.setupLegacyEventHandlers();
    
    // Initialize component migration tracking
    this.initializeMigrationTracking();
    
    console.log('🌉 LegacyBridge: Bridge initialized');
  }
  
  /**
   * Register a modern component for legacy compatibility
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   * @param {Object} legacyInterface - Legacy interface adapter
   */
  registerModernComponent(name, component, legacyInterface = {}) {
    this.modernComponents.set(name, component);
    
    // Create legacy interface
    const adapter = {
      component,
      legacyInterface,
      modernMethods: this.extractPublicMethods(component),
      legacyMethods: legacyInterface
    };
    
    this.legacyAdapters.set(name, adapter);
    
    // Expose to window for legacy access
    window[name] = this.createLegacyWrapper(adapter);
    
    console.log(`🌉 LegacyBridge: Registered modern component '${name}' with legacy interface`);
  }
  
  /**
   * Create a legacy-compatible wrapper for a modern component
   * @param {Object} adapter - Component adapter
   * @returns {Object} Legacy wrapper
   */
  createLegacyWrapper(adapter) {
    const { component, legacyInterface, modernMethods } = adapter;
    
    const wrapper = {
      // Expose modern component reference
      _modernComponent: component,
      
      // Legacy initialization method
      init: legacyInterface.init || (() => {
        console.log('🌉 LegacyBridge: Legacy init called for modern component');
        return component.init ? component.init() : Promise.resolve();
      }),
      
      // Legacy destroy method
      destroy: legacyInterface.destroy || (() => {
        console.log('🌉 LegacyBridge: Legacy destroy called for modern component');
        return component.destroy ? component.destroy() : undefined;
      })
    };
    
    // Add modern methods to wrapper
    Object.keys(modernMethods).forEach(methodName => {
      if (!wrapper[methodName]) {
        wrapper[methodName] = modernMethods[methodName].bind(component);
      }
    });
    
    // Add custom legacy methods
    Object.keys(legacyInterface).forEach(methodName => {
      wrapper[methodName] = legacyInterface[methodName].bind(component);
    });
    
    return wrapper;
  }
  
  /**
   * Extract public methods from a component
   * @param {Object} component - Component instance
   * @returns {Object} Public methods
   */
  extractPublicMethods(component) {
    const methods = {};
    const proto = Object.getPrototypeOf(component);
    
    Object.getOwnPropertyNames(proto).forEach(name => {
      if (name !== 'constructor' && 
          typeof component[name] === 'function' && 
          !name.startsWith('_') && 
          !name.startsWith('handle')) {
        methods[name] = component[name];
      }
    });
    
    return methods;
  }
  
  /**
   * Migrate a legacy component to modern system
   * @param {string} legacyName - Legacy component name
   * @param {Function} ModernComponent - Modern component class
   * @param {Object} migrationConfig - Migration configuration
   * @returns {Promise<Object>} Modern component instance
   */
  async migrateComponent(legacyName, ModernComponent, migrationConfig = {}) {
    console.log(`🔄 LegacyBridge: Starting migration of '${legacyName}' to modern system`);
    
    // Check if legacy component exists
    const legacyComponent = window[legacyName];
    if (!legacyComponent) {
      console.warn(`🚨 LegacyBridge: Legacy component '${legacyName}' not found`);
      return null;
    }
    
    // Extract legacy state and configuration
    const legacyState = this.extractLegacyState(legacyComponent, migrationConfig);
    
    // Create modern component with migrated state
    const modernComponent = await this.createModernComponent(
      ModernComponent, 
      legacyState, 
      migrationConfig
    );
    
    // Set up bidirectional communication
    this.setupBidirectionalSync(legacyComponent, modernComponent, migrationConfig);
    
    // Mark migration as complete
    this.migrationStatus.set(legacyName, {
      legacy: legacyComponent,
      modern: modernComponent,
      migrated: true,
      timestamp: new Date()
    });
    
    console.log(`✅ LegacyBridge: Successfully migrated '${legacyName}' to modern system`);
    
    return modernComponent;
  }
  
  /**
   * Extract state from legacy component
   * @param {Object} legacyComponent - Legacy component
   * @param {Object} config - Migration configuration
   * @returns {Object} Extracted state
   */
  extractLegacyState(legacyComponent, config) {
    const state = {};
    
    // Extract common properties
    const commonProps = ['options', 'settings', 'config', 'state', 'isOpen', 'isActive'];
    commonProps.forEach(prop => {
      if (legacyComponent[prop] !== undefined) {
        state[prop] = legacyComponent[prop];
      }
    });
    
    // Extract custom properties defined in migration config
    if (config.stateMapping) {
      Object.keys(config.stateMapping).forEach(legacyProp => {
        const modernProp = config.stateMapping[legacyProp];
        if (legacyComponent[legacyProp] !== undefined) {
          state[modernProp] = legacyComponent[legacyProp];
        }
      });
    }
    
    console.log(`🔍 LegacyBridge: Extracted state from legacy component:`, state);
    
    return state;
  }
  
  /**
   * Create modern component with migrated state
   * @param {Function} ModernComponent - Modern component class
   * @param {Object} legacyState - Extracted legacy state
   * @param {Object} config - Migration configuration
   * @returns {Promise<Object>} Modern component instance
   */
  async createModernComponent(ModernComponent, legacyState, config) {
    // Find or create container
    const container = config.container || 
                     document.querySelector(config.containerSelector) ||
                     document.createElement('div');
    
    // Merge legacy state with modern options
    const modernOptions = {
      ...legacyState.options,
      ...legacyState.settings,
      ...legacyState.config,
      ...config.modernOptions,
      autoInit: false // We'll initialize manually
    };
    
    // Create modern component
    const modernComponent = new ModernComponent(container, modernOptions);
    
    // Apply migrated state
    if (legacyState.state) {
      modernComponent.state = { ...modernComponent.state, ...legacyState.state };
    }
    
    // Initialize component
    await modernComponent.init();
    
    return modernComponent;
  }
  
  /**
   * Setup bidirectional synchronization between legacy and modern components
   * @param {Object} legacyComponent - Legacy component
   * @param {Object} modernComponent - Modern component
   * @param {Object} config - Migration configuration
   */
  setupBidirectionalSync(legacyComponent, modernComponent, config) {
    // Sync modern events to legacy
    if (config.eventMapping) {
      Object.keys(config.eventMapping).forEach(modernEvent => {
        const legacyEvent = config.eventMapping[modernEvent];
        
        modernComponent.on(modernEvent, (data) => {
          console.log(`🔄 LegacyBridge: Syncing modern event '${modernEvent}' to legacy '${legacyEvent}'`);
          
          // Trigger legacy event
          if (legacyComponent[legacyEvent]) {
            legacyComponent[legacyEvent](data);
          }
          
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent(legacyEvent, { detail: data }));
        });
      });
    }
    
    // Sync state changes
    modernComponent.on('component:stateChange', ({ newState }) => {
      if (config.stateSync && legacyComponent.updateState) {
        legacyComponent.updateState(newState);
      }
    });
  }
  
  /**
   * Setup legacy event handlers
   */
  setupLegacyEventHandlers() {
    // Listen for docs events
    window.addEventListener('docs-opened', (event) => {
      console.log('🌉 LegacyBridge: Docs opened event detected');
      this.handleDocsOpened(event);
    });
    
    window.addEventListener('docs-closed', (event) => {
      console.log('🌉 LegacyBridge: Docs closed event detected');
      this.handleDocsClosed(event);
    });
    
    // Listen for mobile navigation events
    window.addEventListener('mobile-nav-initialized', (event) => {
      console.log('🌉 LegacyBridge: Mobile nav initialized');
      this.handleMobileNavInitialized(event);
    });
  }
  
  /**
   * Handle docs opened event
   * @param {Event} event - Docs opened event
   */
  handleDocsOpened(event) {
    // Notify modern components
    const modernComponents = Array.from(this.modernComponents.values());
    modernComponents.forEach(component => {
      if (component.onDocsOpened) {
        component.onDocsOpened(event);
      }
    });
  }
  
  /**
   * Handle docs closed event
   * @param {Event} event - Docs closed event
   */
  handleDocsClosed(event) {
    // Notify modern components
    const modernComponents = Array.from(this.modernComponents.values());
    modernComponents.forEach(component => {
      if (component.onDocsClosed) {
        component.onDocsClosed(event);
      }
    });
  }
  
  /**
   * Handle mobile navigation initialized
   * @param {Event} event - Mobile nav event
   */
  handleMobileNavInitialized(event) {
    // Check if we should replace with modern hamburger menu
    const shouldReplace = this.shouldReplaceMobileNav();
    
    if (shouldReplace) {
      this.replaceLegacyMobileNav();
    }
  }
  
  /**
   * Check if legacy mobile nav should be replaced
   * @returns {boolean} Whether to replace legacy nav
   */
  shouldReplaceMobileNav() {
    // Check for modern hamburger menu component
    const modernHamburger = this.modernComponents.get('HamburgerMenu');
    
    // Check device capabilities
    const supportsModernFeatures = window.CSS && CSS.supports && CSS.supports('(--custom: property)');
    
    // Check user preference (could be from localStorage)
    const userPreference = localStorage.getItem('useModernNav') !== 'false';
    
    return modernHamburger && supportsModernFeatures && userPreference;
  }
  
  /**
   * Replace legacy mobile navigation with modern component
   */
  async replaceLegacyMobileNav() {
    console.log('🔄 LegacyBridge: Replacing legacy mobile nav with modern HamburgerMenu');
    
    try {
      // Get modern hamburger menu component
      const HamburgerMenu = (await import('../components/HamburgerMenu.js')).HamburgerMenu;
      
      // Extract legacy navigation items
      const legacyNavItems = this.extractLegacyNavItems();
      
      // Find documentation container
      const docsContent = document.querySelector('.docs-content');
      if (!docsContent) {
        console.warn('🚨 LegacyBridge: No docs content container found');
        return;
      }
      
      // Create modern hamburger menu
      const modernHamburger = await HamburgerMenu.create(docsContent, {
        position: 'top-left',
        items: legacyNavItems,
        menuTitle: '📚 Documentation',
        closeOnSelect: true
      });
      
      // Remove legacy mobile navigation
      this.removeLegacyMobileNav();
      
      // Register modern component
      this.registerModernComponent('ModernMobileNav', modernHamburger, {
        // Legacy interface methods
        setupDocsNavigation: () => modernHamburger.updateItems(this.extractLegacyNavItems()),
        highlightCurrentPage: (slug) => modernHamburger.setActiveItem(slug),
        onDocsOpen: () => modernHamburger.updateItems(this.extractLegacyNavItems())
      });
      
      console.log('✅ LegacyBridge: Successfully replaced legacy mobile nav with modern HamburgerMenu');
      
    } catch (error) {
      console.error('🚨 LegacyBridge: Failed to replace legacy mobile nav:', error);
    }
  }
  
  /**
   * Extract navigation items from legacy system
   * @returns {Array} Navigation items
   */
  extractLegacyNavItems() {
    const items = [];
    const tocLinks = document.querySelectorAll('.docs-toc a[data-doc]');
    
    tocLinks.forEach((link, index) => {
      items.push({
        id: link.getAttribute('data-doc'),
        label: link.textContent.trim(),
        href: link.href,
        active: link.classList.contains('active'),
        action: () => {
          // Trigger legacy navigation
          link.click();
          
          // Haptic feedback
          if (window.NativeFeatures) {
            window.NativeFeatures.hapticFeedback('light');
          }
        }
      });
    });
    
    console.log(`🔗 LegacyBridge: Extracted ${items.length} navigation items`);
    
    return items;
  }
  
  /**
   * Remove legacy mobile navigation elements
   */
  removeLegacyMobileNav() {
    // Remove legacy hamburger menu
    const legacyMenus = document.querySelectorAll('.docs-mobile-menu-container');
    legacyMenus.forEach(menu => menu.remove());
    
    // Disable legacy mobile nav
    if (window.MobileDocsNav) {
      window.MobileDocsNav.removeMobileElements();
    }
    
    console.log('🗑️ LegacyBridge: Removed legacy mobile navigation elements');
  }
  
  /**
   * Initialize migration tracking
   */
  initializeMigrationTracking() {
    // Track which components have been migrated
    this.migrationStatus.set('tracking', {
      totalComponents: 0,
      migratedComponents: 0,
      pendingMigrations: []
    });
    
    // Periodically report migration status
    setInterval(() => {
      this.reportMigrationStatus();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Report current migration status
   */
  reportMigrationStatus() {
    const migrated = Array.from(this.migrationStatus.entries())
                          .filter(([key, status]) => key !== 'tracking' && status.migrated);
    
    if (migrated.length > 0) {
      console.log(`📊 LegacyBridge: Migration Status - ${migrated.length} components migrated:`, 
                  migrated.map(([name]) => name));
    }
  }
  
  /**
   * Get migration status for a component
   * @param {string} componentName - Component name
   * @returns {Object|null} Migration status
   */
  getMigrationStatus(componentName) {
    return this.migrationStatus.get(componentName) || null;
  }
  
  /**
   * Check if a component has been migrated
   * @param {string} componentName - Component name
   * @returns {boolean} Whether component is migrated
   */
  isMigrated(componentName) {
    const status = this.getMigrationStatus(componentName);
    return status && status.migrated;
  }
}

// Export singleton instance
export const legacyBridge = new LegacyBridge();
