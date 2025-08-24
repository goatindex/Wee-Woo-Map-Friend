/**
 * @module bootstrap
 * Initialise Leaflet map, load data sources, and wire UI components.
 */
import { setMap } from './state.js';
import { loadPolygonCategory } from './loaders/polygons.js';
import { loadAmbulance } from './loaders/ambulance.js';
import { loadPolice } from './loaders/police.js';
import { loadSesUnits } from './loaders/sesUnits.js';
import { loadSesFacilities } from './loaders/sesFacilities.js';
import { setupCollapsible } from './ui/collapsible.js';
import { initSearch } from './ui/search.js';
import { updateActiveList } from './ui/activeList.js';
import { loadWaterwayCentres, showWaterwayCentres, hideWaterwayCentres } from './loaders/waterwaycent.js';
import { setupOfflineListener } from './utils/errorUI.js';
import { outlineColors, categoryMeta, headerColorAdjust, adjustHexColor } from './config.js';

// Map init (uses global Leaflet script)
const mapInstance = L.map('map', {
	zoomSnap: 0.333,
	zoomDelta: 0.333,
	preferCanvas: true
}).setView([-37.8,144.9],7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'&copy; OpenStreetMap contributors'}).addTo(mapInstance);
setMap(mapInstance);

// Create panes to control z-order (bottom -> top): LGA, CFA, SES, Ambulance
(() => {
	const panes = [
		['lga', 400],
		['cfa', 410],
		['ses', 420],
		['ambulance', 430],
		['police', 440]
	];
	panes.forEach(([name, z]) => {
		mapInstance.createPane(name);
		mapInstance.getPane(name).style.zIndex = String(z);
	});
})();

// Collapsibles
// Start All Active collapsed; it will auto-expand when the first item is added
setupCollapsible('activeHeader','activeList',false);
setupCollapsible('showAllHeader','showAllList');
setupCollapsible('sesHeader','sesList');
setupCollapsible('lgaHeader','lgaList');
setupCollapsible('cfaHeader','cfaList');
setupCollapsible('policeHeader','policeList');
setupCollapsible('ambulanceHeader','ambulanceList');

// Harden: align outlineColors with each category's styleFn color (prevents drift)
(() => {
	['ses','lga','cfa'].forEach(cat => {
		try {
			const fn = categoryMeta?.[cat]?.styleFn;
			if (typeof fn === 'function') {
				const style = fn();
				if (style && style.color) {
					outlineColors[cat] = style.color;
				}
			}
		} catch {}
	});
})();

// Color category headers to match their outline colors
(() => {
	const headerToCategory = {
		sesHeader: 'ses',
		lgaHeader: 'lga',
		cfaHeader: 'cfa',
		ambulanceHeader: 'ambulance',
		policeHeader: 'police'
	};
		Object.entries(headerToCategory).forEach(([id, cat]) => {
		const el = document.getElementById(id);
		if (el) {
			el.classList.add('category-header');
				const base = outlineColors[cat];
				const factor = headerColorAdjust[cat] ?? 1.0;
				el.style.color = adjustHexColor(base, factor);
				const arrow = el.querySelector('.collapse-arrow');
				if (arrow) arrow.style.color = adjustHexColor(base, Math.max(0, factor - 0.1));
		}
	});
})();

// Load data
loadPolygonCategory('ses','ses.geojson');
loadPolygonCategory('lga','LGAs.geojson');
loadPolygonCategory('cfa','cfa.geojson');
loadSesFacilities();
loadAmbulance();
// Lazy-load Police: load only when needed (expand section or use Show All toggle)
// Do not load here to keep initial render snappy.
loadSesUnits();

// Lazy-load triggers for Police
let _policeLoaded = false;
async function ensurePoliceLoaded(){
	if (_policeLoaded) return;
	try {
		await loadPolice();
		_policeLoaded = true;
	} catch (e) { console.error('Police load failed:', e); }
}

// 1) When user expands the Police section
(() => {
	const header = document.getElementById('policeHeader');
	const list = document.getElementById('policeList');
	if (!header || !list) return;
	header.addEventListener('click', () => {
		// Run after collapsible toggles display state
		setTimeout(() => {
			if (list.style.display !== 'none') ensurePoliceLoaded();
		}, 0);
	});
})();

// 2) When user toggles Show All Police Stations
(() => {
	const toggle = document.getElementById('toggleAllPolice');
	if (!toggle) return;
	// Prime loader on first interaction, then replay the event so loader's own handler runs
	const onFirstChange = async (ev) => {
		toggle.removeEventListener('change', onFirstChange);
		const desired = toggle.checked;
		await ensurePoliceLoaded();
		// Re-dispatch to apply group toggle with loader-bound handler
		toggle.checked = desired;
		toggle.dispatchEvent(new Event('change', { bubbles: true }));
	};
	toggle.addEventListener('change', onFirstChange);
})();

// Load waterway centrelines (but don't show by default)
loadWaterwayCentres();

// UI
initSearch();
updateActiveList();

// Sidebar minimize/expand toggle (mobile-friendly)
window.addEventListener('DOMContentLoaded', () => {
	const menu = document.getElementById('layerMenu');
	if (!menu) return;
	let btn = document.getElementById('sidebarToggle');
		if (!btn) {
			btn = document.createElement('button');
			btn.id = 'sidebarToggle';
			btn.className = 'sidebar-toggle';
			btn.type = 'button';
			btn.setAttribute('aria-controls', 'layerMenu');
			btn.setAttribute('aria-expanded', 'true');
			btn.title = 'Hide panel';
			btn.textContent = '⏩';
			// Append to body so transforms on the sidebar don't affect it
			document.body.appendChild(btn);
		}
	// Restore persisted state or default-minimize on small screens
	try {
		const saved = localStorage.getItem('sidebarMinimized');
		const shouldMinimize = saved === '1' || (saved === null && window.innerWidth < 768);
		if (shouldMinimize) {
			menu.classList.add('sidebar-minimized');
				// Disable focus/keyboard inside menu when minimized
				try { menu.inert = true; } catch {}
			btn.setAttribute('aria-expanded', 'false');
			btn.title = 'Show panel';
			btn.textContent = '⏪';
		}
	} catch {}
	btn.addEventListener('click', () => {
		const minimized = menu.classList.toggle('sidebar-minimized');
		const expanded = !minimized;
			// Toggle inert (focus/keyboard) safety when minimized
			try { menu.inert = minimized; } catch {}
		btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		btn.title = expanded ? 'Hide panel' : 'Show panel';
		btn.textContent = expanded ? '⏩' : '⏪';
		try { localStorage.setItem('sidebarMinimized', minimized ? '1' : '0'); } catch {}
	});

	// Attach inert click handlers to sidebar tool buttons (1, 2, 3)
	['sidebarBtn1','sidebarBtn2','sidebarBtn3'].forEach((id, idx) => {
		const el = document.getElementById(id);
		if (!el || el._bound) return;
		el._bound = true;
		el.addEventListener('click', () => {
			console.log(`Sidebar tool ${idx + 1} clicked`);
			window.dispatchEvent(new CustomEvent('sidebar-tool-click', { detail: { index: idx + 1, id } }));
		});
	});
});

setupOfflineListener();