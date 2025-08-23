/* @ts-check */
/**
 * @module state
 * Centralised runtime state for map, feature layers, and UI selections.
 */

/** @typedef {Record<string, any>} LayerBucket */
/** @typedef {{ ses:LayerBucket, lga:LayerBucket, cfa:LayerBucket, ambulance:LayerBucket }} FeatureLayersMap */
/** @typedef {{ ses:string[], lga:string[], cfa:string[], ambulance:string[] }} NamesByCategoryMap */
/** @typedef {{ ses:Record<string,string>, lga:Record<string,string>, cfa:Record<string,string>, ambulance:Record<string,string> }} NameToKeyMap */
/** @typedef {{ ses:Record<string,boolean>, lga:Record<string,boolean>, cfa:Record<string,boolean>, ambulance:Record<string,boolean> }} EmphasisedMap */
/** @typedef {{ ses:Record<string,import('leaflet').Marker|null>, lga:Record<string,import('leaflet').Marker|null>, cfa:Record<string,import('leaflet').Marker|null>, ambulance:Record<string,import('leaflet').Marker|null> }} NameLabelMarkersMap */

/** @type {FeatureLayersMap} */
export const featureLayers = { ses:{}, lga:{}, cfa:{}, ambulance:{} };
/** @type {NamesByCategoryMap} */
export const namesByCategory = { ses:[], lga:[], cfa:[], ambulance:[] };
/** @type {NameToKeyMap} */
export const nameToKey = { ses:{}, lga:{}, cfa:{}, ambulance:{} };
/** @type {EmphasisedMap} */
export const emphasised = { ses:{}, lga:{}, cfa:{}, ambulance:{} };
/** @type {NameLabelMarkersMap} */
export const nameLabelMarkers = { ses:{}, lga:{}, cfa:{}, ambulance:{} };
export let activeListFilter = '';
/**
 * Set the current text filter for the active list UI.
 * @param {string} v
 */
export function setActiveListFilter(v){ activeListFilter = v; }

export let map = null;
/**
 * Store the Leaflet map instance.
 * @param {import('leaflet').Map} m
 */
export function setMap(m){ map = m; }
/**
 * Retrieve the initialised Leaflet map or throw if not ready.
 * @returns {import('leaflet').Map}
 */
export function getMap(){
  if(!map) throw new Error('Map not initialised yet');
  return map;
}