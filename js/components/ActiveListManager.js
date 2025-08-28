/**
 * @fileoverview Modern ActiveListManager Component
 * Manages the "All Active" sidebar section with enhanced UI controls and performance.
 */

import { ComponentBase } from '../modules/ComponentBase.js';
import { stateManager } from '../modules/StateManager.js';
import { globalEventBus } from '../modules/EventBus.js';

/**
 * @class ActiveListManager
 * Modern replacement for legacy js/ui/activeList.js
 * Manages the dynamic "All Active" section with bulk operations, enhanced controls, and performance optimizations
 */
export class ActiveListManager extends ComponentBase {
  /**
   * @param {HTMLElement} container - Container element for the active list
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      enableBulkOperations: true,
      enableWeatherIntegration: true,
      enableEmphasis: true,
      enableLabels: true,
      autoCollapse: true,
      animationDuration: 200,
      weatherBoxPosition: 'bottom-left',
      maxWeatherBoxHeight: '60vh',
      bulkUpdateDelay: 50,
      ...options
    });
    
    // State management
    this.activeItems = new Map(); // category -> Set of active keys
    this.bulkUpdateActive = false;
    this.bulkUpdatePending = false;
    this.bulkUpdateTimer = null;
    
    // DOM elements (will be found during init)
    this.activeList = null;
    this.headerElement = null;
    this.weatherBox = null;
    
    // Weather state
    this.currentWeatherLocation = null;
    this.weatherProvider = 'willyweather';
    
    // Categories to monitor
    this.categories = ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv'];
    
    // Bound methods
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleEmphasisChange = this.handleEmphasisChange.bind(this);
    this.handleLabelChange = this.handleLabelChange.bind(this);
    this.handleWeatherChange = this.handleWeatherChange.bind(this);
    this.updateActiveList = this.updateActiveList.bind(this);
    this.handleCategoryDataUpdate = this.handleCategoryDataUpdate.bind(this);
    
    console.log('🎯 ActiveListManager: Initialized with container', container.id);
  }
  
  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('🎯 ActiveListManager: Initializing...');
      
      // Find DOM elements
      this.findDOMElements();
      
      // Set up accessibility
      this.initializeAccessibility();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up state management
      this.setupStateManagement();
      
      // Create weather box if enabled
      if (this.options.enableWeatherIntegration) {
        this.createWeatherBox();
      }
      
      // Load weather provider preference
      this.loadWeatherPreferences();
      
      // Sync with existing checkboxes
      this.syncWithExistingCheckboxes();
      
      // Initial render
      this.updateActiveList();
      
      this.isInitialized = true;
      globalEventBus.emit('activeList:initialized', { manager: this });
      
      console.log('✅ ActiveListManager: Initialization complete');
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Find required DOM elements
   * @private
   */
  findDOMElements() {
    // Find active list container
    this.activeList = document.getElementById('activeList');
    if (!this.activeList) {
      throw new Error('Active list element not found');
    }
    
    // Find header element
    this.headerElement = document.getElementById('activeHeader');
    if (!this.headerElement) {
      console.warn('⚠️ ActiveListManager: Active header element not found');
    }
    
    console.log('📋 ActiveListManager: DOM elements found');
  }
  
