/**
 * @module modules/ActiveListManager
 * Modern ES6-based active list management for WeeWoo Map Friend
 * Replaces js/ui/activeList.js with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';
import { configurationManager } from './ConfigurationManager.js';

/**
 * @class ActiveListManager
 * Manages the "All Active" sidebar section with modern ES6 architecture
 */
export class ActiveListManager {
  constructor() {
    this.initialized = false;
    this.activeListContainer = null;
    this.weatherBox = null;
    this.bulkOperationActive = false;
    this.pendingUpdates = new Set();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.updateActiveList = this.updateActiveList.bind(this);
    this.beginBulkOperation = this.beginBulkOperation.bind(this);
    this.endBulkOperation = this.endBulkOperation.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.renderActiveList = this.renderActiveList.bind(this);
    
    console.log('📋 ActiveListManager: Active list system initialized');
  }
  
  /**
   * Initialize the active list manager
   */
  async init() {
    if (this.initialized) {
      console.warn('ActiveListManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 ActiveListManager: Starting initialization...');
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize weather box
      this.initWeatherBox();
      
      // Set up state watchers
      this.setupStateWatchers();
      
      this.initialized = true;
      console.log('✅ ActiveListManager: Active list system ready');
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Set up event listeners for the active list system
   */
  setupEventListeners() {
    // Listen for state changes that should trigger active list updates
    globalEventBus.on('stateChange', ({ property, value }) => {
      if (this.shouldUpdateActiveList(property)) {
        this.scheduleUpdate();
      }
    });
    
    // Listen for configuration changes
    globalEventBus.on('config:change', ({ path, value }) => {
      if (path.startsWith('categoryMeta')) {
        this.scheduleUpdate();
      }
    });
    
    // Listen for bulk operation events
    globalEventBus.on('bulk:begin', () => {
      this.beginBulkOperation();
    });
    
    globalEventBus.on('bulk:end', () => {
      this.endBulkOperation();
    });
    
    // Listen for legacy events for backward compatibility
    globalEventBus.on('legacy:activeListUpdate', () => {
      this.scheduleUpdate();
    });
    
    console.log('✅ ActiveListManager: Event listeners setup complete');
  }
  
  /**
   * Set up state watchers for reactive updates
   */
  setupStateWatchers() {
    // Watch for changes in feature layers
    stateManager.watch('featureLayers', () => {
      this.scheduleUpdate();
    });
    
    // Watch for changes in names by category
    stateManager.watch('namesByCategory', () => {
      this.scheduleUpdate();
    });
    
    // Watch for changes in emphasised state
    stateManager.watch('emphasised', () => {
      this.scheduleUpdate();
    });
    
    // Watch for changes in name label markers
    stateManager.watch('nameLabelMarkers', () => {
      this.scheduleUpdate();
    });
    
    console.log('✅ ActiveListManager: State watchers setup complete');
  }
  
  /**
   * Check if a state change should trigger active list update
   */
  shouldUpdateActiveList(property) {
    const relevantProperties = [
      'featureLayers',
      'namesByCategory', 
      'emphasised',
      'nameLabelMarkers',
      'activeListFilter'
    ];
    
    return relevantProperties.some(prop => property.startsWith(prop));
  }
  
  /**
   * Schedule an active list update
   */
  scheduleUpdate() {
    if (this.bulkOperationActive) {
      this.pendingUpdates.add('activeList');
      return;
    }
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      this.updateActiveList();
    });
  }
  
  /**
   * Begin a bulk operation
   */
  beginBulkOperation() {
    this.bulkOperationActive = true;
    this.pendingUpdates.clear();
    console.log('🔄 ActiveListManager: Bulk operation started');
  }
  
  /**
   * End a bulk operation
   */
  endBulkOperation() {
    this.bulkOperationActive = false;
    
    // Process any pending updates
    if (this.pendingUpdates.has('activeList')) {
      this.pendingUpdates.delete('activeList');
      this.scheduleUpdate();
    }
    
    console.log('✅ ActiveListManager: Bulk operation ended');
  }
  
