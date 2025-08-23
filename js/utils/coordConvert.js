/**
 * @module utils/coordConvert
 * MGA94 Zone 55 (EPSG:28355) to WGS84 conversion via proj4.
 */
// Utility to convert MGA94 Zone 55 (EPSG:28355) to WGS84 (lat/lon)
// Usage: import { convertMGA94ToLatLon } from './coordConvert.js';
// proj4 must be available globally (window.proj4) or imported

/**
 * Convert Easting/Northing (meters) to [lon, lat].
 * Returns [null, null] if conversion fails or proj4 missing.
 * @param {number} x
 * @param {number} y
 * @returns {[number|null, number|null]}
 */
export function convertMGA94ToLatLon(x, y) {
  try {
    if (typeof proj4 === 'undefined') {
      throw new Error('proj4 library is not loaded. Please include proj4 via CDN or npm.');
    }
    const epsg28355 = '+proj=utm +zone=55 +south +datum=WGS84 +units=m +no_defs';
    const wgs84 = proj4.WGS84;
    return proj4(epsg28355, wgs84, [x, y]); // returns [lon, lat]
  } catch (err) {
    console.error('Coordinate conversion failed:', err);
    return [null, null];
  }
}
