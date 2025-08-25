/**
 * @module loaders/polygons
 * Load polygonal categories (ses, lga, cfa) from GeoJSON and wire UI controls.
 */
// ...existing code...

function makeSesChevronIcon(){
  const color = window.outlineColors.ses || '#FF9900';
  const size = 14; // height of triangle
  const half = 8;  // half width of base
  const html = `<div style="width:0;height:0;border-left:${half}px solid transparent;border-right:${half}px solid transparent;border-top:${size}px solid ${color};"></div>`;
  return L.divIcon({
    className: 'ses-chevron',
    html,
    iconSize: [half*2, size],
    iconAnchor: [half, 0], // tip at the marker point
    pane: 'ses'
  });
}

function showSesChevron(key, map){
  const coord = sesFacilityCoords[key];
  if(!coord){
    console.warn(`SES facility coordinates missing for key: ${key}`);
    return;
  }
  if(sesFacilityMarkers[key]){
    try { map.addLayer(sesFacilityMarkers[key]); } catch {}
    return;
  }
  const m = L.marker([coord.lat, coord.lng], { icon: makeSesChevronIcon(), interactive: false, pane: 'ses' });
  sesFacilityMarkers[key] = m.addTo(map);
}

function hideSesChevron(key, map){
  const m = sesFacilityMarkers[key];
  if(m){ try { map.removeLayer(m); } catch {} }
}

/**
 * Fetch and register a polygon category from a GeoJSON URL and render controls.
 * Handles offline detection, HTTP errors, and invalid data with user feedback.
 * No behavior change: comments only.
 * @param {'ses'|'lga'|'cfa'|'ambulance'} category
 * @param {string} url
 * @returns {Promise<void>}
 */
