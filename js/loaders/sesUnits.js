import { getMap } from '../state.js';
import { toTitleCase } from '../utils.js';

export async function loadSesUnits(){
  const map = getMap();
  try{
    const res=await fetch('ses.geojson');
    if(!res.ok) return;
    const data=await res.json();
    if(!data?.features) return;
    data.features.forEach(f=>{
      const p=f.properties;
      if(!p) return;
      const unitName=p.SES_UNIT_NAME;
      const x=p.X_CORD, y=p.Y_CORD;
      if(unitName && x && y){
        const icon=L.divIcon({
          className:'ses-unit-marker',
            html:`<div class="ses-unit-label">${toTitleCase(unitName)}</div>`,
          iconAnchor:[60,44]
        });
        L.marker([y,x], { icon, interactive:false }).addTo(map);
      }
    });
  }catch(e){
    console.warn('SES units skipped', e);
  }
}