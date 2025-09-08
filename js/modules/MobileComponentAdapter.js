/**
 * @module modules/MobileComponentAdapter
 * Mobile-specific component adapter for WeeWoo Map Friend
 * Provides mobile-optimized UI components and native feature integration
 * 
 * @fileoverview Mobile component adapter for enhanced mobile experience
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';
import { logger } from './StructuredLogger.js';

/**
 * Mobile-specific UI optimizations
 */
export const MOBILE_UI_OPTIMIZATIONS = {
  // Touch-friendly sizing
  TOUCH_TARGET_SIZE: 44, // Minimum 44px for accessibility
  TOUCH_MARGIN: 8, // Additional margin for touch targets
  
  // Gesture thresholds
  SWIPE_THRESHOLD: 50, // Minimum distance for swipe detection
  PINCH_THRESHOLD: 0.1, // Minimum scale change for pinch detection
  
  // Animation durations
  FAST_ANIMATION: 150, // Fast animations for mobile
  NORMAL_ANIMATION: 300, // Normal animations
  SLOW_ANIMATION: 500, // Slow animations
  
  // Viewport breakpoints
  MOBILE_BREAKPOINT: 768, // Mobile breakpoint
  TABLET_BREAKPOINT: 1024, // Tablet breakpoint
};

/**
 * Mobile gesture types
 */
export const GESTURE_TYPES = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_UP: 'swipe_up',
  SWIPE_DOWN: 'swipe_down',
  PINCH_ZOOM: 'pinch_zoom',
  PAN: 'pan'
};

/**
 * Mobile Component Adapter
 * Provides mobile-optimized components and native feature integration
 */
