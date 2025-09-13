/**
 * @module modules/UIManager
 * Modern ES6-based UI management for WeeWoo Map Friend
 * Coordinates all UI components and provides unified interface
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { collapsibleManager } from './CollapsibleManager.js';
import { searchManager } from './SearchManager.js';
import { fabManager } from './FABManager.js';
// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * @class UIManager
 * Coordinates all UI components and provides unified management
 */
export class UIManager {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.uiState = new Map();
    this.responsiveBreakpoints = new Map();
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Bind methods
    this.init = this.init.bind(this);
    this.initComponents = this.initComponents.bind(this);
    this.setupResponsiveHandling = this.setupResponsiveHandling.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.updateUIState = this.updateUIState.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    this.logger.info('UI management system initialized', {
      operation: 'constructor',
      components: this.components.size,
      uiState: this.uiState.size,
      responsiveBreakpoints: this.responsiveBreakpoints.size
    });
  }
  
  /**
   * Initialize the UI manager
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }
    
    const timer = this.logger.time('ui-manager-initialization');
    try {
      this.logger.info('Starting initialization', {
        operation: 'init',
        components: this.components.size,
        uiState: this.uiState.size
      });
      
      // Set up responsive handling
      this.setupResponsiveHandling();
      
      // Initialize UI components
      await this.initComponents();
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Initialize UI state
      this.initializeUIState();
      
      this.initialized = true;
      timer.end({
        success: true,
        components: this.components.size,
        uiState: this.uiState.size
      });
      this.logger.info('UI management system ready');
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        components: this.components.size
      });
      this.logger.error('Failed to initialize', {
        operation: 'init',
        error: error.message,
        stack: error.stack,
        components: this.components.size
      });
      throw error;
    }
  }
  
  /**
   * Initialize all UI components
   */
  async initComponents() {
    this.logger.info('Initializing UI components', {
      operation: 'initComponents',
      availableComponents: ['collapsible', 'search', 'fab']
    });
    
    const componentPromises = [];
    
    // Initialize collapsible manager
    if (collapsibleManager && typeof collapsibleManager.init === 'function') {
      componentPromises.push(
        collapsibleManager.init().then(() => {
          this.components.set('collapsible', collapsibleManager);
          this.logger.info('Collapsible manager ready');
        }).catch(error => {
          this.logger.error('Collapsible manager failed', {
            operation: 'initComponents',
            component: 'collapsible',
            error: error.message,
            stack: error.stack
          });
        })
      );
    }
    
    // Initialize search manager
    if (searchManager && typeof searchManager.init === 'function') {
      componentPromises.push(
        searchManager.init().then(() => {
          this.components.set('search', searchManager);
          this.logger.info('Search manager ready');
        }).catch(error => {
          this.logger.error('Search manager failed', {
            operation: 'initComponents',
            component: 'search',
            error: error.message,
            stack: error.stack
          });
        })
      );
    }
    
    // Initialize FAB manager
    if (fabManager && typeof fabManager.init === 'function') {
      componentPromises.push(
        fabManager.init().then(() => {
          this.components.set('fab', fabManager);
          this.logger.info('FAB manager ready');
        }).catch(error => {
          this.logger.error('FAB manager failed', {
            operation: 'initComponents',
            component: 'fab',
            error: error.message,
            stack: error.stack
          });
        })
      );
    }
    
    // Wait for all components to initialize
    await Promise.allSettled(componentPromises);
    
    this.logger.info('All UI components initialized');
  }
  
  /**
   * Set up responsive handling
   */
  setupResponsiveHandling() {
    // Define responsive breakpoints
    this.responsiveBreakpoints.set('mobile', 768);
    this.responsiveBreakpoints.set('tablet', 1024);
    this.responsiveBreakpoints.set('desktop', 1440);
    
    // Set up resize handler with debouncing
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial call
    this.handleResize();
    
    this.logger.info('Responsive handling setup complete', {
      operation: 'setupResponsiveHandling',
      breakpoints: Array.from(this.responsiveBreakpoints.keys()),
      debounceDelay: 250
    });
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determine current breakpoint
    let currentBreakpoint = 'desktop';
    for (const [breakpoint, minWidth] of this.responsiveBreakpoints.entries()) {
      if (width < minWidth) {
        currentBreakpoint = breakpoint;
        break;
      }
    }
    
    // Update UI state
    this.updateUIState('breakpoint', currentBreakpoint);
    this.updateUIState('dimensions', { width, height });
    
    // Emit responsive change event
    globalEventBus.emit('ui:responsiveChange', {
      breakpoint: currentBreakpoint,
      width,
      height
    });
    
    // Update component positions if needed
    this.updateComponentPositions(currentBreakpoint);
  }
  
  /**
   * Update component positions based on breakpoint
   */
  updateComponentPositions(breakpoint) {
    // Update FAB positions
    if (fabManager && fabManager.updatePositions) {
      fabManager.updatePositions();
    }
    
    // Update other component positions as needed
    this.components.forEach((component, name) => {
      if (component.updatePosition && typeof component.updatePosition === 'function') {
        component.updatePosition(breakpoint);
      }
    });
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for UI state changes
    globalEventBus.on('ui:stateChange', ({ component, state }) => {
      this.updateUIState(component, state);
    });
    
    // Listen for component ready events
    globalEventBus.on('ui:componentReady', ({ component, instance }) => {
      this.components.set(component, instance);
      this.logger.info('Component ready', {
        operation: 'setupEventListeners',
        component,
        totalComponents: this.components.size,
        hasInstance: !!instance
      });
    });
    
    // Listen for device context changes
    globalEventBus.on('device:breakpointChange', ({ newBreakpoint }) => {
      this.updateUIState('breakpoint', newBreakpoint);
      this.updateComponentPositions(newBreakpoint);
    });
    
    // Listen for orientation changes
    globalEventBus.on('device:orientationChange', ({ newOrientation }) => {
      this.updateUIState('orientation', newOrientation);
      this.handleOrientationChange(newOrientation);
    });
  }
  
  /**
   * Handle orientation change
   */
  handleOrientationChange(orientation) {
    // Update component layouts for orientation
    this.components.forEach((component, name) => {
      if (component.handleOrientationChange && typeof component.handleOrientationChange === 'function') {
        component.handleOrientationChange(orientation);
      }
    });
    
    // Emit UI orientation change event
    globalEventBus.emit('ui:orientationChange', { orientation });
  }
  
  /**
   * Initialize UI state
   */
  initializeUIState() {
    // Initialize with current values
    this.updateUIState('breakpoint', this.getCurrentBreakpoint());
    this.updateUIState('dimensions', {
      width: window.innerWidth,
      height: window.innerHeight
    });
    this.updateUIState('orientation', window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    this.updateUIState('components', Array.from(this.components.keys()));
    
    this.logger.info('UI state initialized', {
      operation: 'initializeUIState',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      components: Array.from(this.components.keys()),
      uiStateKeys: Array.from(this.uiState.keys())
    });
  }
  
  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    for (const [breakpoint, minWidth] of this.responsiveBreakpoints.entries()) {
      if (width < minWidth) {
        return breakpoint;
      }
    }
    return 'desktop';
  }
  
  /**
   * Update UI state
   */
  updateUIState(key, value) {
    this.uiState.set(key, value);
    
    // Emit state change event
    globalEventBus.emit('ui:stateUpdated', { key, value });
    
    // Store in state manager for other components
    stateManager.set(`ui.${key}`, value);
  }
  
  /**
   * Get UI state
   */
  getUIState(key) {
    return this.uiState.get(key);
  }
  
  /**
   * Get all UI state
   */
  getAllUIState() {
    const state = {};
    for (const [key, value] of this.uiState.entries()) {
      state[key] = value;
    }
    return state;
  }
  
  /**
   * Get component by name
   */
  getComponent(name) {
    return this.components.get(name);
  }
  
  /**
   * Get all components
   */
  getAllComponents() {
    return Array.from(this.components.entries());
  }
  
  /**
   * Show all UI components
   */
  showAll() {
    this.components.forEach((component, name) => {
      if (component.show && typeof component.show === 'function') {
        component.show();
      }
    });
  }
  
  /**
   * Hide all UI components
   */
  hideAll() {
    this.components.forEach((component, name) => {
      if (component.hide && typeof component.hide === 'function') {
        component.hide();
      }
    });
  }
  
  /**
   * Refresh all UI components
   */
  refreshAll() {
    this.components.forEach((component, name) => {
      if (component.refresh && typeof component.refresh === 'function') {
        component.refresh();
      }
    });
  }
  
  /**
   * Get UI manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalComponents: this.components.size,
      componentNames: Array.from(this.components.keys()),
      uiState: this.getAllUIState(),
      responsiveBreakpoints: Object.fromEntries(this.responsiveBreakpoints),
      currentBreakpoint: this.getCurrentBreakpoint()
    };
  }
  
  /**
   * Check if UI manager is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Cleanup UI manager resources
   */
  async cleanup() {
    this.logger.info('Cleaning up UIManager resources');
    
    try {
      // Clear resize timeout
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = null;
      }
      
      // Clear components
      this.components.clear();
      
      // Reset state
      this.initialized = false;
      this.responsiveBreakpoints.clear();
      
      this.logger.info('UIManager cleanup completed');
    } catch (error) {
      this.logger.error('UIManager cleanup failed', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const uiManager = () => {
  console.warn('uiManager: Legacy function called. Use DI container to get UIManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UIManager instance.');
};

// Export for legacy compatibility
// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
