/**
 * @fileoverview MobileDocsNavManager - Modern mobile documentation navigation component
 * @description Provides enhanced mobile navigation for documentation with hamburger menu,
 * touch gestures, accessibility support, and seamless responsive behavior
 * @module components/MobileDocsNavManager
 */

import { ComponentBase } from '../modules/ComponentBase.js';

/**
 * Modern mobile documentation navigation manager
 * Replaces legacy js/ui/mobileDocsNav.js with enhanced features
 */
export class MobileDocsNavManager extends ComponentBase {
  /**
   * Initialize MobileDocsNavManager
   * @param {HTMLElement} container - Container element for mobile navigation
   * @param {Object} options - Configuration options
   * @param {StateManager} options.stateManager - State management system
   * @param {EventBus} options.eventBus - Event communication system
   * @param {number} [options.mobileBreakpoint=768] - Mobile breakpoint in pixels
   * @param {boolean} [options.enableGestures=true] - Enable touch gesture support
   * @param {boolean} [options.enableAccessibility=true] - Enable accessibility features
   * @param {boolean} [options.enableHaptics=true] - Enable haptic feedback
   */
  constructor(container, options = {}) {
    super(container, options);
    
    this.name = 'MobileDocsNavManager';
    this.stateManager = options.stateManager;
    this.eventBus = options.eventBus;
    
    // Configuration
    this.mobileBreakpoint = options.mobileBreakpoint || 768;
    this.enableGestures = options.enableGestures !== false;
    this.enableAccessibility = options.enableAccessibility !== false;
    this.enableHaptics = options.enableHaptics !== false;
    
    // State
    this.isInitialized = false;
    this.isMobile = false;
    this.isMenuOpen = false;
    this.currentDoc = null;
    this.navItems = [];
    this.resizeObserver = null;
    
    // DOM elements
    this.docsContent = null;
    this.docsToc = null;
    this.hamburgerContainer = null;
    this.hamburgerButton = null;
    this.dropdownMenu = null;
    this.menuLinks = null;
    
    // Event handlers (bound for cleanup)
    this.boundHandlers = {
      resize: this.handleResize.bind(this),
      documentClick: this.handleDocumentClick.bind(this),
      keydown: this.handleKeydown.bind(this),
      hamburgerClick: this.handleHamburgerClick.bind(this),
      linkClick: this.handleLinkClick.bind(this),
      docsOpened: this.handleDocsOpened.bind(this),
      docsClosed: this.handleDocsClosed.bind(this)
    };
    
    // Touch gesture support
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.swipeThreshold = 100; // pixels
    this.swipeTimeThreshold = 300; // milliseconds
  }
  
  /**
   * Initialize the mobile documentation navigation manager
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      console.warn(`${this.name}: Already initialized`);
      return;
    }
    
    try {
      console.log(`📱 ${this.name}: Initializing mobile documentation navigation...`);
      
      // Find DOM elements
      this.findDOMElements();
      
      // Check mobile state
      this.updateMobileState();
      
      // Extract navigation items
      this.extractNavigationItems();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initial render
      this.render();
      
      // Set up accessibility
      if (this.enableAccessibility) {
        this.setupAccessibility();
      }
      
      // Set up touch gestures
      if (this.enableGestures) {
        this.setupGestures();
      }
      
      // Set up resize observer for performance
      this.setupResizeObserver();
      
      // Expose global functions for legacy compatibility
      this.exposeGlobalFunctions();
      
      this.isInitialized = true;
      
      // Emit initialization event
      this.eventBus?.emit('mobileDocsNav:initialized', {
        component: this.name,
        isMobile: this.isMobile,
        navItems: this.navItems.length
      });
      
      console.log(`✅ ${this.name}: Initialized successfully (${this.navItems.length} nav items)`);
      
    } catch (error) {
      console.error(`🚨 ${this.name}: Initialization failed:`, error);
      throw error;
    }
  }
  
  /**
   * Find required DOM elements
   * @private
   */
  findDOMElements() {
    // Find docs content container
    this.docsContent = document.querySelector('.docs-content');
    if (!this.docsContent) {
      console.warn(`${this.name}: Docs content container not found`);
    }
    
    // Find table of contents
    this.docsToc = document.querySelector('.docs-toc');
    if (!this.docsToc) {
      console.warn(`${this.name}: Documentation TOC not found`);
    }
    
    console.log(`${this.name}: Found DOM elements - Content: ${!!this.docsContent}, TOC: ${!!this.docsToc}`);
  }
  
