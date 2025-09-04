/**
 * @fileoverview Tests for SidebarToggleFAB component
 */

import { SidebarToggleFAB } from './SidebarToggleFAB.js';

// Mock BaseFAB
jest.mock('./BaseFAB.js', () => ({
  BaseFAB: class MockBaseFAB {
    constructor(config) {
      this.config = config;
      this.id = config.id;
      this.isInitialized = false;
      this.logger = {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
    }
    
    async init() {
      return Promise.resolve();
    }
    
    destroy() {}
    
    saveState() {}
    
    loadState() {}
    
    getState() {
      return {
        id: this.id,
        isInitialized: this.isInitialized,
        config: this.config,
        buttonExists: !!this.button,
        eventListenerCount: 0
      };
    }
  }
}));

// Mock FABManager
jest.mock('./FABManager.js', () => ({
  fabManager: {
    register: jest.fn()
  }
}));

describe('SidebarToggleFAB', () => {
  let sidebarFab;
  let mockSidebarMenu;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock sidebar menu element
    mockSidebarMenu = {
      classList: {
        toggle: jest.fn(),
        add: jest.fn(),
        remove: jest.fn()
      },
      inert: false
    };
    
    // Mock document.getElementById
    document.getElementById = jest.fn().mockReturnValue(mockSidebarMenu);
    
    // Mock getComputedStyle
    window.getComputedStyle = jest.fn().mockReturnValue({
      getPropertyValue: jest.fn().mockReturnValue('768px')
    });
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024
    });
    
    // Mock document.dispatchEvent
    document.dispatchEvent = jest.fn();
    
    sidebarFab = new SidebarToggleFAB();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create instance with correct default config', () => {
      expect(sidebarFab.config.id).toBe('sidebarToggle');
      expect(sidebarFab.config.className).toBe('fab fab-button');
      expect(sidebarFab.config.icon).toBe('☰');
      expect(sidebarFab.config.ariaLabel).toBe('Toggle sidebar');
      expect(sidebarFab.config.ariaControls).toBe('layerMenu');
      expect(sidebarFab.config.ariaExpanded).toBe('true');
      expect(sidebarFab.config.title).toBe('Hide panel');
    });

    test('should initialize with correct default state', () => {
      expect(sidebarFab.sidebarMenu).toBeNull();
      expect(sidebarFab.isMinimized).toBe(false);
    });
  });

  describe('init', () => {
    test('should initialize and find sidebar menu', async () => {
      await sidebarFab.init();
      
      expect(document.getElementById).toHaveBeenCalledWith('layerMenu');
      expect(sidebarFab.sidebarMenu).toBe(mockSidebarMenu);
    });

    test('should handle missing sidebar menu gracefully', async () => {
      document.getElementById.mockReturnValue(null);
      
      await sidebarFab.init();
      
      expect(sidebarFab.sidebarMenu).toBeNull();
    });

    test('should restore state after initialization', async () => {
      const restoreStateSpy = jest.spyOn(sidebarFab, 'restoreState');
      
      await sidebarFab.init();
      
      expect(restoreStateSpy).toHaveBeenCalled();
    });
  });

  describe('onClick', () => {
    test('should toggle sidebar when menu exists', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      mockSidebarMenu.classList.toggle.mockReturnValue(true);
      
      sidebarFab.onClick({ type: 'click' });
      
      expect(mockSidebarMenu.classList.toggle).toHaveBeenCalledWith('sidebar-minimized');
      expect(sidebarFab.isMinimized).toBe(true);
    });

    test('should not toggle when menu does not exist', () => {
      sidebarFab.sidebarMenu = null;
      
      sidebarFab.onClick({ type: 'click' });
      
      expect(mockSidebarMenu.classList.toggle).not.toHaveBeenCalled();
    });

    test('should update button state after toggle', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.button = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn().mockReturnValue('true'),
        title: '',
        textContent: ''
      };
      mockSidebarMenu.classList.toggle.mockReturnValue(false);
      
      sidebarFab.onClick({ type: 'click' });
      
      expect(sidebarFab.button.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(sidebarFab.button.title).toBe('Hide panel');
      expect(sidebarFab.button.textContent).toBe('→');
    });

    test('should save state after toggle', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      const saveStateSpy = jest.spyOn(sidebarFab, 'saveState');
      mockSidebarMenu.classList.toggle.mockReturnValue(true);
      
      sidebarFab.onClick({ type: 'click' });
      
      expect(saveStateSpy).toHaveBeenCalledWith('sidebarMinimized', 1);
    });

    test('should emit custom event after toggle', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      mockSidebarMenu.classList.toggle.mockReturnValue(true);
      
      sidebarFab.onClick({ type: 'click' });
      
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sidebar:toggled',
          detail: {
            isMinimized: true,
            fabId: 'sidebarToggle'
          }
        })
      );
    });
  });

  describe('restoreState', () => {
    test('should minimize sidebar when saved state is 1', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.loadState = jest.fn().mockReturnValue(1);
      const minimizeSpy = jest.spyOn(sidebarFab, 'minimizeSidebar');
      
      sidebarFab.restoreState();
      
      expect(minimizeSpy).toHaveBeenCalled();
    });

    test('should expand sidebar when saved state is 0', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.loadState = jest.fn().mockReturnValue(0);
      const expandSpy = jest.spyOn(sidebarFab, 'expandSidebar');
      
      sidebarFab.restoreState();
      
      expect(expandSpy).toHaveBeenCalled();
    });

    test('should minimize on mobile when no saved state', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.loadState = jest.fn().mockReturnValue(null);
      window.innerWidth = 600; // Mobile width
      const minimizeSpy = jest.spyOn(sidebarFab, 'minimizeSidebar');
      
      sidebarFab.restoreState();
      
      expect(minimizeSpy).toHaveBeenCalled();
    });

    test('should expand on desktop when no saved state', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.loadState = jest.fn().mockReturnValue(null);
      window.innerWidth = 1024; // Desktop width
      const expandSpy = jest.spyOn(sidebarFab, 'expandSidebar');
      
      sidebarFab.restoreState();
      
      expect(expandSpy).toHaveBeenCalled();
    });

    test('should handle missing sidebar menu gracefully', () => {
      sidebarFab.sidebarMenu = null;
      
      expect(() => sidebarFab.restoreState()).not.toThrow();
    });
  });

  describe('minimizeSidebar', () => {
    test('should minimize sidebar correctly', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.button = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn().mockReturnValue('false'),
        title: '',
        textContent: ''
      };
      
      sidebarFab.minimizeSidebar();
      
      expect(mockSidebarMenu.classList.add).toHaveBeenCalledWith('sidebar-minimized');
      expect(sidebarFab.isMinimized).toBe(true);
      expect(mockSidebarMenu.inert).toBe(true);
      expect(sidebarFab.button.setAttribute).toHaveBeenCalledWith('aria-expanded', 'false');
      expect(sidebarFab.button.title).toBe('Show panel');
      expect(sidebarFab.button.textContent).toBe('☰');
    });

    test('should handle inert attribute errors', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      mockSidebarMenu.inert = 'readonly'; // Simulate readonly property
      
      expect(() => sidebarFab.minimizeSidebar()).not.toThrow();
    });
  });

  describe('expandSidebar', () => {
    test('should expand sidebar correctly', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.button = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn().mockReturnValue('true'),
        title: '',
        textContent: ''
      };
      
      sidebarFab.expandSidebar();
      
      expect(mockSidebarMenu.classList.remove).toHaveBeenCalledWith('sidebar-minimized');
      expect(sidebarFab.isMinimized).toBe(false);
      expect(mockSidebarMenu.inert).toBe(false);
      expect(sidebarFab.button.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
      expect(sidebarFab.button.title).toBe('Hide panel');
      expect(sidebarFab.button.textContent).toBe('→');
    });
  });

  describe('setSidebarState', () => {
    test('should set sidebar to minimized state', () => {
      sidebarFab.isMinimized = false;
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.button = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn().mockReturnValue('false'),
        title: '',
        textContent: ''
      };
      const saveStateSpy = jest.spyOn(sidebarFab, 'saveState');
      
      sidebarFab.setSidebarState(true);
      
      expect(sidebarFab.isMinimized).toBe(true);
      expect(saveStateSpy).toHaveBeenCalledWith('sidebarMinimized', 1);
    });

    test('should set sidebar to expanded state', () => {
      sidebarFab.isMinimized = true;
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.button = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn().mockReturnValue('true'),
        title: '',
        textContent: ''
      };
      const saveStateSpy = jest.spyOn(sidebarFab, 'saveState');
      
      sidebarFab.setSidebarState(false);
      
      expect(sidebarFab.isMinimized).toBe(false);
      expect(saveStateSpy).toHaveBeenCalledWith('sidebarMinimized', 0);
    });

    test('should not change state if already in requested state', () => {
      sidebarFab.isMinimized = true;
      const saveStateSpy = jest.spyOn(sidebarFab, 'saveState');
      
      sidebarFab.setSidebarState(true);
      
      expect(saveStateSpy).not.toHaveBeenCalled();
    });
  });

  describe('isSidebarMinimized', () => {
    test('should return current minimized state', () => {
      sidebarFab.isMinimized = true;
      expect(sidebarFab.isSidebarMinimized()).toBe(true);
      
      sidebarFab.isMinimized = false;
      expect(sidebarFab.isSidebarMinimized()).toBe(false);
    });
  });

  describe('getState', () => {
    test('should return current state with type information', () => {
      sidebarFab.isMinimized = true;
      sidebarFab.sidebarMenu = mockSidebarMenu;
      
      const state = sidebarFab.getState();
      
      expect(state.type).toBe('SidebarToggleFAB');
      expect(state.isMinimized).toBe(true);
      expect(state.sidebarExists).toBe(true);
    });
  });

  describe('destroy', () => {
    test('should clean up properly', () => {
      sidebarFab.sidebarMenu = mockSidebarMenu;
      sidebarFab.isMinimized = true;
      
      sidebarFab.destroy();
      
      expect(sidebarFab.sidebarMenu).toBeNull();
      expect(sidebarFab.isMinimized).toBe(false);
    });
  });
});
