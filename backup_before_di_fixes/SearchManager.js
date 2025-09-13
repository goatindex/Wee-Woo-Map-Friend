/**
 * @module modules/SearchManager
 * Modern ES6-based search functionality for WeeWoo Map Friend
 * Provides debounced search with dropdown results and enhanced filtering
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';

/**
 * @class SearchManager
 * Manages global search functionality with enhanced features
 */
@injectable()
export class SearchManager extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger,
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.StateManager) stateManager,
    @inject(TYPES.ConfigurationManager) configurationManager
  ) {
    super(structuredLogger);
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.configurationManager = configurationManager;
    this.initialized = false;
    this.searchBox = null;
    this.dropdown = null;
    this.searchTimeout = null;
    this.searchResults = [];
    this.searchIndex = new Map();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.initSearch = this.initSearch.bind(this);
    this.performSearch = this.performSearch.bind(this);
    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.handleResultClick = this.handleResultClick.bind(this);
    this.buildSearchIndex = this.buildSearchIndex.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    this.logger.debug('Search management system initialized');
  }
  
  /**
   * Initialize the search manager
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }
    
    const timer = this.logger.time('search-manager-initialization');
    try {
      this.logger.info('Starting initialization', {
        operation: 'init',
        searchIndexSize: this.searchIndex.size
      });
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Initialize search if DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initSearch());
      } else {
        this.initSearch();
      }
      
      this.initialized = true;
      timer.end({
        success: true,
        searchIndexSize: this.searchIndex.size
      });
      this.logger.info('Search management system ready');
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        searchIndexSize: this.searchIndex.size
      });
      this.logger.error('Failed to initialize', {
        operation: 'init',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for data updates to rebuild search index
    this.eventBus.on('data:categoriesLoaded', () => {
      this.buildSearchIndex();
    });
    
    this.eventBus.on('data:namesByCategoryUpdated', () => {
      this.buildSearchIndex();
    });
    
    // Listen for search requests from other components
    this.eventBus.on('search:request', ({ query, category }) => {
      this.performSearch(query, category);
    });
  }
  
  /**
   * Initialize the global search input
   */
  initSearch() {
    const box = document.getElementById('globalSidebarSearch');
    const dropdown = document.getElementById('sidebarSearchDropdown');
    
    if (!box || !dropdown) {
      this.logger.warn('Search elements not found', {
        operation: 'initSearch',
        hasBox: !!box,
        hasDropdown: !!dropdown
      });
      return;
    }
    
    this.searchBox = box;
    this.dropdown = dropdown;
    
    // Set up ARIA attributes for accessibility
    this.setupARIA();
    
    this.logger.debug('Initializing search functionality', {
      operation: 'initSearch'
    });
    
    // Set up search input event listener with exact legacy behavior
    box.addEventListener('input', e => {
      clearTimeout(this.searchTimeout);
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        dropdown.style.display = 'none';
        return;
      }
      this.searchTimeout = setTimeout(() => {
        this.logger.debug('Search input processed', {
          operation: 'handleSearchInput',
          query: val
        });
        const namesByCategory = this.stateManager.get('namesByCategory', {});
        const nameToKey = this.stateManager.get('nameToKey', {});
        this.logger.debug('Search data retrieved', {
          operation: 'handleSearchInput',
          hasNamesByCategory: !!namesByCategory,
          hasNameToKey: !!nameToKey
        });
        this.performSearch(val);
      }, 120);
    });
    
    // Set up blur event listener to hide dropdown
    box.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        dropdown.style.display = 'none';
      }, 200);
    });
    
    // Set up keyboard navigation
    box.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
    
    // Build initial search index
    this.buildSearchIndex();
    
    this.logger.info('Search functionality initialized', {
      operation: 'initSearch',
      hasSearchBox: !!this.searchBox,
      hasDropdown: !!this.dropdown
    });
  }
  
  /**
   * Set up ARIA attributes for accessibility
   */
  setupARIA() {
    if (!this.searchBox || !this.dropdown) return;
    
    // Set up search box ARIA attributes
    this.searchBox.setAttribute('role', 'searchbox');
    this.searchBox.setAttribute('aria-autocomplete', 'list');
    this.searchBox.setAttribute('aria-controls', this.dropdown.id);
    this.searchBox.setAttribute('aria-expanded', 'false');
    this.searchBox.setAttribute('aria-activedescendant', '');
    
    // Set up dropdown ARIA attributes
    this.dropdown.setAttribute('role', 'listbox');
    this.dropdown.setAttribute('aria-label', 'Search results');
    this.dropdown.setAttribute('aria-hidden', 'true');
    
    this.logger.debug('ARIA attributes set up for search', {
      operation: 'setupARIA',
      searchBoxId: this.searchBox.id,
      dropdownId: this.dropdown.id
    });
  }
  
  /**
   * Handle keyboard navigation for search
   */
  handleKeydown(event) {
    if (!this.dropdown || this.dropdown.style.display === 'none') return;
    
    const items = this.dropdown.querySelectorAll('.dropdown-item');
    const currentActive = this.dropdown.querySelector('.dropdown-item.active');
    let currentIndex = -1;
    
    if (currentActive) {
      currentIndex = Array.from(items).indexOf(currentActive);
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        this.setActiveItem(items[currentIndex]);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        this.setActiveItem(items[currentIndex]);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (currentActive) {
          currentActive.click();
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.hideDropdown();
        this.searchBox.value = '';
        break;
        
      case 'Home':
        event.preventDefault();
        if (items.length > 0) {
          this.setActiveItem(items[0]);
        }
        break;
        
      case 'End':
        event.preventDefault();
        if (items.length > 0) {
          this.setActiveItem(items[items.length - 1]);
        }
        break;
    }
  }
  
  /**
   * Set active item in dropdown
   */
  setActiveItem(item) {
    if (!item) return;
    
    // Remove active class from all items
    this.dropdown.querySelectorAll('.dropdown-item').forEach(i => {
      i.classList.remove('active');
    });
    
    // Add active class to selected item
    item.classList.add('active');
    
    // Update ARIA attributes
    this.searchBox.setAttribute('aria-activedescendant', item.id || '');
    
    // Scroll item into view
    item.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Handle search input with debouncing
   */
  handleSearchInput(event) {
    const query = event.target.value.trim().toLowerCase();
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Hide dropdown if no query
    if (!query) {
      this.hideDropdown();
      return;
    }
    
    // Set new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 120);
  }
  
  /**
   * Perform search and display results
   */
  performSearch(query, category = null) {
    this.logger.debug('Performing search', {
      operation: 'performSearch',
      query,
      category
    });
    
    if (!query) {
      this.hideDropdown();
      return;
    }
    
    // Get search data from global variables (legacy compatibility)
    const namesByCategory = this.stateManager.get('namesByCategory', {});
    const nameToKey = this.stateManager.get('nameToKey', {});
    const outlineColors = this.configurationManager.get('outlineColors', {});
    const labelColorAdjust = this.configurationManager.get('labelColorAdjust', {});
    const adjustHexColor = this.configurationManager.get('adjustHexColor', ((color, factor) => color));
    
    // Check if search data is available
    if (!namesByCategory || !nameToKey || typeof namesByCategory !== 'object' || typeof nameToKey !== 'object') {
      this.logger.debug('Search data not available yet', {
        operation: 'performSearch',
        hasNamesByCategory: !!namesByCategory,
        hasNameToKey: !!nameToKey,
        namesByCategoryType: typeof namesByCategory,
        nameToKeyType: typeof nameToKey
      });
      this.hideDropdown();
      return;
    }
    
    this.logger.debug('Search data available', {
      operation: 'performSearch',
      categoriesCount: Object.keys(namesByCategory).length,
      hasNameToKey: !!nameToKey,
      hasColors: !!outlineColors
    });
    
    // Perform search with exact legacy logic
    const results = [];
    Object.entries(namesByCategory).forEach(([cat, names]) => {
      names.forEach(name => {
        // Case-insensitive search and key lookup
        if (name.toLowerCase().includes(query)) {
          // Find key in a case-insensitive way
          let key = nameToKey[cat][name];
          if (!key) {
            // Try to find key by lowercasing all keys
            const lowerName = name.toLowerCase();
            for (const k in nameToKey[cat]) {
              if (k.toLowerCase() === lowerName) {
                key = nameToKey[cat][k];
                break;
              }
            }
          }
          results.push({ cat, name, key });
        }
      });
    });
    
    this.logger.debug('Dropdown results generated', {
      operation: 'performSearch',
      resultCount: results.length
    });
    
    // Display results with exact legacy behavior
    if (results.length === 0) {
      this.dropdown.innerHTML = '<div class="dropdown-item" role="option" aria-selected="false">No matches</div>';
      this.dropdown.classList.add('active');
      this.dropdown.style.display = 'block';
      this.dropdown.setAttribute('aria-hidden', 'false');
      if (this.searchBox) {
        this.searchBox.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    
    this.dropdown.innerHTML = results.map((r, index) => {
      const base = outlineColors[r.cat] || '#333';
      const factor = (labelColorAdjust[r.cat] ?? 1.0);
      const color = adjustHexColor(base, factor);
      return `<div class="dropdown-item" role="option" aria-selected="false" id="search-result-${index}" data-cat="${r.cat}" data-key="${r.key}"><span class="name" style="color:${color}">${r.name}</span> <span style="color:#888;font-size:0.9em;">(${r.cat.toUpperCase()})</span></div>`;
    }).join('');
    
    this.dropdown.classList.add('active');
    this.dropdown.style.display = 'block';
    this.dropdown.setAttribute('aria-hidden', 'false');
    if (this.searchBox) {
      this.searchBox.setAttribute('aria-expanded', 'true');
    }
    
    // Handle click on dropdown item with exact legacy behavior
    this.dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.getAttribute('data-cat');
        const key = item.getAttribute('data-key');
        const sidebarId = `${cat}_${key}`;
        const el = document.getElementById(sidebarId);
        if (el) {
          // Expand the section if collapsed
          const headerId = `${cat}Header`;
          const header = document.getElementById(headerId);
          if (header && header.classList.contains('collapsed')) {
            header.click();
          }
          // Determine the checkbox element and a container to scroll/highlight
          let cb = null;
          let container = null;
          if (el.tagName === 'INPUT') {
            cb = el; // e.g., ambulance entries where the input has the id
            container = el.closest('.sidebar-list-row') || el.parentElement || el;
          } else {
            cb = el.querySelector('input[type="checkbox"]');
            container = el;
          }
          if (cb && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (container && container.scrollIntoView) {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            container.classList.add('search-highlight');
            setTimeout(() => container.classList.remove('search-highlight'), 1200);
          }
        }
        this.dropdown.innerHTML = '';
        this.dropdown.classList.remove('active');
        this.searchBox.value = '';
      });
    });
  }
  
  /**
   * Display search results in dropdown
   */
  displayResults(results) {
    if (!this.dropdown) return;
    
    if (results.length === 0) {
      this.dropdown.innerHTML = '<div class="dropdown-item">No matches</div>';
      this.dropdown.classList.add('active');
      this.dropdown.style.display = 'block';
      return;
    }
    
    // Get color utilities from global scope
    const outlineColors = this.configurationManager.get('outlineColors', {});
    const labelColorAdjust = this.configurationManager.get('labelColorAdjust', {});
    const adjustHexColor = this.configurationManager.get('adjustHexColor', ((color, factor) => color));
    
    // Build results HTML
    const resultsHTML = results.map(result => {
      const base = outlineColors[result.cat] || '#333';
      const factor = (labelColorAdjust[result.cat] ?? 1.0);
      const color = adjustHexColor(base, factor);
      
      return `
        <div class="dropdown-item" data-cat="${result.cat}" data-key="${result.key}">
          <span class="name" style="color:${color}">${result.name}</span>
          <span style="color:#888;font-size:0.9em;">(${result.cat.toUpperCase()})</span>
        </div>
      `;
    }).join('');
    
    this.dropdown.innerHTML = resultsHTML;
    this.dropdown.classList.add('active');
    this.dropdown.style.display = 'block';
    
    // Add click handlers to results
    this.dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => this.handleResultClick(item));
    });
  }
  
  /**
   * Handle click on search result
   */
  handleResultClick(item) {
    const cat = item.getAttribute('data-cat');
    const key = item.getAttribute('data-key');
    const sidebarId = `${cat}_${key}`;
    
    this.logger.info('Result clicked', {
      operation: 'handleResultClick',
      category: cat,
      key,
      sidebarId
    });
    
    // Find the target element
    const targetElement = document.getElementById(sidebarId);
    if (!targetElement) {
      this.logger.warn('Target element not found', {
        operation: 'handleResultClick',
        sidebarId,
        category: cat,
        key
      });
      return;
    }
    
    // Expand the section if collapsed
    const headerId = `${cat}Header`;
    const header = document.getElementById(headerId);
    if (header && header.classList.contains('collapsed')) {
      header.click();
    }
    
    // Find and check the checkbox
    let checkbox = null;
    let container = null;
    
    if (targetElement.tagName === 'INPUT') {
      checkbox = targetElement;
      container = targetElement.closest('.sidebar-list-row') || targetElement.parentElement || targetElement;
    } else {
      checkbox = targetElement.querySelector('input[type="checkbox"]');
      container = targetElement;
    }
    
    // Check the checkbox if it's not already checked
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Scroll to and highlight the container
    if (container && container.scrollIntoView) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      container.classList.add('search-highlight');
      setTimeout(() => container.classList.remove('search-highlight'), 1200);
    }
    
    // Emit search result selected event
    this.eventBus.emit('search:resultSelected', {
      category: cat,
      key: key,
      element: targetElement
    });
    
    // Hide dropdown and clear search
    this.hideDropdown();
    if (this.searchBox) {
      this.searchBox.value = '';
    }
  }
  
  /**
   * Hide the search dropdown
   */
  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.innerHTML = '';
      this.dropdown.classList.remove('active');
      this.dropdown.style.display = 'none';
      this.dropdown.setAttribute('aria-hidden', 'true');
      
      if (this.searchBox) {
        this.searchBox.setAttribute('aria-expanded', 'false');
        this.searchBox.setAttribute('aria-activedescendant', '');
      }
      
      this.logger.debug('Search dropdown hidden', {
        operation: 'hideDropdown'
      });
    }
  }
  
  /**
   * Build search index from available data
   */
  buildSearchIndex() {
    const namesByCategory = this.stateManager.get('namesByCategory', {});
    const nameToKey = this.stateManager.get('nameToKey', {});
    
    // Check if data is available
    if (!namesByCategory || !nameToKey || typeof namesByCategory !== 'object' || typeof nameToKey !== 'object') {
      this.logger.debug('Search index build skipped - data not available yet', {
        namesByCategory: !!namesByCategory,
        nameToKey: !!nameToKey,
        namesByCategoryType: typeof namesByCategory,
        nameToKeyType: typeof nameToKey
      });
      return;
    }
    
    this.searchIndex.clear();
    
    Object.entries(namesByCategory).forEach(([category, names]) => {
      if (Array.isArray(names)) {
        names.forEach(name => {
          const key = nameToKey[category]?.[name];
          if (key) {
            this.searchIndex.set(name.toLowerCase(), {
              category,
              name,
              key
            });
          }
        });
      }
    });
    
    this.logger.info('Search index built', {
      entryCount: this.searchIndex.size,
      categories: Object.keys(namesByCategory).length
    });
  }
  
  /**
   * Get search suggestions for autocomplete
   */
  getSuggestions(query, maxResults = 10) {
    if (!query || query.length < 2) return [];
    
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [name, data] of this.searchIndex.entries()) {
      if (name.includes(lowerQuery)) {
        suggestions.push(data);
        if (suggestions.length >= maxResults) break;
      }
    }
    
    return suggestions;
  }
  
  /**
   * Clear search and reset state
   */
  clearSearch() {
    if (this.searchBox) {
      this.searchBox.value = '';
    }
    this.hideDropdown();
    this.searchResults = [];
  }
  
  /**
   * Get search manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      searchBox: !!this.searchBox,
      dropdown: !!this.dropdown,
      searchIndexSize: this.searchIndex.size,
      searchResults: this.searchResults.length,
      lastQuery: this.searchBox?.value || ''
    };
  }
  
  /**
   * Check if search manager is ready
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Cleanup search manager resources
   */
  async cleanup() {
    this.logger.info('Cleaning up SearchManager resources');
    
    try {
      // Clear search timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }
      
      // Clear search results and index
      this.searchResults = [];
      this.searchIndex.clear();
      
      // Remove event listeners
      if (this.searchBox) {
        this.searchBox.removeEventListener('input', this.handleSearchInput);
        this.searchBox.removeEventListener('focus', this.handleSearchFocus);
        this.searchBox.removeEventListener('blur', this.handleSearchBlur);
      }
      
      // Remove dropdown from DOM
      if (this.dropdown && this.dropdown.parentNode) {
        this.dropdown.parentNode.removeChild(this.dropdown);
        this.dropdown = null;
      }
      
      // Clear references
      this.searchBox = null;
      
      // Reset state
      this.initialized = false;
      
      this.logger.info('SearchManager cleanup completed');
    } catch (error) {
      this.logger.error('SearchManager cleanup failed', { error: error.message });
      throw error;
    }
  }
}

// Legacy function for backward compatibility
export const searchManager = () => {
  console.warn('searchManager: Legacy function called. Use DI container to get SearchManager instance.');
  throw new Error('Legacy function not available. Use DI container to get SearchManager instance.');
};
