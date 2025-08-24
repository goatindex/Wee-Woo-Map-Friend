/* @ts-check */
/**
 * @module config
 * Shared styling and category metadata for map layers.
 */

/** @typedef {Object} CategoryMeta
 * @property {'polygon'|'point'} type - Feature geometry type for the category.
 * @property {string} nameProp - Property name in GeoJSON used as the display name.
 * @property {((f?: any) => import('leaflet').PathOptions)|null} styleFn - Function that returns Leaflet style options for polygons.
 * @property {() => boolean} defaultOn - Whether items in this category are checked by default in the UI.
 * @property {string} listId - DOM id for the category list container.
 * @property {string} toggleAllId - DOM id for the category group checkbox.
 */

/** @typedef {Object<string, string>} OutlineColorsMap */

export const outlineColors = { ses:'#cc7a00', lga:'black', cfa:'red', ambulance:'#d32f2f', police:'#145088' };
export const baseOpacities = { ses:0.2, lga:0.1, cfa:0.1 };
/** UI color adjustment factor per category (1 = no change). Lower darkens. */
export const labelColorAdjust = { ses: 0.85, lga: 1.0, cfa: 1.0, ambulance: 1.0, police: 1.0 };
/** Header color adjustment factor per category (1 = no change). Lower darkens. */
export const headerColorAdjust = { ses: 0.85, lga: 1.0, cfa: 0.9, ambulance: 1.0, police: 0.95 };
/**
 * Darken/lighten a #RRGGBB hex by factor (0.9 = 10% darker, 1.1 = 10% lighter).
 * Returns the original string if parsing fails.
 * @param {string} hex
 * @param {number} factor
 */
export function adjustHexColor(hex, factor){
  try{
    const m = (hex||'').trim().match(/^#?([0-9a-fA-F]{6})$/);
    if(!m) return hex;
    const n = parseInt(m[1],16);
    let r=(n>>16)&0xff, g=(n>>8)&0xff, b=n&0xff;
    r = Math.max(0, Math.min(255, Math.round(r*factor)));
    g = Math.max(0, Math.min(255, Math.round(g*factor)));
    b = Math.max(0, Math.min(255, Math.round(b*factor)));
    const toHex = (v)=> v.toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }catch{ return hex; }
}
/** @returns {import('leaflet').PathOptions} */
export function sesStyle(){ return { color:'#FF9900', weight:3, fillColor:'orange', fillOpacity:0.2 }; }
/** @returns {import('leaflet').PathOptions} */
export function lgaStyle(){ return { color:'#001A70', weight:1.5, fillColor:'#0082CA', fillOpacity:0.1, dashArray:'8 8' }; }
/** @returns {import('leaflet').PathOptions} */
export function cfaStyle(){ return { color:'red', weight:2, fillColor:'red', fillOpacity:0.1 }; }
/** @type {Record<'ses'|'lga'|'cfa'|'ambulance', CategoryMeta>} */
export const categoryMeta = {
  ses: {
    type: 'polygon',
    nameProp: 'RESPONSE_ZONE_NAME',
    styleFn: sesStyle,
    defaultOn: () => false,
    listId: 'sesList',
    toggleAllId: 'toggleAllSES'
  },
  lga: {
    type: 'polygon',
    nameProp: 'LGA_NAME',
    styleFn: lgaStyle,
    defaultOn: () => false,
    listId: 'lgaList',
    toggleAllId: 'toggleAllLGAs'
  },
  cfa: {
    type: 'polygon',
    nameProp: 'BRIG_NAME',
    styleFn: cfaStyle,
    defaultOn: () => false,
    listId: 'cfaList',
    toggleAllId: 'toggleAllCFA'
  },
  ambulance: {
    type: 'point',
    nameProp: 'facility_name',
    styleFn: null,
    defaultOn: () => false,
    listId: 'ambulanceList',
    toggleAllId: 'toggleAllAmbulance'
  },
  police: {
    type: 'point',
    nameProp: 'place_name',
    styleFn: null,
    defaultOn: () => false,
    listId: 'policeList',
    toggleAllId: 'toggleAllPolice'
  }
};

// WillyWeather API key for development only. Do NOT use in production or public repos.
// Transition to backend proxy for security in future versions.
export const WILLYWEATHER_API_KEY = "NGMwYjk3YjlhZTIxZjJhMjNmYTFkY2";