  /**
   * Update the active list display
   */
  updateActiveList() {
    try {
      if (!this.activeListContainer) {
        this.activeListContainer = document.getElementById('activeList');
        if (!this.activeListContainer) {
          console.warn('⚠️ ActiveListManager: Active list container not found');
          return;
        }
      }
      
      // Get current state
      const featureLayers = stateManager.get('featureLayers', {});
      const namesByCategory = stateManager.get('namesByCategory', {});
      const emphasised = stateManager.get('emphasised', {});
      const categoryMeta = configurationManager.get('categoryMeta', {});
      
      // Render the active list
      this.renderActiveList(featureLayers, namesByCategory, emphasised, categoryMeta);
      
      console.log('✅ ActiveListManager: Active list updated');
      
    } catch (error) {
      console.error('🚨 ActiveListManager: Failed to update active list:', error);
    }
  }
  
  /**
   * Render the active list HTML
   */
  renderActiveList(featureLayers, namesByCategory, emphasised, categoryMeta) {
    const container = this.activeListContainer;
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Get all active items
    const activeItems = this.getActiveItems(featureLayers, namesByCategory, categoryMeta);
    
    if (activeItems.length === 0) {
      // No active items - hide the section
      this.hideActiveListSection();
      return;
    }
    
    // Show the section
    this.showActiveListSection();
    
    // Render header
    this.renderHeader(container);
    
    // Render items
    activeItems.forEach(item => {
      this.renderItem(container, item, emphasised, categoryMeta);
    });
  }
  
  /**
   * Get all currently active items
   */
  getActiveItems(featureLayers, namesByCategory, categoryMeta) {
    const activeItems = [];
    
    Object.keys(categoryMeta).forEach(category => {
      if (!namesByCategory[category] || !featureLayers[category]) return;
      
      namesByCategory[category].forEach(name => {
        const key = this.getNameKey(category, name);
        if (!key) return;
        
        // Check if item is visible (checkbox checked)
        const checkbox = this.getCategoryCheckbox(category, key);
        if (!checkbox || !checkbox.checked) return;
        
        activeItems.push({
          category,
          name,
          key,
          type: categoryMeta[category].type,
          layer: featureLayers[category][key]
        });
      });
    });
    
    return activeItems;
  }
  
  /**
   * Get the key for a name in a category
   */
  getNameKey(category, name) {
    const nameToKey = stateManager.get('nameToKey', {});
    return nameToKey[category]?.[name];
  }
  
  /**
   * Get the checkbox element for a category/key
   */
  getCategoryCheckbox(category, key) {
    const id = `${category}_${key}`;
    const el = document.getElementById(id);
    
    if (!el) return document.querySelector(`input#${id}`);
    if (el.tagName === 'INPUT') return el;
    
    const inside = el.querySelector('input[type="checkbox"]');
    return inside || document.querySelector(`input#${id}`);
  }
  
  /**
   * Render the active list header
   */
  renderHeader(container) {
    const headerRow = document.createElement('div');
    headerRow.className = 'active-list-header';
    headerRow.style.cssText = 'display:flex; align-items:center; margin-bottom:4px;';
    
    // Spacer for remove button
    const spacer = document.createElement('span');
    spacer.style.width = '32px';
    headerRow.appendChild(spacer);
    
    // Name header
    const nameHeader = document.createElement('span');
    nameHeader.textContent = 'Name';
    nameHeader.className = 'active-list-name-header';
    nameHeader.style.cssText = 'flex:1; text-align:left;';
    headerRow.appendChild(nameHeader);
    
    // Emphasise header
    const emphHeader = document.createElement('span');
    emphHeader.textContent = '📢';
    emphHeader.title = 'Emphasise';
    emphHeader.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px; font-weight:bold;';
    emphHeader.classList.add('active-list-icon-header');
    headerRow.appendChild(emphHeader);
    
    // Show Name header
    const nameLabelHeader = document.createElement('span');
    nameLabelHeader.textContent = '🏷️';
    nameLabelHeader.title = 'Show Name';
    nameLabelHeader.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px; font-weight:bold;';
    nameLabelHeader.classList.add('active-list-icon-header');
    headerRow.appendChild(nameLabelHeader);
    
    // 7/7 Weather header
    const sevenHeader = document.createElement('span');
    sevenHeader.textContent = '🌦️';
    sevenHeader.title = '7-day weather';
    sevenHeader.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px; font-weight:bold;';
    sevenHeader.classList.add('active-list-icon-header');
    headerRow.appendChild(sevenHeader);
    
    container.appendChild(headerRow);
  }
  
