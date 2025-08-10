// Draw a thick white plus sign at the centroid of a polygon on a Leaflet map
// Usage: import { addPolygonPlus } from './polygonPlus.js'; addPolygonPlus(map, polygonLayer);

export function addPolygonPlus(map, polygonLayer) {
  if (!polygonLayer || !polygonLayer.getBounds) return;
  const center = polygonLayer.getBounds().getCenter();
  // SVG overlay for a thick white plus
  const size = 32, thickness = 8;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;">
    <rect x="${(size-thickness)/2}" y="6" width="${thickness}" height="${size-12}" fill="#fff" rx="3"/>
    <rect x="6" y="${(size-thickness)/2}" width="${size-12}" height="${thickness}" fill="#fff" rx="3"/>
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

export function removePolygonPlus(polygonLayer, map) {
  if (polygonLayer && polygonLayer._plusMarker) {
    map.removeLayer(polygonLayer._plusMarker);
    polygonLayer._plusMarker = null;
  }
}
