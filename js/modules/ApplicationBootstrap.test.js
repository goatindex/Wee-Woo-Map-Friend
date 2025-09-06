/**
 * @jest-environment jsdom
 */

import { ApplicationBootstrap } from './ApplicationBootstrap.js';

describe('ApplicationBootstrap Error Recovery', () => {
  let bootstrap;
  let mockStateManager;
  let mockEventBus;

  beforeEach(() => {
    // Mock state manager
    mockStateManager = {
      set: jest.fn(),
      get: jest.fn(() => null)
    };
    
    // Mock event bus
    mockEventBus = {
      emit: jest.fn()
    };
    
    // Mock global dependencies
    global.stateManager = mockStateManager;
    global.globalEventBus = mockEventBus;
    
    bootstrap = new ApplicationBootstrap();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Recovery Mechanisms', () => {
    test('should attempt error recovery for module initialization', async () => {
      const error = new Error('Module load failed');
      const context = { moduleName: 'TestModule' };
      
      const result = await bootstrap.attemptErrorRecovery(error, 'core module initialization', context);
      
      expect(result).toBe(false); // Should fail without actual module
      expect(mockEventBus.emit).toHaveBeenCalledWith('app:bootstrapError', expect.any(Object));
    });

    test('should handle graceful degradation', async () => {
      const error = new Error('Test error');
      const phase = 'test phase';
      
      const result = await bootstrap.gracefulDegradation(phase, error);
      
      expect(result).toBe(true);
      expect(mockStateManager.set).toHaveBeenCalledWith('degradedMode', true);
      expect(mockStateManager.set).toHaveBeenCalledWith('degradedPhase', phase);
      expect(mockEventBus.emit).toHaveBeenCalledWith('app:degradedMode', { phase, error });
    });

    test('should check degraded mode status', () => {
      mockStateManager.get.mockReturnValue(true);
      
      const isDegraded = bootstrap.isDegradedMode();
      
      expect(isDegraded).toBe(true);
    });

    test('should get degraded mode information', () => {
      const mockInfo = {
        phase: 'test phase',
        error: 'Test error',
        timestamp: Date.now()
      };
      
      mockStateManager.get
        .mockReturnValueOnce(true) // isDegradedMode
        .mockReturnValueOnce(mockInfo.phase) // degradedPhase
        .mockReturnValueOnce(mockInfo.error) // degradedError
        .mockReturnValueOnce(mockInfo.timestamp); // degradedTimestamp
      
      const info = bootstrap.getDegradedModeInfo();
      
      expect(info).toEqual(mockInfo);
    });
  });

  describe('Network Error Handling', () => {
    test('should handle network connectivity check', async () => {
      // Mock fetch to simulate network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const isOnline = await bootstrap.checkNetworkConnectivity();
      
      expect(isOnline).toBe(false);
    });

    test('should handle network error with retry logic', async () => {
      const error = new Error('Network timeout');
      const operation = 'data loading';
      
      // Mock fetch to always fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await bootstrap.handleNetworkError(error, operation, 2);
      
      expect(result).toBe(false); // Should fail after retries
    });
  });

  describe('Safe Execute with Recovery', () => {
    test('should retry on failure with recovery enabled', async () => {
      let attemptCount = 0;
      const failingFunction = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt fails');
        }
        // Second attempt succeeds
      });
      
      // Mock recovery to succeed
      jest.spyOn(bootstrap, 'attemptErrorRecovery').mockResolvedValue(true);
      
      await bootstrap.safeExecute('test phase', failingFunction, {
        allowRecovery: true,
        maxRetries: 1
      });
      
      expect(failingFunction).toHaveBeenCalledTimes(2);
    });

    test('should enter degraded mode when recovery fails', async () => {
      const failingFunction = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });
      
      // Mock recovery to fail
      jest.spyOn(bootstrap, 'attemptErrorRecovery').mockResolvedValue(false);
      jest.spyOn(bootstrap, 'gracefulDegradation').mockResolvedValue(true);
      
      await bootstrap.safeExecute('test phase', failingFunction, {
        allowRecovery: true,
        allowDegradation: true,
        maxRetries: 1
      });
      
      expect(bootstrap.gracefulDegradation).toHaveBeenCalled();
    });
  });

  describe('User Notifications', () => {
    test('should show degraded mode notification', () => {
      // Mock DOM methods
      document.createElement = jest.fn(() => ({
        className: '',
        style: {},
        innerHTML: '',
        parentElement: null
      }));
      document.body = {
        appendChild: jest.fn()
      };
      
      const error = new Error('Test error');
      const phase = 'test phase';
      
      bootstrap.showDegradedModeNotification(phase, error);
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should show offline notification', () => {
      // Mock DOM methods
      document.querySelector = jest.fn(() => null);
      document.createElement = jest.fn(() => ({
        className: '',
        style: {},
        innerHTML: '',
        parentElement: null
      }));
      document.body = {
        appendChild: jest.fn()
      };
      
      bootstrap.showOfflineNotification();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });
});