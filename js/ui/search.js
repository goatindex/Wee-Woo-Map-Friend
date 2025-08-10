import { setActiveListFilter } from '../state.js';
import { updateActiveList } from './activeList.js';

export function initSearch(){
  const box=document.getElementById('globalSearch');
  if(!box) return;
  let t=null;
  box.addEventListener('input', e=>{
    clearTimeout(t);
    const val=e.target.value.trim();
    t=setTimeout(()=>{
      setActiveListFilter(val);
      updateActiveList();
    },150);
  });
}