  /**
   * Render an individual active list item
   */
  renderItem(container, item, emphasised, categoryMeta) {
    const { category, name, key, type, layer } = item;
    const meta = categoryMeta[category];
    
    const row = document.createElement('div');
    row.className = 'active-list-row';
    row.style.cssText = 'display:flex; align-items:center; margin-bottom:2px;';
    
    // Set lat/lon for polygons
    if (type === 'polygon' && layer && layer[0] && layer[0].getBounds) {
      const center = layer[0].getBounds().getCenter();
      row.dataset.lat = center.lat;
      row.dataset.lon = center.lng;
    }
    
    // Remove button
    this.renderRemoveButton(row, category, key);
    
    // Name
    this.renderNameCell(row, category, name);
    
    // Emphasise toggle
    this.renderEmphasiseToggle(row, category, key, emphasised);
    
    // Show Name toggle
    this.renderLabelToggle(row, category, key, name, type, layer);
    
    // 7/7 Weather toggle
    this.renderWeatherToggle(row, type);
    
    container.appendChild(row);
  }
  
  /**
   * Render the remove button for an item
   */
  renderRemoveButton(row, category, key) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.title = 'Remove from active';
    removeBtn.style.cssText = 'color:#d32f2f; background:none; border:none; font-size:1.2em; cursor:pointer; width:32px; margin:0 2px 0 0;';
    
    removeBtn.onclick = () => {
      const checkbox = this.getCategoryCheckbox(category, key);
      if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    
    row.appendChild(removeBtn);
  }
  
  /**
   * Render the name cell for an item
   */
  renderNameCell(row, category, name) {
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('active-list-name');
    
    // Format name based on category
    let displayName = name;
    if (category === 'ambulance') {
      displayName = this.formatAmbulanceName(name);
    } else if (category === 'police') {
      displayName = this.formatPoliceName(name);
    }
    
    nameSpan.textContent = displayName;
    nameSpan.style.flex = '1';
    
    // Set color to match polygon border
    const outlineColors = configurationManager.get('outlineColors', {});
    const labelColorAdjust = configurationManager.get('labelColorAdjust', {});
    const baseColor = outlineColors[category];
    const factor = labelColorAdjust[category] ?? 1.0;
    
    if (baseColor) {
      const utils = configurationManager.get('utils', {});
      if (utils.adjustHexColor) {
        nameSpan.style.color = utils.adjustHexColor(baseColor, factor);
      } else {
        nameSpan.style.color = baseColor;
      }
    }
    
    row.appendChild(nameSpan);
  }
  
  /**
   * Render the emphasise toggle for an item
   */
  renderEmphasiseToggle(row, category, key, emphasised) {
    const emphCell = document.createElement('span');
    emphCell.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px;';
    
    const emphCb = document.createElement('input');
    emphCb.type = 'checkbox';
    emphCb.checked = !!emphasised[category]?.[key];
    emphCb.title = 'Emphasise';
    emphCb.style.cssText = 'width:18px; height:18px; margin:0;';
    
    emphCb.addEventListener('change', (e) => {
      this.setEmphasis(category, key, e.target.checked);
    });
    
    emphCell.appendChild(emphCb);
    row.appendChild(emphCell);
  }
  
