/**
 * @module UtilityManager
 * Small helpers for string formatting and DOM checkbox creation.
 * Migrated from js/utils.js
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';

/**
 * UtilityManager - Handles various utility functions for the application
 */
@injectable()
export class UtilityManager extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger
  ) {
    super(structuredLogger);
    this.logger.info('UtilityManager initialized');
  }

  /**
   * Initialize the UtilityManager
   * @param {Object} dependencies - Dependencies object
   */
  async init(dependencies) {
    const timer = this.logger.time('init-utility-manager');
    
    try {
      this.logger.info('Initializing UtilityManager...');
      
      // Initialize any required state or setup
      // (Currently no specific initialization needed, but this provides consistency)
      
      timer.end({ success: true });
      
      this.logger.info('UtilityManager initialization complete');
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to initialize UtilityManager', {
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Get current responsive breakpoint context
   * @returns {Object}
   */
  getResponsiveContext() {
    const timer = this.logger.time('get-responsive-context');
    
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Get breakpoints from CSS custom properties
      const computedStyle = getComputedStyle(document.documentElement);
      const mobileSmall = parseInt(computedStyle.getPropertyValue('--mobile-small')?.replace('px', '')) || 480;
      const mobileLarge = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
      const tablet = parseInt(computedStyle.getPropertyValue('--tablet')?.replace('px', '')) || 1024;
      
      let breakpoint = 'desktop';
      if (width <= mobileSmall) breakpoint = 'mobile-small';
      else if (width <= mobileLarge) breakpoint = 'mobile-large';
      else if (width <= tablet) breakpoint = 'tablet';
      
      const context = {
        width,
        height,
        breakpoint,
        isMobile: width <= mobileLarge,
        isTablet: width > mobileLarge && width <= tablet,
        isDesktop: width > tablet,
        isTouch: 'ontouchstart' in window,
        isLandscape: width > height,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches
      };
      
      timer.end({ 
        breakpoint, 
        isMobile: context.isMobile,
        isTablet: context.isTablet,
        isDesktop: context.isDesktop,
        success: true 
      });
      
      return context;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to get responsive context', {
        error: error.message,
        stack: error.stack
      });
      
      // Return fallback context
      return {
        width: window.innerWidth || 1024,
        height: window.innerHeight || 768,
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        isLandscape: true,
        isStandalone: false
      };
    }
  }

  /**
   * Check if current screen size is considered mobile
   * @returns {boolean}
   */
  isMobileSize() {
    const context = this.getResponsiveContext();
    return context.isMobile;
  }

  /**
   * Convert a string to Title Case.
   * @param {string} str
   * @returns {string}
   */
  toTitleCase(str) {
    if (!str) return '';
    
    // Replace underscores with spaces first, then apply title case
    return str.replace(/_/g, ' ').replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());
  }

  /**
   * Format FRV name to display "Fire Rescue Victoria" instead of "FRV"
   * @param {string} name - The raw name from GeoJSON (usually "FRV")
   * @returns {string} - Formatted display name
   */
  formatFrvName(name) {
    if (!name) return '';
    return name === 'FRV' ? 'Fire Rescue Victoria' : name;
  }

  /**
   * Format LGA name for display
   * @param {string} name - The raw LGA name
   * @returns {string} - Formatted display name
   */
  formatLgaName(name) {
    if (!name) return 'Unknown LGA';
    return name;
  }

  /**
   * Check if the application is currently offline
   * @returns {boolean} - True if offline, false if online
   */
  isOffline() {
    return !navigator.onLine;
  }

  /**
   * Show an error message in the sidebar
   * @param {string} message - Error message to display
   */
  showSidebarError(message) {
    const timer = this.logger.time('show-sidebar-error');
    
    try {
      this.logger.error('Sidebar Error:', { message });
      
      // Try to find an error display area in the sidebar
      const sidebar = document.getElementById('layerMenu') || document.querySelector('.sidebar');
      if (sidebar) {
        // Create or update error message
        let errorDiv = sidebar.querySelector('.sidebar-error');
        if (!errorDiv) {
          errorDiv = document.createElement('div');
          errorDiv.className = 'sidebar-error';
          errorDiv.style.cssText = 'background:#f8d7da;color:#721c24;padding:10px;margin:10px;border-radius:4px;border:1px solid #f5c6cb;';
          sidebar.insertBefore(errorDiv, sidebar.firstChild);
        }
        errorDiv.textContent = `⚠️ ${message}`;
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
          }
        }, 10000);
        
        timer.end({ messageLength: message.length, success: true });
        
        this.logger.info('Sidebar error displayed', { message: message.substring(0, 100) });
      } else {
        timer.end({ reason: 'no-sidebar', success: true });
        this.logger.warn('Sidebar not found for error display', { message });
      }
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to show sidebar error', {
        error: error.message,
        originalMessage: message
      });
    }
  }

  /**
   * Convert MGA94 coordinates to Lat/Lng
   * @param {number} easting - MGA94 easting coordinate
   * @param {number} northing - MGA94 northing coordinate
   * @returns {Object} - {lat: number, lng: number}
   */
  convertMGA94ToLatLon(easting, northing) {
    const timer = this.logger.time('convert-mga94-to-latlon');
    
    try {
      // This is a simplified conversion - for production use a proper geodetic library
      // For now, return approximate values (this should be replaced with proper conversion)
      this.logger.warn('MGA94 coordinate conversion not implemented - using approximate values');
      
      // Very rough approximation for Victoria, Australia
      // In production, use a proper geodetic library like proj4js
      const lat = -37.8136 + (northing - 5000000) / 100000;
      const lng = 144.9631 + (easting - 500000) / 100000;
      
      const result = { lat, lng };
      
      timer.end({ 
        easting, 
        northing, 
        lat, 
        lng,
        success: true 
      });
      
      return result;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to convert MGA94 coordinates', {
        error: error.message,
        easting,
        northing
      });
      
      return { lat: null, lng: null };
    }
  }

  /**
   * Create a labeled checkbox element.
   * @param {string} id - Input id attribute.
   * @param {string} label - Text displayed next to the checkbox.
   * @param {boolean} checked - Initial checked state.
   * @param {(e:Event)=>void} [onChange] - Optional change handler.
   * @returns {HTMLLabelElement}
   */
  createCheckbox(id, label, checked, onChange) {
    const timer = this.logger.time('create-checkbox');
    
    try {
      const wrapper = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.checked = checked;
      
      if (onChange) {
        cb.addEventListener('change', onChange);
      }
      
      wrapper.appendChild(cb);
      wrapper.appendChild(document.createTextNode(' ' + label));
      
      timer.end({ 
        id, 
        labelLength: label.length, 
        checked, 
        hasOnChange: !!onChange,
        success: true 
      });
      
      this.logger.debug('Checkbox created', { id, label: label.substring(0, 50) });
      
      return wrapper;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to create checkbox', {
        error: error.message,
        id,
        label
      });
      
      // Return a fallback element
      const fallback = document.createElement('div');
      fallback.textContent = `Error creating checkbox: ${id}`;
      return fallback;
    }
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {boolean} immediate - Whether to call immediately
   * @returns {Function} - Debounced function
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} - Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Deep clone an object
   * @param {any} obj - Object to clone
   * @returns {any} - Cloned object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Generate a unique ID
   * @param {string} prefix - Optional prefix for the ID
   * @returns {string} - Unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Number of bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Validate email address
   * @param {string} email - Email address to validate
   * @returns {boolean} - True if valid
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Sanitize HTML string
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  sanitizeHtml(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Get query parameters from URL
   * @param {string} [url] - URL to parse (defaults to current URL)
   * @returns {Object} - Query parameters object
   */
  getQueryParams(url = window.location.href) {
    const params = {};
    const urlObj = new URL(url);
    
    for (const [key, value] of urlObj.searchParams) {
      params[key] = value;
    }
    
    return params;
  }

  /**
   * Set query parameters in URL
   * @param {Object} params - Parameters to set
   * @param {boolean} [replaceState] - Whether to replace current history state
   */
  setQueryParams(params, replaceState = true) {
    const url = new URL(window.location.href);
    
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    }
    
    if (replaceState) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
  }

  /**
   * Clean up utility manager
   */
  destroy() {
    const timer = this.logger.time('destroy-utility-manager');
    
    try {
      // Clean up any ongoing operations
      // (Currently no cleanup needed, but this is here for future use)
      
      timer.end({ success: true });
      
      this.logger.info('UtilityManager destroyed');
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to destroy UtilityManager', {
        error: error.message
      });
    }
  }
}

