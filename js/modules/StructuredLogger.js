/**
 * @module modules/StructuredLogger
 * Advanced structured logging system with multiple transports and filtering
 * Provides centralized logging for the entire application
 */

/**
 * @class StructuredLogger
 * Advanced logging system with structured output, multiple transports, and filtering
 */
export class StructuredLogger {
  constructor(config = {}) {
    this.config = {
      level: config.level || this.getEnvironmentLevel(),
      enableConsole: config.enableConsole !== false,
      enableTestTransport: config.enableTestTransport !== false,
      maxLogEntries: config.maxLogEntries || 1000,
      enablePerformanceTracking: config.enablePerformanceTracking || false,
      ...config
    };
    
    this.context = new Map();
    this.transports = [];
    this.filters = new Map();
    this.logHistory = [];
    this.performanceMetrics = new Map();
    
    // Log levels (higher number = more verbose)
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    this.initializeTransports();
    this.setupGlobalErrorHandling();
    
    this.info('StructuredLogger initialized', { 
      level: this.config.level,
      transports: this.transports.length 
    });
  }
  
  /**
   * Initialize logging transports based on configuration
   * @private
   */
  initializeTransports() {
    if (this.config.enableConsole) {
      this.addTransport(new ConsoleTransport());
    }
    
    if (this.config.enableTestTransport && this.isTestEnvironment()) {
      this.addTransport(new TestTransport());
    }
    
    if (this.config.enablePerformanceTracking) {
      this.addTransport(new PerformanceTransport());
    }
  }
  
  /**
   * Add a transport to the logger
   * @param {Object} transport - Transport instance
   */
  addTransport(transport) {
    if (typeof transport.log !== 'function') {
      throw new Error('Transport must implement log method');
    }
    
    this.transports.push(transport);
    this.debug('Transport added', { 
      type: transport.constructor.name,
      totalTransports: this.transports.length 
    });
  }
  
