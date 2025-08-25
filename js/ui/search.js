/**
 * @module ui/search
 * Debounced filter input for the active list section.
 */
// ...existing code...

/** Initialize the global search input if present. */
window.initSearch = function(){
  const box = document.getElementById('globalSidebarSearch');
  const dropdown = document.getElementById('sidebarSearchDropdown');
  if (!box || !dropdown) return;
  let t = null;
  box.addEventListener('input', e => {
    clearTimeout(t);
    const val = e.target.value.trim().toLowerCase();
    if (!val) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('active');
      dropdown.style.display = 'none';
      return;
    }
    t = setTimeout(() => {
      console.log('Search input:', val);
      console.log('namesByCategory:', JSON.stringify(namesByCategory));
      console.log('nameToKey:', JSON.stringify(nameToKey));
      const results = [];
      Object.entries(namesByCategory).forEach(([cat, names]) => {
        names.forEach(name => {
          // Case-insensitive search and key lookup
          if (name.toLowerCase().includes(val)) {
            // Find key in a case-insensitive way
            let key = nameToKey[cat][name];
            if (!key) {
              // Try to find key by lowercasing all keys
              const lowerName = name.toLowerCase();
              for (const k in nameToKey[cat]) {
                if (k.toLowerCase() === lowerName) {
                  key = nameToKey[cat][k];
                  break;
                }
              }
            }
            results.push({ cat, name, key });
          }
        });
      });
      console.log('Dropdown results:', results);
      if (results.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">No matches</div>';
        dropdown.classList.add('active');
        dropdown.style.display = 'block';
        return;
      }
      dropdown.innerHTML = results.map(r => {
        const base = outlineColors[r.cat] || '#333';
        const factor = (labelColorAdjust[r.cat] ?? 1.0);
        const color = adjustHexColor(base, factor);
        return `<div class="dropdown-item" data-cat="${r.cat}" data-key="${r.key}"><span class="name" style="color:${color}">${r.name}</span> <span style="color:#888;font-size:0.9em;">(${r.cat.toUpperCase()})</span></div>`;
      }).join('');
      dropdown.classList.add('active');
      dropdown.style.display = 'block';
      // Handle click on dropdown item
      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          const cat = item.getAttribute('data-cat');
          const key = item.getAttribute('data-key');
          const sidebarId = `${cat}_${key}`;
          const el = document.getElementById(sidebarId);
          if (el) {
            // Expand the section if collapsed
            const headerId = `${cat}Header`;
            const header = document.getElementById(headerId);
            if (header && header.classList.contains('collapsed')) {
              header.click();
            }
            // Determine the checkbox element and a container to scroll/highlight
            let cb = null;
            let container = null;
            if (el.tagName === 'INPUT') {
              cb = el; // e.g., ambulance entries where the input has the id
              container = el.closest('.sidebar-list-row') || el.parentElement || el;
            } else {
              cb = el.querySelector('input[type="checkbox"]');
              container = el;
            }
            if (cb && !cb.checked) {
              cb.checked = true;
              cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (container && container.scrollIntoView) {
              container.scrollIntoView({ behavior: 'smooth', block: 'center' });
              container.classList.add('search-highlight');
              setTimeout(() => container.classList.remove('search-highlight'), 1200);
            }
          }
          dropdown.innerHTML = '';
          dropdown.classList.remove('active');
          box.value = '';
        });
      });
    }, 120);
  });
  // Hide dropdown on blur
  box.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.innerHTML = '';
      dropdown.classList.remove('active');
      dropdown.style.display = 'none';
    }, 200);
  });
}