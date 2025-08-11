import { getMap } from '../state.js';

let waterwayLayer = null;

export function loadWaterwayCentres() {
  fetch('waterwaycent.geojson')
    .then(res => res.json())
    .then(data => {
      waterwayLayer = L.geoJSON(data, {
        style: {
          color: '#0a2372', // dark blue
          weight: 2,
          fillColor: '#0a2372',
          fillOpacity: 0.7
        }
      });
    });
}

export function showWaterwayCentres() {
  if (waterwayLayer) waterwayLayer.addTo(getMap());
}

export function hideWaterwayCentres() {
  if (waterwayLayer) waterwayLayer.remove();
}
