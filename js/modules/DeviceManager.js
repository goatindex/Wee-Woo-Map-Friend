/**
 * @module DeviceManager
 * Advanced device detection and native app behavior management.
 * Migrated from js/device.js
 */

import { logger } from './StructuredLogger.js';

/**
 * DeviceManager - Comprehensive device context detection and management
 */
export class DeviceManager {
  constructor() {
    this.logger = logger.createChild({ module: 'DeviceManager' });
    this.logger.info('DeviceManager initialized');
    
    this.orientationTimeout = null;
    this.lastTouchEnd = 0;
    this.isInitialized = false;
  }

  /**
   * Get complete device context information
   * @returns {Object} Device context object
   */
  getContext() {
    const timer = this.logger.time('get-device-context');
    
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Get breakpoints from CSS custom properties
      const computedStyle = getComputedStyle(document.documentElement);
      const mobileSmall = parseInt(computedStyle.getPropertyValue('--mobile-small')?.replace('px', '')) || 480;
      const mobileLarge = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
      const tablet = parseInt(computedStyle.getPropertyValue('--tablet')?.replace('px', '')) || 1024;
      
      // Determine breakpoint
      let breakpoint = 'desktop';
      if (width <= mobileSmall) breakpoint = 'mobile-small';
      else if (width <= mobileLarge) breakpoint = 'mobile-large';
      else if (width <= tablet) breakpoint = 'tablet';
      
      // Platform detection
      const platform = this.detectPlatform();
      const browser = this.detectBrowser();
      
      const context = {
        // Screen dimensions
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
        
        // Responsive breakpoints
        breakpoint,
        isMobile: width <= mobileLarge,
        isTablet: width > mobileLarge && width <= tablet,
        isDesktop: width > tablet,
        
        // Orientation
        orientation: width > height ? 'landscape' : 'portrait',
        orientationAngle: screen.orientation?.angle || 0,
        
        // Input capabilities
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasHover: window.matchMedia('(hover: hover)').matches,
        hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
        hasFinePointer: window.matchMedia('(pointer: fine)').matches,
        
        // App mode detection
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        isPWA: window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches,
        isFullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
        
        // Platform and browser
        platform,
        browser,
        isWebView: this.isWebView(),
        
        // Device capabilities
        hasGeolocation: 'geolocation' in navigator,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasOfflineSupport: 'onLine' in navigator,
        hasDeviceMotion: 'DeviceMotionEvent' in window,
        hasDeviceOrientation: 'DeviceOrientationEvent' in window,
        
        // Network
        isOnline: navigator.onLine,
        connectionType: this.getConnectionType(),
        
        // Safe areas (for notched devices)
        safeAreas: this.getSafeAreas()
      };
      
      timer.end({ 
        breakpoint, 
        platform, 
        browser,
        isMobile: context.isMobile,
        isPWA: context.isPWA,
        success: true 
      });
      
      return context;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to get device context', {
        error: error.message,
        stack: error.stack
      });
      
      // Return fallback context
      return {
        width: window.innerWidth || 1024,
        height: window.innerHeight || 768,
        pixelRatio: 1,
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        orientationAngle: 0,
        isTouch: false,
        hasHover: true,
        hasCoarsePointer: false,
        hasFinePointer: true,
        isStandalone: false,
        isPWA: false,
        isFullscreen: false,
        platform: 'unknown',
        browser: 'unknown',
        isWebView: false,
        hasGeolocation: false,
        hasServiceWorker: false,
        hasOfflineSupport: false,
        hasDeviceMotion: false,
        hasDeviceOrientation: false,
        isOnline: true,
        connectionType: 'unknown',
        safeAreas: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      };
    }
  }

  /**
   * Detect platform (iOS, Android, Windows, macOS, Linux)
   * @returns {string} Platform identifier
   */
  detectPlatform() {
    try {
      const ua = navigator.userAgent.toLowerCase();
      const platform = navigator.platform?.toLowerCase() || '';
      
      if (/iphone|ipod/.test(ua)) return 'ios-phone';
      if (/ipad/.test(ua) || (platform.includes('mac') && navigator.maxTouchPoints > 0)) return 'ios-tablet';
      if (/android/.test(ua)) {
        // Distinguish between Android phones and tablets
        return /mobile/.test(ua) ? 'android-phone' : 'android-tablet';
      }
      if (/windows/.test(ua) || platform.includes('win')) return 'windows';
      if (platform.includes('mac')) return 'macos';
      if (/linux/.test(ua) || platform.includes('linux')) return 'linux';
      
      return 'unknown';
      
    } catch (error) {
      this.logger.error('Failed to detect platform', { error: error.message });
      return 'unknown';
    }
  }

  /**
   * Detect browser
   * @returns {string} Browser identifier
   */
  detectBrowser() {
    try {
      const ua = navigator.userAgent;
      
      if (/Edg\//.test(ua)) return 'edge';
      if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
      if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
      if (/Firefox\//.test(ua)) return 'firefox';
      if (/MSIE|Trident\//.test(ua)) return 'ie';
      
      return 'unknown';
      
    } catch (error) {
      this.logger.error('Failed to detect browser', { error: error.message });
      return 'unknown';
    }
  }

  /**
   * Check if running in a WebView
   * @returns {boolean} True if in WebView
   */
  isWebView() {
    try {
      const ua = navigator.userAgent;
      
      // Common WebView indicators
      return /wv|WebView|Version\/.*Chrome/.test(ua) ||
             window.navigator.standalone === true ||
             (window.matchMedia('(display-mode: standalone)').matches && 
              !/Safari/.test(ua));
              
    } catch (error) {
      this.logger.error('Failed to detect WebView', { error: error.message });
      return false;
    }
  }

  /**
   * Get connection type information
   * @returns {Object|string} Connection information or 'unknown'
   */
  getConnectionType() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (!connection) return 'unknown';
      
      return {
        effectiveType: connection.effectiveType || 'unknown',
        type: connection.type || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
      
    } catch (error) {
      this.logger.error('Failed to get connection type', { error: error.message });
      return 'unknown';
    }
  }

  /**
   * Get safe area insets for notched devices
   * @returns {Object} Safe area insets
   */
  getSafeAreas() {
    try {
      const computedStyle = getComputedStyle(document.documentElement);
      
      return {
        top: computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0px',
        right: computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0px',
        bottom: computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
        left: computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0px'
      };
      
    } catch (error) {
      this.logger.error('Failed to get safe areas', { error: error.message });
      return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
    }
  }

  /**
   * Initialize device context system
   * @returns {Object} Initial device context
   */
  init() {
    const timer = this.logger.time('init-device-manager');
    
    try {
      if (this.isInitialized) {
        this.logger.warn('DeviceManager already initialized');
        return this.getContext();
      }
      
      this.logger.info('Initializing device context system');
      
      const context = this.getContext();
      this.logger.info('Current device context', { 
        platform: context.platform,
        browser: context.browser,
        breakpoint: context.breakpoint,
        isMobile: context.isMobile,
        isPWA: context.isPWA 
      });
      
      // Update CSS properties
      this.updateCSSProperties(context);
      
      // Dispatch initial context event
      window.dispatchEvent(new CustomEvent('deviceContextReady', {
        detail: { context }
      }));
      
      this.isInitialized = true;
      
      timer.end({ 
        platform: context.platform,
        breakpoint: context.breakpoint,
        success: true 
      });
      
      return context;
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to initialize DeviceManager', {
        error: error.message,
        stack: error.stack
      });
      
      return this.getContext(); // Return fallback context
    }
  }

  /**
   * Update CSS custom properties based on device context
   * @param {Object} context - Device context
   */
  updateCSSProperties(context) {
    try {
      const root = document.documentElement;
      
      // Update viewport dimensions
      root.style.setProperty('--viewport-width', `${context.width}px`);
      root.style.setProperty('--viewport-height', `${context.height}px`);
      
      // Update device pixel ratio
      root.style.setProperty('--pixel-ratio', context.pixelRatio.toString());
      
      // Update orientation
      root.style.setProperty('--orientation', context.orientation);
      root.style.setProperty('--orientation-angle', `${context.orientationAngle}deg`);
      
      // Update platform info
      root.style.setProperty('--platform', context.platform);
      root.style.setProperty('--breakpoint', context.breakpoint);
      
      this.logger.debug('CSS properties updated', { 
        breakpoint: context.breakpoint,
        orientation: context.orientation 
      });
      
    } catch (error) {
      this.logger.error('Failed to update CSS properties', { error: error.message });
    }
  }

  /**
   * Clean up device manager
   */
  destroy() {
    const timer = this.logger.time('destroy-device-manager');
    
    try {
      // Clear orientation timeout
      if (this.orientationTimeout) {
        clearTimeout(this.orientationTimeout);
        this.orientationTimeout = null;
      }
      
      // Remove event listeners (they'll be cleaned up when the page unloads)
      this.isInitialized = false;
      
      timer.end({ success: true });
      
      this.logger.info('DeviceManager destroyed');
      
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      
      this.logger.error('Failed to destroy DeviceManager', {
        error: error.message
      });
    }
  }
}

