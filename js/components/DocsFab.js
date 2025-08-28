/**
 * @fileoverview DocsFab - Floating Action Button for Documentation Navigation
 * @description Material Design-style FAB that replaces sidebar navigation with expandable menu
 * @module components/DocsFab
 */

/**
 * Floating Action Button for documentation navigation
 * Provides space-efficient alternative to sidebar navigation
 */
class DocsFab {
  constructor(container) {
    this.container = container;
    this.isExpanded = false;
    this.fabButton = null;
    this.fabMenu = null;
    this.backdrop = null;
    this.menuItems = [];
    
    // Documentation topics configuration
    this.topics = [
      { id: 'intro', label: 'Welcome', icon: '👋' },
      { id: 'usage', label: 'Usage', icon: '📖' },
      { id: 'adding-layers', label: 'Adding Layers', icon: '➕' },
      { id: 'layers', label: 'Layers & Categories', icon: '🗂️' },
      { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' }
    ];
    
    this.init();
  }

  /**
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - FAB configuration options
   * @param {Array} [options.menuItems] - Navigation menu items
   * @param {string} [options.position='bottom-right'] - FAB position
   * @param {boolean} [options.enableAnimations=true] - Enable animations
   * @param {boolean} [options.enableAccessibility=true] - Enable accessibility features
   */
  constructor(container, options = {}) {
    super(container, options);
    
    this.name = 'DocsFab';
    
    // Configuration
    this.menuItems = options.menuItems || [
      { id: 'intro', label: 'Welcome', icon: '👋' },
      { id: 'usage', label: 'Using the App', icon: '📱' },
      { id: 'adding-layers', label: 'Adding Layers', icon: '📍' },
      { id: 'layers', label: 'Layers & Categories', icon: '🗂️' },
      { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' }
    ];
    this.position = options.position || 'bottom-right';
    this.enableAnimations = options.enableAnimations !== false;
    this.enableAccessibility = options.enableAccessibility !== false;
    
    // State
    this.isOpen = false;
    this.isInitialized = false;
    this.activeMenuItem = null;
    
    // Elements
    this.fabButton = null;
    this.fabMenu = null;
    this.backdrop = null;
    
    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
  }

  /**
   * Initialize the FAB component
   */
  async init() {
    if (this.isInitialized) {
      this.warn('DocsFab already initialized');
      return;
    }

    try {
      this.log('Initializing DocsFab');
      
      // Create FAB structure
      this.createFabStructure();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Apply initial styling
      this.applyInitialStyling();
      
      // Set up accessibility
      if (this.enableAccessibility) {
        this.setupAccessibility();
      }
      
      this.isInitialized = true;
      this.log('DocsFab initialized successfully');
      
      // Emit initialization event
      this.emit('fab:initialized', { component: this });
      
    } catch (error) {
      this.error('Failed to initialize DocsFab:', error);
      throw error;
    }
  }

  /**
   * Create the FAB HTML structure
   */
  createFabStructure() {
    // Create backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'docs-fab-backdrop';
    this.backdrop.style.display = 'none';
    
    // Create main FAB button
    this.fabButton = document.createElement('button');
    this.fabButton.className = 'docs-fab-button';
    this.fabButton.innerHTML = `
      <span class="docs-fab-icon">📚</span>
      <span class="docs-fab-label">Documentation</span>
    `;
    
    // Create expandable menu
    this.fabMenu = document.createElement('div');
    this.fabMenu.className = 'docs-fab-menu';
    this.fabMenu.innerHTML = this.createMenuHTML();
    
    // Create container
    const fabContainer = document.createElement('div');
    fabContainer.className = `docs-fab-container docs-fab-${this.position}`;
    fabContainer.appendChild(this.backdrop);
    fabContainer.appendChild(this.fabButton);
    fabContainer.appendChild(this.fabMenu);
    
    // Add to DOM
    this.container.appendChild(fabContainer);
    
    this.log('FAB structure created');
  }

  /**
   * Create menu HTML content
   */
  createMenuHTML() {
    const menuItemsHTML = this.menuItems.map(item => `
      <li class="docs-fab-menu-item" data-doc="${item.id}">
        <button class="docs-fab-menu-button" data-doc="${item.id}">
          <span class="docs-fab-menu-icon">${item.icon}</span>
          <span class="docs-fab-menu-label">${item.label}</span>
        </button>
      </li>
    `).join('');

    return `
      <ul class="docs-fab-menu-list" role="menu">
        ${menuItemsHTML}
      </ul>
    `;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // FAB button click
    this.fabButton.addEventListener('click', this.toggle);
    
    // Backdrop click
    this.backdrop.addEventListener('click', this.close);
    
    // Menu item clicks
    const menuButtons = this.fabMenu.querySelectorAll('.docs-fab-menu-button');
    menuButtons.forEach(button => {
      button.addEventListener('click', this.handleMenuItemClick);
    });
    
    // Global events
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('click', this.handleClickOutside);
    
    // Window resize
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.updateMenuPosition();
      }
    });
    
