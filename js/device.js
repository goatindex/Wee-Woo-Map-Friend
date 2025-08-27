/**
 * @module device
 * Advanced device detection and native app behavior management
 */

/**
 * Comprehensive device context detection and management
 */
window.DeviceContext = {
  
  /**
   * Get complete device context information
   */
  getContext() {
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
    
    return {
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
  },
  
  /**
   * Detect platform (iOS, Android, Windows, macOS, Linux)
   */
  detectPlatform() {
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
  },
  
  /**
   * Detect browser
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    
    if (/Edg\//.test(ua)) return 'edge';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
    if (/Firefox\//.test(ua)) return 'firefox';
    if (/MSIE|Trident\//.test(ua)) return 'ie';
    
    return 'unknown';
  },
  
  /**
   * Check if running in a WebView
   */
  isWebView() {
    const ua = navigator.userAgent;
    
    // Common WebView indicators
    return /wv|WebView|Version\/.*Chrome/.test(ua) ||
           window.navigator.standalone === true ||
           (window.matchMedia('(display-mode: standalone)').matches && 
            !/Safari/.test(ua));
  },
  
  /**
   * Get connection type information
   */
  getConnectionType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return 'unknown';
    
    return {
      effectiveType: connection.effectiveType || 'unknown',
      type: connection.type || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  },
  
  /**
   * Get safe area insets for notched devices
   */
  getSafeAreas() {
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0px'
    };
  },
  
  /**
   * Setup native app behaviors
   */
  setupNativeAppBehavior() {
    const context = this.getContext();
    
    if (context.isPWA || context.isStandalone) {
      console.log('Device: Setting up native app behaviors');
      
      // Disable browser zoom/pinch on mobile
      if (context.isMobile) {
        this.disableBrowserZoom();
      }
      
      // Prevent overscroll bounce
      this.preventOverscroll();
      
      // Setup status bar handling
      this.setupStatusBar(context);
      
      // Setup orientation handling
      this.setupOrientationHandling();
      
      // Setup app state handling
      this.setupAppStateHandling();
    }
  },
  
  /**
   * Disable browser zoom/pinch gestures
   */
  disableBrowserZoom() {
    // Prevent pinch zoom
    document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });
    
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', event => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  },
  
  /**
   * Prevent overscroll bounce
   */
  preventOverscroll() {
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  },
  
  /**
   * Setup status bar handling for native apps
   */
  setupStatusBar(context) {
    // iOS status bar handling
    if (context.platform.startsWith('ios')) {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport && context.isPWA) {
        // Add status bar styling for iOS PWA
        metaViewport.setAttribute('content', 
          metaViewport.getAttribute('content') + ',viewport-fit=cover'
        );
      }
    }
  },
  
  /**
   * Setup orientation change handling
   */
  setupOrientationHandling() {
    let orientationTimeout;
    
    const handleOrientationChange = () => {
      // Clear existing timeout
      if (orientationTimeout) {
        clearTimeout(orientationTimeout);
      }
      
      // Delay handling to allow for viewport changes
      orientationTimeout = setTimeout(() => {
        const newContext = this.getContext();
        
        // Dispatch custom event for orientation change
        window.dispatchEvent(new CustomEvent('deviceContextChange', {
          detail: { context: newContext, type: 'orientation' }
        }));
        
        // Update CSS custom properties
        this.updateCSSProperties(newContext);
        
        console.log('Device: Orientation changed to', newContext.orientation);
      }, 250);
    };
    
    // Listen for orientation change events
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // Also listen for resize as fallback
    window.addEventListener('resize', handleOrientationChange);
  },
  
  /**
   * Setup app state handling (focus, visibility)
   */
  setupAppStateHandling() {
    // Handle app visibility changes
    document.addEventListener('visibilitychange', () => {
      const isVisible = !document.hidden;
      
      window.dispatchEvent(new CustomEvent('appVisibilityChange', {
        detail: { visible: isVisible }
      }));
      
      console.log('Device: App visibility changed to', isVisible ? 'visible' : 'hidden');
    });
    
    // Handle app focus changes
    window.addEventListener('focus', () => {
      window.dispatchEvent(new CustomEvent('appFocusChange', {
        detail: { focused: true }
      }));
    });
    
    window.addEventListener('blur', () => {
      window.dispatchEvent(new CustomEvent('appFocusChange', {
        detail: { focused: false }
      }));
    });
  },
  
  /**
   * Update CSS custom properties based on device context
   */
  updateCSSProperties(context) {
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
  },
  
  /**
   * Request permissions needed for native app features
   */
  async requestPermissions() {
    const permissions = {};
    
    try {
      // Geolocation permission
      if ('geolocation' in navigator) {
        permissions.geolocation = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            () => resolve('denied'),
            { timeout: 5000 }
          );
        });
      }
      
      // Notification permission
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          permissions.notifications = await Notification.requestPermission();
        } else {
          permissions.notifications = Notification.permission;
        }
      }
      
      // Device motion permission (iOS 13+)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        permissions.deviceMotion = await DeviceMotionEvent.requestPermission();
      }
      
      // Device orientation permission (iOS 13+)
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        permissions.deviceOrientation = await DeviceOrientationEvent.requestPermission();
      }
      
    } catch (error) {
      console.warn('Device: Permission request failed:', error);
    }
    
    return permissions;
  },
  
  /**
   * Initialize device context system
   */
  init() {
    console.log('Device: Initializing device context system');
    
    const context = this.getContext();
    console.log('Device: Current context:', context);
    
    // Update CSS properties
    this.updateCSSProperties(context);
    
    // Setup native app behaviors if applicable
    this.setupNativeAppBehavior();
    
    // Dispatch initial context event
    window.dispatchEvent(new CustomEvent('deviceContextReady', {
      detail: { context }
    }));
    
    return context;
  }
};

// Convenience functions for backward compatibility
window.getResponsiveContext = () => window.DeviceContext.getContext();
window.isMobileSize = () => window.DeviceContext.getContext().isMobile;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.DeviceContext.init());
} else {
  window.DeviceContext.init();
}
