/**
 * @module modules/ErrorContext
 * Error Context Implementation
 * 
 * This module provides a unified error context system that can be used
 * across all error handling modules to maintain consistent error information
 * and context throughout the error handling pipeline.
 * 
 * Key Features:
 * - Unified error context structure
 * - Context inheritance and composition
 * - Context serialization and deserialization
 * - Context validation and sanitization
 * - Performance tracking
 * - No dependencies on other error modules (standalone)
 */

import { injectable } from 'inversify';

/**
 * Error context types
 */
export const CONTEXT_TYPES = {
  OPERATION: 'operation',
  COMPONENT: 'component',
  USER: 'user',
  SYSTEM: 'system',
  NETWORK: 'network',
  DATA: 'data',
  CUSTOM: 'custom'
};

/**
 * Error context priorities
 */
export const CONTEXT_PRIORITIES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

/**
 * Default error context configuration
 */
export const DEFAULT_CONFIG = {
  maxContextDepth: 10,
  maxContextSize: 10000, // bytes
  enableSanitization: true,
  enableSerialization: true,
  enableValidation: true,
  sanitizeSensitiveData: true
};

/**
 * Error Context Class
 * 
 * Provides unified error context management with inheritance,
 * validation, and serialization capabilities.
 */
@injectable()
export class ErrorContext {
  constructor(data = {}, config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Context data
    this.data = this.sanitizeContextData(data);
    
    // Context metadata
    this.metadata = {
      id: this.generateContextId(),
      type: data.type || CONTEXT_TYPES.OPERATION,
      priority: data.priority || CONTEXT_PRIORITIES.MEDIUM,
      timestamp: Date.now(),
      source: data.source || 'unknown',
      version: '1.0.0'
    };
    
    // Context hierarchy
    this.parent = null;
    this.children = [];
    this.depth = 0;
    
    // Performance tracking
    this.performance = {
      creationTime: performance.now(),
      lastAccessTime: performance.now(),
      accessCount: 0
    };
    
    // Validation
    this.isValid = this.validateContext();
    
    // Bind methods
    this.addChild = this.addChild.bind(this);
    this.removeChild = this.removeChild.bind(this);
    this.getAncestors = this.getAncestors.bind(this);
    this.getDescendants = this.getDescendants.bind(this);
    this.merge = this.merge.bind(this);
    this.clone = this.clone.bind(this);
    this.serialize = this.serialize.bind(this);
    this.deserialize = this.deserialize.bind(this);
  }

  /**
   * Generate unique context ID
   * @returns {string} Unique context ID
   * @private
   */
  generateContextId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize context data
   * @param {Object} data - Raw context data
   * @returns {Object} Sanitized context data
   * @private
   */
  sanitizeContextData(data) {
    if (!this.config.enableSanitization) {
      return data;
    }
    
    const sanitized = { ...data };
    
    // Remove sensitive data if configured
    if (this.config.sanitizeSensitiveData) {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      sensitiveKeys.forEach(key => {
        if (sanitized[key]) {
          sanitized[key] = '[REDACTED]';
        }
      });
    }
    
    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  }

  /**
   * Validate context
   * @returns {boolean} True if context is valid
   * @private
   */
  validateContext() {
    if (!this.config.enableValidation) {
      return true;
    }
    
    // Check required fields
    if (!this.metadata.id || !this.metadata.timestamp) {
      return false;
    }
    
    // Check context size
    const serialized = JSON.stringify(this.data);
    if (serialized.length > this.config.maxContextSize) {
      return false;
    }
    
    // Check context depth
    if (this.depth > this.config.maxContextDepth) {
      return false;
    }
    
    return true;
  }

  /**
   * Add child context
   * @param {ErrorContext} child - Child context
   */
  addChild(child) {
    if (child instanceof ErrorContext) {
      child.parent = this;
      child.depth = this.depth + 1;
      this.children.push(child);
      
      // Update access time
      this.updateAccessTime();
    }
  }

