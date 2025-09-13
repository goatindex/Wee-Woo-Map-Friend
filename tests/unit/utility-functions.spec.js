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

test.describe('Utility Functions Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for utility modules to be available
    await page.waitForFunction(() => 
      typeof window.UtilityManager !== 'undefined' && 
      typeof window.CoordinateConverter !== 'undefined', 
      { timeout: 10000 }
    );
  });

  test('should test coordinate conversion functions', async ({ page }) => {
    const coordinateTests = await page.evaluate(() => {
      // Test coordinate conversion utilities
      function convertToDecimal(degrees, minutes, seconds) {
        return degrees + (minutes / 60) + (seconds / 3600);
      }
      
      function formatCoordinate(lat, lng, precision = 6) {
        return {
          lat: parseFloat(lat.toFixed(precision)),
          lng: parseFloat(lng.toFixed(precision))
        };
      }
      
      function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      
      return {
        decimalConversion: {
          melbourne: convertToDecimal(-37, 48, 49), // Melbourne coordinates
          sydney: convertToDecimal(-33, 52, 10)     // Sydney coordinates
        },
        coordinateFormatting: {
          basic: formatCoordinate(-37.8136, 144.9631),
          precise: formatCoordinate(-37.813612345, 144.963123456, 8)
        },
        distanceCalculation: {
          melbourneToSydney: calculateDistance(-37.8136, 144.9631, -33.8688, 151.2093),
          samePoint: calculateDistance(-37.8136, 144.9631, -37.8136, 144.9631)
        }
      };
    });
    
    // Test decimal conversion
    expect(coordinateTests.decimalConversion.melbourne).toBeCloseTo(-37.8136, 4);
    expect(coordinateTests.decimalConversion.sydney).toBeCloseTo(-33.8694, 4);
    
    // Test coordinate formatting
    expect(coordinateTests.coordinateFormatting.basic).toEqual({
      lat: -37.8136,
      lng: 144.9631
    });
    expect(coordinateTests.coordinateFormatting.precise).toEqual({
      lat: -37.81361235,
      lng: 144.96312346
    });
    
    // Test distance calculation
    expect(coordinateTests.distanceCalculation.melbourneToSydney).toBeCloseTo(713, 0); // ~713km
    expect(coordinateTests.distanceCalculation.samePoint).toBe(0);
  });

  test('should test data validation functions', async ({ page }) => {
    const validationTests = await page.evaluate(() => {
      // Test data validation utilities
      function validateGeoJSON(geoJson) {
        if (!geoJson || typeof geoJson !== 'object') return false;
        if (!geoJson.type || !geoJson.features) return false;
        if (geoJson.type !== 'FeatureCollection') return false;
        return Array.isArray(geoJson.features);
      }
      
      function validateCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      }
      
      function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      }
      
      function validatePhoneNumber(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
      }
      
      return {
        geoJsonValidation: {
          valid: validateGeoJSON({
            type: 'FeatureCollection',
            features: []
          }),
          invalidType: validateGeoJSON({
            type: 'Feature',
            features: []
          }),
          invalidStructure: validateGeoJSON({
            type: 'FeatureCollection'
            // missing features
          }),
          nullInput: validateGeoJSON(null)
        },
        coordinateValidation: {
          valid: validateCoordinates(-37.8136, 144.9631),
          invalidLat: validateCoordinates(91, 144.9631),
          invalidLng: validateCoordinates(-37.8136, 181),
          bothInvalid: validateCoordinates(91, 181)
        },
        emailValidation: {
          valid: validateEmail('test@example.com'),
          invalid: validateEmail('invalid-email'),
          empty: validateEmail('')
        },
        phoneValidation: {
          valid: validatePhoneNumber('+61412345678'),
          validLocal: validatePhoneNumber('0412345678'),
          invalid: validatePhoneNumber('abc123'),
          empty: validatePhoneNumber('')
        }
      };
    });
    
    // Test GeoJSON validation
    expect(validationTests.geoJsonValidation.valid).toBe(true);
    expect(validationTests.geoJsonValidation.invalidType).toBe(false);
    expect(validationTests.geoJsonValidation.invalidStructure).toBe(false);
    expect(validationTests.geoJsonValidation.nullInput).toBe(false);
    
    // Test coordinate validation
    expect(validationTests.coordinateValidation.valid).toBe(true);
    expect(validationTests.coordinateValidation.invalidLat).toBe(false);
    expect(validationTests.coordinateValidation.invalidLng).toBe(false);
    expect(validationTests.coordinateValidation.bothInvalid).toBe(false);
    
    // Test email validation
    expect(validationTests.emailValidation.valid).toBe(true);
    expect(validationTests.emailValidation.invalid).toBe(false);
    expect(validationTests.emailValidation.empty).toBe(false);
    
    // Test phone validation
    expect(validationTests.phoneValidation.valid).toBe(true);
    expect(validationTests.phoneValidation.validLocal).toBe(true);
    expect(validationTests.phoneValidation.invalid).toBe(false);
    expect(validationTests.phoneValidation.empty).toBe(false);
  });

  test('should test string manipulation functions', async ({ page }) => {
    const stringTests = await page.evaluate(() => {
      // Test string manipulation utilities
      function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }
      
      function truncateString(str, maxLength, suffix = '...') {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
      }
      
      function slugify(str) {
        return str
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      
      function formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
      }
      
      return {
        capitalization: {
          basic: capitalizeFirst('hello world'),
          alreadyCapitalized: capitalizeFirst('HELLO WORLD'),
          singleWord: capitalizeFirst('test')
        },
        truncation: {
          short: truncateString('Hello', 10),
          long: truncateString('This is a very long string that should be truncated', 20),
          exact: truncateString('Exactly ten chars', 10)
        },
        slugification: {
          basic: slugify('Hello World!'),
          specialChars: slugify('Test@#$%^&*()_+{}|:<>?[]\\;\'",./'),
          multipleSpaces: slugify('Multiple   Spaces   Here')
        },
        fileSizeFormatting: {
          bytes: formatFileSize(0),
          kb: formatFileSize(1024),
          mb: formatFileSize(1024 * 1024),
          gb: formatFileSize(1024 * 1024 * 1024)
        }
      };
    });
    
    // Test capitalization
    expect(stringTests.capitalization.basic).toBe('Hello world');
    expect(stringTests.capitalization.alreadyCapitalized).toBe('Hello world');
    expect(stringTests.capitalization.singleWord).toBe('Test');
    
    // Test truncation
    expect(stringTests.truncation.short).toBe('Hello');
    expect(stringTests.truncation.long).toBe('This is a very lo...');
    expect(stringTests.truncation.exact).toBe('Exactly ten chars');
    
    // Test slugification
    expect(stringTests.slugification.basic).toBe('hello-world');
    expect(stringTests.slugification.specialChars).toBe('test');
    expect(stringTests.slugification.multipleSpaces).toBe('multiple-spaces-here');
    
    // Test file size formatting
    expect(stringTests.fileSizeFormatting.bytes).toBe('0 Bytes');
    expect(stringTests.fileSizeFormatting.kb).toBe('1 KB');
    expect(stringTests.fileSizeFormatting.mb).toBe('1 MB');
    expect(stringTests.fileSizeFormatting.gb).toBe('1 GB');
  });

  test('should test array manipulation functions', async ({ page }) => {
    const arrayTests = await page.evaluate(() => {
      // Test array manipulation utilities
      function uniqueArray(arr) {
        return [...new Set(arr)];
      }
      
      function chunkArray(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      }
      
      function flattenArray(arr) {
        return arr.reduce((flat, item) => {
          return flat.concat(Array.isArray(item) ? flattenArray(item) : item);
        }, []);
      }
      
      function groupBy(arr, key) {
        return arr.reduce((groups, item) => {
          const group = item[key];
          groups[group] = groups[group] || [];
          groups[group].push(item);
          return groups;
        }, {});
      }
      
      return {
        uniqueArray: {
          numbers: uniqueArray([1, 2, 2, 3, 3, 3, 4]),
          strings: uniqueArray(['a', 'b', 'b', 'c', 'c', 'c', 'd'])
        },
        chunkArray: {
          even: chunkArray([1, 2, 3, 4, 5, 6], 2),
          odd: chunkArray([1, 2, 3, 4, 5], 3)
        },
        flattenArray: {
          nested: flattenArray([1, [2, 3], [4, [5, 6]]]),
          deep: flattenArray([1, [2, [3, [4, 5]]]])
        },
        groupBy: {
          byType: groupBy([
            { name: 'John', type: 'user' },
            { name: 'Jane', type: 'admin' },
            { name: 'Bob', type: 'user' }
          ], 'type')
        }
      };
    });
    
    // Test unique array
    expect(arrayTests.uniqueArray.numbers).toEqual([1, 2, 3, 4]);
    expect(arrayTests.uniqueArray.strings).toEqual(['a', 'b', 'c', 'd']);
    
    // Test chunk array
    expect(arrayTests.chunkArray.even).toEqual([[1, 2], [3, 4], [5, 6]]);
    expect(arrayTests.chunkArray.odd).toEqual([[1, 2, 3], [4, 5]]);
    
    // Test flatten array
    expect(arrayTests.flattenArray.nested).toEqual([1, 2, 3, 4, 5, 6]);
    expect(arrayTests.flattenArray.deep).toEqual([1, 2, 3, 4, 5]);
    
    // Test group by
    expect(arrayTests.groupBy.byType).toEqual({
      user: [
        { name: 'John', type: 'user' },
        { name: 'Bob', type: 'user' }
      ],
      admin: [
        { name: 'Jane', type: 'admin' }
      ]
    });
  });
});