export async function loadPolygonCategory(category, url) {
  const meta = categoryMeta[category];
  const map = getMap();
  // Normalise SES names to match facilities: strip "VIC SES"/"VICSES"/"SES" prefixes, trim, lowercase
  const normaliseSes = (s)=> (s||'')
    .replace(/^VIC\s*SES\s+/i, '')
    .replace(/^VICSES\s+/i, '')
    .replace(/^SES\s+/i, '')
    .trim()
    .toLowerCase();
  try {
    if (isOffline()) {
      showSidebarError(`You are offline. ${category} data cannot be loaded.`);
      return;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.features)) throw new Error('Invalid GeoJSON');

    // Pre-create containers
    data.features.forEach(f => {
      if (!f?.properties) return;
  let raw = f.properties[meta.nameProp];
      if (typeof raw !== 'string') return;
  raw = raw.trim();
      if (!raw) return;
  const key = (category==='ses') ? normaliseSes(raw) : raw.toLowerCase();
      if (!featureLayers[category][key]) featureLayers[category][key] = [];
      // Add converted coordinates if X_CORD/Y_CORD exist
      if (f.properties.X_CORD && f.properties.Y_CORD) {
        const [lon, lat] = convertMGA94ToLatLon(f.properties.X_CORD, f.properties.Y_CORD);
        f.properties.X_COORD = lon;
        f.properties.Y_COORD = lat;
      }
    });

    // Build GeoJSON (NOT added to map yet)
    const tempLayer = L.geoJSON(data, {
      style: meta.styleFn,
      pane: category, // use panes defined in bootstrap.js
      renderer: L.canvas(),
      onEachFeature: (feature, layer) => {
        if (!feature.properties) return;
  let raw = feature.properties[meta.nameProp];
        if (typeof raw !== 'string') raw = 'Unnamed';
        raw = raw.trim();
  const key = (category==='ses') ? normaliseSes(raw) : raw.toLowerCase();
        if (!featureLayers[category][key]) featureLayers[category][key] = [];
        featureLayers[category][key].push(layer);
        layer.bindPopup(toTitleCase(raw));
      }
    });

    // Fit bounds for SES only (optional)
    if (category === 'ses' && tempLayer?.getBounds) {
      const b = tempLayer.getBounds();
      if (b.isValid()) map.fitBounds(b);
    }

    // Build name arrays
  namesByCategory[category] = Object.keys(featureLayers[category])
      .map(k => {
        const titled = toTitleCase(k);
        return (category === 'lga') ? formatLgaName(titled) : titled;
      })
      .sort((a, b) => a.localeCompare(b));

    nameToKey[category] = {};
    Object.keys(featureLayers[category]).forEach(k => {
      const titled = toTitleCase(k);
      const display = (category === 'lga') ? formatLgaName(titled) : titled;
      nameToKey[category][display] = k;
    });

    // Populate sidebar (all unchecked)
    const listEl = document.getElementById(meta.listId);
    listEl.innerHTML = '';
    namesByCategory[category].forEach(displayName => {
      const key = nameToKey[category][displayName];
  const checked = meta.defaultOn(displayName);
      const showName = true;
      // Create a row container and assign ID for search highlighting
      const row = document.createElement('div');
      row.id = `${category}_${key}`;
      row.className = 'sidebar-list-row';
      // Add the checkbox
      const cb = createCheckbox(
        `${category}_${key}`,
        displayName,
        checked,
        e => {
          const on = e.target.checked;
      featureLayers[category][key].forEach(l => {
            if (on) {
              l.addTo(map);
              if (category === 'ambulance') addPolygonPlus(map, l);
        if (category === 'ses') { showSesChevron(key, map); }
              // Show name label by default for polygons
        if (categoryMeta[category].type === 'polygon') {
                import('../labels.js').then(({ ensureLabel }) => {
          const labelName = (category === 'lga') ? formatLgaName(displayName) : displayName;
          ensureLabel(category, key, labelName, false, l);
                });
              }
            } else {
              map.removeLayer(l);
              if (category === 'ambulance') removePolygonPlus(l, map);
        if (category === 'ses') { hideSesChevron(key, map); }
            }
          });
          if (!on) {
            emphasised[category][key] = false;
            if (nameLabelMarkers[category][key]) {
              map.removeLayer(nameLabelMarkers[category][key]);
              nameLabelMarkers[category][key] = null;
            }
          }
          if (category !== 'lga') {
            Object.values(featureLayers.lga).flat().forEach(l => l && l.bringToFront && l.bringToFront());
          }
          updateActiveList();
        }
      );
      row.appendChild(cb);
      listEl.appendChild(row);
      // Add to map and set emphasis/label if default
      if (checked) {
        featureLayers[category][key].forEach(l => {
          l.addTo(map);
          if (category === 'ambulance') addPolygonPlus(map, l);
          if (category === 'ses') { showSesChevron(key, map); }
          // Show name label by default for polygons
          // Only call for polygons (not points)
      if (meta.type === 'polygon') {
            import('../labels.js').then(({ ensureLabel }) => {
        const labelName = (category === 'lga') ? formatLgaName(displayName) : displayName;
        ensureLabel(category, key, labelName, false, l);
            });
          }
        });
      } else {
        featureLayers[category][key].forEach(l => {
          map.removeLayer(l);
          if (category === 'ambulance') removePolygonPlus(l, map);
        });
      }
    });
    // After all polygons loaded, bring all LGA polygons to front
  // No per-layer bringToFront calls; panes manage ordering

    // Group toggle
    const toggleAll = document.getElementById(meta.toggleAllId);
    if (toggleAll && !toggleAll._bound) {
      toggleAll._bound = true;
      toggleAll.checked = false;
      toggleAll.addEventListener('change', e => {
        const on = e.target.checked;
        beginActiveListBulk();
        namesByCategory[category].forEach(n => {
          const key = nameToKey[category][n];
          const container = document.getElementById(`${category}_${key}`);
          let rowCb = null;
          if (container && container.tagName !== 'INPUT') {
            rowCb = container.querySelector('input[type="checkbox"]');
          } else {
            rowCb = container; // it's already the input
          }
          if (rowCb) {
            rowCb.checked = on;
            // Dispatch a change event so normal handlers run (adds/removes layers, updates active list, labels, emphasis)
            rowCb.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Fallback: directly manipulate layers if checkbox not found (shouldn't happen)
            featureLayers[category][key].forEach(l => on ? l.addTo(map) : map.removeLayer(l));
            if (!on) {
              emphasised[category][key] = false;
              if (nameLabelMarkers[category][key]) {
                map.removeLayer(nameLabelMarkers[category][key]);
                nameLabelMarkers[category][key] = null;
              }
            }
          }
        });
        endActiveListBulk();
      });
    }

    setupActiveListSync(category);
    updateActiveList();
    console.log(`Loaded ${category}:`, namesByCategory[category].length, 'areas');

  } catch (err) {
    // Error handling: show user feedback if loading fails
    showSidebarError(`Failed to load ${category} data: ${err.message}`);
    // Log error for developers
    console.error(`Error loading ${category} from ${url}:`, err);
    // Graceful degradation: continue running
  }
}