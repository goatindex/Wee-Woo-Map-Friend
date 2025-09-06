 /**
 * @fileoverview Tests for BaseFAB component - Real Code Testing
 */

import { BaseFAB } from './BaseFAB.js';

// Mock only external dependencies and browser APIs
const mockButton = {
  id: '',
  className: '',
  textContent: '',
  setAttribute: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  parentNode: null,
  style: {}
};

const mockBody = {
  appendChild: jest.fn()
};

const mockDocument = {
  createElement: jest.fn(() => mockButton),
  body: mockBody,
  addEventListener: jest.fn()
};

// Mock global document
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock window for JSDOM compatibility
Object.defineProperty(global, 'window', {
  value: {
    document: mockDocument,
    addEventListener: jest.fn(),
    location: {
      hostname: 'localhost',
      search: '?test=true'
    }
  },
  writable: true
});

describe('BaseFAB', () => {
  let fab;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset createElement mock to default behavior
    mockDocument.createElement.mockImplementation(() => mockButton);
    
    // Create new FAB instance
    fab = new BaseFAB({
      id: 'test-fab',
      ariaLabel: 'Test FAB',
      position: 'bottom-right',
      dom: mockDocument
    });
  });

  afterEach(() => {
    // Clean up
    if (fab && typeof fab.destroy === 'function') {
      fab.destroy();
    }
  });

  describe('constructor', () => {
    test('should create FAB with correct properties', () => {
      expect(fab.id).toBe('test-fab');
      expect(fab.config.ariaLabel).toBe('Test FAB');
      expect(fab.config.position).toBe('bottom-right');
      expect(fab.isInitialized).toBe(false);
    });

    test('should create FAB with default values', () => {
      const defaultFab = new BaseFAB({ id: 'default-fab' });
      expect(defaultFab.id).toBe('default-fab');
      expect(defaultFab.config.ariaLabel).toBe('Floating Action Button');
      expect(defaultFab.config.position).toBe('fixed');
      expect(defaultFab.isInitialized).toBe(false);
    });
  });

  describe('init', () => {
    test('should initialize FAB successfully', async () => {
      await fab.init();
      
      expect(fab.isInitialized).toBe(true);
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockButton);
    });

    test('should set button properties correctly', async () => {
      await fab.init();
      
      expect(mockButton.id).toBe('test-fab');
      expect(mockButton.className).toContain('fab');
      expect(mockButton.textContent).toBe('☰'); // BaseFAB uses icon, not text
      expect(mockButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Test FAB');
    });

    test('should add event listeners', async () => {
      await fab.init();
      
      expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock createElement to throw error
      const originalCreateElement = mockDocument.createElement;
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM error');
      });

      await expect(fab.init()).rejects.toThrow('DOM error');
      expect(fab.isInitialized).toBe(false);
      
      // Restore original mock
      mockDocument.createElement = originalCreateElement;
    });
  });

  describe('destroy', () => {
    test('should destroy FAB successfully', async () => {
      await fab.init();
      fab.destroy();
      
      expect(fab.isInitialized).toBe(false);
      expect(mockButton.removeEventListener).toHaveBeenCalled();
    });

    test('should handle destroy when not initialized', () => {
      expect(() => fab.destroy()).not.toThrow();
      expect(fab.isInitialized).toBe(false);
    });
  });

  describe('click handling', () => {
    test('should handle click events', async () => {
      await fab.init();
      
      // Get the click handler
      const clickHandler = mockButton.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )[1];
      
      expect(clickHandler).toBeDefined();
      expect(typeof clickHandler).toBe('function');
      
      // Mock click event
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };
      
      // Call the handler - should not throw
      expect(() => clickHandler(mockEvent)).not.toThrow();
    });
  });

  describe('position handling', () => {
    test('should set correct position style', async () => {
      const positionFab = new BaseFAB({
        id: 'position-fab',
        position: 'fixed',
        top: '10px',
        right: '10px',
        dom: mockDocument
      });
      
      await positionFab.init();
      
      expect(mockButton.className).toContain('fab');
      expect(mockButton.style.position).toBe('fixed');
      expect(mockButton.style.top).toBe('10px');
      expect(mockButton.style.right).toBe('10px');
    });

    test('should handle invalid position gracefully', async () => {
      const invalidFab = new BaseFAB({
        id: 'invalid-fab',
        position: 'invalid-position',
        dom: mockDocument
      });
      
      await invalidFab.init();
      
      expect(mockButton.className).toContain('fab');
      expect(mockButton.className).not.toContain('invalid-position');
    });
  });

  describe('error handling', () => {
    test('should handle missing DOM gracefully', async () => {
      // Create a BaseFAB with a broken DOM object
      const brokenDOM = {
        createElement: undefined, // This will cause an error
        body: { appendChild: jest.fn() }
      };
      
      const errorFab = new BaseFAB({
        id: 'error-fab',
        dom: brokenDOM
      });
      
      await expect(errorFab.init()).rejects.toThrow();
    });

    test('should handle missing body gracefully', async () => {
      // Create FAB with DOM that has no body
      const errorDocument = {
        createElement: jest.fn(() => mockButton),
        body: null
      };
      
      const errorFab = new BaseFAB({
        id: 'error-fab',
        dom: errorDocument
      });
      
      await expect(errorFab.init()).rejects.toThrow();
    });
  });

  describe('state management', () => {
    test('should track initialization state correctly', () => {
      expect(fab.isInitialized).toBe(false);
      
      // Should not be able to destroy when not initialized
      expect(() => fab.destroy()).not.toThrow();
      expect(fab.isInitialized).toBe(false);
    });

    test('should prevent double initialization', async () => {
      await fab.init();
      expect(fab.isInitialized).toBe(true);
      
      // Second init should not cause issues
      await fab.init();
      expect(fab.isInitialized).toBe(true);
    });
  });

  describe('configuration', () => {
    test('should accept custom configuration', () => {
      const customFab = new BaseFAB({
        id: 'custom-fab',
        ariaLabel: 'Custom Text',
        position: 'top-right',
        customProp: 'customValue'
      });
      
      expect(customFab.id).toBe('custom-fab');
      expect(customFab.config.ariaLabel).toBe('Custom Text');
      expect(customFab.config.position).toBe('top-right');
      expect(customFab.config.customProp).toBe('customValue');
    });

    test('should handle empty configuration', () => {
      const emptyFab = new BaseFAB({});
      
      expect(emptyFab.id).toBeNull();
      expect(emptyFab.config.ariaLabel).toBe('Floating Action Button');
      expect(emptyFab.config.position).toBe('fixed');
    });
  });

  describe('performance', () => {
    test('should initialize quickly', async () => {
      const startTime = Date.now();
      await fab.init();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle multiple instances efficiently', async () => {
      const fabs = [];
      const startTime = Date.now();
      
      // Create 10 FAB instances
      for (let i = 0; i < 10; i++) {
        const fab = new BaseFAB({
          id: `fab-${i}`,
          ariaLabel: `FAB ${i}`,
          dom: mockDocument
        });
        fabs.push(fab);
        await fab.init();
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3000ms
      
      // Clean up
      fabs.forEach(f => f.destroy());
    });
  });
});