  /**
   * Extract navigation items from existing TOC
   * @private
   */
  extractNavigationItems() {
    this.navItems = [];
    
    if (!this.docsToc) {
      console.warn(`${this.name}: No TOC found, cannot extract navigation items`);
      return;
    }
    
    // Find all navigation links
    const tocLinks = this.docsToc.querySelectorAll('a[data-doc]');
    
    tocLinks.forEach(link => {
      const docSlug = link.getAttribute('data-doc');
      const title = link.textContent.trim();
      const href = link.href;
      const isActive = link.classList.contains('active');
      
      if (docSlug && title) {
        this.navItems.push({
          slug: docSlug,
          title: title,
          href: href,
          isActive: isActive,
          element: link
        });
      }
    });
    
    // Update current document
    const activeItem = this.navItems.find(item => item.isActive);
    if (activeItem) {
      this.currentDoc = activeItem.slug;
    }
    
    console.log(`${this.name}: Extracted ${this.navItems.length} navigation items`);
    
    // Emit navigation items extracted event
    this.eventBus?.emit('mobileDocsNav:navItemsExtracted', {
      items: this.navItems,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Update mobile state based on viewport
   * @private
   */
  updateMobileState() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= this.mobileBreakpoint;
    
    if (wasMobile !== this.isMobile) {
      console.log(`${this.name}: Mobile state changed: ${this.isMobile} (width: ${window.innerWidth}px)`);
      
      // Emit mobile state change event
      this.eventBus?.emit('mobileDocsNav:mobileStateChanged', {
        isMobile: this.isMobile,
        width: window.innerWidth,
        breakpoint: this.mobileBreakpoint
      });
    }
  }
  
  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.boundHandlers.resize, { passive: true });
    
    // Document click for closing menu
    document.addEventListener('click', this.boundHandlers.documentClick);
    
    // Keyboard navigation
    document.addEventListener('keydown', this.boundHandlers.keydown);
    
    // Docs events
    window.addEventListener('docs-opened', this.boundHandlers.docsOpened);
    window.addEventListener('docs-closed', this.boundHandlers.docsClosed);
    
    // EventBus events
    if (this.eventBus) {
      this.eventBus.on('docs:loaded', this.boundHandlers.docsOpened);
      this.eventBus.on('docs:closed', this.boundHandlers.docsClosed);
    }
    
    console.log(`${this.name}: Event listeners set up`);
  }
  
