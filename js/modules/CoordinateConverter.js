/**
 * @module modules/CoordinateConverter
 * Modern ES6-based coordinate conversion utilities
 * Replaces legacy coordinate conversion functions with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class CoordinateConverter
 * Handles coordinate system conversions and transformations
 */
export class CoordinateConverter {
  constructor() {
    this.initialized = false;
    this.proj4 = null;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.convertMGA94ToLatLon = this.convertMGA94ToLatLon.bind(this);
    this.convertLatLonToMGA94 = this.convertLatLonToMGA94.bind(this);
    this.isValidMGA94 = this.isValidMGA94.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('🗺️ CoordinateConverter: Coordinate conversion system initialized');
  }
  
  /**
   * Initialize the coordinate converter
   */
  async init() {
    if (this.initialized) {
      console.warn('CoordinateConverter: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 CoordinateConverter: Starting coordinate converter initialization...');
      
      // Wait for proj4 library to be available
      await this.waitForProj4();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ CoordinateConverter: Coordinate conversion system ready');
      
    } catch (error) {
      console.error('🚨 CoordinateConverter: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Wait for proj4 library to be available
   */
  async waitForProj4() {
    if (typeof window.proj4 !== 'undefined') {
      this.proj4 = window.proj4;
      console.log('✅ CoordinateConverter: Proj4 library already available');
      return;
    }
    
    console.log('⏳ CoordinateConverter: Waiting for proj4 library...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for proj4 library'));
      }, 10000); // 10 second timeout
      
      const checkProj4 = () => {
        if (typeof window.proj4 !== 'undefined') {
          clearTimeout(timeout);
          this.proj4 = window.proj4;
          console.log('✅ CoordinateConverter: Proj4 library loaded');
          resolve();
        } else {
          setTimeout(checkProj4, 100);
        }
      };
      
      checkProj4();
    });
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for coordinate conversion requests
    globalEventBus.on('coordinate:convert', ({ from, to, coordinates }) => {
      try {
        let result;
        if (from === 'MGA94' && to === 'WGS84') {
          result = this.convertMGA94ToLatLon(coordinates.x, coordinates.y);
        } else if (from === 'WGS84' && to === 'MGA94') {
          result = this.convertLatLonToMGA94(coordinates.lat, coordinates.lng);
        }
        
        if (result) {
          globalEventBus.emit('coordinate:converted', { from, to, input: coordinates, output: result });
        }
      } catch (error) {
        globalEventBus.emit('coordinate:error', { error, from, to, coordinates });
      }
    });
    
    console.log('✅ CoordinateConverter: Event listeners configured');
  }
  
  /**
   * Convert MGA94 Zone 55 coordinates to WGS84 (lat/lng)
   * @param {number} x - MGA94 easting coordinate
   * @param {number} y - MGA94 northing coordinate
   * @returns {Object} - {lat: number, lng: number} or null if conversion fails
   */
  convertMGA94ToLatLon(x, y) {
    try {
      if (!this.proj4) {
        throw new Error('Proj4 library is not available');
      }
      
      if (!this.isValidMGA94(x, y)) {
        throw new Error(`Invalid MGA94 coordinates: x=${x}, y=${y}`);
      }
      
      // MGA94 Zone 55 (EPSG:28355) to WGS84 conversion
      const epsg28355 = '+proj=utm +zone=55 +south +datum=WGS84 +units=m +no_defs';
      const wgs84 = this.proj4.WGS84;
      
      const [lng, lat] = this.proj4(epsg28355, wgs84, [x, y]);
      
      // Validate output coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Conversion produced invalid coordinates');
      }
      
      const result = { lat, lng };
      
      // Emit conversion event
      globalEventBus.emit('coordinate:converted', {
        from: 'MGA94',
        to: 'WGS84',
        input: { x, y },
        output: result
      });
      
      console.log(`✅ CoordinateConverter: MGA94 (${x}, ${y}) → WGS84 (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
      
      return result;
      
    } catch (error) {
      console.error('🚨 CoordinateConverter: MGA94 to WGS84 conversion failed:', error);
      
      // Emit error event
      globalEventBus.emit('coordinate:error', {
        error: error.message,
        from: 'MGA94',
        to: 'WGS84',
        coordinates: { x, y }
      });
      
      return null;
    }
  }
  
  /**
   * Convert WGS84 (lat/lng) coordinates to MGA94 Zone 55
   * @param {number} lat - Latitude in decimal degrees
   * @param {number} lng - Longitude in decimal degrees
   * @returns {Object} - {x: number, y: number} or null if conversion fails
   */
  convertLatLonToMGA94(lat, lng) {
    try {
      if (!this.proj4) {
        throw new Error('Proj4 library is not available');
      }
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error(`Invalid WGS84 coordinates: lat=${lat}, lng=${lng}`);
      }
      
      // WGS84 to MGA94 Zone 55 (EPSG:28355) conversion
      const wgs84 = this.proj4.WGS84;
      const epsg28355 = '+proj=utm +zone=55 +south +datum=WGS84 +units=m +no_defs';
      
      const [x, y] = this.proj4(wgs84, epsg28355, [lng, lat]);
      
      // Validate output coordinates
      if (isNaN(x) || isNaN(y)) {
        throw new Error('Conversion produced invalid coordinates');
      }
      
      const result = { x, y };
      
      // Emit conversion event
      globalEventBus.emit('coordinate:converted', {
        from: 'WGS84',
        to: 'MGA94',
        input: { lat, lng },
        output: result
      });
      
      console.log(`✅ CoordinateConverter: WGS84 (${lat.toFixed(6)}, ${lng.toFixed(6)}) → MGA94 (${x.toFixed(0)}, ${y.toFixed(0)})`);
      
      return result;
      
    } catch (error) {
      console.error('🚨 CoordinateConverter: WGS84 to MGA94 conversion failed:', error);
      
      // Emit error event
      globalEventBus.emit('coordinate:error', {
        error: error.message,
        from: 'WGS84',
        to: 'MGA94',
        coordinates: { lat, lng }
      });
      
      return null;
    }
  }
  
  /**
   * Validate MGA94 coordinates
   * @param {number} x - Easting coordinate
   * @param {number} y - Northing coordinate
   * @returns {boolean} - True if coordinates are valid
   */
  isValidMGA94(x, y) {
    // MGA94 Zone 55 covers Victoria, Australia
    // Approximate bounds: 200,000 to 800,000 easting, 5,000,000 to 6,000,000 northing
    return !isNaN(x) && !isNaN(y) && 
           x >= 200000 && x <= 800000 && 
           y >= 5000000 && y <= 6000000;
  }
  
  /**
   * Get coordinate converter status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      proj4Available: !!this.proj4,
      supportedConversions: ['MGA94 ↔ WGS84'],
      lastConversion: this.lastConversion || null
    };
  }
}

// Export singleton instance
export const coordinateConverter = new CoordinateConverter();

// Export for global access and legacy compatibility
if (typeof window !== 'undefined') {
  window.coordinateConverter = coordinateConverter;
  window.convertMGA94ToLatLon = (x, y) => coordinateConverter.convertMGA94ToLatLon(x, y);
  window.convertLatLonToMGA94 = (lat, lng) => coordinateConverter.convertLatLonToMGA94(lat, lng);
}
