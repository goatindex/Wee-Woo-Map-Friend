# mapexp.github.io

Demonstration of displaying a polygon layer from the Victorian SES Response Boundaries service using Leaflet and Esri Leaflet.

Open `index.html` in a browser or publish this repository with GitHub Pages to view the map.

## Setup

1. Clone the repository and open the folder in VS Code.
2. Open `index.html` in your browser, or use GitHub Pages to publish.
3. Ensure all required GeoJSON files are present in the root directory.

## Usage

# mapexp.github.io

Demonstration of displaying a polygon layer from the Victorian SES Response Boundaries service using Leaflet and Esri Leaflet.

Open `index.html` in a browser or publish this repository with GitHub Pages to view the map.

## Setup

1. Clone the repository and open the folder in VS Code.
2. Open `index.html` in your browser, or use GitHub Pages to publish.
3. Ensure all required GeoJSON files are present in the root directory.

## Usage

- The sidebar allows you to toggle SES, LGA, CFA, and Ambulance layers.
- Use the 'Show Name' and 'Emphasise' checkboxes to control map labels and highlight features.
- Error messages will appear in the sidebar if data fails to load or you are offline.

## Troubleshooting

- If the map or sidebar does not display, check the browser console for errors.
- Ensure all JS and CSS files are loaded correctly and paths are correct.
- If you see an offline message, reconnect and reload the page.

## Contributing

- Follow the coding and documentation standards in `copilot-instructions.md`.
- Use ESLint and Prettier for code consistency.
- Add JSDoc comments for new functions and modules.
- Test changes in the browser and check for errors before committing.

## Example Workflow

1. Make code changes in a feature branch.
2. Run ESLint and Prettier to check formatting.
3. Test in the browser and verify sidebar/map functionality.
4. Commit with a descriptive message and open a pull request.

## Weather integration (WillyWeather + alternatives)

Weather is fetched via a backend proxy and normalized for the UI.

- Docs first: https://www.willyweather.com.au/api/docs/index.html
- For dev without keys, use the mock provider (default) or Open‑Meteo.

Providers

- mock: safe, deterministic data (default in dev)
- open-meteo: real 7‑day temps/summaries, no key
- willyweather: real 7‑day daily precis/min/max (requires API key)

Provider selection

- Default via backend `.env`: `WEATHER_PROVIDER=mock|open-meteo|willyweather`
- Per-request override: add `&provider=open-meteo` or `&provider=willyweather` to the backend URL
- Frontend dev override: `localStorage.setItem('weatherProvider','open-meteo')` (remove with `localStorage.removeItem('weatherProvider')`)

WillyWeather flow (per docs)

1. Search nearest location by coordinates:
   - https://www.willyweather.com.au/api/docs/search.html#location-get-search-by-coordinates
   - `GET /v2/{api key}/search.json` with header `x-payload` JSON: `{ lat, lng, range, units }`
2. Fetch daily weather for that location id:
   - https://www.willyweather.com.au/api/docs/weather.html#forecast-get-weather
   - `GET /v2/{api key}/locations/{location id}/weather.json` with header `x-payload` JSON: `{ forecasts: ["weather"], days }`

Security

- Do NOT expose your WillyWeather API key in the frontend. Use the backend proxy and `.env`.

## 7/7 Checkbox (All Active)

The "All Active" section includes a 7/7 checkbox next to each active item. When checked, the app fetches and displays a 7‑day weather forecast for that location via the backend proxy.

- Each row must include `data-lat` and `data-lon` attributes for coordinates.
- The info box appears in the bottom-left.

Example

```html
<div class="active-list-row" data-lat="-37.8136" data-lon="144.9631">Melbourne ...</div>
```

## Backend proxy (for API keys and weather)

To securely call 3rd‑party APIs (WillyWeather, Open‑Meteo, etc.) without exposing keys in the frontend, a minimal Flask backend is provided in `backend/`.

- Location: `backend/app.py`, `backend/requirements.txt`, `backend/.env.example`.
- Features: CORS for dev, env‑based secrets, mock responses by default, simple in‑memory cache, request timeouts, provider model (mock, open‑meteo, willyweather).

