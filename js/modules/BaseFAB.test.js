/**
 * @fileoverview Tests for BaseFAB component
 */

import { BaseFAB } from './BaseFAB.js';

// Mock StructuredLogger
jest.mock('./StructuredLogger.js', () => ({
  logger: {
    createChild: jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('BaseFAB', () => {
  let mockDocument;
  let mockButton;
  let mockBody;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock DOM elements
    mockButton = {
      id: '',
      className: '',
      textContent: '',
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      parentNode: null,
      style: {}
    };

    mockBody = {
      appendChild: jest.fn()
    };

    mockDocument = {
      createElement: jest.fn(() => mockButton),
      body: mockBody
    };

    // Mock global document
    global.document = mockDocument;
    
    // Mock localStorage properly
    const mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn()
    };
    
    global.window = {
      localStorage: mockLocalStorage
    };
    
    // Make sure the mock is available
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create instance with default config', () => {
      const fab = new BaseFAB();
      
      expect(fab.config).toEqual({
        id: null,
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '56px',
        height: '56px',
        zIndex: 9999,
        icon: '☰',
        ariaLabel: 'Floating Action Button',
        ariaControls: null,
        ariaExpanded: 'true',
        title: 'FAB',
        className: 'fab',
        style: {}
      });
      expect(fab.isInitialized).toBe(false);
      expect(fab.observers).toEqual([]);
      expect(fab.eventListeners).toEqual([]);
    });

    test('should merge custom config with defaults', () => {
      const customConfig = {
        id: 'test-fab',
        icon: '🚀',
        className: 'custom-fab'
      };
      
      const fab = new BaseFAB(customConfig);
      
      expect(fab.config.id).toBe('test-fab');
      expect(fab.config.icon).toBe('🚀');
      expect(fab.config.className).toBe('custom-fab');
      expect(fab.config.position).toBe('fixed'); // Should keep default
    });
  });

  describe('init', () => {
    test('should initialize FAB successfully', async () => {
      const fab = new BaseFAB({ id: 'test-fab', dom: mockDocument });
      
      await fab.init();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockButton);
      expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockButton.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(fab.isInitialized).toBe(true);
    });

    test('should not initialize twice', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      
      await fab.init();
      await fab.init(); // Second call
      
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization errors', async () => {
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      const fab = new BaseFAB({ dom: mockDocument });
      
      await expect(fab.init()).rejects.toThrow('DOM error');
      expect(fab.isInitialized).toBe(false);
    });
  });

  describe('createElement', () => {
    test('should create button with correct attributes', async () => {
      const fab = new BaseFAB({
        id: 'test-fab',
        icon: '🚀',
        className: 'custom-fab',
        ariaLabel: 'Test FAB',
        title: 'Test Title',
        dom: mockDocument
      });
      
      await fab.createElement();
      
      expect(mockButton.id).toBe('test-fab');
      expect(mockButton.className).toBe('custom-fab');
      expect(mockButton.textContent).toBe('🚀');
      expect(mockButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Test FAB');
      expect(mockButton.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(mockButton.title).toBe('Test Title');
    });

    test('should apply correct styles', async () => {
      const fab = new BaseFAB({
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '48px',
        height: '48px',
        zIndex: 1000,
        dom: mockDocument
      });
      
      await fab.createElement();
      
      expect(mockButton.style.position).toBe('absolute');
      expect(mockButton.style.top).toBe('10px');
      expect(mockButton.style.right).toBe('10px');
      expect(mockButton.style.width).toBe('48px');
      expect(mockButton.style.height).toBe('48px');
      expect(mockButton.style.zIndex).toBe(1000);
    });
  });

  describe('event handling', () => {
    test('should handle click events', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      const onClickSpy = jest.spyOn(fab, 'onClick');
      
      await fab.init();
      
      // Simulate click
      const clickHandler = mockButton.addEventListener.mock.calls
        .find(call => call[0] === 'click')[1];
      clickHandler({ type: 'click' });
      
      expect(onClickSpy).toHaveBeenCalled();
    });

    test('should handle keyboard events', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      const onClickSpy = jest.spyOn(fab, 'onClick');
      
      await fab.init();
      
      // Simulate Enter key
      const keydownHandler = mockButton.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')[1];
      keydownHandler({ key: 'Enter', preventDefault: jest.fn() });
      
      expect(onClickSpy).toHaveBeenCalled();
    });

    test('should not trigger click on other keys', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      const onClickSpy = jest.spyOn(fab, 'onClick');
      
      await fab.init();
      
      // Simulate other key
      const keydownHandler = mockButton.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')[1];
      keydownHandler({ key: 'Escape', preventDefault: jest.fn() });
      
      expect(onClickSpy).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    test('should save state to localStorage', () => {
      const fab = new BaseFAB();
      
      fab.saveState('test-key', { value: 'test' });
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ value: 'test' })
      );
    });

    test('should load state from localStorage', () => {
      window.localStorage.getItem.mockReturnValue('{"value":"test"}');
      
      const fab = new BaseFAB();
      const result = fab.loadState('test-key');
      
      expect(result).toEqual({ value: 'test' });
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    test('should handle localStorage errors gracefully', () => {
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const fab = new BaseFAB();
      
      expect(() => fab.saveState('test-key', 'test')).not.toThrow();
    });

    test('should return null for invalid JSON', () => {
      window.localStorage.getItem.mockReturnValue('invalid-json');
      
      const fab = new BaseFAB();
      const result = fab.loadState('test-key');
      
      expect(result).toBeNull();
    });
  });

  describe('updateConfig', () => {
    test('should update configuration', () => {
      const fab = new BaseFAB({ id: 'test' });
      const initSpy = jest.spyOn(fab, 'init').mockResolvedValue();
      
      fab.updateConfig({ icon: '🚀', className: 'new-class' });
      
      expect(fab.config.icon).toBe('🚀');
      expect(fab.config.className).toBe('new-class');
      expect(fab.config.id).toBe('test'); // Should preserve existing
    });

    test('should re-initialize if already initialized', async () => {
      const fab = new BaseFAB();
      const destroySpy = jest.spyOn(fab, 'destroy').mockImplementation();
      const initSpy = jest.spyOn(fab, 'init').mockResolvedValue();
      
      fab.isInitialized = true;
      fab.updateConfig({ icon: '🚀' });
      
      expect(destroySpy).toHaveBeenCalled();
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    test('should return current state', () => {
      const fab = new BaseFAB({ id: 'test-fab' });
      fab.isInitialized = true;
      fab.button = mockButton;
      fab.eventListeners = [{ type: 'click', handler: jest.fn() }];
      
      const state = fab.getState();
      
      expect(state).toEqual({
        id: 'test-fab',
        isInitialized: true,
        config: fab.config,
        buttonExists: true,
        eventListenerCount: 1
      });
    });
  });

  describe('destroy', () => {
    test('should clean up properly', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      await fab.init();
      
      const removeEventListenersSpy = jest.spyOn(fab, 'removeEventListeners');
      
      fab.destroy();
      
      expect(removeEventListenersSpy).toHaveBeenCalled();
      expect(fab.isInitialized).toBe(false);
      expect(fab.observers).toEqual([]);
    });

    test('should remove button from DOM', async () => {
      const fab = new BaseFAB({ dom: mockDocument });
      await fab.init();
      
      mockButton.parentNode = { removeChild: jest.fn() };
      
      fab.destroy();
      
      expect(mockButton.parentNode.removeChild).toHaveBeenCalledWith(mockButton);
    });
  });
});
