# Logging Architecture & Integration Guide

**Project:** WeeWoo Map Friend  
**Date:** December 2024  
**Last Updated:** January 2025  
**Purpose:** Comprehensive guide for integrating with the centralized logging system

## Overview

The WeeWoo Map Friend application uses a centralized, structured logging system built on the `StructuredLogger` class. This system provides:

- **Structured Logging**: Consistent log format with metadata, context, and timestamps
- **Multiple Transports**: Console, Test, and Performance monitoring
- **Environment Awareness**: Automatic log level adjustment based on environment
- **Performance Tracking**: Built-in timing and performance monitoring
- **Context Management**: Hierarchical context inheritance for modules
- **Filtering**: Advanced filtering and sanitization capabilities
- **ESLint Integration**: Automated prevention of raw console.log usage
- **Migration Complete**: All modules now use StructuredLogger consistently

## Architecture

### Core Components

1. **StructuredLogger**: Main logging class with structured output
2. **Transports**: Pluggable output destinations (Console, Test, Performance)
3. **Filters**: Pre-processing pipeline for log entries
4. **Context System**: Hierarchical context management
5. **Performance Tracking**: Built-in timing and metrics collection

### Log Levels

```javascript
const levels = {
  ERROR: 0,    // Critical errors that break functionality
  WARN: 1,     // Warnings about potential issues
  INFO: 2,     // General information about system state
  DEBUG: 3,    // Detailed debugging information
  TRACE: 4     // Very detailed tracing information
};
```

### Environment-Based Configuration

- **Test Environment**: `DEBUG` level (all logs)
- **Development Environment**: `INFO` level (INFO, WARN, ERROR)
- **Production Environment**: `WARN` level (WARN, ERROR only)

## Recent Improvements (January 2025)

### Migration to StructuredLogger

All modules have been successfully migrated from raw `console.log` statements to the StructuredLogger system:

#### **Before Migration:**
```javascript
console.log('🔍 DataLoadingOrchestrator: PolygonLoader type:', typeof this.polygonLoader);
console.log('✅ MapManager: Map system ready');
console.log('🎯 FABManager: Modern ES6 module loaded');
```

#### **After Migration:**
```javascript
this.logger.debug('PolygonLoader type check', { type: typeof this.polygonLoader });
this.logger.info('Map system ready');
// Module loading logs removed - using StructuredLogger for initialization
```

### ESLint Integration

ESLint rules have been added to prevent future `console.log` usage:

```json
{
  "no-restricted-syntax": [
    "error",
    {
      "selector": "CallExpression[callee.object.name='console'][callee.property.name='log']",
      "message": "Use StructuredLogger instead of console.log. Import logger and use this.logger.info(), this.logger.debug(), etc."
    }
  ]
}
```

### Migration Results

- **92+ console.log statements** converted to StructuredLogger
- **12 debug investigation logs** removed or converted to `this.logger.debug()`
- **All success confirmation logs** converted to `this.logger.info()`
- **Module loading logs** removed (redundant with StructuredLogger initialization)
- **Tracing logs** converted to appropriate log levels
- **ESLint rules** prevent future console.log usage

## Integration Patterns

### 1. Basic Module Integration

Every ES6 module should integrate with the logging system using this pattern:

```javascript
// Import the logger
import { logger } from './StructuredLogger.js';

export class MyModule {
  constructor() {
    // Create module-specific logger with context
    this.logger = logger.createChild({ 
      module: 'MyModule',
      version: '1.0.0' // Optional version info
    });
    
    this.logger.info('Module initialized');
  }
  
  someMethod() {
    this.logger.debug('Method called', { 
      parameter: 'value',
      timestamp: Date.now() 
    });
    
    try {
      // Module logic here
      this.logger.info('Operation completed successfully');
    } catch (error) {
      this.logger.error('Operation failed', { 
        error: error.message,
        stack: error.stack 
      });
    }
  }
}
```

### 2. Performance Tracking Integration

For performance-critical operations:

```javascript
export class PerformanceModule {
  constructor() {
    this.logger = logger.createChild({ module: 'PerformanceModule' });
  }
  
  async performOperation() {
    const timer = this.logger.time('operation-duration');
    
    try {
      // Perform the operation
      const result = await this.doWork();
      
      timer.end({ 
        resultCount: result.length,
        success: true 
      });
      
      return result;
    } catch (error) {
      timer.end({ 
        error: error.message,
        success: false 
      });
      throw error;
    }
  }
}
```

### 3. Event-Driven Logging

For modules that emit events:

```javascript
export class EventModule {
  constructor() {
    this.logger = logger.createChild({ module: 'EventModule' });
    
    // Log important events
    globalEventBus.on('user:action', (data) => {
      this.logger.info('User action received', data);
    });
    
    globalEventBus.on('error:occurred', (error) => {
      this.logger.error('System error occurred', {
        error: error.message,
        stack: error.stack
      });
    });
  }
}
```

### 4. State Management Integration

For modules that manage state:

