/**
 * @fileoverview Modern SidebarToggleFAB Component
 * FAB for toggling sidebar using modern ES6 patterns
 */

import { BaseFAB } from './BaseFAB.js';
import { fabManager } from './FABManager.js';

/**
 * @class SidebarToggleFAB
 * @extends BaseFAB
 * FAB for toggling sidebar visibility
 */
export class SidebarToggleFAB extends BaseFAB {
  /**
   * Create SidebarToggleFAB instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(Object.assign({
      id: 'sidebarToggle',
      className: 'fab fab-button',
      icon: '☰',
      ariaLabel: 'Toggle sidebar',
      ariaControls: 'layerMenu',
      ariaExpanded: 'true',
      title: 'Hide panel',
    }, config));
    
    this.sidebarMenu = null;
    this.isMinimized = false;
    
    this.logger.info('SidebarToggleFAB instance created', {
      id: this.id,
      config: this.config
    });
  }

  /**
   * Initialize the FAB component
   * @returns {Promise<void>}
   */
  async init() {
    await super.init();
    
    this.sidebarMenu = document.getElementById('layerMenu');
    
    if (!this.sidebarMenu) {
      this.logger.warn('Sidebar menu element not found', {
        id: this.id,
        targetId: 'layerMenu'
      });
    } else {
      this.logger.info('Sidebar menu element found', {
        id: this.id,
        sidebarExists: !!this.sidebarMenu
      });
    }
    
    this.restoreState();
  }

  /**
   * Handle click events
   * @param {Event} e - Click event
   */
  onClick(e) {
    this.logger.info('SidebarToggleFAB clicked', {
      id: this.id,
      currentState: this.isMinimized ? 'minimized' : 'expanded'
    });
    
    if (!this.sidebarMenu) {
      this.logger.warn('Cannot toggle sidebar - menu element not found');
      return;
    }
    
    this.toggleSidebar();
  }

  /**
   * Toggle sidebar visibility
   * @private
   */
  toggleSidebar() {
    this.isMinimized = this.sidebarMenu.classList.toggle('sidebar-minimized');
    
    // Update accessibility attributes
    try {
      this.sidebarMenu.inert = this.isMinimized;
    } catch (error) {
      this.logger.debug('Failed to set inert attribute', {
        error: error.message
      });
    }
    
    // Update button state
    this.updateButtonState();
    
    // Save state
    this.saveState('sidebarMinimized', this.isMinimized ? 1 : 0);
    
    this.logger.info('Sidebar toggled', {
      id: this.id,
      isMinimized: this.isMinimized
    });
    
    // Emit custom event for other components
    this.emitSidebarToggleEvent();
  }

  /**
   * Update button visual state
   * @private
   */
  updateButtonState() {
    if (!this.button) return;
    
    this.button.setAttribute('aria-expanded', this.isMinimized ? 'false' : 'true');
    this.button.title = this.isMinimized ? 'Show panel' : 'Hide panel';
    this.button.textContent = this.isMinimized ? '☰' : '→';
    
    this.logger.debug('Button state updated', {
      id: this.id,
      isMinimized: this.isMinimized,
      ariaExpanded: this.button.getAttribute('aria-expanded'),
      title: this.button.title
    });
  }

  /**
   * Emit sidebar toggle event
   * @private
   */
  emitSidebarToggleEvent() {
    const event = new CustomEvent('sidebar:toggled', {
      detail: {
        isMinimized: this.isMinimized,
        fabId: this.id
      }
    });
    
    document.dispatchEvent(event);
    
    this.logger.debug('Sidebar toggle event emitted', {
      isMinimized: this.isMinimized
    });
  }

  /**
   * Restore sidebar state from storage
   * @private
   */
  restoreState() {
    if (!this.sidebarMenu) return;
    
    const saved = this.loadState('sidebarMinimized');
    const computedStyle = getComputedStyle(document.documentElement);
    const mobileBreakpoint = parseInt(
      computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')
    ) || 768;
    
    // Determine if sidebar should be minimized
    const shouldMinimize = saved === 1 || (saved === null && window.innerWidth < mobileBreakpoint);
    
    this.logger.info('Restoring sidebar state', {
      id: this.id,
      savedState: saved,
      windowWidth: window.innerWidth,
      mobileBreakpoint: mobileBreakpoint,
      shouldMinimize: shouldMinimize
    });
    
    if (shouldMinimize) {
      this.minimizeSidebar();
    } else {
      this.expandSidebar();
    }
  }

  /**
   * Minimize the sidebar
   * @private
   */
  minimizeSidebar() {
    if (!this.sidebarMenu) return;
    
    this.sidebarMenu.classList.add('sidebar-minimized');
    this.isMinimized = true;
    
    try {
      this.sidebarMenu.inert = true;
    } catch (error) {
      this.logger.debug('Failed to set inert attribute', {
        error: error.message
      });
    }
    
    this.updateButtonState();
    
    this.logger.info('Sidebar minimized', {
      id: this.id
    });
  }

  /**
   * Expand the sidebar
   * @private
   */
  expandSidebar() {
    if (!this.sidebarMenu) return;
    
    this.sidebarMenu.classList.remove('sidebar-minimized');
    this.isMinimized = false;
    
    try {
      this.sidebarMenu.inert = false;
    } catch (error) {
      this.logger.debug('Failed to remove inert attribute', {
        error: error.message
      });
    }
    
    this.updateButtonState();
    
    this.logger.info('Sidebar expanded', {
      id: this.id
    });
  }

  /**
   * Set sidebar state programmatically
   * @param {boolean} minimized - Whether to minimize the sidebar
   */
  setSidebarState(minimized) {
    this.logger.info('Setting sidebar state programmatically', {
      id: this.id,
      minimized: minimized,
      currentState: this.isMinimized
    });
    
    if (minimized === this.isMinimized) {
      this.logger.debug('Sidebar already in requested state');
      return;
    }
    
    if (minimized) {
      this.minimizeSidebar();
    } else {
      this.expandSidebar();
    }
    
    // Save state
    this.saveState('sidebarMinimized', this.isMinimized ? 1 : 0);
  }

  /**
   * Get current sidebar state
   * @returns {boolean} Whether sidebar is minimized
   */
  isSidebarMinimized() {
    return this.isMinimized;
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    const state = super.getState();
    
    return {
      ...state,
      type: 'SidebarToggleFAB',
      isMinimized: this.isMinimized,
      sidebarExists: !!this.sidebarMenu
    };
  }

  /**
   * Destroy the FAB component
   */
  destroy() {
    this.logger.info('Destroying SidebarToggleFAB', {
      id: this.id
    });
    
    super.destroy();
    
    this.sidebarMenu = null;
    this.isMinimized = false;
  }
}

// Register with FABManager
fabManager.register('sidebarToggle', SidebarToggleFAB);

// Export for legacy compatibility
// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details

// Module loaded - using StructuredLogger for initialization logging


