/**
 * @module ui/activeList
 * Build and maintain the "All Active" sidebar section.
 */
// ...existing code...

// Bulk update guard to avoid repeatedly rebuilding the list on mass toggles
let _bulkActive = false;
let _bulkPending = false;

window.beginActiveListBulk = function(){
	_bulkActive = true;
}

window.endActiveListBulk = function(){
	_bulkActive = false;
	const pending = _bulkPending;
	_bulkPending = false;
	if (pending) updateActiveList();
}


/**
 * Safely get the actual checkbox element for a given category/key.
 * Handles cases where the row and the input share the same id (duplicate IDs).
 * @param {string} category
 * @param {string} key
 * @returns {HTMLInputElement|null}
 */
function getCategoryCheckbox(category, key){
	const id = `${category}_${key}`;
	const el = document.getElementById(id);
	if (!el) return document.querySelector(`input#${id}`);
	if (el.tagName === 'INPUT') return /** @type {HTMLInputElement} */ (el);
	const inside = el.querySelector('input[type="checkbox"]');
	if (inside) return /** @type {HTMLInputElement} */ (inside);
	return document.querySelector(`input#${id}`);
}


/**
 * Attach change listeners to a category's checkboxes so the active list reflects UI state.
 * @param {'ses'|'lga'|'cfa'|'ambulance'|'police'|'frv'} category
 */
window.setupActiveListSync = function(category){
	namesByCategory[category].forEach(n=>{
		const key=nameToKey[category][n];
	const cb=getCategoryCheckbox(category, key);
		if(cb && !cb._bound){
			cb._bound=true;
			cb.addEventListener('change', updateActiveList);
		}
	});
}

/**
 * Rebuild the active list UI from current checked items in all categories.
 */
window.updateActiveList = function(){
	if (_bulkActive) { _bulkPending = true; return; }
	const activeList=document.getElementById('activeList');
	if(!activeList) return;
	activeList.innerHTML='';

	// Header row with new columns
	const headerRow=document.createElement('div');
	headerRow.className='active-list-header';
	headerRow.style.display='flex'; headerRow.style.alignItems='center'; headerRow.style.marginBottom='4px';
	// Spacer for remove button
	const spacer=document.createElement('span');
	spacer.style.width='32px';
	headerRow.appendChild(spacer);
	// Name header
	const nameHeader=document.createElement('span');
	nameHeader.textContent='Name';
	nameHeader.className='active-list-name-header';
	nameHeader.style.flex='1';
	nameHeader.style.textAlign='left';
	headerRow.appendChild(nameHeader);
	// Emphasise header
	const emphHeader=document.createElement('span');
	emphHeader.textContent='📢';
	emphHeader.title='Emphasise';
	emphHeader.style.display='flex';
	emphHeader.style.justifyContent='center';
	emphHeader.style.alignItems='center';
	emphHeader.style.width='32px';
	emphHeader.style.fontWeight='bold';
	emphHeader.classList.add('active-list-icon-header');
	headerRow.appendChild(emphHeader);
	// Show Name header
	const nameLabelHeader=document.createElement('span');
	nameLabelHeader.textContent='🏷️';
	nameLabelHeader.title='Show Name';
	nameLabelHeader.style.display='flex';
	nameLabelHeader.style.justifyContent='center';
	nameLabelHeader.style.alignItems='center';
	nameLabelHeader.style.width='32px';
	nameLabelHeader.style.fontWeight='bold';
	nameLabelHeader.classList.add('active-list-icon-header');
	headerRow.appendChild(nameLabelHeader);
	// 7/7 header
	const sevenHeader=document.createElement('span');
	sevenHeader.textContent='🌦️';
	sevenHeader.title='7-day weather';
	sevenHeader.style.display='flex';
	sevenHeader.style.justifyContent='center';
	sevenHeader.style.alignItems='center';
	sevenHeader.style.width='32px';
	sevenHeader.style.fontWeight='bold';
	sevenHeader.classList.add('active-list-icon-header');
	headerRow.appendChild(sevenHeader);
	activeList.appendChild(headerRow);

	// Populate rows
	['ses','lga','cfa','ambulance','police','frv'].forEach(cat=>addItems(cat, activeList));

	// If no rows, remove header to reduce visual noise and keep collapsed
	const headerEl = document.getElementById('activeHeader');
	if (activeList.children.length === 1) { // only header present
		activeList.innerHTML = '';
		if (headerEl) headerEl.classList.add('collapsed');
		activeList.style.display = 'none';
	} else {
		// There are items; ensure section is expanded
		if (headerEl) headerEl.classList.remove('collapsed');
		activeList.style.display = '';
	}
}