### Quick start (Windows PowerShell)

```powershell
# 1) Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2) Install backend deps
pip install -r backend\requirements.txt

# 3) Copy .env example and set your keys
Copy-Item backend\.env.example backend\.env
# then edit backend\.env to add WILLYWEATHER_API_KEY (if using it), set USE_MOCK=1 for safe testing

# 4) Run the backend
$env:FLASK_APP = "backend/app.py"
python backend/app.py
# API available at http://127.0.0.1:5000

# 5) Serve the frontend in another terminal (example using Python HTTP server)
# From repo root:
python -m http.server 8000
```

### Frontend usage

Call your backend from the frontend instead of third‑party APIs:

```js
fetch('http://127.0.0.1:5000/api/weather?lat=-37.81&lon=144.96&days=7')
  .then((r) => r.json())
  .then((data) => console.log(data));
// Optional: add &provider=open-meteo or &provider=willyweather for real data in dev
```

### Notes

- In production, don’t commit `.env`; set real env vars on the host.
- This backend returns mock data unless `USE_MOCK=0` and/or you pass a real provider via `?provider=...`.
- WillyWeather provider follows the docs (coordinate search → location id → daily weather).

## Backend proxy configuration (.env) and allowed origins

Use a `.env` file in `backend/` to configure the proxy. Do not commit secrets.

- `WILLYWEATHER_API_KEY`: Your WillyWeather API key (leave empty with `USE_MOCK=1` for safe testing).
- `ALLOWED_ORIGINS`: Comma‑separated list of frontend origins allowed to call the backend (CORS).
- `USE_MOCK`: `1` (default) to return mock data, `0` to call real providers by default.
- `CACHE_TTL_SECONDS`: In‑memory cache TTL in seconds (default 300).
- `REQUEST_TIMEOUT`: Upstream request timeout in seconds (default 5).
- `WEATHER_PROVIDER`: Default provider `mock|open-meteo|willyweather`.

Example `.env` configurations

Local development (127.0.0.1)

```env
WILLYWEATHER_API_KEY=
ALLOWED_ORIGINS=http://127.0.0.1:8000
USE_MOCK=1
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
WEATHER_PROVIDER=mock
```

Local development (localhost)

```env
WILLYWEATHER_API_KEY=
ALLOWED_ORIGINS=http://localhost:8000
USE_MOCK=1
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
WEATHER_PROVIDER=mock
```

Local development (support both 127.0.0.1 and localhost)

```env
WILLYWEATHER_API_KEY=
ALLOWED_ORIGINS=http://127.0.0.1:8000,http://localhost:8000
USE_MOCK=1
CACHE_TTL_SECONDS=300
REQUEST_TIMEOUT=5
WEATHER_PROVIDER=mock
```

GitHub Pages (production)

```env
# Use your real key in production
WILLYWEATHER_API_KEY=YOUR_REAL_KEY
# Update to your actual site origin
ALLOWED_ORIGINS=https://mapexp.github.io
USE_MOCK=0
CACHE_TTL_SECONDS=600
REQUEST_TIMEOUT=8
WEATHER_PROVIDER=willyweather
```

Custom domain (production)

```env
WILLYWEATHER_API_KEY=YOUR_REAL_KEY
ALLOWED_ORIGINS=https://your.domain.example
USE_MOCK=0
CACHE_TTL_SECONDS=600
REQUEST_TIMEOUT=8
WEATHER_PROVIDER=willyweather
```

Notes

- CORS checks the full origin (scheme + host + port). Ensure it matches how you open the site (e.g., `http://127.0.0.1:8000` vs `http://localhost:8000`).
- After changing `.env`, restart the backend (`python backend/app.py`).
- In dev, the frontend fetches `http://127.0.0.1:5000/api/weather?lat=..&lon=..&days=7` (add `&provider=open-meteo` or `&provider=willyweather`).
- In production, deploy the backend under the same domain as the frontend (recommended) or configure `ALLOWED_ORIGINS` accordingly.

