import { logger } from './StructuredLogger.js';
import { globalEventBus } from './EnhancedEventBus.js';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the data is valid
 * @property {string[]} errors - Array of validation errors
 * @property {string[]} warnings - Array of validation warnings
 * @property {Object} metadata - Additional validation metadata
 */

/**
 * @typedef {Object} GeoJSONValidationResult
 * @property {boolean} valid - Whether the GeoJSON is valid
 * @property {string[]} errors - Array of validation errors
 * @property {string[]} warnings - Array of validation warnings
 * @property {number} featureCount - Number of valid features
 * @property {number} invalidFeatureCount - Number of invalid features
 * @property {Object} statistics - Validation statistics
 */

/**
 * @typedef {Object} ValidationRule
 * @property {string} name - Rule name
 * @property {Function} validator - Validation function
 * @property {string} message - Error message template
 * @property {string} level - Validation level (error, warning, info)
 */

/**
 * @class DataValidator
 * Comprehensive data validation system with GeoJSON validation,
 * schema validation, data sanitization, and performance monitoring.
 */
export class DataValidator {
  constructor() {
    this.logger = logger.createChild({ module: 'DataValidator' });
    this.validationRules = new Map();
    this.schemas = new Map();
    this.statistics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      validationHistory: []
    };
    
    this.logger.info('DataValidator initialized');
    this.setupValidationRules();
    this.setupEventHandlers();
  }

  /**
   * Validate GeoJSON data
   * @param {Object} geojson - GeoJSON data to validate
   * @param {Object} options - Validation options
   * @returns {Promise<GeoJSONValidationResult>} Validation result
   */
  async validateGeoJSON(geojson, options = {}) {
    const timer = this.logger.time('geojson-validation');
    const startTime = performance.now();
    
    try {
      this.logger.info('Starting GeoJSON validation', { 
        type: geojson?.type,
        featureCount: geojson?.features?.length || 0
      });
      
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        featureCount: 0,
        invalidFeatureCount: 0,
        statistics: {}
      };
      
      // Validate top-level structure
      const structureValidation = this.validateGeoJSONStructure(geojson);
      if (!structureValidation.valid) {
        result.errors.push(...structureValidation.errors);
        result.valid = false;
      }
      result.warnings.push(...structureValidation.warnings);
      
      if (result.valid && geojson.features) {
        // Validate each feature
        const featureResults = await this.validateFeatures(geojson.features, options);
        result.featureCount = featureResults.validCount;
        result.invalidFeatureCount = featureResults.invalidCount;
        result.errors.push(...featureResults.errors);
        result.warnings.push(...featureResults.warnings);
        
        if (featureResults.invalidCount > 0) {
          result.valid = false;
        }
      }
      
      // Calculate statistics
      result.statistics = this.calculateValidationStatistics(geojson, result);
      
      // Update global statistics
      this.updateValidationStatistics(startTime, result.valid);
      
      // Emit validation event
      globalEventBus.emit('data.validation.completed', {
        type: 'geojson',
        valid: result.valid,
        featureCount: result.featureCount,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        duration: performance.now() - startTime
      });
      
      timer.end({
        valid: result.valid,
        featureCount: result.featureCount,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });
      
      this.logger.info('GeoJSON validation completed', {
        valid: result.valid,
        featureCount: result.featureCount,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });
      
      return result;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('GeoJSON validation failed', { error: error.message });
      
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        featureCount: 0,
        invalidFeatureCount: 0,
        statistics: {}
      };
    }
  }

  /**
   * Validate data against a schema
   * @param {*} data - Data to validate
   * @param {string} schemaName - Schema name
   * @param {Object} options - Validation options
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validateSchema(data, schemaName, options = {}) {
    const timer = this.logger.time('schema-validation');
    const startTime = performance.now();
    
    try {
      this.logger.debug('Starting schema validation', { schemaName, dataType: typeof data });
      
      const schema = this.schemas.get(schemaName);
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }
      
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: { schemaName, validatedAt: Date.now() }
      };
      
      // Apply schema validation rules
      for (const [ruleName, rule] of schema.rules) {
        try {
          const ruleResult = rule.validator(data, options);
          if (!ruleResult.valid) {
            if (rule.level === 'error') {
              result.errors.push(rule.message.replace('{value}', ruleResult.value || 'unknown'));
              result.valid = false;
            } else if (rule.level === 'warning') {
              result.warnings.push(rule.message.replace('{value}', ruleResult.value || 'unknown'));
            }
          }
        } catch (ruleError) {
          this.logger.warn('Schema validation rule failed', { 
            schemaName, 
            ruleName, 
            error: ruleError.message 
          });
          result.warnings.push(`Rule '${ruleName}' failed: ${ruleError.message}`);
        }
      }
      
      // Update global statistics
      this.updateValidationStatistics(startTime, result.valid);
      
      // Emit validation event
      globalEventBus.emit('data.validation.completed', {
        type: 'schema',
        schemaName,
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        duration: performance.now() - startTime
      });
      
      timer.end({
        schemaName,
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });
      
      return result;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Schema validation failed', { schemaName, error: error.message });
      
      return {
        valid: false,
        errors: [`Schema validation error: ${error.message}`],
        warnings: [],
        metadata: { schemaName, error: error.message }
      };
    }
  }

  /**
   * Sanitize data by removing or cleaning potentially harmful content
   * @param {*} data - Data to sanitize
   * @param {Object} options - Sanitization options
   * @returns {*} Sanitized data
   */
  sanitizeData(data, options = {}) {
    const timer = this.logger.time('data-sanitization');
    
    try {
      this.logger.debug('Starting data sanitization', { dataType: typeof data });
      
      const sanitized = this.performSanitization(data, options);
      
      // Emit sanitization event
      globalEventBus.emit('data.sanitization.completed', {
        originalType: typeof data,
        sanitizedType: typeof sanitized,
        changes: this.calculateSanitizationChanges(data, sanitized)
      });
      
      timer.end({ 
        originalType: typeof data,
        sanitizedType: typeof sanitized
      });
      
      this.logger.debug('Data sanitization completed');
      return sanitized;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Data sanitization failed', { error: error.message });
      return data; // Return original data if sanitization fails
    }
  }

  /**
   * Register a validation rule
   * @param {string} name - Rule name
   * @param {ValidationRule} rule - Validation rule
   */
  registerRule(name, rule) {
    this.validationRules.set(name, rule);
    this.logger.debug('Validation rule registered', { name, level: rule.level });
  }

  /**
   * Register a schema
   * @param {string} name - Schema name
   * @param {Object} schema - Schema definition
   */
  registerSchema(name, schema) {
    this.schemas.set(name, schema);
    this.logger.debug('Schema registered', { name, ruleCount: schema.rules?.size || 0 });
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getStatistics() {
    return { ...this.statistics };
  }

  /**
   * Reset validation statistics
   */
  resetStatistics() {
    this.statistics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      validationHistory: []
    };
    this.logger.info('Validation statistics reset');
  }

  /**
   * Validate GeoJSON structure
   * @private
   * @param {Object} geojson - GeoJSON to validate
   * @returns {ValidationResult} Structure validation result
   */
  validateGeoJSONStructure(geojson) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check if geojson is an object
    if (!geojson || typeof geojson !== 'object') {
      result.errors.push('GeoJSON must be an object');
      result.valid = false;
      return result;
    }
    
    // Check type
    if (geojson.type !== 'FeatureCollection') {
      result.errors.push(`Expected FeatureCollection, got ${geojson.type}`);
      result.valid = false;
    }
    
    // Check features array
    if (!Array.isArray(geojson.features)) {
      result.errors.push('Features must be an array');
      result.valid = false;
    } else if (geojson.features.length === 0) {
      result.warnings.push('FeatureCollection contains no features');
    }
    
    // Check for required properties
    if (!geojson.crs && !geojson.coordinateReferenceSystem) {
      result.warnings.push('No CRS specified, assuming WGS84');
    }
    
    return result;
  }

  /**
   * Validate GeoJSON features
   * @private
   * @param {Array} features - Features to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Feature validation results
   */
  async validateFeatures(features, options) {
    const results = {
      validCount: 0,
      invalidCount: 0,
      errors: [],
      warnings: []
    };
    
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      
      try {
        const featureValidation = this.validateFeature(feature, i);
        if (featureValidation.valid) {
          results.validCount++;
        } else {
          results.invalidCount++;
          results.errors.push(...featureValidation.errors.map(error => 
            `Feature ${i}: ${error}`
          ));
        }
        results.warnings.push(...featureValidation.warnings.map(warning => 
          `Feature ${i}: ${warning}`
        ));
      } catch (error) {
        results.invalidCount++;
        results.errors.push(`Feature ${i}: Validation error - ${error.message}`);
      }
    }
    
    return results;
  }

  /**
   * Validate a single GeoJSON feature
   * @private
   * @param {Object} feature - Feature to validate
   * @param {number} index - Feature index
   * @returns {ValidationResult} Feature validation result
   */
  validateFeature(feature, index) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check feature structure
    if (!feature || typeof feature !== 'object') {
      result.errors.push('Feature must be an object');
      result.valid = false;
      return result;
    }
    
    // Check type
    if (feature.type !== 'Feature') {
      result.errors.push(`Expected Feature, got ${feature.type}`);
      result.valid = false;
    }
    
    // Check geometry
    if (!feature.geometry) {
      result.errors.push('Feature must have geometry');
      result.valid = false;
    } else {
      const geometryValidation = this.validateGeometry(feature.geometry);
      if (!geometryValidation.valid) {
        result.errors.push(...geometryValidation.errors);
        result.valid = false;
      }
      result.warnings.push(...geometryValidation.warnings);
    }
    
    // Check properties
    if (!feature.properties) {
      result.warnings.push('Feature has no properties');
    } else if (typeof feature.properties !== 'object') {
      result.errors.push('Properties must be an object');
      result.valid = false;
    }
    
    return result;
  }

  /**
   * Validate GeoJSON geometry
   * @private
   * @param {Object} geometry - Geometry to validate
   * @returns {ValidationResult} Geometry validation result
   */
  validateGeometry(geometry) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    if (!geometry || typeof geometry !== 'object') {
      result.errors.push('Geometry must be an object');
      result.valid = false;
      return result;
    }
    
    // Check type
    const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];
    if (!validTypes.includes(geometry.type)) {
      result.errors.push(`Invalid geometry type: ${geometry.type}`);
      result.valid = false;
    }
    
    // Check coordinates
    if (!geometry.coordinates) {
      result.errors.push('Geometry must have coordinates');
      result.valid = false;
    } else {
      const coordinateValidation = this.validateCoordinates(geometry.coordinates, geometry.type);
      if (!coordinateValidation.valid) {
        result.errors.push(...coordinateValidation.errors);
        result.valid = false;
      }
      result.warnings.push(...coordinateValidation.warnings);
    }
    
    return result;
  }

  /**
   * Validate coordinates
   * @private
   * @param {Array} coordinates - Coordinates to validate
   * @param {string} type - Geometry type
   * @returns {ValidationResult} Coordinate validation result
   */
  validateCoordinates(coordinates, type) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    if (!Array.isArray(coordinates)) {
      result.errors.push('Coordinates must be an array');
      result.valid = false;
      return result;
    }
    
    // Validate based on geometry type
    switch (type) {
      case 'Point':
        this.validatePointCoordinates(coordinates, result);
        break;
      case 'LineString':
        this.validateLineStringCoordinates(coordinates, result);
        break;
      case 'Polygon':
        this.validatePolygonCoordinates(coordinates, result);
        break;
      case 'MultiPoint':
        this.validateMultiPointCoordinates(coordinates, result);
        break;
      case 'MultiLineString':
        this.validateMultiLineStringCoordinates(coordinates, result);
        break;
      case 'MultiPolygon':
        this.validateMultiPolygonCoordinates(coordinates, result);
        break;
    }
    
    return result;
  }

  /**
   * Validate Point coordinates
   * @private
   * @param {Array} coordinates - Point coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validatePointCoordinates(coordinates, result) {
    if (coordinates.length < 2) {
      result.errors.push('Point must have at least 2 coordinates (longitude, latitude)');
      result.valid = false;
      return;
    }
    
    const [lng, lat] = coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      result.errors.push('Point coordinates must be numbers');
      result.valid = false;
      return;
    }
    
    if (lng < -180 || lng > 180) {
      result.warnings.push('Longitude is outside valid range (-180 to 180)');
    }
    
    if (lat < -90 || lat > 90) {
      result.warnings.push('Latitude is outside valid range (-90 to 90)');
    }
  }

  /**
   * Validate LineString coordinates
   * @private
   * @param {Array} coordinates - LineString coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validateLineStringCoordinates(coordinates, result) {
    if (coordinates.length < 2) {
      result.errors.push('LineString must have at least 2 points');
      result.valid = false;
      return;
    }
    
    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i];
      if (!Array.isArray(point) || point.length < 2) {
        result.errors.push(`LineString point ${i} must be an array with at least 2 coordinates`);
        result.valid = false;
        continue;
      }
      
      const [lng, lat] = point;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        result.errors.push(`LineString point ${i} coordinates must be numbers`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate Polygon coordinates
   * @private
   * @param {Array} coordinates - Polygon coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validatePolygonCoordinates(coordinates, result) {
    if (coordinates.length === 0) {
      result.errors.push('Polygon must have at least one ring');
      result.valid = false;
      return;
    }
    
    // Validate exterior ring
    const exteriorRing = coordinates[0];
    if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
      result.errors.push('Polygon exterior ring must have at least 4 points');
      result.valid = false;
    } else {
      // Check if ring is closed
      const first = exteriorRing[0];
      const last = exteriorRing[exteriorRing.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        result.warnings.push('Polygon exterior ring is not closed');
      }
    }
    
    // Validate interior rings
    for (let i = 1; i < coordinates.length; i++) {
      const ring = coordinates[i];
      if (!Array.isArray(ring) || ring.length < 4) {
        result.errors.push(`Polygon interior ring ${i - 1} must have at least 4 points`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate MultiPoint coordinates
   * @private
   * @param {Array} coordinates - MultiPoint coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validateMultiPointCoordinates(coordinates, result) {
    for (let i = 0; i < coordinates.length; i++) {
      const point = coordinates[i];
      if (!Array.isArray(point) || point.length < 2) {
        result.errors.push(`MultiPoint point ${i} must be an array with at least 2 coordinates`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate MultiLineString coordinates
   * @private
   * @param {Array} coordinates - MultiLineString coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validateMultiLineStringCoordinates(coordinates, result) {
    for (let i = 0; i < coordinates.length; i++) {
      const lineString = coordinates[i];
      if (!Array.isArray(lineString) || lineString.length < 2) {
        result.errors.push(`MultiLineString line ${i} must have at least 2 points`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate MultiPolygon coordinates
   * @private
   * @param {Array} coordinates - MultiPolygon coordinates
   * @param {ValidationResult} result - Result object to update
   */
  validateMultiPolygonCoordinates(coordinates, result) {
    for (let i = 0; i < coordinates.length; i++) {
      const polygon = coordinates[i];
      if (!Array.isArray(polygon) || polygon.length === 0) {
        result.errors.push(`MultiPolygon polygon ${i} must have at least one ring`);
        result.valid = false;
      }
    }
  }

  /**
   * Perform data sanitization
   * @private
   * @param {*} data - Data to sanitize
   * @param {Object} options - Sanitization options
   * @returns {*} Sanitized data
   */
  performSanitization(data, options) {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data === 'string') {
      return this.sanitizeString(data, options);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.performSanitization(item, options));
    }
    
    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedKey = this.sanitizeString(key, options);
        const sanitizedValue = this.performSanitization(value, options);
        sanitized[sanitizedKey] = sanitizedValue;
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitize string data
   * @private
   * @param {string} str - String to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized string
   */
  sanitizeString(str, options) {
    if (typeof str !== 'string') {
      return str;
    }
    
    let sanitized = str;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length if specified
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
  }

  /**
   * Calculate validation statistics
   * @private
   * @param {Object} geojson - Original GeoJSON
   * @param {Object} result - Validation result
   * @returns {Object} Statistics
   */
  calculateValidationStatistics(geojson, result) {
    return {
      totalFeatures: geojson.features?.length || 0,
      validFeatures: result.featureCount,
      invalidFeatures: result.invalidFeatureCount,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      validationRate: result.featureCount / (geojson.features?.length || 1)
    };
  }

  /**
   * Calculate sanitization changes
   * @private
   * @param {*} original - Original data
   * @param {*} sanitized - Sanitized data
   * @returns {Object} Change statistics
   */
  calculateSanitizationChanges(original, sanitized) {
    return {
      typeChanged: typeof original !== typeof sanitized,
      lengthChanged: typeof original === 'string' && original.length !== sanitized.length,
      structureChanged: JSON.stringify(original) !== JSON.stringify(sanitized)
    };
  }

  /**
   * Update validation statistics
   * @private
   * @param {number} startTime - Validation start time
   * @param {boolean} valid - Whether validation was successful
   */
  updateValidationStatistics(startTime, valid) {
    const duration = performance.now() - startTime;
    
    this.statistics.totalValidations++;
    if (valid) {
      this.statistics.successfulValidations++;
    } else {
      this.statistics.failedValidations++;
    }
    
    // Update average validation time
    this.statistics.averageValidationTime = 
      (this.statistics.averageValidationTime * (this.statistics.totalValidations - 1) + duration) / 
      this.statistics.totalValidations;
    
    // Add to history (keep last 100)
    this.statistics.validationHistory.push({
      timestamp: Date.now(),
      duration,
      valid
    });
    
    if (this.statistics.validationHistory.length > 100) {
      this.statistics.validationHistory.shift();
    }
  }

  /**
   * Setup validation rules
   * @private
   */
  setupValidationRules() {
    // Basic validation rules
    this.registerRule('required', {
      name: 'required',
      validator: (value) => ({ valid: value !== null && value !== undefined && value !== '' }),
      message: 'Value is required',
      level: 'error'
    });
    
    this.registerRule('string', {
      name: 'string',
      validator: (value) => ({ valid: typeof value === 'string' }),
      message: 'Value must be a string',
      level: 'error'
    });
    
    this.registerRule('number', {
      name: 'number',
      validator: (value) => ({ valid: typeof value === 'number' && !isNaN(value) }),
      message: 'Value must be a number',
      level: 'error'
    });
    
    this.registerRule('array', {
      name: 'array',
      validator: (value) => ({ valid: Array.isArray(value) }),
      message: 'Value must be an array',
      level: 'error'
    });
    
    this.registerRule('object', {
      name: 'object',
      validator: (value) => ({ valid: typeof value === 'object' && value !== null && !Array.isArray(value) }),
      message: 'Value must be an object',
      level: 'error'
    });
  }

  /**
   * Setup event handlers
   * @private
   */
  setupEventHandlers() {
    // Listen for data validation requests
    globalEventBus.on('data.validation.request', (event) => {
      this.handleValidationRequest(event.payload);
    });
  }

  /**
   * Handle validation request events
   * @private
   * @param {Object} payload - Event payload
   */
  async handleValidationRequest(payload) {
    try {
      const { data, type, options } = payload;
      
      let result;
      if (type === 'geojson') {
        result = await this.validateGeoJSON(data, options);
      } else if (type === 'schema') {
        result = await this.validateSchema(data, payload.schemaName, options);
      } else {
        this.logger.warn('Unknown validation type requested', { type });
        return;
      }
      
      // Emit validation result
      globalEventBus.emit('data.validation.result', {
        requestId: payload.requestId,
        result
      });
      
    } catch (error) {
      this.logger.error('Validation request handling failed', { 
        error: error.message,
        payload 
      });
    }
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();
