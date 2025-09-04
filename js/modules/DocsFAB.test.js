/**
 * @fileoverview Tests for DocsFAB component
 */

import { DocsFAB } from './DocsFAB.js';

// Mock BaseFAB
jest.mock('./BaseFAB.js', () => ({
  BaseFAB: class MockBaseFAB {
    constructor(config) {
      this.config = config;
      this.id = config.id;
      this.isInitialized = false;
      this.logger = {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
    }
    
    async init() {
      return Promise.resolve();
    }
    
    destroy() {}
    
    getState() {
      return {
        id: this.id,
        isInitialized: this.isInitialized,
        config: this.config,
        buttonExists: !!this.button,
        eventListenerCount: 0
      };
    }
  }
}));

// Mock FABManager
jest.mock('./FABManager.js', () => ({
  fabManager: {
    register: jest.fn()
  }
}));

describe('DocsFAB', () => {
  let docsFab;
  let mockAppBootstrap;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.AppBootstrap
    mockAppBootstrap = {
      openDocs: jest.fn()
    };
    window.AppBootstrap = mockAppBootstrap;
    
    // Mock window.openDocs (legacy fallback)
    window.openDocs = jest.fn();
    
    docsFab = new DocsFAB();
  });

  afterEach(() => {
    delete window.AppBootstrap;
    delete window.openDocs;
  });

  describe('constructor', () => {
    test('should create instance with correct default config', () => {
      expect(docsFab.config.id).toBe('docsFab');
      expect(docsFab.config.className).toBe('fab fab-button');
      expect(docsFab.config.icon).toBe('📄');
      expect(docsFab.config.ariaLabel).toBe('Open documentation');
      expect(docsFab.config.title).toBe('Docs');
    });

    test('should merge custom config with defaults', () => {
      const customFab = new DocsFAB({
        id: 'custom-docs',
        icon: '📚'
      });
      
      expect(customFab.config.id).toBe('custom-docs');
      expect(customFab.config.icon).toBe('📚');
      expect(customFab.config.className).toBe('fab fab-button'); // Should keep default
    });
  });

  describe('onClick', () => {
    test('should call AppBootstrap.openDocs when available', () => {
      docsFab.onClick({ type: 'click' });
      
      expect(mockAppBootstrap.openDocs).toHaveBeenCalledWith('intro');
      expect(window.openDocs).not.toHaveBeenCalled();
    });

    test('should fallback to legacy openDocs when AppBootstrap not available', () => {
      delete window.AppBootstrap;
      
      docsFab.onClick({ type: 'click' });
      
      expect(window.openDocs).toHaveBeenCalledWith('intro');
    });

    test('should use fallback method when no docs methods available', () => {
      delete window.AppBootstrap;
      delete window.openDocs;
      
      // Mock document.querySelector to return a mock element
      const mockDocsContainer = {
        style: { display: 'block' },
        scrollIntoView: jest.fn()
      };
      document.querySelector = jest.fn().mockReturnValue(mockDocsContainer);
      
      docsFab.onClick({ type: 'click' });
      
      expect(document.querySelector).toHaveBeenCalledWith('.docs-container');
      expect(mockDocsContainer.style.display).toBe('block');
      expect(mockDocsContainer.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    test('should show alert when no docs container found', () => {
      delete window.AppBootstrap;
      delete window.openDocs;
      
      // Mock document.querySelector to return null
      document.querySelector = jest.fn().mockReturnValue(null);
      
      // Mock alert
      window.alert = jest.fn();
      
      docsFab.onClick({ type: 'click' });
      
      expect(window.alert).toHaveBeenCalledWith(
        'Documentation feature is not available. Please check if the documentation system is properly loaded.'
      );
    });

    test('should handle errors gracefully', () => {
      mockAppBootstrap.openDocs.mockImplementation(() => {
        throw new Error('Docs error');
      });
      
      // Mock document.createElement and body.appendChild for error notification
      const mockErrorDiv = {
        style: {},
        textContent: ''
      };
      document.createElement = jest.fn().mockReturnValue(mockErrorDiv);
      
      // Mock document.body properly
      const mockBody = { appendChild: jest.fn() };
      Object.defineProperty(document, 'body', {
        value: mockBody,
        writable: true
      });
      
      // Mock setTimeout
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        fn();
        return 123;
      });
      
      docsFab.onClick({ type: 'click' });
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockErrorDiv.textContent).toBe('Failed to open documentation');
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockErrorDiv);
    });
  });

  describe('updateState', () => {
    test('should update button state when documentation is open', () => {
      docsFab.button = {
        setAttribute: jest.fn(),
        title: '',
        textContent: ''
      };
      
      docsFab.updateState(true);
      
      expect(docsFab.button.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(docsFab.button.title).toBe('Close documentation');
      expect(docsFab.button.textContent).toBe('✕');
    });

    test('should update button state when documentation is closed', () => {
      docsFab.button = {
        setAttribute: jest.fn(),
        title: '',
        textContent: ''
      };
      
      docsFab.updateState(false);
      
      expect(docsFab.button.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
      expect(docsFab.button.title).toBe('Open documentation');
      expect(docsFab.button.textContent).toBe('📄');
    });

    test('should handle missing button gracefully', () => {
      docsFab.button = null;
      
      expect(() => docsFab.updateState(true)).not.toThrow();
    });
  });

  describe('getState', () => {
    test('should return current state with type information', () => {
      docsFab.button = {
        getAttribute: jest.fn().mockReturnValue('true')
      };
      
      const state = docsFab.getState();
      
      expect(state.type).toBe('DocsFAB');
      expect(state.isDocumentationOpen).toBe(true);
    });

    test('should return false for documentation state when button missing', () => {
      docsFab.button = null;
      
      const state = docsFab.getState();
      
      expect(state.type).toBe('DocsFAB');
      expect(state.isDocumentationOpen).toBe(false);
    });
  });
});
