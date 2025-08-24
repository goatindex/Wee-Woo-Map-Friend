/**
 * @module loaders/sesFacilities
 * Load SES facility point coordinates and map them to SES polygon keys.
 */
import { sesFacilityCoords } from '../state.js';
import { convertMGA94ToLatLon } from '../utils/coordConvert.js';
import { categoryMeta } from '../config.js';

function normaliseKey(name){
  let s = (name||'').trim();
  // Defensively strip leading 'VICSES ' if present (in case source updates)
  s = s.replace(/^VIC\s*SES\s+/i, '') // "VIC SES ..."
       .replace(/^VICSES\s+/i, '')     // "VICSES ..."
       .replace(/^SES\s+/i, '');       // "SES ..."
  return s.toLowerCase();
}

/**
 * Load sesbld.geojson and build a name->coord map keyed like SES polygons.
 */
export async function loadSesFacilities(){
  try{
    const res = await fetch('sesbld.geojson');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.features)) throw new Error('Invalid GeoJSON');
    const meta = categoryMeta.ses;
    let loaded = 0;
    data.features.forEach(f => {
      const props = f && f.properties || {};
      // Facility file uses 'facility_name' (not the polygon nameProp)
      let raw = props['facility_name'];
      if (typeof raw !== 'string') return;
      const key = normaliseKey(raw);
      // Determine lat/lon from geometry or properties; convert if needed
      let lat = null, lon = null;
      try{
        if (f.geometry && f.geometry.type === 'Point' && Array.isArray(f.geometry.coordinates)){
          lon = +f.geometry.coordinates[0];
          lat = +f.geometry.coordinates[1];
        } else if (props.X_CORD && props.Y_CORD) {
          const conv = convertMGA94ToLatLon(props.X_CORD, props.Y_CORD);
          lon = conv[0]; lat = conv[1];
        } else if (props.lon && props.lat){
          lon = +props.lon; lat = +props.lat;
        }
      }catch{}
      if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)){
        sesFacilityCoords[key] = { lat, lng: lon };
        loaded++;
      }
    });
    console.log(`SES facilities loaded: ${loaded} (unique keys: ${Object.keys(sesFacilityCoords).length})`);
  }catch(err){
    console.error('Failed to load sesbld.geojson:', err);
  }
}
