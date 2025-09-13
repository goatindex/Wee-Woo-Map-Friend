/**
 * @module modules/MobileDocsNavManager
 * Modern ES6-based mobile documentation navigation for WeeWoo Map Friend
 * Replaces js/ui/mobileDocsNav.js with a modern, event-driven system
 */

import { globalEventBus } from './EventBus.js';
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
 * @class MobileDocsNavManager
 * Manages mobile-friendly documentation navigation with hamburger menu
 */
export class MobileDocsNavManager {
  constructor() {
    this.initialized = false;
    this.mobileBreakpoint = 720;
    this.periodicCheckInterval = null;
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Bind methods
    this.init = this.init.bind(this);
    this.setupDocsNavigation = this.setupDocsNavigation.bind(this);
    this.createTestElement = this.createTestElement.bind(this);
    this.addMobileNavigation = this.addMobileNavigation.bind(this);
    this.setupHamburgerHandlers = this.setupHamburgerHandlers.bind(this);
    this.toggleDropdownMenu = this.toggleDropdownMenu.bind(this);
    this.openDropdownMenu = this.openDropdownMenu.bind(this);
    this.closeDropdownMenu = this.closeDropdownMenu.bind(this);
    this.removeMobileElements = this.removeMobileElements.bind(this);
    this.addMobileHint = this.addMobileHint.bind(this);
    this.setupLinkHandlers = this.setupLinkHandlers.bind(this);
    this.highlightCurrentPage = this.highlightCurrentPage.bind(this);
    this.onDocsOpen = this.onDocsOpen.bind(this);
    this.debounce = this.debounce.bind(this);
    
    this.logger.info('Mobile documentation navigation system initialized', {
      operation: 'constructor',
      mobileBreakpoint: this.mobileBreakpoint,
      initialized: this.initialized
    });
  }
  
  /**
   * Initialize the mobile docs navigation manager
   */
  async init() {
    if (this.initialized) {
      this.logger.warn('Already initialized', {
        operation: 'init',
        currentState: 'initialized'
      });
      return;
    }
    
    const timer = this.logger.time('mobile-docs-nav-initialization');
    try {
      this.logger.info('Initializing mobile documentation navigation', {
        operation: 'init',
        mobileBreakpoint: this.mobileBreakpoint,
        windowWidth: window.innerWidth
      });
      this.logger.debug('Window width check', { 
        width: window.innerWidth, 
        isMobile: window.innerWidth <= this.mobileBreakpoint 
      });
      
      // Immediate test - try to find docs elements
      const toc = document.querySelector('.docs-toc');
      const drawer = document.querySelector('.docs-drawer');
      this.logger.debug('Documentation elements check', { 
        tocFound: !!toc, 
        drawerFound: !!drawer 
      });
      
      // Set up navigation when docs are opened
      this.setupDocsNavigation();
      
      // Listen for window resize to adapt navigation
      window.addEventListener('resize', this.debounce(() => {
        this.logger.debug('Window resized', {
          operation: 'resize',
          newWidth: window.innerWidth,
          isMobile: window.innerWidth <= this.mobileBreakpoint
        });
        this.setupDocsNavigation();
      }, 250));
      
      // Also try setting up navigation periodically (in case docs open later)
      this.periodicCheckInterval = setInterval(() => {
        const docsVisible = !document.querySelector('.docs-drawer[hidden]');
        if (docsVisible && window.innerWidth <= this.mobileBreakpoint) {
          this.logger.debug('Periodic check - docs are visible', {
            operation: 'periodicCheck',
            docsVisible: true,
            windowWidth: window.innerWidth,
            isMobile: window.innerWidth <= this.mobileBreakpoint
          });
          this.setupDocsNavigation();
        }
      }, 2000);
      
      // Listen for docs opening events
      globalEventBus.on('docs:opened', this.onDocsOpen);
      
      this.initialized = true;
      timer.end({
        success: true,
        mobileBreakpoint: this.mobileBreakpoint,
        hasPeriodicCheck: !!this.periodicCheckInterval
      });
      this.logger.info('Mobile documentation navigation system ready');
      
    } catch (error) {
      timer.end({
        success: false,
        error: error.message,
        mobileBreakpoint: this.mobileBreakpoint
      });
      this.logger.error('Failed to initialize', {
        operation: 'init',
        error: error.message,
        stack: error.stack,
        mobileBreakpoint: this.mobileBreakpoint
      });
      throw error;
    }
  }
  