  /**
   * Render the label toggle for an item
   */
  renderLabelToggle(row, category, key, name, type, layer) {
    const labelCell = document.createElement('span');
    labelCell.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px;';
    
    const labelCb = document.createElement('input');
    labelCb.type = 'checkbox';
    labelCb.checked = true; // Default: checked when first added
    labelCb.title = 'Show Name';
    labelCb.style.cssText = 'width:18px; height:18px; margin:0;';
    
    labelCb.addEventListener('change', (e) => {
      if (e.target.checked) {
        let layerOrMarker = null;
        let isPoint = (type === 'point');
        
        if (isPoint) {
          layerOrMarker = layer;
        } else {
          layerOrMarker = layer && layer[0];
        }
        
        if (window.ensureLabel) {
          window.ensureLabel(category, key, name, isPoint, layerOrMarker);
        }
      } else {
        if (window.removeLabel) {
          window.removeLabel(category, key);
        }
      }
    });
    
    labelCell.appendChild(labelCb);
    row.appendChild(labelCell);
    
    // Show label if checked
    if (labelCb.checked && layer) {
      let layerOrMarker = null;
      let isPoint = (type === 'point');
      
      if (isPoint) {
        layerOrMarker = layer;
      } else {
        layerOrMarker = layer[0];
      }
      
      if (layerOrMarker && window.ensureLabel) {
        window.ensureLabel(category, key, name, isPoint, layerOrMarker);
      }
    }
  }
  
  /**
   * Render the weather toggle for an item
   */
  renderWeatherToggle(row, type) {
    const sevenCell = document.createElement('span');
    sevenCell.style.cssText = 'display:flex; justify-content:center; align-items:center; width:32px;';
    
    const sevenCb = document.createElement('input');
    sevenCb.type = 'checkbox';
    sevenCb.className = 'sevenSevenCheckbox';
    sevenCb.title = 'Show 7-day weather';
    sevenCb.style.cssText = 'width:18px; height:18px; margin:0;';
    
    sevenCb.addEventListener('change', async (e) => {
      if (e.target.checked) {
        // Uncheck other weather checkboxes
        document.querySelectorAll('.sevenSevenCheckbox').forEach(cb => {
          if (cb !== sevenCb) cb.checked = false;
        });
        
        const lat = row.dataset.lat;
        const lon = row.dataset.lon;
        
        if (lat && lon && type === 'polygon') {
          await this.showWeatherForecast(lat, lon);
        } else {
          this.hideWeatherBox();
        }
      } else {
        this.hideWeatherBox();
      }
    });
    
    sevenCell.appendChild(sevenCb);
    row.appendChild(sevenCell);
  }
  
  /**
   * Initialize the weather box
   */
  initWeatherBox() {
    this.weatherBox = document.getElementById('weatherBox');
    if (!this.weatherBox) {
      this.weatherBox = document.createElement('div');
      this.weatherBox.id = 'weatherBox';
      this.weatherBox.style.cssText = `
        position: fixed;
        left: 20px;
        bottom: 20px;
        width: 320px;
        max-height: 60vh;
        overflow-y: auto;
        background: rgba(255,255,255,0.95);
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 9999;
        padding: 16px;
        display: none;
      `;
      document.body.appendChild(this.weatherBox);
    }
  }
  
