/* @ts-check */
/**
 * @module utils
 * Small helpers for string formatting and DOM checkbox creation.
 */

/**
 * Convert a string to Title Case.
 * @param {string} str
 * @returns {string}
 */
/**
 * Responsive design utilities
 */

// Get current responsive breakpoint context
window.getResponsiveContext = function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Get breakpoints from CSS custom properties
  const computedStyle = getComputedStyle(document.documentElement);
  const mobileSmall = parseInt(computedStyle.getPropertyValue('--mobile-small')?.replace('px', '')) || 480;
  const mobileLarge = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
  const tablet = parseInt(computedStyle.getPropertyValue('--tablet')?.replace('px', '')) || 1024;
  
  let breakpoint = 'desktop';
  if (width <= mobileSmall) breakpoint = 'mobile-small';
  else if (width <= mobileLarge) breakpoint = 'mobile-large';
  else if (width <= tablet) breakpoint = 'tablet';
  
  return {
    width,
    height,
    breakpoint,
    isMobile: width <= mobileLarge,
    isTablet: width > mobileLarge && width <= tablet,
    isDesktop: width > tablet,
    isTouch: 'ontouchstart' in window,
    isLandscape: width > height,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches
  };
};

// Check if current screen size is considered mobile
window.isMobileSize = function() {
  return window.getResponsiveContext().isMobile;
};

/**
 * Text formatting utilities
 */

window.toTitleCase = function(str){
  // Replace underscores with spaces first, then apply title case
  return str.replace(/_/g, ' ').replace(/\w\S*/g, t => t[0].toUpperCase()+t.slice(1).toLowerCase());
}

/**
 * Format FRV name to display "Fire Rescue Victoria" instead of "FRV"
 * @param {string} name - The raw name from GeoJSON (usually "FRV")
 * @returns {string} - Formatted display name
 */
window.formatFrvName = function(name) {
  return name === 'FRV' ? 'Fire Rescue Victoria' : name;
}

/**
 * Format LGA name for display
 * @param {string} name - The raw LGA name
 * @returns {string} - Formatted display name
 */
window.formatLgaName = function(name) {
  // Basic formatting - can be enhanced later
  return name || 'Unknown LGA';
}

/**
 * Check if the application is currently offline
 * @returns {boolean} - True if offline, false if online
 */
window.isOffline = function() {
  return !navigator.onLine;
}

/**
 * Show an error message in the sidebar
 * @param {string} message - Error message to display
 */
window.showSidebarError = function(message) {
  console.error('Sidebar Error:', message);
  
  // Try to find an error display area in the sidebar
  const sidebar = document.getElementById('layerMenu') || document.querySelector('.sidebar');
  if (sidebar) {
    // Create or update error message
    let errorDiv = sidebar.querySelector('.sidebar-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'sidebar-error';
      errorDiv.style.cssText = 'background:#f8d7da;color:#721c24;padding:10px;margin:10px;border-radius:4px;border:1px solid #f5c6cb;';
      sidebar.insertBefore(errorDiv, sidebar.firstChild);
    }
    errorDiv.textContent = `⚠️ ${message}`;
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv && errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 10000);
  }
}

/**
 * Convert MGA94 coordinates to Lat/Lng
 * @param {number} easting - MGA94 easting coordinate
 * @param {number} northing - MGA94 northing coordinate
 * @returns {Object} - {lat: number, lng: number}
 */
window.convertMGA94ToLatLon = function(easting, northing) {
  // This is a simplified conversion - for production use a proper geodetic library
  // For now, return approximate values (this should be replaced with proper conversion)
  console.warn('MGA94 coordinate conversion not implemented - using approximate values');
  
  // Very rough approximation for Victoria, Australia
  // In production, use a proper geodetic library like proj4js
  const lat = -37.8136 + (northing - 5000000) / 100000;
  const lng = 144.9631 + (easting - 500000) / 100000;
  
  return { lat, lng };
}

/**
 * Create a labeled checkbox element.
 * @param {string} id - Input id attribute.
 * @param {string} label - Text displayed next to the checkbox.
 * @param {boolean} checked - Initial checked state.
 * @param {(e:Event)=>void} [onChange] - Optional change handler.
 * @returns {HTMLLabelElement}
 */
window.createCheckbox = function(id,label,checked,onChange){
  const wrapper=document.createElement('label');
  const cb=document.createElement('input');
  cb.type='checkbox'; cb.id=id; cb.checked=checked;
  if(onChange) cb.addEventListener('change',onChange);
  wrapper.appendChild(cb);
  wrapper.appendChild(document.createTextNode(' '+label));
  return wrapper;
}