/**
 * Append visible items for a given category to the active list container.
 * Populates row metadata (lat/lon for polygons) used by the weather box feature.
 * @param {'ses'|'lga'|'cfa'|'ambulance'|'police'|'frv'} category
 * @param {HTMLElement} container
 */
function addItems(category, container) {
	const meta = categoryMeta[category];
	if (!namesByCategory[category] || !featureLayers[category]) return;
	namesByCategory[category].forEach(name => {
		const key = nameToKey[category][name];
	const cb = getCategoryCheckbox(category, key);
		if (!cb || !cb.checked) return; // Only show checked/visible items
		const row = document.createElement('div');
		row.className = 'active-list-row';
		row.style.display = 'flex';
		row.style.alignItems = 'center';
		row.style.marginBottom = '2px';
		// Set lat/lon for polygons
		if (meta.type === 'polygon' && featureLayers[category][key] && featureLayers[category][key][0]) {
			const layer = featureLayers[category][key][0];
			if (layer && layer.getBounds) {
				const center = layer.getBounds().getCenter();
				row.dataset.lat = center.lat;
				row.dataset.lon = center.lng;
			}
		}
		// Remove (red X) button
		const removeBtn = document.createElement('button');
		removeBtn.textContent = '✖';
		removeBtn.title = 'Remove from active';
		removeBtn.style.color = '#d32f2f';
		removeBtn.style.background = 'none';
		removeBtn.style.border = 'none';
		removeBtn.style.fontSize = '1.2em';
		removeBtn.style.cursor = 'pointer';
		removeBtn.style.width = '32px';
		removeBtn.style.margin = '0 2px 0 0';
		removeBtn.onclick = () => {
			cb.checked = false;
			cb.dispatchEvent(new Event('change', { bubbles: true }));
			updateActiveList();
		};
		row.appendChild(removeBtn);
		// Name
		const nameSpan = document.createElement('span');
		nameSpan.classList.add('active-list-name');
		// Use formatted name for ambulance
				if (category === 'ambulance') {
			nameSpan.textContent = formatAmbulanceName(name);
				} else if (category === 'police') {
					nameSpan.textContent = formatPoliceName(name);
		} else {
			nameSpan.textContent = name;
		}
		nameSpan.style.flex = '1';
		// Set color to match polygon border (with optional adjustment)
		const baseColor = outlineColors[category];
		const factor = labelColorAdjust[category] ?? 1.0;
		nameSpan.style.color = adjustHexColor(baseColor, factor);
		row.appendChild(nameSpan);
		// Emphasise toggle
		const emphCell = document.createElement('span');
		emphCell.style.display = 'flex';
		emphCell.style.justifyContent = 'center';
		emphCell.style.alignItems = 'center';
		emphCell.style.width = '32px';
		const emphCb = document.createElement('input');
		emphCb.type = 'checkbox';
		emphCb.checked = !!emphasised[category][key];
		emphCb.title = 'Emphasise';
		emphCb.style.width = '18px';
		emphCb.style.height = '18px';
		emphCb.style.margin = '0';
		emphCb.addEventListener('change', e => {
		setEmphasis(category, key, e.target.checked, categoryMeta[category]?.type === 'point');
			updateActiveList();
		});
		emphCell.appendChild(emphCb);
		row.appendChild(emphCell);
		// Show Name toggle
		const labelCell = document.createElement('span');
		labelCell.style.display = 'flex';
		labelCell.style.justifyContent = 'center';
		labelCell.style.alignItems = 'center';
		labelCell.style.width = '32px';
		const labelCb = document.createElement('input');
		labelCb.type = 'checkbox';
		// Default: checked when first added
		labelCb.checked = true;
		labelCb.title = 'Show Name';
		labelCb.style.width = '18px';
		labelCb.style.height = '18px';
		labelCb.style.margin = '0';
		labelCb.addEventListener('change', e => {
			if (e.target.checked) {
				let layerOrMarker = null;
				let isPoint = (meta.type === 'point');
				if (isPoint) {
					layerOrMarker = featureLayers[category][key];
				} else {
					layerOrMarker = featureLayers[category][key] && featureLayers[category][key][0];
				}
				window.ensureLabel(category, key, name, isPoint, layerOrMarker);
			} else {
				window.removeLabel(category, key);
			}
		});
		labelCell.appendChild(labelCb);
		row.appendChild(labelCell);
		// After checkbox is added, if checked, show label
		if (labelCb.checked) {
			let layerOrMarker = null;
			let isPoint = (meta.type === 'point');
			if (isPoint) {
				layerOrMarker = featureLayers[category][key];
			} else {
				layerOrMarker = featureLayers[category][key] && featureLayers[category][key][0];
			}
			if (layerOrMarker) {
				window.ensureLabel(category, key, name, isPoint, layerOrMarker);
			}
		}
		// 7/7 Weather checkbox (inline, right of label toggle)
		const sevenCell = document.createElement('span');
		sevenCell.style.display = 'flex';
		sevenCell.style.justifyContent = 'center';
		sevenCell.style.alignItems = 'center';
		sevenCell.style.width = '32px';
		const sevenCb = document.createElement('input');
		sevenCb.type = 'checkbox';
		sevenCb.className = 'sevenSevenCheckbox';
	sevenCb.title = 'Show 7-day weather';
		sevenCb.style.width = '18px';
		sevenCb.style.height = '18px';
		sevenCb.style.margin = '0';
		sevenCb.addEventListener('change', async (e) => {
			if (e.target.checked) {
				document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
					if (cb !== sevenCb) cb.checked = false;
				});
				const lat = row.dataset.lat;
				const lon = row.dataset.lon;
				if (lat && lon && meta.type === 'polygon') {
					// Show loading state while fetching
					weatherBox.innerHTML = '<div style="display:flex;gap:8px;align-items:center"><span>Loading weather…</span><span class="spinner" style="width:12px;height:12px;border:2px solid #ccc;border-top-color:#333;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite"></span></div>';
					weatherBox.style.display = 'block';
					try {
						const { forecastData, historyData } = await fetchWeatherData(lat, lon);
						renderWeatherBox(forecastData, historyData);
					} catch (err) {
						weatherBox.innerHTML = '<span style="color:red">Error loading weather data.</span>';
						weatherBox.style.display = 'block';
					}
				} else {
					weatherBox.style.display = 'none';
				}
			} else {
				weatherBox.style.display = 'none';
			}
		});
		sevenCell.appendChild(sevenCb);
		row.appendChild(sevenCell);
		container.appendChild(row);
	});
}

