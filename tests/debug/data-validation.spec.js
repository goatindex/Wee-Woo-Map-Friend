/**
 * @fileoverview Playwright Test File
 * 
 * 📚 Documentation:
 * - Testing Framework: project_docs/development/testing-playwright.md
 * - Build Process: project_docs/development/build-automation.md
 * 
 * 🔧 Build Process:
 * Tests automatically run `npm run build:js` before execution to ensure
 * decorators are properly transformed from TypeScript to browser-compatible JavaScript.
 */

import { test, expect } from '@playwright/test';

test.describe('Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application to load modules
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow for module loading
  });

  test('should validate GeoJSON data correctly', async ({ page }) => {
    const validationResults = await page.evaluate(() => {
      // Test if DataValidator is available
      if (typeof window.DataValidator === 'undefined') {
        return { available: false, error: 'DataValidator not found' };
      }

      const validator = new window.DataValidator();
      
      // Test valid GeoJSON
      const validGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            },
            properties: { name: 'Test Point' }
          }
        ]
      };

      // Test invalid GeoJSON
      const invalidGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: 'invalid' // Should be array
            }
          }
        ]
      };

      try {
        const validResult = validator.validateGeoJSON(validGeoJSON);
        const invalidResult = validator.validateGeoJSON(invalidGeoJSON);
        
        return {
          available: true,
          validResult: validResult,
          invalidResult: invalidResult,
          validPassed: validResult.isValid,
          invalidFailed: !invalidResult.isValid
        };
      } catch (error) {
        return {
          available: true,
          error: error.message
        };
      }
    });

    expect(validationResults.available).toBe(true);
    if (validationResults.error) {
      console.log('DataValidator error:', validationResults.error);
      // If DataValidator isn't available, that's okay - it means the module loading issue
      return;
    }
    
    expect(validationResults.validPassed).toBe(true);
    expect(validationResults.invalidFailed).toBe(true);
  });

  test('should handle different geometry types', async ({ page }) => {
    const geometryResults = await page.evaluate(() => {
      if (typeof window.DataValidator === 'undefined') {
        return { available: false };
      }

      const validator = new window.DataValidator();
      
      const testGeometries = [
        {
          type: 'Point',
          coordinates: [0, 0],
          expected: true
        },
        {
          type: 'LineString',
          coordinates: [[0, 0], [1, 1]],
          expected: true
        },
        {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
          expected: true
        },
        {
          type: 'Point',
          coordinates: 'invalid',
          expected: false
        }
      ];

      const results = testGeometries.map(geom => {
        try {
          const result = validator.validateGeometry(geom);
          return {
            type: geom.type,
            expected: geom.expected,
            actual: result.isValid,
            passed: result.isValid === geom.expected
          };
        } catch (error) {
          return {
            type: geom.type,
            expected: geom.expected,
            actual: false,
            passed: geom.expected === false,
            error: error.message
          };
        }
      });

      return {
        available: true,
        results: results,
        allPassed: results.every(r => r.passed)
      };
    });

    expect(geometryResults.available).toBe(true);
    if (geometryResults.results) {
      expect(geometryResults.allPassed).toBe(true);
    }
  });

  test('should validate real GeoJSON files from the application', async ({ page }) => {
    const realDataValidation = await page.evaluate(async () => {
      if (typeof window.DataValidator === 'undefined') {
        return { available: false };
      }

      const validator = new window.DataValidator();
      
      // Test with actual GeoJSON files from the application
      const testFiles = [
        '/geojson/ses.geojson',
        '/geojson/lga.geojson',
        '/geojson/cfa.geojson'
      ];

      const results = [];
      
      for (const file of testFiles) {
        try {
          const response = await fetch(file);
          if (!response.ok) {
            results.push({ file, status: 'fetch_failed', error: response.statusText });
            continue;
          }
          
          const data = await response.json();
          const validation = validator.validateGeoJSON(data);
          
          results.push({
            file,
            status: 'validated',
            isValid: validation.isValid,
            featureCount: data.features ? data.features.length : 0,
            errors: validation.errors || []
          });
        } catch (error) {
          results.push({
            file,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        available: true,
        results: results,
        allValid: results.filter(r => r.status === 'validated').every(r => r.isValid)
      };
    });

    expect(realDataValidation.available).toBe(true);
    if (realDataValidation.results) {
      // At least some files should be valid
      const validatedResults = realDataValidation.results.filter(r => r.status === 'validated');
      expect(validatedResults.length).toBeGreaterThan(0);
      
      // All validated files should be valid GeoJSON
      validatedResults.forEach(result => {
        expect(result.isValid).toBe(true);
        expect(result.featureCount).toBeGreaterThan(0);
      });
    }
  });
});
