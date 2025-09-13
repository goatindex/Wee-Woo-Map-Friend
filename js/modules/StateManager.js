/**
 * @module modules/StateManager
 * State management service for centralized application state
 * Provides reactive state updates and event-driven communication
 * 
 * @fileoverview State manager for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';
import { IEventBus, IStateManager } from './interfaces.js';

/**
 * State manager implementation
 */
@injectable()
export class StateManager extends BaseService implements IStateManager {
  private state: any = {};
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.StructuredLogger) private structuredLogger
  ) {
    super(structuredLogger);
  }

  async initialize() {
    await super.initialize();
    this.initializeDefaultState();
  }

  getState(): any {
    return this.state;
  }

  setState(newState: any): void {
    const oldState = this.state;
    this.state = { ...this.state, ...newState };
    
    // Log state changes using BaseService log method
    this.log('State updated', { 
      oldState: this.sanitizeState(oldState), 
      newState: this.sanitizeState(newState) 
    });
    
    this.eventBus.emit('state:updated', { 
      oldState: this.sanitizeState(oldState), 
      newState: this.sanitizeState(this.state) 
    });
  }

  subscribe(path: string, listener: Function): Function {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path)!.add(listener);
    
    return () => {
      const pathSubscribers = this.subscribers.get(path);
      if (pathSubscribers) {
        pathSubscribers.delete(listener);
      }
    };
  }
  
  /**
   * Unsubscribe a listener from a specific path
   * @param path - The path to unsubscribe from
   * @param listener - The listener function to remove
   */
  unsubscribe(path: string, listener: Function): void {
    const pathSubscribers = this.subscribers.get(path);
    if (pathSubscribers) {
      pathSubscribers.delete(listener);
    }
  }

  /**
   * Watch for changes to a specific state path
   * This is an alias for subscribe() to maintain compatibility with existing code
   * @param path - The state path to watch
   * @param listener - The callback function to execute when the path changes
   * @returns Unsubscribe function
   */
  watch(path: string, listener: Function): Function {
    return this.subscribe(path, listener);
  }

  dispatch(action: any): void {
    // Log action dispatch using BaseService log method
    this.log('Action dispatched', { action });
    this.eventBus.emit('state:action', action);
  }

  /**
   * Get a specific value from state by key
   * @param key - The key to retrieve from state
   * @returns The value at the key, or undefined if not found
   */
  get(key: string): any {
    // Input validation using centralized validation
    const keyValidation = this.validateKey(key);
    if (!keyValidation.valid) {
      this.logError('Invalid key provided to get()', new Error(keyValidation.error), {
        operation: 'get',
        key: key,
        keyType: typeof key,
        recommendation: keyValidation.recommendation
      });
      this.eventBus.emit('state:error', {
        type: 'validation_error',
        operation: 'get',
        message: `Invalid key provided to get() - ${keyValidation.error}`,
        context: { key, keyType: typeof key },
        severity: 'error',
        recoverable: false
      });
      return undefined;
    }

    // Log successful operation
    this.log('State value retrieved', { 
      key, 
      valueExists: key in this.state,
      stateSize: Object.keys(this.state).length
    });

    return this.state[key];
  }

  /**
   * Set a specific value in state by key
   * @param key - The key to set in state
   * @param value - The value to set
   */
  set(key: string, value: any): void {
    // Input validation for key using centralized validation
    const keyValidation = this.validateKey(key);
    if (!keyValidation.valid) {
      this.logError('Invalid key provided to set()', new Error(keyValidation.error), {
        operation: 'set',
        key: key,
        keyType: typeof key,
        value: this.sanitizeState(value),
        recommendation: keyValidation.recommendation
      });
      this.eventBus.emit('state:error', {
        type: 'validation_error',
        operation: 'set',
        message: `Invalid key provided to set() - ${keyValidation.error}`,
        context: { key, keyType: typeof key, value: this.sanitizeState(value) },
        severity: 'error',
        recoverable: false
      });
      return;
    }

    // Input validation for value using centralized validation
    const valueValidation = this.validateValue(value);
    if (!valueValidation.valid) {
      this.logError('Invalid value provided to set()', new Error(valueValidation.error), {
        operation: 'set',
        key: key,
        value: this.sanitizeState(value),
        recommendation: valueValidation.recommendation
      });
      this.eventBus.emit('state:error', {
        type: 'validation_error',
        operation: 'set',
        message: `Invalid value provided to set() - ${valueValidation.error}`,
        context: { key, value: this.sanitizeState(value) },
        severity: 'warning',
        recoverable: true
      });
      return;
    }

    // Check state size limits
    const currentStateSize = Object.keys(this.state).length;
    if (currentStateSize > 1000) {
      this.logError('State size limit exceeded', new Error(`State has ${currentStateSize} keys, limit is 1000`), {
        operation: 'set',
        key: key,
        currentStateSize: currentStateSize,
        stateLimit: 1000,
        recommendation: 'Consider cleaning up unused state keys'
      });
      this.eventBus.emit('state:error', {
        type: 'performance_warning',
        operation: 'set',
        message: `State size limit exceeded - ${currentStateSize} keys (limit: 1000)`,
        context: { key, currentStateSize, stateLimit: 1000 },
        severity: 'warning',
        recoverable: true
      });
    }

    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Log the change with enhanced context
    this.log('State value updated', { 
      key, 
      oldValue: this.sanitizeState(oldValue), 
      newValue: this.sanitizeState(value),
      stateSize: Object.keys(this.state).length,
      valueType: typeof value,
      isNewKey: !(key in this.state)
    });
    
    // Emit change event with enhanced context
    this.eventBus.emit('state:valueChanged', { 
      key, 
      oldValue: this.sanitizeState(oldValue), 
      newValue: this.sanitizeState(value),
      stateSize: Object.keys(this.state).length,
      valueType: typeof value,
      isNewKey: !(key in this.state)
    });
  }

  private initializeDefaultState(): void {
    this.state = {
      map: {
        center: [0, 0],
        zoom: 10,
        layers: new Map()
      },
      sidebar: {
        expandedSections: [],
        selectedItems: new Map()
      },
      data: {
        categories: new Map(),
        loading: new Map()
      },
      ui: {
        theme: 'light',
        language: 'en'
      }
    };
  }

  /**
   * Validate state key format and content
   * @param key - The key to validate
   * @returns Validation result with details
   */
  private validateKey(key: any): { valid: boolean; error?: string; recommendation?: string } {
    if (key === null || key === undefined) {
      return {
        valid: false,
        error: 'Key cannot be null or undefined',
        recommendation: 'Provide a valid string key'
      };
    }

    if (typeof key !== 'string') {
      return {
        valid: false,
        error: `Expected string, got ${typeof key}`,
        recommendation: 'Provide a string key'
      };
    }

    if (key.trim() === '') {
      return {
        valid: false,
        error: 'Key cannot be empty string',
        recommendation: 'Provide a non-empty string key'
      };
    }

    if (key.length > 100) {
      return {
        valid: false,
        error: `Key too long (${key.length} characters, max 100)`,
        recommendation: 'Use shorter, more descriptive keys'
      };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      return {
        valid: false,
        error: 'Key contains invalid characters',
        recommendation: 'Use only alphanumeric characters, dots, underscores, and hyphens'
      };
    }

    return { valid: true };
  }

  /**
   * Validate state value for storage
   * @param value - The value to validate
   * @returns Validation result with details
   */
  private validateValue(value: any): { valid: boolean; error?: string; recommendation?: string } {
    if (value === undefined) {
      return {
        valid: false,
        error: 'Value cannot be undefined',
        recommendation: 'Use null instead of undefined, or delete the key'
      };
    }

    // Check for circular references
    try {
      JSON.stringify(value);
    } catch (error) {
      if (error.message.includes('circular')) {
        return {
          valid: false,
          error: 'Circular reference detected in value',
          recommendation: 'Remove circular references before setting state'
        };
      }
    }

    // Check value size (approximate)
    const serialized = JSON.stringify(value);
    if (serialized.length > 100000) { // 100KB
      return {
        valid: false,
        error: `Value too large (${serialized.length} characters, max 100,000)`,
        recommendation: 'Consider storing large values in a separate storage system'
      };
    }

    return { valid: true };
  }

  /**
   * Get state statistics for monitoring
   * @returns State statistics object
   */
  getStateStats(): { keyCount: number; memoryUsage: number; largestKey?: string; oldestKey?: string } {
    const keys = Object.keys(this.state);
    const keyCount = keys.length;
    
    let memoryUsage = 0;
    let largestKey = '';
    let largestSize = 0;
    
    for (const key of keys) {
      const serialized = JSON.stringify(this.state[key]);
      const size = serialized.length;
      memoryUsage += size;
      
      if (size > largestSize) {
        largestSize = size;
        largestKey = key;
      }
    }
    
    return {
      keyCount,
      memoryUsage,
      largestKey: largestKey || undefined,
      oldestKey: keys[0] || undefined
    };
  }

  private sanitizeState(state: any): any {
    // Remove sensitive data before logging
    const sanitized = { ...state };
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }

  /**
   * Check if StateManager is ready
   */
  isReady(): boolean {
    return this.initialized === true;
  }
}

// Legacy function for backward compatibility
export const stateManager = () => {
  console.warn('stateManager: Legacy function called. Use DI container to get StateManager instance.');
  throw new Error('Legacy function not available. Use DI container to get StateManager instance.');
};