  /**
   * Set up resize observer for performance
   * @private
   */
  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === document.documentElement) {
            this.handleResize();
            break;
          }
        }
      });
      
      this.resizeObserver.observe(document.documentElement);
      console.log(`${this.name}: ResizeObserver set up`);
    }
  }
  
  /**
   * Set up accessibility features
   * @private
   */
  setupAccessibility() {
    if (!this.hamburgerButton) return;
    
    // ARIA attributes
    this.hamburgerButton.setAttribute('role', 'button');
    this.hamburgerButton.setAttribute('aria-haspopup', 'true');
    this.hamburgerButton.setAttribute('aria-expanded', 'false');
    this.hamburgerButton.setAttribute('aria-label', 'Open documentation navigation menu');
    
    if (this.dropdownMenu) {
      this.dropdownMenu.setAttribute('role', 'menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'true');
      
      // Set up menu item accessibility
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach((link, index) => {
        link.setAttribute('role', 'menuitem');
        link.setAttribute('tabindex', this.isMenuOpen ? '0' : '-1');
      });
    }
    
    console.log(`${this.name}: Accessibility features set up`);
  }
  
  /**
   * Set up touch gesture support
   * @private
   */
  setupGestures() {
    if (!this.dropdownMenu) return;
    
    // Swipe down to close menu
    this.dropdownMenu.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }, { passive: true });
    
    this.dropdownMenu.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaY = touchEndY - this.touchStartY;
      const deltaTime = touchEndTime - this.touchStartTime;
      
      // Swipe down gesture
      if (deltaY > this.swipeThreshold && deltaTime < this.swipeTimeThreshold) {
        this.closeMenu();
      }
    }, { passive: true });
    
    console.log(`${this.name}: Touch gestures set up`);
  }
  
  /**
   * Render the mobile navigation interface
   * @private
   */
  render() {
    if (!this.docsContent) {
      console.log(`${this.name}: No docs content found, skipping render`);
      return;
    }
    
    // Remove existing mobile navigation
    this.cleanup();
    
    if (!this.isMobile) {
      console.log(`${this.name}: Not mobile, skipping mobile navigation render`);
      return;
    }
    
    if (this.navItems.length === 0) {
      console.log(`${this.name}: No navigation items, skipping render`);
      return;
    }
    
    // Create hamburger navigation
    this.createHamburgerNavigation();
    
    console.log(`${this.name}: Mobile navigation rendered`);
    
    // Emit render event
    this.eventBus?.emit('mobileDocsNav:rendered', {
      isMobile: this.isMobile,
      navItems: this.navItems.length
    });
  }
  
  /**
   * Create hamburger-style navigation
   * @private
   */
  createHamburgerNavigation() {
    // Find insertion point (first h1 in docs content)
    const pageTitle = this.docsContent.querySelector('h1');
    if (!pageTitle) {
      console.warn(`${this.name}: No page title found for hamburger insertion`);
      return;
    }
    
    // Create container
    this.hamburgerContainer = document.createElement('div');
    this.hamburgerContainer.className = 'mobile-docs-nav-container';
    
    // Create hamburger button
    this.hamburgerButton = document.createElement('button');
    this.hamburgerButton.className = 'mobile-docs-hamburger-btn';
    this.hamburgerButton.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-text">Navigation</span>
    `;
    
    // Create dropdown menu
    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className = 'mobile-docs-dropdown-menu hidden';
    
    // Create menu header
    const menuHeader = document.createElement('div');
    menuHeader.className = 'mobile-docs-menu-header';
    menuHeader.innerHTML = '<h3>📚 Documentation</h3>';
    
    // Create menu links container
    this.menuLinks = document.createElement('div');
    this.menuLinks.className = 'mobile-docs-menu-links';
    
    // Add navigation links
    this.navItems.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.className = 'mobile-docs-menu-link';
      link.setAttribute('data-doc', item.slug);
      link.textContent = item.title;
      
      if (item.isActive) {
        link.classList.add('active');
      }
      
      // Add click handler
      link.addEventListener('click', this.boundHandlers.linkClick);
      
      this.menuLinks.appendChild(link);
    });
    
    // Assemble dropdown
    this.dropdownMenu.appendChild(menuHeader);
    this.dropdownMenu.appendChild(this.menuLinks);
    
    // Assemble container
    this.hamburgerContainer.appendChild(this.hamburgerButton);
    this.hamburgerContainer.appendChild(this.dropdownMenu);
    
    // Insert before page title
    pageTitle.parentNode.insertBefore(this.hamburgerContainer, pageTitle);
    
    // Set up button click handler
    this.hamburgerButton.addEventListener('click', this.boundHandlers.hamburgerClick);
    
    // Set up accessibility
    if (this.enableAccessibility) {
      this.setupAccessibility();
    }
    
    // Set up gestures
    if (this.enableGestures) {
      this.setupGestures();
    }
    
    console.log(`${this.name}: Hamburger navigation created`);
  }
  
  /**
   * Toggle the dropdown menu
   */
  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
  
  /**
   * Open the dropdown menu
   */
  openMenu() {
    if (this.isMenuOpen || !this.dropdownMenu || !this.hamburgerButton) return;
    
    console.log(`${this.name}: Opening menu`);
    
    this.isMenuOpen = true;
    
    // Update DOM
    this.dropdownMenu.classList.remove('hidden');
    this.hamburgerButton.classList.add('active');
    
    // Update accessibility
    if (this.enableAccessibility) {
      this.hamburgerButton.setAttribute('aria-expanded', 'true');
      this.hamburgerButton.setAttribute('aria-label', 'Close documentation navigation menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'false');
      
      // Enable menu item tabbing
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        link.setAttribute('tabindex', '0');
      });
    }
    
    // Haptic feedback
    if (this.enableHaptics && window.NativeFeatures?.hapticFeedback) {
      window.NativeFeatures.hapticFeedback('light');
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:menuOpened', {
      navItems: this.navItems.length
    });
    
    // Focus first menu item for keyboard users
    const firstLink = this.dropdownMenu.querySelector('.mobile-docs-menu-link');
    if (firstLink && document.activeElement === this.hamburgerButton) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }
  
  /**
   * Close the dropdown menu
   */
  closeMenu() {
    if (!this.isMenuOpen || !this.dropdownMenu || !this.hamburgerButton) return;
    
    console.log(`${this.name}: Closing menu`);
    
    this.isMenuOpen = false;
    
    // Update DOM
    this.dropdownMenu.classList.add('hidden');
    this.hamburgerButton.classList.remove('active');
    
    // Update accessibility
    if (this.enableAccessibility) {
      this.hamburgerButton.setAttribute('aria-expanded', 'false');
      this.hamburgerButton.setAttribute('aria-label', 'Open documentation navigation menu');
      this.dropdownMenu.setAttribute('aria-hidden', 'true');
      
      // Disable menu item tabbing
      const menuLinks = this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        link.setAttribute('tabindex', '-1');
      });
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:menuClosed', {});
  }
  
  /**
   * Update active navigation item
   * @param {string} docSlug - Document slug to mark as active
   */
  updateActiveItem(docSlug) {
    if (this.currentDoc === docSlug) return;
    
    console.log(`${this.name}: Updating active item to: ${docSlug}`);
    
    this.currentDoc = docSlug;
    
    // Update navigation items
    this.navItems.forEach(item => {
      item.isActive = item.slug === docSlug;
    });
    
    // Update menu links if they exist
    if (this.menuLinks) {
      const menuLinks = this.menuLinks.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        const linkSlug = link.getAttribute('data-doc');
        if (linkSlug === docSlug) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
    
    // Emit event
    this.eventBus?.emit('mobileDocsNav:activeItemChanged', {
      docSlug: docSlug,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Refresh navigation items from TOC
   */
  refreshNavigation() {
    console.log(`${this.name}: Refreshing navigation`);
    
    // Re-extract navigation items
    this.extractNavigationItems();
    
    // Re-render if mobile
    if (this.isMobile) {
      this.render();
    }
    
    // Emit refresh event
    this.eventBus?.emit('mobileDocsNav:refreshed', {
      navItems: this.navItems.length,
      currentDoc: this.currentDoc
    });
  }
  
  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    const oldMobile = this.isMobile;
    this.updateMobileState();
    
    // Re-render if mobile state changed
    if (oldMobile !== this.isMobile) {
      this.render();
    }
  }
  
  /**
   * Handle document click (for closing menu)
   * @private
   */
  handleDocumentClick(event) {
    if (!this.isMenuOpen || !this.hamburgerContainer) return;
    
    // Close menu if clicking outside
    if (!this.hamburgerContainer.contains(event.target)) {
      this.closeMenu();
    }
  }
  
  /**
   * Handle keyboard navigation
   * @private
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'Escape':
        if (this.isMenuOpen) {
          event.preventDefault();
          this.closeMenu();
          // Return focus to hamburger button
          if (this.hamburgerButton) {
            this.hamburgerButton.focus();
          }
        }
        break;
        
      case 'ArrowDown':
        if (this.isMenuOpen && this.dropdownMenu?.contains(document.activeElement)) {
          event.preventDefault();
          this.focusNextMenuItem();
        }
        break;
        
      case 'ArrowUp':
        if (this.isMenuOpen && this.dropdownMenu?.contains(document.activeElement)) {
          event.preventDefault();
          this.focusPreviousMenuItem();
        }
        break;
        
      case 'Enter':
      case ' ':
        if (document.activeElement === this.hamburgerButton) {
          event.preventDefault();
          this.toggleMenu();
        }
        break;
    }
  }
  
  /**
   * Focus next menu item
   * @private
   */
  focusNextMenuItem() {
    const menuLinks = Array.from(this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link'));
    const currentIndex = menuLinks.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % menuLinks.length;
    menuLinks[nextIndex]?.focus();
  }
  
  /**
   * Focus previous menu item
   * @private
   */
  focusPreviousMenuItem() {
    const menuLinks = Array.from(this.dropdownMenu.querySelectorAll('.mobile-docs-menu-link'));
    const currentIndex = menuLinks.indexOf(document.activeElement);
    const prevIndex = currentIndex <= 0 ? menuLinks.length - 1 : currentIndex - 1;
    menuLinks[prevIndex]?.focus();
  }
  
  /**
   * Handle hamburger button click
   * @private
   */
  handleHamburgerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleMenu();
  }
  
  /**
   * Handle navigation link click
   * @private
   */
  handleLinkClick(event) {
    const link = event.target;
    const docSlug = link.getAttribute('data-doc');
    
    if (docSlug) {
      // Update active item
      this.updateActiveItem(docSlug);
      
      // Close menu
      this.closeMenu();
      
      // Haptic feedback
      if (this.enableHaptics && window.NativeFeatures?.hapticFeedback) {
        window.NativeFeatures.hapticFeedback('light');
      }
      
      // Emit navigation event
      this.eventBus?.emit('mobileDocsNav:navigationClick', {
        docSlug: docSlug,
        title: link.textContent.trim()
      });
    }
  }
  
  /**
   * Handle docs opened event
   * @private
   */
  handleDocsOpened(event) {
    console.log(`${this.name}: Docs opened, refreshing navigation`);
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      this.findDOMElements();
      this.refreshNavigation();
    }, 100);
  }
  
  /**
   * Handle docs closed event
   * @private
   */
  handleDocsClosed(event) {
    console.log(`${this.name}: Docs closed, cleaning up mobile navigation`);
    this.cleanup();
  }
  
  /**
   * Expose global functions for legacy compatibility
   * @private
   */
  exposeGlobalFunctions() {
    // Expose manager instance globally
    window.MobileDocsNavManager = this;
    
    // Legacy API compatibility
    window.MobileDocsNav = {
      init: () => this.init(),
      setupDocsNavigation: () => this.refreshNavigation(),
      onDocsOpen: () => this.handleDocsOpened(),
      highlightCurrentPage: (slug) => this.updateActiveItem(slug),
      removeMobileElements: () => this.cleanup()
    };
    
    console.log(`${this.name}: Global functions exposed for legacy compatibility`);
  }
  
  /**
   * Get current state
   * @returns {Object} Current component state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isMobile: this.isMobile,
      isMenuOpen: this.isMenuOpen,
      currentDoc: this.currentDoc,
      navItems: this.navItems.map(item => ({
        slug: item.slug,
        title: item.title,
        isActive: item.isActive
      })),
      mobileBreakpoint: this.mobileBreakpoint
    };
  }
  
  /**
   * Apply state configuration
   * @param {Object} state - State to apply
   */
  applyState(state) {
    if (state.currentDoc && state.currentDoc !== this.currentDoc) {
      this.updateActiveItem(state.currentDoc);
    }
    
    if (state.isMenuOpen !== undefined && state.isMenuOpen !== this.isMenuOpen) {
      if (state.isMenuOpen) {
        this.openMenu();
      } else {
        this.closeMenu();
      }
    }
  }
  
  /**
   * Clean up mobile navigation elements
   */
  cleanup() {
    // Close menu if open
    if (this.isMenuOpen) {
      this.closeMenu();
    }
    
    // Remove hamburger navigation
    if (this.hamburgerContainer) {
      this.hamburgerContainer.remove();
      this.hamburgerContainer = null;
      this.hamburgerButton = null;
      this.dropdownMenu = null;
      this.menuLinks = null;
    }
    
    // Remove any other mobile navigation elements
    const mobileElements = document.querySelectorAll('.mobile-docs-nav-container, .docs-mobile-menu-container, .mobile-nav-hint, .docs-toc-toggle');
    mobileElements.forEach(element => element.remove());
    
    console.log(`${this.name}: Mobile navigation cleaned up`);
  }
  
  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (!this.isInitialized) return;
    
    console.log(`${this.name}: Destroying component...`);
    
    // Clean up mobile navigation
    this.cleanup();
    
    // Remove event listeners
    window.removeEventListener('resize', this.boundHandlers.resize);
    document.removeEventListener('click', this.boundHandlers.documentClick);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('docs-opened', this.boundHandlers.docsOpened);
    window.removeEventListener('docs-closed', this.boundHandlers.docsClosed);
    
    // Clean up EventBus listeners
    if (this.eventBus) {
      this.eventBus.off('docs:loaded', this.boundHandlers.docsOpened);
      this.eventBus.off('docs:closed', this.boundHandlers.docsClosed);
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Reset state
    this.isInitialized = false;
    this.navItems = [];
    this.currentDoc = null;
    
    // Remove global functions
    if (window.MobileDocsNavManager === this) {
      delete window.MobileDocsNavManager;
    }
    if (window.MobileDocsNav) {
      delete window.MobileDocsNav;
    }
    
    // Emit destroy event
    this.eventBus?.emit('mobileDocsNav:destroyed', {
      component: this.name
    });
    
    console.log(`${this.name}: Component destroyed`);
  }
}

export default MobileDocsNavManager;
