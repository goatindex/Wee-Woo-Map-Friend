/**
 * @fileoverview Error UI utilities for sidebar error messaging and online/offline notifications
 * @module ErrorUI
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';

/**
 * Error UI utility for displaying dismissible error messages and handling online/offline states
 */
@injectable()
export class ErrorUI extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger
  ) {
    super(structuredLogger);
    this.errorMessages = new Set(); // Track active error messages
    this.isOfflineListenerSetup = false;
    
    this.logger.info('ErrorUI initialized');
  }

  /**
   * Show a dismissible error message in the sidebar
   * @param {string} message - Error message to display
   * @param {Object} options - Display options
   * @param {string} options.type - Error type ('error', 'warning', 'info')
   * @param {number} options.autoHide - Auto-hide after milliseconds (0 = no auto-hide)
   * @param {string} options.id - Unique ID for the message (prevents duplicates)
   */
  showSidebarError(message, options = {}) {
    const {
      type = 'error',
      autoHide = 0,
      id = null
    } = options;

    const sidebar = document.getElementById('layerMenu');
    if (!sidebar) {
      this.logger.warn('Sidebar element not found, cannot display error message', {
        message,
        type
      });
      return;
    }

    // Prevent duplicate messages if ID is provided
    if (id && this.errorMessages.has(id)) {
      this.logger.debug('Duplicate error message prevented', { id, message });
      return;
    }

    const timer = this.logger.time('error-message-display');
    
    try {
      const errMsg = document.createElement('div');
      errMsg.className = `error-message error-message--${type}`;
      
      // Set styles based on type
      const styles = this.getErrorStyles(type);
      Object.assign(errMsg.style, styles);
      
      errMsg.textContent = message;
      
      // Add close button
      const closeBtn = this.createCloseButton(type);
      closeBtn.onclick = () => this.removeErrorMessage(errMsg, id);
      errMsg.appendChild(closeBtn);
      
      // Insert at the top of sidebar
      sidebar.insertBefore(errMsg, sidebar.firstChild);
      
      // Track the message
      if (id) {
        this.errorMessages.add(id);
        errMsg.dataset.errorId = id;
      }
      
      // Auto-hide if specified
      if (autoHide > 0) {
        setTimeout(() => {
          this.removeErrorMessage(errMsg, id);
        }, autoHide);
      }
      
      timer.end({ 
        message,
        type,
        autoHide,
        hasId: !!id,
        success: true 
      });
      
      this.logger.info('Error message displayed', {
        message,
        type,
        autoHide,
        id
      });
      
    } catch (error) {
      timer.end({ 
        message,
        type,
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to display error message', {
        error: error.message,
        message,
        type,
        stack: error.stack
      });
    }
  }

  /**
   * Remove an error message from the sidebar
   * @param {HTMLElement} errorElement - The error message element to remove
   * @param {string} id - The error message ID
   */
  removeErrorMessage(errorElement, id = null) {
    try {
      if (errorElement && errorElement.parentNode) {
        errorElement.remove();
        
        if (id) {
          this.errorMessages.delete(id);
        }
        
        this.logger.debug('Error message removed', { id });
      }
    } catch (error) {
      this.logger.error('Failed to remove error message', {
        error: error.message,
        id,
        stack: error.stack
      });
    }
  }

  /**
   * Clear all error messages from the sidebar
   */
  clearAllErrors() {
    const sidebar = document.getElementById('layerMenu');
    if (!sidebar) return;

    const errorMessages = sidebar.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    this.errorMessages.clear();
    
    this.logger.info('All error messages cleared', {
      clearedCount: errorMessages.length
    });
  }

  /**
   * Check if the application is currently offline
   * @returns {boolean} True if offline, false if online
   */
  isOffline() {
    const offline = !navigator.onLine;
    
    this.logger.debug('Offline status checked', {
      isOffline: offline,
      navigatorOnline: navigator.onLine
    });
    
    return offline;
  }

  /**
   * Setup online/offline event listeners
   */
  setupOfflineListener() {
    if (this.isOfflineListenerSetup) {
      this.logger.debug('Offline listener already setup');
      return;
    }

    try {
      window.addEventListener('offline', () => {
        this.logger.info('Application went offline');
        this.showSidebarError('You are offline. Map data may not load.', {
          type: 'warning',
          id: 'offline-notification',
          autoHide: 0
        });
      });

      window.addEventListener('online', () => {
        this.logger.info('Application came back online');
        this.showSidebarError('You are back online. Try reloading the map.', {
          type: 'info',
          id: 'online-notification',
          autoHide: 5000
        });
      });

      this.isOfflineListenerSetup = true;
      
      this.logger.info('Offline listener setup completed');
      
    } catch (error) {
      this.logger.error('Failed to setup offline listener', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get error message styles based on type
   * @param {string} type - Error type
   * @returns {Object} Style object
   */
  getErrorStyles(type) {
    const baseStyles = {
      borderRadius: '6px',
      padding: '8px',
      margin: '8px 0',
      position: 'relative',
      fontSize: '14px',
      fontWeight: '500'
    };

    const typeStyles = {
      error: {
        color: '#d32f2f',
        background: '#fff4f4',
        border: '1px solid #d32f2f'
      },
      warning: {
        color: '#ed6c02',
        background: '#fff8e1',
        border: '1px solid #ed6c02'
      },
      info: {
        color: '#1976d2',
        background: '#e3f2fd',
        border: '1px solid #1976d2'
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  }

  /**
   * Create a close button for error messages
   * @param {string} type - Error type for styling
   * @returns {HTMLElement} Close button element
   */
  createCloseButton(type) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Dismiss';
    closeBtn.className = 'error-message__close';
    
    const buttonStyles = {
      position: 'absolute',
      top: '4px',
      right: '8px',
      background: 'none',
      border: 'none',
      fontSize: '1.2em',
      cursor: 'pointer',
      padding: '0',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    // Set color based on type
    const colors = {
      error: '#d32f2f',
      warning: '#ed6c02',
      info: '#1976d2'
    };
    
    buttonStyles.color = colors[type] || colors.error;
    Object.assign(closeBtn.style, buttonStyles);
    
    return closeBtn;
  }

  /**
   * Show a success message in the sidebar
   * @param {string} message - Success message to display
   * @param {Object} options - Display options
   */
  showSuccessMessage(message, options = {}) {
    this.showSidebarError(message, {
      ...options,
      type: 'info'
    });
  }

  /**
   * Show a warning message in the sidebar
   * @param {string} message - Warning message to display
   * @param {Object} options - Display options
   */
  showWarningMessage(message, options = {}) {
    this.showSidebarError(message, {
      ...options,
      type: 'warning'
    });
  }
}

// Legacy compatibility functions - use DI container instead
export const errorUI = {
  showSidebarError: () => {
    console.warn('errorUI.showSidebarError: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  removeErrorMessage: () => {
    console.warn('errorUI.removeErrorMessage: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  clearAllErrors: () => {
    console.warn('errorUI.clearAllErrors: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  isOffline: () => {
    console.warn('errorUI.isOffline: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  setupOfflineListener: () => {
    console.warn('errorUI.setupOfflineListener: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  showSuccessMessage: () => {
    console.warn('errorUI.showSuccessMessage: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  },
  showWarningMessage: () => {
    console.warn('errorUI.showWarningMessage: Legacy function called. Use DI container to get ErrorUI instance.');
    throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
  }
};

// Legacy convenience functions - use DI container instead
export const showSidebarError = () => {
  console.warn('showSidebarError: Legacy function called. Use DI container to get ErrorUI instance.');
  throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
};
export const isOffline = () => {
  console.warn('isOffline: Legacy function called. Use DI container to get ErrorUI instance.');
  throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
};
export const setupOfflineListener = () => {
  console.warn('setupOfflineListener: Legacy function called. Use DI container to get ErrorUI instance.');
  throw new Error('Legacy function not available. Use DI container to get ErrorUI instance.');
};