  /**
   * Set up accessibility features
   * @private
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.activeList.setAttribute('role', 'list');
    this.activeList.setAttribute('aria-label', 'Active layers list');
    
    if (this.headerElement) {
      this.headerElement.setAttribute('aria-expanded', 'true');
      this.headerElement.setAttribute('aria-controls', this.activeList.id);
    }
    
    console.log('♿ ActiveListManager: Accessibility features initialized');
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Global events for data updates
    globalEventBus.on('data:layersLoaded', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerAdded', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerRemoved', this.handleCategoryDataUpdate);
    globalEventBus.on('data:layerToggled', this.updateActiveList);
    
    // Search integration
    globalEventBus.on('search:selected', ({ category, key }) => {
      // When search selects an item, update the active list
      setTimeout(() => this.updateActiveList(), 100);
    });
    
    // Collapsible integration
    globalEventBus.on('collapsible:expanded', ({ id }) => {
      if (id === 'activeHeader') {
        this.handleSectionExpanded();
      }
    });
    
    // State management events
    globalEventBus.on('state:changed', ({ key, value }) => {
      if (key === 'ui.activeList') {
        this.applyState(value);
      }
    });
    
    console.log('👂 ActiveListManager: Event listeners attached');
  }
  
  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('activeListManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });
    }
  }
  
  /**
   * Create weather box for 7-day forecasts
   * @private
   */
  createWeatherBox() {
    this.weatherBox = document.getElementById('weatherBox');
    
    if (!this.weatherBox) {
      this.weatherBox = document.createElement('div');
      this.weatherBox.id = 'weatherBox';
      this.weatherBox.className = 'weather-box modern-weather-box';
      
      // Position and styling
      const positions = {
        'bottom-left': { left: '20px', bottom: '20px' },
        'bottom-right': { right: '20px', bottom: '20px' },
        'top-left': { left: '20px', top: '20px' },
        'top-right': { right: '20px', top: '20px' }
      };
      
      const pos = positions[this.options.weatherBoxPosition] || positions['bottom-left'];
      
      Object.assign(this.weatherBox.style, {
        position: 'fixed',
        ...pos,
        width: '320px',
        maxHeight: this.options.maxWeatherBoxHeight,
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: '9999',
        padding: '16px',
        display: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      });
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✖';
      closeBtn.className = 'weather-close-btn';
      closeBtn.title = 'Close weather box';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'none',
        border: 'none',
        fontSize: '14px',
        cursor: 'pointer',
        color: '#666',
        padding: '4px'
      });
      closeBtn.addEventListener('click', () => {
        this.hideWeatherBox();
      });
      
