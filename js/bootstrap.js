/**
 * @module bootstrap
 * Initialise Leaflet map, load data sources, and wire UI components.
 */
import { setMap, nameLabelMarkers, emphasised } from './state.js';
import { loadPolygonCategory } from './loaders/polygons.js';
import { loadAmbulance } from './loaders/ambulance.js';
import { loadPolice } from './loaders/police.js';
import { loadSesUnits } from './loaders/sesUnits.js';
import { loadSesFacilities } from './loaders/sesFacilities.js';
import { setupCollapsible } from './ui/collapsible.js';
import { initSearch } from './ui/search.js';
import { updateActiveList, beginActiveListBulk, endActiveListBulk } from './ui/activeList.js';
import { removeLabel } from './labels.js';
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
// Capture the default view to support a full UI reset
const DEFAULT_VIEW = { center: mapInstance.getCenter(), zoom: mapInstance.getZoom() };

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

// Reset handler: return the UI to a clean default starting state
window.addEventListener('sidebar-tool-click', async (ev) => {
	try {
		const detail = ev?.detail || {};
		if (detail.index !== 1 && detail.id !== 'sidebarBtn1') return;

		// Enter bulk mode to avoid churn in Active List during mass changes
		try { beginActiveListBulk(); } catch {}

		// 1) Clear global search and dropdown
		const input = document.getElementById('globalSidebarSearch');
		if (input) input.value = '';
		const dd = document.getElementById('sidebarSearchDropdown');
		if (dd) { dd.classList.remove('active'); dd.style.display = 'none'; dd.innerHTML = ''; }

		// 2) Hide weather box
		const wb = document.getElementById('weatherBox');
		if (wb) { wb.style.display = 'none'; wb.innerHTML = ''; }

		// 3a) Proactively clear all existing labels and emphasis, independent of list state
		;(['ses','lga','cfa','ambulance','police']).forEach(cat => {
			const bucket = nameLabelMarkers?.[cat] || {};
			Object.keys(bucket).forEach(key => {
				try { removeLabel(cat, key); } catch {}
				try { emphasised[cat][key] = false; } catch {}
			});
		});

		// 3b) Clear all row checkboxes without forcing lazy loads
			const listIds = ['sesList','lgaList','cfaList','ambulanceList','policeList'];
			listIds.forEach(listId => {
				const list = document.getElementById(listId);
				if (!list) return;
				list.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
					if (cb.checked) {
						cb.checked = false;
						cb.dispatchEvent(new Event('change', { bubbles: true }));
					}
				});
			});
		// 3c) Reflect group toggles visually as unchecked, but avoid dispatching change
			['toggleAllSES','toggleAllLGAs','toggleAllCFA','toggleAllAmbulance','toggleAllPolice'].forEach(id => {
				const el = document.getElementById(id);
				if (el) el.checked = false;
			});

		// 4) Clear the All Active UI then collapse sections
		try { updateActiveList(); } catch {}
		const sections = ['active','showAll','ses','lga','cfa','ambulance','police'];
		sections.forEach(key => {
			const header = document.getElementById(`${key}Header`);
			const list = document.getElementById(`${key}List`);
			if (header) header.classList.add('collapsed');
			if (list) list.style.display = 'none';
		});

		// 5) Ensure any optional overlays are hidden
		try { hideWaterwayCentres(); } catch {}

		// 6) Reset map view to default
		try { mapInstance.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom); } catch {}

		// 7) Ensure sidebar is expanded (default on desktops)
		try {
			const menu = document.getElementById('layerMenu');
			const btn = document.getElementById('sidebarToggle');
			if (menu && btn) {
				menu.classList.remove('sidebar-minimized');
				try { menu.inert = false; } catch {}
				btn.setAttribute('aria-expanded', 'true');
				btn.title = 'Hide panel';
				btn.textContent = '⏩';
			}
			localStorage.setItem('sidebarMinimized', '0');
		} catch {}

		// Exit bulk mode after the bulk of changes are complete
		try { endActiveListBulk(); } catch {}

		// Final safety sweep after UI settles (handles any late events)
		setTimeout(() => {
			try {
				;(['ses','lga','cfa','ambulance','police']).forEach(cat => {
					const bucket = nameLabelMarkers?.[cat] || {};
					Object.keys(bucket).forEach(key => {
						try { removeLabel(cat, key); } catch {}
						try { emphasised[cat][key] = false; } catch {}
					});
				});
			} catch {}
		}, 0);

		console.log('Reset to default starting state complete.');
	} catch (e) {
		console.error('Reset to defaults failed:', e);
	}
});

