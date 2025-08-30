/**
 * @module ui/collapsible
 * Adds expand/collapse behavior to sidebar sections with sticky header classes.
 */
window.setupCollapsible = function(headerId,listId,expanded=false){
  console.log('setupCollapsible called with:', { headerId, listId, expanded });
  
  const header = document.getElementById(headerId);
  const list = document.getElementById(listId);
  
  console.log('setupCollapsible elements found:', { 
    header: !!header, 
    list: !!list,
    headerElement: header,
    listElement: list
  });
  
  if (!header || !list) {
    console.error('setupCollapsible: Missing elements, returning early');
    return;
  }
  
  console.log('setupCollapsible: Setting up collapsible for', headerId);
  
  if (!expanded) {
    header.classList.add('collapsed');
    list.style.display = 'none';
  } else {
    header.classList.remove('collapsed');
    list.style.display = '';
  }

  header.addEventListener('click', () => {
    console.log('setupCollapsible: Header clicked:', headerId);
    
    // Only collapse other sections if this is not 'activeHeader'
    if (headerId !== 'activeHeader') {
      // Collapse all other sections except 'activeHeader' and the one being clicked
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
    
    console.log('setupCollapsible: After toggle:', {
      headerClasses: header.className,
      listDisplay: list.style.display
    });
  });
  
  console.log('setupCollapsible: Event listener attached to', headerId);
  
  // Initial sticky classes
  setTimeout(() => {
    const allHeaders = Array.from(document.querySelectorAll('.sidebar-headers h4'));
    const expandedIdx = allHeaders.findIndex(h => !h.classList.contains('collapsed'));
    allHeaders.forEach((h, i) => {
      h.classList.remove('sticky-top', 'sticky-bottom');
      if (expandedIdx === -1) return;
      if (i < expandedIdx) h.classList.add('sticky-top');
      if (i > expandedIdx) h.classList.add('sticky-bottom');
    });
  }, 0);
}