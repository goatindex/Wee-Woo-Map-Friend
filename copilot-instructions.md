# GitHub Copilot Instructions for mapexp.github.io

## Collaboration & Decision-Making Guidelines

1. **Confirm Before Changes**: Always confirm with the user before making any code changes.
2. **Discuss Implementation Options**: Present multiple options for implementing requested changes, explaining the pros, cons, and tradeoffs of each.
3. **Explain Proposals**: Clearly explain all proposals and code changes to help the user learn and make informed decisions.
4. **Secure Coding Practices**: Use secure coding practices (e.g., input validation, avoiding eval, using HTTPS for APIs, escaping user input) and mention when/why these are applied.
5. **Suggest and Discuss Error Handling**: Always suggest and discuss error handling strategies wherever they are not already implemented, including how to handle failures gracefully and provide user feedback.
6. **Consistency, Modularity, Extensibility**: Make code consistent in style, modular in structure, and extensible for future features or changes.
7. **Documentation Standards**: Use clear code comments, JSDoc for functions, and update the README for major changes to improve maintainability and onboarding.
8. **Performance Considerations**: Optimize for speed and responsiveness, especially for map rendering and data loading. Discuss tradeoffs between code clarity and performance when relevant.

---

## Project Overview

This project is a Leaflet.js-based web map for visualizing SES, LGA, CFA, and Ambulance boundaries in Victoria, Australia. It uses vanilla JS, HTML, CSS, and GeoJSON data layers. The sidebar allows users to activate polygons, emphasise features, and show/hide labels.

## Copilot Usage Guidelines

- **Code Style**: Use ES6+ syntax, keep code modular, and prefer named exports for functions.
- **UI/UX**: Sidebar should be responsive, with sticky headers and collapsible sections. All controls should be accessible and visually clear.
- **Map Logic**: Use Leaflet for map rendering and layer management. Use Turf.js for geometry calculations (overlap, adjacency, containment).
- **Data Loading**: Load GeoJSON layers asynchronously. Handle errors gracefully and show user feedback if data fails to load.
- **Sidebar Logic**: Only show checked/active items in the 'All Active' section. Emphasise and label toggles should update the map and sidebar immediately.
- **Custom Points**: (If re-implemented) Use Nominatim for geocoding, and integrate custom points into the sidebar using the same UI logic as other features.
- **Error Handling**: Always check for null/undefined before accessing DOM elements or map layers. Log errors to the console for debugging.
- **Accessibility**: Use semantic HTML and ARIA attributes where possible. Ensure keyboard navigation works for all sidebar controls.

## Copilot Prompts

- "Add a new sidebar section for [feature] with collapsible logic."
- "Implement polygon activation by overlap/adjacency using Turf.js."
- "Fix syntax errors in [file] and restore sidebar/map functionality."
- "Integrate custom points search using Nominatim and add to sidebar."
- "Make the sidebar sticky and responsive for desktop/mobile."
- "Show/hide labels for active features using a checkbox."

## Best Practices

- Keep UI logic in `js/ui/` and map logic in `js/` or `js/loaders/`.
- Use comments to explain complex logic, especially geometry calculations.
- Avoid placeholder comments and ensure all braces are properly closed.
- Test changes in the browser and check for console errors after each edit.

## Troubleshooting

- If the map does not load, check Leaflet and tile server URLs, and inspect the browser console for errors.
- If sidebar controls do not work, check for missing event listeners or DOM element IDs.
- If syntax errors occur, use Copilot to clean up braces and imports.

## File Structure Reference

- `index.html`: Main HTML structure and sidebar.
- `css/styles.css`: Sidebar and map styling.
- `js/bootstrap.js`: Map initialization and data loading.
- `js/ui/activeList.js`: Sidebar update logic and feature controls.
- `js/labels.js`: Map label logic.
- `js/loaders/`: GeoJSON and feature loading.

## Sidebar Label Toggle Behaviour (All Active Section)

### Approach and Behaviour

- When a polygon is first added to the 'All Active' section, its name label is shown on the map and the 'Show Name' (??) checkbox is checked by default.
- If the 'Show Name' checkbox is unchecked, the label is immediately removed from the map and will not reappear unless the box is checked again.
- When the sidebar is rebuilt, labels are only created for polygons where the 'Show Name' box is checked. This ensures user intent is respected and prevents unwanted label reappearance.
- Toggling the 'Show Name' checkbox only shows or hides the label, without rebuilding the sidebar or resetting checkbox state.

### Implementation Notes

- The label is managed by calling `ensureLabel(category, key, name, isPoint, layerOrMarker)` when the box is checked, and `removeLabel(category, key)` when unchecked.
- The sidebar logic avoids calling `updateActiveList()` when toggling the label, so the checkbox state persists and the UI remains responsive.
- This approach provides a reliable and intuitive user experience for managing map labels.

---

This file provides instructions for using GitHub Copilot effectively in this project. Update as needed to reflect new features or changes.

/\*\*

- WillyWeather API
- Documentation: https://www.willyweather.com.au/api/docs/index.html
- API key is imported from config.js for development only.
- For production, use a backend proxy for security.
  \*/
