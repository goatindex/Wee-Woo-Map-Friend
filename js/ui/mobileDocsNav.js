/**
 * @module ui/mobileDocsNav
 * Mobile-friendly documentation navigation
 */

// Immediate execution test
console.log('🔥 MobileDocsNav script loaded successfully!');

window.MobileDocsNav = {
  
  /**
   * Initialize mobile documentation navigation
   */
  init() {
    console.log('🚀 MobileDocsNav: Initializing mobile documentation navigation');
    console.log('🔍 MobileDocsNav: Window width:', window.innerWidth);
    console.log('🔍 MobileDocsNav: Is mobile:', window.innerWidth <= 720);
    
    // Immediate test - try to find docs elements
    const toc = document.querySelector('.docs-toc');
    const drawer = document.querySelector('.docs-drawer');
    console.log('🔍 MobileDocsNav: TOC found:', !!toc);
    console.log('🔍 MobileDocsNav: Drawer found:', !!drawer);
    
    // Set up navigation when docs are opened
    this.setupDocsNavigation();
    
    // Listen for window resize to adapt navigation
    window.addEventListener('resize', debounce(() => {
      console.log('🔄 MobileDocsNav: Window resized to:', window.innerWidth);
      this.setupDocsNavigation();
    }, 250));
    
    // Also try setting up navigation periodically (in case docs open later)
    setInterval(() => {
      const docsVisible = !document.querySelector('.docs-drawer[hidden]');
      if (docsVisible && window.innerWidth <= 720) {
        console.log('🔄 MobileDocsNav: Periodic check - docs are visible');
        this.setupDocsNavigation();
      }
    }, 2000);
  },
  
  /**
   * Set up mobile-friendly documentation navigation
   */
  setupDocsNavigation() {
    console.log('📱 MobileDocsNav: Setting up navigation');
    console.log('🔍 MobileDocsNav: Window width:', window.innerWidth);
    
    // Create immediate test element
    this.createTestElement();
    
    const toc = document.querySelector('.docs-toc');
    console.log('🔍 MobileDocsNav: Found TOC:', !!toc);
    
    if (!toc) {
      console.log('❌ MobileDocsNav: No TOC found, cannot proceed');
      return;
    }
    
    const isMobile = window.innerWidth <= 720;
    console.log('🔍 MobileDocsNav: Is mobile:', isMobile, 'Width:', window.innerWidth);
    
    if (!isMobile) {
      console.log('❌ MobileDocsNav: Not mobile, removing mobile elements');
      // Remove mobile elements on desktop
      this.removeMobileElements();
      return;
    }
    
    console.log('✅ MobileDocsNav: Mobile detected, adding navigation');
    // Add mobile navigation elements
    this.addMobileNavigation(toc);
  },

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
    console.log('🔴 MobileDocsNav: Test element created');
    
    // Remove test element after 5 seconds
    setTimeout(() => {
      if (testEl.parentNode) {
        testEl.remove();
        console.log('🔴 MobileDocsNav: Test element removed');
      }
    }, 5000);
  },
  
  /**
   * Add mobile navigation elements - hamburger menu style
   */
  addMobileNavigation(toc) {
    console.log('📱 MobileDocsNav: Adding hamburger menu navigation');
    
    // Remove any existing mobile navigation
    this.removeMobileElements();
    
    // Find the docs content area and page title
    const docsContent = document.querySelector('.docs-content');
    const pageTitle = docsContent ? docsContent.querySelector('h1') : null;
    
    if (!pageTitle) {
      console.log('❌ MobileDocsNav: No page title found, cannot add hamburger menu');
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
    
    console.log('🔗 MobileDocsNav: Found', tocLinks.length, 'navigation links');
    
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
    
    console.log('✅ MobileDocsNav: Hamburger menu created successfully');
  },
  
  /**
   * Set up hamburger button event handlers
   */
  setupHamburgerHandlers(hamburgerBtn, dropdownMenu) {
    console.log('🔧 MobileDocsNav: Setting up hamburger handlers');
    
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
  },

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
  },

  /**
   * Open dropdown menu
   */
  openDropdownMenu(hamburgerBtn, dropdownMenu) {
    console.log('📂 MobileDocsNav: Opening dropdown menu');
    
    dropdownMenu.classList.remove('hidden');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close documentation navigation menu');
    
    // Haptic feedback
    if (window.NativeFeatures) {
      window.NativeFeatures.hapticFeedback('light');
    }
  },

  /**
   * Close dropdown menu
   */
  closeDropdownMenu(hamburgerBtn, dropdownMenu) {
    console.log('📁 MobileDocsNav: Closing dropdown menu');
    
    dropdownMenu.classList.add('hidden');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open documentation navigation menu');
  },

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
  },
  
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
  },
  
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
        if (window.innerWidth <= 720) {
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
  },
  
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
  },
  
  /**
   * Update navigation when docs content changes
   */
  onDocsOpen() {
    console.log('MobileDocsNav: Docs opened, setting up navigation');
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.setupDocsNavigation();
    }, 100);
  }
};

// Utility function for debouncing
function debounce(func, wait) {
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MobileDocsNav.init();
  });
} else {
  window.MobileDocsNav.init();
}

// Listen for docs opening events
window.addEventListener('docs-opened', () => {
  window.MobileDocsNav.onDocsOpen();
});