  /**
   * Remove a transport from the logger
   * @param {Object} transport - Transport instance to remove
   */
  removeTransport(transport) {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
      this.debug('Transport removed', { 
        type: transport.constructor.name,
        totalTransports: this.transports.length 
      });
    }
  }
  
  /**
   * Set contextual information that will be included in all subsequent logs
   * @param {string} key - Context key
   * @param {*} value - Context value
   * @returns {StructuredLogger} - Returns this for chaining
   */
  withContext(key, value) {
    this.context.set(key, value);
    return this;
  }
  
  /**
   * Remove contextual information
   * @param {string} key - Context key to remove
   * @returns {StructuredLogger} - Returns this for chaining
   */
  removeContext(key) {
    this.context.delete(key);
    return this;
  }
  
  /**
   * Clear all contextual information
   * @returns {StructuredLogger} - Returns this for chaining
   */
  clearContext() {
    this.context.clear();
    return this;
  }
  
  /**
   * Add a filter to modify log entries before they are sent to transports
   * @param {string} name - Filter name
   * @param {Function} filter - Filter function that receives and returns log entry
   */
  addFilter(name, filter) {
    if (typeof filter !== 'function') {
      throw new Error('Filter must be a function');
    }
    
    this.filters.set(name, filter);
    this.debug('Filter added', { name, totalFilters: this.filters.size });
  }
  
  /**
   * Remove a filter
   * @param {string} name - Filter name to remove
   */
  removeFilter(name) {
    this.filters.delete(name);
    this.debug('Filter removed', { name, totalFilters: this.filters.size });
  }
  
  /**
   * Main logging method
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG, TRACE)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   * @param {Object} options - Logging options
   */
  log(level, message, metadata = {}, options = {}) {
    // Check if we should log at this level
    if (!this.shouldLog(level)) {
      return;
    }
    
    // Create structured log entry
    const logEntry = {
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context: Object.fromEntries(this.context),
      metadata: this.sanitizeMetadata(metadata),
      module: this.getCallerModule(),
      stack: this.getCallerStack(),
      sessionId: this.getSessionId(),
      ...options
    };
    
    // Apply filters
    let filteredEntry = logEntry;
    for (const [name, filter] of this.filters) {
      try {
        filteredEntry = filter(filteredEntry);
        if (!filteredEntry) {
          // Filter returned null/undefined, skip logging
          return;
        }
      } catch (error) {
        console.error(`Filter ${name} failed:`, error);
      }
    }
    
    // Store in history
    this.addToHistory(filteredEntry);
    
    // Send to all transports
    this.transports.forEach(transport => {
      try {
        if (transport.shouldLog && !transport.shouldLog(level)) {
          return;
        }
        transport.log(filteredEntry);
      } catch (error) {
        console.error(`Transport ${transport.constructor.name} failed:`, error);
      }
    });
  }
  
  /**
   * Convenience methods for different log levels
   */
  error(message, metadata = {}, options = {}) {
    this.log('ERROR', message, metadata, options);
  }
  
  warn(message, metadata = {}, options = {}) {
    this.log('WARN', message, metadata, options);
  }
  
  info(message, metadata = {}, options = {}) {
    this.log('INFO', message, metadata, options);
  }
  
  debug(message, metadata = {}, options = {}) {
    this.log('DEBUG', message, metadata, options);
  }
  
  trace(message, metadata = {}, options = {}) {
    this.log('TRACE', message, metadata, options);
  }
  
  /**
   * Performance timing methods
   */
  time(label) {
    const start = performance.now();
    return {
      end: (metadata = {}) => {
        const duration = performance.now() - start;
        this.recordPerformance(label, duration, metadata);
        return duration;
      }
    };
  }
  
  recordPerformance(label, duration, metadata = {}) {
    this.performanceMetrics.set(label, {
      duration,
      timestamp: Date.now(),
      metadata
    });
    
    this.debug('Performance recorded', {
      label,
      duration: `${duration.toFixed(2)}ms`,
      ...metadata
    });
  }
  
  /**
   * Get performance metrics
   * @returns {Map} Performance metrics
   */
  getPerformanceMetrics() {
    return new Map(this.performanceMetrics);
  }
  
  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics() {
    this.performanceMetrics.clear();
  }
  
  /**
   * Get log history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Log history
   */
  getHistory(limit = 100) {
    return this.logHistory.slice(-limit);
  }
  
  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }
  
  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (!(level.toUpperCase() in this.levels)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    
    const oldLevel = this.config.level;
    this.config.level = level.toUpperCase();
    
    this.info('Log level changed', {
      oldLevel,
      newLevel: this.config.level
    });
  }
  
  /**
   * Get current log level
   * @returns {string} Current log level
   */
  getLevel() {
    return this.config.level;
  }
  
  /**
   * Check if we should log at the given level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to log
   * @private
   */
  shouldLog(level) {
    return this.levels[level.toUpperCase()] <= this.levels[this.config.level];
  }
  
  /**
   * Get environment-based log level
   * @returns {string} Log level based on environment
   * @private
   */
  getEnvironmentLevel() {
    if (this.isTestEnvironment()) {
      return 'DEBUG';
    }
    
    if (this.isDevelopment()) {
      return 'INFO';
    }
    
    return 'WARN';
  }
  
  /**
   * Check if we're in a test environment
   * @returns {boolean} Whether in test environment
   * @private
   */
  isTestEnvironment() {
    return typeof window !== 'undefined' && 
           (window.location.hostname === 'localhost' || 
            window.location.search.includes('test=true') ||
            typeof jest !== 'undefined' ||
            typeof window.jest !== 'undefined');
  }
  
  /**
   * Check if we're in development environment
   * @returns {boolean} Whether in development environment
   * @private
   */
  isDevelopment() {
    return typeof window !== 'undefined' && 
           (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true'));
  }
  
  /**
   * Check if we're in production environment
   * @returns {boolean} Whether in production environment
   * @private
   */
  isProduction() {
    return !this.isDevelopment() && !this.isTestEnvironment();
  }
  
  /**
   * Get the module that called the logger
   * @returns {string} Module name
   * @private
   */
  getCallerModule() {
    try {
      const stack = new Error().stack;
      const lines = stack.split('\n');
      
      // Look for the first line that's not from this logger
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('StructuredLogger') || line.includes('logger.')) {
          continue;
        }
        
        // Extract module name from stack trace
        const match = line.match(/([^/\\]+)\.test\.js/) || line.match(/([^/\\]+)\.js/);
        if (match) {
          return match[1];
        }
      }
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Get caller stack trace
   * @returns {string} Stack trace
   * @private
   */
  getCallerStack() {
    try {
      const stack = new Error().stack;
      return stack.split('\n').slice(3, 8).join('\n'); // Skip logger internals
    } catch (error) {
      return 'Stack trace unavailable';
    }
  }
  
  /**
   * Get session ID
   * @returns {string} Session ID
   * @private
   */
  getSessionId() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('logger-session-id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        window.sessionStorage.setItem('logger-session-id', sessionId);
      }
      return sessionId;
    }
    return 'no-session';
  }
  
  /**
   * Sanitize metadata to prevent circular references
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   * @private
   */
  sanitizeMetadata(metadata) {
    try {
      return JSON.parse(JSON.stringify(metadata, (key, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value instanceof HTMLElement) {
          return `[HTMLElement: ${value.tagName}]`;
        }
        return value;
      }));
    } catch (error) {
      return { error: 'Failed to serialize metadata', original: String(metadata) };
    }
  }
  
  /**
   * Add log entry to history
   * @param {Object} entry - Log entry
   * @private
   */
  addToHistory(entry) {
    this.logHistory.push(entry);
    
    // Maintain history size limit
    if (this.logHistory.length > this.config.maxLogEntries) {
      this.logHistory = this.logHistory.slice(-this.config.maxLogEntries);
    }
  }
  
  /**
   * Setup global error handling
   * @private
   */
  setupGlobalErrorHandling() {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          reason: event.reason,
          promise: event.promise
        });
      });
      
      // Handle global errors
      window.addEventListener('error', (event) => {
        this.error('Global error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });
    }
  }
  
  /**
   * Create a child logger with inherited context
   * @param {Object} additionalContext - Additional context for child logger
   * @returns {StructuredLogger} Child logger instance
   */
  createChild(additionalContext = {}) {
    const childLogger = new StructuredLogger(this.config);
    
    // Inherit parent context
    for (const [key, value] of this.context) {
      childLogger.context.set(key, value);
    }
    
    // Add additional context
    for (const [key, value] of Object.entries(additionalContext)) {
      childLogger.context.set(key, value);
    }
    
    return childLogger;
  }
  
  /**
   * Destroy the logger and clean up resources
   */
  destroy() {
    this.transports.forEach(transport => {
      if (typeof transport.destroy === 'function') {
        transport.destroy();
      }
    });
    
    this.transports = [];
    this.context.clear();
    this.filters.clear();
    this.logHistory = [];
    this.performanceMetrics.clear();
    
    this.info('StructuredLogger destroyed');
  }
}

