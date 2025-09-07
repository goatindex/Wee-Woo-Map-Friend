/**
 * ErrorBoundary Test Suite
 * Comprehensive tests for the error handling system
 */

import { 
  ErrorBoundary, 
  ErrorType, 
  ErrorSeverity, 
  RecoveryStrategy, 
  CircuitState,
  CircuitBreaker,
  RetryStrategy,
  ErrorClassifier,
  ErrorContext
} from '../js/modules/ErrorBoundary.js';

describe('ErrorBoundary System', () => {
  let errorBoundary;
  let mockLogger;

  beforeEach(() => {
    // Mock the logger
    mockLogger = {
      createChild: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      })),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock the global logger
    jest.doMock('../js/modules/StructuredLogger.js', () => ({
      logger: mockLogger
    }));

    errorBoundary = new ErrorBoundary();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorClassifier', () => {
    let classifier;

    beforeEach(() => {
      classifier = new ErrorClassifier();
    });

    test('should classify network errors correctly', () => {
      const error = new Error('Network request failed');
      const context = new ErrorContext({ component: 'DataService' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.NETWORK);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.strategy).toBe(RecoveryStrategy.RETRY);
      expect(classification.retryable).toBe(true);
    });

    test('should classify timeout errors correctly', () => {
      const error = new Error('Request timeout');
      const context = new ErrorContext({ component: 'DataService' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.TIMEOUT);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.strategy).toBe(RecoveryStrategy.RETRY);
      expect(classification.retryable).toBe(true);
    });

    test('should classify validation errors correctly', () => {
      const error = new Error('Invalid data format');
      const context = new ErrorContext({ component: 'DataValidator' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.VALIDATION);
      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.strategy).toBe(RecoveryStrategy.FALLBACK);
      expect(classification.retryable).toBe(false);
    });

    test('should classify permission errors correctly', () => {
      const error = new Error('Access denied');
      const context = new ErrorContext({ component: 'AuthService' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.PERMISSION);
      expect(classification.severity).toBe(ErrorSeverity.HIGH);
      expect(classification.strategy).toBe(RecoveryStrategy.DEGRADE);
      expect(classification.retryable).toBe(false);
    });

    test('should classify data errors correctly', () => {
      const error = new Error('Invalid JSON format');
      const context = new ErrorContext({ component: 'DataService' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.DATA);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.strategy).toBe(RecoveryStrategy.FALLBACK);
      expect(classification.retryable).toBe(true);
    });

    test('should classify runtime errors correctly', () => {
      const error = new ReferenceError('Variable is not defined');
      const context = new ErrorContext({ component: 'MapManager' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.RUNTIME);
      expect(classification.severity).toBe(ErrorSeverity.CRITICAL);
      expect(classification.strategy).toBe(RecoveryStrategy.FAIL);
      expect(classification.retryable).toBe(false);
    });

    test('should classify unknown errors correctly', () => {
      const error = new Error('Some unknown error');
      const context = new ErrorContext({ component: 'UnknownComponent' });
      
      const classification = classifier.classify(error, context);
      
      expect(classification.type).toBe(ErrorType.UNKNOWN);
      expect(classification.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classification.strategy).toBe(RecoveryStrategy.RETRY);
      expect(classification.retryable).toBe(true);
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        timeout: 1000,
        resetTimeout: 500
      });
    });

    test('should start in CLOSED state', () => {
      expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(0);
    });

    test('should execute successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation, 'testOperation');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
    });

    test('should handle failures and remain CLOSED under threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(circuitBreaker.execute(operation, 'testOperation')).rejects.toThrow('Test error');
      
      expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(1);
    });

    test('should open circuit after failure threshold', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Execute operations to reach failure threshold
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation, 'testOperation')).rejects.toThrow('Test error');
      }
      
      expect(circuitBreaker.state).toBe(CircuitState.OPEN);
      expect(circuitBreaker.failureCount).toBe(3);
    });

    test('should reject operations when circuit is OPEN', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation, 'testOperation')).rejects.toThrow('Test error');
      }
      
      // Try to execute when circuit is open
      await expect(circuitBreaker.execute(operation, 'testOperation')).rejects.toThrow('Circuit breaker is OPEN');
    });

    test('should transition to HALF_OPEN after reset timeout', async () => {
      jest.useFakeTimers();
      
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation, 'testOperation')).rejects.toThrow('Test error');
      }
      
      // Fast-forward time past reset timeout
      jest.advanceTimersByTime(600);
      
      // Next operation should transition to HALF_OPEN
      const successOperation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successOperation, 'testOperation');
      
      expect(result).toBe('success');
      expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
      
      jest.useRealTimers();
    });

    test('should reset circuit breaker', () => {
      circuitBreaker.failureCount = 5;
      circuitBreaker.state = CircuitState.OPEN;
      
      circuitBreaker.reset();
      
      expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.failureCount).toBe(0);
    });
  });

  describe('RetryStrategy', () => {
    let retryStrategy;

    beforeEach(() => {
      retryStrategy = new RetryStrategy({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false
      });
    });

    test('should execute successful operation on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryStrategy.execute(operation, 'testOperation');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should retry failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await retryStrategy.execute(operation, 'testOperation');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(retryStrategy.execute(operation, 'testOperation')).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should calculate exponential backoff delay', () => {
      const delay1 = retryStrategy.calculateDelay(1);
      const delay2 = retryStrategy.calculateDelay(2);
      const delay3 = retryStrategy.calculateDelay(3);
      
      expect(delay1).toBe(100); // baseDelay
      expect(delay2).toBe(200); // baseDelay * 2^1
      expect(delay3).toBe(400); // baseDelay * 2^2
    });

    test('should cap delay at maxDelay', () => {
      const delay4 = retryStrategy.calculateDelay(4);
      const delay5 = retryStrategy.calculateDelay(5);
      
      expect(delay4).toBe(1000); // maxDelay
      expect(delay5).toBe(1000); // maxDelay
    });
  });

  describe('ErrorBoundary', () => {
    test('should handle errors with classification', async () => {
      const error = new Error('Network request failed');
      const context = new ErrorContext({ component: 'DataService' });
      
      await expect(errorBoundary.handleError(error, context)).rejects.toThrow('Network request failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error handled by ErrorBoundary', expect.any(Object));
    });

    test('should register and use fallback handlers', async () => {
      const fallbackHandler = jest.fn().mockResolvedValue('fallback result');
      errorBoundary.registerFallbackHandler('DataService', fallbackHandler);
      
      const error = new Error('Invalid data format');
      const context = new ErrorContext({ component: 'DataService' });
      
      const result = await errorBoundary.handleError(error, context);
      
      expect(fallbackHandler).toHaveBeenCalledWith(error, context);
      expect(result).toBe('fallback result');
    });

    test('should maintain error history', () => {
      const error1 = new Error('First error');
      const context1 = new ErrorContext({ component: 'Component1' });
      
      const error2 = new Error('Second error');
      const context2 = new ErrorContext({ component: 'Component2' });
      
      errorBoundary.handleError(error1, context1);
      errorBoundary.handleError(error2, context2);
      
      const history = errorBoundary.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].error).toBe(error1);
      expect(history[1].error).toBe(error2);
    });

    test('should provide error statistics', () => {
      const error1 = new Error('Network request failed');
      const context1 = new ErrorContext({ component: 'DataService' });
      
      const error2 = new Error('Invalid data format');
      const context2 = new ErrorContext({ component: 'DataValidator' });
      
      errorBoundary.handleError(error1, context1);
      errorBoundary.handleError(error2, context2);
      
      const stats = errorBoundary.getErrorStatistics();
      
      expect(stats.total).toBe(2);
      expect(stats.byType[ErrorType.NETWORK]).toBe(1);
      expect(stats.byType[ErrorType.VALIDATION]).toBe(1);
      expect(stats.byComponent['DataService']).toBe(1);
      expect(stats.byComponent['DataValidator']).toBe(1);
    });

    test('should get circuit breaker for component', () => {
      const breaker1 = errorBoundary.getCircuitBreaker('DataService');
      const breaker2 = errorBoundary.getCircuitBreaker('DataService');
      
      expect(breaker1).toBe(breaker2); // Same instance
      expect(breaker1).toBeInstanceOf(CircuitBreaker);
    });

    test('should get retry strategy for component', () => {
      const strategy1 = errorBoundary.getRetryStrategy('DataService');
      const strategy2 = errorBoundary.getRetryStrategy('DataService');
      
      expect(strategy1).toBe(strategy2); // Same instance
      expect(strategy1).toBeInstanceOf(RetryStrategy);
    });

    test('should reset circuit breakers', () => {
      const breaker = errorBoundary.getCircuitBreaker('DataService');
      breaker.failureCount = 5;
      breaker.state = CircuitState.OPEN;
      
      errorBoundary.resetCircuitBreakers();
      
      expect(breaker.state).toBe(CircuitState.CLOSED);
      expect(breaker.failureCount).toBe(0);
    });

    test('should clear error history', () => {
      const error = new Error('Test error');
      const context = new ErrorContext({ component: 'TestComponent' });
      
      errorBoundary.handleError(error, context);
      expect(errorBoundary.getErrorHistory()).toHaveLength(1);
      
      errorBoundary.clearErrorHistory();
      expect(errorBoundary.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('ErrorContext', () => {
    test('should create context with default values', () => {
      const context = new ErrorContext();
      
      expect(context.component).toBe('unknown');
      expect(context.operation).toBe('unknown');
      expect(context.userId).toBeNull();
      expect(context.sessionId).toBeNull();
      expect(context.timestamp).toBeInstanceOf(Number);
      expect(context.metadata).toEqual({});
    });

    test('should create context with provided values', () => {
      const options = {
        component: 'DataService',
        operation: 'loadData',
        userId: 'user123',
        sessionId: 'session456',
        metadata: { category: 'test' }
      };
      
      const context = new ErrorContext(options);
      
      expect(context.component).toBe('DataService');
      expect(context.operation).toBe('loadData');
      expect(context.userId).toBe('user123');
      expect(context.sessionId).toBe('session456');
      expect(context.metadata).toEqual({ category: 'test' });
    });
  });
});
