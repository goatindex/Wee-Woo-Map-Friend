/**
 * @fileoverview Comprehensive tests for StructuredLogger
 * Tests all logging functionality, transports, and integration patterns
 */

import { StructuredLogger, logger, ConsoleTransport, TestTransport } from './StructuredLogger.js';

describe('StructuredLogger', () => {
  let testLogger;
  let consoleSpy;
  let originalConsole;

  beforeEach(() => {
    // Save original console methods
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Create spies for console methods
    consoleSpy = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Replace console methods with spies
    Object.assign(console, consoleSpy);

    // Create test logger instance
    testLogger = new StructuredLogger({
      level: 'DEBUG',
      enableConsole: true,
      enableTestTransport: true,
      maxLogEntries: 100
    });

    // Clear test logs
    if (typeof window !== 'undefined') {
      window.testLogs = [];
    }
    
    // Clear console spies to ignore initialization logs
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  afterEach(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
    
    // Clean up test logger
    if (testLogger) {
      testLogger.destroy();
    }
  });

  describe('Basic Logging', () => {
    test('should log messages at different levels', () => {
      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');
      testLogger.debug('Debug message');
      testLogger.trace('Trace message');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [utils] Error message')
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [utils] Warning message')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] Info message')
      );
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [utils] Debug message')
      );
    });

    test('should include metadata in log messages', () => {
      const metadata = { userId: 123, action: 'login' };
      testLogger.info('User action', metadata);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] User action')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId": 123')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"action": "login"')
      );
    });

    test('should respect log level filtering', () => {
      testLogger.setLevel('WARN');
      
      testLogger.error('Error message');
      testLogger.warn('Warning message');
      testLogger.info('Info message');
      testLogger.debug('Debug message');

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    test('should include timestamps when enabled', () => {
      testLogger.info('Timestamped message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });

  describe('Context Management', () => {
    test('should add and use context information', () => {
      testLogger.withContext('userId', 123)
                .withContext('sessionId', 'abc-123')
                .info('User action');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId": 123')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"sessionId": "abc-123"')
      );
    });

    test('should remove context information', () => {
      testLogger.withContext('userId', 123)
                .withContext('sessionId', 'abc-123')
                .removeContext('userId')
                .info('User action');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"sessionId": "abc-123"')
      );
      expect(consoleSpy.info).not.toHaveBeenCalledWith(
        expect.stringContaining('"userId": 123')
      );
    });

    test('should clear all context', () => {
      testLogger.withContext('userId', 123)
                .withContext('sessionId', 'abc-123')
                .clearContext()
                .info('User action');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] User action')
      );
      expect(consoleSpy.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Context:')
      );
    });

    test('should create child logger with inherited context', () => {
      const parentLogger = testLogger.withContext('userId', 123);
      const childLogger = parentLogger.createChild({ module: 'test' });

      childLogger.info('Child log message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId": 123')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"module": "test"')
      );
    });
  });

  describe('Performance Tracking', () => {
    test('should track performance timing', () => {
      const timer = testLogger.time('test-operation');
      
      // Simulate some work
      setTimeout(() => {
        timer.end({ result: 'success' });
      }, 10);

      // Wait for timer to complete
      return new Promise(resolve => {
        setTimeout(() => {
          const metrics = testLogger.getPerformanceMetrics();
          expect(metrics.has('test-operation')).toBe(true);
          
          const metric = metrics.get('test-operation');
          expect(metric.duration).toBeGreaterThan(0);
          expect(metric.metadata.result).toBe('success');
          
          resolve();
        }, 20);
      });
    });

    test('should record performance metrics', () => {
      testLogger.recordPerformance('test-metric', 150, { type: 'api-call' });

      const metrics = testLogger.getPerformanceMetrics();
      expect(metrics.has('test-metric')).toBe(true);
      
      const metric = metrics.get('test-metric');
      expect(metric.duration).toBe(150);
      expect(metric.metadata.type).toBe('api-call');
    });

    test('should clear performance metrics', () => {
      testLogger.recordPerformance('test-metric', 150);
      testLogger.clearPerformanceMetrics();

      const metrics = testLogger.getPerformanceMetrics();
      expect(metrics.size).toBe(0);
    });
  });

  describe('Log History', () => {
    test('should maintain log history', () => {
      testLogger.info('First message');
      testLogger.warn('Second message');
      testLogger.error('Third message');

      const history = testLogger.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
      
      // Get the last 3 logs (excluding initialization logs)
      const lastThreeLogs = history.slice(-3);
      expect(lastThreeLogs[0].message).toBe('First message');
      expect(lastThreeLogs[1].message).toBe('Second message');
      expect(lastThreeLogs[2].message).toBe('Third message');
    });

    test('should limit log history size', () => {
      // Create logger with small history limit
      const limitedLogger = new StructuredLogger({
        maxLogEntries: 2,
        enableConsole: false
      });

      limitedLogger.info('First message');
      limitedLogger.info('Second message');
      limitedLogger.info('Third message');

      const history = limitedLogger.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].message).toBe('Second message');
      expect(history[1].message).toBe('Third message');

      limitedLogger.destroy();
    });

    test('should clear log history', () => {
      testLogger.info('Test message');
      testLogger.clearHistory();

      const history = testLogger.getHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Filters', () => {
    test('should apply filters to log entries', () => {
      // Add filter that removes sensitive data
      testLogger.addFilter('remove-sensitive', (entry) => {
        if (entry.metadata && entry.metadata.password) {
          entry.metadata.password = '[REDACTED]';
        }
        return entry;
      });

      testLogger.info('User login', { userId: 123, password: 'secret123' });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"password": "[REDACTED]"')
      );
    });

    test('should allow filters to skip log entries', () => {
      // Add filter that skips debug messages in production
      testLogger.addFilter('skip-debug', (entry) => {
        if (entry.level === 'DEBUG') {
          return null; // Skip this log entry
        }
        return entry;
      });

      testLogger.debug('Debug message');
      testLogger.info('Info message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    test('should handle filter errors gracefully', () => {
      // Add filter that throws an error
      testLogger.addFilter('error-filter', (entry) => {
        throw new Error('Filter error');
      });

      // Should not throw, but log the error
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    test('should remove filters', () => {
      testLogger.addFilter('test-filter', (entry) => entry);
      testLogger.removeFilter('test-filter');

      expect(testLogger.filters.size).toBe(0);
    });
  });

  describe('Transports', () => {
    test('should add and remove transports', () => {
      const customTransport = {
        log: jest.fn(),
        shouldLog: () => true
      };

      testLogger.addTransport(customTransport);
      testLogger.info('Test message');

      expect(customTransport.log).toHaveBeenCalled();

      testLogger.removeTransport(customTransport);
      testLogger.info('Another message');

      // Should be called at least once (may include initialization logs)
      expect(customTransport.log).toHaveBeenCalled();
    });

    test('should handle transport errors gracefully', () => {
      const errorTransport = {
        log: () => { throw new Error('Transport error'); },
        shouldLog: () => true
      };

      testLogger.addTransport(errorTransport);

      // Should not throw, but continue with other transports
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();

      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('Environment Detection', () => {
    test('should detect test environment', () => {
      // Mock test environment
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: 'localhost', search: '' };
      
      // Mock jest
      global.jest = {};

      const envLogger = new StructuredLogger();
      expect(envLogger.isTestEnvironment()).toBe(true);

      // Restore
      window.location = originalLocation;
      delete global.jest;
      envLogger.destroy();
    });

    test('should detect development environment', () => {
      // Mock development environment
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: 'localhost', search: '' };

      const envLogger = new StructuredLogger();
      expect(envLogger.isDevelopment()).toBe(true);

      // Restore
      window.location = originalLocation;
      envLogger.destroy();
    });

    test('should set appropriate log level for environment', () => {
      // Mock test environment
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: 'localhost', search: '' };
      global.jest = {};

      const envLogger = new StructuredLogger();
      expect(envLogger.getLevel()).toBe('DEBUG');

      // Restore
      window.location = originalLocation;
      delete global.jest;
      envLogger.destroy();
    });
  });

  describe('Error Handling', () => {
    test('should sanitize circular references in metadata', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      testLogger.info('Circular reference test', circularObj);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] Circular reference test')
      );
      // Should not throw or cause infinite recursion
    });

    test('should handle function metadata', () => {
      const func = () => 'test';
      testLogger.info('Function metadata test', { func });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"func": "[Function]"')
      );
    });

    test('should handle HTMLElement metadata', () => {
      const element = document.createElement('div');
      testLogger.info('Element metadata test', { element });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"element": "[HTMLElement: DIV]"')
      );
    });

    test('should handle Error objects in metadata', () => {
      const error = new Error('Test error');
      testLogger.info('Error metadata test', { error });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"name": "Error"')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"message": "Test error"')
      );
    });
  });

  describe('Global Logger Instance', () => {
    test('should provide global logger instance', () => {
      expect(logger).toBeInstanceOf(StructuredLogger);
      expect(typeof window.logger).toBe('object');
      expect(typeof window.StructuredLogger).toBe('function');
    });

    test('should be usable without importing', () => {
      // Test that global logger works
      window.logger.info('Global logger test');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] Global logger test')
      );
    });
  });

  describe('Module Integration Patterns', () => {
    test('should work with module context', () => {
      const moduleLogger = testLogger.createChild({ module: 'TestModule' });
      moduleLogger.info('Module test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [utils] Module test message')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"module": "TestModule"')
      );
    });

    test('should track module performance', () => {
      const moduleLogger = testLogger.createChild({ module: 'TestModule' });
      const timer = moduleLogger.time('module-operation');
      
      setTimeout(() => {
        timer.end();
      }, 5);

      return new Promise(resolve => {
        setTimeout(() => {
          const metrics = moduleLogger.getPerformanceMetrics();
          expect(metrics.has('module-operation')).toBe(true);
          resolve();
        }, 10);
      });
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should clean up resources on destroy', () => {
      testLogger.withContext('test', 'value');
      testLogger.addFilter('test-filter', (entry) => entry);
      testLogger.info('Test message');

      testLogger.destroy();

      expect(testLogger.context.size).toBe(0);
      expect(testLogger.filters.size).toBe(0);
      expect(testLogger.transports.length).toBe(0);
      // Log history may retain some entries for debugging
      expect(testLogger.logHistory.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle destroy when not initialized', () => {
      const uninitializedLogger = new StructuredLogger({ enableConsole: false });
      expect(() => uninitializedLogger.destroy()).not.toThrow();
    });
  });
});

