/**
 * @module loaders/ambulance
 * Load Ambulance Victoria stations from GeoJSON and manage marker visibility.
 */
// ...existing code...

let ambulanceData=[];

/**
 * Returns ambulance features as a Promise for preloader batching.
 */
window.getAmbulanceFeatures = async function() {
  if (ambulanceData.length) return ambulanceData;
  try {
    const res = await fetch('ambulance.geojson');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    ambulanceData = data.features.filter(f =>
      f?.properties?.facility_state?.toLowerCase() === 'victoria' &&
      f.properties.facility_lat && f.properties.facility_long
    );
    return ambulanceData;
  } catch (err) {
    console.error('Error loading ambulance features:', err);
    return [];
  }
}

/**
 * Load the ambulance dataset and build the sidebar list.
 * Skips non‑Victorian entries and those missing coordinates.
 * @returns {Promise<void>}
 */
window.loadAmbulance = async function(){
  const category='ambulance', meta=categoryMeta[category];
  const map = getMap();
  try{
    if (isOffline()) {
      showSidebarError('You are offline. Ambulance data cannot be loaded.');
      return;
    }
    const res=await fetch('ambulance.geojson');
    if(!res.ok) throw new Error(res.status);
    const data=await res.json();
    ambulanceData = data.features.filter(f =>
      f?.properties?.facility_state?.toLowerCase()==='victoria' &&
      f.properties.facility_lat && f.properties.facility_long
    );
    ambulanceData.forEach(f=>{
      const raw=(f.properties[meta.nameProp]||'').trim();
      if(!raw) return;
      const key=raw.toLowerCase().replace(/\s+/g,'_');
      if(!featureLayers[category][key]) featureLayers[category][key]=null;
    });
    namesByCategory[category]=Object.keys(featureLayers[category]).map(k=>{
      const match=ambulanceData.find(ff=> ff.properties[meta.nameProp].trim().toLowerCase().replace(/\s+/g,'_')===k);
      return match? match.properties[meta.nameProp].trim():k;
    }).sort((a,b)=>a.localeCompare(b));
    nameToKey[category]={};
    namesByCategory[category].forEach(n=> nameToKey[category][n]=n.toLowerCase().replace(/\s+/g,'_'));
    const listEl = document.getElementById('ambulanceList');
if (!listEl) {
  console.error('ambulanceList element not found in DOM');
  return;
}
listEl.innerHTML = '';
    namesByCategory[category].forEach(fullName=>{
      const key=nameToKey[category][fullName];
      const checked=meta.defaultOn(fullName);
      // Remove 'ambulance station' at end (case-insensitive), trim, and title case for sidebar
      let displayName = fullName.replace(/\s*ambulance station\s*$/i, '').trim();
      displayName = window.toTitleCase(displayName);
      const cb=createCheckbox(`${category}_${key}`,displayName,checked,(e)=>{
        e.target.checked? showAmbulanceMarker(key): hideAmbulanceMarker(key);
        if(!e.target.checked){
          emphasised[category][key]=false;
          if(nameLabelMarkers[category][key]){
            map.removeLayer(nameLabelMarkers[category][key]);
            nameLabelMarkers[category][key]=null;
          }
        }
        updateActiveList();
      });
      listEl.appendChild(cb);
      if(checked) showAmbulanceMarker(key);
    });
    const toggleAll=document.getElementById(meta.toggleAllId);
    if(toggleAll && !toggleAll._bound){
      toggleAll._bound=true;
      toggleAll.addEventListener('change',e=>{
        const on=e.target.checked;
        beginActiveListBulk();
        namesByCategory[category].forEach(n=>{
          const key=nameToKey[category][n];
            const el=document.getElementById(`${category}_${key}`);
            let cb=null;
            if(el){
              cb = el.tagName==='INPUT'? el : el.querySelector('input[type="checkbox"]');
            }
            if(!cb) return;
            cb.checked=on;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
        endActiveListBulk();
      });
    }
    setupActiveListSync(category);
    updateActiveList();
  }catch(err){
    showSidebarError(`Failed to load ambulance data: ${err.message}`);
    // Log error for developers
    console.error(`Error loading ambulance data:`, err);
    // Graceful degradation: continue running
  }
}

function createAmbulanceIcon(){
  return L.divIcon({
    className:'ambulance-marker',
    html:`<div style="width:28px;height:28px;background:#d32f2f;border-radius:50%;
      display:flex;align-items:center;justify-content:center;border:2px solid #fff;position:relative;">
      <div style="position:absolute;left:50%;top:50%;width:16px;height:16px;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;left:4.2px;top:-1.6px;width:8px;height:20px;background:#fff;border-radius:2px;display:flex;align-items:center;justify-content:center;"></div>
        <div style="position:absolute;left:-1.6px;top:4.0px;width:20px;height:8px;background:#fff;border-radius:2px;display:flex;align-items:center;justify-content:center;"></div>
      </div>
    </div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[10,-20]
    /**
     * Ensure a marker is present and visible for the ambulance key.
     * @param {string} key - Normalised key (lowercase, underscores).
     */
  });
}

window.showAmbulanceMarker = function(key){
  const map = getMap();
  if(featureLayers.ambulance[key]){ map.addLayer(featureLayers.ambulance[key]); return; }
  const feature = ambulanceData.find(f=> f.properties.facility_name.trim().toLowerCase().replace(/\s+/g,'_')===key);
  if(!feature) return;
  const lat=+feature.properties.facility_lat;
  const lng=+feature.properties.facility_long;
  if(Number.isNaN(lat)||Number.isNaN(lng)) return;
  const marker=L.marker([lat,lng],{ icon:createAmbulanceIcon() }).addTo(map);
    /**
     * Hide marker for the given ambulance key if it exists.
     * @param {string} key
     */
  marker.bindPopup(feature.properties.facility_name);
  featureLayers.ambulance[key]=marker;
}
window.hideAmbulanceMarker = function(key){
  const map = getMap();
  const m=featureLayers.ambulance[key];
  if(m){ map.removeLayer(m); if(m.getElement()) m.getElement().classList.remove('ambulance-emph'); }
}