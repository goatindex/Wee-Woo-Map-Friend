/**
 * @module loaders/polygons
 * Load polygonal categories (ses, lga, cfa, frv) from GeoJSON and wire UI controls.
 */
// Converted to window pattern for vanilla JS compatibility

function makeSesChevronIcon(){
  const color = window.outlineColors.ses || '#FF9900';
  const size = 14; // height of triangle
  const half = 8;  // half width of base
  const html = `<div style="width:0;height:0;border-left:${half}px solid transparent;border-right:${half}px solid transparent;border-top:${size}px solid ${color};"></div>`;
  return L.divIcon({
    className: 'ses-chevron',
    html,
    iconSize: [16, 14],
    iconAnchor: [8, 14]
  });
}

function showSesChevron(key, map) {
  if (window.sesFacilityMarkers[key]) return;
  const coordData = window.sesFacilityCoords[key.toLowerCase()];
  if (!coordData) return;
  const icon = makeSesChevronIcon();
  const marker = L.marker([coordData.lat, coordData.lng], { icon, pane: 'ses' }).addTo(map);
  window.sesFacilityMarkers[key] = marker;
}

function hideSesChevron(key, map) {
  const marker = window.sesFacilityMarkers[key];
  if (marker) {
    map.removeLayer(marker);
    delete window.sesFacilityMarkers[key];
  }
}

