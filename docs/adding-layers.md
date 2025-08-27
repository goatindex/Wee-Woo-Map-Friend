# Adding Layers

This guide explains all the different ways to add and remove layers in WeeWoo Map Friend. There are several methods to manage layers, each suited for different workflows.

## Methods for Adding Layers

### 1. Using Search

The search function is the fastest way to find and add specific locations across all categories.

![Search functionality demo](../doc_media/gifs/search.gif)

**How to use search:**
1. **Type in the search box** at the top of the sidebar
2. **Start typing** any location name (e.g., "Melbourne", "Ballarat", "Box Hill")
3. **See instant results** from all categories (SES, LGA, CFA, Ambulance, Police, FRV)
4. **Click any result** to immediately add it to the map and "All Active" section

**Search Examples:**
- **"Geelong"** - Finds Geelong LGA, nearby SES units, CFA brigades, and police stations
- **"Box Hill"** - Locates Box Hill Police Station and surrounding emergency services
- **"Ballarat"** - Shows all emergency services in the Ballarat region
- **"Melb"** - Returns multiple Melbourne-related results across all categories

**Search Tips:**
- Search works with partial names - you don't need to type the full name
- Results appear instantly as you type
- Search looks across all layer categories simultaneously
- Clear the search box to see all results again

### 2. Category Browsing

Each emergency service category has its own collapsible section for systematic browsing.

**Available Categories:**
- **🟠 SES Response Areas** - State Emergency Service response zones
- **🟦 Local Government Areas** - Council boundaries and administrative areas
- **🔴 CFA Response Areas** - Country Fire Authority coverage zones
- **🟢 Ambulance Stations** - Ambulance Victoria station locations
- **🔵 Police Stations** - Victoria Police station locations
- **🟣 Fire Rescue Victoria** - FRV station boundaries and coverage

**How to browse categories:**
1. **Click the triangle** next to any category name to expand it
2. **Scroll through the list** of available items in that category
3. **Click any item** to add it to the map
4. **Click "Show All"** to activate every item in that category (use with caution for large categories)
5. **Click the triangle again** to collapse the section

**Category Features:**
- **Show All button** - Activates all items in the category at once
- **Item count** - Shows total number of items in each category
- **Alphabetical sorting** - Items are listed in alphabetical order for easy browsing
- **Lazy loading** - Some large categories (like Police) load data only when first opened

### 3. Bulk Operations

For power users who need to work with multiple items quickly.

**Show All Function:**
- **Purpose**: Activate all items in a category simultaneously
- **Location**: Small "Show All" link next to each category header
- **Use cases**: 
  - Viewing complete coverage of a service type
  - Comparing service density across regions
  - Creating comprehensive service maps

**Warning**: Using "Show All" on large categories (like CFA with 1000+ areas) may slow down the map. The app uses performance optimizations, but consider your device's capabilities.

## Managing Active Layers

### The "All Active" Section

Once you've added layers, they appear in the "All Active" section at the top of the sidebar.

**Controls for each active layer:**
- **📢 Emphasise** - Makes the layer stand out with thicker borders or larger icons
- **🏷️ Show Name** - Displays the location name directly on the map
- **🌦️ Weather** - Shows detailed 7-day forecast for that location
- **❌ Remove** - Click the name or use controls to remove from active list

**Active Layer Features:**
- **Persistent state** - Your active layers remain selected until you remove them
- **Individual controls** - Each layer can be emphasized, labeled, or have weather independently
- **Visual feedback** - Active layers are highlighted on the map
- **Quick access** - All your selected layers in one convenient location

### Layer Visibility and Styling

**Default Behavior:**
- Newly added layers appear immediately on the map
- Polygon boundaries are shown with category-specific colors
- Point locations (stations) appear as markers
- Labels are hidden by default (enable with 🏷️ Show Name)

**Customization Options:**
- **Emphasis**: Makes features more prominent for analysis
- **Labels**: Show location names directly on the map
- **Weather**: Overlay forecast information
- **Layer order**: Newer layers appear on top of older ones

