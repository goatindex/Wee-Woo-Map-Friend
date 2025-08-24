/**
 * @module loaders/police
 * Load Victoria Police stations from GeoJSON and manage marker visibility.
 */
import { categoryMeta } from '../config.js';
import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers, getMap } from '../state.js';
import { createCheckbox, toTitleCase } from '../utils.js';
import { setupActiveListSync, updateActiveList, beginActiveListBulk, endActiveListBulk } from '../ui/activeList.js';
import { showSidebarError, isOffline } from '../utils/errorUI.js';

let policeData = [];

/**
 * Load the police stations dataset and build the sidebar list.
 * Keeps only Point features with usable coordinates.
 */
export async function loadPolice(){
  const category='police', meta=categoryMeta[category];
  const map = getMap();
  try{
    if (isOffline()) {
      showSidebarError('You are offline. Police data cannot be loaded.');
      return;
    }
    const res = await fetch('police.geojson');
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    policeData = (data.features||[]).filter(f => {
      if (!f || !f.geometry || f.geometry.type !== 'Point') return false;
      if (!f.properties || (f.properties.feature||'').toUpperCase() !== 'POLICE STATION') return false;
      const coords = f.geometry.coordinates;
      return Array.isArray(coords) && coords.length >= 2 && Number.isFinite(+coords[0]) && Number.isFinite(+coords[1]);
    });
    // Index by normalised key derived from nameProp
    policeData.forEach(f=>{
      const raw=(f.properties?.[meta.nameProp]||'').trim();
      if(!raw) return;
      const key=raw.toLowerCase().replace(/\s+/g,'_');
      if(!featureLayers[category][key]) featureLayers[category][key]=null;
    });
    namesByCategory[category]=Object.keys(featureLayers[category]).map(k=>{
      const match=policeData.find(ff=> (ff.properties?.[meta.nameProp]||'').trim().toLowerCase().replace(/\s+/g,'_')===k);
      return match? (match.properties?.[meta.nameProp]||'').trim():k;
    }).sort((a,b)=>a.localeCompare(b));
    nameToKey[category] = {};
    namesByCategory[category].forEach(n=> nameToKey[category][n]=n.toLowerCase().replace(/\s+/g,'_'));

    const listEl = document.getElementById(meta.listId);
    if (!listEl) { console.error('policeList element not found in DOM'); return; }
    listEl.innerHTML = '';
    namesByCategory[category].forEach(fullName => {
      const key = nameToKey[category][fullName];
      const checked = meta.defaultOn(fullName);
  // Remove 'Police Station' at end (case-insensitive), trim, and title case for sidebar
  let displayName = fullName.replace(/\s*police station\s*$/i, '').trim();
  displayName = toTitleCase(displayName);
      const cb = createCheckbox(`${category}_${key}`, displayName, checked, (e) => {
        e.target.checked? showPoliceMarker(key): hidePoliceMarker(key);
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
      if(checked) showPoliceMarker(key);
    });

    const toggleAll = document.getElementById(meta.toggleAllId);
    if (toggleAll && !toggleAll._bound){
      toggleAll._bound = true;
      toggleAll.addEventListener('change', e => {
        const on = e.target.checked;
        beginActiveListBulk();
        namesByCategory[category].forEach(n => {
          const key = nameToKey[category][n];
          const el = document.getElementById(`${category}_${key}`);
          let cb = null;
          if (el) cb = el.tagName==='INPUT'? el : el.querySelector('input[type="checkbox"]');
          if (!cb) return;
          cb.checked = on;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
        endActiveListBulk();
      });
    }

    setupActiveListSync(category);
    updateActiveList();
  }catch(err){
    showSidebarError(`Failed to load police data: ${err.message}`);
    console.error('Error loading police data:', err);
  }
}

function createPoliceIcon(){
  return L.divIcon({
    className:'police-marker',
    html:`<div style="width:28px;height:28px;background:#145088;border-radius:50%;
      display:flex;align-items:center;justify-content:center;border:2px solid #fff;position:relative;overflow:hidden;">
      <div style="position:absolute;left:-8px;right:-8px;top:50%;height:12px;transform:translateY(-50%);
        background:
          linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff) 0 0/12px 12px,
          linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff) 6px 6px/12px 12px;">
      </div>
    </div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[10,-20]
  });
}

export function showPoliceMarker(key){
  const map = getMap();
  if(featureLayers.police[key]){ map.addLayer(featureLayers.police[key]); return; }
  const feature = policeData.find(f=> (f.properties?.place_name||'').trim().toLowerCase().replace(/\s+/g,'_')===key);
  if(!feature) return;
  const coords = feature.geometry.coordinates;
  const lat = +coords[1], lng = +coords[0];
  if(Number.isNaN(lat)||Number.isNaN(lng)) return;
  const marker=L.marker([lat,lng],{ icon:createPoliceIcon() }).addTo(map);
  const popupName = (feature.properties.place_name||'Police Station');
  marker.bindPopup(toTitleCase(popupName.toLowerCase()));
  featureLayers.police[key]=marker;
}

export function hidePoliceMarker(key){
  const map = getMap();
  const m=featureLayers.police[key];
  if(m){ map.removeLayer(m); if(m.getElement()) m.getElement().classList.remove('police-emph'); }
}
