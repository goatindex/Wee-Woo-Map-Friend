/**
 * @module DeviceManager.test
 * Tests for DeviceManager module
 */

import { DeviceManager, deviceManager, getResponsiveContext, isMobileSize } from './DeviceManager.js';
import { logger } from './StructuredLogger.js';

// Mock logger
jest.mock('./StructuredLogger.js', () => ({
  logger: {
    createChild: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      time: jest.fn(() => ({
        end: jest.fn()
      }))
    }))
  }
}));

// Mock DOM methods
const mockGetComputedStyle = jest.fn();
const mockMatchMedia = jest.fn();
const mockQuerySelector = jest.fn();

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1
});

Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  configurable: true,
  value: mockGetComputedStyle
});

// Mock matchMedia if not already defined
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia
  });
} else {
  window.matchMedia = mockMatchMedia;
}

Object.defineProperty(window, 'dispatchEvent', {
  writable: true,
  configurable: true,
  value: jest.fn()
});

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn()
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn()
});

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

Object.defineProperty(navigator, 'platform', {
  writable: true,
  configurable: true,
  value: 'Win32'
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  configurable: true,
  value: 0
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  configurable: true,
  value: true
});

Object.defineProperty(navigator, 'connection', {
  writable: true,
  configurable: true,
  value: undefined
});

Object.defineProperty(navigator, 'standalone', {
  writable: true,
  configurable: true,
  value: false
});