      this.weatherBox.appendChild(closeBtn);
      document.body.appendChild(this.weatherBox);
    }
    
    console.log('🌦️ ActiveListManager: Weather box created');
  }
  
  /**
   * Load weather provider preference from localStorage
   * @private
   */
  loadWeatherPreferences() {
    if (typeof localStorage !== 'undefined') {
      this.weatherProvider = localStorage.getItem('weatherProvider') || 'willyweather';
    }
  }
  
  /**
   * Sync with existing category checkboxes
   * @private
   */
  syncWithExistingCheckboxes() {
    this.categories.forEach(category => {
      this.setupCategorySync(category);
    });
    
    console.log('🔄 ActiveListManager: Synced with existing checkboxes');
  }
  
  /**
   * Set up synchronization with a category's checkboxes
   * @param {string} category - Category name
   * @private
   */
  setupCategorySync(category) {
    if (!window.namesByCategory?.[category] || !window.nameToKey?.[category]) {
      return;
    }
    
    if (!this.activeItems.has(category)) {
      this.activeItems.set(category, new Set());
    }
    
    const activeSet = this.activeItems.get(category);
    
    window.namesByCategory[category].forEach(name => {
      const key = window.nameToKey[category][name];
      const checkbox = this.getCategoryCheckbox(category, key);
      
      if (checkbox && !checkbox._modernBound) {
        checkbox._modernBound = true;
        checkbox.addEventListener('change', this.handleCheckboxChange);
        
        // Initialize active state
        if (checkbox.checked) {
          activeSet.add(key);
        }
      }
    });
  }
  
  /**
   * Safely get the actual checkbox element for a given category/key
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @returns {HTMLInputElement|null}
   * @private
   */
  getCategoryCheckbox(category, key) {
    const id = `${category}_${key}`;
    const el = document.getElementById(id);
    
    if (!el) {
      return document.querySelector(`input#${id}`);
    }
    
    if (el.tagName === 'INPUT') {
      return el;
    }
    
    const inside = el.querySelector('input[type="checkbox"]');
    if (inside) {
      return inside;
    }
    
    return document.querySelector(`input#${id}`);
  }
  
  /**
   * Handle checkbox change events
   * @param {Event} event - Change event
   * @private
   */
  handleCheckboxChange(event) {
    const checkbox = event.target;
    const id = checkbox.id;
    
    if (!id) return;
    
    // Parse category and key from id
    const parts = id.split('_');
    if (parts.length < 2) return;
    
    const category = parts[0];
    const key = parts.slice(1).join('_');
    
    if (!this.activeItems.has(category)) {
      this.activeItems.set(category, new Set());
    }
    
    const activeSet = this.activeItems.get(category);
    
    if (checkbox.checked) {
      activeSet.add(key);
    } else {
      activeSet.delete(key);
    }
    
    // Update the active list
    this.scheduleUpdate();
    
    // Emit event
    globalEventBus.emit('activeList:itemToggled', {
      category,
      key,
      active: checkbox.checked,
      total: activeSet.size
    });
  }
  
  /**
   * Schedule an update with optional bulk processing
   * @private
   */
  scheduleUpdate() {
    if (this.bulkUpdateActive) {
      this.bulkUpdatePending = true;
      return;
    }
    
    // Debounce rapid updates
    clearTimeout(this.bulkUpdateTimer);
    this.bulkUpdateTimer = setTimeout(() => {
      this.updateActiveList();
    }, this.options.bulkUpdateDelay);
  }
  
  /**
   * Begin bulk update mode to avoid repeated rebuilding
   */
  beginBulkUpdate() {
    this.bulkUpdateActive = true;
    console.log('📦 ActiveListManager: Bulk update mode enabled');
  }
  
  /**
   * End bulk update mode and apply pending changes
   */
  endBulkUpdate() {
    this.bulkUpdateActive = false;
    const pending = this.bulkUpdatePending;
    this.bulkUpdatePending = false;
    
    if (pending) {
      this.updateActiveList();
    }
    
    console.log('📦 ActiveListManager: Bulk update mode disabled');
  }
  
  /**
   * Update the active list UI
   */
  updateActiveList() {
    if (this.bulkUpdateActive) {
      this.bulkUpdatePending = true;
      return;
    }
    
    if (!this.activeList) return;
    
    try {
      // Clear existing content
      this.activeList.innerHTML = '';
      
      // Create header row
      this.createHeaderRow();
      
      // Add items for each category
      let totalItems = 0;
      this.categories.forEach(category => {
        totalItems += this.addCategoryItems(category);
      });
      
      // Handle empty state
      this.handleEmptyState(totalItems);
      
      // Emit update event
      globalEventBus.emit('activeList:updated', {
        totalItems,
        categories: Array.from(this.activeItems.keys()),
        manager: this
      });
      
      console.log(`📋 ActiveListManager: Updated with ${totalItems} active items`);
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Update failed:', error);
    }
  }
  
  /**
   * Create the header row with column labels
   * @private
   */
  createHeaderRow() {
    const headerRow = document.createElement('div');
    headerRow.className = 'active-list-header';
    headerRow.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-weight: bold;
      font-size: 0.9em;
      color: #666;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    `;
    
    // Spacer for remove button
    const spacer = document.createElement('span');
    spacer.style.width = '32px';
    headerRow.appendChild(spacer);
    
    // Name header
    const nameHeader = document.createElement('span');
    nameHeader.textContent = 'Name';
    nameHeader.className = 'active-list-name-header';
    nameHeader.style.cssText = 'flex: 1; text-align: left;';
    headerRow.appendChild(nameHeader);
    
    // Feature headers
    const features = [
      { text: '📢', title: 'Emphasise', enabled: this.options.enableEmphasis },
      { text: '🏷️', title: 'Show Name', enabled: this.options.enableLabels },
      { text: '🌦️', title: '7-day weather', enabled: this.options.enableWeatherIntegration }
    ];
    
    features.forEach(feature => {
      if (!feature.enabled) return;
      
      const header = document.createElement('span');
      header.textContent = feature.text;
      header.title = feature.title;
      header.className = 'active-list-icon-header';
      header.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        font-weight: bold;
        cursor: help;
      `;
      headerRow.appendChild(header);
    });
    
    this.activeList.appendChild(headerRow);
  }
  
  /**
   * Add items for a specific category
   * @param {string} category - Category name
   * @returns {number} Number of items added
   * @private
   */
  addCategoryItems(category) {
    if (!window.namesByCategory?.[category] || !window.featureLayers?.[category]) {
      return 0;
    }
    
    const activeSet = this.activeItems.get(category) || new Set();
    let itemCount = 0;
    
    window.namesByCategory[category].forEach(name => {
      const key = window.nameToKey[category][name];
      const checkbox = this.getCategoryCheckbox(category, key);
      
      if (!checkbox || !checkbox.checked || !activeSet.has(key)) {
        return; // Only show checked/active items
      }
      
      const row = this.createItemRow(category, key, name);
      this.activeList.appendChild(row);
      itemCount++;
    });
    
    return itemCount;
  }
  
  /**
   * Create a row for an active item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @returns {HTMLElement} Row element
   * @private
   */
  createItemRow(category, key, name) {
    const row = document.createElement('div');
    row.className = 'active-list-row';
    row.setAttribute('role', 'listitem');
    row.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 2px;
      padding: 4px 2px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effect
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = '';
    });
    
    // Set coordinate data for weather (polygons only)
    this.setRowCoordinates(row, category, key);
    
    // Create row contents
    this.addRemoveButton(row, category, key);
    this.addNameLabel(row, category, name);
    
    if (this.options.enableEmphasis) {
      this.addEmphasisToggle(row, category, key);
    }
    
    if (this.options.enableLabels) {
      this.addLabelToggle(row, category, key, name);
    }
    
    if (this.options.enableWeatherIntegration) {
      this.addWeatherToggle(row, category, key);
    }
    
    return row;
  }
  
  /**
   * Set coordinate data on row for weather functionality
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  setRowCoordinates(row, category, key) {
    const meta = window.categoryMeta?.[category];
    if (meta?.type === 'polygon' && window.featureLayers?.[category]?.[key]) {
      const layer = window.featureLayers[category][key][0];
      if (layer && layer.getBounds) {
        const center = layer.getBounds().getCenter();
        row.dataset.lat = center.lat;
        row.dataset.lon = center.lng;
      }
    }
  }
  
  /**
   * Add remove button to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addRemoveButton(row, category, key) {
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✖';
    removeBtn.title = 'Remove from active';
    removeBtn.className = 'active-list-remove-btn';
    removeBtn.style.cssText = `
      color: #d32f2f;
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      width: 32px;
      margin: 0 2px 0 0;
      padding: 2px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effect
    removeBtn.addEventListener('mouseenter', () => {
      removeBtn.style.backgroundColor = 'rgba(211, 47, 47, 0.1)';
    });
    removeBtn.addEventListener('mouseleave', () => {
      removeBtn.style.backgroundColor = '';
    });
    
    removeBtn.addEventListener('click', () => {
      this.removeActiveItem(category, key);
    });
    
    row.appendChild(removeBtn);
  }
  
  /**
   * Add name label to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} name - Display name
   * @private
   */
  addNameLabel(row, category, name) {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'active-list-name';
    
    // Format name based on category
    const displayName = this.formatDisplayName(category, name);
    nameSpan.textContent = displayName;
    nameSpan.title = displayName;
    
    nameSpan.style.cssText = `
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 0 8px;
    `;
    
    // Set color to match category
    const baseColor = window.outlineColors?.[category] || '#333';
    const factor = window.labelColorAdjust?.[category] ?? 1.0;
    if (window.adjustHexColor) {
      nameSpan.style.color = window.adjustHexColor(baseColor, factor);
    } else {
      nameSpan.style.color = baseColor;
    }
    
    row.appendChild(nameSpan);
  }
  
  /**
   * Format display name based on category
   * @param {string} category - Category name
   * @param {string} name - Raw name
   * @returns {string} Formatted name
   * @private
   */
  formatDisplayName(category, name) {
    if (category === 'ambulance' && window.formatAmbulanceName) {
      return window.formatAmbulanceName(name);
    }
    if (category === 'police' && window.formatPoliceName) {
      return window.formatPoliceName(name);
    }
    return name;
  }
  
  /**
   * Add emphasis toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addEmphasisToggle(row, category, key) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Emphasise');
    
    // Set initial state
    checkbox.checked = !!(window.emphasised?.[category]?.[key]);
    
    checkbox.addEventListener('change', (e) => {
      this.handleEmphasisChange(category, key, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  
  /**
   * Add label toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @private
   */
  addLabelToggle(row, category, key, name) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Show Name');
    
    // Default: checked when first added
    checkbox.checked = true;
    
    checkbox.addEventListener('change', (e) => {
      this.handleLabelChange(category, key, name, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
    
    // Show label initially if checked
    if (checkbox.checked) {
      this.showLabel(category, key, name);
    }
  }
  
  /**
   * Add weather toggle to row
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  addWeatherToggle(row, category, key) {
    const cell = this.createToggleCell();
    const checkbox = this.createToggleCheckbox('Show 7-day weather');
    checkbox.className = 'sevenSevenCheckbox';
    
    checkbox.addEventListener('change', (e) => {
      this.handleWeatherChange(row, category, key, e.target.checked);
    });
    
    cell.appendChild(checkbox);
    row.appendChild(cell);
  }
  
  /**
   * Create a toggle cell container
   * @returns {HTMLElement} Cell element
   * @private
   */
  createToggleCell() {
    const cell = document.createElement('span');
    cell.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
    `;
    return cell;
  }
  
  /**
   * Create a toggle checkbox
   * @param {string} title - Tooltip title
   * @returns {HTMLInputElement} Checkbox element
   * @private
   */
  createToggleCheckbox(title) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.title = title;
    checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      margin: 0;
      cursor: pointer;
    `;
    return checkbox;
  }
  
  /**
   * Handle emphasis toggle change
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {boolean} enabled - Whether emphasis is enabled
   * @private
   */
  handleEmphasisChange(category, key, enabled) {
    if (window.setEmphasis) {
      const isPoint = window.categoryMeta?.[category]?.type === 'point';
      window.setEmphasis(category, key, enabled, isPoint);
    }
    
    globalEventBus.emit('activeList:emphasisChanged', {
      category,
      key,
      enabled
    });
  }
  
  /**
   * Handle label toggle change
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @param {boolean} enabled - Whether label is enabled
   * @private
   */
  handleLabelChange(category, key, name, enabled) {
    if (enabled) {
      this.showLabel(category, key, name);
    } else {
      this.hideLabel(category, key);
    }
    
    globalEventBus.emit('activeList:labelChanged', {
      category,
      key,
      name,
      enabled
    });
  }
  
  /**
   * Show label for an item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {string} name - Display name
   * @private
   */
  showLabel(category, key, name) {
    if (!window.ensureLabel) return;
    
    const meta = window.categoryMeta?.[category];
    const isPoint = meta?.type === 'point';
    
    let layerOrMarker = null;
    if (isPoint) {
      layerOrMarker = window.featureLayers?.[category]?.[key];
    } else {
      layerOrMarker = window.featureLayers?.[category]?.[key]?.[0];
    }
    
    if (layerOrMarker) {
      window.ensureLabel(category, key, name, isPoint, layerOrMarker);
    }
  }
  
  /**
   * Hide label for an item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  hideLabel(category, key) {
    if (window.removeLabel) {
      window.removeLabel(category, key);
    }
  }
  
  /**
   * Handle weather toggle change
   * @param {HTMLElement} row - Row element
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @param {boolean} enabled - Whether weather is enabled
   * @private
   */
  async handleWeatherChange(row, category, key, enabled) {
    if (enabled) {
      // Clear other weather checkboxes (only one at a time)
      document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
        if (cb !== row.querySelector('.sevenSevenCheckbox')) {
          cb.checked = false;
        }
      });
      
      const lat = row.dataset.lat;
      const lon = row.dataset.lon;
      const meta = window.categoryMeta?.[category];
      
      if (lat && lon && meta?.type === 'polygon') {
        await this.showWeatherForLocation(lat, lon);
      } else {
        this.hideWeatherBox();
      }
    } else {
      this.hideWeatherBox();
    }
    
    globalEventBus.emit('activeList:weatherChanged', {
      category,
      key,
      enabled,
      coordinates: enabled ? { lat: row.dataset.lat, lon: row.dataset.lon } : null
    });
  }
  
  /**
   * Show weather data for a location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @private
   */
  async showWeatherForLocation(lat, lon) {
    if (!this.weatherBox) return;
    
    // Show loading state
    this.weatherBox.innerHTML = `
      <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
      <div style="display: flex; gap: 8px; align-items: center; margin-top: 24px;">
        <span>Loading weather…</span>
        <span class="spinner" style="width: 12px; height: 12px; border: 2px solid #ccc; border-top-color: #333; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite;"></span>
      </div>
    `;
    this.weatherBox.style.display = 'block';
    
    // Re-attach close button event
    this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
      this.hideWeatherBox();
    });
    
    try {
      const weatherData = await this.fetchWeatherData(lat, lon);
      this.renderWeatherBox(weatherData);
      this.currentWeatherLocation = { lat, lon };
    } catch (error) {
      console.error('🚨 ActiveListManager: Weather fetch failed:', error);
      this.weatherBox.innerHTML = `
        <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
        <div style="color: red; margin-top: 24px;">Error loading weather data.</div>
      `;
      
      // Re-attach close button event
      this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
        this.hideWeatherBox();
      });
    }
  }
  
  /**
   * Fetch weather data from backend
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Weather data
   * @private
   */
  async fetchWeatherData(lat, lon) {
    const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:5000'
      : '';
    
    const makeUrl = (provider) => 
      `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(provider)}`;
    
    let data;
    try {
      const res = await fetch(makeUrl(this.weatherProvider));
      if (!res.ok) throw new Error(`Weather API error ${res.status}`);
      data = await res.json();
    } catch (e) {
      // Fallback: if WillyWeather fails, try Open-Meteo
      if (this.weatherProvider === 'willyweather') {
        const res2 = await fetch(makeUrl('open-meteo'));
        if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
        data = await res2.json();
      } else {
        throw e;
      }
    }
    
    // Normalize data structure
    const days = (data.forecast || []).map((d, i) => ({
      date: `Day ${i + 1}`,
      summary: d.summary ?? '—',
      tempMin: d.tempMin,
      tempMax: d.tempMax
    }));
    
    return {
      forecastData: { days },
      historyData: { days: [] }
    };
  }
  
  /**
   * Render weather data in the weather box
   * @param {Object} weatherData - Weather data object
   * @private
   */
  renderWeatherBox(weatherData) {
    if (!this.weatherBox) return;
    
    let html = `
      <button class="weather-close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 14px; cursor: pointer; color: #666; padding: 4px;">✖</button>
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333;">7-Day Weather Forecast</h3>
    `;
    
    if (weatherData.forecastData.days.length > 0) {
      html += '<ul style="margin: 0; padding: 0; list-style: none;">';
      weatherData.forecastData.days.forEach(day => {
        const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
        const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
        html += `<li style="padding: 4px 0; border-bottom: 1px solid #eee;">${day.date}: ${day.summary}${tmin}${tmax}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p style="color: #666;">No forecast data available.</p>';
    }
    
    if (weatherData.historyData.days.length > 0) {
      html += '<h3 style="margin: 16px 0 8px 0; font-size: 16px; color: #333;">Past 7 Days</h3>';
      html += '<ul style="margin: 0; padding: 0; list-style: none;">';
      weatherData.historyData.days.forEach(day => {
        html += `<li style="padding: 4px 0; border-bottom: 1px solid #eee;">${day.date}: ${day.summary}</li>`;
      });
      html += '</ul>';
    }
    
    this.weatherBox.innerHTML = html;
    
    // Re-attach close button event
    this.weatherBox.querySelector('.weather-close-btn').addEventListener('click', () => {
      this.hideWeatherBox();
    });
    
    this.weatherBox.style.display = 'block';
  }
  
  /**
   * Hide the weather box
   * @private
   */
  hideWeatherBox() {
    if (this.weatherBox) {
      this.weatherBox.style.display = 'none';
      this.currentWeatherLocation = null;
    }
    
    // Uncheck all weather checkboxes
    document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
      cb.checked = false;
    });
  }
  
  /**
   * Remove an active item
   * @param {string} category - Category name
   * @param {string} key - Item key
   * @private
   */
  removeActiveItem(category, key) {
    const checkbox = this.getCategoryCheckbox(category, key);
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update our internal state
    const activeSet = this.activeItems.get(category);
    if (activeSet) {
      activeSet.delete(key);
    }
    
    // Update the list
    this.updateActiveList();
    
    globalEventBus.emit('activeList:itemRemoved', { category, key });
  }
  
  /**
   * Handle empty state
   * @param {number} totalItems - Total number of items
   * @private
   */
  handleEmptyState(totalItems) {
    if (totalItems === 0) {
      // Remove header to reduce visual noise
      this.activeList.innerHTML = '';
      
      if (this.headerElement && this.options.autoCollapse) {
        this.headerElement.classList.add('collapsed');
        this.activeList.style.display = 'none';
      }
    } else {
      // Ensure section is expanded
      if (this.headerElement) {
        this.headerElement.classList.remove('collapsed');
        this.activeList.style.display = '';
      }
    }
  }
  
  /**
   * Handle category data updates
   * @private
   */
  handleCategoryDataUpdate() {
    // Re-sync with checkboxes after data updates
    setTimeout(() => {
      this.syncWithExistingCheckboxes();
      this.updateActiveList();
    }, 100);
  }
  
  /**
   * Handle section expanded event
   * @private
   */
  handleSectionExpanded() {
    // Update list when section is expanded
    this.updateActiveList();
  }
  
  /**
   * Get current component state
   * @returns {Object} Current state
   */
  getState() {
    const activeItemsState = {};
    
    // Ensure all categories are represented
    this.categories.forEach(category => {
      const activeSet = this.activeItems.get(category);
      activeItemsState[category] = activeSet ? Array.from(activeSet) : [];
    });
    
    return {
      activeItems: activeItemsState,
      weatherProvider: this.weatherProvider,
      currentWeatherLocation: this.currentWeatherLocation,
      bulkUpdateActive: this.bulkUpdateActive
    };
  }
  
  /**
   * Apply state to component
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (state.activeItems) {
      this.activeItems.clear();
      Object.entries(state.activeItems).forEach(([category, keys]) => {
        this.activeItems.set(category, new Set(keys));
      });
    }
    
    if (state.weatherProvider) {
      this.weatherProvider = state.weatherProvider;
    }
    
    if (state.currentWeatherLocation) {
      this.currentWeatherLocation = state.currentWeatherLocation;
    }
    
    if (typeof state.bulkUpdateActive === 'boolean') {
      this.bulkUpdateActive = state.bulkUpdateActive;
    }
    
    this.updateActiveList();
  }
  
  /**
   * Get all active items across categories
   * @returns {Array} Array of {category, key, name} objects
   */
  getAllActiveItems() {
    const items = [];
    
    this.activeItems.forEach((activeSet, category) => {
      if (!window.namesByCategory?.[category]) return;
      
      activeSet.forEach(key => {
        const name = Object.keys(window.nameToKey[category] || {}).find(
          n => window.nameToKey[category][n] === key
        );
        
        if (name) {
          items.push({ category, key, name });
        }
      });
    });
    
    return items;
  }
  
  /**
   * Clear all active items
   */
  clearAllActive() {
    this.beginBulkUpdate();
    
    try {
      this.activeItems.forEach((activeSet, category) => {
        activeSet.forEach(key => {
          const checkbox = this.getCategoryCheckbox(category, key);
          if (checkbox) {
            checkbox.checked = false;
          }
        });
        activeSet.clear();
      });
      
      globalEventBus.emit('activeList:cleared');
    } finally {
      this.endBulkUpdate();
    }
  }
  
  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (!this.isInitialized) return;
    
    console.log('🔄 ActiveListManager: Destroying...');
    
    // Clear timers
    clearTimeout(this.bulkUpdateTimer);
    
    // Remove event listeners
    globalEventBus.off('data:layersLoaded', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerAdded', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerRemoved', this.handleCategoryDataUpdate);
    globalEventBus.off('data:layerToggled', this.updateActiveList);
    
    // Clean up checkbox listeners
    this.categories.forEach(category => {
      if (!window.namesByCategory?.[category]) return;
      
      window.namesByCategory[category].forEach(name => {
        const key = window.nameToKey[category][name];
        const checkbox = this.getCategoryCheckbox(category, key);
        
        if (checkbox && checkbox._modernBound) {
          checkbox.removeEventListener('change', this.handleCheckboxChange);
          checkbox._modernBound = false;
        }
      });
    });
    
    // Remove weather box
    if (this.weatherBox && this.weatherBox.parentNode) {
      this.weatherBox.parentNode.removeChild(this.weatherBox);
    }
    
    // Clear state
    this.activeItems.clear();
    this.currentWeatherLocation = null;
    
    // Clean up DOM references
    this.activeList = null;
    this.headerElement = null;
    this.weatherBox = null;
    
    this.isInitialized = false;
    
    console.log('✅ ActiveListManager: Destroyed');
  }
}

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.ActiveListManager = ActiveListManager;
  
  // Legacy functions for backward compatibility
  window.beginActiveListBulk = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.beginBulkUpdate();
    }
  };
  
  window.endActiveListBulk = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.endBulkUpdate();
    }
  };
  
  window.updateActiveList = function() {
    if (window.modernActiveListManager) {
      window.modernActiveListManager.updateActiveList();
    }
  };
}

console.log('🎯 ActiveListManager: Module loaded');
