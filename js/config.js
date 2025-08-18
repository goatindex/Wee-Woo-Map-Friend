export const outlineColors = { ses:'#cc7a00', lga:'black', cfa:'red', ambulance:'#d32f2f' };
export const baseOpacities = { ses:0.2, lga:0.1, cfa:0.1 };
export function sesStyle(){ return { color:'#FF9900', weight:3, fillColor:'orange', fillOpacity:0.2 }; }
export function lgaStyle(){ return { color:'black', weight:1.5, fillColor:'black', fillOpacity:0.1, dashArray:'8 8' }; }
export function cfaStyle(){ return { color:'red', weight:2, fillColor:'red', fillOpacity:0.1 }; }
export const categoryMeta = {
  ses: {
    type: 'polygon',
    nameProp: 'RESPONSE_ZONE_NAME',
    styleFn: sesStyle,
    defaultOn: () => false,
    listId: 'sesList',
    toggleAllId: 'toggleAllSES'
  },
  lga: {
    type: 'polygon',
    nameProp: 'LGA_NAME',
    styleFn: lgaStyle,
    defaultOn: () => false,
    listId: 'lgaList',
    toggleAllId: 'toggleAllLGAs'
  },
  cfa: {
    type: 'polygon',
    nameProp: 'BRIG_NAME',
    styleFn: cfaStyle,
    defaultOn: () => false,
    listId: 'cfaList',
    toggleAllId: 'toggleAllCFA'
  },
  ambulance: {
    type: 'point',
    nameProp: 'facility_name',
    styleFn: null,
    defaultOn: () => false,
    listId: 'ambulanceList',
    toggleAllId: 'toggleAllAmbulance'
  }
};

// WillyWeather API key for development only. Do NOT use in production or public repos.
// Transition to backend proxy for security in future versions.
export const WILLYWEATHER_API_KEY = "NGMwYjk3YjlhZTIxZjJhMjNmYTFkY2";