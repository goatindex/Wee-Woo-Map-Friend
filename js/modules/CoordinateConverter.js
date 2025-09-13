/**
 * @fileoverview Coordinate conversion utilities for MGA94 Zone 55 to WGS84 conversion
 * @module CoordinateConverter
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';

/**
 * Coordinate conversion utility for MGA94 Zone 55 (EPSG:28355) to WGS84 conversion
 * Uses proj4 library for coordinate system transformations
 */
@injectable()
export class CoordinateConverter {
  constructor(
    @inject(TYPES.StructuredLogger) private logger
  ) {
    this.logger.info('CoordinateConverter initialized');
  }

  /**
   * Convert MGA94 Zone 55 coordinates to WGS84 (lat/lon)
   * @param {number} x - MGA94 X coordinate
   * @param {number} y - MGA94 Y coordinate
   * @returns {[number, number]|null} [longitude, latitude] or null if conversion fails
   */
  convertMGA94ToLatLon(x, y) {
    const timer = this.logger.time('coordinate-conversion');
    
    try {
      if (typeof proj4 === 'undefined') {
        throw new Error('proj4 library is not loaded. Please include proj4 via CDN or npm.');
      }

      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error(`Invalid coordinates: x=${x}, y=${y}. Expected numbers.`);
      }

      const epsg28355 = '+proj=utm +zone=55 +south +datum=WGS84 +units=m +no_defs';
      const wgs84 = proj4.WGS84;
      const result = proj4(epsg28355, wgs84, [x, y]); // returns [lon, lat]
      
      timer.end({ 
        inputCoords: { x, y },
        outputCoords: result,
        success: true 
      });
      
      this.logger.debug('Coordinate conversion successful', {
        input: { x, y },
        output: result
      });
      
      return result;
    } catch (error) {
      timer.end({ 
        inputCoords: { x, y },
        error: error.message,
        success: false 
      });
      
      this.logger.error('Coordinate conversion failed', {
        error: error.message,
        input: { x, y },
        stack: error.stack
      });
      
      return null;
    }
  }

  /**
   * Batch convert multiple MGA94 coordinates to WGS84
   * @param {Array<{x: number, y: number}>} coordinates - Array of coordinate objects
   * @returns {Array<{x: number, y: number, lon: number, lat: number}>} Array with converted coordinates
   */
  batchConvertMGA94ToLatLon(coordinates) {
    const timer = this.logger.time('batch-coordinate-conversion');
    
    try {
      if (!Array.isArray(coordinates)) {
        throw new Error('Coordinates must be an array');
      }

      const results = coordinates.map((coord, index) => {
        const converted = this.convertMGA94ToLatLon(coord.x, coord.y);
        return {
          ...coord,
          lon: converted ? converted[0] : null,
          lat: converted ? converted[1] : null,
          converted: converted !== null
        };
      });

      const successCount = results.filter(r => r.converted).length;
      
      timer.end({ 
        totalCoordinates: coordinates.length,
        successfulConversions: successCount,
        failedConversions: coordinates.length - successCount,
        success: true 
      });
      
      this.logger.info('Batch coordinate conversion completed', {
        total: coordinates.length,
        successful: successCount,
        failed: coordinates.length - successCount
      });
      
      return results;
    } catch (error) {
      timer.end({ 
        totalCoordinates: coordinates.length,
        error: error.message,
        success: false 
      });
      
      this.logger.error('Batch coordinate conversion failed', {
        error: error.message,
        coordinateCount: coordinates.length,
        stack: error.stack
      });
      
      return [];
    }
  }

  /**
   * Validate if coordinates are within expected MGA94 Zone 55 bounds
   * @param {number} x - MGA94 X coordinate
   * @param {number} y - MGA94 Y coordinate
   * @returns {boolean} True if coordinates are within expected bounds
   */
  validateMGA94Coordinates(x, y) {
    // Approximate bounds for MGA94 Zone 55 in Victoria, Australia
    const bounds = {
      xMin: 200000,
      xMax: 800000,
      yMin: 5500000,
      yMax: 6200000
    };

    const isValid = x >= bounds.xMin && x <= bounds.xMax && 
                   y >= bounds.yMin && y <= bounds.yMax;

    if (!isValid) {
      this.logger.warn('Coordinates outside expected MGA94 Zone 55 bounds', {
        x, y,
        bounds
      });
    }

    return isValid;
  }
}

// Legacy compatibility functions for backward compatibility
// Note: These functions will be removed once all modules are migrated to DI
export const convertMGA94ToLatLon = (x, y) => {
  console.warn('convertMGA94ToLatLon: Legacy function called. Use DI container to get CoordinateConverter instance.');
  throw new Error('Legacy function not available. Use DI container to get CoordinateConverter instance.');
};
export const batchConvertMGA94ToLatLon = (coordinates) => {
  console.warn('batchConvertMGA94ToLatLon: Legacy function called. Use DI container to get CoordinateConverter instance.');
  throw new Error('Legacy function not available. Use DI container to get CoordinateConverter instance.');
};
export const validateMGA94Coordinates = (x, y) => {
  console.warn('validateMGA94Coordinates: Legacy function called. Use DI container to get CoordinateConverter instance.');
  throw new Error('Legacy function not available. Use DI container to get CoordinateConverter instance.');
};