// Mock screen properties
Object.defineProperty(screen, 'orientation', {
  writable: true,
  configurable: true,
  value: {
    angle: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock document properties
Object.defineProperty(document, 'querySelector', {
  writable: true,
  configurable: true,
  value: mockQuerySelector
});

Object.defineProperty(document, 'addEventListener', {
  writable: true,
  configurable: true,
  value: jest.fn()
});

Object.defineProperty(document, 'body', {
  writable: true,
  configurable: true,
  value: {
    style: {}
  }
});

Object.defineProperty(document, 'documentElement', {
  writable: true,
  configurable: true,
  value: {
    style: {
      setProperty: jest.fn()
    }
  }
});

Object.defineProperty(document, 'hidden', {
  writable: true,
  configurable: true,
  value: false
});

describe('DeviceManager', () => {
  let manager;

  beforeEach(() => {
    manager = new DeviceManager();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGetComputedStyle.mockReturnValue({
      getPropertyValue: jest.fn((prop) => {
        const values = {
          '--mobile-small': '480px',
          '--mobile-large': '768px',
          '--tablet': '1024px',
          'env(safe-area-inset-top)': '0px',
          'env(safe-area-inset-right)': '0px',
          'env(safe-area-inset-bottom)': '0px',
          'env(safe-area-inset-left)': '0px'
        };
        return values[prop] || '0px';
      })
    });
    
    mockMatchMedia.mockReturnValue({
      matches: false
    });
    
    mockQuerySelector.mockReturnValue(null);
    
    // Reset window dimensions
    window.innerWidth = 1024;
    window.innerHeight = 768;
    window.devicePixelRatio = 1;
    
    // Reset navigator properties using defineProperty
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      configurable: true,
      value: 'Win32'
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0
    });
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      configurable: true,
      value: false
    });
  });

  describe('getContext', () => {
    test('should return desktop context for large screens', () => {
      window.innerWidth = 1200;
      window.innerHeight = 800;
      
      const context = manager.getContext();
      
      expect(context).toEqual({
        width: 1200,
        height: 800,
        pixelRatio: 1,
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        orientationAngle: 0,
        isTouch: false,
        hasHover: false,
        hasCoarsePointer: false,
        hasFinePointer: false,
        isStandalone: false,
        isPWA: false,
        isFullscreen: false,
        platform: 'windows',
        browser: 'chrome',
        isWebView: false,
        hasGeolocation: false,
        hasServiceWorker: false,
        hasOfflineSupport: true,
        hasDeviceMotion: false,
        hasDeviceOrientation: false,
        isOnline: true,
        connectionType: 'unknown',
        safeAreas: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });
    });

    test('should return mobile context for small screens', () => {
      window.innerWidth = 400;
      window.innerHeight = 600;
      
      const context = manager.getContext();
      
      expect(context.breakpoint).toBe('mobile-small');
      expect(context.isMobile).toBe(true);
      expect(context.isDesktop).toBe(false);
    });

    test('should handle errors gracefully', () => {
      // Mock getComputedStyle to throw error
      mockGetComputedStyle.mockImplementation(() => {
        throw new Error('CSS not available');
      });
      
      const context = manager.getContext();
      
      expect(context).toEqual({
        width: 1024,
        height: 768,
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
      });
    });
  });

  describe('detectPlatform', () => {
    test('should detect Windows platform', () => {
      navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      navigator.platform = 'Win32';
      
      expect(manager.detectPlatform()).toBe('windows');
    });

    test('should detect iOS phone', () => {
      navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      navigator.platform = 'iPhone';
      
      expect(manager.detectPlatform()).toBe('ios-phone');
    });

    test('should detect Android phone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 Mobile'
      });
      Object.defineProperty(navigator, 'platform', {
        writable: true,
        configurable: true,
        value: 'Linux armv8l'
      });
      
      expect(manager.detectPlatform()).toBe('android-phone');
    });

    test('should handle errors gracefully', () => {
      // Mock navigator.userAgent to throw error
      Object.defineProperty(navigator, 'userAgent', {
        get: () => { throw new Error('Access denied'); }
      });
      
      expect(manager.detectPlatform()).toBe('unknown');
    });
  });

  describe('detectBrowser', () => {
    test('should detect Chrome browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      expect(manager.detectBrowser()).toBe('chrome');
    });

    test('should detect Firefox browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      });
      
      expect(manager.detectBrowser()).toBe('firefox');
    });

    test('should detect Safari browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      });
      
      expect(manager.detectBrowser()).toBe('safari');
    });

    test('should handle errors gracefully', () => {
      // Mock navigator.userAgent to throw error
      Object.defineProperty(navigator, 'userAgent', {
        get: () => { throw new Error('Access denied'); }
      });
      
      expect(manager.detectBrowser()).toBe('unknown');
    });
  });

  describe('isWebView', () => {
    test('should detect WebView', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.124 Mobile Safari/537.36 wv'
      });
      
      expect(manager.isWebView()).toBe(true);
    });

    test('should detect standalone mode', () => {
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: true
      });
      
      expect(manager.isWebView()).toBe(true);
    });

    test('should return false for regular browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      Object.defineProperty(navigator, 'standalone', {
        writable: true,
        configurable: true,
        value: false
      });
      
      expect(manager.isWebView()).toBe(false);
    });
  });

  describe('getConnectionType', () => {
    test('should return connection info when available', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: {
          effectiveType: '4g',
          type: 'cellular',
          downlink: 10,
          rtt: 50,
          saveData: false
        }
      });
      
      const connection = manager.getConnectionType();
      
      expect(connection).toEqual({
        effectiveType: '4g',
        type: 'cellular',
        downlink: 10,
        rtt: 50,
        saveData: false
      });
    });

    test('should return unknown when connection not available', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: undefined
      });
      
      expect(manager.getConnectionType()).toBe('unknown');
    });
  });

  describe('getSafeAreas', () => {
    test('should return safe area insets', () => {
      const safeAreas = manager.getSafeAreas();
      
      expect(safeAreas).toEqual({
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      });
    });

    test('should handle errors gracefully', () => {
      mockGetComputedStyle.mockImplementation(() => {
        throw new Error('CSS not available');
      });
      
      const safeAreas = manager.getSafeAreas();
      
      expect(safeAreas).toEqual({
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      });
    });
  });

  describe('updateCSSProperties', () => {
    test('should update CSS custom properties', () => {
      const context = {
        width: 1200,
        height: 800,
        pixelRatio: 2,
        orientation: 'landscape',
        orientationAngle: 0,
        platform: 'windows',
        breakpoint: 'desktop'
      };
      
      manager.updateCSSProperties(context);
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--viewport-width', '1200px');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--viewport-height', '800px');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--pixel-ratio', '2');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--orientation', 'landscape');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--orientation-angle', '0deg');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--platform', 'windows');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--breakpoint', 'desktop');
    });
  });

  describe('init', () => {
    test('should initialize device manager', () => {
      const context = manager.init();
      
      expect(context).toBeDefined();
      expect(context.platform).toBe('windows');
      expect(context.browser).toBe('chrome');
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deviceContextReady',
          detail: { context }
        })
      );
    });

    test('should not initialize twice', () => {
      manager.init();
      const context = manager.init();
      
      expect(context).toBeDefined();
      // Should not dispatch event twice
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test('should handle errors gracefully', () => {
      // Mock getComputedStyle to throw error
      mockGetComputedStyle.mockImplementation(() => {
        throw new Error('CSS not available');
      });
      
      const context = manager.init();
      
      expect(context).toBeDefined();
      expect(context.platform).toBe('unknown');
    });
  });

  describe('destroy', () => {
    test('should clean up resources', () => {
      manager.init();
      manager.destroy();
      
      expect(manager.isInitialized).toBe(false);
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function exports', () => {
      // Test the manager method directly first
      const context = manager.getContext();
      expect(context.isMobile).toBe(false);
      
      // Test legacy exports
      expect(getResponsiveContext).toBeDefined();
      expect(isMobileSize).toBeDefined();
      
      const legacyContext = getResponsiveContext();
      expect(legacyContext).toEqual(context);
      
      const isMobile = isMobileSize();
      expect(isMobile).toBe(false);
    });
  });
});
