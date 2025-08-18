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

## WillyWeather API

This project uses the [WillyWeather API](https://www.willyweather.com.au/api/docs/index.html) for weather data integration.

- API documentation: https://www.willyweather.com.au/api/docs/index.html
- API key is stored in `js/config.js` for development only. For production, use a backend proxy for security.

### How to use
- Import the API key from `js/config.js`:
  ```js
  import { WILLYWEATHER_API_KEY } from './js/config.js';
  ```
- Refer to the official API docs for endpoints and usage examples.

### Security Notice
Do NOT expose your API key in public repositories or production deployments. Transition to a backend proxy for secure key management.

## 7/7 Checkbox Implementation (Updated)

The "All Active" section now includes a 7/7 checkbox next to each active item. This allows users to display a 7-day weather forecast and 7-day historical data for selected locations using the WillyWeather API.

### Approach
- The sidebar is built with flexbox rows, not tables.
- Each item in the list receives its own 7/7 checkbox, rendered during row creation.
- When checked, the app fetches and displays weather data in a bottom-left info box.
- Latitude/longitude for each item should be set via `data-lat` and `data-lon` attributes on the row.
- All event listeners are attached during row creation for reliability.

### Example
```html
<div class="active-list-row" data-lat="-37.8136" data-lon="144.9631">Melbourne ...</div>
```

### Usage
- Check the 7/7 box for any item to view weather data for that location.
- Uncheck to hide the info box.
