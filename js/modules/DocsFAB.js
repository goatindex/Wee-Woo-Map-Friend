/**
 * @fileoverview Modern DocsFAB Component
 * FAB for documentation navigation using modern ES6 patterns
 */

import { BaseFAB } from './BaseFAB.js';
import { fabManager } from './FABManager.js';

/**
 * @class DocsFAB
 * @extends BaseFAB
 * FAB for documentation navigation
 */
export class DocsFAB extends BaseFAB {
  /**
   * Create DocsFAB instance
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    super(Object.assign({
      id: 'docsFab',
      className: 'fab fab-button',
      icon: '📄',
      ariaLabel: 'Open documentation',
      title: 'Docs',
    }, config));
    
    this.logger.info('DocsFAB instance created', {
      id: this.id,
      config: this.config
    });
  }

  /**
   * Handle click events
   * @param {Event} e - Click event
   */
  onClick(e) {
    this.logger.info('DocsFAB clicked', {
      id: this.id
    });
    
    try {
      // Try to use modern AppBootstrap first
      if (window.AppBootstrap && typeof window.AppBootstrap.openDocs === 'function') {
        this.logger.debug('Using AppBootstrap.openDocs');
        window.AppBootstrap.openDocs('intro');
      } 
      // Fallback to legacy method
      else if (window.openDocs && typeof window.openDocs === 'function') {
        this.logger.debug('Using legacy openDocs');
        window.openDocs('intro');
      }
      // Fallback to direct navigation
      else {
        this.logger.warn('No docs opening method found, using fallback');
        this.openDocsFallback();
      }
      
    } catch (error) {
      this.logger.error('Failed to open documentation', {
        error: error.message,
        stack: error.stack
      });
      
      // Show user-friendly error
      this.showError('Failed to open documentation');
    }
  }

  /**
   * Fallback method to open documentation
   * @private
   */
  openDocsFallback() {
    this.logger.info('Using fallback documentation opening method');
    
    // Try to find docs container and show it
    const docsContainer = document.querySelector('.docs-container') || 
                         document.querySelector('#docs') ||
                         document.querySelector('.documentation');
    
    if (docsContainer) {
      docsContainer.style.display = 'block';
      docsContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Last resort: show alert
      alert('Documentation feature is not available. Please check if the documentation system is properly loaded.');
    }
  }

  /**
   * Show error message to user
   * @param {string} message - Error message
   * @private
   */
  showError(message) {
    // Create temporary error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  /**
   * Update FAB state based on documentation status
   * @param {boolean} isOpen - Whether documentation is open
   */
  updateState(isOpen) {
    this.logger.debug('Updating DocsFAB state', {
      id: this.id,
      isOpen: isOpen
    });
    
    if (this.button) {
      this.button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      this.button.title = isOpen ? 'Close documentation' : 'Open documentation';
      this.button.textContent = isOpen ? '✕' : '📄';
    }
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    const state = super.getState();
    
    return {
      ...state,
      type: 'DocsFAB',
      isDocumentationOpen: this.button?.getAttribute('aria-expanded') === 'true'
    };
  }
}

// Register with FABManager
fabManager.register('docsFab', DocsFAB);

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.DocsFAB = DocsFAB;
}

console.log('🎯 DocsFAB: Modern ES6 module loaded');