// Docs & Info: wiring for buttons #sidebarBtn2 (Docs) and #sidebarBtn3 (Info)
async function ensureMdDeps() {
	if (window.marked && window.DOMPurify) return;
	await Promise.all([
		new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }),
		new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); })
	]);
}

async function renderDoc(slug) {
	try {
		await ensureMdDeps();
		const resp = await fetch(`docs/${slug}.md`, { cache: 'no-cache' });
		const md = await resp.text();
		const html = window.DOMPurify.sanitize(window.marked.parse(md));
		const cont = document.getElementById('docsContent');
		if (cont) cont.innerHTML = html;
	} catch (e) {
		const cont = document.getElementById('docsContent');
		if (cont) cont.innerHTML = '<p style="color:#b00020">Failed to load documentation.</p>';
	}
}

function openDocs(slug) {
	const overlay = document.getElementById('docsOverlay');
	const drawer = document.getElementById('docsDrawer');
	if (overlay) overlay.hidden = false;
	if (drawer) drawer.hidden = false;
	if (slug) renderDoc(slug);
	const link = document.querySelector(`.docs-toc a[data-doc="${slug}"]`);
	if (link) {
		document.querySelectorAll('.docs-toc a').forEach(a => a.classList.remove('active'));
		link.classList.add('active');
	}
	const content = document.getElementById('docsContent');
	if (content) content.focus();
}

function closeDocs() {
	const overlay = document.getElementById('docsOverlay');
	const drawer = document.getElementById('docsDrawer');
	if (overlay) overlay.hidden = true;
	if (drawer) drawer.hidden = true;
}

function openInfo() {
	const overlay = document.getElementById('infoOverlay');
	const modal = document.getElementById('infoModal');
	if (overlay) overlay.hidden = false;
	if (modal) modal.hidden = false;
	const closeBtn = document.getElementById('infoClose');
	if (closeBtn) closeBtn.focus();
}

function closeInfo() {
	const overlay = document.getElementById('infoOverlay');
	const modal = document.getElementById('infoModal');
	if (overlay) overlay.hidden = true;
	if (modal) modal.hidden = true;
}

// Button event routing
window.addEventListener('sidebar-tool-click', (ev) => {
	const idx = ev?.detail?.index;
	if (idx === 3) { // Info
		openInfo();
	} else if (idx === 2) { // Docs
		const hash = (location.hash || '').toString();
		const m = hash.match(/^#docs\/(\w+)/);
		const slug = m ? m[1] : 'intro';
		openDocs(slug);
	}
});

// Overlay/close buttons and ESC handling
window.addEventListener('DOMContentLoaded', () => {
	const iClose = document.getElementById('infoClose');
	const dClose = document.getElementById('docsClose');
	const iOv = document.getElementById('infoOverlay');
	const dOv = document.getElementById('docsOverlay');
	if (iClose) iClose.addEventListener('click', closeInfo);
	if (iOv) iOv.addEventListener('click', closeInfo);
	if (dClose) dClose.addEventListener('click', closeDocs);
	if (dOv) dOv.addEventListener('click', closeDocs);
	// TOC clicks
	document.querySelectorAll('.docs-toc a[data-doc]').forEach(a => {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			const slug = a.getAttribute('data-doc');
			if (!slug) return;
			history.replaceState(null, '', `#docs/${slug}`);
			openDocs(slug);
		});
	});
});

window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		closeInfo();
		closeDocs();
	}
});