/**
 * @fileoverview Test CoordinateConverter DI Migration
 * Tests the migration of CoordinateConverter from direct instantiation to DI pattern
 */

import { test, expect } from '@playwright/test';

test.describe('CoordinateConverter DI Migration', () => {
  test('should resolve CoordinateConverter from DI container', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Test DI container resolution
    const result = await page.evaluate(() => {
      try {
        // Check if DependencyContainer is available
        if (!window.DependencyContainer) {
          return { error: 'DependencyContainer not available' };
        }
        
        const container = window.DependencyContainer.getContainer();
        const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
        
        return {
          success: true,
          coordinateConverter: !!coordinateConverter,
          hasConvertMethod: typeof coordinateConverter?.convertMGA94ToLatLon === 'function',
          hasBatchConvertMethod: typeof coordinateConverter?.batchConvertMGA94ToLatLon === 'function',
          hasValidateMethod: typeof coordinateConverter?.validateMGA94Coordinates === 'function'
        };
      } catch (error) {
        return { error: error.message, stack: error.stack };
      }
    });
    
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.coordinateConverter).toBe(true);
    expect(result.hasConvertMethod).toBe(true);
    expect(result.hasBatchConvertMethod).toBe(true);
    expect(result.hasValidateMethod).toBe(true);
  });

  test('should initialize CoordinateConverter without errors', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Test module initialization
    const result = await page.evaluate(() => {
      try {
        const container = window.DependencyContainer.getContainer();
        const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
        
        // Test basic functionality
        const testResult = coordinateConverter.convertMGA94ToLatLon(500000, 6000000);
        
        return {
          success: true,
          conversionResult: testResult,
          hasResult: testResult !== null,
          isArray: Array.isArray(testResult),
          hasTwoElements: testResult && testResult.length === 2
        };
      } catch (error) {
        return { error: error.message, stack: error.stack };
      }
    });
    
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.hasResult).toBe(true);
    expect(result.isArray).toBe(true);
    expect(result.hasTwoElements).toBe(true);
  });

  test('should handle error injection gracefully', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Test error handling
    const result = await page.evaluate(() => {
      try {
        const container = window.DependencyContainer.getContainer();
        const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
        
        // Test 1: Invalid input data
        const invalidResult = coordinateConverter.convertMGA94ToLatLon('invalid', 'data');
        
        // Test 2: Null input
        const nullResult = coordinateConverter.convertMGA94ToLatLon(null, null);
        
        // Test 3: Batch conversion with invalid data
        const batchResult = coordinateConverter.batchConvertMGA94ToLatLon([
          { x: 'invalid', y: 'data' },
          { x: 500000, y: 6000000 }
        ]);
        
        return {
          success: true,
          invalidResult: invalidResult,
          nullResult: nullResult,
          batchResult: batchResult,
          invalidHandled: invalidResult === null,
          nullHandled: nullResult === null,
          batchHandled: Array.isArray(batchResult) && batchResult.length === 2
        };
      } catch (error) {
        return { error: error.message, stack: error.stack };
      }
    });
    
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.invalidHandled).toBe(true);
    expect(result.nullHandled).toBe(true);
    expect(result.batchHandled).toBe(true);
  });

  test('should work with downstream dependencies', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Test integration with other modules
    const result = await page.evaluate(() => {
      try {
        const container = window.DependencyContainer.getContainer();
        const coordinateConverter = container.get(window.TYPES.CoordinateConverter);
        
        // Test that CoordinateConverter can be used by other modules
        // (This is a basic test - in a real scenario, we'd test actual downstream usage)
        const testCoords = [
          { x: 500000, y: 6000000 },
          { x: 600000, y: 6100000 }
        ];
        
        const batchResult = coordinateConverter.batchConvertMGA94ToLatLon(testCoords);
        const validResults = batchResult.filter(r => r.converted);
        
        return {
          success: true,
          totalInput: testCoords.length,
          totalOutput: batchResult.length,
          validConversions: validResults.length,
          allConverted: validResults.length === testCoords.length
        };
      } catch (error) {
        return { error: error.message, stack: error.stack };
      }
    });
    
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.totalInput).toBe(2);
    expect(result.totalOutput).toBe(2);
    expect(result.allConverted).toBe(true);
  });
});

