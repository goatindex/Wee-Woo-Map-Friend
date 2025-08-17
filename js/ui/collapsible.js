export function setupCollapsible(headerId,listId,expanded=false){
  const header = document.getElementById(headerId);
  const list = document.getElementById(listId);
  if (!header || !list) return;
  if (!expanded) {
    header.classList.add('collapsed');
    list.style.display = 'none';
  } else {
    header.classList.remove('collapsed');
    list.style.display = '';
  }

  header.addEventListener('click', () => {
    // Exclude 'activeHeader' from auto-closing logic
    if (headerId !== 'activeHeader') {
      // Find all collapsible headers except 'activeHeader' and the one being clicked
      const allHeaders = document.querySelectorAll('.layer-menu h4');
      allHeaders.forEach(h => {
        if (h.id !== 'activeHeader' && h.id !== headerId) {
          h.classList.add('collapsed');
          const targetListId = h.id.replace('Header', 'List');
          const targetList = document.getElementById(targetListId);
          if (targetList) targetList.style.display = 'none';
        }
      });
    }
    // Toggle this section
    header.classList.toggle('collapsed');
    list.style.display = list.style.display === 'none' ? '' : 'none';
  });
}