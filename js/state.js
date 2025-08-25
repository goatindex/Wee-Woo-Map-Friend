/* @ts-check */
/**
 * @module state
 * Centralised runtime state for map, feature layers, and UI selections.
 */

/** @typedef {Record<string, any>} LayerBucket */
/** @typedef {{ ses:LayerBucket, lga:LayerBucket, cfa:LayerBucket, ambulance:LayerBucket, police:LayerBucket, frv:LayerBucket }} FeatureLayersMap */
/** @typedef {{ ses:string[], lga:string[], cfa:string[], ambulance:string[], police:string[], frv:string[] }} NamesByCategoryMap */
/** @typedef {{ ses:Record<string,string>, lga:Record<string,string>, cfa:Record<string,string>, ambulance:Record<string,string>, police:Record<string,string>, frv:Record<string,string> }} NameToKeyMap */
/** @typedef {{ ses:Record<string,boolean>, lga:Record<string,boolean>, cfa:Record<string,boolean>, ambulance:Record<string,boolean>, police:Record<string,boolean>, frv:Record<string,boolean> }} EmphasisedMap */
/** @typedef {{ ses:Record<string,import('leaflet').Marker|null>, lga:Record<string,import('leaflet').Marker|null>, cfa:Record<string,import('leaflet').Marker|null>, ambulance:Record<string,import('leaflet').Marker|null>, police:Record<string,import('leaflet').Marker|null>, frv:Record<string,import('leaflet').Marker|null> }} NameLabelMarkersMap */

/** @type {FeatureLayersMap} */
window.featureLayers = { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
/** @type {NamesByCategoryMap} */
window.namesByCategory = { ses:[], lga:[], cfa:[], ambulance:[], police:[], frv:[] };
/** @type {NameToKeyMap} */
window.nameToKey = { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
/** @type {EmphasisedMap} */
window.emphasised = { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
/** @type {NameLabelMarkersMap} */
window.nameLabelMarkers = { ses:{}, lga:{}, cfa:{}, ambulance:{}, police:{}, frv:{} };
window.activeListFilter = '';

// Deferred label creation for bulk operations
/** @type {Array<{category: string, key: string, labelName: string, isPoint: boolean, layer: any}>} */
window.pendingLabels = [];
/** @type {boolean} */
window.isBulkOperation = false;

/**
 * Set the current text filter for the active list UI.
 * @param {string} v
 */
window.setActiveListFilter = function(v){ window.activeListFilter = v; };

/**
 * Begin a bulk operation - defer label creation during this time
 */
window.beginBulkOperation = function() {
  window.isBulkOperation = true;
  window.pendingLabels = [];
};

/**
 * End bulk operation and process any deferred labels
 */
window.endBulkOperation = function() {
  window.isBulkOperation = false;
  
  // Process deferred labels in batches to keep UI responsive
  if (window.pendingLabels.length > 0) {
    window.processDeferredLabels();
  }
};

/**
 * Process deferred labels in batches using requestAnimationFrame
 */
window.processDeferredLabels = async function() {
  const labels = window.pendingLabels.slice(); // Copy array
  window.pendingLabels = []; // Clear pending
  
  if (labels.length === 0) return;
  
  // Category-specific batch sizes for label creation (very conservative for complex geometries)
  const labelBatchSizes = {
    'lga': 1,   // Process LGA labels one at a time due to extreme complexity
    'cfa': 8,   // Larger batches for CFA since we use pre-calculated coordinates
    'ses': 8,   // Larger batches for SES since we use pre-calculated coordinates
    'ambulance': 10,
    'police': 10
  };
  
  // Group labels by category for optimized processing
  const labelsByCategory = {};
  labels.forEach(label => {
    if (!labelsByCategory[label.category]) {
      labelsByCategory[label.category] = [];
    }
    labelsByCategory[label.category].push(label);
  });
  
  // Process each category with its optimal batch size
  const categoryKeys = Object.keys(labelsByCategory);
  let totalBatches = 0;
  let currentBatch = 0;
  
  // Calculate total number of batches for progress tracking
  categoryKeys.forEach(category => {
    const categoryLabels = labelsByCategory[category];
    const batchSize = labelBatchSizes[category] || 10;
    totalBatches += Math.ceil(categoryLabels.length / batchSize);
  });
  
  for (let catIndex = 0; catIndex < categoryKeys.length; catIndex++) {
    const category = categoryKeys[catIndex];
    const categoryLabels = labelsByCategory[category];
    const batchSize = labelBatchSizes[category] || 10;
    
    for (let i = 0; i < categoryLabels.length; i += batchSize) {
      const batch = categoryLabels.slice(i, i + batchSize);
      currentBatch++;
      
      // Process current batch
      batch.forEach(({category, key, labelName, isPoint, layer}) => {
        if (window.featureLayers[category][key] && 
            window.featureLayers[category][key].some(l => l._map)) {
          // Only create label if the layer is still on the map
          window.ensureLabel(category, key, labelName, isPoint, layer);
        }
      });
      
      // Yield between all batches except the very last one
      // Use setTimeout for LGA to give more time for complex geometry processing
      if (currentBatch < totalBatches) {
        if (category === 'lga') {
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay for LGA
        } else {
          await new Promise(resolve => requestAnimationFrame(resolve));
        }
      }
    }
  }
};

// SES facility chevrons: coords and cached markers
/** @type {Record<string, {lat:number, lng:number}>} */
window.sesFacilityCoords = {};
/** @type {Record<string, import('leaflet').Marker|null>} */
window.sesFacilityMarkers = {};

// CFA facility coordinates for label anchoring
/** @type {Record<string, {lat:number, lng:number}>} */
window.cfaFacilityCoords = {};

/**
 * Store the Leaflet map instance.
 * @param {import('leaflet').Map} m
 */
window.setMap = function(m){ window._map = m; };
/**
 * Retrieve the initialised Leaflet map or throw if not ready.
 * @returns {import('leaflet').Map}
 */
window.getMap = function(){
  if(!window._map) throw new Error('Map not initialised yet');
  return window._map;
}