/**
 * DeviceContext - Legacy compatibility wrapper for DeviceManager
 * Provides the expected global interface for legacy code
 */
export class DeviceContext {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  /**
   * Get device context - legacy compatibility method
   * @returns {Object} Device context object
   */
  getContext() {
    return this.deviceManager.getContext();
  }

  /**
   * Check if device is mobile - legacy compatibility method
   * @returns {boolean} True if mobile device
   */
  isMobile() {
    return this.deviceManager.getContext().isMobile;
  }

  /**
   * Check if device is tablet - legacy compatibility method
   * @returns {boolean} True if tablet device
   */
  isTablet() {
    return this.deviceManager.getContext().isTablet;
  }

  /**
   * Check if device is desktop - legacy compatibility method
   * @returns {boolean} True if desktop device
   */
  isDesktop() {
    return this.deviceManager.getContext().isDesktop;
  }

  /**
   * Get current breakpoint - legacy compatibility method
   * @returns {string} Current breakpoint
   */
  getBreakpoint() {
    return this.deviceManager.getContext().breakpoint;
  }

  /**
   * Get platform information - legacy compatibility method
   * @returns {string} Platform identifier
   */
  getPlatform() {
    return this.deviceManager.getContext().platform;
  }

  /**
   * Get browser information - legacy compatibility method
   * @returns {string} Browser identifier
   */
  getBrowser() {
    return this.deviceManager.getContext().browser;
  }

  /**
   * Check if device supports touch - legacy compatibility method
   * @returns {boolean} True if touch supported
   */
  isTouch() {
    return this.deviceManager.getContext().isTouch;
  }

  /**
   * Check if device is PWA - legacy compatibility method
   * @returns {boolean} True if PWA
   */
  isPWA() {
    return this.deviceManager.getContext().isPWA;
  }

  /**
   * Get orientation - legacy compatibility method
   * @returns {string} Orientation (portrait/landscape)
   */
  getOrientation() {
    return this.deviceManager.getContext().orientation;
  }

  /**
   * Get screen dimensions - legacy compatibility method
   * @returns {Object} Screen dimensions
   */
  getDimensions() {
    const context = this.deviceManager.getContext();
    return {
      width: context.width,
      height: context.height,
      pixelRatio: context.pixelRatio
    };
  }
}

// Create singleton instance
export const deviceManager = new DeviceManager();

// Create DeviceContext wrapper
export const deviceContext = new DeviceContext(deviceManager);

// Legacy compatibility exports
export const getResponsiveContext = () => deviceManager.getContext();
export const isMobileSize = () => deviceManager.getContext().isMobile;

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details