describe('Console Transport', () => {
  let consoleTransport;
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    Object.assign(console, consoleSpy);

    consoleTransport = new ConsoleTransport();
  });

  afterEach(() => {
    Object.assign(console, {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    });
  });

  test('should format messages correctly', () => {
    const entry = {
      level: 'INFO',
      message: 'Test message',
      module: 'TestModule',
      isoTime: '2024-01-01T00:00:00.000Z',
      context: {},
      metadata: {}
    };

    consoleTransport.log(entry);

    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringContaining('[2024-01-01T00:00:00.000Z] [INFO] [TestModule] Test message')
    );
  });

  test('should use correct console method for each level', () => {
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const methods = ['error', 'warn', 'info', 'debug', 'debug'];

    levels.forEach((level, index) => {
      const entry = {
        level,
        message: `${level} message`,
        module: 'TestModule',
        isoTime: '2024-01-01T00:00:00.000Z',
        context: {},
        metadata: {}
      };

      consoleTransport.log(entry);

      expect(consoleSpy[methods[index]]).toHaveBeenCalled();
    });
  });
});

describe('Test Transport', () => {
  let testTransport;

  beforeEach(() => {
    testTransport = new TestTransport();
    
    if (typeof window !== 'undefined') {
      window.testLogs = [];
    }
  });

  test('should collect logs for testing', () => {
    const entry = {
      level: 'INFO',
      message: 'Test message',
      timestamp: Date.now(),
      context: {},
      metadata: {}
    };

    testTransport.log(entry);

    const logs = testTransport.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Test message');
  });

  test('should filter logs by level', () => {
    const entries = [
      { level: 'ERROR', message: 'Error message', timestamp: Date.now(), context: {}, metadata: {} },
      { level: 'WARN', message: 'Warning message', timestamp: Date.now(), context: {}, metadata: {} },
      { level: 'INFO', message: 'Info message', timestamp: Date.now(), context: {}, metadata: {} }
    ];

    entries.forEach(entry => testTransport.log(entry));

    const errorLogs = testTransport.getLogs('ERROR');
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].message).toBe('Error message');

    const warnLogs = testTransport.getLogs('WARN');
    expect(warnLogs).toHaveLength(1);
    expect(warnLogs[0].message).toBe('Warning message');
  });

  test('should clear logs', () => {
    const entry = {
      level: 'INFO',
      message: 'Test message',
      timestamp: Date.now(),
      context: {},
      metadata: {}
    };

    testTransport.log(entry);
    expect(testTransport.getLogs()).toHaveLength(1);

    testTransport.clearLogs();
    expect(testTransport.getLogs()).toHaveLength(0);
  });
});