```javascript
export class StateModule {
  constructor() {
    this.logger = logger.createChild({ module: 'StateModule' });
    
    // Log state changes
    this.logger.withContext('stateVersion', 1);
  }
  
  updateState(newState) {
    const oldState = this.currentState;
    
    this.logger.info('State update initiated', {
      oldState: this.sanitizeState(oldState),
      newState: this.sanitizeState(newState),
      changeCount: Object.keys(newState).length
    });
    
    this.currentState = newState;
    
    this.logger.info('State update completed');
  }
  
  sanitizeState(state) {
    // Remove sensitive data before logging
    const sanitized = { ...state };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}
```

## Logging Best Practices

### 1. Log Level Guidelines

**ERROR**: Use for critical failures that break functionality
```javascript
this.logger.error('Failed to load critical data', {
  error: error.message,
  retryCount: 3,
  lastAttempt: Date.now()
});
```

**WARN**: Use for recoverable issues or deprecated usage
```javascript
this.logger.warn('Using deprecated API', {
  deprecatedMethod: 'oldMethod',
  recommendedMethod: 'newMethod',
  caller: this.getCallerInfo()
});
```

**INFO**: Use for important state changes and user actions
```javascript
this.logger.info('User logged in', {
  userId: user.id,
  loginMethod: 'oauth',
  timestamp: Date.now()
});
```

**DEBUG**: Use for detailed debugging information
```javascript
this.logger.debug('Processing data batch', {
  batchSize: data.length,
  processingTime: duration,
  memoryUsage: this.getMemoryUsage()
});
```

**TRACE**: Use for very detailed tracing (use sparingly)
```javascript
this.logger.trace('Function entry', {
  parameters: this.sanitizeParameters(params),
  callStack: new Error().stack
});
```

### 2. Metadata Guidelines

Always include relevant metadata with log entries:

```javascript
// Good: Rich metadata
this.logger.info('Data loaded successfully', {
  source: 'api',
  recordCount: data.length,
  loadTime: duration,
  cacheHit: false,
  userId: user.id
});

// Bad: Minimal metadata
this.logger.info('Data loaded');
```

### 3. Error Logging

Always include error details and context:

```javascript
try {
  await this.performOperation();
} catch (error) {
  this.logger.error('Operation failed', {
    operation: 'performOperation',
    error: error.message,
    stack: error.stack,
    context: {
      userId: this.userId,
      sessionId: this.sessionId,
      retryCount: this.retryCount
    }
  });
  throw error;
}
```

### 4. Performance Logging

Use the built-in timing for performance-critical operations:

```javascript
// Automatic performance tracking
const timer = this.logger.time('database-query');
const result = await this.queryDatabase(sql);
timer.end({ 
  recordCount: result.length,
  queryType: 'SELECT' 
});

// Manual performance tracking
this.logger.recordPerformance('custom-operation', duration, {
  operationType: 'batch-process',
  itemCount: items.length
});
```

## Context Management

### 1. Module Context

Set module-level context in the constructor:

```javascript
export class MyModule {
  constructor(config) {
    this.logger = logger.createChild({
      module: 'MyModule',
      version: config.version,
      environment: config.environment
    });
  }
}
```

### 2. Operation Context

Add operation-specific context:

```javascript
async processUser(userId) {
  const operationLogger = this.logger.withContext('userId', userId);
  
  operationLogger.info('Starting user processing');
  
  try {
    const user = await this.loadUser(userId);
    operationLogger.withContext('userType', user.type);
    
    await this.processUserData(user);
    operationLogger.info('User processing completed');
  } catch (error) {
    operationLogger.error('User processing failed', { error: error.message });
  }
}
```

### 3. Context Inheritance

Child loggers inherit parent context:

```javascript
const parentLogger = logger.withContext('sessionId', 'abc-123');
const childLogger = parentLogger.createChild({ module: 'ChildModule' });

// Both loggers will include sessionId in their output
parentLogger.info('Parent message'); // Includes sessionId
childLogger.info('Child message');   // Includes sessionId + module
```

## Testing Integration

### 1. Test Transport

The logging system automatically includes a test transport in test environments:

```javascript
// In tests, logs are collected for assertions
describe('MyModule', () => {
  beforeEach(() => {
    // Clear test logs
    if (window.testLogs) {
      window.testLogs = [];
    }
  });
  
  test('should log important events', () => {
    const module = new MyModule();
    module.performOperation();
    
    const logs = window.testLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('INFO');
    expect(logs[0].message).toBe('Operation completed');
  });
});
```

### 2. Log Assertions

Use the test transport for log-based assertions:

```javascript
test('should log errors correctly', () => {
  const module = new MyModule();
  
  expect(() => {
    module.performFailingOperation();
  }).toThrow();
  
  const errorLogs = window.testLogs.filter(log => log.level === 'ERROR');
  expect(errorLogs).toHaveLength(1);
  expect(errorLogs[0].metadata.error).toContain('Expected error message');
});
```

## Migration from Console Logging

### 1. Replace Console Statements

Replace all `console.log`, `console.warn`, `console.error` statements:

