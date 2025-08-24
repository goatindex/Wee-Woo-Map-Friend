## WeeWoo Map Friend

An interactive Leaflet.js web map for Victoria emergency layers (SES, LGA, CFA, Ambulance, Police).

Open `index.html` locally or publish with GitHub Pages to view the map.

## Features

- Sidebar with collapsible sections for each layer category
- Global search across all layers
- “All Active” list with controls:
  - 📢 Emphasise, 🏷️ Show Name, 🌦️ 7‑day Weather
- Reset to defaults (♻️)
- Information (ℹ️) modal and Documentation (📚) drawer with TOC
- Performance: Leaflet panes and canvas rendering for polygons; lazy‑load Police

## Architecture overview

- Entry point: `js/bootstrap.js` — map init, panes, collapsibles, wiring, lazy‑loads
- State: `js/state.js` — shared maps (layers, names, emphasis, labels)
- Config: `js/config.js` — styles, category metadata, colors
- Loaders: `js/loaders/*.js` — fetch/parse data and create sidebar rows
- UI: `js/ui/*.js` — “All Active”, collapsible behavior, search
- Labels/Emphasis: `js/labels.js`, `js/emphasise.js`
- Utils: `js/utils/*.js` — DOM helpers, coord conversion, error UI
- Docs/Info UI: in `index.html` + styles and handlers in `css/styles.css`, `js/bootstrap.js`

Event flow (typical):

1. Loader builds sidebar rows → 2) User checks a row → 3) Change handler adds/removes layers, labels, emphasis → 4) `updateActiveList()` rebuilds “All Active”.

## Development

Quick start (static front‑end):

1. Serve the folder (e.g., `python -m http.server 8000`)
2. Open http://127.0.0.1:8000

Weather backend (optional): see “Backend proxy” below.

One‑command dev helper: `scripts/dev-up.ps1` (starts backend + static server with checks).

## Docs and Info panels

- ℹ️ Info: single‑page modal; content lives in `index.html` (editable)
- 📚 Docs: right drawer; Markdown files in `docs/` rendered with Marked + DOMPurify
- Deep links: `#docs/intro`, `#docs/usage`, `#docs/layers`
- Add a new page: create `docs/your-page.md`, add a link in the TOC inside `index.html`

## 7/7 Weather box

- The “All Active” list includes a 🌦️ checkbox per item to show a 7‑day forecast via the backend proxy
- Rows must provide `data-lat` and `data-lon` for polygons; points show forecast only for polygon items

Example row markup:

```html
<div class="active-list-row" data-lat="-37.8136" data-lon="144.9631">Melbourne …</div>
```

## Backend proxy (weather)

A minimal Flask proxy is provided in `backend/` to keep API keys out of the frontend.

- Features: CORS, env‑based secrets, mock provider by default, simple cache, timeouts
- Providers: mock (dev), open‑meteo (no key), willyweather (requires key)
- Frontend override during dev: `localStorage.setItem('weatherProvider','open-meteo')`

Quick start (Windows PowerShell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
python backend/app.py
```

## Security notes

- Do not expose API keys in the frontend; use the backend proxy
- Markdown docs are sanitized with DOMPurify before insertion
- Prefer HTTPS CDNs and pin versions (already pinned); consider local vendoring for offline use
- CORS: restrict `ALLOWED_ORIGINS` in `backend/.env` for production
- Consider a Content‑Security‑Policy (CSP) if hosting with custom headers

## Accessibility & usability

- Collapsible headers respond to click; ESC closes Info/Docs
- Buttons have descriptive titles and ARIA labels
- The sidebar can be minimized; focus is disabled when minimized (inert)
- Future improvement: add focus traps inside modals/drawers and return focus to the invoking button

## Testing & preflights

- `scripts/preflight_check_duplicates.py js` — catches duplicate exports
- `scripts/preflight_active_collapsible.py` — verifies “All Active” collapsible defaults
- `scripts/preflight_reset_button.py` — verifies ♻️ reset wiring and behavior

## Contributing

- Keep functions small with JSDoc; prefer named exports
- Avoid tight coupling across modules; use `state.js` for shared maps
- Consider adding `// @ts-check` to new files for editor type hints
- Coordinate changes to IDs/classes with both HTML and JS modules

## Screenshots / videos (optional)

Add images to `docs/assets/` and reference them in Markdown, for example:

```markdown
![Sidebar showing All Active and Docs](docs/assets/sidebar-all-active.png)
```

Short GIFs can be added similarly:

```markdown
![Searching and activating a layer](docs/assets/search-activate.gif)
```

Live examples in this repo:

![Sidebar showing All Active and Docs](docs/assets/sidebar-all-active.svg)

![Searching and activating a layer](docs/assets/search-activate.svg)

Automated real screenshots

You can capture real PNG screenshots locally (requires Node.js):

```powershell
# In one terminal: serve the site
python -m http.server 8000

# In another terminal: install and run the capture
npm install
npm run capture
```

Outputs:

- docs/assets/sidebar-all-active.png
- docs/assets/search-activate.png
