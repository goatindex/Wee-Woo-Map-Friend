import { categoryMeta } from '../config.js';
import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers, getMap } from '../state.js';
import { createCheckbox } from '../utils.js';
import { setupActiveListSync, updateActiveList } from '../ui/activeList.js';

let ambulanceData=[];

export async function loadAmbulance(){
  const category='ambulance', meta=categoryMeta[category];
  const map = getMap();
  try{
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
    namesByCategory[category].forEach(displayName=>{
      const key=nameToKey[category][displayName];
      const checked=meta.defaultOn(displayName);
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
        namesByCategory[category].forEach(n=>{
          const key=nameToKey[category][n];
            const cb=document.getElementById(`${category}_${key}`);
            if(!cb) return;
            cb.checked=on;
            on? showAmbulanceMarker(key): hideAmbulanceMarker(key);
            if(!on) emphasised[category][key]=false;
        });
        updateActiveList();
      });
    }
    setupActiveListSync(category);
    updateActiveList();
  }catch(err){
    console.error('ambulance load',err);
    alert('Failed to load ambulance');
  }
}

function createAmbulanceIcon(){
  return L.divIcon({
    className:'ambulance-marker',
    html:`<div style="width:28px;height:28px;background:#d32f2f;border-radius:50%;
      display:flex;align-items:center;justify-content:center;border:2px solid #fff;position:relative;">
      <div style="position:absolute;left:50%;top:50%;width:16px;height:16px;transform:translate(-50%,-50%);">
        <div style="position:absolute;left:7px;top:2px;width:6px;height:12px;background:#fff;border-radius:2px;"></div>
        <div style="position:absolute;left:2px;top:7px;width:12px;height:6px;background:#fff;border-radius:2px;"></div>
      </div>
    </div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-14]
  });
}

export function showAmbulanceMarker(key){
  const map = getMap();
  if(featureLayers.ambulance[key]){ map.addLayer(featureLayers.ambulance[key]); return; }
  const feature = ambulanceData.find(f=> f.properties.facility_name.trim().toLowerCase().replace(/\s+/g,'_')===key);
  if(!feature) return;
  const lat=+feature.properties.facility_lat;
  const lng=+feature.properties.facility_long;
  if(Number.isNaN(lat)||Number.isNaN(lng)) return;
  const marker=L.marker([lat,lng],{ icon:createAmbulanceIcon() }).addTo(map);
  marker.bindPopup(feature.properties.facility_name);
  featureLayers.ambulance[key]=marker;
}
export function hideAmbulanceMarker(key){
  const map = getMap();
  const m=featureLayers.ambulance[key];
  if(m){ map.removeLayer(m); if(m.getElement()) m.getElement().classList.remove('ambulance-emph'); }
}