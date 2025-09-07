import { DataValidator } from '../js/modules/DataValidator.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';

// Mock logger for testing
const mockLogger = new StructuredLogger({
  transports: [{
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(() => ({ end: jest.fn() })),
    createChild: jest.fn(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      time: jest.fn(() => ({ end: jest.fn() })),
      createChild: jest.fn(() => ({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        time: jest.fn(() => ({ end: jest.fn() })),
      })),
    })),
  }]
});

describe('DataValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DataValidator();
    // Manually inject the mock logger
    validator.logger = mockLogger.createChild({ module: 'DataValidator' });
    jest.clearAllMocks();
  });

  describe('GeoJSON Validation', () => {
    const validGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
            name: 'Test Point'
          }
        }
      ]
    };

    const invalidGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: ['invalid', 'coordinates']
          },
          properties: {
            name: 'Test Point'
          }
        }
      ]
    };

    it('should validate valid GeoJSON successfully', async () => {
      const result = await validator.validateGeoJSON(validGeoJSON);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.featureCount).toBe(1);
      expect(result.invalidFeatureCount).toBe(0);
      expect(result.statistics).toHaveProperty('totalFeatures', 1);
      expect(result.statistics).toHaveProperty('validFeatures', 1);
      expect(result.statistics).toHaveProperty('validationRate', 1);
    });

    it('should identify invalid GeoJSON', async () => {
      const result = await validator.validateGeoJSON(invalidGeoJSON);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.featureCount).toBe(0);
      expect(result.invalidFeatureCount).toBe(1);
    });

    it('should handle empty FeatureCollection', async () => {
      const emptyGeoJSON = {
        type: 'FeatureCollection',
        features: []
      };
      
      const result = await validator.validateGeoJSON(emptyGeoJSON);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('FeatureCollection contains no features');
      expect(result.featureCount).toBe(0);
    });

    it('should validate Point geometry correctly', async () => {
      const pointGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            },
            properties: {}
          }
        ]
      };
      
      const result = await validator.validateGeoJSON(pointGeoJSON);
      expect(result.valid).toBe(true);
    });

    it('should validate LineString geometry correctly', async () => {
      const lineStringGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [1, 1], [2, 2]]
            },
            properties: {}
          }
        ]
      };
      
      const result = await validator.validateGeoJSON(lineStringGeoJSON);
      expect(result.valid).toBe(true);
    });

    it('should validate Polygon geometry correctly', async () => {
      const polygonGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            },
            properties: {}
          }
        ]
      };
      
      const result = await validator.validateGeoJSON(polygonGeoJSON);
      expect(result.valid).toBe(true);
    });

    it('should warn about unclosed polygon rings', async () => {
      const unclosedPolygonGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] // Not closed
            },
            properties: {}
          }
        ]
      };
      
      const result = await validator.validateGeoJSON(unclosedPolygonGeoJSON);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('not closed'))).toBe(true);
    });

    it('should warn about coordinates outside valid ranges', async () => {
      const invalidCoordsGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [200, 100] // Invalid coordinates
            },
            properties: {}
          }
        ]
      };
      
      const result = await validator.validateGeoJSON(invalidCoordsGeoJSON);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('outside valid range'))).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const result = await validator.validateGeoJSON(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('GeoJSON must be an object');
    });
  });

  describe('Schema Validation', () => {
    beforeEach(() => {
      // Register a test schema
      validator.registerSchema('testSchema', {
        rules: new Map([
          ['required', {
            name: 'required',
            validator: (value) => ({ valid: value !== null && value !== undefined }),
            message: 'Value is required',
            level: 'error'
          }],
          ['string', {
            name: 'string',
            validator: (value) => ({ valid: typeof value === 'string' }),
            message: 'Value must be a string',
            level: 'error'
          }]
        ])
      });
    });

    it('should validate data against schema successfully', async () => {
      const result = await validator.validateSchema('test string', 'testSchema');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.schemaName).toBe('testSchema');
    });

    it('should identify schema validation errors', async () => {
      const result = await validator.validateSchema(123, 'testSchema');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Value must be a string');
    });

    it('should handle missing schema', async () => {
      const result = await validator.validateSchema('test', 'nonExistentSchema');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Schema 'nonExistentSchema' not found");
    });

    it('should handle schema validation errors gracefully', async () => {
      // Register a schema with a faulty rule
      validator.registerSchema('faultySchema', {
        rules: new Map([
          ['faulty', {
            name: 'faulty',
            validator: () => { throw new Error('Rule error'); },
            message: 'Rule failed',
            level: 'error'
          }]
        ])
      });
      
      const result = await validator.validateSchema('test', 'faultySchema');
      
      expect(result.valid).toBe(true); // Should not fail the entire validation
      expect(result.warnings).toContain("Rule 'faulty' failed: Rule error");
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize string data', () => {
      const input = '  test\nstring\twith\0null\0bytes  ';
      const result = validator.sanitizeData(input);
      
      expect(result).toBe('test\nstring\twithnullbytes');
    });

    it('should sanitize object data', () => {
      const input = {
        '  key  ': '  value  ',
        'null\0key': 'test\0value',
        normalKey: 'normal value'
      };
      
      const result = validator.sanitizeData(input);
      
      expect(result).toEqual({
        'key': 'value',
        'nullkey': 'testvalue',
        normalKey: 'normal value'
      });
    });

    it('should sanitize array data', () => {
      const input = ['  item1  ', 'item\0with\0null', '  item2  '];
      const result = validator.sanitizeData(input);
      
      expect(result).toEqual(['item1', 'itemwithnull', 'item2']);
    });

    it('should handle null and undefined values', () => {
      expect(validator.sanitizeData(null)).toBe(null);
      expect(validator.sanitizeData(undefined)).toBe(undefined);
    });

    it('should respect maxLength option', () => {
      const input = 'This is a very long string that should be truncated';
      const result = validator.sanitizeData(input, { maxLength: 10 });
      
      expect(result).toBe('This is a ');
    });

    it('should handle sanitization errors gracefully', () => {
      // Mock performSanitization to throw an error
      jest.spyOn(validator, 'performSanitization').mockImplementationOnce(() => {
        throw new Error('Sanitization error');
      });
      
      const result = validator.sanitizeData('test');
      expect(result).toBe('test'); // Should return original data
    });
  });

  describe('Rule Registration', () => {
    it('should register validation rules', () => {
      const rule = {
        name: 'customRule',
        validator: (value) => ({ valid: value > 0 }),
        message: 'Value must be positive',
        level: 'error'
      };
      
      validator.registerRule('customRule', rule);
      
      // Check if rule was registered (internal implementation detail)
      expect(validator.validationRules.has('customRule')).toBe(true);
    });

    it('should register schemas', () => {
      const schema = {
        rules: new Map([
          ['test', {
            name: 'test',
            validator: () => ({ valid: true }),
            message: 'Test rule',
            level: 'error'
          }]
        ])
      };
      
      validator.registerSchema('testSchema', schema);
      
      // Check if schema was registered (internal implementation detail)
      expect(validator.schemas.has('testSchema')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track validation statistics', async () => {
      const initialStats = validator.getStatistics();
      expect(initialStats.totalValidations).toBe(0);
      
      await validator.validateGeoJSON(validGeoJSON);
      
      const updatedStats = validator.getStatistics();
      expect(updatedStats.totalValidations).toBe(1);
      expect(updatedStats.successfulValidations).toBe(1);
      expect(updatedStats.failedValidations).toBe(0);
      expect(updatedStats.averageValidationTime).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      await validator.validateGeoJSON(validGeoJSON);
      
      validator.resetStatistics();
      
      const stats = validator.getStatistics();
      expect(stats.totalValidations).toBe(0);
      expect(stats.successfulValidations).toBe(0);
      expect(stats.failedValidations).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle GeoJSON validation errors gracefully', async () => {
      // Mock validateGeoJSONStructure to throw an error
      jest.spyOn(validator, 'validateGeoJSONStructure').mockImplementationOnce(() => {
        throw new Error('Structure validation error');
      });
      
      const result = await validator.validateGeoJSON(validGeoJSON);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Validation error: Structure validation error');
    });

    it('should handle schema validation errors gracefully', async () => {
      validator.registerSchema('testSchema', {
        rules: new Map()
      });
      
      // Mock validateSchema to throw an error
      jest.spyOn(validator, 'validateSchema').mockImplementationOnce(() => {
        throw new Error('Schema validation error');
      });
      
      const result = await validator.validateSchema('test', 'testSchema');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schema validation error: Schema validation error');
    });
  });

  describe('Coordinate Validation', () => {
    it('should validate Point coordinates correctly', () => {
      const result = validator.validateCoordinates([0, 0], 'Point');
      expect(result.valid).toBe(true);
    });

    it('should validate LineString coordinates correctly', () => {
      const result = validator.validateCoordinates([[0, 0], [1, 1]], 'LineString');
      expect(result.valid).toBe(true);
    });

    it('should validate Polygon coordinates correctly', () => {
      const result = validator.validateCoordinates([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], 'Polygon');
      expect(result.valid).toBe(true);
    });

    it('should identify invalid coordinate types', () => {
      const result = validator.validateCoordinates('invalid', 'Point');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Coordinates must be an array');
    });

    it('should identify insufficient coordinates', () => {
      const result = validator.validateCoordinates([0], 'Point');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Point must have at least 2 coordinates (longitude, latitude)');
    });
  });
});
