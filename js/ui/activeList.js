import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers, activeListFilter } from '../state.js';
import { categoryMeta, outlineColors } from '../config.js';
import { ensureLabel, removeLabel } from '../labels.js';
import { setEmphasis } from '../emphasise.js';

export function setupActiveListSync(category){
  namesByCategory[category].forEach(n=>{
    const key=nameToKey[category][n];
    const cb=document.getElementById(`${category}_${key}`);
    if(cb && !cb._bound){
      cb._bound=true;
      cb.addEventListener('change', updateActiveList);
    }
  });
}

export function updateActiveList(){
  const activeList=document.getElementById('activeList');
  if(!activeList) return;
  activeList.innerHTML='';

  const headerRow=document.createElement('div');
  headerRow.style.display='flex'; headerRow.style.alignItems='center'; headerRow.style.marginBottom='4px';
  const spacer=document.createElement('span'); spacer.style.flex='1'; headerRow.appendChild(spacer);
  headerRow.appendChild(makeHeaderSpan('‼','Emphasise'));
  headerRow.appendChild(makeHeaderSpan('⁇','Show Name'));
  activeList.appendChild(headerRow);

  ['ses','lga','cfa','ambulance'].forEach(cat=>addItems(cat,activeList));
}

function makeHeaderSpan(txt,title){
  const s=document.createElement('span');
  s.textContent=txt; s.title=title; s.style.fontWeight='bold';
  s.style.display='flex'; s.style.alignItems='center'; s.style.height='24px'; s.style.margin='0 8px 0 0';
  return s;
}

function addItems(category,container){
  const isPoint = categoryMeta[category].type==='point';
  namesByCategory[category].forEach(displayName=>{
    if(activeListFilter && !displayName.toLowerCase().includes(activeListFilter.toLowerCase())){
      const key=nameToKey[category][displayName];
      removeLabel(category,key);
      return;
    }
    const key=nameToKey[category][displayName];
    const baseCb=document.getElementById(`${category}_${key}`);
    if(!baseCb || !baseCb.checked){
      removeLabel(category,key);
      return;
    }
    const row=document.createElement('div');
    row.style.display='flex'; row.style.alignItems='center'; row.style.marginBottom='2px';

    const nameSpan=document.createElement('span');
    nameSpan.textContent=displayName;
    nameSpan.style.color=outlineColors[category];
    nameSpan.style.fontWeight='bold';
    nameSpan.style.flex='1';
    row.appendChild(nameSpan);

    // Emphasis
    const emphBox=document.createElement('span'); emphBox.style.margin='0 8px';
    const emphCb=document.createElement('input');
    emphCb.type='checkbox'; emphCb.checked=!!emphasised[category][key]; emphCb.title='Emphasise';
    emphCb.addEventListener('change',()=> setEmphasis(category,key,emphCb.checked,isPoint));
    emphBox.appendChild(emphCb);
    row.appendChild(emphBox);

    // Name label
    const nameBox=document.createElement('span');
    const nameCb=document.createElement('input');
    nameCb.type='checkbox'; nameCb.checked=!!nameLabelMarkers[category][key]; nameCb.title='Show Name';
    nameCb.addEventListener('change',()=>{
      removeLabel(category,key);
      if(nameCb.checked){
        const layerOrMarker = isPoint ? featureLayers[category][key] : featureLayers[category][key]?.[0];
        if(layerOrMarker) ensureLabel(category,key,displayName,isPoint,layerOrMarker);
      }
    });
    nameBox.appendChild(nameCb);
    row.appendChild(nameBox);

    container.appendChild(row);
  });
}