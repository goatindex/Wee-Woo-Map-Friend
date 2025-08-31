/**
 * @module modules/DeviceManager
 * Modern ES6-based device context management for WeeWoo Map Friend
 * Manages device detection, responsive breakpoints, and platform-specific features
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class DeviceManager
 * Manages device context and responsive features
 */
export class DeviceManager {
  constructor() {
    this.initialized = false;
    this.deviceContext = null;
    this.breakpointListeners = new Set();
    this.orientationListeners = new Set();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.getContext = this.getContext.bind(this);
    this.updateContext = this.updateContext.bind(this);
    this.addBreakpointListener = this.addBreakpointListener.bind(this);
    this.removeBreakpointListener = this.removeBreakpointListener.bind(this);
    this.addOrientationListener = this.addOrientationListener.bind(this);
    this.removeOrientationListener = this.removeOrientationListener.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('📱 DeviceManager: Device management system initialized');
  }
  
  /**
   * Initialize the device manager
   */
  async init() {
    if (this.initialized) {
      console.warn('DeviceManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 DeviceManager: Starting device manager initialization...');
      
      // Initialize device context
      this.deviceContext = this.detectDeviceContext();
      
      // Set up responsive breakpoint detection
      this.setupResponsiveDetection();
      
      // Set up orientation change detection
      this.setupOrientationDetection();
      
      // Store initial context in state manager
      stateManager.set('deviceContext', this.deviceContext);
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ DeviceManager: Device management system ready');
      
    } catch (error) {
      console.error('🚨 DeviceManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Detect current device context
   */
  detectDeviceContext() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Detect platform
    let detectedPlatform = 'web';
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      detectedPlatform = 'ios';
    } else if (/Android/.test(userAgent)) {
      detectedPlatform = 'android';
    }
    
    // Detect device type based on screen size
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    let deviceType = 'desktop';
    if (minDimension < 768) {
      deviceType = 'mobile';
    } else if (minDimension < 1024) {
      deviceType = 'tablet';
    } else if (minDimension >= 1440) {
      deviceType = 'large';
    }
    
    // Detect orientation
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    
    // Detect touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    
    const context = {
      device: deviceType,
      platform: detectedPlatform,
      orientation: orientation,
      hasTouch: hasTouch,
      isStandalone: isStandalone,
      breakpoint: deviceType,
      screenWidth,
      screenHeight,
      userAgent,
      platform: detectedPlatform
    };
    
    console.log('DeviceManager: Detected device context:', context);
    return context;
  }
  
  /**
   * Set up responsive breakpoint detection
   */
  setupResponsiveDetection() {
    const updateBreakpoint = () => {
      const oldBreakpoint = this.deviceContext.breakpoint;
      const newBreakpoint = this.getBreakpointFromScreenSize();
      
      if (oldBreakpoint !== newBreakpoint) {
        this.deviceContext.breakpoint = newBreakpoint;
        this.deviceContext.device = newBreakpoint;
        
        // Update state manager
        stateManager.set('deviceContext', this.deviceContext);
        
        // Emit breakpoint change event
        globalEventBus.emit('device:breakpointChange', {
          oldBreakpoint,
          newBreakpoint,
          context: this.deviceContext
        });
        
        // Notify breakpoint listeners
        this.breakpointListeners.forEach(listener => {
          try {
            listener(newBreakpoint, oldBreakpoint, this.deviceContext);
          } catch (error) {
            console.warn('DeviceManager: Breakpoint listener error:', error);
          }
        });
        
        console.log(`DeviceManager: Breakpoint changed from ${oldBreakpoint} to ${newBreakpoint}`);
      }
    };
    
    // Initial update
    updateBreakpoint();
    
    // Update on resize
    window.addEventListener('resize', this.debounce(updateBreakpoint, 150));
  }
  
  /**
   * Get breakpoint from current screen size
   */
  getBreakpointFromScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const minDimension = Math.min(width, height);
    
    if (minDimension < 768) return 'mobile';
    if (minDimension < 1024) return 'tablet';
    if (minDimension >= 1440) return 'large';
    return 'desktop';
  }
  
