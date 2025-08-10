import { categoryMeta } from '../config.js';
import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers } from '../state.js';
import { setupActiveListSync, updateActiveList } from '../ui/activeList.js';
import { toTitleCase, createCheckbox } from '../utils.js';
import { getMap } from '../state.js';

export async function loadPolygonCategory(category, url) {
  const meta = categoryMeta[category];
  const map = getMap();
  try {
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
      const checked = false; // default off
      const cb = createCheckbox(
        `${category}_${key}`,
        displayName,
        checked,
        e => {
          const on = e.target.checked;
          featureLayers[category][key].forEach(l => on ? l.addTo(map) : map.removeLayer(l));
          if (!on) {
            emphasised[category][key] = false;
            if (nameLabelMarkers[category][key]) {
              map.removeLayer(nameLabelMarkers[category][key]);
              nameLabelMarkers[category][key] = null;
            }
          }
          updateActiveList();
        }
      );
      listEl.appendChild(cb);
      // Ensure not added initially
      featureLayers[category][key].forEach(l => map.removeLayer(l));
    });

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
    console.error('loadPolygonCategory error', category, err);
    alert('Failed to load ' + category);
  }
}