/**
 * @module modules/SearchManager
 * Modern ES6-based search functionality for WeeWoo Map Friend
 * Provides debounced search with dropdown results and enhanced filtering
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class SearchManager
 * Manages global search functionality with enhanced features
 */
export class SearchManager {
  constructor() {
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
    
    console.log('🔍 SearchManager: Search management system initialized');
  }
  
  /**
   * Initialize the search manager
   */
  async init() {
    if (this.initialized) {
      console.warn('SearchManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 SearchManager: Starting initialization...');
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Initialize search if DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initSearch());
      } else {
        this.initSearch();
      }
      
      this.initialized = true;
      console.log('✅ SearchManager: Search management system ready');
      
    } catch (error) {
      console.error('🚨 SearchManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for data updates to rebuild search index
    globalEventBus.on('data:categoriesLoaded', () => {
      this.buildSearchIndex();
    });
    
    globalEventBus.on('data:namesByCategoryUpdated', () => {
      this.buildSearchIndex();
    });
    
    // Listen for search requests from other components
    globalEventBus.on('search:request', ({ query, category }) => {
      this.performSearch(query, category);
    });
  }
  
  /**
   * Initialize the global search input
   */
  initSearch() {
    this.searchBox = document.getElementById('globalSidebarSearch');
    this.dropdown = document.getElementById('sidebarSearchDropdown');
    
    if (!this.searchBox || !this.dropdown) {
      console.warn('SearchManager: Search elements not found');
      return;
    }
    
    console.log('SearchManager: Initializing search functionality');
    
    // Set up search input event listener
    this.searchBox.addEventListener('input', this.handleSearchInput);
    
    // Set up blur event listener to hide dropdown
    this.searchBox.addEventListener('blur', () => {
      setTimeout(() => {
        this.hideDropdown();
      }, 200);
    });
    
    // Build initial search index
    this.buildSearchIndex();
    
    console.log('SearchManager: Search functionality initialized');
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
    console.log('SearchManager: Performing search for:', { query, category });
    
    if (!query) {
      this.hideDropdown();
      return;
    }
    
    // Get search data from state manager or global variables
    const namesByCategory = window.namesByCategory || {};
    const nameToKey = window.nameToKey || {};
    const outlineColors = window.outlineColors || {};
    const labelColorAdjust = window.labelColorAdjust || {};
    
    console.log('SearchManager: Search data available:', {
      categories: Object.keys(namesByCategory).length,
      hasNameToKey: !!nameToKey,
      hasColors: !!outlineColors
    });
    
    // Perform search
    const results = [];
    const searchCategories = category ? [category] : Object.keys(namesByCategory);
    
    searchCategories.forEach(cat => {
      const names = namesByCategory[cat] || [];
      names.forEach(name => {
        if (name.toLowerCase().includes(query)) {
          // Find key in a case-insensitive way
          let key = nameToKey[cat]?.[name];
          if (!key) {
            // Try to find key by lowercasing all keys
            const lowerName = name.toLowerCase();
            for (const k in (nameToKey[cat] || {})) {
              if (k.toLowerCase() === lowerName) {
                key = nameToKey[cat][k];
                break;
              }
            }
          }
          
          if (key) {
            results.push({ cat, name, key });
          }
        }
      });
    });
    
    console.log('SearchManager: Search results:', results);
    
    // Display results
    this.displayResults(results);
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
    const outlineColors = window.outlineColors || {};
    const labelColorAdjust = window.labelColorAdjust || {};
    const adjustHexColor = window.adjustHexColor || ((color, factor) => color);
    
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
    
    console.log('SearchManager: Result clicked:', { cat, key, sidebarId });
    
    // Find the target element
    const targetElement = document.getElementById(sidebarId);
    if (!targetElement) {
      console.warn('SearchManager: Target element not found:', sidebarId);
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
    globalEventBus.emit('search:resultSelected', {
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
    }
  }
  
  /**
   * Build search index from available data
   */
  buildSearchIndex() {
    const namesByCategory = window.namesByCategory || {};
    const nameToKey = window.nameToKey || {};
    
    this.searchIndex.clear();
    
    Object.entries(namesByCategory).forEach(([category, names]) => {
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
    });
    
    console.log('SearchManager: Search index built with', this.searchIndex.size, 'entries');
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
}

// Export singleton instance
export const searchManager = new SearchManager();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.initSearch = () => searchManager.initSearch();
  window.SearchManager = searchManager;
}
