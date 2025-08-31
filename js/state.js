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
 * Unified Bulk Operation Manager
 * Consolidates bulk operations across the entire application
 */
window.BulkOperationManager = {
  // State tracking
  _isActive: false,
  _activeListPending: false,
  _pendingLabels: [],
  _pendingActiveListUpdate: false,
  
  // Operation metadata
  _currentOperation: null,
  _startTime: null,
  _itemCount: 0,
  
  /**
   * Begin a bulk operation
   * @param {string} operationType - Type of operation (e.g., 'toggleAll', 'import', 'reset')
   * @param {number} itemCount - Number of items to be processed
   */
  begin: function(operationType, itemCount = 0) {
    if (this._isActive) {
      console.warn('⚠️ Bulk operation already active, nested calls not supported');
      return false;
    }
    
    this._isActive = true;
    this._activeListPending = false;
    this._pendingLabels = [];
    this._pendingActiveListUpdate = false;
    this._currentOperation = operationType;
    this._startTime = Date.now();
    this._itemCount = itemCount;
    
    // Set legacy flags for backward compatibility
    window.isBulkOperation = true;
    
    console.log(`🚀 Bulk operation started: ${operationType} (${itemCount} items)`);
    return true;
  },
  
  /**
   * End a bulk operation and process deferred items
   */
  end: function() {
    if (!this._isActive) {
      console.warn('⚠️ No bulk operation active to end');
      return;
    }
    
    const duration = Date.now() - this._startTime;
    console.log(`✅ Bulk operation completed: ${this._currentOperation} in ${duration}ms`);
    
    // Process deferred labels first
    if (this._pendingLabels.length > 0) {
      console.log(`📝 Processing ${this._pendingLabels.length} deferred labels`);
      this._processDeferredLabels();
    }
    
    // Process active list update if pending
    if (this._pendingActiveListUpdate) {
      console.log(`🔄 Processing pending active list update`);
      this._processActiveListUpdate();
    }
    
    // Clear state
    this._isActive = false;
    this._activeListPending = false;
    this._pendingLabels = [];
    this._pendingActiveListUpdate = false;
    this._currentOperation = null;
    this._startTime = null;
    this._itemCount = 0;
    
    // Clear legacy flags
    window.isBulkOperation = false;
  },
  
  /**
   * Check if a bulk operation is currently active
   */
  isActive: function() {
    return this._isActive;
  },
  
  /**
   * Add a pending label for deferred creation
   * @param {Object} labelData - Label data object
   */
  addPendingLabel: function(labelData) {
    if (!this._isActive) {
      console.warn('⚠️ Cannot add pending label outside of bulk operation');
      return;
    }
    this._pendingLabels.push(labelData);
  },
  
  /**
   * Mark active list update as pending
   */
  markActiveListUpdatePending: function() {
    if (!this._isActive) {
      console.warn('⚠️ Cannot mark active list update pending outside of bulk operation');
      return;
    }
    this._pendingActiveListUpdate = true;
  },
  
  /**
   * Process deferred labels in optimized batches
   */
  _processDeferredLabels: async function() {
    const labels = this._pendingLabels.slice(); // Copy array
    this._pendingLabels = []; // Clear pending
    
    if (labels.length === 0) return;
    
    // Category-specific batch sizes for label creation
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
    
    console.log(`📦 Processing ${labels.length} labels in ${totalBatches} batches`);
    
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
        if (currentBatch < totalBatches) {
          if (category === 'lga') {
            await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay for LGA
          } else {
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }
      }
    }
    
    console.log(`✅ All deferred labels processed`);
  },
  
  /**
   * Process pending active list update
   */
  _processActiveListUpdate: function() {
    if (window.updateActiveList) {
      console.log(`🔄 Calling updateActiveList after bulk operation`);
      window.updateActiveList();
    } else {
      console.warn(`⚠️ updateActiveList function not found`);
    }
  },
  
  /**
   * Get current operation status
   */
  getStatus: function() {
    return {
      isActive: this._isActive,
      operationType: this._currentOperation,
      itemCount: this._itemCount,
      duration: this._startTime ? Date.now() - this._startTime : 0,
      pendingLabels: this._pendingLabels.length,
      pendingActiveListUpdate: this._pendingActiveListUpdate
    };
  }
};

// Legacy compatibility functions
window.beginBulkOperation = function() {
  return window.BulkOperationManager.begin('legacy');
};

window.endBulkOperation = function() {
  window.BulkOperationManager.end();
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