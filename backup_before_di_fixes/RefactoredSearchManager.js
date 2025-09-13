/**
 * @module modules/RefactoredSearchManager
 * Refactored SearchManager using event-driven architecture and dependency injection
 * Implements independent initialization and enhanced search functionality
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';
// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * @class RefactoredSearchManager
 * Manages search functionality with event-driven communication and enhanced features
 */
@injectable()
export class RefactoredSearchManager extends BaseService {
  constructor(
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.StateManager) stateManager,
    @inject(TYPES.ConfigService) configService,
    @inject(TYPES.ARIAService) ariaService,
    @inject(TYPES.ErrorBoundary) errorBoundary
  ) {
    super();
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.configService = configService;
    this.ariaService = ariaService;
    this.errorBoundary = errorBoundary;
    
    this.initialized = false;
    this.searchBox = null;
    this.dropdown = null;
    this.searchIndex = new Map();
    this.searchResults = [];
    this.currentQuery = '';
    this.searchTimeout = null;
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Event subscriptions
    this.eventSubscriptions = new Map();
    
    // Search configuration
    this.config = {
      debounceMs: 300,
      minQueryLength: 2,
      maxResults: 50,
      searchFields: ['name', 'NAME', 'description', 'DESCRIPTION'],
      categories: ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv']
    };
    
    this.logger.info('RefactoredSearchManager initialized', {
      module: 'RefactoredSearchManager',
      timestamp: Date.now()
    });
  }

  /**
   * Initialize the search manager with event-driven communication
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized - skipping duplicate initialization', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }

    const timer = this.logger.time('refactored-search-initialization');
    
    try {
      this.logger.info('Starting refactored search initialization', {
        operation: 'init',
        config: this.config
      });

      // Set up event listeners
      this.setupEventListeners();

      // Initialize DOM elements
      await this.initializeDOMElements();

      // Set up ARIA support
      await this.setupARIA();

      // Set up search functionality
      await this.setupSearchFunctionality();

      // Update state manager
      await this.updateStateManager();

      // Emit search ready event
      this.eventBus.emit('search.ready', {
        manager: this,
        timestamp: Date.now()
      });

      this.initialized = true;
      
      timer.end({
        success: true,
        searchIndexSize: this.searchIndex.size
      });
      
      this.logger.info('Refactored search system ready', {
        searchIndexSize: this.searchIndex.size
      });

    } catch (error) {
      timer.end({
        success: false,
        error: error.message
      });
      
      this.logger.error('Search initialization failed', {
        operation: 'init',
        error: error.message,
        stack: error.stack
      });
      
      // Emit error event
      this.eventBus.emit('search.error', {
        error: error.message,
        operation: 'init',
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Set up event listeners for event-driven communication
   */
  setupEventListeners() {
    // Listen for data loading events
    this.eventSubscriptions.set('data.loaded', 
      this.eventBus.on('data.loaded', (event) => {
        this.handleDataLoaded(event.payload);
      })
    );

    // Listen for sidebar events
    this.eventSubscriptions.set('sidebar.item.selected',
      this.eventBus.on('sidebar.item.selected', (event) => {
        this.handleItemSelected(event.payload);
      })
    );

    // Listen for map events
    this.eventSubscriptions.set('map.layer.added',
      this.eventBus.on('map.layer.added', (event) => {
        this.handleLayerAdded(event.payload);
      })
    );

    // Listen for state changes
    this.eventSubscriptions.set('state.search.updated',
      this.eventBus.on('state.search.updated', (event) => {
        this.handleStateUpdate(event.payload);
      })
    );

    this.logger.debug('Event listeners set up', {
      operation: 'setupEventListeners',
      subscriptionCount: this.eventSubscriptions.size
    });
  }

  /**
   * Initialize DOM elements
   */
  async initializeDOMElements() {
    try {
      this.searchBox = document.getElementById('globalSidebarSearch');
      this.dropdown = document.getElementById('sidebarSearchDropdown');

      if (!this.searchBox) {
        throw new Error('Search box not found');
      }

      this.logger.debug('DOM elements initialized', {
        operation: 'initializeDOMElements',
        hasSearchBox: !!this.searchBox,
        hasDropdown: !!this.dropdown
      });

    } catch (error) {
      this.logger.error('Failed to initialize DOM elements', {
        operation: 'initializeDOMElements',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up ARIA support for search
   */
  async setupARIA() {
    if (!this.searchBox || !this.ariaService) return;

    try {
      // Set up search box ARIA attributes
      this.searchBox.setAttribute('role', 'searchbox');
      this.searchBox.setAttribute('aria-autocomplete', 'list');
      this.searchBox.setAttribute('aria-controls', this.dropdown?.id || '');
      this.searchBox.setAttribute('aria-expanded', 'false');
      this.searchBox.setAttribute('aria-activedescendant', '');
      this.searchBox.setAttribute('aria-label', 'Search map layers');
      this.searchBox.setAttribute('aria-describedby', 'search-help');

      // Set up dropdown ARIA attributes
      if (this.dropdown) {
        this.dropdown.setAttribute('role', 'listbox');
        this.dropdown.setAttribute('aria-label', 'Search results');
        this.dropdown.setAttribute('aria-hidden', 'true');
      }

      // Create search help text
      let helpText = document.getElementById('search-help');
      if (!helpText) {
        helpText = document.createElement('div');
        helpText.id = 'search-help';
        helpText.className = 'sr-only';
        helpText.textContent = 'Search for SES, LGA, CFA, Ambulance, Police, and FRV locations';
        this.searchBox.parentNode?.appendChild(helpText);
      }

      // Announce search initialization
      this.ariaService.announce('Search functionality initialized and ready for use', 'polite');

      this.logger.debug('ARIA support set up', {
        operation: 'setupARIA',
        searchBoxId: this.searchBox.id,
        dropdownId: this.dropdown?.id
      });

    } catch (error) {
      this.logger.error('Failed to set up ARIA support', {
        operation: 'setupARIA',
        error: error.message
      });
      // Don't throw - ARIA is not critical for search functionality
    }
  }

  /**
   * Set up search functionality
   */
  async setupSearchFunctionality() {
    try {
      // Set up input handler
      this.searchBox.addEventListener('input', (event) => {
        this.handleSearchInput(event.target.value);
      });

      // Set up keyboard handler
      this.searchBox.addEventListener('keydown', (event) => {
        this.handleKeydown(event);
      });

      // Set up focus handlers
      this.searchBox.addEventListener('focus', () => {
        this.handleSearchFocus();
      });

      this.searchBox.addEventListener('blur', () => {
        this.handleSearchBlur();
      });

      this.logger.debug('Search functionality set up', {
        operation: 'setupSearchFunctionality'
      });

    } catch (error) {
      this.logger.error('Failed to set up search functionality', {
        operation: 'setupSearchFunctionality',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update state manager with search information
   */
  async updateStateManager() {
    try {
      // Initialize search state
      this.stateManager.dispatch({
        type: 'search/setInitialState',
        payload: {
          query: '',
          results: [],
          indexSize: 0,
          activeIndex: -1
        }
      });

      this.logger.debug('State manager updated', {
        operation: 'updateStateManager'
      });

    } catch (error) {
      this.logger.error('Failed to update state manager', {
        operation: 'updateStateManager',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle data loaded events
   */
  handleDataLoaded(payload) {
    this.logger.debug('Data loaded event received', {
      operation: 'handleDataLoaded',
      category: payload.category,
      featureCount: payload.features?.length
    });

    // Build search index for the loaded data
    this.buildSearchIndex(payload.category, payload.features);
  }

  /**
   * Build search index for a category
   */
  buildSearchIndex(category, features) {
    if (!features || !Array.isArray(features)) return;

    try {
      features.forEach((feature, index) => {
        const searchableText = this.extractSearchableText(feature);
        const searchKey = `${category}_${feature.properties?.id || index}`;
        
        this.searchIndex.set(searchKey, {
          category: category,
          feature: feature,
          searchableText: searchableText,
          name: feature.properties?.name || feature.properties?.NAME || 'Unnamed Feature'
        });
      });

      this.logger.debug('Search index built', {
        operation: 'buildSearchIndex',
        category: category,
        featureCount: features.length,
        totalIndexSize: this.searchIndex.size
      });

      // Update state manager
      this.stateManager.dispatch({
        type: 'search/updateIndexSize',
        payload: this.searchIndex.size
      });

      // Emit index updated event
      this.eventBus.emit('search.index.updated', {
        category: category,
        indexSize: this.searchIndex.size,
        timestamp: Date.now()
      });

    } catch (error) {
      this.logger.error('Failed to build search index', {
        operation: 'buildSearchIndex',
        category: category,
        error: error.message
      });
    }
  }

  /**
   * Extract searchable text from feature
   */
  extractSearchableText(feature) {
    const properties = feature.properties || {};
    const searchableFields = this.config.searchFields;
    
    return searchableFields
      .map(field => properties[field])
      .filter(value => value && typeof value === 'string')
      .join(' ')
      .toLowerCase();
  }

  /**
   * Handle search input
   */
  handleSearchInput(query) {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Set new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, this.config.debounceMs);

    this.logger.debug('Search input received', {
      operation: 'handleSearchInput',
      query: query
    });
  }

  /**
   * Perform search
   */
  performSearch(query) {
    try {
      this.currentQuery = query.trim().toLowerCase();

      if (this.currentQuery.length < this.config.minQueryLength) {
        this.clearResults();
        return;
      }

      // Search through index
      const results = this.searchIndex(query);

      // Update results
      this.updateSearchResults(results);

      // Update state manager
      this.stateManager.dispatch({
        type: 'search/setResults',
        payload: {
          query: this.currentQuery,
          results: results
        }
      });

      // Emit search results event
      this.eventBus.emit('search.results.updated', {
        query: this.currentQuery,
        results: results,
        timestamp: Date.now()
      });

      this.logger.debug('Search performed', {
        operation: 'performSearch',
        query: this.currentQuery,
        resultCount: results.length
      });

    } catch (error) {
      this.logger.error('Search failed', {
        operation: 'performSearch',
        query: this.currentQuery,
        error: error.message
      });
    }
  }

  /**
   * Search through index
   */
  searchIndex(query) {
    const results = [];

    for (const [key, item] of this.searchIndex) {
      if (item.searchableText.includes(query) || item.name.toLowerCase().includes(query)) {
        results.push({
          key: key,
          category: item.category,
          feature: item.feature,
          name: item.name,
          matchScore: this.calculateMatchScore(query, item)
        });
      }
    }

    // Sort by match score and limit results
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, this.config.maxResults);
  }

  /**
   * Calculate match score for search result
   */
  calculateMatchScore(query, item) {
    const name = item.name.toLowerCase();
    const searchableText = item.searchableText;

    let score = 0;

    // Exact name match gets highest score
    if (name === query) {
      score += 100;
    } else if (name.startsWith(query)) {
      score += 50;
    } else if (name.includes(query)) {
      score += 25;
    }

    // Searchable text match gets lower score
    if (searchableText.includes(query)) {
      score += 10;
    }

    return score;
  }

  /**
   * Update search results display
   */
  updateSearchResults(results) {
    this.searchResults = results;

    if (!this.dropdown) return;

    if (results.length === 0) {
      this.dropdown.innerHTML = '<div class="dropdown-item" role="option" aria-selected="false">No results found</div>';
    } else {
      this.dropdown.innerHTML = results.map((result, index) => {
        const base = this.getCategoryColor(result.category);
        const color = this.adjustColor(base, 1.0);
        return `<div class="dropdown-item" role="option" aria-selected="false" id="search-result-${index}" data-category="${result.category}" data-key="${result.key}"><span class="name" style="color:${color}">${result.name}</span> <span style="color:#888;font-size:0.9em;">(${result.category.toUpperCase()})</span></div>`;
      }).join('');
    }

    // Show dropdown
    this.dropdown.style.display = 'block';
    this.dropdown.setAttribute('aria-hidden', 'false');
    this.searchBox.setAttribute('aria-expanded', 'true');

    // Set up click handlers for results
    this.dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectSearchResult(results[index]);
      });
    });

    // Announce results to screen readers
    if (this.ariaService) {
      const message = results.length === 0 ? 
        'No search results found' : 
        `${results.length} search results found`;
      this.ariaService.announce(message, 'polite');
    }
  }

  /**
   * Get category color
   */
  getCategoryColor(category) {
    const colors = {
      'ses': '#ff6b6b',
      'lga': '#4ecdc4',
      'cfa': '#45b7d1',
      'ambulance': '#96ceb4',
      'police': '#feca57',
      'frv': '#ff9ff3'
    };
    return colors[category] || '#333';
  }

  /**
   * Adjust color brightness
   */
  adjustColor(hex, factor) {
    // Simple color adjustment - in a real implementation, you'd use a proper color library
    return hex;
  }

  /**
   * Clear search results
   */
  clearResults() {
    this.searchResults = [];
    this.currentQuery = '';

    if (this.dropdown) {
      this.dropdown.innerHTML = '';
      this.dropdown.style.display = 'none';
      this.dropdown.setAttribute('aria-hidden', 'true');
    }

    this.searchBox.setAttribute('aria-expanded', 'false');
    this.searchBox.setAttribute('aria-activedescendant', '');

    // Update state manager
    this.stateManager.dispatch({
      type: 'search/clearResults',
      payload: {}
    });
  }

  /**
   * Handle keyboard navigation
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
        this.clearResults();
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
   * Handle search focus
   */
  handleSearchFocus() {
    this.logger.debug('Search focused', {
      operation: 'handleSearchFocus'
    });

    // Emit focus event
    this.eventBus.emit('search.focused', {
      timestamp: Date.now()
    });
  }

  /**
   * Handle search blur
   */
  handleSearchBlur() {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      if (this.dropdown) {
        this.dropdown.style.display = 'none';
        this.dropdown.setAttribute('aria-hidden', 'true');
        this.searchBox.setAttribute('aria-expanded', 'false');
        this.searchBox.setAttribute('aria-activedescendant', '');
      }
    }, 150);

    this.logger.debug('Search blurred', {
      operation: 'handleSearchBlur'
    });

    // Emit blur event
    this.eventBus.emit('search.blurred', {
      timestamp: Date.now()
    });
  }

  /**
   * Select search result
   */
  selectSearchResult(result) {
    this.logger.debug('Search result selected', {
      operation: 'selectSearchResult',
      category: result.category,
      name: result.name
    });

    // Clear search
    this.clearResults();
    this.searchBox.value = '';

    // Emit result selected event
    this.eventBus.emit('search.result.selected', {
      result: result,
      timestamp: Date.now()
    });

    // Announce selection to screen readers
    if (this.ariaService) {
      this.ariaService.announce(`${result.name} selected`, 'polite');
    }
  }

  /**
   * Handle item selected events
   */
  handleItemSelected(payload) {
    this.logger.debug('Item selected event received', {
      operation: 'handleItemSelected',
      category: payload.category,
      selected: payload.selected
    });

    // Update search index if needed
    // This could trigger re-indexing or cache updates
  }

  /**
   * Handle layer added events
   */
  handleLayerAdded(payload) {
    this.logger.debug('Layer added event received', {
      operation: 'handleLayerAdded',
      category: payload.category,
      itemId: payload.itemId
    });

    // Update search results if they're currently displayed
    if (this.currentQuery) {
      this.performSearch(this.currentQuery);
    }
  }

  /**
   * Handle state update events
   */
  handleStateUpdate(payload) {
    this.logger.debug('State update event received', {
      operation: 'handleStateUpdate',
      payload: payload
    });

    // Sync search state with external state changes
    this.syncWithState(payload);
  }

  /**
   * Sync search with state
   */
  syncWithState(state) {
    // Update search query if it changed externally
    if (state.query !== undefined && state.query !== this.currentQuery) {
      this.searchBox.value = state.query;
      this.performSearch(state.query);
    }

    // Update results if they changed externally
    if (state.results !== undefined) {
      this.updateSearchResults(state.results);
    }
  }

  /**
   * Get search status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      indexSize: this.searchIndex.size,
      currentQuery: this.currentQuery,
      resultsCount: this.searchResults.length,
      hasActiveResults: this.dropdown?.style.display !== 'none'
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      // Clear search timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }

      // Remove event subscriptions
      this.eventSubscriptions.forEach((unsubscribe, eventType) => {
        unsubscribe();
      });
      this.eventSubscriptions.clear();

      // Clear collections
      this.searchIndex.clear();
      this.searchResults = [];

      // Reset state
      this.initialized = false;
      this.searchBox = null;
      this.dropdown = null;
      this.currentQuery = '';

      this.logger.info('Search manager cleaned up', {
        operation: 'cleanup'
      });

    } catch (error) {
      this.logger.error('Failed to cleanup search manager', {
        operation: 'cleanup',
        error: error.message
      });
    }
  }
}

// Export singleton instance
// Legacy function for backward compatibility
export const refactoredSearchManager = () => {
  console.warn('refactoredSearchManager: Legacy function called. Use DI container to get RefactoredSearchManager instance.');
  throw new Error('Legacy function not available. Use DI container to get RefactoredSearchManager instance.');
};
