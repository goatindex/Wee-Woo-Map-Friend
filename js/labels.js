import { map } from './state.js';
import { outlineColors } from './config.js';
import { nameLabelMarkers } from './state.js';

export function getPolygonLabelAnchor(layer){
  let latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
  function flatten(a){ return a.reduce((acc,v)=>Array.isArray(v)?acc.concat(flatten(v)):acc.concat(v),[]); }
  latlngs = flatten(latlngs);
  if(!latlngs.length) return layer.getBounds().getCenter();
  let maxH=0,hLat=0,hLng=0;
  for(let i=0;i<latlngs.length;i++){
    for(let j=i+1;j<latlngs.length;j++){
      const span=Math.abs(latlngs[i].lng-latlngs[j].lng);
      if(span>maxH){ maxH=span; hLat=(latlngs[i].lat+latlngs[j].lat)/2; hLng=(latlngs[i].lng+latlngs[j].lng)/2; }
    }
  }
  let maxV=0,vLat=0,vLng=0;
  for(let i=0;i<latlngs.length;i++){
    for(let j=i+1;j<latlngs.length;j++){
      const span=Math.abs(latlngs[i].lat-latlngs[j].lat);
      if(span>maxV){ maxV=span; vLat=(latlngs[i].lat+latlngs[j].lat)/2; vLng=(latlngs[i].lng+latlngs[j].lng)/2; }
    }
  }
  return L.latLng(hLat, vLng);
}

export function ensureLabel(category,key,displayName,isPoint,layerOrMarker){
  removeLabel(category,key);
  let latlng=null;
  if(isPoint){
    latlng = layerOrMarker.getLatLng();
  } else {
    latlng = getPolygonLabelAnchor(layerOrMarker);
  }
  if(!latlng) return;
  let text = processName(displayName);
  const outline = outlineColors[category];
  const marker = L.marker(latlng,{
    icon: L.divIcon({
      className: isPoint ? 'ambulance-name-label':'name-label-marker',
      html:`<div style="
        background:#fff;border:2px solid ${outline};
        border-radius:8px;padding:4px 12px;font-weight:bold;
        color:${outline};font-size:${isPoint?'0.95em':'1.2em'};
        box-shadow:0 2px 8px rgba(0,0,0,.10);text-align:center;
        min-width:60px;max-width:180px;line-height:1.2;hyphens:manual;
      ">${text}</div>`,
      iconAnchor:[90,20]
    }),
    interactive:false
  }).addTo(map);
  nameLabelMarkers[category][key]=marker;
}

export function removeLabel(category,key){
  const m = nameLabelMarkers[category][key];
  if(m){ map.removeLayer(m); nameLabelMarkers[category][key]=null; }
}

function processName(name){
  if(name.length<=16) return name.replace(/-/g,'\u2011');
  const safe = name.replace(/-/g,'\u2011');
  const words = safe.split(' ');
  let l1='',l2='';
  for(const w of words){
    if((l1+' '+w).trim().length<=16 || !l1) l1=(l1+' '+w).trim();
    else l2=(l2+' '+w).trim();
  }
  return l2? `${l1}<br>${l2}`:l1;
}