# WeeW## Features

- Sidebar with collapsible sections for each layer category
- Global search across all layers
- "All- `scripts/preflight_check_duplicates.py js` — catches duplicate exports
- `scripts/preflight_active_collapsible.py` — verifies "All Active" collapsible defaults
- `scripts/preflight_reset_button.py` — verifies ♻️ reset wiring and behavior

## Future Features & Refactors

### Performance Enhancements (Medium Priority)

- **Optimistic UI updates**: Immediate visual feedback for all user interactions
- **Viewport-based rendering**: Only render polygons visible in current map bounds
- **Layer pooling**: Reuse Leaflet layer objects instead of creating/destroying
- **Virtual scrolling**: For sidebar lists with 500+ items

### Advanced Optimizations (Low Priority - Complex)

- **Web Workers**: Move geometry processing to background threads
  - Parse GeoJSON in Web Worker
  - Pre-process layer groups for instant map addition
  - Keep UI thread responsive during heavy computation
- **Progressive loading**: Load simplified geometries first, detailed on zoom
- **Memory management**: Smart layer lifecycle management for large datasets

### Architecture Improvements

- **ES Module migration**: Convert from global `window` functions to proper ES modules
  - Better maintainability and tree-shaking
  - Clearer dependency management
  - Requires updating HTML script tags to `type="module"`
- **Component-based refactor**: Break down large files into smaller, focused modules
- **TypeScript adoption**: Add type safety and better developer experience

### User Experience

- **Cancellable operations**: Allow users to stop long-running bulk operations
- **Keyboard navigation**: Full keyboard support for sidebar and modals
- **Touch gestures**: Mobile-friendly map interactions
- **Offline support**: Service worker for offline map viewingtive" list with controls:
  - 📢 Emphasise, 🏷️ Show Name, 🌦️ 7‑day Weather
- Reset to defaults (♻️)
- Information (ℹ️) modal and Documentation (📚) drawer with TOC
- Performance: Leaflet panes and canvas rendering for polygons; lazy‑load Police
- **Async batching**: "Show All" toggles use batched processing to prevent UI freezing

## Performance Optimizations

### Async Batching for Bulk Operations

The "Show All" toggle buttons use async batching to prevent UI freezing when loading large datasets:

- **Batch processing**: Items are processed in groups of 20 per animation frame
- **Progress feedback**: Toggle buttons show loading progress (e.g., "Loading 150/1000 items...")
- **Responsive UI**: Uses `requestAnimationFrame` to yield control back to the browser
- **Optimistic updates**: Buttons are immediately disabled with loading state

This ensures smooth user experience even when toggling 1000+ CFA areas or other large datasets.

### Other Performance Features

- **Modular preloading**: Data loads in sidebar order (SES → LGA → CFA → Ambulance)
- **Canvas rendering**: Polygons use Leaflet canvas renderer for better performance
- **Lazy loading**: Police data only loads when needed (section expand or toggle)
- **Z-index panes**: Proper layer ordering without expensive bring-to-front operationsiend

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

## Technical Notes

### Loader Function Export: Window vs ES Modules

Currently, loader functions such as `getPolygonFeatures` are attached to the global `window` object for compatibility with vanilla JS and legacy script loading. This ensures all loader functions are accessible throughout the app without requiring ES module support or changes to script tags.

**Alternative (Recommended for Modern Projects):**
Refactor loader files to use ES module exports (e.g., `export { getPolygonFeatures }`) and update all script tags in HTML to use `<script type="module">`. This approach is more maintainable, supports tree-shaking, and clarifies dependencies, but requires refactoring and may break compatibility with older code or global variables.

**Current Fix:**
The global `window` approach is used to restore functionality and maintain compatibility. This can be revisited in the future if the project is upgraded to use ES modules and modern build tooling.
