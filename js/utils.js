export function toTitleCase(str){
  return str.replace(/\w\S*/g, t => t[0].toUpperCase()+t.slice(1).toLowerCase());
}
export function createCheckbox(id,label,checked,onChange){
  const wrapper=document.createElement('label');
  const cb=document.createElement('input');
  cb.type='checkbox'; cb.id=id; cb.checked=checked;
  if(onChange) cb.addEventListener('change',onChange);
  wrapper.appendChild(cb);
  wrapper.appendChild(document.createTextNode(' '+label));
  return wrapper;
}