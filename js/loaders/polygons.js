import { categoryMeta } from '../config.js';
import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers } from '../state.js';
import { setupActiveListSync, updateActiveList } from '../ui/activeList.js';
import { toTitleCase, createCheckbox } from '../utils.js';
import { addPolygonPlus, removePolygonPlus } from '../polygonPlus.js';
import { getMap } from '../state.js';
import { showSidebarError, isOffline } from '../utils/errorUI.js';
import { convertMGA94ToLatLon } from '../utils/coordConvert.js';

export async function loadPolygonCategory(category, url) {
  const meta = categoryMeta[category];
  const map = getMap();
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
      const key = raw.toLowerCase();
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
      onEachFeature: (feature, layer) => {
        if (!feature.properties) return;
        let raw = feature.properties[meta.nameProp];
        if (typeof raw !== 'string') raw = 'Unnamed';
        raw = raw.trim();
        const key = raw.toLowerCase();
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
      .map(k => toTitleCase(k))
      .sort((a, b) => a.localeCompare(b));

    nameToKey[category] = {};
    Object.keys(featureLayers[category]).forEach(k => {
      nameToKey[category][toTitleCase(k)] = k;
    });

    // Populate sidebar (all unchecked)
    const listEl = document.getElementById(meta.listId);
    listEl.innerHTML = '';
    namesByCategory[category].forEach(displayName => {
      const key = nameToKey[category][displayName];
      // Use defaultOn to determine checked state
      const checked = meta.defaultOn(displayName);
      // Show name label by default for polygons
      const showName = true;
      const cb = createCheckbox(
        `${category}_${key}`,
        displayName,
        checked,
        e => {
          const on = e.target.checked;
          featureLayers[category][key].forEach(l => {
            if (on) {
              l.addTo(map);
              // If LGA, bring to front
              if (category === 'lga' && l.bringToFront) l.bringToFront();
              // If ambulance, add thick white plus
              if (category === 'ambulance') addPolygonPlus(map, l);
            } else {
              map.removeLayer(l);
              // If ambulance, remove thick white plus
              if (category === 'ambulance') removePolygonPlus(l, map);
            }
          });
          if (!on) {
            emphasised[category][key] = false;
            if (nameLabelMarkers[category][key]) {
              map.removeLayer(nameLabelMarkers[category][key]);
              nameLabelMarkers[category][key] = null;
            }
          }
          // After any change, always bring all LGA polygons to front
          if (category !== 'lga') {
            Object.values(featureLayers.lga).flat().forEach(l => l && l.bringToFront && l.bringToFront());
          }
          updateActiveList();
        }
      );
      listEl.appendChild(cb);
      // Add to map and set emphasis/label if default
      if (checked) {
        featureLayers[category][key].forEach(l => {
          l.addTo(map);
          if (category === 'lga' && l.bringToFront) l.bringToFront();
          if (category === 'ambulance') addPolygonPlus(map, l);
          // Show name label by default for polygons
          // Only call for polygons (not points)
          if (meta.type === 'polygon') {
            import('../labels.js').then(({ ensureLabel }) => {
              ensureLabel(category, key, displayName, false, l);
            });
          }
        });
        if (category === 'ses') {
          emphasised[category][key] = true;
        }
      } else {
        featureLayers[category][key].forEach(l => {
          map.removeLayer(l);
          if (category === 'ambulance') removePolygonPlus(l, map);
        });
      }
    });
    // After all polygons loaded, bring all LGA polygons to front
    if (category === 'lga') {
      Object.values(featureLayers.lga).flat().forEach(l => l && l.bringToFront && l.bringToFront());
    }

    // Group toggle
    const toggleAll = document.getElementById(meta.toggleAllId);
    if (toggleAll && !toggleAll._bound) {
      toggleAll._bound = true;
      toggleAll.checked = false;
      toggleAll.addEventListener('change', e => {
        const on = e.target.checked;
        namesByCategory[category].forEach(n => {
          const key = nameToKey[category][n];
          const rowCb = document.getElementById(`${category}_${key}`);
            if (rowCb) {
              rowCb.checked = on;
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
        updateActiveList();
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