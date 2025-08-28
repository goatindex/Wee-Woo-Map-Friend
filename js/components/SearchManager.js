/**
 * @fileoverview Modern SearchManager Component
 * Manages global sidebar search functionality with dropdown results and smooth interactions.
 * Replaces legacy js/ui/search.js with modern architecture.
 */

import { ComponentBase } from '../modules/ComponentBase.js';
import { stateManager } from '../modules/StateManager.js';
import { globalEventBus } from '../modules/EventBus.js';

/**
 * @class SearchManager
 * @extends ComponentBase
 * 
 * Modern search manager for global sidebar search with:
 * - Debounced input handling for performance
 * - Intelligent result filtering and highlighting
 * - Seamless integration with CollapsibleManager
 * - Keyboard navigation and accessibility
 * - State persistence and event-driven updates
 */
export class SearchManager extends ComponentBase {
  /**
   * Create SearchManager instance
   * @param {HTMLElement} container - Search container element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      // Default options
      debounceDelay: 120,
      maxResults: 20,
      minSearchLength: 1,
      highlightDuration: 1200,
      dropdownBlurDelay: 200,
      // User options override defaults
      ...options
    });

    /**
     * @type {HTMLInputElement|null}
     * @private
     */
    this.searchInput = null;

    /**
     * @type {HTMLElement|null}
     * @private
     */
    this.dropdown = null;

    /**
     * @type {number|null}
     * @private
     */
    this.debounceTimer = null;

    /**
     * @type {Array<Object>}
     * @private
     */
    this.searchData = [];

    /**
     * @type {string}
     * @private
     */
    this.currentQuery = '';

    /**
     * @type {number}
     * @private
     */
    this.selectedIndex = -1;

