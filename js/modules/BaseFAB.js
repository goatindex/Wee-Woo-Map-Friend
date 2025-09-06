/**
 * @fileoverview Modern BaseFAB Component
 * Abstract base class for all FAB (Floating Action Button) components
 * Provides lifecycle, state, and DOM management with modern ES6 patterns
 */

import { logger } from './StructuredLogger.js';

/**
 * @class BaseFAB
 * Abstract base class for all FAB components
 * Provides lifecycle, state, and DOM management
 */
export class BaseFAB {
  /**
   * Create BaseFAB instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = Object.assign(this.getDefaultConfig(), config);
    this.isInitialized = false;
    this.observers = [];
    this.eventListeners = [];
    this.dom = this.config.dom || document;
    this.storage = this.config.storage || window.localStorage;
    this.id = this.config.id || null;
    
    // Create logger instance
    this.logger = logger.createChild({ 
      module: 'BaseFAB',
      fabId: this.id 
    });
    
    this.logger.info('BaseFAB instance created', {
      id: this.id,
      config: this.config
    });
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      id: null,
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      zIndex: 9999,
      icon: '☰',
      ariaLabel: 'Floating Action Button',
      ariaControls: null,
      ariaExpanded: 'true',
      title: 'FAB',
      className: 'fab',
      style: {},
    };
  }

  /**
   * Initialize the FAB component
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      this.logger.warn('BaseFAB already initialized', { id: this.id });
      return;
    }
    
    this.logger.info('Initializing BaseFAB', {
      id: this.id,
      config: this.config
    });
    
    try {
      await this.createElement();
      this.addEventListeners();
      this.isInitialized = true;
      
      this.logger.info('BaseFAB initialization complete', {
        id: this.id,
        isInitialized: this.isInitialized
      });
      
    } catch (error) {
      this.logger.error('BaseFAB initialization failed', {
        id: this.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create the FAB button element
   * @returns {Promise<void>}
   * @private
   */
  async createElement() {
    this.logger.debug('Creating FAB button element', {
      id: this.id,
      className: this.config.className,
      icon: this.config.icon
    });
    
    this.button = this.dom.createElement('button');
    this.button.id = this.id || '';
    this.button.className = this.config.className;
    this.button.textContent = this.config.icon;
    this.button.setAttribute('aria-label', this.config.ariaLabel);
    
    if (this.config.ariaControls) {
      this.button.setAttribute('aria-controls', this.config.ariaControls);
    }
    
    this.button.setAttribute('aria-expanded', this.config.ariaExpanded);
    this.button.title = this.config.title;
    
    // Apply styles
    Object.assign(this.button.style, {
      position: this.config.position,
      top: this.config.top,
      right: this.config.right,
      width: this.config.width,
      height: this.config.height,
      zIndex: this.config.zIndex,
      ...this.config.style,
    });
    
    // Add to DOM
    this.dom.body.appendChild(this.button);
    
    this.logger.debug('FAB button element created and appended', {
      id: this.id,
      elementExists: !!this.button,
      parentNode: this.button.parentNode ? this.button.parentNode.tagName : 'None'
    });
  }

  /**
   * Add event listeners to the FAB button
   * @private
   */
  addEventListeners() {
    // Click event
    const clickHandler = this.onClick.bind(this);
    this.button.addEventListener('click', clickHandler);
    this.eventListeners.push({ type: 'click', handler: clickHandler });
    
    // Keyboard support
    const keydownHandler = this.onKeyDown.bind(this);
    this.button.addEventListener('keydown', keydownHandler);
    this.eventListeners.push({ type: 'keydown', handler: keydownHandler });
    
    this.logger.debug('Event listeners added', {
      id: this.id,
      listenerCount: this.eventListeners.length
    });
  }

  /**
   * Remove all event listeners
   * @private
   */
  removeEventListeners() {
    this.eventListeners.forEach(({ type, handler }) => {
      this.button.removeEventListener(type, handler);
    });
    this.eventListeners = [];
    
    this.logger.debug('Event listeners removed', {
      id: this.id,
      removedCount: this.eventListeners.length
    });
  }

  /**
   * Handle click events
   * @param {Event} e - Click event
   */
  onClick(e) {
    this.logger.debug('FAB clicked', {
      id: this.id,
      event: e.type
    });
    
    // To be overridden by subclasses
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.onClick(e);
    }
  }

  /**
   * Save state to storage
   * @param {string} key - Storage key
   * @param {*} value - Value to save
   */
  saveState(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      this.logger.debug('State saved', {
        id: this.id,
        key: key,
        value: value
      });
    } catch (error) {
      this.logger.warn('Failed to save state', {
        id: this.id,
        key: key,
        error: error.message
      });
    }
  }

  /**
   * Load state from storage
   * @param {string} key - Storage key
   * @returns {*} Loaded value or null
   */
  loadState(key) {
    try {
      const value = this.storage.getItem(key);
      const parsed = value ? JSON.parse(value) : null;
      
      this.logger.debug('State loaded', {
        id: this.id,
        key: key,
        value: parsed
      });
      
      return parsed;
    } catch (error) {
      this.logger.warn('Failed to load state', {
        id: this.id,
        key: key,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Update FAB configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = Object.assign(this.config, newConfig);
    
    this.logger.info('Configuration updated', {
      id: this.id,
      oldConfig: oldConfig,
      newConfig: this.config
    });
    
    // Re-render if initialized
    if (this.isInitialized) {
      this.destroy();
      this.init();
    }
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return {
      id: this.id,
      isInitialized: this.isInitialized,
      config: this.config,
      buttonExists: !!this.button,
      eventListenerCount: this.eventListeners.length
    };
  }

  /**
   * Destroy the FAB component
   */
  destroy() {
    this.logger.info('Destroying BaseFAB', {
      id: this.id,
      isInitialized: this.isInitialized
    });
    
    this.removeEventListeners();
    
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    
    this.isInitialized = false;
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    
    this.logger.info('BaseFAB destroyed', {
      id: this.id
    });
  }
}

// Export for legacy compatibility
// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details

// Module loaded - using StructuredLogger for initialization logging


