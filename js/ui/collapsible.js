export function setupCollapsible(headerId,listId,expanded=false){
  const header=document.getElementById(headerId);
  const list=document.getElementById(listId);
  if(!header||!list) return;
  if(!expanded){ header.classList.add('collapsed'); list.style.display='none'; }
  else { header.classList.remove('collapsed'); list.style.display=''; }
  header.addEventListener('click',()=>{
    header.classList.toggle('collapsed');
    list.style.display = list.style.display==='none' ? '' : 'none';
  });
}