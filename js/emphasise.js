import { featureLayers, emphasised, getMap } from './state.js';
import { categoryMeta } from './config.js';

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
    if(layers && Array.isArray(layers)){
      layers.forEach(layer => {
        if(layer && layer.setStyle){
          // Get current style
          const orig = layer.options;
          let base = orig && typeof orig.fillOpacity === 'number' ? orig.fillOpacity : 0.2;
          // If not emphasised, revert to base opacity from config
          if(!on){
            // Get base opacity from config
            const styleFn = categoryMeta[category]?.styleFn;
            if(styleFn){
              base = styleFn().fillOpacity ?? base;
            }
            layer.setStyle({ fillOpacity: base });
          } else {
            // Emphasised: add 0.15
            layer.setStyle({ fillOpacity: Math.min(base + 0.15, 1) });
          }
        }
      });
    }
  }
}