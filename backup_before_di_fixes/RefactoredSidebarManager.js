/**
 * @module modules/RefactoredSidebarManager
 * Refactored SidebarManager using event-driven architecture and dependency injection
 * Consolidates sidebar functionality with ARIA support and independent initialization
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
 * @class RefactoredSidebarManager
 * Manages sidebar functionality with event-driven communication and ARIA support
 */
@injectable()
export class RefactoredSidebarManager extends BaseService {
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
    this.sidebarContainer = null;
    this.activeListContainer = null;
    this.searchContainer = null;
    this.collapsibleSections = new Map();
    this.activeItems = new Map();
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Event subscriptions
    this.eventSubscriptions = new Map();
    
    // Sidebar configuration
    this.config = {
      categories: ['ses', 'lga', 'cfa', 'ambulance', 'police', 'frv'],
      defaultExpanded: ['ses', 'lga'],
      searchDebounceMs: 300
    };
    
    this.logger.info('RefactoredSidebarManager initialized', {
      module: 'RefactoredSidebarManager',
      timestamp: Date.now()
    });
  }

  /**
   * Initialize the sidebar manager with event-driven communication
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized - skipping duplicate initialization', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }

    const timer = this.logger.time('refactored-sidebar-initialization');
    
    try {
      this.logger.info('Starting refactored sidebar initialization', {
        operation: 'init',
        config: this.config
      });

      // Set up event listeners
      this.setupEventListeners();

      // Initialize DOM elements
      await this.initializeDOMElements();

      // Set up ARIA support
      await this.setupARIA();

      // Set up collapsible sections
      await this.setupCollapsibleSections();

      // Set up search functionality
      await this.setupSearchFunctionality();

      // Set up active list
      await this.setupActiveList();

      // Set up responsive behavior
      await this.setupResponsiveBehavior();

      // Update state manager
      await this.updateStateManager();

      // Emit sidebar ready event
      this.eventBus.emit('sidebar.ready', {
        manager: this,
        timestamp: Date.now()
      });

      this.initialized = true;
      
      timer.end({
        success: true,
        sectionsCount: this.collapsibleSections.size
      });
      
      this.logger.info('Refactored sidebar system ready', {
        sectionsCount: this.collapsibleSections.size
      });

    } catch (error) {
      timer.end({
        success: false,
        error: error.message
      });
      
      this.logger.error('Sidebar initialization failed', {
        operation: 'init',
        error: error.message,
        stack: error.stack
      });
      
      // Emit error event
      this.eventBus.emit('sidebar.error', {
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

    // Listen for map layer events
    this.eventSubscriptions.set('map.layer.added',
      this.eventBus.on('map.layer.added', (event) => {
        this.handleLayerAdded(event.payload);
      })
    );

    this.eventSubscriptions.set('map.layer.removed',
      this.eventBus.on('map.layer.removed', (event) => {
        this.handleLayerRemoved(event.payload);
      })
    );

    // Listen for search events
    this.eventSubscriptions.set('search.results.updated',
      this.eventBus.on('search.results.updated', (event) => {
        this.handleSearchResultsUpdated(event.payload);
      })
    );

    // Listen for state changes
    this.eventSubscriptions.set('state.sidebar.updated',
      this.eventBus.on('state.sidebar.updated', (event) => {
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
      this.sidebarContainer = document.getElementById('layerMenu');
      this.activeListContainer = document.getElementById('activeList');
      this.searchContainer = document.getElementById('globalSidebarSearch');

      if (!this.sidebarContainer) {
        throw new Error('Sidebar container not found');
      }

      this.logger.debug('DOM elements initialized', {
        operation: 'initializeDOMElements',
        hasSidebar: !!this.sidebarContainer,
        hasActiveList: !!this.activeListContainer,
        hasSearch: !!this.searchContainer
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
   * Set up ARIA support for the sidebar
   */
  async setupARIA() {
    if (!this.sidebarContainer || !this.ariaService) return;

    try {
      // Set up basic ARIA attributes for sidebar
      this.sidebarContainer.setAttribute('role', 'navigation');
      this.sidebarContainer.setAttribute('aria-label', 'Map layer navigation');
      this.sidebarContainer.setAttribute('aria-describedby', 'sidebar-instructions');

      // Create sidebar instructions for screen readers
      let instructions = document.getElementById('sidebar-instructions');
      if (!instructions) {
        instructions = document.createElement('div');
        instructions.id = 'sidebar-instructions';
        instructions.className = 'sr-only';
        instructions.textContent = 'Use this navigation to select and manage map layers. Use Tab to move between sections, Enter or Space to expand/collapse sections, and arrow keys to navigate within sections.';
        this.sidebarContainer.appendChild(instructions);
      }

      // Set up search ARIA attributes
      if (this.searchContainer) {
        this.searchContainer.setAttribute('role', 'searchbox');
        this.searchContainer.setAttribute('aria-label', 'Search map layers');
        this.searchContainer.setAttribute('aria-describedby', 'search-help');
      }

      // Set up active list ARIA attributes
      if (this.activeListContainer) {
        this.activeListContainer.setAttribute('role', 'region');
        this.activeListContainer.setAttribute('aria-label', 'All active layers');
        this.activeListContainer.setAttribute('aria-live', 'polite');
      }

      // Announce sidebar initialization
      this.ariaService.announce('Sidebar navigation initialized and ready for use', 'polite');

      this.logger.debug('ARIA support set up', {
        operation: 'setupARIA'
      });

    } catch (error) {
      this.logger.error('Failed to set up ARIA support', {
        operation: 'setupARIA',
        error: error.message
      });
      // Don't throw - ARIA is not critical for sidebar functionality
    }
  }

  /**
   * Set up collapsible sections
   */
  async setupCollapsibleSections() {
    try {
      this.config.categories.forEach(category => {
        const headerId = `${category}Header`;
        const listId = `${category}List`;
        const header = document.getElementById(headerId);
        const list = document.getElementById(listId);

        if (header && list) {
          this.setupCollapsibleSection(category, header, list);
          this.collapsibleSections.set(category, { header, list, expanded: false });
        }
      });

      this.logger.debug('Collapsible sections set up', {
        operation: 'setupCollapsibleSections',
        sectionsCount: this.collapsibleSections.size
      });

    } catch (error) {
      this.logger.error('Failed to set up collapsible sections', {
        operation: 'setupCollapsibleSections',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up individual collapsible section
   */
  setupCollapsibleSection(category, header, list) {
    // Set up ARIA attributes
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', list.id);
    header.setAttribute('aria-label', `${category.toUpperCase()} layers section`);

    list.setAttribute('role', 'region');
    list.setAttribute('aria-labelledby', header.id);
    list.setAttribute('aria-hidden', 'true');

    // Add click handler
    header.addEventListener('click', () => {
      this.toggleSection(category);
    });

    // Add keyboard handler
    header.addEventListener('keydown', (event) => {
      this.handleSectionKeydown(event, category);
    });

    // Hide list initially
    list.style.display = 'none';
  }

  /**
   * Toggle collapsible section
   */
  toggleSection(category) {
    const section = this.collapsibleSections.get(category);
    if (!section) return;

    const { header, list, expanded } = section;
    const newExpanded = !expanded;

    // Update display
    list.style.display = newExpanded ? 'block' : 'none';
    
    // Update ARIA attributes
    header.setAttribute('aria-expanded', newExpanded.toString());
    list.setAttribute('aria-hidden', (!newExpanded).toString());

    // Update section state
    section.expanded = newExpanded;
    this.collapsibleSections.set(category, section);

    // Update state manager
    this.stateManager.dispatch({
      type: 'sidebar/toggleSection',
      payload: { category, expanded: newExpanded }
    });

    // Emit section toggle event
    this.eventBus.emit('sidebar.section.toggled', {
      category: category,
      expanded: newExpanded,
      timestamp: Date.now()
    });

    // Announce to screen readers
    if (this.ariaService) {
      const message = newExpanded ? 
        `${category.toUpperCase()} section expanded` : 
        `${category.toUpperCase()} section collapsed`;
      this.ariaService.announce(message, 'polite');
    }

    this.logger.debug('Section toggled', {
      operation: 'toggleSection',
      category: category,
      expanded: newExpanded
    });
  }

  /**
   * Handle keyboard navigation for sections
   */
  handleSectionKeydown(event, category) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleSection(category);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextSection(category);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousSection(category);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstSection();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastSection();
        break;
    }
  }

  /**
   * Focus next section
   */
  focusNextSection(currentCategory) {
    const categories = this.config.categories;
    const currentIndex = categories.indexOf(currentCategory);
    const nextIndex = (currentIndex + 1) % categories.length;
    const nextCategory = categories[nextIndex];
    const nextSection = this.collapsibleSections.get(nextCategory);
    
    if (nextSection) {
      nextSection.header.focus();
    }
  }

  /**
   * Focus previous section
   */
  focusPreviousSection(currentCategory) {
    const categories = this.config.categories;
    const currentIndex = categories.indexOf(currentCategory);
    const prevIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1;
    const prevCategory = categories[prevIndex];
    const prevSection = this.collapsibleSections.get(prevCategory);
    
    if (prevSection) {
      prevSection.header.focus();
    }
  }

  /**
   * Focus first section
   */
  focusFirstSection() {
    const firstCategory = this.config.categories[0];
    const firstSection = this.collapsibleSections.get(firstCategory);
    
    if (firstSection) {
      firstSection.header.focus();
    }
  }

  /**
   * Focus last section
   */
  focusLastSection() {
    const lastCategory = this.config.categories[this.config.categories.length - 1];
    const lastSection = this.collapsibleSections.get(lastCategory);
    
    if (lastSection) {
      lastSection.header.focus();
    }
  }

  /**
   * Set up search functionality
   */
  async setupSearchFunctionality() {
    if (!this.searchContainer) return;

    try {
      let searchTimeout;
      
      this.searchContainer.addEventListener('input', (event) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearchInput(event.target.value);
        }, this.config.searchDebounceMs);
      });

      this.searchContainer.addEventListener('keydown', (event) => {
        this.handleSearchKeydown(event);
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
   * Handle search input
   */
  handleSearchInput(query) {
    this.logger.debug('Search input received', {
      operation: 'handleSearchInput',
      query: query
    });

    // Update state manager
    this.stateManager.dispatch({
      type: 'sidebar/setSearchQuery',
      payload: query
    });

    // Emit search event
    this.eventBus.emit('sidebar.search.query', {
      query: query,
      timestamp: Date.now()
    });
  }

  /**
   * Handle search keyboard navigation
   */
  handleSearchKeydown(event) {
    switch (event.key) {
      case 'Escape':
        this.searchContainer.value = '';
        this.handleSearchInput('');
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusFirstSection();
        break;
    }
  }

  /**
   * Set up active list functionality
   */
  async setupActiveList() {
    if (!this.activeListContainer) return;

    try {
      // Set up active list container
      this.activeListContainer.innerHTML = '<div class="no-active-items">No active layers</div>';

      this.logger.debug('Active list set up', {
        operation: 'setupActiveList'
      });

    } catch (error) {
      this.logger.error('Failed to set up active list', {
        operation: 'setupActiveList',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set up responsive behavior
   */
  async setupResponsiveBehavior() {
    try {
      // Set up resize handler
      window.addEventListener('resize', () => {
        this.handleResize();
      });

      // Initial responsive setup
      this.handleResize();

      this.logger.debug('Responsive behavior set up', {
        operation: 'setupResponsiveBehavior'
      });

    } catch (error) {
      this.logger.error('Failed to set up responsive behavior', {
        operation: 'setupResponsiveBehavior',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const width = window.innerWidth;
    const isMobile = width < 768;

    // Update sidebar for mobile/desktop
    if (this.sidebarContainer) {
      if (isMobile) {
        this.sidebarContainer.classList.add('mobile');
      } else {
        this.sidebarContainer.classList.remove('mobile');
      }
    }

    // Emit resize event
    this.eventBus.emit('sidebar.resized', {
      width: width,
      isMobile: isMobile,
      timestamp: Date.now()
    });

    this.logger.debug('Sidebar resized', {
      operation: 'handleResize',
      width: width,
      isMobile: isMobile
    });
  }

  /**
   * Update state manager with sidebar information
   */
  async updateStateManager() {
    try {
      // Initialize sidebar state
      this.stateManager.dispatch({
        type: 'sidebar/setInitialState',
        payload: {
          sections: Array.from(this.collapsibleSections.keys()),
          expandedSections: this.config.defaultExpanded,
          searchQuery: '',
          activeItems: []
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

    // Populate sidebar section with data
    this.populateSection(payload.category, payload.features);
  }

  /**
   * Populate sidebar section with data
   */
  populateSection(category, features) {
    const section = this.collapsibleSections.get(category);
    if (!section || !features) return;

    const { list } = section;
    
    // Clear existing content
    list.innerHTML = '';

    // Add features to section
    features.forEach((feature, index) => {
      const item = this.createSidebarItem(category, feature, index);
      list.appendChild(item);
    });

    this.logger.debug('Section populated', {
      operation: 'populateSection',
      category: category,
      itemCount: features.length
    });
  }

  /**
   * Create sidebar item
   */
  createSidebarItem(category, feature, index) {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.setAttribute('role', 'checkbox');
    item.setAttribute('aria-checked', 'false');
    item.setAttribute('tabindex', '0');
    item.setAttribute('data-category', category);
    item.setAttribute('data-feature-id', feature.properties?.id || index);
    
    const name = feature.properties?.name || feature.properties?.NAME || 'Unnamed Feature';
    item.textContent = name;
    item.setAttribute('aria-label', `${name} in ${category.toUpperCase()}`);

    // Add click handler
    item.addEventListener('click', () => {
      this.toggleItemSelection(category, feature, item);
    });

    // Add keyboard handler
    item.addEventListener('keydown', (event) => {
      this.handleItemKeydown(event, category, feature, item);
    });

    return item;
  }

  /**
   * Toggle item selection
   */
  toggleItemSelection(category, feature, item) {
    const isSelected = item.getAttribute('aria-checked') === 'true';
    const newSelected = !isSelected;

    // Update item state
    item.setAttribute('aria-checked', newSelected.toString());
    item.classList.toggle('selected', newSelected);

    // Update active items
    const itemId = `${category}_${feature.properties?.id || 'unknown'}`;
    if (newSelected) {
      this.activeItems.set(itemId, { category, feature, item });
    } else {
      this.activeItems.delete(itemId);
    }

    // Update state manager
    this.stateManager.dispatch({
      type: 'sidebar/toggleItem',
      payload: { category, feature, selected: newSelected }
    });

    // Emit selection event
    this.eventBus.emit('sidebar.item.selected', {
      category: category,
      feature: feature,
      selected: newSelected,
      timestamp: Date.now()
    });

    // Update active list
    this.updateActiveList();

    // Announce to screen readers
    if (this.ariaService) {
      const message = newSelected ? 
        `${feature.properties?.name || 'Feature'} selected` : 
        `${feature.properties?.name || 'Feature'} deselected`;
      this.ariaService.announce(message, 'polite');
    }

    this.logger.debug('Item selection toggled', {
      operation: 'toggleItemSelection',
      category: category,
      featureId: feature.properties?.id,
      selected: newSelected
    });
  }

  /**
   * Handle keyboard navigation for items
   */
  handleItemKeydown(event, category, feature, item) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleItemSelection(category, feature, item);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem(item);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem(item);
        break;
    }
  }

  /**
   * Focus next item
   */
  focusNextItem(currentItem) {
    const nextItem = currentItem.nextElementSibling;
    if (nextItem) {
      nextItem.focus();
    }
  }

  /**
   * Focus previous item
   */
  focusPreviousItem(currentItem) {
    const prevItem = currentItem.previousElementSibling;
    if (prevItem) {
      prevItem.focus();
    }
  }

  /**
   * Update active list display
   */
  updateActiveList() {
    if (!this.activeListContainer) return;

    if (this.activeItems.size === 0) {
      this.activeListContainer.innerHTML = '<div class="no-active-items">No active layers</div>';
      return;
    }

    const activeListHTML = Array.from(this.activeItems.values())
      .map(({ category, feature }) => {
        const name = feature.properties?.name || feature.properties?.NAME || 'Unnamed Feature';
        return `<div class="active-item" data-category="${category}">${name} (${category.toUpperCase()})</div>`;
      })
      .join('');

    this.activeListContainer.innerHTML = activeListHTML;

    // Update ARIA live region
    if (this.ariaService) {
      this.ariaService.announce(`${this.activeItems.size} active layers`, 'polite');
    }
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

    // Update active list
    this.updateActiveList();
  }

  /**
   * Handle layer removed events
   */
  handleLayerRemoved(payload) {
    this.logger.debug('Layer removed event received', {
      operation: 'handleLayerRemoved',
      category: payload.category,
      itemId: payload.itemId
    });

    // Update active list
    this.updateActiveList();
  }

  /**
   * Handle search results updated events
   */
  handleSearchResultsUpdated(payload) {
    this.logger.debug('Search results updated event received', {
      operation: 'handleSearchResultsUpdated',
      resultCount: payload.results?.length
    });

    // Update search display
    this.updateSearchResults(payload.results);
  }

  /**
   * Update search results display
   */
  updateSearchResults(results) {
    // This would typically update a search dropdown
    // Implementation depends on specific search UI requirements
    this.logger.debug('Search results updated', {
      operation: 'updateSearchResults',
      resultCount: results?.length
    });
  }

  /**
   * Handle state update events
   */
  handleStateUpdate(payload) {
    this.logger.debug('State update event received', {
      operation: 'handleStateUpdate',
      payload: payload
    });

    // Update sidebar based on state changes
    this.syncWithState(payload);
  }

  /**
   * Sync sidebar with state
   */
  syncWithState(state) {
    // Update expanded sections
    if (state.expandedSections) {
      state.expandedSections.forEach(category => {
        const section = this.collapsibleSections.get(category);
        if (section && !section.expanded) {
          this.toggleSection(category);
        }
      });
    }

    // Update search query
    if (state.searchQuery !== undefined && this.searchContainer) {
      this.searchContainer.value = state.searchQuery;
    }
  }

  /**
   * Get sidebar status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      sectionsCount: this.collapsibleSections.size,
      activeItemsCount: this.activeItems.size,
      expandedSections: Array.from(this.collapsibleSections.entries())
        .filter(([_, section]) => section.expanded)
        .map(([category, _]) => category)
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      // Remove event subscriptions
      this.eventSubscriptions.forEach((unsubscribe, eventType) => {
        unsubscribe();
      });
      this.eventSubscriptions.clear();

      // Clear collections
      this.collapsibleSections.clear();
      this.activeItems.clear();

      // Reset state
      this.initialized = false;
      this.sidebarContainer = null;
      this.activeListContainer = null;
      this.searchContainer = null;

      this.logger.info('Sidebar manager cleaned up', {
        operation: 'cleanup'
      });

    } catch (error) {
      this.logger.error('Failed to cleanup sidebar manager', {
        operation: 'cleanup',
        error: error.message
      });
    }
  }
}

// Export singleton instance
// Legacy function for backward compatibility
export const refactoredSidebarManager = () => {
  console.warn('refactoredSidebarManager: Legacy function called. Use DI container to get RefactoredSidebarManager instance.');
  throw new Error('Legacy function not available. Use DI container to get RefactoredSidebarManager instance.');
};
