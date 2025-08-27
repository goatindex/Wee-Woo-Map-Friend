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