  /**
   * Set up orientation change detection
   */
  setupOrientationDetection() {
    const updateOrientation = () => {
      const oldOrientation = this.deviceContext.orientation;
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      
      if (oldOrientation !== newOrientation) {
        this.deviceContext.orientation = newOrientation;
        
        // Update state manager
        stateManager.set('deviceContext', this.deviceContext);
        
        // Emit orientation change event
        globalEventBus.emit('device:orientationChange', {
          oldOrientation,
          newOrientation,
          context: this.deviceContext
        });
        
        // Notify orientation listeners
        this.orientationListeners.forEach(listener => {
          try {
            listener(newOrientation, oldOrientation, this.deviceContext);
          } catch (error) {
            console.warn('DeviceManager: Orientation listener error:', error);
          }
        });
        
        console.log(`DeviceManager: Orientation changed from ${oldOrientation} to ${newOrientation}`);
      }
    };
    
    // Initial update
    updateOrientation();
    
    // Update on orientation change and resize
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', this.debounce(updateOrientation, 150));
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for state changes
    globalEventBus.on('stateChange', ({ property, value }) => {
      if (property === 'deviceContext') {
        this.deviceContext = value;
      }
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('device')) {
        this.updateContext();
      }
    });
  }
  
  /**
   * Get current device context
   */
  getContext() {
    return this.deviceContext;
  }
  
  /**
   * Update device context
   */
  updateContext() {
    this.deviceContext = this.detectDeviceContext();
    stateManager.set('deviceContext', this.deviceContext);
    
    // Emit context update event
    globalEventBus.emit('device:contextUpdate', { context: this.deviceContext });
    
    return this.deviceContext;
  }
  
  /**
   * Add breakpoint change listener
   */
  addBreakpointListener(listener) {
    this.breakpointListeners.add(listener);
    return () => this.removeBreakpointListener(listener);
  }
  
  /**
   * Remove breakpoint change listener
   */
  removeBreakpointListener(listener) {
    this.breakpointListeners.delete(listener);
  }
  
  /**
   * Add orientation change listener
   */
  addOrientationListener(listener) {
    this.orientationListeners.add(listener);
    return () => this.removeOrientationListener(listener);
  }
  
  /**
   * Remove orientation change listener
   */
  removeOrientationListener(listener) {
    this.orientationListeners.delete(listener);
  }
  
  /**
   * Check if device is mobile
   */
  isMobile() {
    return this.deviceContext && this.deviceContext.device === 'mobile';
  }
  
  /**
   * Check if device is tablet
   */
  isTablet() {
    return this.deviceContext && this.deviceContext.device === 'tablet';
  }
  
  /**
   * Check if device is desktop
   */
  isDesktop() {
    return this.deviceContext && this.deviceContext.device === 'desktop';
  }
  
  /**
   * Check if device has touch
   */
  hasTouch() {
    return this.deviceContext && this.deviceContext.hasTouch;
  }
  
  /**
   * Check if app is in standalone mode
   */
  isStandalone() {
    return this.deviceContext && this.deviceContext.isStandalone;
  }
  
  /**
   * Get current breakpoint
   */
  getBreakpoint() {
    return this.deviceContext ? this.deviceContext.breakpoint : 'desktop';
  }
  
  /**
   * Get current orientation
   */
  getOrientation() {
    return this.deviceContext ? this.deviceContext.orientation : 'landscape';
  }
  
  /**
   * Utility function for debouncing
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Get device manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      deviceContext: this.deviceContext,
      breakpointListeners: this.breakpointListeners.size,
      orientationListeners: this.orientationListeners.size
    };
  }
  
  /**
   * Check if device manager is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.DeviceManager = deviceManager;
}
