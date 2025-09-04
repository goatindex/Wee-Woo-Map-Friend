/**
 * @module modules/CollapsibleManager
 * Modern ES6-based collapsible sidebar management for WeeWoo Map Friend
 * Manages expand/collapse behavior for sidebar sections with sticky header classes
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class CollapsibleManager
 * Manages collapsible sidebar sections with enhanced functionality
 */
export class CollapsibleManager {
  constructor() {
    this.initialized = false;
    this.collapsibleSections = new Map();
    this.activeSection = null;
    this.stickyHeaders = new Set();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupCollapsible = this.setupCollapsible.bind(this);
    this.toggleSection = this.toggleSection.bind(this);
    this.collapseAllExcept = this.collapseAllExcept.bind(this);
    this.updateStickyClasses = this.updateStickyClasses.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('📁 CollapsibleManager: Collapsible management system initialized');
  }
  
  /**
   * Initialize the collapsible manager
   */
  async init() {
    if (this.initialized) {
      console.warn('CollapsibleManager: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 CollapsibleManager: Starting initialization...');
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Initialize existing collapsible sections if DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeExistingSections());
      } else {
        this.initializeExistingSections();
      }
      
      this.initialized = true;
      console.log('✅ CollapsibleManager: Collapsible management system ready');
      
    } catch (error) {
      console.error('🚨 CollapsibleManager: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for new sections being added
    globalEventBus.on('ui:sectionAdded', ({ headerId, listId, expanded }) => {
      this.setupCollapsible(headerId, listId, expanded);
    });
    
    // Listen for section state changes
    globalEventBus.on('ui:sectionStateChange', ({ headerId, expanded }) => {
      this.updateStickyClasses();
    });
    
    // Listen for window resize to update sticky classes
    window.addEventListener('resize', this.debounce(() => {
      this.updateStickyClasses();
    }, 150));
  }
  
  /**
   * Initialize existing collapsible sections from the DOM
   */
  initializeExistingSections() {
    const headers = document.querySelectorAll('.layer-menu h4');
    headers.forEach(header => {
      const headerId = header.id;
      if (headerId && headerId.endsWith('Header')) {
        const listId = headerId.replace('Header', 'List');
        const list = document.getElementById(listId);
        if (list) {
          const expanded = !header.classList.contains('collapsed');
          this.setupCollapsible(headerId, listId, expanded);
        }
      }
    });
    
    // Update sticky classes after initialization
    this.updateStickyClasses();
  }
  
  /**
   * Set up a collapsible section
   */
  setupCollapsible(headerId, listId, expanded = false) {
    console.log('setupCollapsible called with:', { headerId, listId, expanded });
    
    const header = document.getElementById(headerId);
    const list = document.getElementById(listId);
    
    console.log('setupCollapsible elements found:', { 
      header: !!header, 
      list: !!list,
      headerElement: header,
      listElement: list
    });
    
    if (!header || !list) {
      console.error('setupCollapsible: Missing elements, returning early');
      return;
    }
    
    console.log('setupCollapsible: Setting up collapsible for', headerId);
    
    // Store section info
    this.collapsibleSections.set(headerId, {
      header,
      list,
      expanded: expanded,
      listId
    });
    
    // Set initial state
    if (!expanded) {
      header.classList.add('collapsed');
      list.style.display = 'none';
    } else {
      header.classList.remove('collapsed');
      list.style.display = '';
    }
    
    // Remove existing event listeners to prevent duplicates
    header.removeEventListener('click', this.toggleSection);
    
    // Add click event listener
    header.addEventListener('click', () => {
      console.log('setupCollapsible: Header clicked:', headerId);
      this.toggleSection(headerId);
    });
    
    console.log('setupCollapsible: Event listener attached to', headerId);
    
    // Initial sticky classes
    setTimeout(() => {
      const allHeaders = Array.from(document.querySelectorAll('.sidebar-headers h4'));
      const expandedIdx = allHeaders.findIndex(h => !h.classList.contains('collapsed'));
      allHeaders.forEach((h, i) => {
        h.classList.remove('sticky-top', 'sticky-bottom');
        if (expandedIdx === -1) return;
        if (i < expandedIdx) h.classList.add('sticky-top');
        if (i > expandedIdx) h.classList.add('sticky-bottom');
      });
    }, 0);
    
    console.log('CollapsibleManager: Collapsible setup complete for', headerId);
  }
  
  /**
   * Toggle a collapsible section
   */
  toggleSection(headerId) {
    console.log('setupCollapsible: Header clicked:', headerId);
    
    const section = this.collapsibleSections.get(headerId);
    if (!section) {
      console.warn('CollapsibleManager: Section not found', headerId);
      return;
    }
    
    const { header, list } = section;
    
    // Only collapse other sections if this is not 'activeHeader'
    if (headerId !== 'activeHeader') {
      // Collapse all other sections except 'activeHeader' and the one being clicked
      const allHeaders = document.querySelectorAll('.layer-menu h4');
      allHeaders.forEach(h => {
        if (h.id !== 'activeHeader' && h.id !== headerId) {
          h.classList.add('collapsed');
          const targetListId = h.id.replace('Header', 'List');
          const targetList = document.getElementById(targetListId);
          if (targetList) targetList.style.display = 'none';
        }
      });
    }
    
    // Toggle this section
    header.classList.toggle('collapsed');
    list.style.display = list.style.display === 'none' ? '' : 'none';
    
    // Update section state
    section.expanded = !header.classList.contains('collapsed');
    
    console.log('setupCollapsible: After toggle:', {
      headerClasses: header.className,
      listDisplay: list.style.display
    });
    
    // Update sticky classes
    this.updateStickyClasses();
    
    // Emit state change event
    globalEventBus.emit('ui:sectionStateChange', {
      headerId,
      expanded: section.expanded
    });
  }
  
  /**
   * Collapse all sections except the specified ones
   */
  collapseAllExcept(excludeIds) {
    this.collapsibleSections.forEach((section, headerId) => {
      if (!excludeIds.includes(headerId)) {
        const { header, list } = section;
        header.classList.add('collapsed');
        list.style.display = 'none';
        section.expanded = false;
      }
    });
  }
  
  /**
   * Update sticky header classes based on expanded sections
   */
  updateStickyClasses() {
    const allHeaders = Array.from(document.querySelectorAll('.sidebar-headers h4'));
    if (allHeaders.length === 0) return;
    
    // Find the first expanded section
    const expandedIdx = allHeaders.findIndex(h => !h.classList.contains('collapsed'));
    
    allHeaders.forEach((header, i) => {
      header.classList.remove('sticky-top', 'sticky-bottom');
      
      if (expandedIdx === -1) return;
      
      if (i < expandedIdx) {
        header.classList.add('sticky-top');
        this.stickyHeaders.add(header);
      } else if (i > expandedIdx) {
        header.classList.add('sticky-bottom');
        this.stickyHeaders.add(header);
      } else {
        this.stickyHeaders.delete(header);
      }
    });
    
    console.log('CollapsibleManager: Sticky classes updated', {
      expandedIndex: expandedIdx,
      stickyHeaders: this.stickyHeaders.size
    });
  }
  
  /**
   * Expand a specific section
   */
  expandSection(headerId) {
    const section = this.collapsibleSections.get(headerId);
    if (section && !section.expanded) {
      this.toggleSection(headerId);
    }
  }
  
  /**
   * Collapse a specific section
   */
  collapseSection(headerId) {
    const section = this.collapsibleSections.get(headerId);
    if (section && section.expanded) {
      this.toggleSection(headerId);
    }
  }
  
  /**
   * Get section state
   */
  getSectionState(headerId) {
    const section = this.collapsibleSections.get(headerId);
    return section ? {
      expanded: section.expanded,
      visible: list.style.display !== 'none'
    } : null;
  }
  
  /**
   * Get all section states
   */
  getAllSectionStates() {
    const states = {};
    this.collapsibleSections.forEach((section, headerId) => {
      states[headerId] = {
        expanded: section.expanded,
        visible: section.list.style.display !== 'none'
      };
    });
    return states;
  }
  
  /**
   * Utility function for debouncing
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Get collapsible manager status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalSections: this.collapsibleSections.size,
      activeSection: this.activeSection,
      stickyHeaders: this.stickyHeaders.size,
      sectionStates: this.getAllSectionStates()
    };
  }
  
  /**
   * Check if collapsible manager is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Export singleton instance
export const collapsibleManager = new CollapsibleManager();

// Export for global access (ES6 module system)
if (typeof window !== 'undefined') {
  window.CollapsibleManager = collapsibleManager;
}
