import { setMap } from './state.js';
import { loadPolygonCategory } from './loaders/polygons.js';
import { loadAmbulance } from './loaders/ambulance.js';
import { loadSesUnits } from './loaders/sesUnits.js';
import { setupCollapsible } from './ui/collapsible.js';
import { initSearch } from './ui/search.js';
import { updateActiveList } from './ui/activeList.js';
import { loadWaterwayCentres, showWaterwayCentres, hideWaterwayCentres } from './loaders/waterwaycent.js';

// Map init (uses global Leaflet script)
const mapInstance = L.map('map').setView([-37.8,144.9],8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap contributors'}).addTo(mapInstance);
setMap(mapInstance);

// Collapsibles
setupCollapsible('activeHeader','activeList',true);
setupCollapsible('showAllHeader','showAllList');
setupCollapsible('sesHeader','sesList');
setupCollapsible('lgaHeader','lgaList');
setupCollapsible('cfaHeader','cfaList');
setupCollapsible('ambulanceHeader','ambulanceList');

// Load data
loadPolygonCategory('ses','ses.geojson');
loadPolygonCategory('lga','LGAs.geojson');
loadPolygonCategory('cfa','cfa.geojson');
loadAmbulance();
loadSesUnits();

// Load waterway centrelines (but don't show by default)
loadWaterwayCentres();

// UI
initSearch();
updateActiveList();

// Add 'Show All Waterways Centreline' checkbox under ambulance in sidebar
window.addEventListener('DOMContentLoaded', () => {
	// No longer inject 'Show All Waterways Centreline' checkbox
});