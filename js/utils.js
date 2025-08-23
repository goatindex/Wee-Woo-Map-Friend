/* @ts-check */
/**
 * @module utils
 * Small helpers for string formatting and DOM checkbox creation.
 */

/**
 * Convert a string to Title Case.
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str){
  return str.replace(/\w\S*/g, t => t[0].toUpperCase()+t.slice(1).toLowerCase());
}
/**
 * Create a labeled checkbox element.
 * @param {string} id - Input id attribute.
 * @param {string} label - Text displayed next to the checkbox.
 * @param {boolean} checked - Initial checked state.
 * @param {(e:Event)=>void} [onChange] - Optional change handler.
 * @returns {HTMLLabelElement}
 */
export function createCheckbox(id,label,checked,onChange){
  const wrapper=document.createElement('label');
  const cb=document.createElement('input');
  cb.type='checkbox'; cb.id=id; cb.checked=checked;
  if(onChange) cb.addEventListener('change',onChange);
  wrapper.appendChild(cb);
  wrapper.appendChild(document.createTextNode(' '+label));
  return wrapper;
}