// Legacy compatibility functions - use DI container instead
export const utilityManager = {
  init: () => {
    console.warn('utilityManager.init: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  getResponsiveContext: () => {
    console.warn('utilityManager.getResponsiveContext: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  isMobileSize: () => {
    console.warn('utilityManager.isMobileSize: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  toTitleCase: () => {
    console.warn('utilityManager.toTitleCase: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  formatFrvName: () => {
    console.warn('utilityManager.formatFrvName: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  formatLgaName: () => {
    console.warn('utilityManager.formatLgaName: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  isOffline: () => {
    console.warn('utilityManager.isOffline: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  showSidebarError: () => {
    console.warn('utilityManager.showSidebarError: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  convertMGA94ToLatLon: () => {
    console.warn('utilityManager.convertMGA94ToLatLon: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  createCheckbox: () => {
    console.warn('utilityManager.createCheckbox: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  },
  destroy: () => {
    console.warn('utilityManager.destroy: Legacy function called. Use DI container to get UtilityManager instance.');
    throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
  }
};

// Legacy convenience functions - use DI container instead
export const getResponsiveContext = () => {
  console.warn('getResponsiveContext: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const isMobileSize = () => {
  console.warn('isMobileSize: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const toTitleCase = () => {
  console.warn('toTitleCase: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const formatFrvName = () => {
  console.warn('formatFrvName: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const formatLgaName = () => {
  console.warn('formatLgaName: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const isOffline = () => {
  console.warn('isOffline: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const showSidebarError = () => {
  console.warn('showSidebarError: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const convertMGA94ToLatLon = () => {
  console.warn('convertMGA94ToLatLon: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
export const createCheckbox = () => {
  console.warn('createCheckbox: Legacy function called. Use DI container to get UtilityManager instance.');
  throw new Error('Legacy function not available. Use DI container to get UtilityManager instance.');
};
