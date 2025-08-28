/**
 * @fileoverview Modern CollapsibleManager Component
 * Manages sidebar section expand/collapse behavior with sticky headers and smooth animations.
 * Replaces legacy js/ui/collapsible.js with modern architecture.
 */

import { ComponentBase } from '../modules/ComponentBase.js';
import { stateManager } from '../modules/StateManager.js';
import { globalEventBus } from '../modules/EventBus.js';

/**
 * @class CollapsibleManager
 * @extends ComponentBase
 * 
 * Modern collapsible section manager with:
 * - Sticky header positioning
 * - Smooth animations
 * - State persistence
 * - Event-driven updates
 * - Accessibility support
 */
export class CollapsibleManager extends ComponentBase {
  /**
   * Create CollapsibleManager instance
   * @param {HTMLElement} container - Container element (typically sidebar)
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    super(container, {
      // Default options
      autoCollapseOthers: true,
      persistState: true,
      animationDuration: 200,
      stickyHeaders: true,
      // User options override defaults
      ...options
    });

    /**
     * @type {Map<string, CollapsibleSection>}
     * @private
     */
    this.sections = new Map();

    /**
     * @type {string|null}
     * @private
     */
    this.expandedSection = null;

    /**
     * @type {boolean}
     * @private
     */
    this.isAnimating = false;