window.loadPolygonCategory = async function(category, url) {
  const meta = window.categoryMeta[category];
  const map = window.getMap();
  // Normalise SES names to match facilities: strip "VIC SES"/"VICSES"/"SES" prefixes, trim, lowercase
  const normaliseSes = (s)=> (s||'')
    .replace(/^VIC\s*SES\s+/i, '')
    .replace(/^VICSES\s+/i, '')
    .replace(/^SES\s+/i, '')
    .trim()
    .toLowerCase();
  try {
    if (window.isOffline()) {
      window.showSidebarError(`You are offline. ${category} data cannot be loaded.`);
      return;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${category}: ${response.status}`);
    const geojson = await response.json();

    // Store features by clean name as key
    geojson.features.forEach(feature => {
      let rawName = feature.properties[meta.nameProp];
      if (!rawName) return;
      
      // For coordinates: handle different projection systems
      if (feature.geometry.type === 'Point' && category !== 'ambulance') {
        const coords = feature.geometry.coordinates;
        if (coords.length >= 2 && coords[0] > 1000) {
          // Looks like MGA94/UTM coordinates, convert to lat/lng
          try {
            const latLng = window.convertMGA94ToLatLon(coords[0], coords[1]);
            feature.geometry.coordinates = [latLng.lng, latLng.lat];
          } catch (e) {
            console.warn(`Failed to convert coordinates for ${rawName}:`, e);
          }
        }
      }
      
      const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const key = cleanName.toLowerCase().replace(/\s+/g, '_');
      
      if (window.featureLayers[category][key]) {
        window.featureLayers[category][key].push(feature);
      } else {
        window.featureLayers[category][key] = [feature];
      }
      
      // Store SES facility coordinates for chevron display
      if (category === 'ses') {
        const normalizedName = normaliseSes(cleanName);
        if (normalizedName && !window.sesFacilityCoords[normalizedName]) {
          // Calculate centroid for chevron placement if not available from facilities
          if (feature.geometry.type === 'Point') {
            window.sesFacilityCoords[normalizedName] = {
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0]
            };
          }
        }
      }
    });

    // Create layers
    Object.keys(window.featureLayers[category]).forEach(key => {
      window.featureLayers[category][key] = window.featureLayers[category][key].map(feature => {
        const style = meta.styleFn ? meta.styleFn() : {};
        return L.geoJSON(feature, {
          style,
          pane: category
        });
      });
    });

    // Populate namesByCategory for sidebar display
    window.namesByCategory[category] = Object.keys(window.featureLayers[category])
      .map(k => {
        const titled = window.toTitleCase(k);
        if (category === 'lga') return window.formatLgaName(titled);
        if (category === 'frv') return window.formatFrvName(titled);
        return titled;
      })
      .sort((a, b) => a.localeCompare(b));

    window.nameToKey[category] = {};
    Object.keys(window.featureLayers[category]).forEach(k => {
      const titled = window.toTitleCase(k);
      const display = (category === 'lga') ? window.formatLgaName(titled) : 
                      (category === 'frv') ? window.formatFrvName(titled) : titled;
      window.nameToKey[category][display] = k;
    });

    // Populate sidebar (all unchecked)
    const listEl = document.getElementById(meta.listId);
    listEl.innerHTML = '';
    window.namesByCategory[category].forEach(displayName => {
      const key = window.nameToKey[category][displayName];
      const checked = meta.defaultOn(displayName);
      const showName = true;
      // Create a row container and assign ID for search highlighting
      const row = document.createElement('div');
      row.className = 'sidebar-list-row';
      row.id = `${category}_${key}`;
      
      const cb = window.createCheckbox(`${category}_${key}_checkbox`, displayName, checked, 
        e => {
          const on = e.target.checked;
          window.featureLayers[category][key].forEach(l => {
            if (on) {
              l.addTo(map);
              if (category === 'ambulance') window.addPolygonPlus(map, l);
              if (category === 'ses') { showSesChevron(key, map); }
              // Show name label by default for polygons
              if (window.categoryMeta[category].type === 'polygon') {
                const labelName = (category === 'lga') ? window.formatLgaName(displayName) : 
                                  (category === 'frv') ? window.formatFrvName(displayName) : displayName;
                if (window.isBulkOperation) {
                  // Defer label creation during bulk operations
                  window.pendingLabels.push({category, key, labelName, isPoint: false, layer: l});
                } else {
                  window.ensureLabel(category, key, labelName, false, l);
                }
              }
            } else {
              map.removeLayer(l);
              if (category === 'ambulance') window.removePolygonPlus(l, map);
              if (category === 'ses') { hideSesChevron(key, map); }
              // Clean up emphasis and labels
              window.emphasised[category][key] = false;
              if (window.nameLabelMarkers[category][key]) {
                map.removeLayer(window.nameLabelMarkers[category][key]);
                window.nameLabelMarkers[category][key] = null;
              }
            }
          });
          window.updateActiveList();
        }
      );
      row.appendChild(cb);

      // Auto-check if defaultOn
      if (checked) {
        window.featureLayers[category][key].forEach(l => {
          l.addTo(map);
          if (category === 'ambulance') window.addPolygonPlus(map, l);
          if (category === 'ses') { showSesChevron(key, map); }
          if (meta.type === 'polygon') {
            const labelName = (category === 'lga') ? window.formatLgaName(displayName) : 
                              (category === 'frv') ? window.formatFrvName(displayName) : displayName;
            if (window.isBulkOperation) {
              // Defer label creation during bulk operations
              window.pendingLabels.push({category, key, labelName, isPoint: false, layer: l});
            } else {
              window.ensureLabel(category, key, labelName, false, l);
            }
          }
        });
      }
      
      listEl.appendChild(row);
    });

    // Set up active list sync for this category
    window.setupActiveListSync(category);

    // Group toggle
    const toggleAll = document.getElementById(meta.toggleAllId);
    if (toggleAll && !toggleAll._bound) {
      toggleAll._bound = true;
      toggleAll.checked = false;
      toggleAll.addEventListener('change', async e => {
        const on = e.target.checked;
        const items = window.namesByCategory[category];
        
        // Optimistic UI: disable toggle and show loading state
        toggleAll.disabled = true;
        toggleAll.title = `${on ? 'Loading' : 'Unloading'} ${items.length} ${category} items...`;
        
        // Begin bulk operation for performance
        window.beginBulkOperation();
        window.beginActiveListBulk();
        
        try {
          // Category-specific batch sizes for optimal performance
          const batchSizes = {
            'ses': 15,
            'lga': 8,
            'cfa': 12,
            'frv': 5,
            'ambulance': 20,
            'police': 20
          };
          const batchSize = batchSizes[category] || 10;
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            // Process current batch - direct layer manipulation for performance
            batch.forEach(n => {
              const key = window.nameToKey[category][n];
              const container = document.getElementById(`${category}_${key}`);
              let rowCb = null;
              if (container && container.tagName !== 'INPUT') {
                rowCb = container.querySelector('input[type="checkbox"]');
              } else {
                rowCb = container; // it's already the input
              }
              
              // Update checkbox state
              if (rowCb) {
                rowCb.checked = on;
              }
              
              // Direct layer manipulation (bypass change event for performance)
              window.featureLayers[category][key].forEach(l => {
                if (on) {
                  l.addTo(map);
                  if (category === 'ambulance') window.addPolygonPlus(map, l);
                  if (category === 'ses') { showSesChevron(key, map); }
                  // Defer label creation during bulk operation
                  if (window.categoryMeta[category].type === 'polygon') {
                    const labelName = (category === 'lga') ? window.formatLgaName(n) : 
                                      (category === 'frv') ? window.formatFrvName(n) : n;
                    if (window.isBulkOperation) {
                      window.pendingLabels.push({category, key, labelName, isPoint: false, layer: l});
                    } else {
                      window.ensureLabel(category, key, labelName, false, l);
                    }
                  }
                } else {
                  map.removeLayer(l);
                  if (category === 'ambulance') window.removePolygonPlus(l, map);
                  if (category === 'ses') { hideSesChevron(key, map); }
                  // Clean up emphasis and labels
                  window.emphasised[category][key] = false;
                  if (window.nameLabelMarkers[category][key]) {
                    map.removeLayer(window.nameLabelMarkers[category][key]);
                    window.nameLabelMarkers[category][key] = null;
                  }
                }
              });
            });
            
            // Yield control after each batch with progress feedback
            const processed = Math.min(i + batchSize, items.length);
            // Update toggle title with progress
            if (toggleAll) {
              toggleAll.title = `${on ? 'Loading' : 'Unloading'} ${processed}/${items.length} ${category} items...`;
            }
            
            // Progressive yielding: smaller batches get shorter delays
            const yieldDelay = batchSize <= 8 ? 8 : 
                              batchSize <= 12 ? 12 : 16;
            
            await new Promise(resolve => {
              requestAnimationFrame(() => {
                setTimeout(resolve, yieldDelay);
              });
            });
          }
        } catch (error) {
          console.error(`Error during ${category} bulk ${on ? 'loading' : 'unloading'}:`, error);
        } finally {
          // End bulk operations and process deferred items
          window.endBulkOperation();
          window.endActiveListBulk();
          
          // Restore toggle state
          toggleAll.disabled = false;
          toggleAll.title = `Toggle all ${category} items`;
        }
      });
    }

    console.log(`Loaded ${geojson.features.length} ${category} features`);
  } catch (error) {
    console.error(`Error loading ${category}:`, error);
    window.showSidebarError(`Failed to load ${category} data. Please try again.`);
  }
};
