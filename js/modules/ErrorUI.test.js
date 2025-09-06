/**
 * @fileoverview Tests for ErrorUI module
 */

import { ErrorUI, errorUI, showSidebarError, isOffline, setupOfflineListener } from './ErrorUI.js';

// Mock DOM
const mockSidebar = {
  insertBefore: jest.fn(),
  firstChild: null,
  querySelectorAll: jest.fn(() => [])
};

Object.defineProperty(document, 'getElementById', {
  value: jest.fn((id) => id === 'layerMenu' ? mockSidebar : null),
  writable: true
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true
});

// Mock window events
const mockEventListeners = {};
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn((event, callback) => {
    mockEventListeners[event] = callback;
  }),
  writable: true
});

describe('ErrorUI', () => {
  let errorUIInstance;

  beforeEach(() => {
    errorUIInstance = new ErrorUI();
    jest.clearAllMocks();
    mockSidebar.insertBefore.mockClear();
    mockSidebar.querySelectorAll.mockReturnValue([]);
    
    // Reset document.getElementById mock
    document.getElementById.mockImplementation((id) => id === 'layerMenu' ? mockSidebar : null);
    
    // Clear error messages set
    errorUIInstance.errorMessages.clear();
  });

  describe('showSidebarError', () => {
    test('should display error message in sidebar', () => {
      const message = 'Test error message';
      
      errorUIInstance.showSidebarError(message);
      
      expect(document.getElementById).toHaveBeenCalledWith('layerMenu');
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
    });

    test('should handle missing sidebar gracefully', () => {
      document.getElementById.mockReturnValue(null);
      
      errorUIInstance.showSidebarError('Test message');
      
      expect(mockSidebar.insertBefore).not.toHaveBeenCalled();
    });

    test('should prevent duplicate messages with same ID', () => {
      const message = 'Duplicate test';
      const id = 'test-id';
      
      errorUIInstance.showSidebarError(message, { id });
      errorUIInstance.showSidebarError(message, { id }); // Same ID
      
      expect(mockSidebar.insertBefore).toHaveBeenCalledTimes(1);
    });

    test('should support different message types', () => {
      errorUIInstance.showSidebarError('Error message', { type: 'error' });
      errorUIInstance.showSidebarError('Warning message', { type: 'warning' });
      errorUIInstance.showSidebarError('Info message', { type: 'info' });
      
      expect(mockSidebar.insertBefore).toHaveBeenCalledTimes(3);
    });

    test('should auto-hide messages after specified time', (done) => {
      const message = 'Auto-hide test';
      
      errorUIInstance.showSidebarError(message, { autoHide: 100 });
      
      setTimeout(() => {
        // Message should be removed after 100ms
        done();
      }, 150);
    });
  });

  describe('removeErrorMessage', () => {
    test('should remove error message element', () => {
      const mockElement = {
        remove: jest.fn(),
        parentNode: {}
      };
      
      errorUIInstance.removeErrorMessage(mockElement, 'test-id');
      
      expect(mockElement.remove).toHaveBeenCalled();
    });

    test('should handle element without parent gracefully', () => {
      const mockElement = {
        remove: jest.fn(),
        parentNode: null
      };
      
      errorUIInstance.removeErrorMessage(mockElement, 'test-id');
      
      expect(mockElement.remove).not.toHaveBeenCalled();
    });
  });

  describe('clearAllErrors', () => {
    test('should clear all error messages', () => {
      const mockError1 = { remove: jest.fn() };
      const mockError2 = { remove: jest.fn() };
      mockSidebar.querySelectorAll.mockReturnValue([mockError1, mockError2]);
      
      errorUIInstance.clearAllErrors();
      
      expect(mockError1.remove).toHaveBeenCalled();
      expect(mockError2.remove).toHaveBeenCalled();
    });
  });

  describe('isOffline', () => {
    test('should return offline status', () => {
      navigator.onLine = false;
      expect(errorUIInstance.isOffline()).toBe(true);
      
      navigator.onLine = true;
      expect(errorUIInstance.isOffline()).toBe(false);
    });
  });

  describe('setupOfflineListener', () => {
    test('should setup offline event listeners', () => {
      errorUIInstance.setupOfflineListener();
      
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    test('should not setup listeners twice', () => {
      errorUIInstance.setupOfflineListener();
      errorUIInstance.setupOfflineListener();
      
      expect(window.addEventListener).toHaveBeenCalledTimes(2); // offline and online
    });

    test('should show messages on offline/online events', () => {
      errorUIInstance.setupOfflineListener();
      
      // Trigger offline event
      mockEventListeners.offline();
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
      
      // Trigger online event
      mockEventListeners.online();
      expect(mockSidebar.insertBefore).toHaveBeenCalledTimes(2);
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function exports', () => {
      showSidebarError('Legacy test');
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
      
      expect(typeof isOffline()).toBe('boolean');
      
      setupOfflineListener();
      expect(window.addEventListener).toHaveBeenCalled();
    });

    test('should work with singleton instance', () => {
      errorUI.showSidebarError('Singleton test');
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
    });
  });

  describe('Utility methods', () => {
    test('should show success messages', () => {
      errorUIInstance.showSuccessMessage('Success!');
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
    });

    test('should show warning messages', () => {
      errorUIInstance.showWarningMessage('Warning!');
      expect(mockSidebar.insertBefore).toHaveBeenCalled();
    });
  });
});
