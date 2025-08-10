import { categoryMeta } from '../config.js';
import { featureLayers, namesByCategory, nameToKey } from '../state.js';
import { setupActiveListSync, updateActiveList } from '../ui/activeList.js';
import { toTitleCase, createCheckbox } from '../utils.js';
import { emphasised, nameLabelMarkers } from '../state.js';

export async function loadPolygonCategory(category,url){
  const meta=categoryMeta[category];
  try {
    const res=await fetch(url);
    if(!res.ok) throw new Error(res.status);
    const data=await res.json();
    if(!data || !Array.isArray(data.features)) throw new Error('bad geojson');
    data.features.forEach(f=>{
      if(!f?.properties) return;
      let raw=f.properties[meta.nameProp];
      if(typeof raw!=='string') return;
      raw=raw.trim(); if(!raw) return;
      const key=raw.toLowerCase();
      if(!featureLayers[category][key]) featureLayers[category][key]=[];
    });
    const layerGroup = L.geoJSON(data,{
      style:meta.styleFn,
      onEachFeature:(feature,layer)=>{
        if(!feature.properties) return;
        let raw=feature.properties[meta.nameProp];
        if(typeof raw!=='string') raw='Unnamed';
        raw=raw.trim();
        const key=raw.toLowerCase();
        if(!featureLayers[category][key]) featureLayers[category][key]=[];
        featureLayers[category][key].push(layer);
        layer.bindPopup(toTitleCase(raw));
      }
    }).addTo(window.L?.mapInstance || window.map);
    if(category==='ses'){
      // fit once
      layerGroup && layerGroup.getBounds && window.map.fitBounds(layerGroup.getBounds());
    }
    namesByCategory[category]=Object.keys(featureLayers[category])
      .map(k=>toTitleCase(k)).sort((a,b)=>a.localeCompare(b));
    nameToKey[category]={};
    Object.keys(featureLayers[category]).forEach(k=>{
      nameToKey[category][toTitleCase(k)]=k;
    });
    const listEl=document.getElementById(meta.listId);
    listEl.innerHTML='';
    namesByCategory[category].forEach(dName=>{
      const key=nameToKey[category][dName];
      const checked=!!meta.defaultOn(dName);
      const cb=createCheckbox(`${category}_${key}`, dName, checked, (e)=>{
        const on=e.target.checked;
        featureLayers[category][key].forEach(l=> on? l.addTo(map) : map.removeLayer(l));
        if(!on){
          emphasised[category][key]=false;
          if(nameLabelMarkers[category][key]){
            map.removeLayer(nameLabelMarkers[category][key]);
            nameLabelMarkers[category][key]=null;
          }
        }
        updateActiveList();
      });
      listEl.appendChild(cb);
      featureLayers[category][key].forEach(l=> checked? l.addTo(map):map.removeLayer(l));
    });
    const toggleAll=document.getElementById(meta.toggleAllId);
    if(toggleAll && !toggleAll._bound){
      toggleAll._bound=true;
      toggleAll.addEventListener('change',e=>{
        const on=e.target.checked;
        namesByCategory[category].forEach(n=>{
          const key=nameToKey[category][n];
          const rowCb=document.getElementById(`${category}_${key}`);
          if(rowCb){
            rowCb.checked=on;
            featureLayers[category][key].forEach(l=> on? l.addTo(map):map.removeLayer(l));
            if(!on){
              emphasised[category][key]=false;
            }
          }
        });
        updateActiveList();
      });
    }
    setupActiveListSync(category);
    updateActiveList();
  } catch(err){
    console.error('loadPolygonCategory',category,err);
    alert('Failed to load '+category);
  }
}