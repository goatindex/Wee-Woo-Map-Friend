// js/preloader.js
// Modular batched preloading for polygons and labels in sidebar order

const PRELOAD_ENABLED = true; // Toggle to enable/disable preloading

// Sidebar order: SES, LGA, CFA, Ambulance, Police, FRV
const preloadOrder = [
  { name: 'SES Areas', loader: () => window.loadPolygonCategory('ses', 'ses.geojson') },
  { name: 'SES Facilities', loader: () => window.loadSesFacilities() },
  { name: 'SES Units', loader: () => window.loadSesUnits() },
  { name: 'LGA Areas', loader: () => window.loadPolygonCategory('lga', 'LGAs.geojson') },
  { name: 'CFA Areas', loader: () => window.loadPolygonCategory('cfa', 'cfa.geojson') },
  { name: 'CFA Facilities', loader: () => window.loadCfaFacilities() },
  { name: 'Ambulance Stations', loader: () => window.loadAmbulance() },
  { name: 'FRV Boundaries', loader: () => window.loadPolygonCategory('frv', 'frv.geojson') }
  // Note: Police is lazy-loaded when needed (see bootstrap.js)
];

function showLoadingSpinner() {
  // Add spinner to DOM (simple example)
  let spinner = document.createElement('div');
  spinner.id = 'preload-spinner';
  spinner.innerText = 'Loading map data...';
  spinner.style = 'position:fixed;top:10px;right:10px;background:#fff;padding:8px;border-radius:4px;z-index:9999;box-shadow:0 2px 8px #0002;';
  document.body.appendChild(spinner);
}

function hideLoadingSpinner() {
  let spinner = document.getElementById('preload-spinner');
  if (spinner) spinner.remove();
}

async function loadLayer(loaderFn, name, onProgress, onComplete) {
  try {
    let spinner = document.getElementById('preload-spinner');
    if (spinner) spinner.innerText = `Loading ${name}...`;
    
    await loaderFn();
    onComplete && onComplete();
  } catch (err) {
    console.error(`Preloader load error for ${name}:`, err);
    onComplete && onComplete();
  }
}

window.startPreloading = function() {
  if (!PRELOAD_ENABLED) return;
  showLoadingSpinner();
  let current = 0;
  function nextLayer() {
    if (current >= preloadOrder.length) {
      hideLoadingSpinner();
      return;
    }
    const { name, loader } = preloadOrder[current];
    loadLayer(
      loader,
      name,
      null,
      () => {
        current++;
        setTimeout(nextLayer, 50); // Small delay between layers
      }
    );
  }
  nextLayer();
}

// Usage: Call startPreloading() from bootstrap.js on page load