    // Bind methods to this instance
    this.handleHeaderClick = this.handleHeaderClick.bind(this);
    this.updateStickyClasses = this.updateStickyClasses.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  /**
   * Initialize the collapsible manager
   */
  async init() {
    console.log('🔧 CollapsibleManager: Initializing modern collapsible system');

    try {
      // Set up global event listeners
      this.setupEventListeners();

      // Discover existing collapsible sections
      await this.discoverSections();

      // Restore persisted state
      if (this.options.persistState) {
        this.restoreState();
      }

      // Set up state management
      this.setupStateManagement();

      // Initialize accessibility
      this.initializeAccessibility();

      // Apply initial sticky classes
      this.updateStickyClasses();

      this.isInitialized = true;
      console.log('✅ CollapsibleManager: Modern collapsible system initialized');

    } catch (error) {
      console.error('🚨 CollapsibleManager: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Discover existing collapsible sections in the DOM
   * @private
   */
  async discoverSections() {
    const headers = this.container.querySelectorAll('h4[id$="Header"]');
    
    for (const header of headers) {
      const headerId = header.id;
      const sectionName = headerId.replace('Header', '');
      const listId = sectionName + 'List';
      const list = document.getElementById(listId);

      if (list) {
        const section = new CollapsibleSection(header, list, {
          name: sectionName,
          manager: this
        });

        this.sections.set(sectionName, section);
        console.log(`📁 CollapsibleManager: Discovered section '${sectionName}'`);
      } else {
        console.warn(`⚠️ CollapsibleManager: No list found for header '${headerId}'`);
      }
    }

    console.log(`📊 CollapsibleManager: Discovered ${this.sections.size} collapsible sections`);
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Listen for section state changes
    globalEventBus.on('collapsible:sectionToggled', this.handleStateChange);
    globalEventBus.on('collapsible:sectionExpanded', this.handleStateChange);
    globalEventBus.on('collapsible:sectionCollapsed', this.handleStateChange);

    // Listen for data updates that might affect sections
    globalEventBus.on('data:layerAdded', this.updateStickyClasses);
    globalEventBus.on('data:layerRemoved', this.updateStickyClasses);
    globalEventBus.on('ui:activeListUpdated', this.updateStickyClasses);
  }

  /**
   * Set up state management integration
   * @private
   */
  setupStateManagement() {
    // Register with state manager (skip if not available in test environment)
    if (stateManager && typeof stateManager.registerComponent === 'function') {
      stateManager.registerComponent('collapsibleManager', {
        getState: () => this.getState(),
        setState: (state) => this.setState(state)
      });

      // Watch for state changes
      if (typeof stateManager.subscribe === 'function') {
        stateManager.subscribe('ui.collapsible', (state) => {
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
    this.sections.forEach((section) => {
      section.initializeAccessibility();
    });
  }

  /**
   * Handle header click events
   * @param {Event} event - Click event
   * @private
   */
  handleHeaderClick(event) {
    if (this.isAnimating) return;

    const header = event.currentTarget;
    const sectionName = this.getSectionNameFromHeader(header);
    const section = this.sections.get(sectionName);

    if (!section) {
      console.warn(`⚠️ CollapsibleManager: Unknown section '${sectionName}'`);
      return;
    }

    this.toggleSection(sectionName);
  }

  /**
   * Toggle a section's expanded/collapsed state
   * @param {string} sectionName - Section to toggle
   */
  toggleSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section) {
      console.warn(`⚠️ CollapsibleManager: Unknown section '${sectionName}'`);
      return;
    }

    const wasExpanded = section.isExpanded();

    if (wasExpanded) {
      this.collapseSection(sectionName);
    } else {
      this.expandSection(sectionName);
    }
  }

  /**
   * Expand a specific section
   * @param {string} sectionName - Section to expand
   */
  async expandSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section || section.isExpanded()) return;

    this.isAnimating = true;

    try {
      // Auto-collapse others if enabled
      if (this.options.autoCollapseOthers && sectionName !== 'active') {
        await this.collapseOthers(sectionName);
      }

      // Expand the target section
      await section.expand();
      this.expandedSection = sectionName;

      // Update sticky classes
      this.updateStickyClasses();

      // Persist state
      if (this.options.persistState) {
        this.saveState();
      }

      // Emit events
      globalEventBus.emit('collapsible:sectionExpanded', { section: sectionName });
      globalEventBus.emit('collapsible:stateChanged', this.getState());

    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Collapse a specific section
   * @param {string} sectionName - Section to collapse
   */
  async collapseSection(sectionName) {
    const section = this.sections.get(sectionName);
    if (!section || !section.isExpanded()) return;

    this.isAnimating = true;

    try {
      await section.collapse();
      
      if (this.expandedSection === sectionName) {
        this.expandedSection = null;
      }

      // Update sticky classes
      this.updateStickyClasses();

      // Persist state
      if (this.options.persistState) {
        this.saveState();
      }

      // Emit events
      globalEventBus.emit('collapsible:sectionCollapsed', { section: sectionName });
      globalEventBus.emit('collapsible:stateChanged', this.getState());

    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Collapse all sections except the specified one
   * @param {string} exceptSection - Section to keep expanded
   * @private
   */
  async collapseOthers(exceptSection) {
    const collapsePromises = [];

    this.sections.forEach((section, name) => {
      if (name !== exceptSection && name !== 'active' && section.isExpanded()) {
        collapsePromises.push(section.collapse());
      }
    });

    await Promise.all(collapsePromises);
  }

  /**
   * Update sticky header classes based on expanded section
   * @private
   */
  updateStickyClasses() {
    if (!this.options.stickyHeaders) return;

    // Use setTimeout to ensure DOM updates are complete
    setTimeout(() => {
      const headers = Array.from(this.container.querySelectorAll('h4[id$="Header"]'));
      const expandedIndex = headers.findIndex(h => !h.classList.contains('collapsed'));

      headers.forEach((header, index) => {
        header.classList.remove('sticky-top', 'sticky-bottom');
        
        if (expandedIndex === -1) return; // No sections expanded
        
        if (index < expandedIndex) {
          header.classList.add('sticky-top');
        } else if (index > expandedIndex) {
          header.classList.add('sticky-bottom');
        }
      });
    }, 0);
  }

  /**
   * Handle state change events
   * @param {Object} eventData - Event data
   * @private
   */
  handleStateChange(eventData) {
    // Debounce rapid state changes
    clearTimeout(this.stateChangeTimeout);
    this.stateChangeTimeout = setTimeout(() => {
      this.updateStickyClasses();
    }, 50);
  }

  /**
   * Get section name from header element
   * @param {HTMLElement} header - Header element
   * @returns {string} Section name
   * @private
   */
  getSectionNameFromHeader(header) {
    return header.id.replace('Header', '');
  }

  /**
   * Get current state of all sections
   * @returns {Object} Current state
   */
  getState() {
    const state = {
      expandedSection: this.expandedSection,
      sections: {}
    };

    this.sections.forEach((section, name) => {
      state.sections[name] = {
        expanded: section.isExpanded(),
        visible: section.isVisible()
      };
    });

    return state;
  }

  /**
   * Apply state to all sections
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (!state) return;

    this.expandedSection = state.expandedSection || null;

    if (state.sections) {
      Object.entries(state.sections).forEach(([name, sectionState]) => {
        const section = this.sections.get(name);
        if (section) {
          if (sectionState.expanded) {
            section.expand();
          } else {
            section.collapse();
          }
        }
      });
    }

    this.updateStickyClasses();
  }

  /**
   * Save current state to localStorage
   * @private
   */
  saveState() {
    if (!this.options.persistState) return;

    try {
      const state = this.getState();
      localStorage.setItem('collapsibleManager.state', JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ CollapsibleManager: Failed to save state:', error);
    }
  }

  /**
   * Restore state from localStorage
   * @private
   */
  restoreState() {
    if (!this.options.persistState) return;

    try {
      const savedState = localStorage.getItem('collapsibleManager.state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.applyState(state);
      }
    } catch (error) {
      console.warn('⚠️ CollapsibleManager: Failed to restore state:', error);
    }
  }

  /**
   * Get a specific section
   * @param {string} name - Section name
   * @returns {CollapsibleSection|null} Section instance
   */
  getSection(name) {
    return this.sections.get(name) || null;
  }

  /**
   * Check if a section is expanded
   * @param {string} name - Section name
   * @returns {boolean} Whether section is expanded
   */
  isSectionExpanded(name) {
    const section = this.sections.get(name);
    return section ? section.isExpanded() : false;
  }

  /**
   * Destroy the collapsible manager
   */
  destroy() {
    // Remove event listeners
    globalEventBus.off('collapsible:sectionToggled', this.handleStateChange);
    globalEventBus.off('collapsible:sectionExpanded', this.handleStateChange);
    globalEventBus.off('collapsible:sectionCollapsed', this.handleStateChange);
    globalEventBus.off('data:layerAdded', this.updateStickyClasses);
    globalEventBus.off('data:layerRemoved', this.updateStickyClasses);
    globalEventBus.off('ui:activeListUpdated', this.updateStickyClasses);

    // Destroy all sections
    this.sections.forEach(section => section.destroy());
    this.sections.clear();

    // Clear timeouts
    clearTimeout(this.stateChangeTimeout);

    super.destroy();
  }
}

/**
 * @class CollapsibleSection
 * Represents a single collapsible section
 */
class CollapsibleSection {
  /**
   * Create CollapsibleSection instance
   * @param {HTMLElement} header - Header element
   * @param {HTMLElement} list - List element
   * @param {Object} options - Configuration options
   */
  constructor(header, list, options = {}) {
    this.header = header;
    this.list = list;
    this.options = options;
    this.name = options.name;
    this.manager = options.manager;

    // Bind methods to this instance
    this.handleClick = this.handleClick.bind(this);
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for this section
   * @private
   */
  setupEventListeners() {
    this.header.addEventListener('click', this.handleClick);
  }

  /**
   * Handle header click
   * @param {Event} event - Click event
   * @private
   */
  handleClick(event) {
    event.preventDefault();
    this.manager.toggleSection(this.name);
  }

  /**
   * Initialize accessibility features
   */
  initializeAccessibility() {
    // Set up ARIA attributes
    this.header.setAttribute('role', 'button');
    this.header.setAttribute('aria-expanded', this.isExpanded() ? 'true' : 'false');
    this.header.setAttribute('aria-controls', this.list.id);
    this.header.setAttribute('tabindex', '0');

    this.list.setAttribute('role', 'region');
    this.list.setAttribute('aria-labelledby', this.header.id);

    // Keyboard support
    this.header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleClick(event);
      }
    });
  }

  /**
   * Check if section is expanded
   * @returns {boolean} Whether section is expanded
   */
  isExpanded() {
    return !this.header.classList.contains('collapsed');
  }

  /**
   * Check if section is visible
   * @returns {boolean} Whether section is visible
   */
  isVisible() {
    return this.list.style.display !== 'none';
  }

  /**
   * Expand the section with animation
   * @returns {Promise<void>} Animation completion promise
   */
  async expand() {
    if (this.isExpanded()) return;

    this.header.classList.remove('collapsed');
    this.header.setAttribute('aria-expanded', 'true');
    
    // Animate expansion
    await this.animateExpansion();

    globalEventBus.emit('collapsible:sectionToggled', { 
      section: this.name, 
      expanded: true 
    });
  }

  /**
   * Collapse the section with animation
   * @returns {Promise<void>} Animation completion promise
   */
  async collapse() {
    if (!this.isExpanded()) return;

    // Animate collapse first
    await this.animateCollapse();

    this.header.classList.add('collapsed');
    this.header.setAttribute('aria-expanded', 'false');

    globalEventBus.emit('collapsible:sectionToggled', { 
      section: this.name, 
      expanded: false 
    });
  }

  /**
   * Animate section expansion
   * @returns {Promise<void>} Animation completion promise
   * @private
   */
  async animateExpansion() {
    return new Promise(resolve => {
      this.list.style.display = '';
      
      // Use requestAnimationFrame for smooth animation
      requestAnimationFrame(() => {
        this.list.style.transition = `all ${this.manager.options.animationDuration}ms ease-out`;
        this.list.style.opacity = '1';
        this.list.style.transform = 'translateY(0)';
        
        setTimeout(resolve, this.manager.options.animationDuration);
      });
    });
  }

  /**
   * Animate section collapse
   * @returns {Promise<void>} Animation completion promise
   * @private
   */
  async animateCollapse() {
    return new Promise(resolve => {
      this.list.style.transition = `all ${this.manager.options.animationDuration}ms ease-in`;
      this.list.style.opacity = '0';
      this.list.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        this.list.style.display = 'none';
        this.list.style.transition = '';
        this.list.style.opacity = '';
        this.list.style.transform = '';
        resolve();
      }, this.manager.options.animationDuration);
    });
  }

  /**
   * Destroy the section
   */
  destroy() {
    this.header.removeEventListener('click', this.handleClick);
    
    // Remove ARIA attributes
    this.header.removeAttribute('role');
    this.header.removeAttribute('aria-expanded');
    this.header.removeAttribute('aria-controls');
    this.header.removeAttribute('tabindex');
    
    this.list.removeAttribute('role');
    this.list.removeAttribute('aria-labelledby');
  }
}

// Export the CollapsibleManager as default
export default CollapsibleManager;
