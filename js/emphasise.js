import { featureLayers, emphasised, map } from './state.js';
import { baseOpacities } from './config.js';

export function setEmphasis(category,key,on,isPoint){
  emphasised[category][key]=on;
  if(isPoint){
    const marker = featureLayers[category][key];
    if(marker && marker.getElement()){
      marker.getElement().classList.toggle('ambulance-emph', !!on);
    }
  } else {
    const layers = featureLayers[category][key];
    if(layers){
      layers.forEach(l=>{
        let op = baseOpacities[category];
        if(on) op = Math.min(op+0.15,1);
        l.setStyle({ fillOpacity: op });
      });
    }
  }
}