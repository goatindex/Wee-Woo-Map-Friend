/**
 * @fileoverview Tests for ApplicationBootstrap - Unified Bootstrap System
 * Tests the core functionality of the unified application bootstrap system
 */

import { applicationBootstrap } from './ApplicationBootstrap.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

// Mock external dependencies - create a proper mock without circular references
const createMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  time: jest.fn().mockReturnValue({ end: jest.fn() }),
  createChild: jest.fn().mockImplementation(() => createMockLogger()),
  context: {
    get: jest.fn(() => 'ApplicationBootstrap'),
    set: jest.fn()
  }
});

jest.mock('./StructuredLogger.js', () => ({
  StructuredLogger: jest.fn().mockImplementation(() => createMockLogger()),
  logger: createMockLogger()
}));

// Mock DOM for tests
Object.defineProperty(document, 'getElementById', {
  value: jest.fn((id) => {
    if (id === 'map') return null; // No map container in tests
    return document.createElement('div');
  }),
  writable: true
});

describe('ApplicationBootstrap', () => {
  beforeEach(() => {
    // Reset state before each test
    stateManager.set('sesFacilityMarkers', {});
    stateManager.set('sesFacilityCoords', {});
    configurationManager.set('outlineColors', { ses: '#FF9900' });
    configurationManager.set('categoryMeta', {});
  });

  afterEach(() => {
    // Clean up after each test
    stateManager.set('sesFacilityMarkers', {});
    stateManager.set('sesFacilityCoords', {});
  });

  describe('Initialization', () => {
    test('should initialize correctly', () => {
      // The bootstrap may already be initialized from previous tests
      expect(applicationBootstrap.logger).toBeDefined();
      expect(applicationBootstrap.logger).toHaveProperty('info');
      expect(applicationBootstrap.logger).toHaveProperty('warn');
      expect(applicationBootstrap.logger).toHaveProperty('error');
    });

    test('should create module-specific logger', () => {
      expect(applicationBootstrap.logger).toBeDefined();
      expect(applicationBootstrap.logger.context).toBeDefined();
    });
  });

  describe('Bootstrap Process', () => {
    test('should initialize without errors', async () => {
      // Should not throw - bootstrap should handle missing map gracefully
      await expect(applicationBootstrap.init()).resolves.not.toThrow();
    });

    test('should mark as initialized after successful init', async () => {
      // Reset initialization state for this test
      applicationBootstrap.initialized = false;
      expect(applicationBootstrap.initialized).toBe(false);
      
      await applicationBootstrap.init();
      
      expect(applicationBootstrap.initialized).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dependencies gracefully', async () => {
      // Should not throw even with missing map container
      await expect(applicationBootstrap.init()).resolves.not.toThrow();
    });
  });

  describe('State Management Integration', () => {
    test('should integrate with StateManager correctly', async () => {
      // Set some test state
      stateManager.set('testKey', 'testValue');
      
      await applicationBootstrap.init();
      
      // State should still be accessible
      expect(stateManager.get('testKey')).toBe('testValue');
    });

    test('should integrate with ConfigurationManager correctly', async () => {
      // Set some test configuration
      configurationManager.set('testConfig', 'testValue');
      
      await applicationBootstrap.init();
      
      // Configuration should still be accessible
      expect(configurationManager.get('testConfig')).toBe('testValue');
    });
  });

  describe('Event System Integration', () => {
    test('should complete initialization successfully', async () => {
      // Test that initialization completes without errors
      await expect(applicationBootstrap.init()).resolves.not.toThrow();
      
      // Verify the bootstrap is in the expected state
      expect(applicationBootstrap.initialized).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();
      
      await applicationBootstrap.init();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should be idempotent - multiple init calls should not cause issues', async () => {
      // First initialization
      await applicationBootstrap.init();
      const firstInitState = applicationBootstrap.initialized;
      
      // Second initialization
      await applicationBootstrap.init();
      const secondInitState = applicationBootstrap.initialized;
      
      // Should remain initialized
      expect(firstInitState).toBe(true);
      expect(secondInitState).toBe(true);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle missing map container gracefully', async () => {
      // Mock document.getElementById to return null for map container
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn((id) => {
        if (id === 'map') return null;
        return originalGetElementById.call(document, id);
      });
      
      // Should not throw - bootstrap should handle missing map gracefully
      await expect(applicationBootstrap.init()).resolves.not.toThrow();
      
      // Restore original method
      document.getElementById = originalGetElementById;
    });

    test('should handle network errors gracefully', async () => {
      // Mock fetch to reject
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      // Should not throw
      await expect(applicationBootstrap.init()).resolves.not.toThrow();
      
      // Restore original fetch
      global.fetch = originalFetch;
    });
  });
});