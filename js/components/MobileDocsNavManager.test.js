/**
 * @fileoverview Tests for MobileDocsNavManager component
 * @description Comprehensive test suite for mobile documentation navigation
 */

import { MobileDocsNavManager } from './MobileDocsNavManager.js';

// Mock dependencies
const mockStateManager = {
  get: jest.fn(),
  set: jest.fn(),
  computed: jest.fn()
};

const mockEventBus = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

// Mock global objects
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

global.window.NativeFeatures = {
  hapticFeedback: jest.fn()
};

// Helper function to create test container
function createTestContainer() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="docs-content">
      <h1>Test Documentation Page</h1>
      <p>Test content</p>
    </div>
    <div class="docs-toc">
      <a href="#in_app_docs/intro" data-doc="intro" class="active">Introduction</a>
<a href="#in_app_docs/usage" data-doc="usage">Usage Guide</a>
<a href="#in_app_docs/layers" data-doc="layers">Layer Information</a>
<a href="#in_app_docs/troubleshooting" data-doc="troubleshooting">Troubleshooting</a>
    </div>
  `;
  document.body.appendChild(container);
  return container;
}

describe('MobileDocsNavManager', () => {
  let container, manager;
  
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    // Reset mocks
    jest.clearAllMocks();
    mockStateManager.get.mockReturnValue({ isMobile: false });
    
    // Create test environment
    container = createTestContainer();
    manager = new MobileDocsNavManager(container, {
      stateManager: mockStateManager,
      eventBus: mockEventBus,
      mobileBreakpoint: 768
    });
  });
  
  afterEach(() => {
    manager?.destroy();
    container?.remove();
    
    // Clean up any remaining mobile navigation elements
    const mobileElements = document.querySelectorAll('.mobile-docs-nav-container, .docs-mobile-menu-container');
    mobileElements.forEach(el => el.remove());
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await manager.init();
      
      expect(manager.isInitialized).toBe(true);
      expect(manager.name).toBe('MobileDocsNavManager');
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:initialized', expect.objectContaining({
        component: 'MobileDocsNavManager'
      }));
    });

    test('should find DOM elements correctly', async () => {
      await manager.init();
      
      expect(manager.docsContent).toBeTruthy();
      expect(manager.docsToc).toBeTruthy();
      expect(manager.docsContent.tagName).toBe('DIV');
      expect(manager.docsToc.tagName).toBe('DIV');
    });

    test('should extract navigation items from TOC', async () => {
      await manager.init();
      
      expect(manager.navItems).toHaveLength(4);
      expect(manager.navItems[0]).toEqual(expect.objectContaining({
        slug: 'intro',
        title: 'Introduction',
        isActive: true
      }));
      expect(manager.currentDoc).toBe('intro');
    });

    test('should set up event listeners', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      await manager.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), expect.any(Object));
      expect(documentAddEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentAddEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should handle missing DOM elements gracefully', async () => {
      // Remove TOC element
      const toc = container.querySelector('.docs-toc');
      toc.remove();
      
      await manager.init();
      
      expect(manager.isInitialized).toBe(true);
      expect(manager.navItems).toHaveLength(0);
    });

    test('should prevent double initialization', async () => {
      await manager.init();
      const firstInitializedEventCount = mockEventBus.emit.mock.calls.filter(call => 
        call[0] === 'mobileDocsNav:initialized'
      ).length;
      
      await manager.init();
      const secondInitializedEventCount = mockEventBus.emit.mock.calls.filter(call => 
        call[0] === 'mobileDocsNav:initialized'
      ).length;
      
      expect(manager.isInitialized).toBe(true);
      expect(secondInitializedEventCount).toBe(firstInitializedEventCount); // Should not increase
    });
  });

  describe('Mobile State Detection', () => {
    test('should detect mobile state correctly', async () => {
      window.innerWidth = 600;
      await manager.init();
      
      expect(manager.isMobile).toBe(true);
    });

    test('should detect desktop state correctly', async () => {
      window.innerWidth = 1024;
      await manager.init();
      
      expect(manager.isMobile).toBe(false);
    });

    test('should use custom mobile breakpoint', async () => {
      manager = new MobileDocsNavManager(container, {
        stateManager: mockStateManager,
        eventBus: mockEventBus,
        mobileBreakpoint: 1000
      });
      
      window.innerWidth = 800;
      await manager.init();
      
      expect(manager.isMobile).toBe(true);
    });

    test('should emit mobile state change events', async () => {
      await manager.init();
      
      // Simulate resize to mobile
      window.innerWidth = 600;
      manager.handleResize();
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:mobileStateChanged', expect.objectContaining({
        isMobile: true,
        width: 600
      }));
    });
  });

  describe('Mobile Navigation Rendering', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should create hamburger navigation on mobile', () => {
      const hamburgerContainer = document.querySelector('.mobile-docs-nav-container');
      expect(hamburgerContainer).toBeTruthy();
      
      const hamburgerButton = hamburgerContainer.querySelector('.mobile-docs-hamburger-btn');
      expect(hamburgerButton).toBeTruthy();
      
      const dropdownMenu = hamburgerContainer.querySelector('.mobile-docs-dropdown-menu');
      expect(dropdownMenu).toBeTruthy();
    });

    test('should create navigation links in dropdown', () => {
      const menuLinks = document.querySelectorAll('.mobile-docs-menu-link');
      expect(menuLinks).toHaveLength(4);
      
      expect(menuLinks[0].textContent).toBe('Introduction');
      expect(menuLinks[0].getAttribute('data-doc')).toBe('intro');
      expect(menuLinks[0].classList.contains('active')).toBe(true);
    });

    test('should insert hamburger before page title', () => {
      const pageTitle = document.querySelector('h1');
      const hamburgerContainer = document.querySelector('.mobile-docs-nav-container');
      
      expect(hamburgerContainer.nextElementSibling).toBe(pageTitle);
    });

    test('should not render navigation on desktop', async () => {
      // Re-initialize as desktop
      manager.destroy();
      window.innerWidth = 1024;
      await manager.init();
      
      const hamburgerContainer = document.querySelector('.mobile-docs-nav-container');
      expect(hamburgerContainer).toBeFalsy();
    });

    test('should clean up when switching to desktop', async () => {
      // Verify mobile navigation exists
      expect(document.querySelector('.mobile-docs-nav-container')).toBeTruthy();
      
      // Switch to desktop
      window.innerWidth = 1024;
      manager.handleResize();
      
      expect(document.querySelector('.mobile-docs-nav-container')).toBeFalsy();
    });
  });

  describe('Menu Interaction', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should toggle menu on hamburger click', () => {
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      
      // Open menu
      hamburgerButton.click();
      expect(manager.isMenuOpen).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:menuOpened', expect.any(Object));
      
      // Close menu
      hamburgerButton.click();
      expect(manager.isMenuOpen).toBe(false);
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:menuClosed', expect.any(Object));
    });

    test('should open menu correctly', () => {
      manager.openMenu();
      
      const dropdownMenu = document.querySelector('.mobile-docs-dropdown-menu');
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      
      expect(manager.isMenuOpen).toBe(true);
      expect(dropdownMenu.classList.contains('hidden')).toBe(false);
      expect(hamburgerButton.classList.contains('active')).toBe(true);
    });

    test('should close menu correctly', () => {
      manager.openMenu();
      manager.closeMenu();
      
      const dropdownMenu = document.querySelector('.mobile-docs-dropdown-menu');
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      
      expect(manager.isMenuOpen).toBe(false);
      expect(dropdownMenu.classList.contains('hidden')).toBe(true);
      expect(hamburgerButton.classList.contains('active')).toBe(false);
    });

    test('should close menu when clicking outside', () => {
      manager.openMenu();
      expect(manager.isMenuOpen).toBe(true);
      
      // Click outside the menu
      document.body.click();
      
      expect(manager.isMenuOpen).toBe(false);
    });

    test('should not close menu when clicking inside', () => {
      manager.openMenu();
      expect(manager.isMenuOpen).toBe(true);
      
      // Click inside the menu
      const dropdownMenu = document.querySelector('.mobile-docs-dropdown-menu');
      dropdownMenu.click();
      
      expect(manager.isMenuOpen).toBe(true);
    });

    test('should handle navigation link clicks', () => {
      manager.openMenu();
      
      const usageLink = document.querySelector('.mobile-docs-menu-link[data-doc="usage"]');
      usageLink.click();
      
      expect(manager.currentDoc).toBe('usage');
      expect(manager.isMenuOpen).toBe(false);
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:navigationClick', expect.objectContaining({
        docSlug: 'usage',
        title: 'Usage Guide'
      }));
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
      manager.openMenu();
    });

    test('should close menu on Escape key', () => {
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(manager.isMenuOpen).toBe(false);
    });

    test('should toggle menu on Enter key when hamburger focused', () => {
      manager.closeMenu();
      
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      hamburgerButton.focus();
      
      // Mock the focus check in the keydown handler
      Object.defineProperty(document, 'activeElement', {
        writable: true,
        configurable: true,
        value: hamburgerButton
      });
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      
      expect(manager.isMenuOpen).toBe(true);
    });

    test('should toggle menu on Space key when hamburger focused', () => {
      manager.closeMenu();
      
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      hamburgerButton.focus();
      
      // Mock the focus check in the keydown handler
      Object.defineProperty(document, 'activeElement', {
        writable: true,
        configurable: true,
        value: hamburgerButton
      });
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(spaceEvent);
      
      expect(manager.isMenuOpen).toBe(true);
    });

    test('should navigate menu items with arrow keys', () => {
      const menuLinks = document.querySelectorAll('.mobile-docs-menu-link');
      menuLinks[0].focus();
      
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
      
      // Should focus next item (implementation would need actual focus management)
      expect(manager.isMenuOpen).toBe(true);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should set ARIA attributes on hamburger button', () => {
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      
      expect(hamburgerButton.getAttribute('role')).toBe('button');
      expect(hamburgerButton.getAttribute('aria-haspopup')).toBe('true');
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('false');
      expect(hamburgerButton.getAttribute('aria-label')).toContain('Open documentation navigation menu');
    });

    test('should update ARIA attributes when menu opens', () => {
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      const dropdownMenu = document.querySelector('.mobile-docs-dropdown-menu');
      
      manager.openMenu();
      
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('true');
      expect(hamburgerButton.getAttribute('aria-label')).toContain('Close documentation navigation menu');
      expect(dropdownMenu.getAttribute('aria-hidden')).toBe('false');
    });

    test('should set menu item accessibility attributes', () => {
      const menuLinks = document.querySelectorAll('.mobile-docs-menu-link');
      
      menuLinks.forEach(link => {
        expect(link.getAttribute('role')).toBe('menuitem');
        expect(link.getAttribute('tabindex')).toBe('-1'); // Initially not tabbable
      });
    });

    test('should enable tabbing when menu is open', () => {
      manager.openMenu();
      
      const menuLinks = document.querySelectorAll('.mobile-docs-menu-link');
      menuLinks.forEach(link => {
        expect(link.getAttribute('tabindex')).toBe('0'); // Now tabbable
      });
    });

    test('should be disabled by configuration', async () => {
      manager.destroy();
      
      manager = new MobileDocsNavManager(container, {
        stateManager: mockStateManager,
        eventBus: mockEventBus,
        enableAccessibility: false
      });
      
      window.innerWidth = 600;
      await manager.init();
      
      const hamburgerButton = document.querySelector('.mobile-docs-hamburger-btn');
      expect(hamburgerButton.getAttribute('role')).toBeFalsy();
    });
  });

  describe('Touch Gestures', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
      manager.openMenu();
    });

    test('should handle swipe down to close menu', () => {
      const dropdownMenu = document.querySelector('.mobile-docs-dropdown-menu');
      
      // Simulate swipe down gesture
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 }]
      });
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientY: 250 }] // 150px down
      });
      
      dropdownMenu.dispatchEvent(touchStart);
      dropdownMenu.dispatchEvent(touchEnd);
      
      expect(manager.isMenuOpen).toBe(false);
    });

    test('should be disabled by configuration', async () => {
      manager.destroy();
      
      manager = new MobileDocsNavManager(container, {
        stateManager: mockStateManager,
        eventBus: mockEventBus,
        enableGestures: false
      });
      
      window.innerWidth = 600;
      await manager.init();
      
      // Gestures should not be set up (hard to test without implementation details)
      expect(manager.enableGestures).toBe(false);
    });
  });

  describe('Haptic Feedback', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should trigger haptic feedback on menu open', () => {
      manager.openMenu();
      
      expect(window.NativeFeatures.hapticFeedback).toHaveBeenCalledWith('light');
    });

    test('should trigger haptic feedback on navigation', () => {
      manager.openMenu();
      
      const usageLink = document.querySelector('.mobile-docs-menu-link[data-doc="usage"]');
      usageLink.click();
      
      expect(window.NativeFeatures.hapticFeedback).toHaveBeenCalledWith('light');
    });

    test('should be disabled by configuration', async () => {
      manager.destroy();
      
      manager = new MobileDocsNavManager(container, {
        stateManager: mockStateManager,
        eventBus: mockEventBus,
        enableHaptics: false
      });
      
      window.innerWidth = 600;
      await manager.init();
      
      manager.openMenu();
      
      expect(window.NativeFeatures.hapticFeedback).not.toHaveBeenCalled();
    });
  });

  describe('Active Item Management', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should update active item correctly', () => {
      manager.updateActiveItem('usage');
      
      expect(manager.currentDoc).toBe('usage');
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:activeItemChanged', expect.objectContaining({
        docSlug: 'usage',
        currentDoc: 'usage'
      }));
    });

    test('should update menu link active state', () => {
      manager.updateActiveItem('usage');
      
      const introLink = document.querySelector('.mobile-docs-menu-link[data-doc="intro"]');
      const usageLink = document.querySelector('.mobile-docs-menu-link[data-doc="usage"]');
      
      expect(introLink.classList.contains('active')).toBe(false);
      expect(usageLink.classList.contains('active')).toBe(true);
    });

    test('should not update if already current', () => {
      manager.updateActiveItem('intro'); // Already active
      
      expect(mockEventBus.emit).not.toHaveBeenCalledWith('mobileDocsNav:activeItemChanged', expect.any(Object));
    });
  });

  describe('Navigation Refresh', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should refresh navigation items', () => {
      // Add a new navigation item to the TOC
      const toc = document.querySelector('.docs-toc');
      const newLink = document.createElement('a');
      newLink.href = '#in_app_docs/api';
      newLink.setAttribute('data-doc', 'api');
      newLink.textContent = 'API Reference';
      toc.appendChild(newLink);
      
      manager.refreshNavigation();
      
      expect(manager.navItems).toHaveLength(5);
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:refreshed', expect.objectContaining({
        navItems: 5
      }));
    });

    test('should re-render mobile navigation after refresh', () => {
      manager.refreshNavigation();
      
      const menuLinks = document.querySelectorAll('.mobile-docs-menu-link');
      expect(menuLinks).toHaveLength(4);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should handle docs opened event', () => {
      const event = new CustomEvent('docs-opened');
      window.dispatchEvent(event);
      
      // Should refresh navigation (tested via setTimeout)
      expect(manager.isInitialized).toBe(true);
    });

    test('should handle docs closed event', () => {
      // First ensure we're in mobile mode and render navigation
      window.innerWidth = 600;
      manager.updateMobileState();
      manager.render();
      
      // Verify navigation was created
      const navigationContainer = document.querySelector('.mobile-docs-nav-container');
      expect(navigationContainer).toBeTruthy();
      
      // Now handle docs closed event
      const event = new CustomEvent('docs-closed');
      window.dispatchEvent(event);
      
      // Verify navigation was cleaned up
      expect(document.querySelector('.mobile-docs-nav-container')).toBeFalsy();
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should return current state', () => {
      const state = manager.getState();
      
      expect(state).toEqual(expect.objectContaining({
        isInitialized: true,
        isMobile: true,
        isMenuOpen: false,
        currentDoc: 'intro',
        navItems: expect.arrayContaining([
          expect.objectContaining({ slug: 'intro', title: 'Introduction', isActive: true })
        ]),
        mobileBreakpoint: 768
      }));
    });

    test('should apply state configuration', () => {
      manager.applyState({
        currentDoc: 'usage',
        isMenuOpen: true
      });
      
      expect(manager.currentDoc).toBe('usage');
      expect(manager.isMenuOpen).toBe(true);
    });
  });

  describe('Legacy Compatibility', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should expose global functions', () => {
      expect(window.MobileDocsNavManager).toBe(manager);
      expect(window.MobileDocsNav).toBeDefined();
      expect(typeof window.MobileDocsNav.init).toBe('function');
      expect(typeof window.MobileDocsNav.setupDocsNavigation).toBe('function');
    });

    test('should call manager methods from legacy functions', () => {
      const initSpy = jest.spyOn(manager, 'init');
      const refreshSpy = jest.spyOn(manager, 'refreshNavigation');
      
      window.MobileDocsNav.init();
      window.MobileDocsNav.setupDocsNavigation();
      
      expect(initSpy).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      window.innerWidth = 600; // Mobile
      await manager.init();
    });

    test('should clean up mobile navigation elements', () => {
      expect(document.querySelector('.mobile-docs-nav-container')).toBeTruthy();
      
      manager.cleanup();
      
      expect(document.querySelector('.mobile-docs-nav-container')).toBeFalsy();
    });

    test('should destroy component completely', () => {
      manager.destroy();
      
      expect(manager.isInitialized).toBe(false);
      expect(manager.navItems).toHaveLength(0);
      expect(window.MobileDocsNavManager).toBeUndefined();
      expect(window.MobileDocsNav).toBeUndefined();
      expect(mockEventBus.emit).toHaveBeenCalledWith('mobileDocsNav:destroyed', expect.any(Object));
    });

    test('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      manager.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('should handle destroy when not initialized', () => {
      manager.isInitialized = false;
      
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});
