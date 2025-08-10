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
  // Name column spacer
  const spacer=document.createElement('span');
  spacer.style.flex='1';
  headerRow.appendChild(spacer);
  // Emphasise header
  const emphHeader=document.createElement('span');
  emphHeader.textContent='‼';
  emphHeader.title='Emphasise';
  emphHeader.style.display='flex';
  emphHeader.style.justifyContent='center';
  emphHeader.style.alignItems='center';
  emphHeader.style.width='32px';
  emphHeader.style.fontWeight='bold';
  headerRow.appendChild(emphHeader);
  // Show Name header
  const nameHeader=document.createElement('span');
  nameHeader.textContent='⁇';
  nameHeader.title='Show Name';
  nameHeader.style.display='flex';
  nameHeader.style.justifyContent='center';
  nameHeader.style.alignItems='center';
  nameHeader.style.width='32px';
  nameHeader.style.fontWeight='bold';
  headerRow.appendChild(nameHeader);
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
    // X button
    const xBtn = document.createElement('button');
    xBtn.textContent = '✕';
    xBtn.title = 'Remove from map and active list';
    xBtn.style.marginRight = '8px';
    xBtn.style.background = 'none';
    xBtn.style.border = 'none';
    xBtn.style.color = '#b00';
    xBtn.style.fontWeight = 'bold';
    xBtn.style.cursor = 'pointer';
    xBtn.style.fontSize = '1.1em';
    xBtn.addEventListener('click', () => {
      const baseCb = document.getElementById(`${category}_${key}`);
      if(baseCb) {
        baseCb.checked = false;
        baseCb.dispatchEvent(new Event('change', { bubbles: true }));
      }
      removeLabel(category, key);
      updateActiveList();
    });
    row.appendChild(xBtn);
    // Name column
    let shownName = displayName;
    if(category === 'ambulance') {
      shownName = shownName.replace(/ambulance station/i, 'Ambo');
    }
    const nameSpan=document.createElement('span');
    nameSpan.textContent=shownName;
    nameSpan.style.color=outlineColors[category];
    nameSpan.style.fontWeight='bold';
    nameSpan.style.flex='1';
    row.appendChild(nameSpan);
    // Emphasise checkbox column
    const emphBox=document.createElement('span');
    emphBox.style.display='flex';
    emphBox.style.justifyContent='center';
    emphBox.style.alignItems='center';
    emphBox.style.width='32px';
    const emphCb=document.createElement('input');
    emphCb.type='checkbox';
    // Default: all SES polygons emphasised by default
    emphCb.checked = category === 'ses' && categoryMeta.ses.defaultOn(displayName) ? true : !!emphasised[category][key];
    emphCb.title='Emphasise';
    emphCb.addEventListener('change',()=> setEmphasis(category,key,emphCb.checked,isPoint));
    emphBox.appendChild(emphCb);
    row.appendChild(emphBox);
    // Show Name checkbox column
    const nameBox=document.createElement('span');
    nameBox.style.display='flex';
    nameBox.style.justifyContent='center';
    nameBox.style.alignItems='center';
    nameBox.style.width='32px';
    const nameCb=document.createElement('input');
    nameCb.type='checkbox';
    // Default: show name for all specified polygons
    nameCb.checked = (
      (category === 'ses' && categoryMeta.ses.defaultOn(displayName)) ||
      (category === 'lga' && categoryMeta.lga.defaultOn(displayName)) ||
      (category === 'cfa' && categoryMeta.cfa.defaultOn(displayName))
    ) ? true : !!nameLabelMarkers[category][key];
    nameCb.title='Show Name';
    nameCb.addEventListener('change',()=>{
      removeLabel(category,key);
      if(nameCb.checked && !nameLabelMarkers[category][key]){
        const layerOrMarker = isPoint ? featureLayers[category][key] : featureLayers[category][key]?.[0];
        if(layerOrMarker) ensureLabel(category,key,displayName,isPoint,layerOrMarker);
      }
    });
    nameBox.appendChild(nameCb);
    row.appendChild(nameBox);
    container.appendChild(row);
  });
}