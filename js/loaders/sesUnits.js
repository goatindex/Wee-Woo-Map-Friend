/**
 * @module loaders/sesUnits
 * Render non-interactive SES unit name labels from ses.geojson.
 */
// ...existing code...

/**
 * Loads SES unit markers from ses.geojson and adds them to the map.
 * Handles errors and offline state with user feedback.
 * @async
 * @returns {Promise<void>}
 */
window.loadSesUnits = async function(){
  const map = window.getMap();
  // Check offline status before attempting fetch
  if (isOffline()) {
    showSidebarError('You are offline. SES units data cannot be loaded.');
    return;
  }
  try{
    const res=await fetch('ses.geojson');
    if(!res.ok) return;
    const data=await res.json();
    if(!data?.features) return;
    // Iterate over SES unit features and add markers
    data.features.forEach(f=>{
      const p=f.properties;
      if(!p) return;
      const unitName=p.SES_UNIT_NAME;
      const x=p.X_CORD, y=p.Y_CORD;
      if(unitName && x && y){
        const icon=L.divIcon({
          className:'ses-unit-marker',
          html:`<div class="ses-unit-label">${window.toTitleCase(unitName)}</div>`,
          iconAnchor:[60,44]
        });
        L.marker([y,x], { icon, interactive:false }).addTo(map);
      }
    });
  }catch(e){
  window.showSidebarError(`Failed to load SES units: ${e.message}`);
    console.error('Error loading SES units:', e);
  }
}

// ...existing code...