/**
 * @class ConsoleTransport
 * Transport for console output with color coding
 */
class ConsoleTransport {
  constructor(options = {}) {
    this.options = {
      enableColors: options.enableColors !== false,
      enableTimestamps: options.enableTimestamps !== false,
      ...options
    };
    
    this.colors = {
      ERROR: '#ff4444',
      WARN: '#ffaa00',
      INFO: '#4488ff',
      DEBUG: '#888888',
      TRACE: '#cccccc'
    };
  }
  
  shouldLog(level) {
    return true; // Console transport logs everything
  }
  
  log(entry) {
    const { level, message, metadata, context, module, isoTime } = entry;
    
    // Create formatted message
    let formattedMessage = this.formatMessage(entry);
    
    // Add context if present
    if (Object.keys(context).length > 0) {
      formattedMessage += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      formattedMessage += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    // Use appropriate console method
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(formattedMessage);
  }
  
  formatMessage(entry) {
    const { level, message, module, isoTime } = entry;
    
    let formatted = '';
    
    if (this.options.enableTimestamps) {
      formatted += `[${isoTime}] `;
    }
    
    formatted += `[${level}]`;
    
    if (module && module !== 'unknown') {
      formatted += ` [${module}]`;
    }
    
    formatted += ` ${message}`;
    
    return formatted;
  }
  
  getConsoleMethod(level) {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return console.error;
      case 'WARN':
        return console.warn;
      case 'INFO':
        return console.info;
      case 'DEBUG':
      case 'TRACE':
        return console.debug;
      default:
        return console.log;
    }
  }
}

/**
 * @class TestTransport
 * Transport for test environments that collects logs for assertions
 */
class TestTransport {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }
  
  shouldLog(level) {
    return true; // Test transport logs everything
  }
  
  log(entry) {
    this.logs.push(entry);
    
    // Maintain log limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Store in global test context if available
    if (typeof window !== 'undefined' && window.testLogs) {
      window.testLogs.push(entry);
    }
  }
  
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level.toUpperCase());
    }
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined' && window.testLogs) {
      window.testLogs = [];
    }
  }
  
  destroy() {
    this.clearLogs();
  }
}

/**
 * @class PerformanceTransport
 * Transport for performance monitoring and metrics
 */
class PerformanceTransport {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      WARN: 100,  // 100ms
      ERROR: 500  // 500ms
    };
  }
  
  shouldLog(level) {
    return ['ERROR', 'WARN', 'DEBUG'].includes(level.toUpperCase());
  }
  
  log(entry) {
    // Track performance-related logs
    if (entry.metadata && entry.metadata.duration) {
      this.trackPerformance(entry);
    }
    
    // Log performance warnings/errors
    if (entry.level === 'DEBUG' && entry.metadata && entry.metadata.duration) {
      const duration = entry.metadata.duration;
      if (duration > this.thresholds.ERROR) {
        console.error(`Performance ERROR: ${entry.message} took ${duration}ms`);
      } else if (duration > this.thresholds.WARN) {
        console.warn(`Performance WARNING: ${entry.message} took ${duration}ms`);
      }
    }
  }
  
  trackPerformance(entry) {
    const key = entry.message;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({
      duration: entry.metadata.duration,
      timestamp: entry.timestamp,
      metadata: entry.metadata
    });
  }
  
  getMetrics() {
    return new Map(this.metrics);
  }
  
  clearMetrics() {
    this.metrics.clear();
  }
  
  destroy() {
    this.clearMetrics();
  }
}

// Create and export global logger instance
export const logger = new StructuredLogger();

// Export transport classes for testing
export { ConsoleTransport, TestTransport, PerformanceTransport };

// Export for global access
if (typeof window !== 'undefined') {
  window.logger = logger;
  window.StructuredLogger = StructuredLogger;
}
