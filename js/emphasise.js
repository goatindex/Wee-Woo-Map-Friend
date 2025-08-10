import { featureLayers, emphasised, getMap } from './state.js';

export function setEmphasis(category,key,on,isPoint){
  emphasised[category][key]=on;
  if(isPoint){
    const map = getMap(); // ensures map initialised; not used directly but safe
    const marker=featureLayers[category][key];
    if(marker && marker.getElement()){
      marker.getElement().classList.toggle('ambulance-emph', !!on);
    }
  } else {
    const layers=featureLayers[category][key];
    if(layers){
      // same fillOpacity logic
    }
  }
}