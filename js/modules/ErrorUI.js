/**
 * @module modules/ErrorUI
 * Modern ES6-based error UI and notification system
 * Replaces legacy error display functions with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class ErrorUI
 * Manages error display, notifications, and offline status
 */
export class ErrorUI {
  constructor() {
    this.initialized = false;
    this.errorContainer = null;
    this.activeErrors = new Map(); // id -> error element
    this.offlineStatus = false;
    this.notificationQueue = [];
    
    // Bind methods
    this.init = this.init.bind(this);
    this.showError = this.showError.bind(this);
    this.hideError = this.hideError.bind(this);
    this.clearAllErrors = this.clearAllErrors.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.isOffline = this.isOffline.bind(this);
    this.setupOfflineListener = this.setupOfflineListener.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('⚠️ ErrorUI: Error UI system initialized');
  }
  
  /**
   * Initialize the error UI system
   */
  async init() {
    if (this.initialized) {
      console.warn('ErrorUI: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 ErrorUI: Starting error UI initialization...');
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Set up error container
      this.setupErrorContainer();
      
      // Set up offline detection
      this.setupOfflineListener();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ ErrorUI: Error UI system ready');
      
    } catch (error) {
      console.error('🚨 ErrorUI: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Set up error container in sidebar
   */
  setupErrorContainer() {
    // Try to find existing sidebar
    const sidebar = document.getElementById('layerMenu') || document.querySelector('.sidebar');
    if (!sidebar) {
      console.warn('⚠️ ErrorUI: Sidebar not found, will create error container when available');
      return;
    }
    
    // Create error container
    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'errorContainer';
    this.errorContainer.className = 'error-container';
    this.errorContainer.style.cssText = `
      margin: 8px 0;
      max-height: 200px;
      overflow-y: auto;
    `;
    
    // Insert at top of sidebar
    sidebar.insertBefore(this.errorContainer, sidebar.firstChild);
    
    console.log('✅ ErrorUI: Error container created');
  }
  
  /**
   * Set up offline detection and listeners
   */
  setupOfflineListener() {
    // Check initial online status
    this.offlineStatus = !navigator.onLine;
    stateManager.set('offlineStatus', this.offlineStatus);
    
    // Listen for online/offline events
    window.addEventListener('offline', () => {
      this.offlineStatus = true;
      stateManager.set('offlineStatus', true);
      this.showNotification('You are offline. Map data may not load.', 'warning');
      globalEventBus.emit('app:offline');
    });
    
    window.addEventListener('online', () => {
      this.offlineStatus = false;
      stateManager.set('offlineStatus', false);
      this.showNotification('You are back online. Try reloading the map.', 'success');
      globalEventBus.emit('app:online');
    });
    
    console.log('✅ ErrorUI: Offline detection configured');
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for error display requests
    globalEventBus.on('error:show', ({ message, type = 'error', duration = 5000 }) => {
      this.showError(message, type, duration);
    });
    
    // Listen for error hide requests
    globalEventBus.on('error:hide', ({ id }) => {
      this.hideError(id);
    });
    
    // Listen for notification requests
    globalEventBus.on('notification:show', ({ message, type = 'info', duration = 3000 }) => {
      this.showNotification(message, type, duration);
    });
    
    console.log('✅ ErrorUI: Event listeners configured');
  }
  
  /**
   * Show an error message in the sidebar
   * @param {string} message - Error message to display
   * @param {string} type - Error type: 'error', 'warning', 'info'
   * @param {number} duration - Auto-hide duration in milliseconds (0 = no auto-hide)
   * @returns {string} - Error ID for later removal
   */
  showError(message, type = 'error', duration = 5000) {
    try {
      // Ensure error container exists
      if (!this.errorContainer) {
        this.setupErrorContainer();
        if (!this.errorContainer) {
          console.warn('⚠️ ErrorUI: Cannot show error - no container available');
          return null;
        }
      }
      
      // Create unique error ID
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create error element
      const errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = `error-message error-${type}`;
      
      // Set styling based on type
      const styles = this.getErrorStyles(type);
      errorElement.style.cssText = styles;
      
      // Set content
      errorElement.innerHTML = `
        <span class="error-icon">${this.getErrorIcon(type)}</span>
        <span class="error-text">${message}</span>
        <button class="error-close" title="Dismiss">×</button>
      `;
      
      // Add close button handler
      const closeBtn = errorElement.querySelector('.error-close');
      closeBtn.addEventListener('click', () => this.hideError(errorId));
      
      // Add to container
      this.errorContainer.appendChild(errorElement);
      
      // Store reference
      this.activeErrors.set(errorId, errorElement);
      
      // Auto-hide if duration specified
      if (duration > 0) {
        setTimeout(() => this.hideError(errorId), duration);
      }
      
      // Emit error shown event
      globalEventBus.emit('error:shown', { id: errorId, message, type });
      
      console.log(`✅ ErrorUI: Error displayed (${type}): ${message}`);
      
      return errorId;
      
    } catch (error) {
      console.error('🚨 ErrorUI: Failed to show error:', error);
      return null;
    }
  }
  
  /**
   * Hide a specific error message
   * @param {string} errorId - Error ID to hide
   */
  hideError(errorId) {
    try {
      const errorElement = this.activeErrors.get(errorId);
      if (errorElement && errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
        this.activeErrors.delete(errorId);
        
        // Emit error hidden event
        globalEventBus.emit('error:hidden', { id: errorId });
        
        console.log(`✅ ErrorUI: Error hidden: ${errorId}`);
      }
    } catch (error) {
      console.error('🚨 ErrorUI: Failed to hide error:', error);
    }
  }
  
  /**
   * Clear all active error messages
   */
  clearAllErrors() {
    try {
      this.activeErrors.forEach((element, id) => {
        this.hideError(id);
      });
      
      console.log('✅ ErrorUI: All errors cleared');
    } catch (error) {
      console.error('🚨 ErrorUI: Failed to clear all errors:', error);
    }
  }
  
  /**
   * Show a notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type: 'success', 'info', 'warning'
   * @param {number} duration - Auto-hide duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      // Set styling
      const styles = this.getNotificationStyles(type);
      notification.style.cssText = styles;
      
      // Set content
      notification.innerHTML = `
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-text">${message}</span>
      `;
      
      // Add to body
      document.body.appendChild(notification);
      
      // Auto-hide
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, duration);
      
      // Emit notification shown event
      globalEventBus.emit('notification:shown', { message, type });
      
      console.log(`✅ ErrorUI: Notification displayed (${type}): ${message}`);
      
    } catch (error) {
      console.error('🚨 ErrorUI: Failed to show notification:', error);
    }
  }
  
  /**
   * Check if application is offline
   * @returns {boolean} - True if offline
   */
  isOffline() {
    return this.offlineStatus;
  }
  
  /**
   * Get error styles based on type
   * @param {string} type - Error type
   * @returns {string} - CSS styles
   */
  getErrorStyles(type) {
    const baseStyles = `
      padding: 10px;
      margin: 8px 0;
      border-radius: 6px;
      border: 1px solid;
      position: relative;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    const typeStyles = {
      error: `
        background: #fef2f2;
        color: #dc2626;
        border-color: #fecaca;
      `,
      warning: `
        background: #fffbeb;
        color: #d97706;
        border-color: #fed7aa;
      `,
      info: `
        background: #eff6ff;
        color: #2563eb;
        border-color: #bfdbfe;
      `
    };
    
    return baseStyles + (typeStyles[type] || typeStyles.error);
  }
  
  /**
   * Get notification styles based on type
   * @param {string} type - Notification type
   * @returns {string} - CSS styles
   */
  getNotificationStyles(type) {
    const baseStyles = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    const typeStyles = {
      success: `
        background: #f0fdf4;
        color: #166534;
        border-color: #bbf7d0;
      `,
      info: `
        background: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
      `,
      warning: `
        background: #fffbeb;
        color: #d97706;
        border-color: #fed7aa;
      `
    };
    
    return baseStyles + (typeStyles[type] || typeStyles.info);
  }
  
  /**
   * Get error icon based on type
   * @param {string} type - Error type
   * @returns {string} - Icon HTML
   */
  getErrorIcon(type) {
    const icons = {
      error: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.error;
  }
  
  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} - Icon HTML
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️'
    };
    return icons[type] || icons.info;
  }
  
  /**
   * Get error UI status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      offlineStatus: this.offlineStatus,
      activeErrors: this.activeErrors.size,
      errorContainer: !!this.errorContainer,
      notificationQueue: this.notificationQueue.length
    };
  }
}

// Export singleton instance
export const errorUI = new ErrorUI();

// Export for global access and legacy compatibility
if (typeof window !== 'undefined') {
  window.errorUI = errorUI;
  window.showSidebarError = (message, duration = 5000) => errorUI.showError(message, 'error', duration);
  window.isOffline = () => errorUI.isOffline();
  window.setupOfflineListener = () => errorUI.setupOfflineListener();
}
