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
      const allHeaders = document.querySelectorAll('.sidebar-headers h4');
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

    // Dynamic sticky classes
    const allHeaders = Array.from(document.querySelectorAll('.sidebar-headers h4'));
    const expandedIdx = allHeaders.findIndex(h => !h.classList.contains('collapsed'));
    allHeaders.forEach((h, i) => {
      h.classList.remove('sticky-top', 'sticky-bottom');
      if (expandedIdx === -1) return;
      if (i < expandedIdx) h.classList.add('sticky-top');
      if (i > expandedIdx) h.classList.add('sticky-bottom');
    });
  });
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