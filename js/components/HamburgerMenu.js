/**
 * @module components/HamburgerMenu
 * Reusable hamburger menu component for navigation
 * Provides animated hamburger button with dropdown menu functionality
 */

import { ComponentBase } from '../modules/ComponentBase.js';

/**
 * @class HamburgerMenu
 * @extends ComponentBase
 * Animated hamburger menu component with dropdown navigation
 */
export class HamburgerMenu extends ComponentBase {
  /**
   * Static factory method to create and initialize a HamburgerMenu
   * @param {HTMLElement|string} container - Container element or selector
   * @param {HamburgerMenuOptions} options - Menu configuration options
   * @returns {Promise<HamburgerMenu>} Initialized HamburgerMenu instance
   */
  static async create(container, options = {}) {
    const menu = new HamburgerMenu(container, { ...options, autoInit: false });
    await menu.init();
    return menu;
  }

  /**
   * @param {HTMLElement|string} container - Container element or selector
   * @param {HamburgerMenuOptions} options - Menu configuration options
   */
  constructor(container, options = {}) {
    super(container, options);
    
    this.isOpen = false;
    this.menuItems = this.options.items || [];
    
    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    
    // Auto-initialize if enabled
    if (this.options.autoInit !== false) {
      this.init().catch(console.error);
    }
  }
  
  /**
   * Default options for hamburger menu
   * @returns {HamburgerMenuOptions} Default configuration
   */
  get defaultOptions() {
    return {
      ...super.defaultOptions,
      className: 'hamburger-menu',
      menuTitle: 'Navigation',
      items: [],
      closeOnSelect: true,
      animation: 'slide',
      position: 'top-right',
      buttonSize: '48px',
      iconColor: '#ffffff',
      backgroundColor: '#2196F3',
      dropdownMinWidth: '280px',
      enableKeyboard: true
    };
  }
  
  /**
   * Render the hamburger menu structure
   * @returns {Promise<void>}
   */
  async render() {
    this.container.innerHTML = `
      <div class="hamburger-menu-container" data-position="${this.options.position}">
        <button 
          class="hamburger-button" 
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="hamburger-dropdown"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <div 
          id="hamburger-dropdown"
          class="hamburger-dropdown hidden position-${this.options.position}" 
          role="menu" 
          aria-labelledby="hamburger-button"
        >
          <div class="hamburger-menu-header">
            <h3 class="hamburger-menu-title">${this.options.menuTitle}</h3>
          </div>
          <div class="hamburger-menu-items">
            ${this.renderMenuItems()}
          </div>
        </div>
      </div>
    `;
    
    // Cache DOM references
    this.button = this.find('.hamburger-button');
    this.dropdown = this.find('.hamburger-dropdown');
    this.menuContainer = this.find('.hamburger-menu-container');
    
    // Apply styles
    this.applyStyles();
  }
  
  /**
   * Render menu items HTML
   * @returns {string} Menu items HTML
   * @private
   */
  renderMenuItems() {
    return this.menuItems.map((item, index) => `
      <a 
        href="${item.href || '#'}" 
        class="hamburger-item ${item.active ? 'active' : ''}"
        data-item-id="${item.id || index}"
        role="menuitem"
        tabindex="-1"
        ${item.href ? '' : 'data-no-href="true"'}
      >
        ${item.icon ? `<span class="menu-item-icon">${item.icon}</span>` : ''}
        <span class="menu-item-text">${item.label || item.text}</span>
      </a>
    `).join('');
  }
  