## Frontend default provider and fallback

- The UI defaults to WillyWeather for the 7/7 forecast box.
- If WillyWeather is unavailable (key, quota, or network), it automatically falls back to Open‑Meteo so a forecast still appears.
- To override locally in your browser:
   - Force WillyWeather: `localStorage.setItem('weatherProvider','willyweather')`
   - Force Open‑Meteo: `localStorage.setItem('weatherProvider','open-meteo')`
   - Clear override: `localStorage.removeItem('weatherProvider')`

## Coordinate conversion (proj4)

Some data uses MGA94 Zone 55 (EPSG:28355). The app converts to WGS84 using proj4 in `js/utils/coordConvert.js`.

- Proj4 is included via CDN in `index.html`:
   - `<script src="https://cdn.jsdelivr.net/npm/proj4@2.9.2/dist/proj4.min.js"></script>`
- If you see “proj4 library is not loaded…”, hard‑reload (Ctrl+F5). Ensure you’re serving the site (e.g., `python -m http.server 8000`) and opening `http://127.0.0.1:8000`.
- `convertMGA94ToLatLon(x, y)` returns `[lon, lat]` and logs a helpful error if proj4 is missing.

## UI test tip

After starting the backend and static server, open http://127.0.0.1:8000 and hard‑reload (Ctrl+F5) to make sure all scripts (including proj4) are loaded before testing the 7/7 checkbox.

## Troubleshooting (dev)

- ERR_CONNECTION_REFUSED to `http://127.0.0.1:5000`: start the backend with `python backend/app.py` in another terminal and verify `GET /health`.
- “proj4 library is not loaded”: the CDN may not have loaded yet—hard‑reload (Ctrl+F5). Make sure you’re serving via `http.server` and not opening the HTML file directly.

## One-command dev setup

Use the PowerShell script `scripts/dev-up.ps1` to spin up the local backend and frontend with version and health checks.

Examples (from repo root):

```powershell
# Default ports: backend 5000, frontend 8000
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

# Custom ports
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -BackendPort 5001 -FrontendPort 8001

# Skip pip install (faster when deps are already installed)
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -NoInstall

# Stop previously started processes
powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1 -Stop
```

What it does:
- Ensures `.venv` exists (creates it if missing) and prints Python/pip/package versions.
- Installs backend requirements (unless `-NoInstall`).
- Ensures `backend/.env` exists (copies from example if present).
- Starts the Flask backend and checks `GET /health`.
- Starts a static server and checks `GET /index.html`.

## Documentation conventions

This project uses lightweight, non-invasive documentation that does not affect runtime:

- JavaScript JSDoc
   - Core typedefs live inline in modules:
      - `js/config.js`: `CategoryMeta`, style function return types, `categoryMeta` map.
      - `js/state.js`: shared maps (`FeatureLayersMap`, `NamesByCategoryMap`, `NameToKeyMap`, `EmphasisedMap`, `NameLabelMarkersMap`).
   - Function JSDoc has been added to exported functions across loaders (`js/loaders/*.js`), UI modules (`js/ui/*.js`), and helpers (`js/labels.js`, `js/emphasise.js`, `js/polygonPlus.js`, `js/utils/*.js`).
   - Optional static checking: you may enable TypeScript-style checks per file by adding `// @ts-check` at the very top of a module (start with low-risk files like `js/utils.js`, `js/state.js`, `js/config.js`). Address any hints surfaced by your editor over time. This is optional and purely for developer ergonomics.

- Python docstrings
   - `backend/app.py` includes a module docstring and docstrings for endpoints and helper functions.
   - Utility scripts (`update-last-updated.py`, `getLGAnames.py`, `getSESRZnames.py`) include concise module docstrings describing purpose and usage.

- PowerShell help
   - `scripts/dev-up.ps1` includes comment-based help (Synopsis, Description, Parameters, Examples). View in an editor or with `Get-Help` (if your environment is configured for script help).

Notes
- These additions are comments only—there are no behavior changes, and build/runtime remain unaffected.
