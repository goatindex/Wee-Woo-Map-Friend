/**
 * @module DeviceManager.test
 * Tests for DeviceManager module - Real Code Testing
 */

import { DeviceManager, deviceManager, getResponsiveContext, isMobileSize } from './DeviceManager.js';

// Mock only external dependencies and browser APIs
const mockGetComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn((prop) => {
    const values = {
      '--mobile-small': '480px',
      '--mobile-large': '768px', 
      '--tablet': '1024px'
    };
    return values[prop] || '';
  })
}));
const mockMatchMedia = jest.fn();
const mockQuerySelector = jest.fn();

// Mock window properties for testing
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

// matchMedia is already defined in tests/setup.js, so we don't need to redefine it

Object.defineProperty(document, 'querySelector', {
  writable: true,
  configurable: true,
  value: mockQuerySelector
});

describe('DeviceManager', () => {
  let deviceManagerInstance;

  beforeEach(() => {
    // Create fresh instance for each test
    deviceManagerInstance = new DeviceManager();
    
    // Reset window properties to default test values
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });
    
    // Reset mocks
    mockGetComputedStyle.mockClear();
    mockMatchMedia.mockClear();
    mockQuerySelector.mockClear();
  });

  afterEach(() => {
    // Clean up
    if (deviceManagerInstance) {
      deviceManagerInstance = null;
    }
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      expect(deviceManagerInstance).toBeDefined();
      expect(deviceManagerInstance.isInitialized).toBe(false);
    });

    test('should initialize when init() is called', async () => {
      await deviceManagerInstance.init();
      expect(deviceManagerInstance.isInitialized).toBe(true);
    });
  });

  describe('Device Context', () => {
    test('should get device context', async () => {
      await deviceManagerInstance.init();
      const context = deviceManagerInstance.getContext();
      
      expect(context).toBeDefined();
      expect(context.width).toBe(1024);
      expect(context.height).toBe(768);
      expect(context.pixelRatio).toBe(1);
    });

    test('should detect desktop breakpoint', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.breakpoint).toBe('desktop');
    });

    test('should detect tablet breakpoint', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.breakpoint).toBe('tablet');
    });

    test('should detect mobile breakpoint', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.breakpoint).toBe('mobile-large');
    });
  });

  describe('Responsive Context', () => {
    test('should get responsive context', async () => {
      await deviceManagerInstance.init();
      const responsiveContext = getResponsiveContext();
      
      expect(responsiveContext).toBeDefined();
      expect(responsiveContext.width).toBe(1024);
      expect(responsiveContext.height).toBe(768);
    });
  });

  describe('Mobile Size Detection', () => {
    test('should detect mobile size correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      expect(isMobileSize()).toBe(true);
    });

    test('should detect non-mobile size correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      expect(isMobileSize()).toBe(false);
    });
  });

  describe('Orientation Detection', () => {
    test('should detect landscape orientation', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.orientation).toBe('landscape');
    });

    test('should detect portrait orientation', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.orientation).toBe('portrait');
    });
  });

  describe('Touch Detection', () => {
    test('should detect touch capability', async () => {
      // Mock touch capability
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, writable: true, configurable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.isTouch).toBe(true);
    });

    test('should detect non-touch capability', async () => {
      // Mock non-touch capability
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, writable: true, configurable: true });
      await deviceManagerInstance.init();
      
      const context = deviceManagerInstance.getContext();
      expect(context.isTouch).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();
      await deviceManagerInstance.init();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Handling', () => {
    test('should handle missing window properties gracefully', () => {
      // Temporarily remove window properties
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;
      
      delete window.innerWidth;
      delete window.innerHeight;
      
      // Should not throw - init() returns context object
      expect(() => {
        const result = deviceManagerInstance.init();
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }).not.toThrow();
      
      // Restore properties
      Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
    });
  });

  describe('Global Instance', () => {
    test('should have global deviceManager instance', () => {
      expect(deviceManager).toBeDefined();
      expect(deviceManager).toBeInstanceOf(DeviceManager);
    });

    test('should have global DeviceContext', () => {
      expect(window.DeviceContext).toBeDefined();
      expect(typeof window.DeviceContext.getContext).toBe('function');
    });
  });
});