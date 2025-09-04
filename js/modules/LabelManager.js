/**
 * @module LabelManager
 * Creation and management of map name labels for polygons and points.
 * Migrated from js/labels.js
 */

import { logger } from './StructuredLogger.js';

/**
 * LabelManager - Handles creation and management of map name labels
 */
export class LabelManager {
  constructor() {
    this.logger = logger.createChild({ module: 'LabelManager' });
    this.logger.info('LabelManager initialized');
  }

  /**
   * Resolve a label color for a feature based on its rendered style.
   */
  resolveLabelColor(category, isPoint, layerOrMarker, config) {
    const timer = this.logger.time('resolve-label-color');
    
    try {
      let color = '';
      
      if (!isPoint && layerOrMarker && layerOrMarker.options) {
        color = layerOrMarker.options.color || layerOrMarker.options.fillColor || '';
      } else if (isPoint && layerOrMarker && typeof layerOrMarker.getElement === 'function') {
        const el = layerOrMarker.getElement();
        if (el) {
          const target = el.querySelector('[style*="background:"] , [style*="background-color:"]');
          if (target) {
            color = target.style.backgroundColor || (typeof getComputedStyle === 'function' ? getComputedStyle(target).backgroundColor : '');
          } else if (typeof getComputedStyle === 'function') {
            color = getComputedStyle(el).backgroundColor || '';
          }
        }
      }
      
      if (!color && config.outlineColors) {
        color = config.outlineColors[category];
      }
      
      timer.end({ category, isPoint, hasColor: !!color, success: true });
      return color || '#000000';
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to resolve label color', { error: error.message, category, isPoint });
      return '#000000';
    }
  }

  /**
   * Format ambulance station names for UI labels.
   */
  formatAmbulanceName(name) {
    if (!name) return '';
    let text = name.replace(/\bstation\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    text = text.replace(/\bambulance\b/gi, 'Ambo');
    return this.toTitleCase(text);
  }

  /**
   * Format police station names for UI labels.
   */
  formatPoliceName(name) {
    if (!name) return '';
    let text = name.replace(/\spolice station\s*$/i, '').replace(/\s{2,}/g, ' ').trim();
    return this.toTitleCase(text);
  }

  /**
   * Format LGA names by removing 'Unincorporated'.
   */
  formatLgaName(name) {
    if (!name) return '';
    let text = name;
    text = text.replace(/\(\s*unincorporated\s*\)/gi, '');
    text = text.replace(/\(\s*uninc\.?\s*\)/gi, '');
    text = text.replace(/\bunincorporated\b/gi, '');
    text = text.replace(/\buninc\.?/gi, '');
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  /**
   * Convert a string to Title Case.
   */
  toTitleCase(str) {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());
  }

  /**
   * Get polygon label anchor point.
   */
  getPolygonLabelAnchor(layer) {
    const timer = this.logger.time('get-polygon-label-anchor');
    
    try {
      const bounds = layer.getBounds();
      if (bounds && bounds.isValid()) {
        timer.end({ method: 'bounds-center', success: true });
        return bounds.getCenter();
      }
      
      let latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
      latlngs = this.flattenCoordinates(latlngs);
      
      if (!latlngs.length) {
        timer.end({ method: 'fallback-empty', success: true });
        return L.latLng(0, 0);
      }
      
      if (latlngs.length > 1000) {
        const sampled = latlngs.filter((_, index) => index % 10 === 0);
        latlngs = sampled;
      }
      
      const result = this.calculateCentroid(latlngs);
      timer.end({ method: 'coordinate-analysis', pointCount: latlngs.length, success: true });
      return result;
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to get polygon label anchor', { error: error.message });
      return L.latLng(0, 0);
    }
  }

  /**
   * Flatten nested coordinate arrays.
   */
  flattenCoordinates(arr) {
    return arr.reduce((acc, v) => Array.isArray(v) ? acc.concat(this.flattenCoordinates(v)) : acc.concat(v), []);
  }

  /**
   * Calculate centroid from coordinate array.
   */
  calculateCentroid(latlngs) {
    let maxH = 0, hLat = 0, hLng = 0;
    for (let i = 0; i < latlngs.length; i++) {
      for (let j = i + 1; j < latlngs.length; j++) {
        const span = Math.abs(latlngs[i].lng - latlngs[j].lng);
        if (span > maxH) { 
          maxH = span; 
          hLat = (latlngs[i].lat + latlngs[j].lat) / 2; 
          hLng = (latlngs[i].lng + latlngs[j].lng) / 2; 
        }
      }
    }
    
    let maxV = 0, vLat = 0, vLng = 0;
    for (let i = 0; i < latlngs.length; i++) {
      for (let j = i + 1; j < latlngs.length; j++) {
        const span = Math.abs(latlngs[i].lat - latlngs[j].lat);
        if (span > maxV) { 
          maxV = span; 
          vLat = (latlngs[i].lat + latlngs[j].lat) / 2; 
          vLng = (latlngs[i].lng + latlngs[j].lng) / 2; 
        }
      }
    }
    
    return L.latLng(hLat, vLng);
  }

  /**
   * Process name for display with line breaks.
   */
  processName(name) {
    if (!name) return '';
    const words = name.split(' ');
    let l1 = '', l2 = '';
    for (const w of words) {
      if ((l1 + ' ' + w).trim().length <= 16 || !l1) l1 = (l1 + ' ' + w).trim();
      else l2 = (l2 + ' ' + w).trim();
    }
    return l2 ? `${l1}<br>${l2}` : l1;
  }

  /**
   * Adjust hex color brightness.
   */
  adjustHexColor(hex, factor) {
    if (!hex || typeof factor !== 'number') return hex;
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Ensure a single visible label exists for a category/key.
   */
  ensureLabel(category, key, displayName, isPoint, layerOrMarker, dependencies) {
    const timer = this.logger.time('ensure-label');
    
    try {
      const { map, state, config } = dependencies;
      
      if (!map) {
        throw new Error('Map instance not provided');
      }
      
      this.removeLabel(category, key, dependencies);
      
      let latlng = null;
      
      if (isPoint) {
        latlng = layerOrMarker.getLatLng();
      } else if (category === 'ses' && state.sesFacilityCoords && state.sesFacilityCoords[key]) {
        const coord = state.sesFacilityCoords[key];
        latlng = L.latLng(coord.lat, coord.lng);
      } else if (category === 'cfa' && state.cfaFacilityCoords && state.cfaFacilityCoords[key]) {
        const coord = state.cfaFacilityCoords[key];
        latlng = L.latLng(coord.lat, coord.lng);
      } else {
        latlng = this.getPolygonLabelAnchor(layerOrMarker);
      }
      
      if (!latlng) {
        timer.end({ category, key, reason: 'no-latlng', success: false });
        return;
      }
      
      let text = displayName;
      
      if (isPoint) {
        if (category === 'ambulance') text = this.formatAmbulanceName(text);
        if (category === 'police') text = this.formatPoliceName(text);
      }
      
      if (category === 'lga' && !isPoint) {
        text = this.formatLgaName(text);
      }
      
      text = this.processName(text);
      let outline = this.resolveLabelColor(category, isPoint, layerOrMarker, config);
      
      const factor = config.labelColorAdjust && config.labelColorAdjust[category] || 1.0;
      if (/^#?[0-9a-fA-F]{6}$/.test((outline || '').trim())) {
        outline = this.adjustHexColor(outline, factor);
      }
      
      const iconAnchor = isPoint ? [38, -18] : [90, 20];
      const html = isPoint
        ? `<div class="map-label" style="--label-color: ${outline}"><span style="display:block;width:100%">${text}</span></div>`
        : `<div class="map-label" style="--label-color: ${outline}">${text}</div>`;
      
      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: `map-label-wrapper ${isPoint ? 'map-label--point ambulance-name-label' : 'map-label--polygon'}`,
          html: html,
          iconAnchor: iconAnchor
        }),
        interactive: false
      }).addTo(map);
      
