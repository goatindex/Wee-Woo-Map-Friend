/**
 * @module modules/BaseService
 * Base service class for all services in the WeeWoo Map Friend application
 * Provides common functionality and lifecycle management for all services
 * 
 * @fileoverview Base service class for dependency injection and service management
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';

/**
 * @class BaseService
 * Base class for all services providing common functionality
 * Implements service lifecycle management and error handling
 */
@injectable()
export class BaseService {
  /**
   * Service-specific logger instance
   * @type {Object}
   * @property {Function} debug - Debug level logging
   * @property {Function} info - Info level logging
   * @property {Function} warn - Warning level logging
   * @property {Function} error - Error level logging
   * @property {Function} time - Performance timing
   */
  logger;

  constructor(
    @inject(TYPES.StructuredLogger) private structuredLogger
  ) {
    // Initialize service-specific logger with module context
    this.logger = this.structuredLogger.createChild({
      module: this.constructor.name
    });
  }

  /**
   * Initialize the service
   * @returns {Promise<void>}
   */
  async initialize() {
    // Override in subclasses
  }

  /**
   * Cleanup the service
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Override in subclasses
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      initialized: true,
      name: this.constructor.name
    };
  }

  /**
   * Log service activity
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  log(message, context = {}) {
    this.structuredLogger.info(`[${this.constructor.name}] ${message}`, {
      service: this.constructor.name,
      ...context
    });
  }

  /**
   * Log service error
   * @param {string} message - Error message
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(message, error, context = {}) {
    this.structuredLogger.error(`[${this.constructor.name}] ${message}`, {
      service: this.constructor.name,
      error: error.message,
      stack: error.stack,
      ...context
    });
  }
}