  /**
   * Remove child context
   * @param {ErrorContext} child - Child context to remove
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      child.parent = null;
      child.depth = 0;
      this.children.splice(index, 1);
      
      // Update access time
      this.updateAccessTime();
    }
  }

  /**
   * Get all ancestor contexts
   * @returns {Array<ErrorContext>} Ancestor contexts
   */
  getAncestors() {
    const ancestors = [];
    let current = this.parent;
    
    while (current) {
      ancestors.unshift(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * Get all descendant contexts
   * @returns {Array<ErrorContext>} Descendant contexts
   */
  getDescendants() {
    const descendants = [];
    
    const collectDescendants = (context) => {
      context.children.forEach(child => {
        descendants.push(child);
        collectDescendants(child);
      });
    };
    
    collectDescendants(this);
    return descendants;
  }

  /**
   * Merge another context into this one
   * @param {ErrorContext} other - Context to merge
   * @param {Object} options - Merge options
   */
  merge(other, options = {}) {
    if (!(other instanceof ErrorContext)) {
      return;
    }
    
    const mergeStrategy = options.strategy || 'overwrite';
    
    switch (mergeStrategy) {
      case 'overwrite':
        this.data = { ...this.data, ...other.data };
        break;
        
      case 'preserve':
        this.data = { ...other.data, ...this.data };
        break;
        
      case 'deep':
        this.data = this.deepMerge(this.data, other.data);
        break;
        
      case 'append':
        Object.keys(other.data).forEach(key => {
          if (Array.isArray(this.data[key])) {
            this.data[key] = [...this.data[key], ...(Array.isArray(other.data[key]) ? other.data[key] : [other.data[key]])];
          } else if (Array.isArray(other.data[key])) {
            this.data[key] = [this.data[key], ...other.data[key]];
          } else {
            this.data[key] = other.data[key];
          }
        });
        break;
    }
    
    // Update metadata
    this.metadata.priority = Math.max(this.metadata.priority, other.metadata.priority);
    this.metadata.timestamp = Math.max(this.metadata.timestamp, other.metadata.timestamp);
    
    // Re-validate context
    this.isValid = this.validateContext();
    
    // Update access time
    this.updateAccessTime();
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   * @private
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }

  /**
   * Clone the context
   * @param {Object} options - Clone options
   * @returns {ErrorContext} Cloned context
   */
  clone(options = {}) {
    const includeChildren = options.includeChildren !== false;
    const includeMetadata = options.includeMetadata !== false;
    
    const clonedData = JSON.parse(JSON.stringify(this.data));
    const clonedMetadata = includeMetadata ? { ...this.metadata } : {};
    
    const cloned = new ErrorContext(clonedData, this.config);
    
    if (includeMetadata) {
      cloned.metadata = clonedMetadata;
    }
    
    if (includeChildren) {
      this.children.forEach(child => {
        const clonedChild = child.clone(options);
        cloned.addChild(clonedChild);
      });
    }
    
    return cloned;
  }

  /**
   * Serialize context to JSON
   * @param {Object} options - Serialization options
   * @returns {string} Serialized context
   */
  serialize(options = {}) {
    if (!this.config.enableSerialization) {
      return JSON.stringify({ error: 'Serialization disabled' });
    }
    
    const includeChildren = options.includeChildren !== false;
    const includeMetadata = options.includeMetadata !== false;
    const includePerformance = options.includePerformance === true;
    
    const serialized = {
      data: this.data,
      metadata: includeMetadata ? this.metadata : {},
      performance: includePerformance ? this.performance : {},
      isValid: this.isValid,
      depth: this.depth,
      childrenCount: this.children.length
    };
    
    if (includeChildren && this.children.length > 0) {
      serialized.children = this.children.map(child => child.serialize(options));
    }
    
    return JSON.stringify(serialized);
  }

  /**
   * Deserialize context from JSON
   * @param {string} json - Serialized context
   * @param {Object} options - Deserialization options
   * @returns {ErrorContext} Deserialized context
   */
  static deserialize(json, options = {}) {
    try {
      const data = JSON.parse(json);
      
      const context = new ErrorContext(data.data, options.config);
      
      if (data.metadata) {
        context.metadata = data.metadata;
      }
      
      if (data.performance) {
        context.performance = data.performance;
      }
      
      context.isValid = data.isValid !== false;
      context.depth = data.depth || 0;
      
      if (data.children && Array.isArray(data.children)) {
        data.children.forEach(childData => {
          const child = ErrorContext.deserialize(JSON.stringify(childData), options);
          context.addChild(child);
        });
      }
      
      return context;
      
    } catch (error) {
      throw new Error(`Failed to deserialize context: ${error.message}`);
    }
  }

  /**
   * Update access time
   * @private
   */
  updateAccessTime() {
    this.performance.lastAccessTime = performance.now();
    this.performance.accessCount++;
  }

  /**
   * Get context value by path
   * @param {string} path - Dot-separated path
   * @returns {any} Context value
   */
  get(path) {
    this.updateAccessTime();
    
    const keys = path.split('.');
    let value = this.data;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set context value by path
   * @param {string} path - Dot-separated path
   * @param {any} value - Value to set
   */
  set(path, value) {
    this.updateAccessTime();
    
    const keys = path.split('.');
    let current = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Re-validate context
    this.isValid = this.validateContext();
  }

  /**
   * Check if context has a value at path
   * @param {string} path - Dot-separated path
   * @returns {boolean} True if path exists
   */
  has(path) {
    this.updateAccessTime();
    return this.get(path) !== undefined;
  }

  /**
   * Remove context value by path
   * @param {string} path - Dot-separated path
   */
  remove(path) {
    this.updateAccessTime();
    
    const keys = path.split('.');
    let current = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        return;
      }
      current = current[key];
    }
    
    delete current[keys[keys.length - 1]];
    
    // Re-validate context
    this.isValid = this.validateContext();
  }

  /**
   * Get context size in bytes
   * @returns {number} Context size in bytes
   */
  getSize() {
    return new Blob([this.serialize()]).size;
  }

  /**
   * Get context summary
   * @returns {Object} Context summary
   */
  getSummary() {
    return {
      id: this.metadata.id,
      type: this.metadata.type,
      priority: this.metadata.priority,
      timestamp: this.metadata.timestamp,
      source: this.metadata.source,
      depth: this.depth,
      childrenCount: this.children.length,
      dataKeys: Object.keys(this.data),
      size: this.getSize(),
      isValid: this.isValid,
      accessCount: this.performance.accessCount,
      lastAccessTime: this.performance.lastAccessTime
    };
  }

  /**
   * Clear context data
   */
  clear() {
    this.data = {};
    this.children = [];
    this.depth = 0;
    this.isValid = this.validateContext();
    this.updateAccessTime();
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.isValid = this.validateContext();
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if context is expired
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} True if expired
   */
  isExpired(ttl = 300000) { // 5 minutes default
    return Date.now() - this.metadata.timestamp > ttl;
  }

  /**
   * Get context age in milliseconds
   * @returns {number} Context age
   */
  getAge() {
    return Date.now() - this.metadata.timestamp;
  }
}

/**
 * Error Context Manager Class
 * 
 * Manages multiple error contexts and provides context lifecycle management
 */
export class ErrorContextManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.contexts = new Map();
    this.contextHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Create a new error context
   * @param {Object} data - Context data
   * @param {Object} options - Context options
   * @returns {ErrorContext} Created context
   */
  createContext(data = {}, options = {}) {
    const context = new ErrorContext(data, { ...this.config, ...options });
    this.contexts.set(context.metadata.id, context);
    
    // Add to history
    this.contextHistory.push({
      id: context.metadata.id,
      timestamp: context.metadata.timestamp,
      type: context.metadata.type,
      priority: context.metadata.priority
    });
    
    // Trim history if needed
    if (this.contextHistory.length > this.maxHistorySize) {
      this.contextHistory.shift();
    }
    
    return context;
  }

  /**
   * Get context by ID
   * @param {string} id - Context ID
   * @returns {ErrorContext} Context or null
   */
  getContext(id) {
    return this.contexts.get(id) || null;
  }

  /**
   * Remove context by ID
   * @param {string} id - Context ID
   */
  removeContext(id) {
    const context = this.contexts.get(id);
    if (context) {
      // Remove from parent if exists
      if (context.parent) {
        context.parent.removeChild(context);
      }
      
      // Remove all children
      context.children.forEach(child => {
        this.removeContext(child.metadata.id);
      });
      
      this.contexts.delete(id);
    }
  }

  /**
   * Get all contexts
   * @returns {Array<ErrorContext>} All contexts
   */
  getAllContexts() {
    return Array.from(this.contexts.values());
  }

  /**
   * Get contexts by type
   * @param {string} type - Context type
   * @returns {Array<ErrorContext>} Contexts of specified type
   */
  getContextsByType(type) {
    return Array.from(this.contexts.values()).filter(context => context.metadata.type === type);
  }

  /**
   * Get contexts by priority
   * @param {number} priority - Context priority
   * @returns {Array<ErrorContext>} Contexts of specified priority
   */
  getContextsByPriority(priority) {
    return Array.from(this.contexts.values()).filter(context => context.metadata.priority === priority);
  }

  /**
   * Clear all contexts
   */
  clearAllContexts() {
    this.contexts.clear();
    this.contextHistory = [];
  }

  /**
   * Clean up expired contexts
   * @param {number} ttl - Time to live in milliseconds
   */
  cleanupExpiredContexts(ttl = 300000) { // 5 minutes default
    const expiredIds = [];
    
    for (const [id, context] of this.contexts) {
      if (context.isExpired(ttl)) {
        expiredIds.push(id);
      }
    }
    
    expiredIds.forEach(id => this.removeContext(id));
    
    return expiredIds.length;
  }

  /**
   * Get context statistics
   * @returns {Object} Context statistics
   */
  getStatistics() {
    const contexts = Array.from(this.contexts.values());
    
    const typeCounts = {};
    const priorityCounts = {};
    let totalSize = 0;
    let validCount = 0;
    
    contexts.forEach(context => {
      // Count by type
      const type = context.metadata.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      
      // Count by priority
      const priority = context.metadata.priority;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      
      // Calculate total size
      totalSize += context.getSize();
      
      // Count valid contexts
      if (context.isValid) {
        validCount++;
      }
    });
    
    return {
      totalContexts: contexts.length,
      validContexts: validCount,
      invalidContexts: contexts.length - validCount,
      totalSize: totalSize,
      averageSize: contexts.length > 0 ? totalSize / contexts.length : 0,
      typeCounts: typeCounts,
      priorityCounts: priorityCounts,
      historySize: this.contextHistory.length
    };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update all existing contexts
    for (const context of this.contexts.values()) {
      context.updateConfig(this.config);
    }
  }
}

/**
 * Create a singleton error context manager
 * @param {Object} config - Configuration options
 * @returns {ErrorContextManager} Singleton instance
 */
export function createErrorContextManager(config = {}) {
  if (!window.errorContextManager) {
    window.errorContextManager = new ErrorContextManager(config);
  }
  return window.errorContextManager;
}

/**
 * Get the singleton error context manager
 * @returns {ErrorContextManager} Singleton instance
 */
export function getErrorContextManager() {
  if (!window.errorContextManager) {
    window.errorContextManager = new ErrorContextManager();
  }
  return window.errorContextManager;
}

// Export default
export default ErrorContext;