```javascript
// Before
console.log('User action:', action);
console.warn('Deprecated method used');
console.error('Operation failed:', error);

// After
this.logger.info('User action', { action });
this.logger.warn('Deprecated method used');
this.logger.error('Operation failed', { error: error.message, stack: error.stack });
```

### 2. Add Context

Add relevant context to log statements:

```javascript
// Before
console.log('Data loaded');

// After
this.logger.info('Data loaded', {
  source: 'api',
  recordCount: data.length,
  loadTime: duration
});
```

### 3. Use Appropriate Levels

Choose appropriate log levels:

```javascript
// Before
console.log('Debug info:', debugData);

// After
this.logger.debug('Debug info', debugData);
```

## Performance Considerations

### 1. Log Level Filtering

The system automatically filters logs based on environment, but you can optimize further:

```javascript
// Only create expensive metadata when needed
if (this.logger.shouldLog('DEBUG')) {
  this.logger.debug('Expensive debug info', {
    expensiveData: this.calculateExpensiveData()
  });
}
```

### 2. Metadata Sanitization

The system automatically sanitizes metadata, but be mindful of large objects:

```javascript
// Good: Include only relevant data
this.logger.info('User updated', {
  userId: user.id,
  fieldsChanged: Object.keys(changes).length
});

// Avoid: Logging large objects unnecessarily
this.logger.info('User updated', { user: fullUserObject }); // Could be large
```

### 3. Async Logging

Logging is synchronous by default, but you can implement async logging for high-volume scenarios:

```javascript
// For high-volume logging, consider batching
class HighVolumeLogger {
  constructor() {
    this.logBuffer = [];
    this.flushInterval = setInterval(() => this.flushLogs(), 1000);
  }
  
  log(level, message, metadata) {
    this.logBuffer.push({ level, message, metadata, timestamp: Date.now() });
  }
  
  flushLogs() {
    if (this.logBuffer.length > 0) {
      // Send logs to server or process in batch
      this.sendLogsToServer(this.logBuffer);
      this.logBuffer = [];
    }
  }
}
```

## Security Considerations

### 1. Sensitive Data

Never log sensitive information:

```javascript
// Bad: Logging sensitive data
this.logger.info('User login', {
  username: user.username,
  password: user.password, // NEVER DO THIS
  token: user.token        // NEVER DO THIS
});

// Good: Sanitized logging
this.logger.info('User login', {
  username: user.username,
  loginMethod: 'password',
  timestamp: Date.now()
});
```

### 2. Data Sanitization

The system automatically sanitizes common sensitive patterns, but be explicit:

```javascript
// Use filters to remove sensitive data
logger.addFilter('remove-sensitive', (entry) => {
  if (entry.metadata && entry.metadata.password) {
    entry.metadata.password = '[REDACTED]';
  }
  if (entry.metadata && entry.metadata.token) {
    entry.metadata.token = '[REDACTED]';
  }
  return entry;
});
```

## Troubleshooting

### 1. Logs Not Appearing

Check log level configuration:

```javascript
// Check current log level
console.log('Current log level:', logger.getLevel());

// Set appropriate level for debugging
logger.setLevel('DEBUG');
```

### 2. Performance Issues

Monitor log volume and performance:

```javascript
// Check performance metrics
const metrics = logger.getPerformanceMetrics();
console.log('Performance metrics:', metrics);

// Check log history size
const history = logger.getHistory();
console.log('Log history size:', history.length);
```

### 3. Test Integration Issues

Ensure test transport is working:

```javascript
// In test environment
if (typeof window !== 'undefined' && window.testLogs) {
  console.log('Test logs available:', window.testLogs.length);
} else {
  console.log('Test transport not available');
}
```

## Future Enhancements

### 1. Remote Logging

Consider implementing remote logging for production:

```javascript
class RemoteTransport {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.buffer = [];
  }
  
  log(entry) {
    this.buffer.push(entry);
    if (this.buffer.length >= 10) {
      this.flush();
    }
  }
  
  async flush() {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buffer)
      });
      this.buffer = [];
    } catch (error) {
      console.error('Failed to send logs:', error);
    }
  }
}
```

### 2. Log Analytics

Implement log analytics for insights:

```javascript
class AnalyticsTransport {
  constructor() {
    this.metrics = new Map();
  }
  
  log(entry) {
    // Track log patterns
    const key = `${entry.level}:${entry.module}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    
    // Track error patterns
    if (entry.level === 'ERROR') {
      this.trackErrorPattern(entry);
    }
  }
  
  trackErrorPattern(entry) {
    // Implement error pattern tracking
  }
}
```

## Conclusion

The centralized logging system provides a robust foundation for debugging, monitoring, and maintaining the WeeWoo Map Friend application. By following these patterns and best practices, developers can:

- Maintain consistent logging across all modules
- Debug issues more effectively with structured data
- Monitor performance and identify bottlenecks
- Ensure security by properly sanitizing sensitive data
- Integrate seamlessly with testing frameworks

For questions or issues with the logging system, refer to the test suite in `js/modules/StructuredLogger.test.js` or consult the main `StructuredLogger.js` implementation.