      if (!state.nameLabelMarkers) state.nameLabelMarkers = {};
      if (!state.nameLabelMarkers[category]) state.nameLabelMarkers[category] = {};
      state.nameLabelMarkers[category][key] = marker;
      
      timer.end({ category, key, isPoint, textLength: text.length, success: true });
      
      this.logger.info('Label created', { category, key, isPoint, text: text.substring(0, 50) });
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to ensure label', { error: error.message, category, key, isPoint });
    }
  }

  /**
   * Remove an existing label for category/key from the map.
   */
  removeLabel(category, key, dependencies) {
    const timer = this.logger.time('remove-label');
    
    try {
      const { map, state } = dependencies;
      
      if (!state.nameLabelMarkers || !state.nameLabelMarkers[category]) {
        timer.end({ category, key, reason: 'no-markers', success: true });
        return;
      }
      
      const marker = state.nameLabelMarkers[category][key];
      if (marker && map) {
        map.removeLayer(marker);
        state.nameLabelMarkers[category][key] = null;
        timer.end({ category, key, success: true });
        this.logger.debug('Label removed', { category, key });
      } else {
        timer.end({ category, key, reason: 'no-marker', success: true });
      }
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to remove label', { error: error.message, category, key });
    }
  }

  /**
   * Clean up all labels.
   */
  destroy(dependencies) {
    const timer = this.logger.time('destroy-labels');
    
    try {
      const { map, state } = dependencies;
      
      if (!state.nameLabelMarkers || !map) {
        timer.end({ reason: 'no-markers-or-map', success: true });
        return;
      }
      
      let removedCount = 0;
      
      for (const category in state.nameLabelMarkers) {
        for (const key in state.nameLabelMarkers[category]) {
          const marker = state.nameLabelMarkers[category][key];
          if (marker) {
            map.removeLayer(marker);
            removedCount++;
          }
        }
        state.nameLabelMarkers[category] = {};
      }
      
      timer.end({ removedCount, success: true });
      this.logger.info('All labels destroyed', { removedCount });
      
    } catch (error) {
      timer.end({ error: error.message, success: false });
      this.logger.error('Failed to destroy labels', { error: error.message });
    }
  }
}

// Create singleton instance
export const labelManager = new LabelManager();

// Legacy compatibility exports
export const ensureLabel = (category, key, displayName, isPoint, layerOrMarker, dependencies) => 
  labelManager.ensureLabel(category, key, displayName, isPoint, layerOrMarker, dependencies);

export const removeLabel = (category, key, dependencies) => 
  labelManager.removeLabel(category, key, dependencies);

export const formatAmbulanceName = (name) => labelManager.formatAmbulanceName(name);
export const formatPoliceName = (name) => labelManager.formatPoliceName(name);
export const formatLgaName = (name) => labelManager.formatLgaName(name);
export const getPolygonLabelAnchor = (layer) => labelManager.getPolygonLabelAnchor(layer);
