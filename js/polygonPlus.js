// Draw a thick white plus sign at the centroid of a polygon on a Leaflet map
// Usage: import { addPolygonPlus } from './polygonPlus.js'; addPolygonPlus(map, polygonLayer);

/**
 * Add a non-interactive plus marker at the polygon's bounds center.
 * Attaches a private _plusMarker reference to the layer for later removal.
 * @param {import('leaflet').Map} map
 * @param {import('leaflet').Polygon|import('leaflet').Polyline} polygonLayer
 */
window.addPolygonPlus = function(map, polygonLayer) {
  if (!polygonLayer || !polygonLayer.getBounds) return;
  const center = polygonLayer.getBounds().getCenter();
  // SVG overlay for a thick white plus
  const size = 32, thickness = 8;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
    <rect x="${(size-thickness)/2}" y="0" width="${thickness}" height="${size}" fill="#fff" rx="3"/>
    <rect x="0" y="${(size-thickness)/2}" width="${size}" height="${thickness}" fill="#fff" rx="3"/>
  </svg>`;
  const icon = L.divIcon({
    className: 'polygon-plus-icon',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
  const marker = L.marker(center, { icon, interactive: false }).addTo(map);
  // Attach marker to layer for later removal if needed
  polygonLayer._plusMarker = marker;
}

/**
 * Remove a previously added plus marker associated with the polygon layer.
 * @param {import('leaflet').Polygon|import('leaflet').Polyline & { _plusMarker?: import('leaflet').Marker|null }} polygonLayer
 * @param {import('leaflet').Map} map
 */
window.removePolygonPlus = function(polygonLayer, map) {
  if (polygonLayer && polygonLayer._plusMarker) {
    map.removeLayer(polygonLayer._plusMarker);
    polygonLayer._plusMarker = null;
  }
}