@injectable()
export class MobileComponentAdapter extends BaseService {
  constructor(
    @inject(TYPES.PlatformService) platformService,
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.ConfigService) configService
  ) {
    super();
    this.platformService = platformService;
    this.eventBus = eventBus;
    this.configService = configService;
    this.logger = logger.createChild({ module: 'MobileComponentAdapter' });
    
    // Mobile-specific state
    this.isMobile = false;
    this.isNativeApp = false;
    this.touchHandlers = new Map();
    this.gestureRecognizers = new Map();
    this.nativeFeatures = new Map();
    
    this.logger.info('MobileComponentAdapter initialized');
  }

  /**
   * Initialize mobile component adapter
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing mobile component adapter');
    
    try {
      // Detect mobile platform
      await this.detectMobilePlatform();
      
      // Initialize native features
      await this.initializeNativeFeatures();
      
      // Set up mobile-specific event listeners
      this.setupMobileEventListeners();
      
      // Apply mobile UI optimizations
      this.applyMobileUIOptimizations();
      
      // Initialize gesture recognition
      this.initializeGestureRecognition();
      
      this.logger.info('Mobile component adapter initialized successfully', {
        isMobile: this.isMobile,
        isNativeApp: this.isNativeApp,
        availableFeatures: Array.from(this.nativeFeatures.keys())
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize mobile component adapter', { error });
      throw error;
    }
  }

  /**
   * Detect mobile platform and capabilities
   */
  private async detectMobilePlatform(): Promise<void> {
    const platformInfo = this.platformService.getPlatformInfo();
    this.isMobile = platformInfo.isMobile || platformInfo.isTablet;
    this.isNativeApp = platformInfo.isNativeApp;
    
    this.logger.debug('Mobile platform detection', {
      platform: platformInfo.platform,
      isMobile: this.isMobile,
      isNativeApp: this.isNativeApp,
      deviceType: platformInfo.deviceType
    });
  }

  /**
   * Initialize native mobile features
   */
  private async initializeNativeFeatures(): Promise<void> {
    if (!this.isNativeApp) {
      this.logger.debug('Not running in native app, skipping native features');
      return;
    }

    try {
      // Check for native features availability
      const capabilities = this.platformService.getCapabilities();
      
      if (capabilities.hasGeolocation) {
        this.nativeFeatures.set('geolocation', true);
      }
      
      if (capabilities.hasHaptics) {
        this.nativeFeatures.set('haptics', true);
      }
      
      if (capabilities.hasStatusBar) {
        this.nativeFeatures.set('statusBar', true);
      }
      
      if (capabilities.hasDeviceInfo) {
        this.nativeFeatures.set('deviceInfo', true);
      }
      
      if (capabilities.hasNetworkInfo) {
        this.nativeFeatures.set('networkInfo', true);
      }
      
      this.logger.info('Native features initialized', {
        features: Array.from(this.nativeFeatures.keys())
      });
      
    } catch (error) {
      this.logger.warn('Failed to initialize some native features', { error });
    }
  }

  /**
   * Set up mobile-specific event listeners
   */
  private setupMobileEventListeners(): void {
    if (!this.isMobile) return;

    // Orientation change handling
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Touch event handling
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Native app state changes
    window.addEventListener('nativeAppStateChange', this.handleAppStateChange.bind(this));
    window.addEventListener('nativeBackButton', this.handleBackButton.bind(this));
    
    // Viewport changes
    window.addEventListener('resize', this.handleViewportChange.bind(this));
    
    this.logger.debug('Mobile event listeners set up');
  }

  /**
   * Apply mobile UI optimizations
   */
  private applyMobileUIOptimizations(): void {
    if (!this.isMobile) return;

    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-optimized');
    
    if (this.isNativeApp) {
      document.body.classList.add('native-app');
    }
    
    // Apply touch-friendly sizing
    this.applyTouchFriendlySizing();
    
    // Optimize for mobile viewport
    this.optimizeMobileViewport();
    
    // Apply mobile-specific animations
    this.applyMobileAnimations();
    
    this.logger.debug('Mobile UI optimizations applied');
  }

  /**
   * Apply touch-friendly sizing to interactive elements
   */
  private applyTouchFriendlySizing(): void {
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = MOBILE_UI_OPTIMIZATIONS.TOUCH_TARGET_SIZE;
      
      if (rect.width < minSize || rect.height < minSize) {
        element.classList.add('touch-friendly');
        element.style.minWidth = `${minSize}px`;
        element.style.minHeight = `${minSize}px`;
      }
    });
  }

  /**
   * Optimize mobile viewport
   */
  private optimizeMobileViewport(): void {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (this.isMobile) {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 
              'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
            );
          }
        }
      });
      
      input.addEventListener('blur', () => {
        if (this.isMobile) {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute('content', 
              'width=device-width, initial-scale=1, user-scalable=yes'
            );
          }
        }
      });
    });
  }

  /**
   * Apply mobile-specific animations
   */
  private applyMobileAnimations(): void {
    // Reduce motion for better performance on mobile
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || this.isMobile) {
      document.documentElement.style.setProperty('--animation-duration-fast', '0ms');
      document.documentElement.style.setProperty('--animation-duration-normal', '150ms');
      document.documentElement.style.setProperty('--animation-duration-slow', '300ms');
    }
  }

  /**
   * Initialize gesture recognition
   */
  private initializeGestureRecognition(): void {
    if (!this.isMobile) return;

    // Set up gesture recognizers for different components
    this.setupMapGestures();
    this.setupSidebarGestures();
    this.setupSearchGestures();
    
    this.logger.debug('Gesture recognition initialized');
  }

  /**
   * Set up map-specific gestures
   */
  private setupMapGestures(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const gestureRecognizer = new MobileGestureRecognizer(mapContainer);
    
    // Map-specific gestures
    gestureRecognizer.on(GESTURE_TYPES.DOUBLE_TAP, (event) => {
      this.eventBus.emit('map.double_tap', { event });
    });
    
    gestureRecognizer.on(GESTURE_TYPES.LONG_PRESS, (event) => {
      this.eventBus.emit('map.long_press', { event });
    });
    
    gestureRecognizer.on(GESTURE_TYPES.SWIPE_LEFT, (event) => {
      this.eventBus.emit('map.swipe_left', { event });
    });
    
    gestureRecognizer.on(GESTURE_TYPES.SWIPE_RIGHT, (event) => {
      this.eventBus.emit('map.swipe_right', { event });
    });
    
    this.gestureRecognizers.set('map', gestureRecognizer);
  }

  /**
   * Set up sidebar-specific gestures
   */
  private setupSidebarGestures(): void {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const gestureRecognizer = new MobileGestureRecognizer(sidebar);
    
    // Sidebar-specific gestures
    gestureRecognizer.on(GESTURE_TYPES.SWIPE_LEFT, (event) => {
      this.eventBus.emit('sidebar.swipe_left', { event });
    });
    
    gestureRecognizer.on(GESTURE_TYPES.SWIPE_RIGHT, (event) => {
      this.eventBus.emit('sidebar.swipe_right', { event });
    });
    
    this.gestureRecognizers.set('sidebar', gestureRecognizer);
  }

  /**
   * Set up search-specific gestures
   */
  private setupSearchGestures(): void {
    const searchContainer = document.getElementById('search-container');
    if (!searchContainer) return;

    const gestureRecognizer = new MobileGestureRecognizer(searchContainer);
    
    // Search-specific gestures
    gestureRecognizer.on(GESTURE_TYPES.SWIPE_DOWN, (event) => {
      this.eventBus.emit('search.swipe_down', { event });
    });
    
    this.gestureRecognizers.set('search', gestureRecognizer);
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    this.logger.debug('Orientation changed');
    
    // Emit orientation change event
    this.eventBus.emit('mobile.orientation_change', {
      orientation: screen.orientation?.type || 'unknown',
      angle: screen.orientation?.angle || 0
    });
    
    // Reapply mobile optimizations after orientation change
    setTimeout(() => {
      this.applyMobileUIOptimizations();
    }, 100);
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    // Store touch start information for gesture recognition
    this.touchStartData = {
      touches: Array.from(event.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.touchStartData) return;

    // Update touch move information
    this.touchMoveData = {
      touches: Array.from(event.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchStartData || !this.touchMoveData) return;

    // Process gesture recognition
    this.processGesture(event);
    
    // Clear touch data
    this.touchStartData = null;
    this.touchMoveData = null;
  }

  /**
   * Process gesture recognition
   */
  private processGesture(event: TouchEvent): void {
    const startTouches = this.touchStartData.touches;
    const endTouches = Array.from(event.changedTouches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    if (startTouches.length === 1 && endTouches.length === 1) {
      const startTouch = startTouches[0];
      const endTouch = endTouches[0];
      
      const deltaX = endTouch.x - startTouch.x;
      const deltaY = endTouch.y - startTouch.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = endTouch.timestamp - startTouch.timestamp;
      
      // Determine gesture type
      if (distance < 10 && duration < 300) {
        // Tap
        this.eventBus.emit('mobile.tap', { event, touch: endTouch });
      } else if (distance > MOBILE_UI_OPTIMIZATIONS.SWIPE_THRESHOLD) {
        // Swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            this.eventBus.emit('mobile.swipe_right', { event, touch: endTouch });
          } else {
            this.eventBus.emit('mobile.swipe_left', { event, touch: endTouch });
          }
        } else {
          if (deltaY > 0) {
            this.eventBus.emit('mobile.swipe_down', { event, touch: endTouch });
          } else {
            this.eventBus.emit('mobile.swipe_up', { event, touch: endTouch });
          }
        }
      }
    }
  }

  /**
   * Handle app state change
   */
  private handleAppStateChange(event: CustomEvent): void {
    this.logger.debug('App state changed', event.detail);
    
    this.eventBus.emit('mobile.app_state_change', event.detail);
    
    if (event.detail.isActive) {
      // App became active
      this.eventBus.emit('mobile.app_active');
    } else {
      // App became inactive
      this.eventBus.emit('mobile.app_inactive');
    }
  }

  /**
   * Handle back button
   */
  private handleBackButton(event: CustomEvent): void {
    this.logger.debug('Back button pressed');
    
    // Emit back button event for components to handle
    this.eventBus.emit('mobile.back_button', event.detail);
  }

  /**
   * Handle viewport change
   */
  private handleViewportChange(): void {
    this.logger.debug('Viewport changed');
    
    // Reapply mobile optimizations
    this.applyMobileUIOptimizations();
    
    // Emit viewport change event
    this.eventBus.emit('mobile.viewport_change', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  /**
   * Trigger haptic feedback
   */
  async triggerHapticFeedback(type: string = 'medium'): Promise<boolean> {
    if (!this.nativeFeatures.has('haptics')) {
      this.logger.debug('Haptic feedback not available');
      return false;
    }

    try {
      if (window.NativeFeatures && window.NativeFeatures.hapticFeedback) {
        await window.NativeFeatures.hapticFeedback(type);
        this.logger.debug('Haptic feedback triggered', { type });
        return true;
      }
    } catch (error) {
      this.logger.warn('Failed to trigger haptic feedback', { error });
    }
    
    return false;
  }

  /**
   * Get current position with native features
   */
  async getCurrentPosition(options: any = {}): Promise<any> {
    if (!this.nativeFeatures.has('geolocation')) {
      this.logger.debug('Native geolocation not available');
      return null;
    }

    try {
      if (window.NativeFeatures && window.NativeFeatures.getCurrentPosition) {
        const position = await window.NativeFeatures.getCurrentPosition(options);
        this.logger.debug('Current position obtained', { position });
        return position;
      }
    } catch (error) {
      this.logger.warn('Failed to get current position', { error });
    }
    
    return null;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<any> {
    if (!this.nativeFeatures.has('deviceInfo')) {
      this.logger.debug('Native device info not available');
      return null;
    }

    try {
      if (window.NativeFeatures && window.NativeFeatures.getDeviceInfo) {
        const deviceInfo = await window.NativeFeatures.getDeviceInfo();
        this.logger.debug('Device info obtained', { deviceInfo });
        return deviceInfo;
      }
    } catch (error) {
      this.logger.warn('Failed to get device info', { error });
    }
    
    return null;
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<any> {
    if (!this.nativeFeatures.has('networkInfo')) {
      this.logger.debug('Native network info not available');
      return null;
    }

    try {
      if (window.NativeFeatures && window.NativeFeatures.getNetworkStatus) {
        const networkStatus = await window.NativeFeatures.getNetworkStatus();
        this.logger.debug('Network status obtained', { networkStatus });
        return networkStatus;
      }
    } catch (error) {
      this.logger.warn('Failed to get network status', { error });
    }
    
    return null;
  }

  /**
   * Check if mobile optimizations are active
   */
  isMobileOptimized(): boolean {
    return this.isMobile;
  }

  /**
   * Check if native app features are available
   */
  isNativeAppAvailable(): boolean {
    return this.isNativeApp;
  }

  /**
   * Get available native features
   */
  getAvailableNativeFeatures(): string[] {
    return Array.from(this.nativeFeatures.keys());
  }

  /**
   * Cleanup mobile component adapter
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up mobile component adapter');
    
    // Remove event listeners
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    window.removeEventListener('nativeAppStateChange', this.handleAppStateChange.bind(this));
    window.removeEventListener('nativeBackButton', this.handleBackButton.bind(this));
    window.removeEventListener('resize', this.handleViewportChange.bind(this));
    
    // Cleanup gesture recognizers
    this.gestureRecognizers.forEach(recognizer => {
      if (recognizer.cleanup) {
        recognizer.cleanup();
      }
    });
    this.gestureRecognizers.clear();
    
    // Clear state
    this.touchHandlers.clear();
    this.nativeFeatures.clear();
    
    this.logger.info('Mobile component adapter cleaned up');
  }
}

/**
 * Mobile Gesture Recognizer
 * Handles touch gesture recognition for mobile components
 */
class MobileGestureRecognizer {
  constructor(element: HTMLElement) {
    this.element = element;
    this.gestureHandlers = new Map();
    this.touchData = new Map();
    
    this.setupTouchHandlers();
  }

  /**
   * Set up touch event handlers
   */
  private setupTouchHandlers(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    Array.from(event.touches).forEach(touch => {
      this.touchData.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        currentX: touch.clientX,
        currentY: touch.clientY
      });
    });
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    Array.from(event.touches).forEach(touch => {
      const data = this.touchData.get(touch.identifier);
      if (data) {
        data.currentX = touch.clientX;
        data.currentY = touch.clientY;
      }
    });
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    Array.from(event.changedTouches).forEach(touch => {
      const data = this.touchData.get(touch.identifier);
      if (data) {
        this.processGesture(touch, data, event);
        this.touchData.delete(touch.identifier);
      }
    });
  }

  /**
   * Process gesture recognition
   */
  private processGesture(touch: Touch, data: any, event: TouchEvent): void {
    const deltaX = data.currentX - data.startX;
    const deltaY = data.currentY - data.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - data.startTime;
    
    // Determine gesture type and emit appropriate event
    if (distance < 10 && duration < 300) {
      this.emit(GESTURE_TYPES.TAP, { touch, data, event });
    } else if (distance > MOBILE_UI_OPTIMIZATIONS.SWIPE_THRESHOLD) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.emit(GESTURE_TYPES.SWIPE_RIGHT, { touch, data, event });
        } else {
          this.emit(GESTURE_TYPES.SWIPE_LEFT, { touch, data, event });
        }
      } else {
        if (deltaY > 0) {
          this.emit(GESTURE_TYPES.SWIPE_DOWN, { touch, data, event });
        } else {
          this.emit(GESTURE_TYPES.SWIPE_UP, { touch, data, event });
        }
      }
    }
  }

  /**
   * Register gesture handler
   */
  on(gestureType: string, handler: Function): void {
    if (!this.gestureHandlers.has(gestureType)) {
      this.gestureHandlers.set(gestureType, []);
    }
    this.gestureHandlers.get(gestureType).push(handler);
  }

  /**
   * Emit gesture event
   */
  private emit(gestureType: string, data: any): void {
    const handlers = this.gestureHandlers.get(gestureType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Gesture handler error:', error);
        }
      });
    }
  }

  /**
   * Cleanup gesture recognizer
   */
  cleanup(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    
    this.gestureHandlers.clear();
    this.touchData.clear();
  }
}
