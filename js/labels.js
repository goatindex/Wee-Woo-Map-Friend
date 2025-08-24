/**
 * @module labels
 * Creation and management of map name labels for polygons and points.
 */
import { getMap } from './state.js';
import { outlineColors, labelColorAdjust, adjustHexColor } from './config.js';
import { nameLabelMarkers } from './state.js';
import { toTitleCase } from './utils.js';

/**
 * Resolve a label color for a feature based on its rendered style.
 * - Polygons: prefer layer options (stroke color, then fillColor).
 * - Points (divIcon markers): inspect the marker DOM for a background color.
 * Falls back to category outline color.
 * @param {'ses'|'lga'|'cfa'|'ambulance'|'police'} category
 * @param {boolean} isPoint
 * @param {any} layerOrMarker
 * @returns {string}
 */
function resolveLabelColor(category, isPoint, layerOrMarker){
  let color = '';
  try {
    if (!isPoint && layerOrMarker && layerOrMarker.options) {
      color = layerOrMarker.options.color || layerOrMarker.options.fillColor || '';
    } else if (isPoint && layerOrMarker && typeof layerOrMarker.getElement === 'function') {
      const el = layerOrMarker.getElement();
      if (el) {
        // Look for an inner node with an explicit background color (handles custom divIcon markup)
        const target = el.querySelector('[style*="background:"] , [style*="background-color:"]');
        if (target) {
          color = target.style.backgroundColor || (typeof getComputedStyle === 'function' ? getComputedStyle(target).backgroundColor : '');
        } else if (typeof getComputedStyle === 'function') {
          color = getComputedStyle(el).backgroundColor || '';
        }
      }
    }
  } catch {}
  if (!color) color = outlineColors[category];
  return color;
}

/**
 * Condense and title-case ambulance station names for UI labels.
 * @param {string} name
 * @returns {string}
 */
export function formatAmbulanceName(name) {
  let text = name.replace(/\bstation\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/\bambulance\b/gi, 'Ambo');
  return toTitleCase(text);
}

/**
 * Condense and title-case police station names for UI labels.
 * @param {string} name
 * @returns {string}
 */
export function formatPoliceName(name) {
  let text = (name || '')
    .replace(/\spolice station\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return toTitleCase(text);
}

/**
 * Remove the word 'Unincorporated' from LGA names for map labels.
 * Handles variants like "(Unincorporated)" and standalone word, trims extra spaces.
 * @param {string} name
 * @returns {string}
 */
export function formatLgaName(name){
  let text = (name || '');
  // Remove parenthesised form first, e.g., "(Unincorporated)"
  text = text.replace(/\(\s*unincorporated\s*\)/gi, '');
  // Also remove shorthand parenthesised form, e.g., "(Uninc)" or "(Uninc.)"
  text = text.replace(/\(\s*uninc\.?\s*\)/gi, '');
  // Remove standalone word if present
  text = text.replace(/\bunincorporated\b/gi, '');
  // Remove shorthand standalone word if present
  text = text.replace(/\buninc\.?\b/gi, '');
  // Collapse multiple spaces and trim
  return text.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Compute an anchor within a polygon by approximating center along max span axes.
 * @param {import('leaflet').Polygon|import('leaflet').Polyline} layer
 * @returns {import('leaflet').LatLng}
 */
export function getPolygonLabelAnchor(layer){
  let latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
  function flatten(a){ return a.reduce((acc,v)=>Array.isArray(v)?acc.concat(flatten(v)):acc.concat(v),[]); }
  latlngs = flatten(latlngs);
  if(!latlngs.length) return layer.getBounds().getCenter();
  let maxH=0,hLat=0,hLng=0;
  for(let i=0;i<latlngs.length;i++){
    for(let j=i+1;j<latlngs.length;j++){
      const span=Math.abs(latlngs[i].lng-latlngs[j].lng);
      if(span>maxH){ maxH=span; hLat=(latlngs[i].lat+latlngs[j].lat)/2; hLng=(latlngs[i].lng+latlngs[j].lng)/2; }
    }
  }
  let maxV=0,vLat=0,vLng=0;
  for(let i=0;i<latlngs.length;i++){
    for(let j=i+1;j<latlngs.length;j++){
      const span=Math.abs(latlngs[i].lat-latlngs[j].lat);
      if(span>maxV){ maxV=span; vLat=(latlngs[i].lat+latlngs[j].lat)/2; vLng=(latlngs[i].lng+latlngs[j].lng)/2; }
    }
  }
  return L.latLng(hLat, vLng);
}

/**
 * Ensure a single visible label exists for a category/key at the given layer/marker.
 * Replaces any existing label for that key.
 * @param {'ses'|'lga'|'cfa'|'ambulance'|'police'} category
 * @param {string} key
 * @param {string} displayName
 * @param {boolean} isPoint
 * @param {import('leaflet').Marker|import('leaflet').Polygon|import('leaflet').Polyline} layerOrMarker
 */
export function ensureLabel(category,key,displayName,isPoint,layerOrMarker){
  const map = getMap();
  removeLabel(category,key);
  let latlng=null;
  if(isPoint){
    latlng = layerOrMarker.getLatLng();
  } else {
    latlng = getPolygonLabelAnchor(layerOrMarker);
  }
  if(!latlng) return;
  let text = displayName;
  // For ambulance/police station map labels, tidy names
  if (isPoint) {
    if (category === 'ambulance') text = formatAmbulanceName(text);
    if (category === 'police') text = formatPoliceName(text);
  }
  // For LGA polygon labels, remove 'Unincorporated' markers from the name
  if (category === 'lga' && !isPoint) {
    text = formatLgaName(text);
  }
  text = processName(text);
  let outline = resolveLabelColor(category, isPoint, layerOrMarker);
  const factor = labelColorAdjust[category] ?? 1.0;
  // Only adjust if it's a hex color (#RRGGBB); leave computed rgb()/named colors as-is
  if (/^#?[0-9a-fA-F]{6}$/.test((outline||'').trim())) {
    outline = adjustHexColor(outline, factor);
  }
  // For ambulance stations, offset label 10px below marker, centered
  const iconAnchor = isPoint ? [38, -18] : [90, 20];
  const html = isPoint
    ? `<div class="map-label" style="--label-color: ${outline}"><span style="display:block;width:100%">${text}</span></div>`
    : `<div class="map-label" style="--label-color: ${outline}">${text}</div>`;
  const marker = L.marker(latlng,{
    icon: L.divIcon({
      className: `map-label-wrapper ${isPoint ? 'map-label--point ambulance-name-label' : 'map-label--polygon'}`,
      html: html,
      iconAnchor: iconAnchor
    }),
    interactive:false
  }).addTo(map);
  // Removed 10px visual offset for ambulance station labels
  nameLabelMarkers[category][key]=marker;
}

/**
 * Remove an existing label for category/key from the map if present.
 * @param {'ses'|'lga'|'cfa'|'ambulance'} category
 * @param {string} key
 */
export function removeLabel(category,key){
  const map = getMap();
  const m = nameLabelMarkers[category][key];
  if(m){ map.removeLayer(m); nameLabelMarkers[category][key]=null; }
}

function processName(name){
  // Only break at spaces, never at hyphens or in the middle of words
  const words = name.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if ((l1 + ' ' + w).trim().length <= 16 || !l1) l1 = (l1 + ' ' + w).trim();
    else l2 = (l2 + ' ' + w).trim();
  }
  // Do not force break in the middle of a word
  return l2 ? `${l1}<br>${l2}` : l1;
}