// Add 7/7 checkbox to All Active header

// Create bottom-left info box for weather data
let weatherBox = document.getElementById('weatherBox');
if (!weatherBox) {
  weatherBox = document.createElement('div');
  weatherBox.id = 'weatherBox';
  weatherBox.style.position = 'fixed';
  weatherBox.style.left = '20px';
  weatherBox.style.bottom = '20px';
  weatherBox.style.width = '320px';
  weatherBox.style.maxHeight = '60vh';
  weatherBox.style.overflowY = 'auto';
  weatherBox.style.background = 'rgba(255,255,255,0.95)';
  weatherBox.style.border = '1px solid #ccc';
  weatherBox.style.borderRadius = '8px';
  weatherBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  weatherBox.style.zIndex = '9999';
  weatherBox.style.padding = '16px';
  weatherBox.style.display = 'none';
  document.body.appendChild(weatherBox);
}

// Fetch and display 7-day forecast via backend proxy
async function fetchWeatherData(lat, lon) {
	const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
		? 'http://127.0.0.1:5000'
		: '';
	// Default provider is WillyWeather; allow override via localStorage('weatherProvider').
	const chosenProvider = (typeof localStorage !== 'undefined' && (localStorage.getItem('weatherProvider') || 'willyweather')) || 'willyweather';
	const makeUrl = (prov) => `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(prov)}`;
	let data;
	try {
		const res = await fetch(makeUrl(chosenProvider));
		if (!res.ok) throw new Error(`Weather API error ${res.status}`);
		data = await res.json();
	} catch (e) {
		// Fallback: if WillyWeather fails (e.g., quota/key), try Open‑Meteo silently.
		if (chosenProvider === 'willyweather') {
			const res2 = await fetch(makeUrl('open-meteo'));
			if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
			data = await res2.json();
		} else {
			throw e;
		}
	}
	// Normalize to the structure expected by renderWeatherBox
	const days = (data.forecast || []).map((d, i) => ({
		date: `Day ${i + 1}`,
		summary: d.summary ?? '—',
		tempMin: d.tempMin,
		tempMax: d.tempMax
	}));
	const forecastData = { days };
	const historyData = { days: [] };
	return { forecastData, historyData };
}

function renderWeatherBox(forecastData, historyData) {
  let html = '<h3>7-Day Weather Forecast</h3>';
  html += '<ul>';
  forecastData.days.forEach(day => {
	const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
	const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
	html += `<li>${day.date}: ${day.summary}${tmin}${tmax}</li>`;
  });
  html += '</ul>';
  html += '<h3>Past 7 Days</h3>';
  html += '<ul>';
  historyData.days.forEach(day => {
    html += `<li>${day.date}: ${day.summary}</li>`;
  });
  html += '</ul>';
  weatherBox.innerHTML = html;
  weatherBox.style.display = 'block';
}

// Listen for checkbox changes
// ...existing code...
