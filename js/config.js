export const outlineColors = { ses:'#cc7a00', lga:'black', cfa:'red', ambulance:'#d32f2f' };
export const baseOpacities = { ses:0.2, lga:0.1, cfa:0.1 };
export function sesStyle(){ return { color:'#FF9900', weight:3, fillColor:'orange', fillOpacity:0.2 }; }
export function lgaStyle(){ return { color:'black', weight:1.5, fillColor:'black', fillOpacity:0.1, dashArray:'8 8' }; }
export function cfaStyle(){ return { color:'red', weight:2, fillColor:'red', fillOpacity:0.1 }; }
export const categoryMeta = {
  ses:{ type:'polygon', nameProp:'RESPONSE_ZONE_NAME', styleFn:sesStyle, defaultOn:n=>n.toLowerCase()==='fawkner' },
  lga:{ type:'polygon', nameProp:'LGA_NAME', styleFn:lgaStyle, defaultOn:n=>['merri bek','hume'].includes(n.toLowerCase()) },
  cfa:{ type:'polygon', nameProp:'BRIG_NAME', styleFn:cfaStyle, defaultOn:()=>false },
  ambulance:{ type:'point', nameProp:'facility_name', styleFn:null, defaultOn:()=>false }
};