    this.log('Event listeners set up');
  }

  /**
   * Apply initial styling
   */
  applyInitialStyling() {
    // Initial menu state
    this.fabMenu.style.transform = 'scale(0) translateY(10px)';
    this.fabMenu.style.opacity = '0';
    this.fabMenu.style.visibility = 'hidden';
    
    if (this.enableAnimations) {
      this.fabButton.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
      this.fabMenu.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
      this.backdrop.style.transition = 'opacity 0.2s ease';
    }
  }

  /**
   * Set up accessibility features
   */
  setupAccessibility() {
    // FAB button accessibility
    this.fabButton.setAttribute('aria-label', 'Documentation navigation menu');
    this.fabButton.setAttribute('aria-expanded', 'false');
    this.fabButton.setAttribute('aria-haspopup', 'menu');
    
    // Menu accessibility
    this.fabMenu.setAttribute('role', 'menu');
    this.fabMenu.setAttribute('aria-label', 'Documentation pages');
    
    // Menu items accessibility
    const menuButtons = this.fabMenu.querySelectorAll('.docs-fab-menu-button');
    menuButtons.forEach((button, index) => {
      button.setAttribute('role', 'menuitem');
      button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    
    this.log('Accessibility features set up');
  }

  /**
   * Toggle FAB menu open/closed
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open FAB menu
   */
  open() {
    if (this.isOpen) return;
    
    this.log('Opening FAB menu');
    
    // Show backdrop
    this.backdrop.style.display = 'block';
    
    // Update button state
    this.fabButton.setAttribute('aria-expanded', 'true');
    this.fabButton.classList.add('docs-fab-open');
    
    // Show and animate menu
    this.fabMenu.style.visibility = 'visible';
    
    if (this.enableAnimations) {
      // Trigger animation
      requestAnimationFrame(() => {
        this.backdrop.style.opacity = '1';
        this.fabMenu.style.transform = 'scale(1) translateY(0)';
        this.fabMenu.style.opacity = '1';
        this.fabButton.style.transform = 'rotate(45deg)';
      });
    } else {
      this.backdrop.style.opacity = '1';
      this.fabMenu.style.transform = 'scale(1) translateY(0)';
      this.fabMenu.style.opacity = '1';
    }
    
    this.isOpen = true;
    
    // Focus first menu item
    const firstMenuItem = this.fabMenu.querySelector('.docs-fab-menu-button');
    if (firstMenuItem) {
      firstMenuItem.focus();
    }
    
    // Haptic feedback
    if (window.NativeFeatures) {
      window.NativeFeatures.hapticFeedback('light');
    }
    
    this.emit('fab:opened');
  }

  /**
   * Close FAB menu
   */
  close() {
    if (!this.isOpen) return;
    
    this.log('Closing FAB menu');
    
    // Update button state
    this.fabButton.setAttribute('aria-expanded', 'false');
    this.fabButton.classList.remove('docs-fab-open');
    
    if (this.enableAnimations) {
      // Animate out
      this.backdrop.style.opacity = '0';
      this.fabMenu.style.transform = 'scale(0) translateY(10px)';
      this.fabMenu.style.opacity = '0';
      this.fabButton.style.transform = 'rotate(0deg)';
      
      // Hide after animation
      setTimeout(() => {
        this.backdrop.style.display = 'none';
        this.fabMenu.style.visibility = 'hidden';
      }, 200);
    } else {
      this.backdrop.style.display = 'none';
      this.backdrop.style.opacity = '0';
      this.fabMenu.style.visibility = 'hidden';
      this.fabMenu.style.transform = 'scale(0) translateY(10px)';
      this.fabMenu.style.opacity = '0';
    }
    
    this.isOpen = false;
    
    // Return focus to FAB button
    this.fabButton.focus();
    
    this.emit('fab:closed');
  }

  /**
   * Handle menu item clicks
   */
  handleMenuItemClick(event) {
    const button = event.currentTarget;
    const docId = button.getAttribute('data-doc');
    
    if (docId) {
      this.log(`Menu item clicked: ${docId}`);
      
      // Update active state
      this.setActiveMenuItem(docId);
      
      // Close menu
      this.close();
      
      // Open documentation
      this.openDocumentation(docId);
      
      // Haptic feedback
      if (window.NativeFeatures) {
        window.NativeFeatures.hapticFeedback('light');
      }
    }
  }

  /**
   * Set active menu item
   */
  setActiveMenuItem(docId) {
    // Remove previous active state
    const prevActive = this.fabMenu.querySelector('.docs-fab-menu-button.active');
    if (prevActive) {
      prevActive.classList.remove('active');
    }
    
    // Set new active state
    const newActive = this.fabMenu.querySelector(`[data-doc="${docId}"]`);
    if (newActive) {
      newActive.classList.add('active');
      this.activeMenuItem = docId;
    }
  }

  /**
   * Open documentation page
   */
  openDocumentation(docId) {
    // Update URL hash
    history.replaceState(null, '', `#docs/${docId}`);
    
    // Emit navigation event
    this.emit('fab:navigate', { docId });
    
    // Trigger documentation opening (integrate with existing system)
    if (window.openDocs && typeof window.openDocs === 'function') {
      window.openDocs(docId);
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    if (!this.isOpen) return;
    
    const { key } = event;
    const menuButtons = Array.from(this.fabMenu.querySelectorAll('.docs-fab-menu-button'));
    const currentIndex = menuButtons.findIndex(button => button === document.activeElement);
    
    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuButtons.length - 1;
        menuButtons[prevIndex].focus();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < menuButtons.length - 1 ? currentIndex + 1 : 0;
        menuButtons[nextIndex].focus();
        break;
        
      case 'Enter':
      case ' ':
        if (document.activeElement.classList.contains('docs-fab-menu-button')) {
          event.preventDefault();
          document.activeElement.click();
        }
        break;
    }
  }

  /**
   * Handle clicks outside FAB
   */
  handleClickOutside(event) {
    if (!this.isOpen) return;
    
    const fabContainer = this.container.querySelector('.docs-fab-container');
    if (fabContainer && !fabContainer.contains(event.target)) {
      this.close();
    }
  }

  /**
   * Update menu position (for responsive behavior)
   */
  updateMenuPosition() {
    // Implement responsive positioning logic if needed
    this.log('Menu position updated');
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (!this.isInitialized) return;
    
    this.log('Destroying DocsFab');
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleClickOutside);
    
    // Remove from DOM
    const fabContainer = this.container.querySelector('.docs-fab-container');
    if (fabContainer) {
      fabContainer.remove();
    }
    
    this.isInitialized = false;
    this.emit('fab:destroyed');
  }
}

// Legacy global function for backward compatibility
window.DocsFab = DocsFab;