  /**
   * Apply dynamic styles to the component
   * @private
   */
  applyStyles() {
    const styles = `
      .hamburger-menu-container {
        position: relative;
        display: inline-block;
      }
      
      .hamburger-button {
        width: ${this.options.buttonSize};
        height: ${this.options.buttonSize};
        background: linear-gradient(135deg, ${this.options.backgroundColor}, ${this.adjustBrightness(this.options.backgroundColor, -20)});
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        position: relative;
        z-index: 1000;
      }
      
      .hamburger-button:hover {
        background: linear-gradient(135deg, ${this.adjustBrightness(this.options.backgroundColor, -10)}, ${this.adjustBrightness(this.options.backgroundColor, -30)});
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .hamburger-button:active {
        transform: translateY(0);
      }
      
      .hamburger-line {
        width: 20px;
        height: 2px;
        background-color: ${this.options.iconColor};
        margin: 2px 0;
        transition: all 0.3s ease;
        border-radius: 1px;
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(2) {
        opacity: 0;
      }
      
      .hamburger-button[aria-expanded="true"] .hamburger-line:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
      
      .hamburger-dropdown {
        position: absolute;
        top: calc(${this.options.buttonSize} + 8px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        border: 1px solid #E0E0E0;
        min-width: ${this.options.dropdownMinWidth};
        max-width: 90vw;
        z-index: 999;
        overflow: hidden;
        animation: slideDown 0.3s ease;
      }
      
      .hamburger-menu-container[data-position="top-right"] .hamburger-dropdown {
        right: 0;
      }
      
      .hamburger-menu-container[data-position="top-left"] .hamburger-dropdown {
        left: 0;
      }
      
      .hamburger-menu-container[data-position="bottom-left"] .hamburger-dropdown {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        left: 0;
      }
      
      .hamburger-menu-container[data-position="bottom-right"] .hamburger-dropdown {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        right: 0;
      }
      
      .hamburger-menu-container[data-position="left"] .hamburger-dropdown {
        left: 0;
      }
      
      .hamburger-menu-container[data-position="right"] .hamburger-dropdown {
        right: 0;
      }
      
      .hamburger-dropdown.position-bottom-left {
        top: auto;
        bottom: calc(${this.options.buttonSize} + 8px);
        left: 0;
      }
      
      .hamburger-dropdown.hidden {
        display: none;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .hamburger-menu-header {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 16px 20px;
        border-bottom: 1px solid #E0E0E0;
      }
      
      .hamburger-menu-title {
        margin: 0;
        font-size: 1.1em;
        color: #333;
        font-weight: 600;
      }
      
      .hamburger-menu-items {
        max-height: 60vh;
        overflow-y: auto;
        padding: 8px 0;
      }
      
      .hamburger-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #333;
        text-decoration: none;
        transition: all 0.2s ease;
        border-bottom: 1px solid #f5f5f5;
        font-size: 1.1em;
      }
      
      .hamburger-item:last-child {
        border-bottom: none;
      }
      
      .hamburger-item:hover {
        background-color: #f8f9fa;
        color: ${this.options.backgroundColor};
        transform: translateX(4px);
      }
      
      .hamburger-item.active {
        background-color: ${this.adjustBrightness(this.options.backgroundColor, 90)};
        color: ${this.options.backgroundColor};
        font-weight: 600;
      }
      
      .menu-item-icon {
        margin-right: 12px;
        font-size: 1.2em;
      }
      
      .menu-item-text {
        flex: 1;
      }
    `;
    
    // Inject styles
    let styleEl = document.getElementById('hamburger-menu-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'hamburger-menu-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = styles;
  }
  
  /**
   * Attach event listeners
   */
  attachEvents() {
    if (this.button) {
      this.button.addEventListener('click', this.toggle);
    }
    
    if (this.dropdown) {
      this.dropdown.addEventListener('click', this.handleItemClick);
    }
    
    // Keyboard support on individual items
    if (this.options.enableKeyboard) {
      document.addEventListener('keydown', this.handleKeyDown);
      
      // Add keyboard listeners to each menu item
      const items = this.findAll('.hamburger-item');
      items.forEach(item => {
        item.addEventListener('keydown', this.handleKeyDown);
      });
    }
    
    // Click outside to close
    document.addEventListener('click', this.handleClickOutside);
  }
  
  /**
   * Handle menu toggle
   * @param {Event} event - Click event
   */
  toggle(event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * Open the menu
   */
  open() {
    if (this.isOpen) {
      return;
    }
    
    this.isOpen = true;
    this.button.classList.add('active');
    this.dropdown.classList.remove('hidden');
    this.dropdown.classList.add('show');
    this.button.setAttribute('aria-expanded', 'true');
    this.button.setAttribute('aria-label', 'Close navigation menu');
    
    // Focus first menu item for accessibility
    const firstItem = this.dropdown.querySelector('.hamburger-item');
    if (firstItem) {
      firstItem.focus();
    }
    
    // Haptic feedback if available
    if (this.options.hapticFeedback && window.NativeFeatures) {
      window.NativeFeatures.hapticFeedback('light');
    }
    
    this.emit('hamburger:open', this);
  }
  
  /**
   * Close the menu
   */
  close() {
    if (!this.isOpen) {
      return;
    }
    
    this.isOpen = false;
    this.button.classList.remove('active');
    this.dropdown.classList.add('hidden');
    this.dropdown.classList.remove('show');
    this.button.setAttribute('aria-expanded', 'false');
    this.button.setAttribute('aria-label', 'Open navigation menu');
    
    this.emit('hamburger:close', this);
  }
  
  /**
   * Handle clicks outside the menu
   * @param {Event} event - Click event
   * @private
   */
  handleClickOutside(event) {
    if (this.isOpen && !this.container.contains(event.target)) {
      this.close();
    }
  }
  
  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyDown(event) {
    if (!this.isOpen) {
      return;
    }
    
    switch (event.key) {
      case 'Escape':
        this.close();
        this.button.focus();
        event.preventDefault();
        break;
        
      case 'ArrowDown':
        this.focusNextItem();
        event.preventDefault();
        break;
        
      case 'ArrowUp':
        this.focusPreviousItem();
        event.preventDefault();
        break;
        
      case 'Enter':
        if (document.activeElement.classList.contains('hamburger-item')) {
          document.activeElement.click();
          event.preventDefault();
        }
        break;
    }
  }
  
  /**
   * Handle menu item clicks
   * @param {Event} event - Click event
   * @private
   */
  handleItemClick(event) {
    const item = event.target.closest('.hamburger-item');
    if (!item) {
      return;
    }
    
    const itemId = item.dataset.itemId;
    const menuItem = this.menuItems.find(mi => (mi.id || this.menuItems.indexOf(mi).toString()) === itemId);
    
    if (menuItem) {
      // Execute custom action if available
      if (menuItem.action && typeof menuItem.action === 'function') {
        event.preventDefault();
        menuItem.action(menuItem, event);
      }
      
      // Emit item selection event
      this.emit('hamburger:itemClick', { 
        item: menuItem, 
        element: item,
        hamburger: this
      });
      
      // Close menu if configured to do so
      if (this.options.closeOnSelect) {
        this.close();
      }
    }
  }
  
  /**
   * Focus next menu item
   * @private
   */
  focusNextItem() {
    const items = Array.from(this.dropdown.querySelectorAll('.hamburger-item'));
    const current = document.activeElement;
    const currentIndex = items.indexOf(current);
    const nextIndex = (currentIndex + 1) % items.length;
    items[nextIndex].focus();
  }
  
  /**
   * Focus previous menu item
   * @private
   */
  focusPreviousItem() {
    const items = Array.from(this.dropdown.querySelectorAll('.hamburger-item'));
    const current = document.activeElement;
    const currentIndex = items.indexOf(current);
    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[prevIndex].focus();
  }
  
  /**
   * Update menu items
   * @param {Array<MenuItem>} items - New menu items
   */
  updateItems(items) {
    this.menuItems = items;
    
    const itemsContainer = this.find('.hamburger-menu-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = this.renderMenuItems();
      
      // Reattach keyboard listeners to new items
      if (this.options.enableKeyboard) {
        const menuItems = this.findAll('.hamburger-item');
        menuItems.forEach(item => {
          item.addEventListener('keydown', this.handleKeyDown);
        });
      }
    }
    
    this.emit('hamburger:itemsUpdated', { items });
  }
  
  /**
   * Set active menu item
   * @param {string} itemId - ID of item to set as active
   */
  setActiveItem(itemId) {
    // Remove active class from all items
    this.findAll('.hamburger-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to specified item
    const activeItem = this.find(`[data-item-id="${itemId}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    // Update internal state
    this.menuItems.forEach(item => {
      item.active = (item.id || this.menuItems.indexOf(item).toString()) === itemId;
    });
    
    this.emit('hamburger:activeItemChanged', { itemId });
  }
  
  /**
   * Add a new menu item
   * @param {Object} item - Menu item to add
   */
  addItem(item) {
    this.menuItems.push(item);
    this.updateItems(this.menuItems);
  }
  
  /**
   * Remove menu item by index
   * @param {number} index - Index of item to remove
   */
  removeItem(index) {
    if (index >= 0 && index < this.menuItems.length) {
      this.menuItems.splice(index, 1);
      this.updateItems(this.menuItems);
    }
  }
  
  /**
   * Clear all menu items
   */
  clearItems() {
    this.menuItems = [];
    this.options.items = [];
    this.updateItems(this.menuItems);
  }
  
  /**
   * Utility function to adjust color brightness
   * @param {string} color - Hex color
   * @param {number} percent - Brightness adjustment percentage
   * @returns {string} Adjusted color
   * @private
   */
  adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // Close menu if open
    this.close();
    
    // Call parent destroy
    super.destroy();
  }
}