  /**
   * Set up mobile-friendly documentation navigation
   */
  setupDocsNavigation() {
    this.logger.info('Setting up navigation', {
      operation: 'setupDocsNavigation',
      windowWidth: window.innerWidth,
      mobileBreakpoint: this.mobileBreakpoint
    });
    this.logger.debug('Window resize check', { width: window.innerWidth });
    
    // Create immediate test element
    this.createTestElement();
    
    const toc = document.querySelector('.docs-toc');
    this.logger.debug('TOC element check', { tocFound: !!toc });
    
    if (!toc) {
      this.logger.warn('No TOC found, cannot proceed', {
        operation: 'setupDocsNavigation',
        tocFound: false,
        windowWidth: window.innerWidth
      });
      return;
    }
    
    const isMobile = window.innerWidth <= this.mobileBreakpoint;
    this.logger.debug('Mobile detection check', { 
      isMobile, 
      width: window.innerWidth 
    });
    
    if (!isMobile) {
      this.logger.info('Not mobile, removing mobile elements', {
        operation: 'setupDocsNavigation',
        isMobile: false,
        windowWidth: window.innerWidth,
        mobileBreakpoint: this.mobileBreakpoint
      });
      // Remove mobile elements on desktop
      this.removeMobileElements();
      return;
    }
    
    this.logger.info('Mobile detected, adding navigation', {
      operation: 'setupDocsNavigation',
      isMobile: true,
      windowWidth: window.innerWidth,
      mobileBreakpoint: this.mobileBreakpoint
    });
    // Add mobile navigation elements
    this.addMobileNavigation(toc);
  }