    // Bind methods to this instance
    this.handleInput = this.handleInput.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    this.performSearch = this.performSearch.bind(this);
    this.updateSearchData = this.updateSearchData.bind(this);
  }

  /**
   * Initialize the search manager
   */
  async init() {
    console.log('🔍 SearchManager: Initializing modern search system');

    try {
      // Find search elements
      this.findSearchElements();

      // Set up event listeners
      this.setupEventListeners();

      // Load initial search data
      await this.loadSearchData();

      // Set up state management
      this.setupStateManagement();

      // Initialize accessibility
      this.initializeAccessibility();

      this.isInitialized = true;
      console.log('✅ SearchManager: Modern search system initialized');

    } catch (error) {
      console.error('🚨 SearchManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Find and validate search DOM elements
   * @private
   */
  findSearchElements() {
    this.searchInput = this.container.querySelector('#globalSidebarSearch') || 
                     this.container.querySelector('.search-box') ||
                     document.getElementById('globalSidebarSearch');

    this.dropdown = this.container.querySelector('#sidebarSearchDropdown') ||
                   this.container.querySelector('.sidebar-search-dropdown') ||
                   document.getElementById('sidebarSearchDropdown');

    if (!this.searchInput) {
      throw new Error('SearchManager: Search input element not found');
    }

    if (!this.dropdown) {
      throw new Error('SearchManager: Search dropdown element not found');
    }

    console.log('🔍 SearchManager: Found search elements');
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', this.handleInput);
    this.searchInput.addEventListener('keydown', this.handleKeyDown);
    this.searchInput.addEventListener('blur', this.handleBlur);

    // Dropdown events
    this.dropdown.addEventListener('click', this.handleDropdownClick);

    // Global events
    globalEventBus.on('data:layersLoaded', this.updateSearchData);
    globalEventBus.on('data:layerAdded', this.updateSearchData);
    globalEventBus.on('data:layerRemoved', this.updateSearchData);
    globalEventBus.on('search:clear', this.clearSearch.bind(this));
    globalEventBus.on('search:focus', this.focusSearch.bind(this));

    console.log('👂 SearchManager: Event listeners attached');
  }

  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager (skip if not available in test environment)
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('searchManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });

      // Watch for state changes
      if (typeof stateManager.subscribe === 'function') {
        stateManager.subscribe('ui.search', (state) => {
          this.applyState(state);
        });
      }
    }
  }

  /**
   * Initialize accessibility features
   * @private
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.searchInput.setAttribute('role', 'combobox');
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.setAttribute('aria-haspopup', 'listbox');
    this.searchInput.setAttribute('aria-autocomplete', 'list');
    this.searchInput.setAttribute('aria-controls', this.dropdown.id);

    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-label', 'Search results');

    // Add labels if missing
    if (!this.searchInput.getAttribute('aria-label') && !this.searchInput.getAttribute('aria-labelledby')) {
      this.searchInput.setAttribute('aria-label', 'Search all layers');
    }
  }

  /**
   * Load search data from global state
   * @private
   */
  async loadSearchData() {
    try {
      // Check for legacy global data
      if (window.namesByCategory && window.nameToKey) {
        this.buildSearchDataFromLegacy();
      } else {
        // Wait for data to be loaded
        globalEventBus.once('data:layersLoaded', () => {
          this.buildSearchDataFromLegacy();
        });
      }

      console.log(`📊 SearchManager: Loaded ${this.searchData.length} search entries`);

    } catch (error) {
      console.error('🚨 SearchManager: Failed to load search data:', error);
      this.searchData = [];
    }
  }

  /**
   * Build search data from legacy global variables
   * @private
   */
  buildSearchDataFromLegacy() {
    this.searchData = [];

    if (!window.namesByCategory || !window.nameToKey) {
      console.warn('⚠️ SearchManager: Legacy search data not available');
      return;
    }

    Object.entries(window.namesByCategory).forEach(([category, names]) => {
      if (!Array.isArray(names)) return;

      names.forEach(name => {
        if (!name || typeof name !== 'string') return;

        // Find key in a case-insensitive way
        let key = window.nameToKey[category]?.[name];
        if (!key) {
          // Try to find key by lowercasing all keys
          const lowerName = name.toLowerCase();
          for (const k in window.nameToKey[category] || {}) {
            if (k.toLowerCase() === lowerName) {
              key = window.nameToKey[category][k];
              break;
            }
          }
        }

        if (key) {
          this.searchData.push({
            category,
            name,
            key,
            searchText: name.toLowerCase(),
            sidebarId: `${category}_${key}`
          });
        }
      });
    });

    console.log(`📊 SearchManager: Built search data with ${this.searchData.length} entries`);
  }

  /**
   * Handle search input events
   * @param {Event} event - Input event
   * @private
   */
  handleInput(event) {
    const query = event.target.value.trim();
    this.currentQuery = query;

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    if (query.length < this.options.minSearchLength) {
      this.hideDropdown();
      return;
    }

    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, this.options.debounceDelay);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyDown(event) {
    if (!this.isDropdownVisible()) return;

    const items = this.dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection(items);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
          this.selectResult(items[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  /**
   * Handle search input blur
   * @param {Event} event - Blur event
   * @private
   */
  handleBlur(event) {
    // Delay hiding to allow dropdown clicks
    setTimeout(() => {
      this.hideDropdown();
    }, this.options.dropdownBlurDelay);
  }

  /**
   * Handle dropdown click events
   * @param {Event} event - Click event
   * @private
   */
  handleDropdownClick(event) {
    const item = event.target.closest('.dropdown-item');
    if (item && !item.classList.contains('no-results')) {
      this.selectResult(item);
    }
  }

  /**
   * Perform search with the given query
   * @param {string} query - Search query
   * @private
   */
  performSearch(query) {
    const lowerQuery = query.toLowerCase();
    
    const results = this.searchData
      .filter(item => item.searchText.includes(lowerQuery))
      .slice(0, this.options.maxResults);

    this.displayResults(results, query);
    
    // Emit search event
    globalEventBus.emit('search:performed', { 
      query, 
      results: results.length,
      timestamp: new Date()
    });

    console.log(`🔍 SearchManager: Found ${results.length} results for "${query}"`);
  }

  /**
   * Display search results in dropdown
   * @param {Array<Object>} results - Search results
   * @param {string} query - Original query
   * @private
   */
  displayResults(results, query) {
    if (results.length === 0) {
      this.dropdown.innerHTML = '<div class="dropdown-item no-results">No matches found</div>';
    } else {
      this.dropdown.innerHTML = results.map(result => 
        this.createResultHTML(result, query)
      ).join('');
    }

    this.showDropdown();
    this.selectedIndex = -1;
  }

  /**
   * Create HTML for a search result item
   * @param {Object} result - Search result
   * @param {string} query - Search query for highlighting
   * @returns {string} HTML string
   * @private
   */
  createResultHTML(result, query) {
    // Get color for category
    const baseColor = this.getCategoryColor(result.category);
    const highlightedName = this.highlightQuery(result.name, query);
    
    return `
      <div class="dropdown-item" data-cat="${result.category}" data-key="${result.key}" data-sidebar-id="${result.sidebarId}">
        <span class="name" style="color:${baseColor}">${highlightedName}</span>
        <span class="category" style="color:#888;font-size:0.9em;">(${result.category.toUpperCase()})</span>
      </div>
    `;
  }

  /**
   * Get color for a category
   * @param {string} category - Category name
   * @returns {string} Color value
   * @private
   */
  getCategoryColor(category) {
    if (window.outlineColors && window.outlineColors[category]) {
      const base = window.outlineColors[category];
      const factor = window.labelColorAdjust?.[category] ?? 1.0;
      return window.adjustHexColor ? window.adjustHexColor(base, factor) : base;
    }
    return '#333';
  }

  /**
   * Highlight query text in result name
   * @param {string} name - Result name
   * @param {string} query - Search query
   * @returns {string} Name with highlighted query
   * @private
   */
  highlightQuery(name, query) {
    if (!query) return name;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return name.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Update keyboard selection highlighting
   * @param {NodeList} items - Dropdown items
   * @private
   */
  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Update ARIA attributes
    this.searchInput.setAttribute('aria-activedescendant', 
      this.selectedIndex >= 0 ? `search-result-${this.selectedIndex}` : '');
  }

  /**
   * Select a search result
   * @param {HTMLElement} item - Selected dropdown item
   * @private
   */
  selectResult(item) {
    const category = item.getAttribute('data-cat');
    const key = item.getAttribute('data-key');
    const sidebarId = item.getAttribute('data-sidebar-id');

    this.activateSearchResult(category, key, sidebarId);
    this.hideDropdown();
    this.clearSearch();

    // Emit selection event
    globalEventBus.emit('search:selected', { category, key, sidebarId });
  }

  /**
   * Activate the selected search result
   * @param {string} category - Result category
   * @param {string} key - Result key
   * @param {string} sidebarId - Sidebar element ID
   * @private
   */
  activateSearchResult(category, key, sidebarId) {
    const element = document.getElementById(sidebarId);
    if (!element) {
      console.warn(`⚠️ SearchManager: Element not found: ${sidebarId}`);
      return;
    }

    // Expand the section if collapsed (integrate with CollapsibleManager)
    this.expandSection(category);

    // Find and activate checkbox
    const { checkbox, container } = this.findCheckboxAndContainer(element);
    
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Scroll to and highlight the result
    if (container) {
      this.scrollToAndHighlight(container);
    }
  }

  /**
   * Expand the section containing the search result
   * @param {string} category - Category to expand
   * @private
   */
  expandSection(category) {
    const headerId = `${category}Header`;
    const header = document.getElementById(headerId);
    
    if (header && header.classList.contains('collapsed')) {
      // Try to use modern CollapsibleManager first
      const collapsibleManager = stateManager.get('components.collapsibleManager');
      if (collapsibleManager && typeof collapsibleManager.expandSection === 'function') {
        collapsibleManager.expandSection(category);
      } else {
        // Fallback to direct header click
        header.click();
      }
    }
  }

  /**
   * Find checkbox and container elements
   * @param {HTMLElement} element - Target element
   * @returns {Object} Object with checkbox and container
   * @private
   */
  findCheckboxAndContainer(element) {
    let checkbox = null;
    let container = null;

    if (element.tagName === 'INPUT') {
      checkbox = element;
      container = element.closest('.sidebar-list-row') || element.parentElement || element;
    } else {
      checkbox = element.querySelector('input[type="checkbox"]');
      container = element;
    }

    return { checkbox, container };
  }

  /**
   * Scroll to and highlight a container
   * @param {HTMLElement} container - Container to highlight
   * @private
   */
  scrollToAndHighlight(container) {
    if (container.scrollIntoView) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      container.classList.add('search-highlight');
      setTimeout(() => {
        container.classList.remove('search-highlight');
      }, this.options.highlightDuration);
    }
  }

  /**
   * Show the dropdown
   * @private
   */
  showDropdown() {
    this.dropdown.classList.add('active');
    this.dropdown.style.display = 'block';
    this.searchInput.setAttribute('aria-expanded', 'true');
  }

  /**
   * Hide the dropdown
   * @private
   */
  hideDropdown() {
    this.dropdown.classList.remove('active');
    this.dropdown.style.display = 'none';
    this.dropdown.innerHTML = '';
    this.selectedIndex = -1;
    this.searchInput.setAttribute('aria-expanded', 'false');
    this.searchInput.removeAttribute('aria-activedescendant');
  }

  /**
   * Check if dropdown is visible
   * @returns {boolean} Whether dropdown is visible
   * @private
   */
  isDropdownVisible() {
    return this.dropdown.classList.contains('active');
  }

  /**
   * Clear the search input and hide dropdown
   */
  clearSearch() {
    this.searchInput.value = '';
    this.currentQuery = '';
    this.hideDropdown();
    clearTimeout(this.debounceTimer);
  }

  /**
   * Focus the search input
   */
  focusSearch() {
    this.searchInput.focus();
  }

  /**
   * Update search data when layers change
   * @private
   */
  updateSearchData() {
    // Debounce rapid updates
    clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => {
      this.buildSearchDataFromLegacy();
    }, 100);
  }

  /**
   * Get current search state
   * @returns {Object} Current state
   */
  getState() {
    return {
      query: this.currentQuery,
      isDropdownVisible: this.isDropdownVisible(),
      selectedIndex: this.selectedIndex,
      searchDataCount: this.searchData.length
    };
  }

  /**
   * Apply state to search manager
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (!state) return;

    if (state.query !== undefined) {
      this.searchInput.value = state.query;
      this.currentQuery = state.query;
    }

    if (state.isDropdownVisible && state.query) {
      this.performSearch(state.query);
    }
  }

  /**
   * Destroy the search manager
   */
  destroy() {
    // Clear timers
    clearTimeout(this.debounceTimer);
    clearTimeout(this.updateTimer);

    // Remove event listeners
    if (this.searchInput) {
      this.searchInput.removeEventListener('input', this.handleInput);
      this.searchInput.removeEventListener('keydown', this.handleKeyDown);
      this.searchInput.removeEventListener('blur', this.handleBlur);
    }

    if (this.dropdown) {
      this.dropdown.removeEventListener('click', this.handleDropdownClick);
    }

    // Remove global event listeners
    globalEventBus.off('data:layersLoaded', this.updateSearchData);
    globalEventBus.off('data:layerAdded', this.updateSearchData);
    globalEventBus.off('data:layerRemoved', this.updateSearchData);

    // Clear search data
    this.searchData = [];

    super.destroy();
  }
}

// Export the SearchManager as default
export default SearchManager;