  /**
   * Show weather forecast for a location
   */
  async showWeatherForecast(lat, lon) {
    if (!this.weatherBox) return;
    
    // Show loading state
    this.weatherBox.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center">
        <span>Loading weather…</span>
        <span class="spinner" style="width:12px;height:12px;border:2px solid #ccc;border-top-color:#333;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite"></span>
      </div>
    `;
    this.weatherBox.style.display = 'block';
    
    try {
      const { forecastData, historyData } = await this.fetchWeatherData(lat, lon);
      this.renderWeatherBox(forecastData, historyData);
    } catch (err) {
      this.weatherBox.innerHTML = '<span style="color:red">Error loading weather data.</span>';
      this.weatherBox.style.display = 'block';
    }
  }
  
  /**
   * Hide the weather box
   */
  hideWeatherBox() {
    if (this.weatherBox) {
      this.weatherBox.style.display = 'none';
    }
  }
  
  /**
   * Fetch weather data from backend
   */
  async fetchWeatherData(lat, lon) {
    const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:5000'
      : '';
    
    const chosenProvider = (typeof localStorage !== 'undefined' && (localStorage.getItem('weatherProvider') || 'willyweather')) || 'willyweather';
    const makeUrl = (prov) => `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(prov)}`;
    
    let data;
    try {
      const res = await fetch(makeUrl(chosenProvider));
      if (!res.ok) throw new Error(`Weather API error ${res.status}`);
      data = await res.json();
    } catch (e) {
      // Fallback to Open-Meteo if WillyWeather fails
      if (chosenProvider === 'willyweather') {
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
    
    const forecastData = { days };
    const historyData = { days: [] };
    
    return { forecastData, historyData };
  }
  
  /**
   * Render the weather box content
   */
  renderWeatherBox(forecastData, historyData) {
    if (!this.weatherBox) return;
    
    let html = '<h3>7-Day Weather Forecast</h3>';
    html += '<ul>';
    forecastData.days.forEach(day => {
      const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
      const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
      html += `<li>${day.date}: ${day.summary}${tmin}${tmax}</li>`;
    });
    html += '</ul>';
    
    html += '<h3>Past 7 Days</h3>';
    html += '<ul>';
    historyData.days.forEach(day => {
      html += `<li>${day.date}: ${day.summary}</li>`;
    });
    html += '</ul>';
    
    this.weatherBox.innerHTML = html;
    this.weatherBox.style.display = 'block';
  }
  
  /**
   * Set emphasis for a feature
   */
  setEmphasis(category, key, emphasised) {
    // Update state
    const currentEmphasised = stateManager.get('emphasised', {});
    if (!currentEmphasised[category]) {
      currentEmphasised[category] = {};
    }
    currentEmphasised[category][key] = emphasised;
    stateManager.set('emphasised', currentEmphasised);
    
    // Call legacy function if available
    if (window.setEmphasis) {
      window.setEmphasis(category, key, emphasised);
    }
  }
  
  /**
   * Format ambulance name
   */
  formatAmbulanceName(name) {
    if (window.formatAmbulanceName) {
      return window.formatAmbulanceName(name);
    }
    return name;
  }
  
  /**
   * Format police name
   */
  formatPoliceName(name) {
    if (window.formatPoliceName) {
      return window.formatPoliceName(name);
    }
    return name;
  }
  
  /**
   * Hide the active list section
   */
  hideActiveListSection() {
    const headerEl = document.getElementById('activeHeader');
    if (headerEl) {
      headerEl.classList.add('collapsed');
    }
    if (this.activeListContainer) {
      this.activeListContainer.style.display = 'none';
    }
  }
  
  /**
   * Show the active list section
   */
  showActiveListSection() {
    const headerEl = document.getElementById('activeHeader');
    if (headerEl) {
      headerEl.classList.remove('collapsed');
    }
    if (this.activeListContainer) {
      this.activeListContainer.style.display = '';
    }
  }
  
  /**
   * Get the status of the active list manager
   */
  getStatus() {
    return {
      initialized: this.initialized,
      bulkOperationActive: this.bulkOperationActive,
      pendingUpdates: Array.from(this.pendingUpdates),
      activeListContainer: !!this.activeListContainer,
      weatherBox: !!this.weatherBox
    };
  }
}

// Export singleton instance
export const activeListManager = new ActiveListManager();

// Export for global access
if (typeof window !== 'undefined') {
  window.ActiveListManager = ActiveListManager;
  window.activeListManager = activeListManager;
}