  /**
   * Create a test element to verify the script is working
   */
  createTestElement() {
    // Remove any existing test element
    const existing = document.querySelector('.mobile-nav-test');
    if (existing) {
      existing.remove();
    }
    
    // Create a highly visible test element
    const testEl = document.createElement('div');
    testEl.className = 'mobile-nav-test';
    testEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: red;
      color: white;
      padding: 10px;
      z-index: 10000;
      border-radius: 5px;
      font-weight: bold;
      font-size: 12px;
    `;
    testEl.innerHTML = '🔴 MOBILE NAV TEST<br>Width: ' + window.innerWidth;
    
    document.body.appendChild(testEl);
    this.logger.debug('Test element created', {
      operation: 'createTestElement',
      windowWidth: window.innerWidth,
      elementClass: 'mobile-nav-test'
    });
    
    // Remove test element after 5 seconds
    setTimeout(() => {
      if (testEl.parentNode) {
        testEl.remove();
        this.logger.debug('Test element removed', {
          operation: 'createTestElement',
          duration: '5000ms'
        });
      }
    }, 5000);
  }
  
  /**
   * Add mobile navigation elements - hamburger menu style
   */
  addMobileNavigation(toc) {
    this.logger.info('Adding hamburger menu navigation', {
      operation: 'addMobileNavigation',
      hasToc: !!toc,
      windowWidth: window.innerWidth
    });
    
    // Remove any existing mobile navigation
    this.removeMobileElements();
    
    // Find the docs content area and page title
    const docsContent = document.querySelector('.docs-content');
    const pageTitle = docsContent ? docsContent.querySelector('h1') : null;
    
    if (!pageTitle) {
      this.logger.warn('No page title found, cannot add hamburger menu', {
        operation: 'addMobileNavigation',
        hasDocsContent: !!docsContent,
        hasPageTitle: false
      });
      return;
    }
    
    // Create hamburger menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'docs-mobile-menu-container';
    
    // Create hamburger button
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'docs-hamburger-btn';
    hamburgerBtn.setAttribute('aria-label', 'Open documentation navigation menu');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;
    
    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'docs-dropdown-menu hidden';
    
    // Create menu header
    const menuHeader = document.createElement('div');
    menuHeader.className = 'docs-menu-header';
    menuHeader.innerHTML = '<h3>📚 Documentation Pages</h3>';
    
    // Extract navigation links from TOC
    const tocLinks = toc.querySelectorAll('a[data-doc]');
    const menuLinks = document.createElement('div');
    menuLinks.className = 'docs-menu-links';
    
    this.logger.debug('Found navigation links', {
      operation: 'addMobileNavigation',
      linkCount: tocLinks.length,
      hasTocLinks: tocLinks.length > 0
    });
    
    tocLinks.forEach(link => {
      const menuLink = document.createElement('a');
      menuLink.href = link.href;
      menuLink.setAttribute('data-doc', link.getAttribute('data-doc'));
      menuLink.className = 'docs-menu-link';
      menuLink.textContent = link.textContent.trim();
      
      // Copy active state
      if (link.classList.contains('active')) {
        menuLink.classList.add('active');
      }
      
      // Add click handler to close menu
      menuLink.addEventListener('click', () => {
        this.closeDropdownMenu(hamburgerBtn, dropdownMenu);
      });
      
      menuLinks.appendChild(menuLink);
    });
    
    // Assemble dropdown menu
    dropdownMenu.appendChild(menuHeader);
    dropdownMenu.appendChild(menuLinks);
    
    // Assemble container
    menuContainer.appendChild(hamburgerBtn);
    menuContainer.appendChild(dropdownMenu);
    
    // Insert hamburger menu before the page title
    pageTitle.parentNode.insertBefore(menuContainer, pageTitle);
    
    // Add event handlers
    this.setupHamburgerHandlers(hamburgerBtn, dropdownMenu);
    
    this.logger.info('Hamburger menu created successfully', {
      operation: 'addMobileNavigation',
      linkCount: tocLinks.length,
      hasHamburgerBtn: !!hamburgerBtn,
      hasDropdownMenu: !!dropdownMenu
    });
  }
  
  /**
   * Set up hamburger button event handlers
   */
  setupHamburgerHandlers(hamburgerBtn, dropdownMenu) {
    this.logger.debug('Setting up hamburger handlers', {
      operation: 'setupHamburgerHandlers',
      hasHamburgerBtn: !!hamburgerBtn,
      hasDropdownMenu: !!dropdownMenu
    });
    
    // Toggle menu on button click
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdownMenu(hamburgerBtn, dropdownMenu);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        this.closeDropdownMenu(hamburgerBtn, dropdownMenu);
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdownMenu(hamburgerBtn, dropdownMenu);
      }
    });
  }

  /**
   * Toggle dropdown menu visibility
   */
  toggleDropdownMenu(hamburgerBtn, dropdownMenu) {
    const isOpen = !dropdownMenu.classList.contains('hidden');
    
    if (isOpen) {
      this.closeDropdownMenu(hamburgerBtn, dropdownMenu);
    } else {
      this.openDropdownMenu(hamburgerBtn, dropdownMenu);
    }
  }

  /**
   * Open dropdown menu
   */
  openDropdownMenu(hamburgerBtn, dropdownMenu) {
    this.logger.debug('Opening dropdown menu', {
      operation: 'openDropdownMenu',
      hasHamburgerBtn: !!hamburgerBtn,
      hasDropdownMenu: !!dropdownMenu,
      hasNativeFeatures: !!window.NativeFeatures
    });
    
    dropdownMenu.classList.remove('hidden');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close documentation navigation menu');
    
    // Haptic feedback
    if (window.NativeFeatures) {
      window.NativeFeatures.hapticFeedback('light');
    }
  }

  /**
   * Close dropdown menu
   */
  closeDropdownMenu(hamburgerBtn, dropdownMenu) {
    this.logger.debug('Closing dropdown menu', {
      operation: 'closeDropdownMenu',
      hasHamburgerBtn: !!hamburgerBtn,
      hasDropdownMenu: !!dropdownMenu
    });
    
    dropdownMenu.classList.add('hidden');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open documentation navigation menu');
  }

  /**
   * Remove all mobile navigation elements
   */
  removeMobileElements() {
    // Remove hamburger menu
    const menuContainer = document.querySelector('.docs-mobile-menu-container');
    if (menuContainer) {
      menuContainer.remove();
    }
    
    // Remove old sidebar toggle elements
    const toggleBtn = document.querySelector('.docs-toc-toggle');
    if (toggleBtn) {
      toggleBtn.remove();
    }
    
    // Remove collapsed class from TOC
    const toc = document.querySelector('.docs-toc');
    if (toc) {
      toc.classList.remove('collapsed');
    }
    
    // Remove mobile hints
    const hints = document.querySelectorAll('.mobile-nav-hint');
    hints.forEach(hint => hint.remove());
  }
  
  /**
   * Add mobile navigation hint to content
   */
  addMobileHint() {
    const content = document.querySelector('.docs-content');
    if (!content || content.querySelector('.mobile-nav-hint')) return;
    
    const hint = document.createElement('div');
    hint.className = 'mobile-nav-hint';
    hint.innerHTML = '💡 Tap the blue <strong>"📚 Documentation Pages"</strong> button above to navigate between topics';
    
    // Insert at the beginning of content
    content.insertBefore(hint, content.firstChild);
  }
  
  /**
   * Set up link handlers for auto-collapse
   */
  setupLinkHandlers(toc, toggleBtn) {
    const tocLinks = toc.querySelectorAll('a[data-doc]');
    tocLinks.forEach(link => {
      // Remove existing mobile handlers to avoid duplicates
      link.removeEventListener('click', this.handleLinkClick);
      
      // Add new handler
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= this.mobileBreakpoint) {
          setTimeout(() => {
            toc.classList.add('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', 'Show documentation page navigation');
          }, 100);
        }
        
        // Haptic feedback
        if (window.NativeFeatures) {
          window.NativeFeatures.hapticFeedback('light');
        }
      });
    });
  }
  
  /**
   * Highlight the currently active documentation page
   */
  highlightCurrentPage() {
    const toc = document.querySelector('.docs-toc');
    if (!toc) return;
    
    // Get current page from URL hash
    const hash = window.location.hash;
    const match = hash.match(/^#docs\/(\w+)/);
    const currentSlug = match ? match[1] : 'intro';
    
    // Remove active class from all links
    toc.querySelectorAll('a[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentLink = toc.querySelector(`a[data-doc="${currentSlug}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
  }
  
  /**
   * Update navigation when docs content changes
   */
  onDocsOpen() {
    this.logger.info('Docs opened, setting up navigation', {
      operation: 'onDocsOpen',
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth <= this.mobileBreakpoint
    });
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.setupDocsNavigation();
    }, 100);
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
   * Get the status of the mobile docs nav manager
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mobileBreakpoint: this.mobileBreakpoint,
      isMobile: window.innerWidth <= this.mobileBreakpoint,
      hasPeriodicCheck: !!this.periodicCheckInterval,
      tocFound: !!document.querySelector('.docs-toc'),
      drawerFound: !!document.querySelector('.docs-drawer')
    };
  }
  
  /**
   * Check if mobile docs nav manager is ready
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
    
    this.removeMobileElements();
    
    globalEventBus.off('docs:opened', this.onDocsOpen);
    
    this.initialized = false;
    this.logger.info('Cleaned up resources', {
      operation: 'cleanup',
      initialized: false,
      hasPeriodicCheck: !!this.periodicCheckInterval
    });
  }
}

// Export singleton instance
export const mobileDocsNavManager = () => {
  console.warn('mobileDocsNavManager: Legacy function called. Use DI container to get MobileDocsNavManager instance.');
  throw new Error('Legacy function not available. Use DI container to get MobileDocsNavManager instance.');
};

// Global exposure handled by consolidated legacy compatibility system
// See ApplicationBootstrap.setupLegacyCompatibility() for details
