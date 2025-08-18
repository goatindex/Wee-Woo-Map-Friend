import { getMap } from './state.js';
import { outlineColors } from './config.js';
import { nameLabelMarkers } from './state.js';
import { toTitleCase } from './utils.js';

export function formatAmbulanceName(name) {
  let text = name.replace(/\bstation\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/\bambulance\b/gi, 'Ambo');
  return toTitleCase(text);
}

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
  const map = getMap();
  removeLabel(category,key);
  let latlng=null;
  if(isPoint){
    latlng = layerOrMarker.getLatLng();
  } else {
    latlng = getPolygonLabelAnchor(layerOrMarker);
  }
  if(!latlng) return;
  let text = displayName;
  // For ambulance station map labels, remove the word 'station' (case-insensitive, as a word)
  if (category === 'ambulance' && isPoint) {
    text = formatAmbulanceName(text);
  }
  text = processName(text);
  const outline = outlineColors[category];
  // For ambulance stations, offset label 10px below marker, centered
  const iconAnchor = isPoint ? [45, -10] : [90, 20];
  let html;
  if(isPoint) {
    html = `<div style="
      background:#fff;border:2px solid ${outline};
      border-radius:8px;padding:4px 12px;font-weight:bold;
      color:${outline};font-size:1.2em;
      box-shadow:0 2px 8px rgba(0,0,0,.10);text-align:center;
      min-width:60px;max-width:480px;line-height:1.2;hyphens:manual;
      display:inline-block;overflow-wrap:break-word;white-space:normal;">
      <span style="display:block;width:100%;">${text}</span>
    </div>`;
  } else {
    html = `<div style="
      background:#fff;border:2px solid ${outline};
      border-radius:8px;padding:4px 12px;font-weight:bold;
      color:${outline};font-size:1.2em;
      box-shadow:0 2px 8px rgba(0,0,0,.10);text-align:center;
      min-width:60px;max-width:480px;line-height:1.2;hyphens:manual;">
      ${text}</div>`;
  }
  const marker = L.marker(latlng,{
    icon: L.divIcon({
      className: isPoint ? 'ambulance-name-label':'name-label-marker',
      html: html,
      iconAnchor: iconAnchor
    }),
    interactive:false
  }).addTo(map);
  // Removed 10px visual offset for ambulance station labels
  nameLabelMarkers[category][key]=marker;
}

export function removeLabel(category,key){
  const map = getMap();
  const m = nameLabelMarkers[category][key];
  if(m){ map.removeLayer(m); nameLabelMarkers[category][key]=null; }
}

function processName(name){
  // Only break at spaces, never at hyphens or in the middle of words
  const words = name.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if ((l1 + ' ' + w).trim().length <= 16 || !l1) l1 = (l1 + ' ' + w).trim();
    else l2 = (l2 + ' ' + w).trim();
  }
  // Do not force break in the middle of a word
  return l2 ? `${l1}<br>${l2}` : l1;
}