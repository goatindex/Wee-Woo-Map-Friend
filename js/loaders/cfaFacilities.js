/**
 * @module loaders/cfaFacilities  
 * Load CFA facility point coordinates from cfabld.json and map them to CFA polygon keys.
 */

/**
 * Normalize CFA brigade names to match polygon keys
 * @param {string} name 
 * @returns {string}
 */
function normaliseCfaKey(name){
  return (name || '').trim().toLowerCase();
}

/**
 * Load cfabld.json and build a name->coord map keyed like CFA polygons.
 */
window.loadCfaFacilities = async function(){
  try{
    const res = await fetch('cfabld.json');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    if(!data.fields || !data.records) throw new Error('Invalid cfabld.json structure');
    
    // Find field indices
    const fields = data.fields.map(f => f.id);
    const brigadeNameIdx = fields.indexOf('Brigade Name');
    const latIdx = fields.indexOf('lat');
    const lngIdx = fields.indexOf('lng');
    
    if(brigadeNameIdx === -1) throw new Error('Brigade Name field not found');
    if(latIdx === -1 || lngIdx === -1) {
      console.warn('CFA coordinates not found in cfabld.json - run add_cfa_coordinates.py first');
      return;
    }
    
    let loaded = 0;
    window.cfaFacilityCoords = {};
    
    data.records.forEach(record => {
      if(record.length <= Math.max(brigadeNameIdx, latIdx, lngIdx)) return;
      
      const brigadeName = record[brigadeNameIdx];
      const lat = record[latIdx];  
      const lng = record[lngIdx];
      
      if(!brigadeName || lat == null || lng == null) return;
      
      try {
        const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
        const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
        
        if(!isNaN(latNum) && !isNaN(lngNum)) {
          const key = normaliseCfaKey(brigadeName);
          window.cfaFacilityCoords[key] = { lat: latNum, lng: lngNum };
          loaded++;
        }
      } catch(e) {
        // Skip invalid coordinates
      }
    });
    
    console.log(`CFA facilities loaded: ${loaded} (unique keys: ${Object.keys(window.cfaFacilityCoords).length})`);
  } catch(err) {
    console.error('Failed to load cfabld.json:', err);
  }
}

/**
 * Returns CFA facility features as a Promise for preloader batching.
 */
window.getCfaFacilities = async function() {
  // This is a placeholder - CFA facilities are loaded from JSON, not GeoJSON
  // But we return empty array to maintain consistency with other loaders
  return [];
}
