/**
 * @module modules/HealthCheckService
 * Health Check Service Implementation
 * 
 * This module provides a standalone health monitoring service that can be used
 * to monitor the health of various system components and services.
 * 
 * Key Features:
 * - Component health monitoring
 * - Service availability checks
 * - Performance metrics collection
 * - Health status reporting
 * - Configurable health checks
 * - No dependencies on other error modules (standalone)
 */

import { injectable } from 'inversify';

/**
 * Health status levels
 */
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * Health check types
 */
export const HEALTH_CHECK_TYPES = {
  PING: 'ping',
  HTTP: 'http',
  FUNCTION: 'function',
  CUSTOM: 'custom'
};

/**
 * Default health check configuration
 */
export const DEFAULT_CONFIG = {
  checkInterval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  enableMetrics: true,
  enableLogging: true
};

/**
 * Health Check Service Class
 * 
 * Provides comprehensive health monitoring for system components
 */
@injectable()
export class HealthCheckService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Health checks registry
    this.healthChecks = new Map();
    
    // Health status
    this.overallHealth = HEALTH_STATUS.UNKNOWN;
    this.componentHealth = new Map();
    
    // Metrics
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      responseTimes: [],
      healthHistory: [],
      lastCheckTime: null
    };
    
    // Monitoring
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    // Callbacks
    this.onHealthChange = null;
    this.onComponentHealthChange = null;
    this.onCheckComplete = null;
    
    // Bind methods
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
    this.performHealthCheck = this.performHealthCheck.bind(this);
    this.registerHealthCheck = this.registerHealthCheck.bind(this);
  }

  /**
   * Register a health check
   * @param {string} name - Health check name
   * @param {Object} config - Health check configuration
   */
  registerHealthCheck(name, config) {
    const healthCheck = {
      name: name,
      type: config.type || HEALTH_CHECK_TYPES.FUNCTION,
      check: config.check,
      timeout: config.timeout || this.config.timeout,
      retryAttempts: config.retryAttempts || this.config.retryAttempts,
      retryDelay: config.retryDelay || this.config.retryDelay,
      enabled: config.enabled !== false,
      critical: config.critical || false,
      metadata: config.metadata || {},
      ...config
    };
    
    this.healthChecks.set(name, healthCheck);
    
    // Initialize component health status
    this.componentHealth.set(name, {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      responseTime: 0
    });
  }

  /**
   * Unregister a health check
   * @param {string} name - Health check name
   */
  unregisterHealthCheck(name) {
    this.healthChecks.delete(name);
    this.componentHealth.delete(name);
  }

  /**
   * Start health monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Perform initial health check
    this.performHealthCheck();
    
    // Set up monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    if (this.config.enableLogging) {
      console.log('Health monitoring started');
    }
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.config.enableLogging) {
      console.log('Health monitoring stopped');
    }
  }

  /**
   * Perform health check for all registered components
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck() {
    const startTime = performance.now();
    const results = {
      overall: HEALTH_STATUS.UNKNOWN,
      components: {},
      timestamp: Date.now(),
      duration: 0
    };
    
    try {
      // Check all registered health checks
      const checkPromises = Array.from(this.healthChecks.entries()).map(([name, healthCheck]) => 
        this.checkComponent(name, healthCheck)
      );
      
      const checkResults = await Promise.allSettled(checkPromises);
      
      // Process results
      let healthyCount = 0;
      let degradedCount = 0;
      let unhealthyCount = 0;
      let unknownCount = 0;
      
      checkResults.forEach((result, index) => {
        const [name] = Array.from(this.healthChecks.keys())[index];
        
        if (result.status === 'fulfilled') {
          const componentResult = result.value;
          results.components[name] = componentResult;
          
          switch (componentResult.status) {
            case HEALTH_STATUS.HEALTHY:
              healthyCount++;
              break;
            case HEALTH_STATUS.DEGRADED:
              degradedCount++;
              break;
            case HEALTH_STATUS.UNHEALTHY:
              unhealthyCount++;
              break;
            default:
              unknownCount++;
          }
        } else {
          // Health check failed
          results.components[name] = {
            status: HEALTH_STATUS.UNHEALTHY,
            error: result.reason.message,
            timestamp: Date.now()
          };
          unhealthyCount++;
        }
      });
      
      // Determine overall health
      if (unhealthyCount > 0) {
        results.overall = HEALTH_STATUS.UNHEALTHY;
      } else if (degradedCount > 0) {
        results.overall = HEALTH_STATUS.DEGRADED;
      } else if (healthyCount > 0) {
        results.overall = HEALTH_STATUS.HEALTHY;
      } else {
        results.overall = HEALTH_STATUS.UNKNOWN;
      }
      
      // Update overall health status
      const previousHealth = this.overallHealth;
      this.overallHealth = results.overall;
      
      // Record metrics
      const duration = performance.now() - startTime;
      results.duration = duration;
      this.recordMetrics(results);
      
      // Call health change callback
      if (previousHealth !== this.overallHealth && this.onHealthChange) {
        this.onHealthChange(previousHealth, this.overallHealth, results);
      }
      
      // Call check complete callback
      if (this.onCheckComplete) {
        this.onCheckComplete(results);
      }
      
      return results;
      
    } catch (error) {
      results.overall = HEALTH_STATUS.UNHEALTHY;
      results.error = error.message;
      results.duration = performance.now() - startTime;
      
      if (this.config.enableLogging) {
        console.error('Health check failed:', error);
      }
      
      return results;
    }
  }

  /**
   * Check a specific component
   * @param {string} name - Component name
   * @param {Object} healthCheck - Health check configuration
   * @returns {Promise<Object>} Component health result
   * @private
   */
  async checkComponent(name, healthCheck) {
    if (!healthCheck.enabled) {
      return {
        status: HEALTH_STATUS.UNKNOWN,
        message: 'Health check disabled',
        timestamp: Date.now()
      };
    }
    
    const startTime = performance.now();
    let lastError = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= healthCheck.retryAttempts; attempt++) {
      try {
        let result;
        
        switch (healthCheck.type) {
          case HEALTH_CHECK_TYPES.PING:
            result = await this.performPingCheck(healthCheck);
            break;
            
          case HEALTH_CHECK_TYPES.HTTP:
            result = await this.performHttpCheck(healthCheck);
            break;
            
          case HEALTH_CHECK_TYPES.FUNCTION:
            result = await this.performFunctionCheck(healthCheck);
            break;
            
          case HEALTH_CHECK_TYPES.CUSTOM:
            result = await this.performCustomCheck(healthCheck);
            break;
            
          default:
            throw new Error(`Unknown health check type: ${healthCheck.type}`);
        }
        
        // Record success
        const duration = performance.now() - startTime;
        this.updateComponentHealth(name, {
          status: result.status || HEALTH_STATUS.HEALTHY,
          lastCheck: Date.now(),
          lastSuccess: Date.now(),
          consecutiveFailures: 0,
          responseTime: duration,
          message: result.message,
          data: result.data
        });
        
        return {
          status: result.status || HEALTH_STATUS.HEALTHY,
          message: result.message,
          data: result.data,
          responseTime: duration,
          timestamp: Date.now()
        };
        
      } catch (error) {
        lastError = error;
        
        // Wait before retry (except last attempt)
        if (attempt < healthCheck.retryAttempts) {
          await this.sleep(healthCheck.retryDelay);
        }
      }
    }
    
    // All retries failed
    const duration = performance.now() - startTime;
    this.updateComponentHealth(name, {
      status: HEALTH_STATUS.UNHEALTHY,
      lastCheck: Date.now(),
      lastFailure: Date.now(),
      consecutiveFailures: this.componentHealth.get(name)?.consecutiveFailures + 1 || 1,
      responseTime: duration,
      error: lastError.message
    });
    
    return {
      status: HEALTH_STATUS.UNHEALTHY,
      error: lastError.message,
      responseTime: duration,
      timestamp: Date.now()
    };
  }

  /**
   * Perform ping check
   * @param {Object} healthCheck - Health check configuration
   * @returns {Promise<Object>} Ping result
   * @private
   */
  async performPingCheck(healthCheck) {
    // Simple ping check - can be extended for actual ping
    return {
      status: HEALTH_STATUS.HEALTHY,
      message: 'Ping successful'
    };
  }

  /**
   * Perform HTTP check
   * @param {Object} healthCheck - Health check configuration
   * @returns {Promise<Object>} HTTP result
   * @private
   */
  async performHttpCheck(healthCheck) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), healthCheck.timeout);
    
    try {
      const response = await fetch(healthCheck.url, {
        method: healthCheck.method || 'GET',
        headers: healthCheck.headers || {},
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return {
          status: HEALTH_STATUS.HEALTHY,
          message: `HTTP ${response.status} OK`,
          data: {
            status: response.status,
            statusText: response.statusText
          }
        };
      } else {
        return {
          status: HEALTH_STATUS.DEGRADED,
          message: `HTTP ${response.status} ${response.statusText}`,
          data: {
            status: response.status,
            statusText: response.statusText
          }
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Perform function check
   * @param {Object} healthCheck - Health check configuration
   * @returns {Promise<Object>} Function result
   * @private
   */
  async performFunctionCheck(healthCheck) {
    if (!healthCheck.check || typeof healthCheck.check !== 'function') {
      throw new Error('Function check requires a check function');
    }
    
    const result = await healthCheck.check();
    return result;
  }

  /**
   * Perform custom check
   * @param {Object} healthCheck - Health check configuration
   * @returns {Promise<Object>} Custom result
   * @private
   */
  async performCustomCheck(healthCheck) {
    if (!healthCheck.check || typeof healthCheck.check !== 'function') {
      throw new Error('Custom check requires a check function');
    }
    
    const result = await healthCheck.check();
    return result;
  }

  /**
   * Update component health status
   * @param {string} name - Component name
   * @param {Object} healthData - Health data
   * @private
   */
  updateComponentHealth(name, healthData) {
    const previousHealth = this.componentHealth.get(name);
    this.componentHealth.set(name, { ...previousHealth, ...healthData });
    
    // Call component health change callback
    if (this.onComponentHealthChange && previousHealth?.status !== healthData.status) {
      this.onComponentHealthChange(name, previousHealth?.status, healthData.status, healthData);
    }
  }

  /**
   * Record health check metrics
   * @param {Object} results - Health check results
   * @private
   */
  recordMetrics(results) {
    this.metrics.totalChecks++;
    this.metrics.lastCheckTime = Date.now();
    
    // Count successful and failed checks
    const componentResults = Object.values(results.components);
    const successfulChecks = componentResults.filter(r => r.status === HEALTH_STATUS.HEALTHY).length;
    const failedChecks = componentResults.filter(r => r.status === HEALTH_STATUS.UNHEALTHY).length;
    
    this.metrics.successfulChecks += successfulChecks;
    this.metrics.failedChecks += failedChecks;
    
    // Record response time
    this.metrics.responseTimes.push(results.duration);
    
    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Update average response time
    if (this.metrics.responseTimes.length > 0) {
      const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
    }
    
    // Record health history
    this.metrics.healthHistory.push({
      timestamp: results.timestamp,
      overall: results.overall,
      duration: results.duration
    });
    
    // Keep only last 100 health history entries
    if (this.metrics.healthHistory.length > 100) {
      this.metrics.healthHistory.shift();
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get overall health status
   * @returns {Object} Overall health status
   */
  getOverallHealth() {
    return {
      status: this.overallHealth,
      timestamp: this.metrics.lastCheckTime,
      components: Object.fromEntries(this.componentHealth),
      metrics: this.getMetrics()
    };
  }

  /**
   * Get component health status
   * @param {string} name - Component name
   * @returns {Object} Component health status
   */
  getComponentHealth(name) {
    return this.componentHealth.get(name) || {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      responseTime: 0
    };
  }

  /**
   * Get all component health statuses
   * @returns {Object} All component health statuses
   */
  getAllComponentHealth() {
    return Object.fromEntries(this.componentHealth);
  }

  /**
   * Get health check metrics
   * @returns {Object} Health check metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalChecks > 0 
      ? (this.metrics.successfulChecks / this.metrics.totalChecks) * 100 
      : 0;
    
    return {
      ...this.metrics,
      successRate: successRate,
      failureRate: 100 - successRate,
      isMonitoring: this.isMonitoring,
      totalComponents: this.healthChecks.size,
      enabledComponents: Array.from(this.healthChecks.values()).filter(hc => hc.enabled).length
    };
  }

  /**
   * Get health history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Health history
   */
  getHealthHistory(limit = 50) {
    return this.metrics.healthHistory.slice(-limit);
  }

  /**
   * Clear health history
   */
  clearHealthHistory() {
    this.metrics.healthHistory = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      responseTimes: [],
      healthHistory: [],
      lastCheckTime: null
    };
  }

  /**
   * Set health change callback
   * @param {Function} callback - Callback function
   */
  setOnHealthChange(callback) {
    this.onHealthChange = callback;
  }

  /**
   * Set component health change callback
   * @param {Function} callback - Callback function
   */
  setOnComponentHealthChange(callback) {
    this.onComponentHealthChange = callback;
  }

  /**
   * Set check complete callback
   * @param {Function} callback - Callback function
   */
  setOnCheckComplete(callback) {
    this.onCheckComplete = callback;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed
    if (newConfig.checkInterval && this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get registered health checks
   * @returns {Array} Registered health checks
   */
  getRegisteredHealthChecks() {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Perform comprehensive health check (ApplicationBootstrap compatibility)
   * Extracted from ApplicationBootstrap.performHealthCheck()
   * @returns {Promise<Object>} Comprehensive health status
   */
  async performComprehensiveHealthCheck() {
    const healthStatus = {
      overall: 'healthy',
      timestamp: Date.now(),
      components: {},
      errors: [],
      warnings: []
    };

    try {
      // Check core systems
      const coreSystems = [
        { name: 'eventBus', check: () => this.checkEventBus() },
        { name: 'stateManager', check: () => this.checkStateManager() },
        { name: 'dependencyContainer', check: () => this.checkDependencyContainer() },
        { name: 'logger', check: () => this.checkLogger() }
      ];

      for (const system of coreSystems) {
        try {
          const result = await system.check();
          healthStatus.components[system.name] = result;
          
          if (result.status === 'degraded') {
            healthStatus.warnings.push(`${system.name}: ${result.message}`);
          } else if (result.status === 'unhealthy') {
            healthStatus.errors.push(`${system.name}: ${result.message}`);
          }
        } catch (error) {
          healthStatus.components[system.name] = {
            status: 'unhealthy',
            message: error.message,
            timestamp: Date.now()
          };
          healthStatus.errors.push(`${system.name}: ${error.message}`);
        }
      }

      // Check circuit breakers (if available)
      if (typeof window !== 'undefined' && window.circuitBreakerManager) {
        try {
          const allStates = window.circuitBreakerManager.getAllStates();
          const openBreakers = Object.entries(allStates)
            .filter(([_, state]) => state.state === 'OPEN');
          
          if (openBreakers.length > 0) {
            healthStatus.overall = 'degraded';
            healthStatus.components.circuitBreakers = 'degraded';
            healthStatus.errors.push(`Open circuit breakers: ${openBreakers.map(([name]) => name).join(', ')}`);
          } else {
            healthStatus.components.circuitBreakers = 'healthy';
          }
        } catch (error) {
          healthStatus.components.circuitBreakers = {
            status: 'unhealthy',
            message: error.message,
            timestamp: Date.now()
          };
          healthStatus.errors.push(`Circuit breakers: ${error.message}`);
        }
      }

      // Check memory usage
      if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory;
        const memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        };

        healthStatus.components.memory = {
          status: memoryUsage.percentage > 90 ? 'degraded' : 'healthy',
          data: memoryUsage,
          timestamp: Date.now()
        };

        if (memoryUsage.percentage > 90) {
          healthStatus.warnings.push(`High memory usage: ${memoryUsage.percentage.toFixed(1)}%`);
        }
      }

      // Check network connectivity
      if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
        healthStatus.components.network = {
          status: navigator.onLine ? 'healthy' : 'unhealthy',
          message: navigator.onLine ? 'Online' : 'Offline',
          timestamp: Date.now()
        };

        if (!navigator.onLine) {
          healthStatus.errors.push('Network: Offline');
        }
      }

      // Determine overall health
      if (healthStatus.errors.length > 0) {
        healthStatus.overall = 'unhealthy';
      } else if (healthStatus.warnings.length > 0) {
        healthStatus.overall = 'degraded';
      }

      return healthStatus;

    } catch (error) {
      healthStatus.overall = 'unhealthy';
      healthStatus.errors.push(`Health check failed: ${error.message}`);
      return healthStatus;
    }
  }

  /**
   * Check EventBus health
   * @returns {Promise<Object>} EventBus health status
   * @private
   */
  async checkEventBus() {
    if (typeof window !== 'undefined' && window.globalEventBus) {
      return {
        status: 'healthy',
        message: 'EventBus available',
        timestamp: Date.now()
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'EventBus not available',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check StateManager health
   * @returns {Promise<Object>} StateManager health status
   * @private
   */
  async checkStateManager() {
    if (typeof window !== 'undefined' && window.stateManager) {
      return {
        status: 'healthy',
        message: 'StateManager available',
        timestamp: Date.now()
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'StateManager not available',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check DependencyContainer health
   * @returns {Promise<Object>} DependencyContainer health status
   * @private
   */
  async checkDependencyContainer() {
    if (typeof window !== 'undefined' && window.dependencyContainer) {
      return {
        status: 'healthy',
        message: 'DependencyContainer available',
        timestamp: Date.now()
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'DependencyContainer not available',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check Logger health
   * @returns {Promise<Object>} Logger health status
   * @private
   */
  async checkLogger() {
    if (typeof window !== 'undefined' && window.logger) {
      return {
        status: 'healthy',
        message: 'Logger available',
        timestamp: Date.now()
      };
    } else {
      return {
        status: 'degraded',
        message: 'Logger not available, using console fallback',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Enable health check
   * @param {string} name - Health check name
   */
  enableHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (healthCheck) {
      healthCheck.enabled = true;
    }
  }

  /**
   * Disable health check
   * @param {string} name - Health check name
   */
  disableHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);
    if (healthCheck) {
      healthCheck.enabled = false;
    }
  }

  /**
   * Check if health check is enabled
   * @param {string} name - Health check name
   * @returns {boolean} True if enabled
   */
  isHealthCheckEnabled(name) {
    const healthCheck = this.healthChecks.get(name);
    return healthCheck ? healthCheck.enabled : false;
  }
}

/**
 * Health Check Manager Class
 * 
 * Manages multiple health check services for different systems
 */
export class HealthCheckManager {
  constructor() {
    this.healthCheckServices = new Map();
    this.defaultConfig = { ...DEFAULT_CONFIG };
  }

  /**
   * Get or create a health check service for a key
   * @param {string} key - Health check service key
   * @param {Object} config - Configuration options
   * @returns {HealthCheckService} Health check service instance
   */
  getHealthCheckService(key, config = {}) {
    if (!this.healthCheckServices.has(key)) {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const healthCheckService = new HealthCheckService(mergedConfig);
      this.healthCheckServices.set(key, healthCheckService);
    }
    return this.healthCheckServices.get(key);
  }

  /**
   * Start monitoring for all services
   */
  startAllMonitoring() {
    for (const service of this.healthCheckServices.values()) {
      service.startMonitoring();
    }
  }

  /**
   * Stop monitoring for all services
   */
  stopAllMonitoring() {
    for (const service of this.healthCheckServices.values()) {
      service.stopMonitoring();
    }
  }

  /**
   * Get overall health status for all services
   * @returns {Object} Overall health status
   */
  getOverallHealthStatus() {
    const services = Array.from(this.healthCheckServices.values());
    const healthyServices = services.filter(s => s.overallHealth === HEALTH_STATUS.HEALTHY).length;
    const totalServices = services.length;
    
    return {
      totalServices: totalServices,
      healthyServices: healthyServices,
      unhealthyServices: totalServices - healthyServices,
      overallHealth: totalServices > 0 ? (healthyServices / totalServices) * 100 : 100,
      services: Object.fromEntries(
        Array.from(this.healthCheckServices.entries()).map(([key, service]) => [
          key,
          service.getOverallHealth()
        ])
      )
    };
  }

  /**
   * Get all service metrics
   * @returns {Object} All service metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [key, service] of this.healthCheckServices) {
      metrics[key] = service.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all services
   */
  resetAll() {
    for (const service of this.healthCheckServices.values()) {
      service.resetMetrics();
    }
  }

  /**
   * Remove health check service
   * @param {string} key - Health check service key
   */
  remove(key) {
    const service = this.healthCheckServices.get(key);
    if (service) {
      service.stopMonitoring();
      this.healthCheckServices.delete(key);
    }
  }

  /**
   * Clear all health check services
   */
  clear() {
    this.stopAllMonitoring();
    this.healthCheckServices.clear();
  }
}

/**
 * Create a singleton health check service
 * @param {Object} config - Configuration options
 * @returns {HealthCheckService} Singleton instance
 */
export function createHealthCheckService(config = {}) {
  if (!window.healthCheckService) {
    window.healthCheckService = new HealthCheckService(config);
  }
  return window.healthCheckService;
}

/**
 * Get the singleton health check service
 * @returns {HealthCheckService} Singleton instance
 */
export function getHealthCheckService() {
  if (!window.healthCheckService) {
    window.healthCheckService = new HealthCheckService();
  }
  return window.healthCheckService;
}

// Export default
export default HealthCheckService;