## Removing Layers

### Individual Layer Removal

**Method 1 - Via All Active:**
1. Find the layer in the "All Active" section
2. Click on the layer name to remove it
3. The layer disappears from both the map and the active list

**Method 2 - Via Category Lists:**
1. Navigate to the appropriate category section
2. Click the same item again to toggle it off
3. The item is removed from "All Active" and the map

### Bulk Layer Removal

**Reset Button (♻️):**
- **Location**: Top-right corner of the sidebar
- **Function**: Removes ALL active layers and resets the entire application
- **What it resets**:
  - Clears all active layers
  - Removes all labels and emphasis
  - Clears the search box
  - Collapses all category sections
  - Resets map to default view
  - Closes any open panels

**When to use reset:**
- Starting a new analysis
- Map becomes too cluttered
- Performance issues with too many active layers
- Quick way to start fresh

### Selective Removal

**Category-based removal:**
1. Expand the relevant category section
2. Click "Show All" again to deactivate all items in that category
3. Individual items will be removed from "All Active"

**Search-based removal:**
1. Use search to find specific items
2. Click items that are already active to remove them
3. Cleared items disappear from map and "All Active"

## Performance Considerations

### Large Dataset Handling

**Automatic optimizations:**
- **Batched loading** - Large categories load in chunks to prevent browser freezing
- **Canvas rendering** - Polygons use efficient rendering for smooth performance
- **Lazy loading** - Police data loads only when the section is first opened
- **Smart layer management** - Inactive layers are efficiently managed in memory

**Best Practices:**
- **Avoid "Show All" on multiple large categories** simultaneously
- **Use search instead of browsing** for specific locations
- **Remove unused layers** to maintain performance
- **Use the reset button** if the map becomes sluggish

### Mobile Considerations

**Touch-friendly features:**
- **Large click targets** for easy selection on mobile devices
- **Responsive design** adapts to different screen sizes
- **Optimized scrolling** in category lists
- **Touch gestures** supported for map navigation

## Tips and Workflows

### Common Workflows

**1. Find Local Services:**
1. Search for your suburb/town name
2. Add relevant emergency services from search results
3. Use labels to identify specific stations/areas
4. Check weather for planning purposes

**2. Compare Service Coverage:**
1. Search for a central location
2. Add surrounding areas from multiple categories
3. Use emphasis to highlight key areas
4. Remove labels to reduce clutter and see coverage patterns

**3. Regional Analysis:**
1. Use "Show All" for specific categories of interest
2. Focus on a particular map region
3. Add emphasis to highlight important areas
4. Use weather data for operational planning

### Keyboard Shortcuts

**Navigation:**
- **Tab** - Navigate through sidebar controls
- **Enter** - Activate focused item
- **Escape** - Close open panels or modals
- **Arrow keys** - Navigate through search results

### Troubleshooting Layer Issues

**If layers don't appear:**
1. Check that the item appears in "All Active"
2. Verify the map is zoomed to show the area
3. Try the reset button if there are display issues
4. Check browser console for any error messages

**If performance is poor:**
1. Remove unnecessary active layers
2. Avoid having multiple large categories active
3. Use the reset button to clear everything
4. Close other browser tabs to free up memory

**If search doesn't work:**
1. Clear the search box and try again
2. Try partial names instead of full names
3. Check spelling of location names
4. Some very small locations may not be indexed

## Advanced Features

### Weather Integration

**Weather works for all layer types:**
- **Polygon areas** - Uses geographic center point
- **Point locations** - Uses exact coordinates
- **Multiple providers** - Automatically switches between data sources
- **7-day forecasts** - Detailed daily predictions
- **Current conditions** - Real-time weather data

### Layer Interaction

**Map interaction:**
- **Click layers** on the map to see details
- **Hover effects** show layer information
- **Zoom to fit** functionality for large areas
- **Layer stacking** with proper z-index management

This comprehensive guide covers all aspects of adding and managing layers in WeeWoo Map Friend. For additional help, see the other documentation sections or try the reset button if you encounter any issues.
