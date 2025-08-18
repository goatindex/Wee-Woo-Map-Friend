import { ensureLabel, removeLabel } from '../labels.js';
import { featureLayers, namesByCategory, nameToKey, emphasised, nameLabelMarkers, activeListFilter } from '../state.js';
import { categoryMeta, outlineColors } from '../config.js';


export function setupActiveListSync(category){
	namesByCategory[category].forEach(n=>{
		const key=nameToKey[category][n];
		const cb=document.getElementById(`${category}_${key}`);
		if(cb && !cb._bound){
			cb._bound=true;
			cb.addEventListener('change', updateActiveList);
		}
	});
}

export function updateActiveList(){
	const activeList=document.getElementById('activeList');
	if(!activeList) return;
	activeList.innerHTML='';

	// Header row with new columns
	const headerRow=document.createElement('div');
	headerRow.style.display='flex'; headerRow.style.alignItems='center'; headerRow.style.marginBottom='4px';
	// Spacer for remove button
	const spacer=document.createElement('span');
	spacer.style.width='32px';
	headerRow.appendChild(spacer);
	// Name header
	const nameHeader=document.createElement('span');
	nameHeader.textContent='Name';
	nameHeader.style.flex='1';
	nameHeader.style.textAlign='left';
	headerRow.appendChild(nameHeader);
	// Emphasise header
	const emphHeader=document.createElement('span');
	emphHeader.textContent='‼';
	emphHeader.title='Emphasise';
	emphHeader.style.display='flex';
	emphHeader.style.justifyContent='center';
	emphHeader.style.alignItems='center';
	emphHeader.style.width='32px';
	emphHeader.style.fontWeight='bold';
	headerRow.appendChild(emphHeader);
	// Show Name header
	const nameLabelHeader=document.createElement('span');
	nameLabelHeader.textContent='⁇';
	nameLabelHeader.title='Show Name';
	nameLabelHeader.style.display='flex';
	nameLabelHeader.style.justifyContent='center';
	nameLabelHeader.style.alignItems='center';
	nameLabelHeader.style.width='32px';
	nameLabelHeader.style.fontWeight='bold';
	headerRow.appendChild(nameLabelHeader);
	// 7/7 header
	const sevenHeader=document.createElement('span');
	sevenHeader.textContent='7/7';
	sevenHeader.title='7-day forecast/history';
	sevenHeader.style.display='flex';
	sevenHeader.style.justifyContent='center';
	sevenHeader.style.alignItems='center';
	sevenHeader.style.width='32px';
	sevenHeader.style.fontWeight='bold';
	headerRow.appendChild(sevenHeader);
	activeList.appendChild(headerRow);

	['ses','lga','cfa','ambulance'].forEach(cat=>addItems(cat, activeList));
}

function addItems(category, container) {
	const meta = categoryMeta[category];
	if (!namesByCategory[category] || !featureLayers[category]) return;
	namesByCategory[category].forEach(name => {
		const key = nameToKey[category][name];
		const cb = document.getElementById(`${category}_${key}`);
		if (!cb || !cb.checked) return; // Only show checked/visible items
	// ...existing code...
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
		nameSpan.textContent = name;
		nameSpan.style.flex = '1';
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
			setEmphasis(category, key, e.target.checked);
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
				import('../labels.js').then(({ ensureLabel }) => {
					ensureLabel(category, key, name, isPoint, layerOrMarker);
				});
			} else {
				import('../labels.js').then(({ removeLabel }) => {
					removeLabel(category, key);
				});
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
				import('../labels.js').then(({ ensureLabel }) => {
					ensureLabel(category, key, name, isPoint, layerOrMarker);
				});
			}
		}
		// 7/7 Weather checkbox (inline, right of ??)
		const sevenCell = document.createElement('span');
		sevenCell.style.display = 'flex';
		sevenCell.style.justifyContent = 'center';
		sevenCell.style.alignItems = 'center';
		sevenCell.style.width = '32px';
		const sevenCb = document.createElement('input');
		sevenCb.type = 'checkbox';
		sevenCb.className = 'sevenSevenCheckbox';
		sevenCb.title = 'Show 7-day forecast/history';
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

// Fetch and display 7-day forecast and history when checkbox is checked
import { WILLYWEATHER_API_KEY } from '../config.js';

async function fetchWeatherData(lat, lon) {
  // Replace with actual WillyWeather API endpoints and parameters
  const forecastUrl = `https://api.willyweather.com.au/v2/${WILLYWEATHER_API_KEY}/locations/${lat},${lon}/weather.json?forecasts=7days`;
  const historyUrl = `https://api.willyweather.com.au/v2/${WILLYWEATHER_API_KEY}/locations/${lat},${lon}/weather.json?history=7days`;
  const [forecastRes, historyRes] = await Promise.all([
    fetch(forecastUrl),
    fetch(historyUrl)
  ]);
  const forecastData = await forecastRes.json();
  const historyData = await historyRes.json();
  return { forecastData, historyData };
}

function renderWeatherBox(forecastData, historyData) {
  let html = '<h3>7-Day Weather Forecast</h3>';
  html += '<ul>';
  forecastData.days.forEach(day => {
    html += `<li>${day.date}: ${day.summary}</li>`;
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
import { setEmphasis } from '../emphasise.js';
